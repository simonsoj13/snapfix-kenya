import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { analyzeRepairImage } from "./ai";
import { sendPasswordResetCode } from "./email";
import { uploadImage } from "./cloudinary";
import { insertJobRequestSchema, insertUserSchema, loginSchema, adminLoginSchema } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Quote generation using configurable pricing ────────────────────────────
async function generateQuoteRange(category: string, area: string, description: string) {
  const configs = await storage.getPricingConfig();
  const config = configs.find((c) => c.category === category) ?? configs.find((c) => c.category === "General");
  if (!config) throw new Error("No pricing config found");

  const areaMultipliers: Record<string, number> = {
    bathroom: 1.3,
    kitchen: 1.25,
    "sitting-room": 1.1,
    bedroom: 1.0,
    compound: 1.15,
  };
  const areaMulti = areaMultipliers[area] ?? 1.0;
  const complexityBonus = description.length > 100 ? 0.2 : description.length > 50 ? 0.1 : 0;

  const minBase = Math.round((config.baseMin * areaMulti) / 100) * 100;
  const maxBase = Math.round((config.baseMax * areaMulti * (1 + complexityBonus)) / 100) * 100;
  const midpoint = Math.round(((minBase + maxBase) / 2) / 100) * 100;
  const deposit = Math.round(midpoint * config.depositPercent / 100) * 100;

  const minMaterials = Math.round(minBase * 0.3 / 100) * 100;
  const maxMaterials = Math.round(maxBase * 0.35 / 100) * 100;

  return {
    min: minBase + minMaterials,
    max: maxBase + maxMaterials,
    midpoint,
    deposit,
    depositPercent: Math.round(config.depositPercent * 100),
    breakdown: `Labour: KES ${minBase.toLocaleString()}–${maxBase.toLocaleString()} | Materials: KES ${minMaterials.toLocaleString()}–${maxMaterials.toLocaleString()}`,
    category,
    area,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {

  // ── Auth ──────────────────────────────────────────────────────────────────

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      if (data.role === "admin") return res.status(403).json({ error: "Cannot register as admin" });
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) return res.status(409).json({ error: "Email already registered" });
      const existingPhone = await storage.getUserByPhone(data.phone);
      if (existingPhone) return res.status(409).json({ error: "Phone number already registered" });
      const user = await storage.createUser(data);
      const { password: _, ...safe } = user;
      res.json(safe);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { credential, password } = loginSchema.parse(req.body);
      const isPhone = credential.startsWith("+") || /^\d{10,}$/.test(credential);
      const user = isPhone
        ? await storage.getUserByPhone(credential)
        : await storage.getUserByEmail(credential);
      if (!user || user.password !== password) return res.status(401).json({ error: "Invalid credentials" });
      if (user.role === "admin") return res.status(403).json({ error: "Please use the admin portal to sign in" });
      const { password: _, ...safe } = user;
      res.json(safe);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Login failed" });
    }
  });

  // Forgot password — sends code via email when RESEND_API_KEY is set, otherwise returns code in response
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "Email or phone required" });
    const isPhone = credential.startsWith("+") || /^\d{10,}$/.test(credential);
    const user = isPhone
      ? await storage.getUserByPhone(credential)
      : await storage.getUserByEmail(credential);
    // Always return success (don't reveal if user exists)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    let emailSent = false;
    if (user) {
      (storage as any)._resetCodes = (storage as any)._resetCodes || {};
      (storage as any)._resetCodes[user.id] = code;
      // Try to send email if RESEND_API_KEY is configured and credential is an email
      if (!isPhone && process.env.RESEND_API_KEY) {
        try {
          await sendPasswordResetCode(user.email, code);
          emailSent = true;
        } catch(e) {
          console.error("Email send error:", e);
        }
      }
    }
    // Return devCode when email isn't configured so users can still reset
    const hasEmailService = !!process.env.RESEND_API_KEY;
    res.json({
      success: true,
      message: emailSent
        ? "A reset code has been sent to your email."
        : "A reset code has been generated.",
      // Show code in response when email isn't configured (or for phone-based reset)
      ...((!hasEmailService || isPhone) && user ? { devCode: code } : {}),
    });
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { credential, code, newPassword } = req.body;
    if (!credential || !code || !newPassword) return res.status(400).json({ error: "All fields required" });
    const isPhone = credential.startsWith("+") || /^\d{10,}$/.test(credential);
    const user = isPhone
      ? await storage.getUserByPhone(credential)
      : await storage.getUserByEmail(credential);
    if (!user) return res.status(404).json({ error: "Account not found" });
    const storedCode = (storage as any)._resetCodes?.[user.id];
    if (!storedCode || storedCode !== code) return res.status(400).json({ error: "Invalid or expired code" });
    await storage.updateUserPassword(user.id, newPassword);
    delete (storage as any)._resetCodes[user.id];
    res.json({ success: true });
  });

  // Admin-only login endpoint (separate, secured)
  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const { email, password } = adminLoginSchema.parse(req.body);
      const adminEmail = process.env.ADMIN_EMAIL || "admin@snapfix.ke";
      const adminPassword = process.env.ADMIN_PASSWORD || "Admin@2024";
      // Check against env-var credentials (works in any environment, memory-independent)
      if (email.toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
        return res.status(401).json({ error: "Invalid admin credentials" });
      }
      // Build a safe admin user object from env vars + storage fallback
      const storedUser = await storage.getUserByEmail(email);
      const adminUser = storedUser ?? {
        id: "admin",
        name: "Snap-Fix Admin",
        email: adminEmail,
        phone: "+254700000000",
        role: "admin",
        idDocUrl: null,
        workSampleUrls: null,
        walletBalance: 0,
        idVerified: 1,
      };
      const { password: _, ...safe } = adminUser as any;
      res.json(safe);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Admin login failed" });
    }
  });

  // ── AI Image Analysis ─────────────────────────────────────────────────────

  app.post("/api/analyze-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No image file provided" });
      const imageBase64 = req.file.buffer.toString("base64");
      const analysis = await analyzeRepairImage(imageBase64);
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to analyze image" });
    }
  });

  // ── AI Quotation ──────────────────────────────────────────────────────────

  app.post("/api/quote", async (req, res) => {
    const { category = "General", area = "bedroom", description = "" } = req.body;
    await new Promise((r) => setTimeout(r, 900));
    try {
      const result = await generateQuoteRange(category, area, description);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Workers ───────────────────────────────────────────────────────────────

  app.get("/api/workers", async (_req, res) => {
    res.json(await storage.getAllWorkers());
  });

  app.get("/api/workers/search", async (req, res) => {
    const filters = {
      specialty: req.query.specialty as string | undefined,
      maxDistance: req.query.maxDistance ? parseFloat(req.query.maxDistance as string) : undefined,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      availableNow: req.query.availableNow === "true",
      verified: req.query.verified === "true",
    };
    res.json(await storage.searchWorkers(filters));
  });

  app.get("/api/workers/:id", async (req, res) => {
    const worker = await storage.getWorker(req.params.id);
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    res.json(worker);
  });

  // ── Job Requests ──────────────────────────────────────────────────────────

  app.post("/api/job-requests", async (req, res) => {
    try {
      let data = insertJobRequestSchema.parse(req.body);
      // Upload image to Cloudinary if base64
      if (data.imageUrl && data.imageUrl.startsWith('data:')) {
        data = { ...data, imageUrl: await uploadImage(data.imageUrl, 'job-photos') };
      }
      res.json(await storage.createJobRequest(data));
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create request" });
    }
  });

  app.get("/api/job-requests/user/:userId", async (req, res) => {
    res.json(await storage.getJobRequestsByUser(req.params.userId));
  });

  app.get("/api/job-requests/worker/:workerId", async (req, res) => {
    // First try direct worker ID match
    let jobs = await storage.getJobRequestsByWorker(req.params.workerId);
    // If no jobs, find the worker by user ID and try their worker ID
    if (jobs.length === 0) {
      const user = await storage.getUserById(req.params.workerId);
      if (user) {
        const workers = await storage.getAllWorkers();
        const worker = workers.find(w => w.email === user.email);
        if (worker) {
          jobs = await storage.getJobRequestsByWorker(worker.id);
        }
      }
    }
    res.json(jobs);
  });

  app.patch("/api/job-requests/:id/status", async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });
    const updated = await storage.updateJobRequestStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: "Job request not found" });
    res.json(updated);
  });

  app.patch("/api/job-requests/:id", async (req, res) => {
    const updated = await storage.updateJobRequest(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Job request not found" });
    res.json(updated);
  });

  // ── Reviews ───────────────────────────────────────────────────────────────

  app.get("/api/reviews", async (_req, res) => {
    res.json(await storage.getAllReviews());
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const review = await storage.createReview(req.body);
      res.json(review);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ── Pricing Config ────────────────────────────────────────────────────────

  app.get("/api/pricing", async (_req, res) => {
    res.json(await storage.getPricingConfig());
  });

  app.patch("/api/pricing/:category", async (req, res) => {
    const updated = await storage.updatePricingConfig(req.params.category, req.body);
    if (!updated) return res.status(404).json({ error: "Category not found" });
    res.json(updated);
  });

  // ── Transactions ──────────────────────────────────────────────────────────

  app.post("/api/transactions/pending", async (req, res) => {
    try {
      const tx = await storage.createTransaction({
        ...req.body,
        status: "pending",
      });
      res.json(tx);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/admin/transactions", async (_req, res) => {
    const txs = await storage.getAllTransactions();
    res.json(txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.post("/api/admin/transactions/:id/reverse", async (req, res) => {
    const tx = await storage.reverseTransaction(req.params.id);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    res.json(tx);
  });

  app.post("/api/admin/transactions/:id/approve", async (req, res) => {
    const tx = await storage.getTransactionById(req.params.id);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    const updated = await storage.updateTransactionStatus(req.params.id, "completed");

    // Cascade: update the linked job request so customer + fundi can see progress
    if (tx.jobId) {
      if (tx.type === "deposit") {
        await storage.updateJobRequest(tx.jobId, {
          status: "deposit-paid",
          workerContactShown: 1,
        });
      } else if (tx.type === "balance") {
        await storage.updateJobRequest(tx.jobId, { status: "completed" });
      }
    }
    res.json(updated);
  });

  app.get("/api/transactions/job/:jobId", async (req, res) => {
    const txs = await storage.getTransactionsByJob(req.params.jobId);
    res.json(txs);
  });

  app.get("/api/transactions/worker/:workerId", async (req, res) => {
    const txs = await storage.getTransactionsByWorker(req.params.workerId);
    res.json(txs);
  });

  app.get("/api/transactions/user/:userId", async (req, res) => {
    const txs = await storage.getTransactionsByUser(req.params.userId);
    res.json(txs);
  });

  app.get("/api/admin/company-balance", async (_req, res) => {
    const txs = await storage.getAllTransactions();
    const balance = txs
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + (t.type === "reversed" ? -t.amount : t.amount), 0);
    res.json({ balance });
  });

  // ── Support Tickets ───────────────────────────────────────────────────────

  app.get("/api/support", async (req, res) => {
    const userId = req.query.userId as string | undefined;
    if (userId) return res.json(await storage.getSupportTicketsByUser(userId));
    res.json(await storage.getAllSupportTickets());
  });

  app.post("/api/support", async (req, res) => {
    try {
      const ticket = await storage.createSupportTicket(req.body);
      res.json(ticket);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/support/:id", async (req, res) => {
    const updated = await storage.updateSupportTicket(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Ticket not found" });
    res.json(updated);
  });

  // ── Admin ─────────────────────────────────────────────────────────────────

  app.get("/api/admin/users", async (_req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.get("/api/admin/stats", async (_req, res) => {
    const workers = await storage.getAllWorkers();
    const requests = await storage.getAllJobRequests();
    const transactions = await storage.getAllTransactions();
    const avgRating = workers.reduce((s, w) => s + w.rating, 0) / (workers.length || 1);
    const completedRequests = requests.filter((r) => r.status === "completed").length;
    const totalRevenue = transactions.filter((t) => t.status === "completed").reduce((s, t) => s + t.amount, 0);
    res.json({
      totalWorkers: workers.length,
      activeWorkers: workers.filter((w) => w.availableNow === 1).length,
      totalRequests: requests.length,
      pendingRequests: requests.filter((r) => r.status === "pending").length,
      completedRequests,
      inProgressRequests: requests.filter((r) => r.status === "in-progress").length,
      cancelledRequests: requests.filter((r) => r.status === "cancelled").length,
      avgRating: parseFloat(avgRating.toFixed(2)),
      totalRevenue,
      totalUsers: (await storage.getAllUsers()).length,
    });
  });

  app.get("/api/admin/requests-trend", async (_req, res) => {
    const allRequests = await storage.getAllJobRequests();
    const allTransactions = await storage.getAllTransactions();
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split("T")[0];
      const dayRequests = allRequests.filter(r => r.createdAt && r.createdAt.toString().startsWith(dateStr));
      const dayCompleted = dayRequests.filter(r => r.status === "completed");
      const dayRevenue = allTransactions
        .filter(t => t.status === "completed" && t.createdAt && t.createdAt.toString().startsWith(dateStr))
        .reduce((s, t) => s + t.amount, 0);
      result.push({ day: dayName, requests: dayRequests.length, completed: dayCompleted.length, revenue: dayRevenue });
    }
    res.json(result);
  });

  app.get("/api/admin/category-breakdown", async (_req, res) => {
    const requests = await storage.getAllJobRequests();
    const counts: Record<string, number> = {};
    requests.forEach((r) => { 
      const cat = r.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1; 
    });
    res.json(Object.entries(counts).map(([name, value]) => ({ name, value })));
  });

  app.get("/api/admin/requests", async (_req, res) => {
    res.json(await storage.getAllJobRequests());
  });

  app.get("/api/admin/workers", async (_req, res) => {
    res.json(await storage.getAllWorkers());
  });

  app.patch("/api/admin/workers/:id/toggle-availability", async (req, res) => {
    const worker = await storage.getWorker(req.params.id);
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    const updated = await storage.updateWorkerAvailability(req.params.id, worker.availableNow === 1 ? 0 : 1);
    res.json(updated);
  });

  app.patch("/api/admin/workers/:id/verify", async (req, res) => {
    const worker = await storage.getWorker(req.params.id);
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    const updated = await storage.updateWorkerAvailability(req.params.id, worker.availableNow);
    res.json(updated);
  });

  // ── Worker Verifications ───────────────────────────────────────────────────

  // Worker submits verification documents
  app.post("/api/workers/verify-docs", async (req, res) => {
    try {
      const { userId, workerName, email, phone, idFront, idBack, workSamples, specialty, bio, yearsExperience } = req.body;
      if (!userId) return res.status(400).json({ error: "userId required" });
      
      // Upload images to Cloudinary if they are base64
      let idFrontUrl = idFront ?? null;
      let idBackUrl = idBack ?? null;
      let workSampleUrls = workSamples ?? [];
      
      if (idFront && idFront.startsWith('data:')) {
        idFrontUrl = await uploadImage(idFront, 'id-docs');
      }
      if (idBack && idBack.startsWith('data:')) {
        idBackUrl = await uploadImage(idBack, 'id-docs');
      }
      if (workSamples && workSamples.length > 0) {
        workSampleUrls = await Promise.all(
          workSamples.map((s: string) => s.startsWith('data:') ? uploadImage(s, 'work-samples') : s)
        );
      }
      
      const doc = await storage.upsertWorkerVerification(userId, {
        userId, workerName, email, phone,
        idFront: idFrontUrl,
        idBack: idBackUrl,
        workSamples: workSampleUrls,
        specialty: specialty ?? "General",
        bio: bio ?? "",
        yearsExperience: yearsExperience ?? 0,
        status: "pending",
        submittedAt: new Date().toISOString(),
      });
      res.json(doc);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Worker gets their own verification status
  app.get("/api/workers/verify-docs/:userId", async (req, res) => {
    const doc = await storage.getWorkerVerification(req.params.userId);
    res.json(doc ?? null);
  });

  // Customer/public: get a worker's work samples (by worker table ID)
  app.get("/api/workers/:workerId/work-samples", async (req, res) => {
    const worker = await storage.getWorker(req.params.workerId);
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    const verification = await storage.getWorkerVerificationByEmail(worker.email);
    if (!verification || verification.status !== "approved") {
      return res.json({ workSamples: [], workerName: worker.name });
    }
    res.json({ workSamples: verification.workSamples, workerName: worker.name });
  });

  // Fundi marks themselves as on the way with estimated arrival
  app.patch("/api/job-requests/:id/on-the-way", async (req, res) => {
    const { estimatedArrival } = req.body;
    const updated = await storage.updateJobRequest(req.params.id, {
      workerOnWay: 1,
      estimatedArrival: estimatedArrival ?? null,
    });
    if (!updated) return res.status(404).json({ error: "Job request not found" });
    res.json(updated);
  });

  // Admin gets all verifications
  app.get("/api/admin/verifications", async (_req, res) => {
    res.json(await storage.getAllWorkerVerifications());
  });

  // Admin approves or rejects a verification
  app.patch("/api/admin/verifications/:userId", async (req, res) => {
    const { status, reviewNote } = req.body;
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "status must be approved or rejected" });
    // Get existing verification first to preserve photos
    const existing = await storage.getWorkerVerification(req.params.userId);
    if (!existing) return res.status(404).json({ error: "Verification not found" });
    const updated = await storage.upsertWorkerVerification(req.params.userId, {
      ...existing,
      status, reviewNote, reviewedAt: new Date().toISOString(),
    });
    if (status === "approved") {
      const user = await storage.getUserById(req.params.userId);
      if (user) {
        await storage.createWorkerFromVerification(updated, user);
      }
    }
    res.json(updated);
  });


  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  });

  // Update user profile
  app.patch("/api/user/profile", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { name, email, phone, oldPassword, newPassword } = req.body;
    const user = await storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (newPassword) {
      if (user.password !== oldPassword) return res.status(400).json({ error: "Current password is incorrect" });
      await storage.updateUserPassword(userId, newPassword);
      return res.json({ success: true });
    }
    const updates: any = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    const updated = await storage.updateUserProfile(userId, updates);
    res.json(updated);
  });


  // Fundi accepts a job
  app.patch("/api/job-requests/:id/accept", async (req, res) => {
    const job = await storage.updateJobRequest(req.params.id, { status: "in-progress" });
    res.json(job);
  });

  // Fundi declines a job
  app.patch("/api/job-requests/:id/decline", async (req, res) => {
    const job = await storage.updateJobRequest(req.params.id, { status: "cancelled", workerId: null });
    res.json(job);
  });

  // Customer confirms fundi arrived
  app.patch("/api/job-requests/:id/arrived", async (req, res) => {
    const job = await storage.updateJobRequest(req.params.id, { status: "fundi-arrived" });
    res.json(job);
  });

  // Customer confirms work complete
  app.patch("/api/job-requests/:id/complete", async (req, res) => {
    const job = await storage.updateJobRequest(req.params.id, { status: "balance-due" });
    res.json(job);
  });

  // Fundi toggle online/offline
  app.patch("/api/workers/:id/availability", async (req, res) => {
    const { availableNow } = req.body;
    const worker = await storage.updateWorkerAvailability(req.params.id, availableNow);
    res.json(worker);
  });

  const httpServer = createServer(app);

  return httpServer;
}
