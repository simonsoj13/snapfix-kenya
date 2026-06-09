import type { Express } from "express";
import { createServer } from "http";
import adminRoutes from "./admin";
import landlordRoutes from "./landlord";

export async function registerRoutes(app: Express) {
  // API routes
  app.use("/api/admin", adminRoutes);
  app.use("/api/landlord", landlordRoutes);
  app.post("/api/landlord-enquiry", async (req, res, next) => {
    try {
      // Delegate to landlord routes
      return landlordRoutes.emit("request", req, res);
    } catch (err) {
      next(err);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
