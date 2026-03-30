import {
  type User, type InsertUser,
  type Worker, type InsertWorker,
  type JobRequest, type InsertJobRequest,
  type Review, type Transaction, type SupportTicket, type PricingConfig,
  type WorkerVerification,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWallet(id: string, amount: number): Promise<User | undefined>;
  updateUserPassword(id: string, newPassword: string): Promise<User | undefined>;
  updateUserDocuments(id: string, docs: { idFrontUrl?: string; idBackUrl?: string; workSampleUrls?: string }): Promise<User | undefined>;
  getAllVerifications(): Promise<WorkerVerification[]>;
  updateVerificationStatus(userId: string, status: "approved" | "rejected", adminNote?: string): Promise<WorkerVerification | undefined>;

  getWorker(id: string): Promise<Worker | undefined>;
  getAllWorkers(): Promise<Worker[]>;
  updateWorkerAvailability(id: string, availableNow: number): Promise<Worker | undefined>;
  searchWorkers(filters: {
    specialty?: string;
    maxDistance?: number;
    minRating?: number;
    availableNow?: boolean;
    verified?: boolean;
  }): Promise<Worker[]>;

  getJobRequest(id: string): Promise<JobRequest | undefined>;
  getAllJobRequests(): Promise<JobRequest[]>;
  getJobRequestsByUser(userId: string): Promise<JobRequest[]>;
  getJobRequestsByWorker(workerId: string): Promise<JobRequest[]>;
  createJobRequest(request: InsertJobRequest): Promise<JobRequest>;
  updateJobRequestStatus(id: string, status: string): Promise<JobRequest | undefined>;
  updateJobRequest(id: string, updates: Partial<JobRequest>): Promise<JobRequest | undefined>;

  getAllReviews(): Promise<Review[]>;
  getReviewsByWorker(workerId: string): Promise<Review[]>;
  createReview(review: Omit<Review, "id" | "createdAt">): Promise<Review>;

  getAllTransactions(): Promise<Transaction[]>;
  getTransactionsByUser(userId: string): Promise<Transaction[]>;
  createTransaction(tx: Omit<Transaction, "id" | "createdAt">): Promise<Transaction>;
  reverseTransaction(id: string): Promise<Transaction | undefined>;

  getAllSupportTickets(): Promise<SupportTicket[]>;
  getSupportTicketsByUser(userId: string): Promise<SupportTicket[]>;
  createSupportTicket(ticket: Omit<SupportTicket, "id" | "createdAt">): Promise<SupportTicket>;
  updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined>;

  getPricingConfig(): Promise<PricingConfig[]>;
  updatePricingConfig(category: string, config: Partial<PricingConfig>): Promise<PricingConfig | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private workers: Map<string, Worker> = new Map();
  private jobRequests: Map<string, JobRequest> = new Map();
  private reviews: Map<string, Review> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private supportTickets: Map<string, SupportTicket> = new Map();
  private pricingConfig: Map<string, PricingConfig> = new Map();
  private verifications: Map<string, WorkerVerification> = new Map();

  constructor() {
    this.seedAdmin();
    this.seedWorkers();
    this.seedReviews();
    this.seedTransactions();
    this.seedSupportTickets();
    this.seedPricingConfig();
  }

  private seedAdmin() {
    const id = randomUUID();
    this.users.set(id, {
      id,
      name: "Snap-Fix Admin",
      email: "admin@snapfix.ke",
      phone: "+254700000000",
      password: "Admin@2024",
      role: "admin",
      idDocUrl: null,
      workSampleUrls: null,
      walletBalance: 0,
      idVerified: 1,
    });
  }

  private seedWorkers() {
    const mockWorkers = [
      { name: "John Mwangi", specialty: "Plumbing", hourlyRate: 1200, rating: 4.9, reviewCount: 127, distance: 2.3, location: "Nairobi CBD", bio: "Master plumber with 15 years of experience.", yearsExperience: 15, jobsCompleted: 450, responseTime: "< 30 min", verified: 1, profileImage: "", availableNow: 1, phone: "+254712345001", email: "john.m@snapfix.ke" },
      { name: "Sarah Achieng", specialty: "Electrical", hourlyRate: 1500, rating: 4.8, reviewCount: 94, distance: 3.1, location: "Westlands", bio: "Licensed electrician specialising in residential work.", yearsExperience: 12, jobsCompleted: 380, responseTime: "< 1 hour", verified: 1, profileImage: "", availableNow: 0, phone: "+254712345002", email: "sarah.a@snapfix.ke" },
      { name: "Mike Otieno", specialty: "Welding", hourlyRate: 1100, rating: 4.7, reviewCount: 86, distance: 4.5, location: "Industrial Area", bio: "Certified welder with expertise in structural work.", yearsExperience: 10, jobsCompleted: 320, responseTime: "< 45 min", verified: 1, profileImage: "", availableNow: 1, phone: "+254712345003", email: "mike.o@snapfix.ke" },
      { name: "David Kamau", specialty: "Carpentry", hourlyRate: 1000, rating: 4.9, reviewCount: 112, distance: 1.8, location: "Karen", bio: "Master carpenter specialising in custom woodwork.", yearsExperience: 18, jobsCompleted: 520, responseTime: "< 20 min", verified: 1, profileImage: "", availableNow: 0, phone: "+254712345004", email: "david.k@snapfix.ke" },
      { name: "Grace Njeri", specialty: "HVAC", hourlyRate: 1800, rating: 4.8, reviewCount: 103, distance: 3.7, location: "Kilimani", bio: "HVAC technician with expertise in all systems.", yearsExperience: 14, jobsCompleted: 410, responseTime: "< 1 hour", verified: 1, profileImage: "", availableNow: 1, phone: "+254712345005", email: "grace.n@snapfix.ke" },
      { name: "Robert Odhiambo", specialty: "Appliance", hourlyRate: 900, rating: 4.7, reviewCount: 89, distance: 2.9, location: "Lavington", bio: "Appliance repair specialist for all major brands.", yearsExperience: 11, jobsCompleted: 370, responseTime: "< 45 min", verified: 1, profileImage: "", availableNow: 1, phone: "+254712345006", email: "robert.o@snapfix.ke" },
    ];
    mockWorkers.forEach((w) => {
      const id = randomUUID();
      this.workers.set(id, { ...w, id, verified: w.verified ?? 0, availableNow: w.availableNow ?? 0 });
    });
  }

  private seedReviews() {
    const reviewData = [
      { workerName: "John Mwangi", specialty: "Plumbing", reviews: [
        { customerName: "Alice Wanjiku", rating: 5, comment: "Fixed our burst pipe within 30 minutes. Professional and very clean work. Highly recommend!", jobCategory: "Plumbing" },
        { customerName: "James Kariuki", rating: 5, comment: "Excellent service! Came on time, identified the issue quickly and fixed it. Fair pricing.", jobCategory: "Plumbing" },
        { customerName: "Mary Njoku", rating: 4, comment: "Good job fixing the kitchen sink. Slight delay but quality work overall.", jobCategory: "Plumbing" },
      ]},
      { workerName: "Sarah Achieng", specialty: "Electrical", reviews: [
        { customerName: "Peter Omondi", rating: 5, comment: "Sarah rewired our whole apartment safely. Very knowledgeable and explains everything clearly.", jobCategory: "Electrical" },
        { customerName: "Fatuma Hassan", rating: 5, comment: "Fixed our power issues fast. Very professional woman fundi!", jobCategory: "Electrical" },
      ]},
      { workerName: "David Kamau", specialty: "Carpentry", reviews: [
        { customerName: "Grace Mutua", rating: 5, comment: "Built us custom kitchen cabinets. The craftsmanship is outstanding!", jobCategory: "Carpentry" },
        { customerName: "Tom Mbugua", rating: 4, comment: "Fixed all our broken doors. Good quality work at a reasonable price.", jobCategory: "Carpentry" },
      ]},
    ];

    reviewData.forEach(({ customerName: _, reviews: rList }) => {
      rList.forEach((r) => {
        const id = randomUUID();
        const wId = randomUUID();
        this.reviews.set(id, {
          id,
          userId: randomUUID(),
          workerId: wId,
          rating: r.rating,
          comment: r.comment,
          customerName: r.customerName,
          jobCategory: r.jobCategory,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600000).toISOString(),
        });
      });
    });
  }

  private seedTransactions() {
    const txData = [
      { customerName: "Alice Wanjiku", workerName: "John Mwangi", amount: 1500, category: "Plumbing", phone: "+254712000001", status: "completed" as const, type: "deposit" as const },
      { customerName: "James Kariuki", workerName: "Sarah Achieng", amount: 2100, category: "Electrical", phone: "+254712000002", status: "completed" as const, type: "deposit" as const },
      { customerName: "Mary Njoku", workerName: "David Kamau", amount: 900, category: "Carpentry", phone: "+254712000003", status: "completed" as const, type: "balance" as const },
      { customerName: "Peter Omondi", workerName: "Grace Njeri", amount: 1800, category: "HVAC", phone: "+254712000004", status: "completed" as const, type: "deposit" as const },
      { customerName: "Fatuma Hassan", workerName: "Robert Odhiambo", amount: 1200, category: "Appliance", phone: "+254712000005", status: "reversed" as const, type: "reversal" as const },
      { customerName: "Tom Mbugua", workerName: "Mike Otieno", amount: 3200, category: "Welding", phone: "+254712000006", status: "pending" as const, type: "balance" as const },
    ];
    txData.forEach((tx) => {
      const id = randomUUID();
      this.transactions.set(id, {
        id,
        userId: randomUUID(),
        workerId: randomUUID(),
        jobId: randomUUID(),
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        phone: tx.phone,
        mpesaRef: `MP${Math.floor(Math.random() * 9000000 + 1000000)}`,
        customerName: tx.customerName,
        workerName: tx.workerName,
        category: tx.category,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600000).toISOString(),
      });
    });
  }

  private seedSupportTickets() {
    const ticketData = [
      { userName: "Alice Wanjiku", userRole: "customer", subject: "Worker did not show up", message: "I booked a plumber for 2pm but he never came. My deposit was already paid.", status: "open" as const, priority: "high" as const },
      { userName: "John Mwangi", userRole: "worker", subject: "Payment not received in wallet", message: "Completed a job 3 days ago but payment still not in my wallet.", status: "in-progress" as const, priority: "high" as const },
      { userName: "Mary Njoku", userRole: "customer", subject: "Request refund for cancelled service", message: "I cancelled within 30 minutes but didn't get my deposit back.", status: "open" as const, priority: "medium" as const },
      { userName: "Peter Omondi", userRole: "customer", subject: "App not loading on my phone", message: "The app keeps crashing when I try to upload a photo. Using Samsung Galaxy.", status: "resolved" as const, priority: "low" as const, response: "Please update the app to the latest version. This issue was fixed in v1.2." },
      { userName: "Grace Njeri", userRole: "worker", subject: "My profile is not showing in search", message: "Customers cannot find me in the HVAC search. I am available but not showing.", status: "in-progress" as const, priority: "medium" as const },
    ];
    ticketData.forEach((t) => {
      const id = randomUUID();
      this.supportTickets.set(id, {
        id,
        userId: randomUUID(),
        userName: t.userName,
        userRole: t.userRole,
        subject: t.subject,
        message: t.message,
        status: t.status,
        priority: t.priority,
        createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 3600000).toISOString(),
        response: (t as any).response,
      });
    });
  }

  private seedPricingConfig() {
    const configs: PricingConfig[] = [
      { category: "Plumbing",   baseMin: 2500, baseMax: 6000, depositPercent: 0.3 },
      { category: "Electrical", baseMin: 3000, baseMax: 8000, depositPercent: 0.3 },
      { category: "Welding",    baseMin: 2800, baseMax: 7000, depositPercent: 0.3 },
      { category: "Carpentry",  baseMin: 2000, baseMax: 6500, depositPercent: 0.3 },
      { category: "HVAC",       baseMin: 4000, baseMax: 12000, depositPercent: 0.35 },
      { category: "Appliance",  baseMin: 1500, baseMax: 5000, depositPercent: 0.3 },
      { category: "Painting",   baseMin: 2500, baseMax: 7000, depositPercent: 0.3 },
      { category: "Emergency",  baseMin: 5000, baseMax: 15000, depositPercent: 0.4 },
      { category: "General",    baseMin: 2000, baseMax: 6000, depositPercent: 0.3 },
    ];
    configs.forEach((c) => this.pricingConfig.set(c.category, c));
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  async getUserById(id: string) { return this.users.get(id); }

  async getUserByEmail(email: string) {
    return Array.from(this.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  async getUserByPhone(phone: string) {
    return Array.from(this.users.values()).find((u) => u.phone === phone);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      idDocUrl: insertUser.idDocUrl ?? null,
      workSampleUrls: insertUser.workSampleUrls ?? null,
      walletBalance: 0,
      idVerified: 0,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserWallet(id: string, amount: number) {
    const u = this.users.get(id);
    if (!u) return undefined;
    const updated = { ...u, walletBalance: (u.walletBalance ?? 0) + amount };
    this.users.set(id, updated);
    return updated;
  }

  async updateUserPassword(id: string, newPassword: string) {
    const u = this.users.get(id);
    if (!u) return undefined;
    const updated = { ...u, password: newPassword };
    this.users.set(id, updated);
    return updated;
  }

  async updateUserDocuments(id: string, docs: { idFrontUrl?: string; idBackUrl?: string; workSampleUrls?: string }) {
    const u = this.users.get(id);
    if (!u) return undefined;
    const updated = {
      ...u,
      idDocUrl: docs.idFrontUrl ?? u.idDocUrl,
      workSampleUrls: docs.workSampleUrls ?? u.workSampleUrls,
    };
    this.users.set(id, updated);

    // Create/update verification record
    const existing = this.verifications.get(id);
    const verification: WorkerVerification = {
      userId: id,
      workerName: u.name,
      workerEmail: u.email,
      workerPhone: u.phone,
      idFrontUrl: docs.idFrontUrl ?? existing?.idFrontUrl ?? "",
      idBackUrl: docs.idBackUrl ?? existing?.idBackUrl ?? "",
      workSamples: docs.workSampleUrls ? docs.workSampleUrls.split(",").filter(Boolean) : existing?.workSamples ?? [],
      submittedAt: new Date().toISOString(),
      status: "pending",
    };
    this.verifications.set(id, verification);
    return updated;
  }

  async getAllVerifications() {
    return Array.from(this.verifications.values());
  }

  async updateVerificationStatus(userId: string, status: "approved" | "rejected", adminNote?: string) {
    const v = this.verifications.get(userId);
    if (!v) return undefined;
    const updated = { ...v, status, adminNote };
    this.verifications.set(userId, updated);
    // If approved, mark user as verified
    if (status === "approved") {
      const u = this.users.get(userId);
      if (u) this.users.set(userId, { ...u, idVerified: 1 });
    }
    return updated;
  }

  // ── Workers ────────────────────────────────────────────────────────────────
  async getWorker(id: string) { return this.workers.get(id); }
  async getAllWorkers() { return Array.from(this.workers.values()); }

  async updateWorkerAvailability(id: string, availableNow: number) {
    const w = this.workers.get(id);
    if (!w) return undefined;
    const updated = { ...w, availableNow };
    this.workers.set(id, updated);
    return updated;
  }

  async searchWorkers(filters: { specialty?: string; maxDistance?: number; minRating?: number; availableNow?: boolean; verified?: boolean }) {
    let list = Array.from(this.workers.values());
    if (filters.specialty) list = list.filter((w) => w.specialty.toLowerCase() === filters.specialty!.toLowerCase());
    if (filters.maxDistance !== undefined) list = list.filter((w) => w.distance <= filters.maxDistance!);
    if (filters.minRating !== undefined) list = list.filter((w) => w.rating >= filters.minRating!);
    if (filters.availableNow) list = list.filter((w) => w.availableNow === 1);
    if (filters.verified) list = list.filter((w) => w.verified === 1);
    return list;
  }

  // ── Job Requests ───────────────────────────────────────────────────────────
  async getJobRequest(id: string) { return this.jobRequests.get(id); }
  async getAllJobRequests() { return Array.from(this.jobRequests.values()); }

  async getJobRequestsByUser(userId: string) {
    return Array.from(this.jobRequests.values()).filter((r) => r.userId === userId);
  }

  async getJobRequestsByWorker(workerId: string) {
    return Array.from(this.jobRequests.values()).filter((r) => r.workerId === workerId);
  }

  async createJobRequest(req: InsertJobRequest): Promise<JobRequest> {
    const id = randomUUID();
    const full: JobRequest = {
      ...req,
      id,
      workerId: req.workerId ?? null,
      preferredDate: req.preferredDate ?? null,
      budget: req.budget ?? null,
      quotedMin: (req as any).quotedMin ?? null,
      quotedMax: (req as any).quotedMax ?? null,
      quotedAmount: req.quotedAmount ?? null,
      depositAmount: req.depositAmount ?? null,
      isNow: req.isNow ?? 0,
      area: req.area ?? "",
      workerContactShown: req.workerContactShown ?? 0,
    };
    this.jobRequests.set(id, full);
    return full;
  }

  async updateJobRequestStatus(id: string, status: string) {
    return this.updateJobRequest(id, { status });
  }

  async updateJobRequest(id: string, updates: Partial<JobRequest>) {
    const req = this.jobRequests.get(id);
    if (!req) return undefined;
    const updated = { ...req, ...updates };
    this.jobRequests.set(id, updated);
    return updated;
  }

  // ── Reviews ────────────────────────────────────────────────────────────────
  async getAllReviews() { return Array.from(this.reviews.values()); }

  async getReviewsByWorker(workerId: string) {
    return Array.from(this.reviews.values()).filter((r) => r.workerId === workerId);
  }

  async createReview(review: Omit<Review, "id" | "createdAt">): Promise<Review> {
    const id = randomUUID();
    const r: Review = { ...review, id, createdAt: new Date().toISOString() };
    this.reviews.set(id, r);
    return r;
  }

  // ── Transactions ───────────────────────────────────────────────────────────
  async getAllTransactions() { return Array.from(this.transactions.values()); }

  async getTransactionsByUser(userId: string) {
    return Array.from(this.transactions.values()).filter((t) => t.userId === userId);
  }

  async createTransaction(tx: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
    const id = randomUUID();
    const t: Transaction = { ...tx, id, createdAt: new Date().toISOString() };
    this.transactions.set(id, t);
    return t;
  }

  async reverseTransaction(id: string): Promise<Transaction | undefined> {
    const tx = this.transactions.get(id);
    if (!tx) return undefined;
    const reversed = { ...tx, status: "reversed" as const, type: "reversal" as const };
    this.transactions.set(id, reversed);
    return reversed;
  }

  // ── Support Tickets ────────────────────────────────────────────────────────
  async getAllSupportTickets() { return Array.from(this.supportTickets.values()); }

  async getSupportTicketsByUser(userId: string) {
    return Array.from(this.supportTickets.values()).filter((t) => t.userId === userId);
  }

  async createSupportTicket(ticket: Omit<SupportTicket, "id" | "createdAt">): Promise<SupportTicket> {
    const id = randomUUID();
    const t: SupportTicket = { ...ticket, id, createdAt: new Date().toISOString() };
    this.supportTickets.set(id, t);
    return t;
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    const ticket = this.supportTickets.get(id);
    if (!ticket) return undefined;
    const updated = { ...ticket, ...updates };
    this.supportTickets.set(id, updated);
    return updated;
  }

  // ── Pricing Config ─────────────────────────────────────────────────────────
  async getPricingConfig() { return Array.from(this.pricingConfig.values()); }

  async updatePricingConfig(category: string, config: Partial<PricingConfig>): Promise<PricingConfig | undefined> {
    const current = this.pricingConfig.get(category);
    if (!current) return undefined;
    const updated = { ...current, ...config };
    this.pricingConfig.set(category, updated);
    return updated;
  }
}

export const storage = new MemStorage();
