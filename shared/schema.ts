import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"), // customer | worker | admin
  idDocUrl: text("id_doc_url"),
  workSampleUrls: text("work_sample_urls"),
  walletBalance: real("wallet_balance").notNull().default(0),
  idVerified: integer("id_verified").notNull().default(0),
});

export const workers = pgTable("workers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  hourlyRate: integer("hourly_rate").notNull(),
  rating: real("rating").notNull(),
  reviewCount: integer("review_count").notNull(),
  distance: real("distance").notNull(),
  location: text("location").notNull(),
  bio: text("bio").notNull(),
  yearsExperience: integer("years_experience").notNull(),
  jobsCompleted: integer("jobs_completed").notNull(),
  responseTime: text("response_time").notNull(),
  verified: integer("verified").notNull().default(0),
  profileImage: text("profile_image").notNull(),
  availableNow: integer("available_now").notNull().default(0),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
});

export const jobRequests = pgTable("job_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workerId: varchar("worker_id"),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  area: text("area").notNull().default(""),
  status: text("status").notNull(),
  location: text("location").notNull(),
  preferredDate: text("preferred_date"),
  isNow: integer("is_now").notNull().default(0),
  budget: integer("budget"),
  quotedMin: real("quoted_min"),
  quotedMax: real("quoted_max"),
  quotedAmount: real("quoted_amount"),
  depositAmount: real("deposit_amount"),
  workerContactShown: integer("worker_contact_shown").notNull().default(0),
  workerOnWay: integer("worker_on_way").notNull().default(0),
  estimatedArrival: text("estimated_arrival"),
});

// ── Reviews ───────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  userId: string;
  workerId: string;
  rating: number;
  comment: string;
  customerName: string;
  jobCategory: string;
  createdAt: string;
}

// ── Transactions ──────────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  userId: string;
  workerId: string;
  jobId: string;
  amount: number;
  type: "deposit" | "balance" | "reversal";
  status: "completed" | "reversed" | "pending";
  phone: string;
  mpesaRef: string;
  customerName: string;
  workerName: string;
  category: string;
  createdAt: string;
}

// ── Support Tickets ───────────────────────────────────────────────────────────
export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  subject: string;
  message: string;
  status: "open" | "in-progress" | "resolved";
  priority: "low" | "medium" | "high";
  createdAt: string;
  response?: string;
}

// ── Pricing Config ────────────────────────────────────────────────────────────
export interface PricingConfig {
  category: string;
  baseMin: number;
  baseMax: number;
  depositPercent: number;
}

// ── Insert schemas ────────────────────────────────────────────────────────────
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  walletBalance: true,
  idVerified: true,
});
export const loginSchema = z.object({
  credential: z.string().min(1),
  password: z.string().min(1),
});
export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const insertWorkerSchema = createInsertSchema(workers).omit({ id: true });
export const insertJobRequestSchema = createInsertSchema(jobRequests).omit({ id: true });

// ── Types ─────────────────────────────────────────────────────────────────────
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Worker = typeof workers.$inferSelect;
export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type JobRequest = typeof jobRequests.$inferSelect;
export type InsertJobRequest = z.infer<typeof insertJobRequestSchema>;
