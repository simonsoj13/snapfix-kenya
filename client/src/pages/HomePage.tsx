import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ServiceCategoryCard from "@/components/ServiceCategoryCard";
import WorkerCard from "@/components/WorkerCard";
import WorkerProfileModal from "@/components/WorkerProfileModal";
import WorkerMapView from "@/components/WorkerMapView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getAllWorkers, searchWorkers } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import type { Worker } from "@shared/schema";
import {
  Wrench, Zap, Hammer, PaintBucket, Wind, Cpu, Map, LayoutGrid,
  Camera, Package, Search, ShieldCheck, X, LocateFixed, Clock,
  Paintbrush, FlameKindling,
} from "lucide-react";

const categories = [
  { icon: Wrench,       name: "Plumbing" },
  { icon: Zap,          name: "Electrical" },
  { icon: Hammer,       name: "Welding" },
  { icon: Paintbrush,   name: "Carpentry" },
  { icon: Wind,         name: "HVAC" },
  { icon: Cpu,          name: "Appliance" },
  { icon: PaintBucket,  name: "Painting" },
  { icon: FlameKindling, name: "Emergency" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

type Filter = "female-safe" | "nearby" | "available";

export default function HomePage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<Filter>>(new Set());

  const { data: workers = [], isLoading: loadingWorkers } = useQuery<Worker[]>({
    queryKey: ["/api/workers/search", selectedCategory],
    queryFn: () =>
      selectedCategory
        ? searchWorkers({ specialty: selectedCategory })
        : getAllWorkers(),
  });

  const toggleFilter = (f: Filter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  };

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen pb-20 md:pb-0">

      {/* ── Hero greeting banner ── */}
      <div className="bg-primary px-4 pt-6 pb-8">
        <p className="text-primary-foreground/80 text-sm font-medium mb-1">{getGreeting()},</p>
        <h1 className="text-primary-foreground text-2xl font-bold mb-5">{firstName} — what needs fixing?</h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for services..."
            className="pl-9 rounded-full bg-background/95 border-0 shadow-md text-foreground placeholder:text-muted-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div className="px-4 -mt-3 flex gap-2 flex-wrap mb-2">
        {(
          [
            { key: "female-safe" as Filter, label: "Female-Safe Workers Only", icon: ShieldCheck },
            { key: "nearby" as Filter, label: "Nearby", icon: LocateFixed },
            { key: "available" as Filter, label: "Available Now", icon: Clock },
          ] as const
        ).map(({ key, label, icon: Icon }) => {
          const active = activeFilters.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleFilter(key)}
              data-testid={`filter-${key}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover-elevate"
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
              {active && <X className="w-3 h-3 ml-0.5" />}
            </button>
          );
        })}
      </div>

      <div className="px-4 space-y-6 pt-4">

        {/* ── Big CTA buttons ── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate("/book")}
            data-testid="button-start-booking"
            className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover-elevate active-elevate-2"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-sm">Upload Photo</span>
            <span className="text-xs font-normal opacity-80">AI-powered quote</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/book")}
            data-testid="button-landlord-bundles"
            style={{ backgroundColor: "hsl(var(--fixit-orange))", color: "hsl(var(--fixit-orange-foreground))" }}
            className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl font-semibold shadow-md hover-elevate active-elevate-2"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-sm">Landlord Bundles</span>
            <span className="text-xs font-normal opacity-80">Multi-repair deals</span>
          </button>
        </div>

        {/* ── Service categories ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Browse Services</h2>
            {selectedCategory && (
              <button
                type="button"
                className="text-xs text-primary flex items-center gap-1"
                onClick={() => setSelectedCategory(null)}
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
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

        {/* ── Workers section ── */}
        <div>
          <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
            <h2 className="text-base font-semibold">
              {selectedCategory ? `${selectedCategory} Workers` : "Top Workers Nearby"}
            </h2>
            <div className="flex gap-1.5">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : viewMode === "map" ? (
            <div className="h-80 rounded-xl overflow-hidden border">
              <WorkerMapView
                workers={workers}
                onWorkerClick={(worker) => setSelectedWorker(worker)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      </div>

      {/* Worker Profile Modal */}
      <WorkerProfileModal
        worker={selectedWorker}
        open={!!selectedWorker}
        onClose={() => setSelectedWorker(null)}
      />
    </div>
  );
}
