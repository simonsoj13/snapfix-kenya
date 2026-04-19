import { DatabaseStorage } from "./db-storage";
import {
  type User, type InsertUser,
  type Worker, type InsertWorker,
  type JobRequest, type InsertJobRequest,
  type Review, type Transaction, type SupportTicket, type PricingConfig,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface WorkerVerification {
  userId: string;
  workerName: string;
  email: string;
  phone: string;
  idFront: string | null;
  idBack: string | null;
  workSamples: string[];
  status: "pending" | "approved" | "rejected";
  specialty?: string;
  bio?: string;
  yearsExperience?: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface IStorage {
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWallet(id: string, amount: number): Promise<User | undefined>;
  updateUserPassword(id: string, newPassword: string): Promise<User | undefined>;
  updateUserProfile(id: string, updates: Partial<User>): Promise<User | undefined>;

  getWorkerVerification(userId: string): Promise<WorkerVerification | undefined>;
  getWorkerVerificationByEmail(email: string): Promise<WorkerVerification | undefined>;
  getAllWorkerVerifications(): Promise<WorkerVerification[]>;
  upsertWorkerVerification(userId: string, data: Partial<WorkerVerification>): Promise<WorkerVerification>;

  getWorker(id: string): Promise<Worker | undefined>;
  getAllUsers(): Promise<User[]>;
  getAllWorkers(): Promise<Worker[]>;
  updateWorkerAvailability(id: string, availableNow: number): Promise<Worker | undefined>;
  updateWorkerRating(id: string, rating: number, reviewCount: number): Promise<Worker | undefined>;
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
  createWorkerFromVerification(verification: WorkerVerification, user: any): Promise<any>;
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
  private workerVerifications: Map<string, WorkerVerification> = new Map();
  private seededWorkerIds: string[] = [];
  _resetCodes: Record<string, string> = {};

  constructor() {
    this.seedAdmin();
    this.seedWorkers();
    this.seedReviews();
    this.seedTransactions();
    this.seedSupportTickets();
    this.seedPricingConfig();
    this.seedDemoCustomer();
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
      this.seededWorkerIds.push(id);
      // Create a linked user account for each seeded worker so they can log in
      const userId = randomUUID();
      this.users.set(userId, {
        id: userId,
        name: w.name,
        email: w.email,
        phone: w.phone,
        password: "Fundi@2024",
        role: "worker",
        idDocUrl: null,
        workSampleUrls: null,
        walletBalance: Math.floor(Math.random() * 8000) + 2000,
        idVerified: 1,
      });
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

    reviewData.forEach(({ reviews: rList }) => {
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

  private seedDemoCustomer() {
    // ── Demo customer account ─────────────────────────────────────────────
    const customerId = randomUUID();
    this.users.set(customerId, {
      id: customerId,
      name: "Jane Mwende",
      email: "demo@snapfix.ke",
      phone: "+254711000099",
      password: "Demo@2024",
      role: "customer",
      idDocUrl: null,
      workSampleUrls: null,
      walletBalance: 0,
      idVerified: 0,
    });

    // Use first two seeded workers (John Mwangi - Plumbing, Sarah Achieng - Electrical)
    const plumberId  = this.seededWorkerIds[0] ?? null;
    const electricId = this.seededWorkerIds[1] ?? null;
    const carpenterId = this.seededWorkerIds[3] ?? null;

    const base = {
      userId: customerId,
      imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200",
      location: "Lavington, Nairobi",
      area: "lavington",
      preferredDate: "2026-04-05",
      isNow: 0,
      workerContactShown: 1,
    };

    // Job 1 — deposit paid, fundi assigned, on the way ─────────────────────
    const job1Id = randomUUID();
    this.jobRequests.set(job1Id, {
      id: job1Id,
      ...base,
      workerId: plumberId,
      category: "Plumbing",
      description: "Kitchen sink is leaking under the cabinet. Water pooling on the floor. Need urgent fix.",
      status: "deposit-paid",
      budget: 5000,
      quotedMin: 4000,
      quotedMax: 6000,
      quotedAmount: 5000,
      depositAmount: 1500,
      workerOnWay: 1,
      estimatedArrival: "20 minutes",
    });

    // Job 2 — fundi has arrived, work in progress ─────────────────────────
    const job2Id = randomUUID();
    this.jobRequests.set(job2Id, {
      id: job2Id,
      ...base,
      workerId: electricId,
      category: "Electrical",
      description: "Circuit breaker keeps tripping when using the microwave. Suspect wiring issue in the kitchen.",
      status: "fundi-arrived",
      budget: 7000,
      quotedMin: 5500,
      quotedMax: 8500,
      quotedAmount: 7000,
      depositAmount: 2100,
      workerOnWay: 1,
      estimatedArrival: null,
    });

    // Job 3 — job complete, balance payment due ───────────────────────────
    const job3Id = randomUUID();
    this.jobRequests.set(job3Id, {
      id: job3Id,
      ...base,
      workerId: carpenterId,
      category: "Carpentry",
      description: "Two bedroom doors not closing properly. Hinges loose and frame slightly warped.",
      status: "balance-due",
      budget: 4000,
      quotedMin: 3000,
      quotedMax: 5000,
      quotedAmount: 4000,
      depositAmount: 1200,
      workerOnWay: 0,
      estimatedArrival: null,
    });
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
      role: insertUser.role ?? "customer",
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

  // ── Worker Verifications ────────────────────────────────────────────────────
  async getWorkerVerification(userId: string) {
    return this.workerVerifications.get(userId);
  }

  async getWorkerVerificationByEmail(email: string) {
    return Array.from(this.workerVerifications.values()).find(
      (v) => v.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getAllWorkerVerifications() {
    return Array.from(this.workerVerifications.values());
  }

  async upsertWorkerVerification(userId: string, data: Partial<WorkerVerification>): Promise<WorkerVerification> {
    const existing = this.workerVerifications.get(userId) ?? {
      userId,
      workerName: "",
      email: "",
      phone: "",
      idFront: null,
      idBack: null,
      workSamples: [],
      status: "pending" as const,
      submittedAt: new Date().toISOString(),
    };
    const updated: WorkerVerification = { ...existing, ...data, submittedAt: data.submittedAt ?? existing.submittedAt };
    this.workerVerifications.set(userId, updated);
    return updated;
  }

  // ── Workers ────────────────────────────────────────────────────────────────
  async getWorker(id: string) { return this.workers.get(id); }
  async getAllUsers() { return Array.from(this.users.values()); }
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
      workerOnWay: (req as any).workerOnWay ?? 0,
      estimatedArrival: (req as any).estimatedArrival ?? null,
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

  async getTransactionById(id: string) {
    return this.transactions.get(id) ?? null;
  }

  async updateTransactionStatus(id: string, status: string) {
    const tx = this.transactions.get(id);
    if (!tx) return null;
    const updated = { ...tx, status };
    this.transactions.set(id, updated);
    return updated;
  }

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

  async createWorkerFromVerification(verification: WorkerVerification, user: any) { return null; }

  async updateWorkerRating(id: string, rating: number, reviewCount: number) { return undefined; }

  async updateUserProfile(id: string, updates: any) {
    const u = this.users.get(id);
    if (!u) return undefined;
    const updated = { ...u, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async updatePricingConfig(category: string, config: Partial<PricingConfig>): Promise<PricingConfig | undefined> {
    const current = this.pricingConfig.get(category);
    if (!current) return undefined;
    const updated = { ...current, ...config };
    this.pricingConfig.set(category, updated);
    return updated;
  }
}



export const storage = new DatabaseStorage();