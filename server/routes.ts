import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { analyzeRepairImage } from "./ai";
import { insertJobRequestSchema, insertUserSchema, loginSchema } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Fake AI Quotation helper ──────────────────────────────────────────────────
function generateQuote(category: string, area: string, description: string): { quoted: number; deposit: number; breakdown: string } {
  const baseRates: Record<string, number> = {
    Plumbing: 3500,
    Electrical: 4200,
    Welding: 3800,
    Carpentry: 3000,
    HVAC: 5000,
    Appliance: 2500,
    General: 3000,
  };

  const areaMultipliers: Record<string, number> = {
    bathroom: 1.3,
    kitchen: 1.25,
    "sitting-room": 1.1,
    bedroom: 1.0,
    compound: 1.15,
  };

  const base = baseRates[category] ?? 3000;
  const areaMulti = areaMultipliers[area] ?? 1.0;
  const complexityBonus = description.length > 100 ? 800 : description.length > 50 ? 400 : 0;
  const labour = Math.round((base * areaMulti + complexityBonus) / 100) * 100;
  const materials = Math.round(labour * 0.35 / 100) * 100;
  const quoted = labour + materials;
  const deposit = Math.round(quoted * 0.3 / 100) * 100;

  return {
    quoted,
    deposit,
    breakdown: `Labour: KES ${labour.toLocaleString()} | Materials (est.): KES ${materials.toLocaleString()}`,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {

  // ── Auth ─────────────────────────────────────────────────────────────────────

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
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

      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const { password: _, ...safe } = user;
      res.json(safe);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Login failed" });
    }
  });

  // ── AI Image Analysis ─────────────────────────────────────────────────────────

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

  // ── AI Quotation ──────────────────────────────────────────────────────────────

  app.post("/api/quote", async (req, res) => {
    const { category = "General", area = "bedroom", description = "" } = req.body;
    await new Promise((r) => setTimeout(r, 900)); // simulate AI thinking
    const result = generateQuote(category, area, description);
    res.json(result);
  });

  // ── Workers ───────────────────────────────────────────────────────────────────

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

  // ── Job Requests ──────────────────────────────────────────────────────────────

  app.post("/api/job-requests", async (req, res) => {
    try {
      const data = insertJobRequestSchema.parse(req.body);
      res.json(await storage.createJobRequest(data));
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create request" });
    }
  });

  app.get("/api/job-requests/user/:userId", async (req, res) => {
    res.json(await storage.getJobRequestsByUser(req.params.userId));
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

  // ── Admin ─────────────────────────────────────────────────────────────────────

  app.get("/api/admin/stats", async (_req, res) => {
    const workers = await storage.getAllWorkers();
    const requests = await storage.getAllJobRequests();
    const avgRating = workers.reduce((s, w) => s + w.rating, 0) / (workers.length || 1);
    const avgRate = workers.reduce((s, w) => s + w.hourlyRate, 0) / (workers.length || 1);
    const completedRequests = requests.filter((r) => r.status === "completed").length;
    res.json({
      totalWorkers: workers.length,
      activeWorkers: workers.filter((w) => w.availableNow === 1).length,
      totalRequests: requests.length,
      pendingRequests: requests.filter((r) => r.status === "pending").length,
      completedRequests,
      inProgressRequests: requests.filter((r) => r.status === "in-progress").length,
      cancelledRequests: requests.filter((r) => r.status === "cancelled").length,
      avgRating: parseFloat(avgRating.toFixed(2)),
      totalRevenue: parseFloat((completedRequests * avgRate * 2).toFixed(2)),
      totalUsers: 42,
    });
  });

  app.get("/api/admin/requests-trend", async (_req, res) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    res.json(days.map((day) => ({
      day,
      requests: Math.floor(Math.random() * 30) + 10,
      completed: Math.floor(Math.random() * 20) + 5,
      revenue: Math.floor(Math.random() * 2000) + 500,
    })));
  });

  app.get("/api/admin/category-breakdown", async (_req, res) => {
    const workers = await storage.getAllWorkers();
    const counts: Record<string, number> = {};
    workers.forEach((w) => { counts[w.specialty] = (counts[w.specialty] || 0) + 1; });
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

  const httpServer = createServer(app);
  return httpServer;
}
