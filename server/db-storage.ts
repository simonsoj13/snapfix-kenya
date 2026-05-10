import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import pkg from "pg";
const { Pool } = pkg;
import { users, workers, jobRequests, workerVerifications } from "@shared/schema";
import type { User, InsertUser, Worker, InsertWorker, JobRequest, InsertJobRequest, Review, Transaction, SupportTicket, PricingConfig } from "@shared/schema";
import type { IStorage, WorkerVerification } from "./storage";
import { randomUUID } from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// In-memory fallback for tables not yet in DB
const reviews: Map<string, Review> = new Map();
const transactions: Map<string, Transaction> = new Map();
const supportTickets: Map<string, SupportTicket> = new Map();
const notifications: Map<string, import("./storage").AppNotification> = new Map();
const resetCodes: Record<string, string> = {};
let pricingConfig: Map<string, PricingConfig> = new Map([
  ["Plumbing",   { category: "Plumbing",   baseMin: 2500, baseMax: 6000,  depositPercent: 0.3  }],
  ["Electrical", { category: "Electrical", baseMin: 3000, baseMax: 8000,  depositPercent: 0.3  }],
  ["Welding",    { category: "Welding",    baseMin: 2800, baseMax: 7000,  depositPercent: 0.3  }],
  ["Carpentry",  { category: "Carpentry",  baseMin: 2000, baseMax: 6500,  depositPercent: 0.3  }],
  ["HVAC",       { category: "HVAC",       baseMin: 4000, baseMax: 12000, depositPercent: 0.35 }],
  ["Appliance",  { category: "Appliance",  baseMin: 1500, baseMax: 5000,  depositPercent: 0.3  }],
  ["Painting",   { category: "Painting",   baseMin: 2500, baseMax: 7000,  depositPercent: 0.3  }],
  ["Emergency",  { category: "Emergency",  baseMin: 5000, baseMax: 15000, depositPercent: 0.4  }],
  ["General",    { category: "General",    baseMin: 2000, baseMax: 6000,  depositPercent: 0.3  }],
]);

export class DatabaseStorage implements IStorage {
  _resetCodes = resetCodes;

