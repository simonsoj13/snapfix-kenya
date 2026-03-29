import {
  type User, type InsertUser,
  type Worker, type InsertWorker,
  type JobRequest, type InsertJobRequest,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getWorker(id: string): Promise<Worker | undefined>;
  getAllWorkers(): Promise<Worker[]>;
  updateWorkerAvailability(id: string, availableNow: number): Promise<Worker | undefined>;
  searchWorkers(filters: {
    specialty?: string;
    maxDistance?: number;
    minRating?: number;
    availableNow?: boolean;
    verified?: boolean;
  }): Promise<Worker[]>;

  getJobRequest(id: string): Promise<JobRequest | undefined>;
  getAllJobRequests(): Promise<JobRequest[]>;
  getJobRequestsByUser(userId: string): Promise<JobRequest[]>;
  createJobRequest(request: InsertJobRequest): Promise<JobRequest>;
  updateJobRequestStatus(id: string, status: string): Promise<JobRequest | undefined>;
  updateJobRequest(id: string, updates: Partial<JobRequest>): Promise<JobRequest | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private workers: Map<string, Worker> = new Map();
  private jobRequests: Map<string, JobRequest> = new Map();

  constructor() {
    this.seedWorkers();
  }

  private seedWorkers() {
    const mockWorkers: Array<InsertWorker & { phone: string; email: string }> = [
      {
        name: "John Smith",
        specialty: "Plumbing",
        hourlyRate: 85,
        rating: 4.9,
        reviewCount: 127,
        distance: 2.3,
        location: "Nairobi CBD",
        bio: "Master plumber with 15 years of experience. Specialising in residential and commercial plumbing repairs, installations, and emergency services.",
        yearsExperience: 15,
        jobsCompleted: 450,
        responseTime: "< 30 min",
        verified: 1,
        profileImage: "",
        availableNow: 1,
        phone: "+254712345001",
        email: "john.smith@fixit.ke",
      },
      {
        name: "Sarah Johnson",
        specialty: "Electrical",
        hourlyRate: 95,
        rating: 4.8,
        reviewCount: 94,
        distance: 3.1,
        location: "Westlands",
        bio: "Licensed electrician specialising in residential electrical work, panel upgrades, and home automation systems.",
        yearsExperience: 12,
        jobsCompleted: 380,
        responseTime: "< 1 hour",
        verified: 1,
        profileImage: "",
        availableNow: 0,
        phone: "+254712345002",
        email: "sarah.j@fixit.ke",
      },
      {
        name: "Mike Chen",
        specialty: "Welding",
        hourlyRate: 78,
        rating: 4.7,
        reviewCount: 86,
        distance: 4.5,
        location: "Industrial Area",
        bio: "Certified welder with expertise in structural welding, custom metal fabrication, and repair work.",
        yearsExperience: 10,
        jobsCompleted: 320,
        responseTime: "< 45 min",
        verified: 1,
        profileImage: "",
        availableNow: 1,
        phone: "+254712345003",
        email: "mike.c@fixit.ke",
      },
      {
        name: "David Martinez",
        specialty: "Carpentry",
        hourlyRate: 82,
        rating: 4.9,
        reviewCount: 112,
        distance: 1.8,
        location: "Karen",
        bio: "Master carpenter specialising in custom woodwork, furniture repair, and home renovations.",
        yearsExperience: 18,
        jobsCompleted: 520,
        responseTime: "< 20 min",
        verified: 1,
        profileImage: "",
        availableNow: 0,
        phone: "+254712345004",
        email: "david.m@fixit.ke",
      },
      {
        name: "Emily Rodriguez",
        specialty: "HVAC",
        hourlyRate: 90,
        rating: 4.8,
        reviewCount: 103,
        distance: 3.7,
        location: "Kilimani",
        bio: "HVAC technician with expertise in heating and cooling system installation, repair, and maintenance.",
        yearsExperience: 14,
        jobsCompleted: 410,
        responseTime: "< 1 hour",
        verified: 1,
        profileImage: "",
        availableNow: 1,
        phone: "+254712345005",
        email: "emily.r@fixit.ke",
      },
      {
        name: "Robert Kim",
        specialty: "Appliance",
        hourlyRate: 75,
        rating: 4.7,
        reviewCount: 89,
        distance: 2.9,
        location: "Lavington",
        bio: "Appliance repair specialist for all major brands. Quick diagnosis and reliable repairs.",
        yearsExperience: 11,
        jobsCompleted: 370,
        responseTime: "< 45 min",
        verified: 1,
        profileImage: "",
        availableNow: 1,
        phone: "+254712345006",
        email: "robert.k@fixit.ke",
      },
    ];

    mockWorkers.forEach((w) => {
      const id = randomUUID();
      this.workers.set(id, { ...w, id, verified: w.verified ?? 0, availableNow: w.availableNow ?? 0 });
    });
  }

  // ── Users ────────────────────────────────────────────────────────────────────

  async getUserById(id: string) { return this.users.get(id); }

  async getUserByEmail(email: string) {
    return Array.from(this.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  async getUserByPhone(phone: string) {
    return Array.from(this.users.values()).find((u) => u.phone === phone);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // ── Workers ──────────────────────────────────────────────────────────────────

  async getWorker(id: string) { return this.workers.get(id); }

  async getAllWorkers() { return Array.from(this.workers.values()); }

  async updateWorkerAvailability(id: string, availableNow: number) {
    const w = this.workers.get(id);
    if (!w) return undefined;
    const updated = { ...w, availableNow };
    this.workers.set(id, updated);
    return updated;
  }

  async searchWorkers(filters: {
    specialty?: string;
    maxDistance?: number;
    minRating?: number;
    availableNow?: boolean;
    verified?: boolean;
  }) {
    let list = Array.from(this.workers.values());
    if (filters.specialty)
      list = list.filter((w) => w.specialty.toLowerCase() === filters.specialty!.toLowerCase());
    if (filters.maxDistance !== undefined)
      list = list.filter((w) => w.distance <= filters.maxDistance!);
    if (filters.minRating !== undefined)
      list = list.filter((w) => w.rating >= filters.minRating!);
    if (filters.availableNow)
      list = list.filter((w) => w.availableNow === 1);
    if (filters.verified)
      list = list.filter((w) => w.verified === 1);
    return list;
  }

  // ── Job Requests ─────────────────────────────────────────────────────────────

  async getJobRequest(id: string) { return this.jobRequests.get(id); }

  async getAllJobRequests() { return Array.from(this.jobRequests.values()); }

  async getJobRequestsByUser(userId: string) {
    return Array.from(this.jobRequests.values()).filter((r) => r.userId === userId);
  }

  async createJobRequest(req: InsertJobRequest): Promise<JobRequest> {
    const id = randomUUID();
    const full: JobRequest = {
      ...req,
      id,
      workerId: req.workerId ?? null,
      preferredDate: req.preferredDate ?? null,
      budget: req.budget ?? null,
      quotedAmount: req.quotedAmount ?? null,
      depositAmount: req.depositAmount ?? null,
      isNow: req.isNow ?? 0,
      area: req.area ?? "",
      workerContactShown: req.workerContactShown ?? 0,
    };
    this.jobRequests.set(id, full);
    return full;
  }

  async updateJobRequestStatus(id: string, status: string) {
    return this.updateJobRequest(id, { status });
  }

  async updateJobRequest(id: string, updates: Partial<JobRequest>) {
    const req = this.jobRequests.get(id);
    if (!req) return undefined;
    const updated = { ...req, ...updates };
    this.jobRequests.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
