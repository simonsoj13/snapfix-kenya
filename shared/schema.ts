import { pgTable, text, varchar, integer, real, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Landlord Subscription/Bundle
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
