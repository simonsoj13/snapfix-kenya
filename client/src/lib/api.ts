import type { Worker, JobRequest, InsertJobRequest } from "@shared/schema";

const API_BASE = "/api";

export interface RepairAnalysis {
  category: string;
  description: string;
  confidence: number;
  urgency: "low" | "medium" | "high";
}

export async function analyzeImage(file: File): Promise<RepairAnalysis> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE}/analyze-image`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze image");
  }

  return response.json();
}

export async function getAllWorkers(): Promise<Worker[]> {
  const response = await fetch(`${API_BASE}/workers`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch workers");
  }

  return response.json();
}

export async function searchWorkers(filters: {
  specialty?: string;
  maxDistance?: number;
  minRating?: number;
  availableNow?: boolean;
  verified?: boolean;
}): Promise<Worker[]> {
  const params = new URLSearchParams();
  
  if (filters.specialty) params.append("specialty", filters.specialty);
  if (filters.maxDistance) params.append("maxDistance", filters.maxDistance.toString());
  if (filters.minRating) params.append("minRating", filters.minRating.toString());
  if (filters.availableNow) params.append("availableNow", "true");
  if (filters.verified) params.append("verified", "true");

  const response = await fetch(`${API_BASE}/workers/search?${params}`);
  
  if (!response.ok) {
    throw new Error("Failed to search workers");
  }

  return response.json();
}

export async function getWorker(id: string): Promise<Worker> {
  const response = await fetch(`${API_BASE}/workers/${id}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch worker");
  }

  return response.json();
}

export async function createJobRequest(request: InsertJobRequest): Promise<JobRequest> {
  const response = await fetch(`${API_BASE}/job-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create job request");
  }

  return response.json();
}

export async function getJobRequestsByUser(userId: string): Promise<JobRequest[]> {
  const response = await fetch(`${API_BASE}/job-requests/user/${userId}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch job requests");
  }

  return response.json();
}

export async function updateJobRequestStatus(id: string, status: string): Promise<JobRequest> {
  const response = await fetch(`${API_BASE}/job-requests/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Failed to update job request");
  }

  return response.json();
}
