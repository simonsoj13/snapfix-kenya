import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ServiceCategoryCard from "@/components/ServiceCategoryCard";
import WorkerCard from "@/components/WorkerCard";
import WorkerProfileModal from "@/components/WorkerProfileModal";
import WorkerMapView from "@/components/WorkerMapView";
import { Button } from "@/components/ui/button";
import { getAllWorkers, searchWorkers } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import type { Worker } from "@shared/schema";
import {
  Wrench, Zap, Hammer, PaintBucket, Wind, Cpu, Map, LayoutGrid, Camera,
} from "lucide-react";
import heroImage from "@assets/generated_images/Hero_section_skilled_workers_76d96d56.png";

const categories = [
  { icon: Wrench, name: "Plumbing" },
  { icon: Zap, name: "Electrical" },
  { icon: Hammer, name: "Welding" },
  { icon: PaintBucket, name: "Carpentry" },
  { icon: Wind, name: "HVAC" },
  { icon: Cpu, name: "Appliance" },
];

export default function HomePage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const { data: workers = [], isLoading: loadingWorkers } = useQuery<Worker[]>({
    queryKey: ["/api/workers/search", selectedCategory],
    queryFn: () =>
      selectedCategory
        ? searchWorkers({ specialty: selectedCategory })
        : getAllWorkers(),
  });

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.70)), url(${heroImage})`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Find Skilled Workers Near You
            </h1>
            <p className="text-xl text-white/85 mb-3">
              Hi {user?.name?.split(" ")[0]} — what needs fixing today?
            </p>
            <p className="text-white/70 mb-10 text-sm">
              Take a photo, get an instant AI quote, and book a verified professional in minutes.
            </p>
            <Button
              size="lg"
              className="gap-2 text-base px-8 py-6"
              onClick={() => navigate("/book")}
              data-testid="button-start-booking"
            >
              <Camera className="w-5 h-5" />
              Book a Repair Now
            </Button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-semibold mb-6">Browse by Service</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <ServiceCategoryCard
              key={category.name}
              icon={category.icon}
              name={category.name}
              isSelected={selectedCategory === category.name}
              onClick={() =>
                setSelectedCategory((prev) =>
                  prev === category.name ? null : category.name
                )
              }
            />
          ))}
        </div>
      </div>

      {/* Workers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h2 className="text-2xl font-semibold">
            {selectedCategory ? `${selectedCategory} Workers Nearby` : "Top Rated Workers Nearby"}
          </h2>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              data-testid="button-grid-view"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("map")}
              data-testid="button-map-view"
            >
              <Map className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loadingWorkers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : viewMode === "map" ? (
          <div className="h-[500px] rounded-lg overflow-hidden border">
            <WorkerMapView
              workers={workers}
              onWorkerClick={(worker) => setSelectedWorker(worker)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {workers.map((worker) => (
              <WorkerCard
                key={worker.id}
                {...worker}
                verified={worker.verified === 1}
                availableNow={worker.availableNow === 1}
                onViewProfile={() => setSelectedWorker(worker)}
                onRequest={() => navigate("/book")}
              />
            ))}
          </div>
        )}
      </div>

      {/* Worker Profile Modal (view only from home) */}
      <WorkerProfileModal
        worker={selectedWorker}
        open={!!selectedWorker}
        onClose={() => setSelectedWorker(null)}
      />
    </div>
  );
}
