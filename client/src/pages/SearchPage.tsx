import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import WorkerCard from "@/components/WorkerCard";
import ServiceCategoryCard from "@/components/ServiceCategoryCard";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Wrench,
  Zap,
  Hammer,
  PaintBucket,
} from "lucide-react";
import plumberImage from "@assets/generated_images/Plumber_profile_photo_d5e1cff1.png";
import electricianImage from "@assets/generated_images/Electrician_profile_photo_51938b86.png";

//todo: remove mock functionality
const categories = [
  { icon: Wrench, name: "Plumbing" },
  { icon: Zap, name: "Electrical" },
  { icon: Hammer, name: "Welding" },
  { icon: PaintBucket, name: "Carpentry" },
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
];

export default function SearchPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [distance, setDistance] = useState([10]);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold">Service Type</h3>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => (
            <ServiceCategoryCard
              key={category.name}
              icon={category.icon}
              name={category.name}
              isSelected={selectedCategories.includes(category.name)}
              onClick={() => toggleCategory(category.name)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Hourly Rate</h3>
          <span className="text-sm text-muted-foreground">
            ${priceRange[0]} - ${priceRange[1]}
          </span>
        </div>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={200}
          step={5}
          data-testid="slider-price-range"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Distance</h3>
          <span className="text-sm text-muted-foreground">
            {distance[0]} miles
          </span>
        </div>
        <Slider
          value={distance}
          onValueChange={setDistance}
          min={1}
          max={50}
          step={1}
          data-testid="slider-distance"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="available"
            checked={showAvailableOnly}
            onCheckedChange={(checked) => setShowAvailableOnly(checked as boolean)}
            data-testid="checkbox-available"
          />
          <Label htmlFor="available" className="cursor-pointer">
            Available Now Only
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="verified"
            checked={showVerifiedOnly}
            onCheckedChange={(checked) => setShowVerifiedOnly(checked as boolean)}
            data-testid="checkbox-verified"
          />
          <Label htmlFor="verified" className="cursor-pointer">
            Verified Workers Only
          </Label>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setSelectedCategories([]);
          setPriceRange([0, 200]);
          setDistance([10]);
          setShowAvailableOnly(false);
          setShowVerifiedOnly(false);
        }}
        data-testid="button-clear-filters"
      >
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <Sheet>
            <SheetTrigger asChild>
              <div>
                <SearchBar
                  onSearch={(query) => console.log("Search:", query)}
                  onFilterClick={() => {}}
                />
              </div>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Refine your search to find the perfect worker
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Filter Sidebar */}
        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Card className="p-6 sticky top-20">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>
              <FilterContent />
            </Card>
          </aside>

          {/* Results */}
          <div className="flex-1">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {mockWorkers.length} workers found
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
      </div>
    </div>
  );
}
