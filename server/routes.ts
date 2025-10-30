import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { analyzeRepairImage } from "./ai";
import { insertJobRequestSchema } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // AI Image Analysis Endpoint
  app.post("/api/analyze-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const imageBase64 = req.file.buffer.toString("base64");
      const analysis = await analyzeRepairImage(imageBase64);

      res.json(analysis);
    } catch (error: any) {
      console.error("Image analysis error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to analyze image" 
      });
    }
  });

  // Get all workers
  app.get("/api/workers", async (req, res) => {
    try {
      const workers = await storage.getAllWorkers();
      res.json(workers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workers" });
    }
  });

  // Search workers with filters
  app.get("/api/workers/search", async (req, res) => {
    try {
      const filters = {
        specialty: req.query.specialty as string | undefined,
        maxDistance: req.query.maxDistance ? parseFloat(req.query.maxDistance as string) : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        availableNow: req.query.availableNow === "true",
        verified: req.query.verified === "true",
      };

      const workers = await storage.searchWorkers(filters);
      res.json(workers);
    } catch (error) {
      res.status(500).json({ error: "Failed to search workers" });
    }
  });

  // Get worker by ID
  app.get("/api/workers/:id", async (req, res) => {
    try {
      const worker = await storage.getWorker(req.params.id);
      if (!worker) {
        return res.status(404).json({ error: "Worker not found" });
      }
      res.json(worker);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch worker" });
    }
  });

  // Create job request
  app.post("/api/job-requests", async (req, res) => {
    try {
      const validatedData = insertJobRequestSchema.parse(req.body);
      const jobRequest = await storage.createJobRequest(validatedData);
      res.json(jobRequest);
    } catch (error: any) {
      console.error("Create job request error:", error);
      res.status(400).json({ 
        error: error.message || "Failed to create job request" 
      });
    }
  });

  // Get job requests for a user
  app.get("/api/job-requests/user/:userId", async (req, res) => {
    try {
      const requests = await storage.getJobRequestsByUser(req.params.userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job requests" });
    }
  });

  // Update job request status
  app.patch("/api/job-requests/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updated = await storage.updateJobRequestStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ error: "Job request not found" });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update job request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
