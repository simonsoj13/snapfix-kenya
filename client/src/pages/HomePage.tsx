import { useState } from "react";
import PhotoUploadCard from "@/components/PhotoUploadCard";
import ServiceCategoryCard from "@/components/ServiceCategoryCard";
import WorkerCard from "@/components/WorkerCard";
import AIAnalysisCard from "@/components/AIAnalysisCard";
import {
  Wrench,
  Zap,
  Hammer,
  PaintBucket,
  Wind,
  Cpu,
} from "lucide-react";
import heroImage from "@assets/generated_images/Hero_section_skilled_workers_76d96d56.png";
import plumberImage from "@assets/generated_images/Plumber_profile_photo_d5e1cff1.png";
import electricianImage from "@assets/generated_images/Electrician_profile_photo_51938b86.png";
import welderImage from "@assets/generated_images/Welder_profile_photo_d7ee56b2.png";
import carpenterImage from "@assets/generated_images/Carpenter_profile_photo_6c8a5025.png";

//todo: remove mock functionality
const categories = [
  { icon: Wrench, name: "Plumbing" },
  { icon: Zap, name: "Electrical" },
  { icon: Hammer, name: "Welding" },
  { icon: PaintBucket, name: "Carpentry" },
  { icon: Wind, name: "HVAC" },
  { icon: Cpu, name: "Appliance" },
];

//todo: remove mock functionality
const mockWorkers = [
  {
    id: "1",
    name: "John Smith",
    specialty: "Master Plumber",
    hourlyRate: 85,
    rating: 4.9,
    reviewCount: 127,
    distance: 2.3,
    profileImage: plumberImage,
    verified: true,
    availableNow: true,
  },
  {
    id: "2",
    name: "Sarah Johnson",
    specialty: "Licensed Electrician",
    hourlyRate: 95,
    rating: 4.8,
    reviewCount: 94,
    distance: 3.1,
    profileImage: electricianImage,
    verified: true,
    availableNow: false,
  },
  {
    id: "3",
    name: "Mike Chen",
    specialty: "Certified Welder",
    hourlyRate: 78,
    rating: 4.7,
    reviewCount: 86,
    distance: 4.5,
    profileImage: welderImage,
    verified: true,
    availableNow: true,
  },
  {
    id: "4",
    name: "David Martinez",
    specialty: "Master Carpenter",
    hourlyRate: 82,
    rating: 4.9,
    reviewCount: 112,
    distance: 1.8,
    profileImage: carpenterImage,
    verified: true,
    availableNow: false,
  },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisDescription, setAnalysisDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setIsAnalyzing(true);
    
    //todo: remove mock functionality - Replace with actual AI analysis
    setTimeout(() => {
      setAnalysisDescription(
        "Kitchen sink has a leak under the basin. Water is dripping from the pipe connection. Needs immediate attention to prevent water damage."
      );
      setIsAnalyzing(false);
      setShowAnalysis(true);
    }, 2000);
  };

  const handleFindWorkers = () => {
    setShowAnalysis(false);
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6)), url(${heroImage})`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Find Skilled Workers Near You
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Take a photo of your repair need and get matched with qualified
              professionals instantly
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {showAnalysis && uploadedFile ? (
              <AIAnalysisCard
                imageUrl={URL.createObjectURL(uploadedFile)}
                description={analysisDescription}
                category="Plumbing"
                confidence={95}
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
              onClick={() => setSelectedCategory(category.name)}
            />
          ))}
        </div>
      </div>

      {/* Featured Workers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Top Rated Workers Nearby</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockWorkers.map((worker) => (
            <WorkerCard
              key={worker.id}
              {...worker}
              onViewProfile={() => console.log("View profile:", worker.id)}
              onRequest={() => console.log("Request service:", worker.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