  async getUserById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }
  async getUserByPhone(phone: string) {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({ ...insertUser, email: insertUser.email.toLowerCase() }).returning();
    return user;
  }
  async updateUserWallet(id: string, amount: number) {
    const user = await this.getUserById(id);
    if (!user) return undefined;
    const [updated] = await db.update(users).set({ walletBalance: (user.walletBalance ?? 0) + amount }).where(eq(users.id, id)).returning();
    return updated;
  }
  async updateUserProfile(id: string, updates: any) {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated;
  }
  async updateUserPassword(id: string, newPassword: string) {
    const [updated] = await db.update(users).set({ password: newPassword }).where(eq(users.id, id)).returning();
    return updated;
  }

  async getWorker(id: string) {
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    return worker;
  }
  async getAllUsers() {
    return await db.select().from(users);
  }
  async getAllWorkers() { return db.select().from(workers); }
  async updateWorkerRating(id: string, rating: number, reviewCount: number) {
    const [updated] = await db.update(workers).set({ rating, reviewCount }).where(eq(workers.id, id)).returning();
    return updated;
  }
  async updateWorkerAvailability(id: string, availableNow: number) {
    const [updated] = await db.update(workers).set({ availableNow }).where(eq(workers.id, id)).returning();
    return updated;
  }
  async updateWorker(id: string, updates: Partial<Worker>) {
    const [updated] = await db.update(workers).set(updates).where(eq(workers.id, id)).returning();
    return updated;
  }
  async searchWorkers(filters: { specialty?: string; maxDistance?: number; minRating?: number; availableNow?: boolean; verified?: boolean }) {
    let list = await db.select().from(workers);
    if (filters.specialty) list = list.filter(w => w.specialty.toLowerCase() === filters.specialty!.toLowerCase());
    if (filters.maxDistance !== undefined) list = list.filter(w => w.distance <= filters.maxDistance!);
    if (filters.minRating !== undefined) list = list.filter(w => w.rating >= filters.minRating!);
    if (filters.availableNow) list = list.filter(w => w.availableNow === 1);
    if (filters.verified) list = list.filter(w => w.verified === 1);
    return list;
  }

  async getJobRequest(id: string) {
    const [job] = await db.select().from(jobRequests).where(eq(jobRequests.id, id));
    return job;
  }
  async getAllJobRequests() { return db.select().from(jobRequests); }
  async getJobRequestsByUser(userId: string) { return db.select().from(jobRequests).where(eq(jobRequests.userId, userId)); }
  async getJobRequestsByWorker(workerId: string) { return db.select().from(jobRequests).where(eq(jobRequests.workerId, workerId)); }
  async createJobRequest(request: InsertJobRequest): Promise<JobRequest> {
    const [job] = await db.insert(jobRequests).values(request).returning();
    return job;
  }
  async updateJobRequestStatus(id: string, status: string) {
    const [updated] = await db.update(jobRequests).set({ status }).where(eq(jobRequests.id, id)).returning();
    return updated;
  }
  async updateJobRequest(id: string, updates: Partial<JobRequest>) {
    const [updated] = await db.update(jobRequests).set(updates).where(eq(jobRequests.id, id)).returning();
    return updated;
  }

  async getAllReviews() { return Array.from(reviews.values()); }
  async getReviewsByWorker(workerId: string) { return Array.from(reviews.values()).filter(r => r.workerId === workerId); }
  async createReview(review: Omit<Review, "id" | "createdAt">): Promise<Review> {
    const id = randomUUID();
    const newReview = { ...review, id, createdAt: new Date().toISOString() };
    reviews.set(id, newReview);
    return newReview;
  }

  async getAllTransactions() { return Array.from(transactions.values()); }
  async getTransactionsByUser(userId: string) { return Array.from(transactions.values()).filter(t => t.userId === userId); }
  async getTransactionsByWorker(workerId: string) { return Array.from(transactions.values()).filter(t => t.workerId === workerId); }
  async getTransactionsByJob(jobId: string) { return Array.from(transactions.values()).filter(t => t.jobId === jobId); }
  async getTransactionById(id: string) { return transactions.get(id) ?? null; }
  async updateTransactionStatus(id: string, status: string) {
    const tx = transactions.get(id);
    if (!tx) return null;
    const updated = { ...tx, status: status as Transaction["status"] };
    transactions.set(id, updated);
    return updated;
  }
  async createTransaction(tx: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
    const id = randomUUID();
    const newTx = { ...tx, id, createdAt: new Date().toISOString() };
    transactions.set(id, newTx);
    return newTx;
  }
  async reverseTransaction(id: string) {
    const tx = transactions.get(id);
    if (!tx) return undefined;
    const updated = { ...tx, status: "reversed" as const };
    transactions.set(id, updated);
    return updated;
  }

  async getAllSupportTickets() { return Array.from(supportTickets.values()); }
  async getSupportTicketsByUser(userId: string) { return Array.from(supportTickets.values()).filter(t => t.userId === userId); }
  async createSupportTicket(ticket: Omit<SupportTicket, "id" | "createdAt">): Promise<SupportTicket> {
    const id = randomUUID();
    const newTicket = { ...ticket, id, createdAt: new Date().toISOString() };
    supportTickets.set(id, newTicket);
    return newTicket;
  }
  async updateSupportTicket(id: string, updates: Partial<SupportTicket>) {
    const ticket = supportTickets.get(id);
    if (!ticket) return undefined;
    const updated = { ...ticket, ...updates };
    supportTickets.set(id, updated);
    return updated;
  }

  async getWorkerVerification(userId: string) {
    const [v] = await db.select().from(workerVerifications).where(eq(workerVerifications.userId, userId));
    if (!v) return undefined;
    return { ...v, workSamples: JSON.parse(v.workSamples || '[]') } as any;
  }
  async getWorkerVerificationByEmail(email: string) {
    const [v] = await db.select().from(workerVerifications).where(eq(workerVerifications.email, email.toLowerCase()));
    if (!v) return undefined;
    return { ...v, workSamples: JSON.parse(v.workSamples || '[]') } as any;
  }
  async getAllWorkerVerifications() {
    const all = await db.select().from(workerVerifications);
    return all.map(v => ({ ...v, workSamples: JSON.parse(v.workSamples || '[]') })) as any[];
  }
  async upsertWorkerVerification(userId: string, data: Partial<WorkerVerification>): Promise<WorkerVerification> {
    const workSamples = JSON.stringify(data.workSamples ?? []);
    const values = {
      userId,
      workerName: data.workerName ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      idFront: data.idFront ?? null,
      idBack: data.idBack ?? null,
      workSamples,
      specialty: data.specialty ?? null,
      bio: data.bio ?? null,
      yearsExperience: data.yearsExperience ?? null,
      status: data.status ?? "pending",
      submittedAt: data.submittedAt ?? new Date().toISOString(),
      reviewedAt: data.reviewedAt ?? null,
      reviewNote: data.reviewNote ?? null,
    };
    const [result] = await db.insert(workerVerifications).values(values)
      .onConflictDoUpdate({ target: workerVerifications.userId, set: values })
      .returning();
    return { ...result, workSamples: JSON.parse(result.workSamples || '[]') } as any;
  }

  async getPricingConfig() { return Array.from(pricingConfig.values()); }
  async updatePricingConfig(category: string, config: Partial<PricingConfig>) {
    const existing = pricingConfig.get(category);
    if (!existing) return undefined;
    const updated = { ...existing, ...config };
    pricingConfig.set(category, updated);
    return updated;
  }

  async getNotificationsByUser(userId: string) {
    return Array.from(notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(n: Omit<import("./storage").AppNotification, "id" | "createdAt">) {
    const { randomUUID } = await import("crypto");
    const id = randomUUID();
    const notification = { ...n, id, createdAt: new Date().toISOString() };
    notifications.set(id, notification);
    return notification;
  }

  async markNotificationRead(id: string) {
    const n = notifications.get(id);
    if (!n) return undefined;
    const updated = { ...n, isRead: true };
    notifications.set(id, updated);
    return updated;
  }

  async markAllNotificationsRead(userId: string) {
    for (const [id, n] of notifications.entries()) {
      if (n.userId === userId) notifications.set(id, { ...n, isRead: true });
    }
  }

  async getUnreadCount(userId: string) {
    return Array.from(notifications.values()).filter(n => n.userId === userId && !n.isRead).length;
  }

  async createWorkerFromVerification(verification: WorkerVerification, user: any) {
    // Check if worker already exists
    const existing = await db.select().from(workers).where(eq(workers.email, verification.email));
    if (existing.length > 0) return existing[0];
    const [worker] = await db.insert(workers).values({
      id: user.id,
      name: verification.workerName,
      specialty: verification.specialty ?? "General",
      hourlyRate: 1000,
      rating: 0,
      reviewCount: 0,
      distance: 0,
      location: "Nairobi",
      bio: verification.bio ?? "",
      yearsExperience: verification.yearsExperience ?? 0,
      jobsCompleted: 0,
      responseTime: "< 1 hour",
      verified: 1,
      profileImage: verification.idFront ?? "",
      availableNow: 1,
      phone: verification.phone,
      email: verification.email,
    }).returning();
    return worker;
  }
}
