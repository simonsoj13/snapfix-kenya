import WorkerMapView from "../WorkerMapView";
import type { Worker } from "@shared/schema";

const mockWorkers: Worker[] = [
  {
    id: "1",
    name: "John Smith",
    specialty: "Plumbing",
    hourlyRate: 85,
    rating: 4.9,
    reviewCount: 127,
    distance: 2.3,
    location: "Brooklyn, NY",
    bio: "Expert plumber",
    yearsExperience: 15,
    jobsCompleted: 450,
    responseTime: "< 30 min",
    verified: 1,
    profileImage: "/api/placeholder.jpg",
    availableNow: 1,
    email: "",
    phone: "",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    specialty: "Electrical",
    hourlyRate: 95,
    rating: 4.8,
    reviewCount: 94,
    distance: 3.1,
    location: "Queens, NY",
    bio: "Licensed electrician",
    yearsExperience: 12,
    jobsCompleted: 380,
    responseTime: "< 1 hour",
    verified: 1,
    profileImage: "/api/placeholder.jpg",
    availableNow: 0,
    email: "",
    phone: "",
  },
];

export default function WorkerMapViewExample() {
  return (
    <div className="h-[500px] w-full">
      <WorkerMapView
        workers={mockWorkers}
        onWorkerClick={(worker) => console.log("Worker clicked:", worker.name)}
      />
    </div>
  );
}
