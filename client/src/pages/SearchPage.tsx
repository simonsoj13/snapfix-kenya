import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SearchBar from "@/components/SearchBar";
import WorkerCard from "@/components/WorkerCard";
import ServiceCategoryCard from "@/components/ServiceCategoryCard";
import WorkerProfileModal from "@/components/WorkerProfileModal";
import WorkerMapView from "@/components/WorkerMapView";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { searchWorkers, createJobRequest } from "@/lib/api";
import type { Worker } from "@shared/schema";
import {
  Wrench, Zap, Hammer, PaintBucket, Wind, Cpu,
  Map, LayoutGrid, SlidersHorizontal,
} from "lucide-react";

const categories = [
  { icon: Wrench, name: "Plumbing" },
  { icon: Zap, name: "Electrical" },
  { icon: Hammer, name: "Welding" },
  { icon: PaintBucket, name: "Carpentry" },
  { icon: Wind, name: "HVAC" },
  { icon: Cpu, name: "Appliance" },
];

const DEMO_USER_ID = "demo-user-1";

export default function SearchPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [distanceRange, setDistanceRange] = useState([20]);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const { data: workers = [], isLoading } = useQuery<Worker[]>({
    queryKey: [
      "/api/workers/search",
      selectedCategories,
      priceRange,
      distanceRange,
      showAvailableOnly,
      showVerifiedOnly,
    ],
    queryFn: () =>
      searchWorkers({
        specialty: selectedCategories.length === 1 ? selectedCategories[0] : undefined,
        maxDistance: distanceRange[0],
        availableNow: showAvailableOnly,
        verified: showVerifiedOnly,
      }),
  });

  const createRequestMutation = useMutation({
    mutationFn: createJobRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/job-requests/user", DEMO_USER_ID] });
      toast({ title: "Request sent!", description: "The worker will respond shortly." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit request.", variant: "destructive" });
    },
  });

  // Client-side filter by search query and price range
  const filteredWorkers = workers.filter((w) => {
    const matchesQuery =
      !searchQuery ||
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = w.hourlyRate >= priceRange[0] && w.hourlyRate <= priceRange[1];
    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(w.specialty);
    return matchesQuery && matchesPrice && matchesCategory;
  });

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 200]);
    setDistanceRange([20]);
    setShowAvailableOnly(false);
    setShowVerifiedOnly(false);
    setSearchQuery("");
  };

  const handleRequestSubmit = async (
    workerId: string,
    description: string,
    location: string,
    preferredDate: string
  ) => {
    await createRequestMutation.mutateAsync({
      userId: DEMO_USER_ID,
      workerId,
      imageUrl: "",
      description,
      category: selectedWorker?.specialty ?? "General",
      status: "pending",
      location,
      preferredDate: preferredDate || null,
      budget: null,
    });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="font-semibold">Service Type</h3>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <ServiceCategoryCard
              key={cat.name}
              icon={cat.icon}
              name={cat.name}
              isSelected={selectedCategories.includes(cat.name)}
              onClick={() => toggleCategory(cat.name)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <h3 className="font-semibold">Hourly Rate</h3>
          <span className="text-sm text-muted-foreground">${priceRange[0]} – ${priceRange[1]}</span>
        </div>
        <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={200} step={5} data-testid="slider-price" />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <h3 className="font-semibold">Max Distance</h3>
          <span className="text-sm text-muted-foreground">{distanceRange[0]} miles</span>
        </div>
        <Slider value={distanceRange} onValueChange={setDistanceRange} min={1} max={50} step={1} data-testid="slider-distance" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox id="avail" checked={showAvailableOnly} onCheckedChange={(c) => setShowAvailableOnly(!!c)} data-testid="checkbox-available" />
          <Label htmlFor="avail" className="cursor-pointer">Available Now Only</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="verif" checked={showVerifiedOnly} onCheckedChange={(c) => setShowVerifiedOnly(!!c)} data-testid="checkbox-verified" />
          <Label htmlFor="verif" className="cursor-pointer">Verified Workers Only</Label>
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={clearFilters} data-testid="button-clear-filters">
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search Bar */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1">
            <SearchBar
              onSearch={setSearchQuery}
              onFilterClick={() => setFilterOpen(true)}
            />
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop filter sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Card className="p-6 sticky top-20">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>
              <FilterContent />
            </Card>
          </aside>

          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Searching..." : `${filteredWorkers.length} workers found`}
              </p>
              <div className="flex gap-2">
                <Button variant={viewMode === "grid" ? "default" : "outline"} size="icon" onClick={() => setViewMode("grid")} data-testid="button-grid-view">
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button variant={viewMode === "map" ? "default" : "outline"} size="icon" onClick={() => setViewMode("map")} data-testid="button-map-view">
                  <Map className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : viewMode === "map" ? (
              <div className="h-[520px] rounded-lg overflow-hidden border">
                <WorkerMapView
                  workers={filteredWorkers}
                  onWorkerClick={setSelectedWorker}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredWorkers.map((worker) => (
                  <WorkerCard
                    key={worker.id}
                    {...worker}
                    verified={worker.verified === 1}
                    availableNow={worker.availableNow === 1}
                    onViewProfile={() => setSelectedWorker(worker)}
                    onRequest={() => setSelectedWorker(worker)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Narrow your search</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>

      <WorkerProfileModal
        worker={selectedWorker}
        open={!!selectedWorker}
        onClose={() => setSelectedWorker(null)}
        onRequestSubmit={handleRequestSubmit}
      />
    </div>
  );
}
