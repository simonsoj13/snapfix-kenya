import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ServiceCategoryCard from "@/components/ServiceCategoryCard";
import WorkerMapView from "@/components/WorkerMapView";
import WorkerCard from "@/components/WorkerCard";
import WorkerProfileModal from "@/components/WorkerProfileModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getAllWorkers, searchWorkers } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import type { Worker } from "@shared/schema";
import {
  Wrench, Zap, Hammer, PaintBucket, Wind, Cpu,
  Camera, Package, Search, ShieldCheck, X, LocateFixed, Clock,
  Paintbrush, FlameKindling, Star, Quote, Phone, Map, LayoutGrid,
} from "lucide-react";
import snapfixLogo from "/snapfix-logo.jpg";

const categories = [
  { icon: Wrench,        name: "Plumbing" },
  { icon: Zap,           name: "Electrical" },
  { icon: Hammer,        name: "Welding" },
  { icon: Paintbrush,    name: "Carpentry" },
  { icon: Wind,          name: "HVAC" },
  { icon: Cpu,           name: "Appliance" },
  { icon: PaintBucket,   name: "Painting" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

type Filter = "female-safe" | "nearby" | "available";

interface ReviewData {
  id: string;
  customerName: string;
  comment: string;
  rating: number;
  jobCategory: string;
  createdAt: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<Filter>>(new Set());
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const { data: reviews = [] } = useQuery<ReviewData[]>({
    queryKey: ["/api/reviews"],
  });

  const { data: workers = [] } = useQuery<Worker[]>({
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

  const handleSubmitSupport = async () => {
    if (!supportSubject || !supportMessage) return;
    await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user?.id,
        userName: user?.name,
        userRole: "customer",
        subject: supportSubject,
        message: supportMessage,
        status: "open",
        priority: "medium",
      }),
    });
    setSupportOpen(false);
    setSupportSubject("");
    setSupportMessage("");
  };

  const firstName = user?.name?.split(" ")[0] ?? "there";

  const displayedReviews = reviews.length > 0
    ? reviews.slice(0, 6)
    : [
        { id: "m1", customerName: "Alice Wanjiku", comment: "Fixed our burst pipe within 30 minutes. Professional and very clean work!", rating: 5, jobCategory: "Plumbing", createdAt: "" },
        { id: "m2", customerName: "James Kariuki",  comment: "Sarah rewired our apartment safely. Knowledgeable and explains everything.", rating: 5, jobCategory: "Electrical", createdAt: "" },
        { id: "m3", customerName: "Mary Njoku",     comment: "Built us custom kitchen cabinets. The craftsmanship is outstanding!", rating: 5, jobCategory: "Carpentry", createdAt: "" },
        { id: "m4", customerName: "Peter Omondi",   comment: "HVAC fixed within an hour. Came prepared with all spare parts. Highly recommend!", rating: 5, jobCategory: "HVAC", createdAt: "" },
        { id: "m5", customerName: "Fatuma Hassan",  comment: "Very professional woman fundi! Fixed my power issues fast and safely.", rating: 5, jobCategory: "Electrical", createdAt: "" },
        { id: "m6", customerName: "Tom Mbugua",     comment: "Repaired my washing machine in 20 minutes. Honest pricing, great service.", rating: 4, jobCategory: "Appliance", createdAt: "" },
      ];

  return (
    <div className="min-h-screen pb-20 md:pb-0">

      {/* ── Hero greeting ── */}
      <div className="bg-primary px-4 pt-5 pb-8">
        <div className="flex items-center gap-2 mb-3">
          <img src={snapfixLogo} alt="Snap-Fix Kenya" className="w-8 h-8 rounded-lg object-cover" />
        </div>
        <p className="text-primary-foreground/80 text-sm font-medium">{getGreeting()},</p>
        <h1 className="text-primary-foreground text-xl font-bold mb-4">{firstName} — what needs fixing?</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for services…"
            className="pl-9 rounded-full bg-background/95 border-0 shadow-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div className="px-4 -mt-3 flex gap-2 flex-wrap mb-2">
        {([
          { key: "female-safe" as Filter, label: "Female-Safe Workers Only", icon: ShieldCheck },
          { key: "nearby" as Filter,      label: "Nearby",      icon: LocateFixed },
          { key: "available" as Filter,   label: "Available Now", icon: Clock },
        ] as const).map(({ key, label, icon: Icon }) => {
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
              <Icon className="w-3 h-3" />{label}
              {active && <X className="w-3 h-3 ml-0.5" />}
            </button>
          );
        })}
      </div>

      <div className="px-4 space-y-6 pt-3">

        {/* ── Big CTA buttons ── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate("/book" + (selectedCategory ? "?category=" + selectedCategory : ""))}
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
              <button type="button" className="text-xs text-primary flex items-center gap-1" onClick={() => setSelectedCategory(null)}>
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((c) => (
              <ServiceCategoryCard
                key={c.name}
                icon={c.icon}
                name={c.name}
                isSelected={selectedCategory === c.name}
                onClick={() => navigate("/book?category=" + encodeURIComponent(c.name))}
              />
            ))}
          </div>
          
          {/* Emergency + Support buttons */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => navigate("/book?category=Emergency")}
              className="flex items-center gap-3 p-4 rounded-xl bg-red-500 text-white font-semibold shadow-lg active:scale-95 transition-transform"
            >
              <FlameKindling className="w-6 h-6 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-bold">Emergency</p>
                <p className="text-xs opacity-80">Fast response 24/7</p>
              </div>
            </button>
            <button
              onClick={() => navigate("/support")}
              className="flex items-center gap-3 p-4 rounded-xl bg-blue-500 text-white font-semibold shadow-lg active:scale-95 transition-transform"
            >
              <Phone className="w-6 h-6 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-bold">Support</p>
                <p className="text-xs opacity-80">Get help fast</p>
              </div>
            </button>
          </div>
        </div>

        {/* ── Customer Reviews ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <h2 className="text-base font-semibold">What Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <Quote className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {review.comment}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{review.customerName}</p>
                      <Badge className="bg-primary/10 text-primary border-0 text-xs mt-0.5">
                        {review.jobCategory}
                      </Badge>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Worker list (category filtered only) ── */}
        {selectedCategory && (
          <div>
            <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
              <h2 className="text-base font-semibold">{selectedCategory} Workers Nearby</h2>
              <div className="flex gap-1.5">
                <Button variant={viewMode === "grid" ? "default" : "outline"} size="icon" onClick={() => setViewMode("grid")} data-testid="button-grid-view">
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button variant={viewMode === "map" ? "default" : "outline"} size="icon" onClick={() => setViewMode("map")} data-testid="button-map-view">
                  <Map className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {viewMode === "map" ? (
              <div className="h-72 rounded-xl overflow-hidden border">
                <WorkerMapView workers={workers} onWorkerClick={(w) => setSelectedWorker(w)} />
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
                    onRequest={() => navigate("/book?workerId=" + w.id + "&category=" + (selectedCategory || w.specialty))}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Support CTA ── */}
        <div>
          <Card className="border-primary/20">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Need Help?</p>
                <p className="text-xs text-muted-foreground">Our support team is here for you 24/7</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSupportOpen(true)} data-testid="button-open-support">
                Contact
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Worker Profile Modal */}
      <WorkerProfileModal
        worker={selectedWorker}
        open={!!selectedWorker}
        onClose={() => setSelectedWorker(null)}
      />

      {/* Support Dialog */}
      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Contact Support
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input placeholder="e.g. Issue with my booking" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} data-testid="input-support-subject" />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea placeholder="Describe your issue…" value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} className="min-h-24" data-testid="textarea-support-message" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSupportOpen(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!supportSubject || !supportMessage} onClick={handleSubmitSupport} data-testid="button-submit-support">
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
