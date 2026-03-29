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
  role: text("role").notNull().default("customer"), // customer | worker
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
  area: text("area").notNull().default(""),         // bathroom|sitting-room|bedroom|kitchen|compound
  status: text("status").notNull(),                 // pending|quoted|assigned|deposit-paid|in-progress|completed|cancelled
  location: text("location").notNull(),
  preferredDate: text("preferred_date"),
  isNow: integer("is_now").notNull().default(0),    // 1 = immediate
  budget: integer("budget"),
  quotedAmount: real("quoted_amount"),
  depositAmount: real("deposit_amount"),
  workerContactShown: integer("worker_contact_shown").notNull().default(0),
});

// ── Insert schemas ────────────────────────────────────────────────────────────

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const loginSchema = z.object({
  credential: z.string().min(1), // email or phone
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
