import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PhotoUploadCard from "@/components/PhotoUploadCard";
import ServiceCategoryCard from "@/components/ServiceCategoryCard";
import WorkerCard from "@/components/WorkerCard";
import AIAnalysisCard from "@/components/AIAnalysisCard";
import WorkerProfileModal from "@/components/WorkerProfileModal";
import WorkerMapView from "@/components/WorkerMapView";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { analyzeImage, getAllWorkers, searchWorkers, createJobRequest } from "@/lib/api";
import type { Worker } from "@shared/schema";
import {
  Wrench,
  Zap,
  Hammer,
  PaintBucket,
  Wind,
  Cpu,
  Map,
  LayoutGrid,
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

const DEMO_USER_ID = "demo-user-1";

export default function HomePage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisDescription, setAnalysisDescription] = useState("");
  const [analysisCategory, setAnalysisCategory] = useState("General");
  const [analysisConfidence, setAnalysisConfidence] = useState(95);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  // Fetch workers - filtered by category if selected
  const { data: workers = [], isLoading: loadingWorkers } = useQuery<Worker[]>({
    queryKey: ["/api/workers/search", selectedCategory],
    queryFn: () =>
      selectedCategory
        ? searchWorkers({ specialty: selectedCategory })
        : getAllWorkers(),
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

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadedFile(file);
    setIsAnalyzing(true);
    setShowAnalysis(true);
    try {
      const result = await analyzeImage(file);
      setAnalysisDescription(result.description);
      setAnalysisCategory(result.category);
      setAnalysisConfidence(result.confidence);
      // Auto-select the detected category
      setSelectedCategory(result.category);
    } catch (err: any) {
      // Fallback if no API key yet
      setAnalysisDescription(
        "Repair issue detected. Please edit this description to provide more details about what needs to be fixed."
      );
      setAnalysisCategory("General");
      toast({
        title: "AI Analysis",
        description: err.message?.includes("not configured")
          ? "Add an OpenAI API key to enable AI analysis. Showing placeholder for now."
          : "Could not analyze image. Please describe the issue manually.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  const handleFindWorkers = () => {
    setShowAnalysis(false);
    setUploadedFile(null);
    window.scrollTo({ top: 600, behavior: "smooth" });
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
      imageUrl: uploadedFile ? URL.createObjectURL(uploadedFile) : "",
      description,
      category: analysisCategory,
      status: "pending",
      location,
      preferredDate: preferredDate || null,
      budget: null,
    });
  };

  const imageUrl = uploadedFile ? URL.createObjectURL(uploadedFile) : "";

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.65)), url(${heroImage})`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Find Skilled Workers Near You
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Take a photo of your repair need and get matched with qualified professionals instantly
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {showAnalysis && uploadedFile ? (
              <AIAnalysisCard
                imageUrl={imageUrl}
                description={analysisDescription}
                category={analysisCategory}
                confidence={analysisConfidence}
                isLoading={isAnalyzing}
                onDescriptionChange={setAnalysisDescription}
                onFindWorkers={handleFindWorkers}
              />
            ) : (
              <PhotoUploadCard onFileSelect={handleFileSelect} />
            )}
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

      {/* Workers Section */}
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
                onRequest={() => setSelectedWorker(worker)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Worker Profile Modal */}
      <WorkerProfileModal
        worker={selectedWorker}
        open={!!selectedWorker}
        onClose={() => setSelectedWorker(null)}
        onRequestSubmit={handleRequestSubmit}
        prefillDescription={analysisDescription}
      />
    </div>
  );
}
