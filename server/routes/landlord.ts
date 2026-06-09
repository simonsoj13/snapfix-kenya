import { Router } from "express";
import { db } from "../db";
import { landlordBundles, bundleProperties, bundleJobRequests, bundleUsageTracking, bundleNotifications } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// GET /api/landlord/bundle/:userId - Get active bundle for a user
router.get("/bundle/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const bundle = await db
      .select()
      .from(landlordBundles)
      .where(and(eq(landlordBundles.userId, userId), eq(landlordBundles.status, "active")))
      .limit(1);

    res.json(bundle[0] || null);
  } catch (error) {
    console.error("Error fetching bundle:", error);
    res.status(500).json({ error: "Failed to fetch bundle" });
  }
});

// GET /api/landlord/properties/:bundleId - Get all properties under a bundle
router.get("/properties/:bundleId", async (req, res) => {
  try {
    const { bundleId } = req.params;
    const properties = await db
      .select()
      .from(bundleProperties)
      .where(eq(bundleProperties.bundleId, bundleId));

    res.json(properties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// GET /api/landlord/jobs/:bundleId - Get all jobs for a bundle (sorted by date, newest first)
router.get("/jobs/:bundleId", async (req, res) => {
  try {
    const { bundleId } = req.params;
    const jobs = await db
      .select()
      .from(bundleJobRequests)
      .where(eq(bundleJobRequests.bundleId, bundleId))
      .orderBy((table) => table.createdAt); // Drizzle will sort, we reverse in frontend

    res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// GET /api/landlord/usage/:bundleId - Get monthly usage stats
router.get("/usage/:bundleId", async (req, res) => {
  try {
    const { bundleId } = req.params;
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const usage = await db
      .select()
      .from(bundleUsageTracking)
      .where(
        and(
          eq(bundleUsageTracking.bundleId, bundleId),
          eq(bundleUsageTracking.billingMonth, currentMonth)
        )
      )
      .limit(1);

    if (usage.length === 0) {
      return res.json({
        jobsScheduled: 0,
        jobsCompleted: 0,
        jobsInProgress: 0,
        jobsCancelled: 0,
        totalSpent: 0,
      });
    }

    res.json(usage[0]);
  } catch (error) {
    console.error("Error fetching usage:", error);
    res.status(500).json({ error: "Failed to fetch usage" });
  }
});

// POST /api/landlord/jobs - Schedule a new job
router.post("/jobs", async (req, res) => {
  try {
    const { bundleId, propertyId, category, description, scheduledDate, priority } = req.body;

    if (!bundleId || !propertyId || !category || !description || !scheduledDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create job request
    const newJob = {
      id: crypto.randomUUID?.() || Math.random().toString(36),
      bundleId,
      propertyId,
      category,
      description,
      priority: priority || "normal",
      status: "scheduled",
      scheduledDate,
      estimatedCost: null,
      createdAt: new Date().toISOString(),
    };

    await db.insert(bundleJobRequests).values(newJob);

    // Update usage tracking - increment jobsScheduled
    const currentMonth = new Date().toISOString().slice(0, 7);
    const existingUsage = await db
      .select()
      .from(bundleUsageTracking)
      .where(
        and(
          eq(bundleUsageTracking.bundleId, bundleId),
          eq(bundleUsageTracking.billingMonth, currentMonth)
        )
      )
      .limit(1);

    if (existingUsage.length > 0) {
      await db
        .update(bundleUsageTracking)
        .set({ jobsScheduled: (existingUsage[0].jobsScheduled || 0) + 1 })
        .where(eq(bundleUsageTracking.id, existingUsage[0].id));
    } else {
      await db.insert(bundleUsageTracking).values({
        id: crypto.randomUUID?.() || Math.random().toString(36),
        bundleId,
        billingMonth: currentMonth,
        jobsScheduled: 1,
        jobsCompleted: 0,
        jobsCancelled: 0,
        jobsInProgress: 0,
        totalSpent: 0,
        createdAt: new Date().toISOString(),
      });
    }

    // Create notification
    await db.insert(bundleNotifications).values({
      id: crypto.randomUUID?.() || Math.random().toString(36),
      bundleId,
      jobRequestId: newJob.id,
      type: "job_scheduled",
      title: "New Job Scheduled",
      message: `${category} job scheduled for ${scheduledDate}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(newJob);
  } catch (error) {
    console.error("Error scheduling job:", error);
    res.status(500).json({ error: "Failed to schedule job" });
  }
});

// PATCH /api/landlord/jobs/:jobId - Update job status (assign worker, mark complete, etc.)
router.patch("/jobs/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      status,
      assignedWorkerId,
      assignedWorkerName,
      estimatedCost,
      actualCost,
      completedDate,
      rating,
      feedback,
      beforePhoto,
      afterPhoto,
    } = req.body;

    // Get existing job to know bundle for notifications
    const existingJob = await db
      .select()
      .from(bundleJobRequests)
      .where(eq(bundleJobRequests.id, jobId))
      .limit(1);

    if (existingJob.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const job = existingJob[0];

    // Build update object
    const updateData: any = {};
    if (status) updateData.status = status;
    if (assignedWorkerId) updateData.assignedWorkerId = assignedWorkerId;
    if (assignedWorkerName) updateData.assignedWorkerName = assignedWorkerName;
    if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost;
    if (actualCost !== undefined) updateData.actualCost = actualCost;
    if (completedDate) updateData.completedDate = completedDate;
    if (rating !== undefined) updateData.rating = rating;
    if (feedback) updateData.feedback = feedback;
    if (beforePhoto) updateData.beforePhoto = beforePhoto;
    if (afterPhoto) updateData.afterPhoto = afterPhoto;

    await db.update(bundleJobRequests).set(updateData).where(eq(bundleJobRequests.id, jobId));

    // Update usage stats if status changed
    if (status && status !== job.status) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usage = await db
        .select()
        .from(bundleUsageTracking)
        .where(
          and(
            eq(bundleUsageTracking.bundleId, job.bundleId),
            eq(bundleUsageTracking.billingMonth, currentMonth)
          )
        )
        .limit(1);

      if (usage.length > 0) {
        const updates: any = {};
        
        // Decrement old status
        if (job.status === "completed") updates.jobsCompleted = (usage[0].jobsCompleted || 0) - 1;
        if (job.status === "in-progress") updates.jobsInProgress = (usage[0].jobsInProgress || 0) - 1;
        if (job.status === "cancelled") updates.jobsCancelled = (usage[0].jobsCancelled || 0) - 1;

        // Increment new status
        if (status === "completed") updates.jobsCompleted = (updates.jobsCompleted !== undefined ? updates.jobsCompleted : usage[0].jobsCompleted || 0) + 1;
        if (status === "in-progress") updates.jobsInProgress = (updates.jobsInProgress !== undefined ? updates.jobsInProgress : usage[0].jobsInProgress || 0) + 1;
        if (status === "cancelled") updates.jobsCancelled = (updates.jobsCancelled !== undefined ? updates.jobsCancelled : usage[0].jobsCancelled || 0) + 1;

        // Update spending if actual cost changed
        if (actualCost !== undefined && job.actualCost !== actualCost) {
          const diff = (actualCost || 0) - (job.actualCost || 0);
          updates.totalSpent = (usage[0].totalSpent || 0) + diff;
        }

        await db
          .update(bundleUsageTracking)
          .set(updates)
          .where(eq(bundleUsageTracking.id, usage[0].id));
      }
    }

    // Create notification
    let notificationType = "job_assigned";
    let notificationTitle = "Job Assigned";
    let notificationMessage = `Worker assigned to job`;

    if (status === "completed") {
      notificationType = "job_completed";
      notificationTitle = "Job Completed";
      notificationMessage = `Job completed with rating: ${rating || "pending"}`;
    } else if (status === "in-progress") {
      notificationType = "job_assigned";
      notificationTitle = "Job In Progress";
      notificationMessage = `Worker has started the job`;
    }

    await db.insert(bundleNotifications).values({
      id: crypto.randomUUID?.() || Math.random().toString(36),
      bundleId: job.bundleId,
      jobRequestId: jobId,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    const updatedJob = await db
      .select()
      .from(bundleJobRequests)
      .where(eq(bundleJobRequests.id, jobId))
      .limit(1);

    res.json(updatedJob[0]);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ error: "Failed to update job" });
  }
});

// POST /api/landlord-enquiry - Create landlord enquiry (creates bundle after approval)
router.post("/enquiry", async (req, res) => {
  try {
    const {
      userId,
      orgName,
      orgType,
      units,
      preferredPlan,
      contactName,
      contactPhone,
      contactEmail,
      notes,
    } = req.body;

    if (!orgName || !orgType || !units || !contactName || !contactPhone || !contactEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Store enquiry for admin review (you'd need a landlord_enquiries table)
    // For now, we'll auto-create a bundle (in production, admin would approve first)

    let monthlyJobQuota = 10;
    let monthlyPrice = 4999;

    if (preferredPlan === "professional") {
      monthlyJobQuota = 40;
      monthlyPrice = 12999;
    } else if (preferredPlan === "enterprise") {
      monthlyJobQuota = 999999; // unlimited
      monthlyPrice = 0; // custom
    }

    const bundleId = crypto.randomUUID?.() || Math.random().toString(36);
    const now = new Date();
    const renewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Create bundle
    const newBundle = {
      id: bundleId,
      userId: userId || null,
      orgName,
      orgType,
      planType: preferredPlan || "starter",
      units: parseInt(units.split("-")[0]) || 1,
      monthlyJobQuota,
      monthlyPrice,
      status: "active",
      startDate: now.toISOString(),
      renewalDate,
      autoRenew: true,
      accountManagerId: null,
      createdAt: now.toISOString(),
    };

    await db.insert(landlordBundles).values(newBundle);

    // Initialize usage tracking for this month
    const currentMonth = now.toISOString().slice(0, 7);
    await db.insert(bundleUsageTracking).values({
      id: crypto.randomUUID?.() || Math.random().toString(36),
      bundleId,
      billingMonth: currentMonth,
      jobsScheduled: 0,
      jobsCompleted: 0,
      jobsInProgress: 0,
      jobsCancelled: 0,
      totalSpent: 0,
      createdAt: now.toISOString(),
    });

    res.status(201).json({
      message: "Enquiry received! Bundle created.",
      bundle: newBundle,
    });
  } catch (error) {
    console.error("Error creating enquiry:", error);
    res.status(500).json({ error: "Failed to create enquiry" });
  }
});

export default router;
