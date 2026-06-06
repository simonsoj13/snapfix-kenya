import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import {
  users, workers, jobRequests, reviews, transactions, supportTickets, notifications, pricingConfigs,
  type User, type InsertUser,
  type Worker, type InsertWorker,
  type JobRequest, type InsertJobRequest,
  type Review, type InsertReview,
  type Transaction, type InsertTransaction,
  type SupportTicket, type InsertSupportTicket,
  type Notification, type InsertNotification,
  type PricingConfig, type InsertPricingConfig,
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUserPassword(id: string, password: string): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ password }).where(eq(users.id, id)).returning();
    return updated;
  }

  // Workers
  async getWorker(id: string): Promise<<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    return worker;
  }

  async getWorkerByUserId(userId: string): Promise<<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.userId, userId));
    return worker;
  }

  async getAllWorkers(): Promise<<Worker[]> {
    return db.select().from(workers);
  }

  async searchWorkers(filters: { category?: string; minRating?: number; location?: string }): Promise<<Worker[]> {
    let query = db.select().from(workers);
    if (filters.category) {
      query = query.where(sql`${workers.specialty} = ${filters.category}`) as any;
    }
    return query;
  }

  async createWorker(worker: InsertWorker): Promise<<Worker> {
    const [created] = await db.insert(workers).values(worker).returning();
    return created;
  }

  async updateWorker(id: string, updates: Partial<<Worker>): Promise<<Worker | undefined> {
    const [updated] = await db.update(workers).set(updates).where(eq(workers.id, id)).returning();
    return updated;
  }

  // Job Requests - CRITICAL FIXES HERE
  async getJobRequest(id: string): Promise<<JobRequest | undefined> {
    const [job] = await db.select().from(jobRequests).where(eq(jobRequests.id, id));
    return job;
  }

  async getAllJobRequests(): Promise<<JobRequest[]> {
    return db.select().from(jobRequests);
  }

  async getJobRequestsByUser(userId: string): Promise<<JobRequest[]> {
    return db.select().from(jobRequests).where(eq(jobRequests.userId, userId));
  }

  async getJobRequestsByWorker(workerId: string): Promise<<JobRequest[]> {
    return db.select().from(jobRequests).where(eq(jobRequests.workerId, workerId));
  }

  async createJobRequest(request: InsertJobRequest): Promise<<JobRequest> {
    // CRITICAL FIX: Always force workerId to null and status to "open"
    const safeRequest = { 
      ...request, 
      workerId: null, 
      status: "open",
      workerOnWay: 0,
      workerContactShown: 0
    };
    const [job] = await db.insert(jobRequests).values(safeRequest).returning();
    return job;
  }

  async updateJobRequestStatus(id: string, status: string): Promise<<JobRequest | undefined> {
    const [updated] = await db.update(jobRequests).set({ status }).where(eq(jobRequests.id, id)).returning();
    return updated;
  }

  async updateJobRequest(id: string, updates: Partial<<JobRequest>): Promise<<JobRequest | undefined> {
    const [updated] = await db.update(jobRequests).set(updates).where(eq(jobRequests.id, id)).returning();
    return updated;
  }

  async deleteJobRequest(id: string): Promise<boolean> {
    await db.delete(jobRequests).where(eq(jobRequests.id, id));
    return true;
  }

  // Reviews
  async getReview(id: string): Promise<<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async getReviewsByWorker(workerId: string): Promise<<Review[]> {
    return db.select().from(reviews).where(eq(reviews.workerId, workerId));
  }

  async createReview(review: InsertReview): Promise<<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  // Transactions
  async getTransaction(id: string): Promise<<Transaction | undefined> {
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
    return tx;
  }

  async getTransactionsByUser(userId: string): Promise<<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.userId, userId));
  }

  async getTransactionsByWorker(workerId: string): Promise<<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.workerId, workerId));
  }

  async createTransaction(transaction: InsertTransaction): Promise<<Transaction> {
    const [created] = await db.insert(transactions).values(transaction).returning();
    return created;
  }

  async updateTransactionStatus(id: string, status: string): Promise<<Transaction | undefined> {
    const [updated] = await db.update(transactions).set({ status }).where(eq(transactions.id, id)).returning();
    return updated;
  }

  // Support Tickets
  async getSupportTicket(id: string): Promise<<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
    return ticket;
  }

  async getSupportTicketsByUser(userId: string): Promise<<SupportTicket[]> {
    return db.select().from(supportTickets).where(eq(supportTickets.userId, userId));
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<<SupportTicket> {
    const [created] = await db.insert(supportTickets).values(ticket).returning();
    return created;
  }

  async updateSupportTicket(id: string, updates: Partial<<SupportTicket>): Promise<<SupportTicket | undefined> {
    const [updated] = await db.update(supportTickets).set(updates).where(eq(supportTickets.id, id)).returning();
    return updated;
  }

  // Notifications
  async getNotification(id: string): Promise<<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async createNotification(notification: InsertNotification): Promise<<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: string): Promise<<Notification | undefined> {
    const [updated] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
    return updated;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );
    return result[0]?.count || 0;
  }

  // Pricing Config
  async getPricingConfig(): Promise<PricingConfig | undefined> {
    const [config] = await db.select().from(pricingConfigs);
    return config;
  }

  async updatePricingConfig(config: Partial<PricingConfig>): Promise<PricingConfig | undefined> {
    const [updated] = await db.update(pricingConfigs).set(config).returning();
    return updated;
  }
}
