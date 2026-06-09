import { pgTable, text, varchar, integer, real, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { z } from "zod";

// ── User Tables ───────────────────────────────────────��──────────────────

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: varchar("email").notNull().unique(),
  phone: varchar("phone").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // user, admin
  idDocUrl: text("id_doc_url"),
  workSampleUrls: text("work_sample_urls"), // JSON array as string
  walletBalance: real("wallet_balance").notNull().default(0),
  idVerified: integer("id_verified").notNull().default(0),
  createdAt: text("created_at").default(sql`now()::text`),
});

export const workers = pgTable("workers", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  specialty: text("specialty").notNull(),
  hourlyRate: integer("hourly_rate").notNull(),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  distance: real("distance").notNull(),
  location: text("location").notNull(),
  bio: text("bio"),
  yearsExperience: integer("years_experience").notNull().default(0),
  jobsCompleted: integer("jobs_completed").notNull().default(0),
  responseTime: text("response_time").notNull(),
  verified: integer("verified").notNull().default(0),
  profileImage: text("profile_image"),
  availableNow: integer("available_now").notNull().default(0),
  createdAt: text("created_at").default(sql`now()::text`),
});

export const jobRequests = pgTable("job_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  location: text("location").notNull(),
  status: text("status").notNull().default("open"), // open, pending, in-progress, completed, cancelled, deposit-paid, fundi-arrived, balance-due
  workerId: varchar("worker_id"),
  workerContactShown: integer("worker_contact_shown").notNull().default(0),
  workerOnWay: integer("worker_on_way").notNull().default(0),
  estimatedArrival: text("estimated_arrival"),
  createdAt: text("created_at").default(sql`now()::text`),
  updatedAt: text("updated_at").default(sql`now()::text`),
});

export const workerVerifications = pgTable("worker_verifications", {
  userId: varchar("user_id").primaryKey(),
  workerName: text("worker_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  idFront: text("id_front"),
  idBack: text("id_back"),
  workSamples: text("work_samples").notNull(), // JSON array as string
  specialty: text("specialty"),
  bio: text("bio"),
  yearsExperience: integer("years_experience"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  submittedAt: text("submitted_at").notNull(),
  reviewedAt: text("reviewed_at"),
  reviewNote: text("review_note"),
});

// ── Landlord Subscription/Bundle ──────────────────────────────────────────

export const landlordBundles = pgTable("landlord_bundles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  orgName: text("org_name").notNull(),
  orgType: text("org_type").notNull(), // landlord, agency, school, hospital, etc.
  planType: text("plan_type").notNull(), // starter, professional, enterprise
  units: integer("units").notNull(),
  
  monthlyJobQuota: integer("monthly_job_quota").notNull(), // 10, 40, unlimited
  monthlyPrice: real("monthly_price").notNull(),
  
  status: text("status").notNull().default("active"), // active, paused, expired, cancelled
  startDate: text("start_date").notNull(),
  renewalDate: text("renewal_date").notNull(),
  autoRenew: boolean("auto_renew").notNull().default(true),
  
  accountManagerId: varchar("account_manager_id"), // admin user ID
  
  createdAt: text("created_at").default(sql`now()::text`),
  updatedAt: text("updated_at").default(sql`now()::text`),
});

// Properties under a landlord bundle
export const bundleProperties = pgTable("bundle_properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id").notNull(),
  propertyName: text("property_name").notNull(),
  address: text("address").notNull(),
  units: integer("units").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()::text`),
});

// Bundle-specific job requests (scheduled maintenance)
export const bundleJobRequests = pgTable("bundle_job_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id").notNull(),
  propertyId: varchar("property_id").notNull(),
  
  category: text("category").notNull(), // Plumbing, Electrical, etc.
  description: text("description").notNull(),
  priority: text("priority").notNull(), // urgent, high, normal, low
  
  status: text("status").notNull().default("scheduled"), // scheduled, assigned, in-progress, completed, cancelled
  
  // Scheduling
  scheduledDate: text("scheduled_date"), // When customer wants it done
  preferredTime: text("preferred_time"), // morning, afternoon, evening
  
  // Assignment
  assignedWorkerId: varchar("assigned_worker_id"),
  assignedWorkerName: text("assigned_worker_name"),
  
  // Completion tracking
  completedDate: text("completed_date"),
  completedBy: text("completed_by"), // worker name / notes
  rating: integer("rating"), // 1-5 stars after completion
  feedback: text("feedback"),
  
  // Cost
  estimatedCost: real("estimated_cost"),
  actualCost: real("actual_cost"),
  
  // Photos
  beforePhoto: text("before_photo"),
  afterPhoto: text("after_photo"),
  
  createdAt: text("created_at").default(sql`now()::text`),
});

// Bundle usage tracking (for monthly quotas)
export const bundleUsageTracking = pgTable("bundle_usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id").notNull(),
  billingMonth: text("billing_month").notNull(), // YYYY-MM format
  
  jobsScheduled: integer("jobs_scheduled").notNull().default(0),
  jobsCompleted: integer("jobs_completed").notNull().default(0),
  jobsCancelled: integer("jobs_cancelled").notNull().default(0),
  jobsInProgress: integer("jobs_in_progress").notNull().default(0),
  
  totalSpent: real("total_spent").notNull().default(0),
  
  createdAt: text("created_at").default(sql`now()::text`),
  updatedAt: text("updated_at").default(sql`now()::text`),
});

// Bundle notifications/messages
export const bundleNotifications = pgTable("bundle_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id").notNull(),
  jobRequestId: varchar("job_request_id"),
  
  type: text("type").notNull(), // job_assigned, job_completed, job_scheduled, quota_warning, renewal_reminder
  title: text("title").notNull(),
  message: text("message").notNull(),
  
  isRead: boolean("is_read").notNull().default(false),
  
  createdAt: text("created_at").default(sql`now()::text`),
});

// ── Zod Validation Schemas ──────────────────────────────────────────────

export const insertUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  role: z.enum(["user", "admin"]).default("user"),
  idDocUrl: z.string().optional().nullable(),
  workSampleUrls: z.string().optional().nullable(),
});

export const loginSchema = z.object({
  credential: z.string(),
  password: z.string(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const insertJobRequestSchema = z.object({
  userId: z.string(),
  category: z.string(),
  description: z.string(),
  imageUrl: z.string().optional(),
  location: z.string(),
});

// ── Type Definitions ────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Worker = typeof workers.$inferSelect;
export type InsertWorker = Omit<Worker, "createdAt" | "id">;

export type JobRequest = typeof jobRequests.$inferSelect;
export type InsertJobRequest = z.infer<typeof insertJobRequestSchema>;

export type Review = {
  id: string;
  workerId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type Transaction = {
  id: string;
  userId: string;
  workerId: string;
  jobId: string;
  amount: number;
  type: "deposit" | "balance" | "reversed";
  status: "pending" | "completed" | "reversed";
  category?: string;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  userId: string;
  category: string;
  subject: string;
  message: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
};

export type PricingConfig = {
  category: string;
  baseMin: number;
  baseMax: number;
  depositPercent: number;
};
