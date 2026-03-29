import { type User, type InsertUser, type Worker, type InsertWorker, type JobRequest, type InsertJobRequest } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workers: Map<string, Worker>;
  private jobRequests: Map<string, JobRequest>;

  constructor() {
    this.users = new Map();
    this.workers = new Map();
    this.jobRequests = new Map();
    this.seedWorkers();
  }

  private seedWorkers() {
    const mockWorkers: InsertWorker[] = [
      {
        name: "John Smith",
        specialty: "Plumbing",
        hourlyRate: 85,
        rating: 4.9,
        reviewCount: 127,
        distance: 2.3,
        location: "Brooklyn, NY",
        bio: "Master plumber with 15 years of experience. Specializing in residential and commercial plumbing repairs, installations, and emergency services.",
        yearsExperience: 15,
        jobsCompleted: 450,
        responseTime: "< 30 min",
        verified: 1,
        profileImage: "/api/placeholder-profile-1.jpg",
        availableNow: 1,
      },
      {
        name: "Sarah Johnson",
        specialty: "Electrical",
        hourlyRate: 95,
        rating: 4.8,
        reviewCount: 94,
        distance: 3.1,
        location: "Queens, NY",
        bio: "Licensed electrician specializing in residential electrical work, panel upgrades, and home automation systems.",
        yearsExperience: 12,
        jobsCompleted: 380,
        responseTime: "< 1 hour",
        verified: 1,
        profileImage: "/api/placeholder-profile-2.jpg",
        availableNow: 0,
      },
      {
        name: "Mike Chen",
        specialty: "Welding",
        hourlyRate: 78,
        rating: 4.7,
        reviewCount: 86,
        distance: 4.5,
        location: "Manhattan, NY",
        bio: "Certified welder with expertise in structural welding, custom metal fabrication, and repair work.",
        yearsExperience: 10,
        jobsCompleted: 320,
        responseTime: "< 45 min",
        verified: 1,
        profileImage: "/api/placeholder-profile-3.jpg",
        availableNow: 1,
      },
      {
        name: "David Martinez",
        specialty: "Carpentry",
        hourlyRate: 82,
        rating: 4.9,
        reviewCount: 112,
        distance: 1.8,
        location: "Brooklyn, NY",
        bio: "Master carpenter specializing in custom woodwork, furniture repair, and home renovations.",
        yearsExperience: 18,
        jobsCompleted: 520,
        responseTime: "< 20 min",
        verified: 1,
        profileImage: "/api/placeholder-profile-4.jpg",
        availableNow: 0,
      },
      {
        name: "Emily Rodriguez",
        specialty: "HVAC",
        hourlyRate: 90,
        rating: 4.8,
        reviewCount: 103,
        distance: 3.7,
        location: "Bronx, NY",
        bio: "HVAC technician with expertise in heating and cooling system installation, repair, and maintenance.",
        yearsExperience: 14,
        jobsCompleted: 410,
        responseTime: "< 1 hour",
        verified: 1,
        profileImage: "/api/placeholder-profile-5.jpg",
        availableNow: 1,
      },
      {
        name: "Robert Kim",
        specialty: "Appliance",
        hourlyRate: 75,
        rating: 4.7,
        reviewCount: 89,
        distance: 2.9,
        location: "Queens, NY",
        bio: "Appliance repair specialist for all major brands. Quick diagnosis and reliable repairs.",
        yearsExperience: 11,
        jobsCompleted: 370,
        responseTime: "< 45 min",
        verified: 1,
        profileImage: "/api/placeholder-profile-6.jpg",
        availableNow: 1,
      },
    ];

    mockWorkers.forEach((worker) => {
      const id = randomUUID();
      const fullWorker: Worker = {
        ...worker,
        id,
        verified: worker.verified ?? 0,
        availableNow: worker.availableNow ?? 0,
      };
      this.workers.set(id, fullWorker);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getWorker(id: string): Promise<Worker | undefined> {
    return this.workers.get(id);
  }

  async getAllWorkers(): Promise<Worker[]> {
    return Array.from(this.workers.values());
  }

  async updateWorkerAvailability(id: string, availableNow: number): Promise<Worker | undefined> {
    const worker = this.workers.get(id);
    if (worker) {
      const updated = { ...worker, availableNow };
      this.workers.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async searchWorkers(filters: {
    specialty?: string;
    maxDistance?: number;
    minRating?: number;
    availableNow?: boolean;
    verified?: boolean;
  }): Promise<Worker[]> {
    let workers = Array.from(this.workers.values());

    if (filters.specialty) {
      workers = workers.filter((w) => 
        w.specialty.toLowerCase() === filters.specialty!.toLowerCase()
      );
    }

    if (filters.maxDistance !== undefined) {
      workers = workers.filter((w) => w.distance <= filters.maxDistance!);
    }

    if (filters.minRating !== undefined) {
      workers = workers.filter((w) => w.rating >= filters.minRating!);
    }

    if (filters.availableNow) {
      workers = workers.filter((w) => w.availableNow === 1);
    }

    if (filters.verified) {
      workers = workers.filter((w) => w.verified === 1);
    }

    return workers;
  }

  async getJobRequest(id: string): Promise<JobRequest | undefined> {
    return this.jobRequests.get(id);
  }

  async getAllJobRequests(): Promise<JobRequest[]> {
    return Array.from(this.jobRequests.values());
  }

  async getJobRequestsByUser(userId: string): Promise<JobRequest[]> {
    return Array.from(this.jobRequests.values()).filter(
      (req) => req.userId === userId
    );
  }

  async createJobRequest(insertRequest: InsertJobRequest): Promise<JobRequest> {
    const id = randomUUID();
    const request: JobRequest = {
      ...insertRequest,
      id,
      workerId: insertRequest.workerId ?? null,
      preferredDate: insertRequest.preferredDate ?? null,
      budget: insertRequest.budget ?? null,
    };
    this.jobRequests.set(id, request);
    return request;
  }

  async updateJobRequestStatus(id: string, status: string): Promise<JobRequest | undefined> {
    const request = this.jobRequests.get(id);
    if (request) {
      const updated = { ...request, status };
      this.jobRequests.set(id, updated);
      return updated;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
