import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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
});

export const jobRequests = pgTable("job_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workerId: varchar("worker_id"),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull(),
  location: text("location").notNull(),
  preferredDate: text("preferred_date"),
  budget: integer("budget"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWorkerSchema = createInsertSchema(workers).omit({
  id: true,
});

export const insertJobRequestSchema = createInsertSchema(jobRequests).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Worker = typeof workers.$inferSelect;
export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type JobRequest = typeof jobRequests.$inferSelect;
export type InsertJobRequest = z.infer<typeof insertJobRequestSchema>;
