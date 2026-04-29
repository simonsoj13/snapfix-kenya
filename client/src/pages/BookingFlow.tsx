import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import PhotoUploadCard from "@/components/PhotoUploadCard";
import { analyzeImage } from "@/lib/api";
import { getWorkerImage } from "@/lib/workerImages";
import type { Worker, JobRequest } from "@shared/schema";
import {
  ArrowLeft, ArrowRight, Camera, MapPin, Clock, Star,
  CheckCircle2, Zap, Calendar, Phone, Mail,
  Smartphone, Banknote, ThumbsUp, BadgeCheck, TrendingDown, TrendingUp,
  ChevronRight,
} from "lucide-react";

function WorkerPhotos({ workerId }: { workerId: string }) {
  const { data } = useQuery<{ workSamples: string[]; workerName: string }>({
    queryKey: ["/api/workers", workerId, "work-samples"],
    queryFn: () => fetch(`/api/workers/${workerId}/work-samples`).then((r) => r.json()),
  });
  if (!data?.workSamples?.length) return null;
  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-xs text-muted-foreground mb-2 font-medium">Previous Work</p>
      <div className="grid grid-cols-3 gap-1.5">
        {data.workSamples.slice(0, 6).map((url, i) => (
          <img key={i} src={url} alt="work sample" className="w-full h-16 object-cover rounded-md border border-border" />
        ))}
      </div>
    </div>
  );
}

const AREAS = [
  { id: "bathroom",     label: "Bathroom" },
  { id: "kitchen",      label: "Kitchen" },
  { id: "sitting-room", label: "Sitting Room" },
  { id: "bedroom",      label: "Bedroom" },
  { id: "compound",     label: "Compound" },
];

const STEPS = ["Photo", "Describe", "Quote", "Worker", "Schedule", "Booked"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 px-4 py-3 overflow-x-auto">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1 flex-shrink-0">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              i < current
                ? "bg-primary text-primary-foreground"
                : i === current
                ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i < current ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={`text-xs hidden sm:inline ${i === current ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`w-4 h-px mx-1 ${i < current ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} data-testid={`star-${n}`} className="transition-transform active:scale-110">
          <Star className={`w-8 h-8 ${n <= value ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

function PaymentDialog({
  open, amount, label, onClose,
}: { open: boolean; amount: number; label: string; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            Pay via M-Pesa
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="bg-green-500/10 border border-green-500/20 rounded-md p-4 text-center space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">KES {amount.toLocaleString()}</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-md p-4 space-y-2">
            <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 uppercase tracking-wide">STK Push Unavailable</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Automatic M-Pesa push is currently offline. Please pay manually using the till number below.
            </p>
          </div>

          <div className="bg-muted rounded-md p-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground">M-Pesa Till Number</p>
            <p className="text-4xl font-bold tracking-widest text-primary">324225</p>
            <p className="text-xs text-muted-foreground">Snap-Fix Kenya</p>
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>1. Open M-Pesa on your phone</p>
            <p>2. Select <strong>Lipa na M-Pesa</strong></p>
            <p>3. Select <strong>Buy Goods & Services</strong></p>
            <p>4. Enter Till: <strong>324225</strong></p>
            <p>5. Enter amount: <strong>KES {amount.toLocaleString()}</strong></p>
            <p>6. Enter your PIN and confirm</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
              ⏳ After paying, wait for admin to confirm your payment. You will be notified before proceeding.
            </p>
          </div>

          <Button className="w-full" variant="outline" onClick={onClose}>
            I have paid — waiting for confirmation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface QuoteResult {
  min: number;
  max: number;
  midpoint: number;
  deposit: number;
  depositPercent: number;
  breakdown: string;
  category: string;
  area: string;
}

export default function BookingFlow() {
  const { user } = useAuth();
  const [currentPath, navigate] = useLocation();
  
  // Read URL params
  const urlParams = new URLSearchParams(currentPath.split('?')[1] || '');
  const urlCategory = urlParams.get('category');
  const urlWorkerId = urlParams.get('workerId');
  const { toast } = useToast();

  const STORAGE_KEY = "snapfix_booking_draft";

  const loadDraft = (): any => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  };
  const draft = loadDraft();

  const [step, setStep] = useState<number>(draft.step ?? 0);

  // Step 0
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>(draft.imageUrl ?? "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiCategory, setAiCategory] = useState<string>(draft.aiCategory ?? urlCategory ?? "General");

  // Step 1
  const [area, setArea] = useState<string>(draft.area ?? "");
  const [description, setDescription] = useState<string>(draft.description ?? "");
  const [location, setLocation] = useState<string>(draft.location ?? "");

  // Step 2
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quotingLoading, setQuotingLoading] = useState(false);

  // Step 3
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Step 4
  const [isNow, setIsNow] = useState<boolean>(draft.isNow ?? true);
  const [scheduledDate, setScheduledDate] = useState<string>(draft.scheduledDate ?? "");
  const [scheduledTime, setScheduledTime] = useState<string>(draft.scheduledTime ?? "");
  const [depositLoading, setDepositLoading] = useState(false);

  // Step 5
  const [jobRequest, setJobRequest] = useState<JobRequest | null>(null);

  // Step 6
  const [showStk, setShowStk] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  // Clear draft when booking complete
  const clearDraft = () => { try { localStorage.removeItem(STORAGE_KEY); } catch {} };

  // Auto-save on any field change so an accidental Home press doesn't lose progress
  useEffect(() => {
    if (step >= 5) return; // don't save once booking is confirmed
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        step, area, description, location, aiCategory,
        isNow, scheduledDate, scheduledTime,
        selectedWorkerId: selectedWorker?.id ?? null,
        imageUrl,
      }));
    } catch {}
  }, [step, area, description, location, aiCategory, isNow, scheduledDate, scheduledTime, selectedWorker, imageUrl]);

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers/search", aiCategory],
    queryFn: () =>
      aiCategory && aiCategory !== "General"
        ? fetch(`/api/workers/search?specialty=${encodeURIComponent(aiCategory)}`).then((r) => r.json())
        : fetch("/api/workers").then((r) => r.json()),
    enabled: step === 3,
  });

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
    setIsAnalyzing(true);
    try {
      const result = await analyzeImage(file);
      setAiCategory(result.category);
      setDescription(result.description !== "No image provided." ? result.description : "");
    } catch {
      setAiCategory("General");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleGetQuote = async () => {
    setQuotingLoading(true);
    setStep(2);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: aiCategory, area, description }),
      });
      const data = await res.json();
      setQuote(data);
    } catch {
      toast({ title: "Could not generate quote", variant: "destructive" });
      setStep(1);
    } finally {
      setQuotingLoading(false);
    }
  };

  const handleConfirmDeposit = async () => {
    if (!selectedWorker || !quote || !user) return;
    setDepositLoading(true);
    try {
      const res = await fetch("/api/job-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          workerId: selectedWorker.id,
          imageUrl: imageUrl || "",
          description,
          category: aiCategory,
          area,
          status: "deposit-paid",
          location,
          isNow: isNow ? 1 : 0,
          preferredDate: isNow ? null : `${scheduledDate} ${scheduledTime}`.trim(),
          budget: null,
          quotedMin: quote.min,
          quotedMax: quote.max,
          quotedAmount: quote.midpoint,
          depositAmount: quote.deposit,
          workerContactShown: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJobRequest(data);

      // Create transaction immediately so admin can see and approve it
      await fetch("/api/transactions/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRequestId: data.id,
          userId: user.id,
          customerName: user.name,
          workerName: selectedWorker.name,
          amount: quote.deposit,
          type: "deposit",
          status: "pending",
          phone: user.phone,
          mpesaRef: "PENDING-" + Date.now(),
          category: aiCategory,
        }),
      });

      setStep(5);
    } catch (err: any) {
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
    } finally {
      setDepositLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowStk(false);
    setPaymentDone(true);
    if (jobRequest) {
      await fetch(`/api/job-requests/${jobRequest.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
    }
  };

  const handleFinish = () => {
    clearDraft();
    toast({ title: "All done!", description: "Thank you for using Snap-Fix Kenya." });
    navigate("/requests");
  };

  const prev = () => setStep((s) => {
    const next = Math.max(0, s - 1);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: next, area, description, location, aiCategory, isNow, scheduledDate, scheduledTime, imageUrl })); } catch {}
    return next;
  });

  const goStep = (n: number) => {
    setStep(n);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: n, area, description, location, aiCategory, isNow, scheduledDate, scheduledTime, imageUrl })); } catch {}
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => (step === 0 ? navigate("/") : prev())} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-sm">Book a Repair</h1>
          <div className="ml-auto">
            <Badge variant="secondary">{STEPS[step]}</Badge>
          </div>
        </div>
        <StepBar current={step} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── Step 0: Photo ── */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Upload a Photo</h2>
              <p className="text-muted-foreground text-sm">Take or upload a photo — our AI identifies the repair type automatically.</p>
            </div>
            <PhotoUploadCard onFileSelect={handleFileSelect} />
            {isAnalyzing && (
              <Card><CardContent className="py-6 flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <div>
                  <p className="font-medium">Analysing your photo…</p>
                  <p className="text-xs text-muted-foreground">AI is identifying the repair type</p>
                </div>
              </CardContent></Card>
            )}
            {uploadedFile && !isAnalyzing && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Detected: {aiCategory}</span>
                </div>
                <Button className="w-full" onClick={() => setStep(1)} data-testid="button-next-describe">
                  Continue <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
            {!uploadedFile && (
              <Button variant="outline" className="w-full" onClick={() => setStep(1)} data-testid="button-skip-photo">
                Skip — describe the problem manually
              </Button>
            )}
          </div>
        )}

        {/* ── Step 1: Describe ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Describe the Problem</h2>
              <p className="text-muted-foreground text-sm">Tell us more so we can get you the right quote.</p>
            </div>
            <div className="space-y-3">
              <Label className="text-base font-semibold">Which area of the property?</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AREAS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setArea(a.id)}
                    data-testid={`button-area-${a.id}`}
                    className={`p-3 rounded-md border-2 text-sm font-medium transition-colors ${
                      area === a.id ? "border-primary bg-primary/5 text-primary" : "border-border hover-elevate"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">Describe the problem</Label>
              <Textarea
                id="description"
                placeholder="e.g. The tap is leaking and water is dripping under the sink…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-28"
                data-testid="textarea-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-base font-semibold">Your address / location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="e.g. Westlands, Nairobi"
                  className="pl-9"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  data-testid="input-location"
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleGetQuote}
              disabled={!area || !description.trim() || !location.trim()}
              data-testid="button-get-quote"
            >
              Get AI Quote <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Quote ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Your Price Estimate</h2>
              <p className="text-muted-foreground text-sm">AI-generated range based on your job details</p>
            </div>

            {quotingLoading ? (
              <Card>
                <CardContent className="py-12 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="font-semibold">AI Generating Quote…</p>
                    <p className="text-sm text-muted-foreground">Analysing job complexity and materials</p>
                  </div>
                </CardContent>
              </Card>
            ) : quote ? (
              <div className="space-y-4">
                {/* Price range card */}
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="py-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-sm">AI Price Range</span>
                      <Badge variant="secondary" className="ml-auto">{AREAS.find((a) => a.id === area)?.label}</Badge>
                    </div>

                    {/* Min / Mid / Max */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-background rounded-md">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingDown className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Minimum</p>
                        </div>
                        <p className="text-lg font-bold text-muted-foreground" data-testid="text-quote-min">
                          KES {quote.min.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-primary/10 rounded-md border border-primary/20">
                        <p className="text-xs text-primary font-medium mb-1">Recommended</p>
                        <p className="text-2xl font-bold text-primary" data-testid="text-quote-mid">
                          KES {quote.midpoint.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-background rounded-md">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Maximum</p>
                        </div>
                        <p className="text-lg font-bold text-muted-foreground" data-testid="text-quote-max">
                          KES {quote.max.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Deposit */}
                    <div className="flex items-center justify-between p-3 bg-background rounded-md">
                      <div>
                        <p className="text-sm font-semibold">Deposit Required ({quote.depositPercent}%)</p>
                        <p className="text-xs text-muted-foreground">Paid now to confirm booking</p>
                      </div>
                      <p className="text-xl font-bold" data-testid="text-deposit">
                        KES {quote.deposit.toLocaleString()}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground">{quote.breakdown}</p>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card>
                  <CardContent className="py-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium">{aiCategory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Area</span>
                      <span className="font-medium">{AREAS.find((a) => a.id === area)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{location}</span>
                    </div>
                  </CardContent>
                </Card>

                <p className="text-xs text-center text-muted-foreground">
                  Deposit paid upfront · Balance paid after work is completed to your satisfaction
                </p>
                <Button className="w-full" onClick={() => setStep(3)} data-testid="button-choose-worker">
                  Choose a Worker <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ) : null}
          </div>
        )}

        {/* ── Step 3: Worker selection ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Choose Your Fundi</h2>
              <p className="text-muted-foreground text-sm">Select the professional you'd like to book</p>
            </div>
            {workers.length === 0 ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {workers.map((worker) => (
                  <button
                    key={worker.id}
                    type="button"
                    onClick={() => setSelectedWorker(worker)}
                    data-testid={`button-select-worker-${worker.id}`}
                    className={`w-full text-left p-4 rounded-md border-2 transition-colors ${
                      selectedWorker?.id === worker.id ? "border-primary bg-primary/5" : "border-border hover-elevate"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage src={getWorkerImage(worker.specialty)} alt={worker.name} />
                        <AvatarFallback>{worker.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-semibold">{worker.name}</span>
                          {worker.verified === 1 && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                          {worker.availableNow === 1 && (
                            <Badge className="bg-primary/10 text-primary border-0 text-xs">Available</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{worker.specialty} · {worker.location}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            {worker.rating.toFixed(1)} ({worker.reviewCount})
                          </span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {worker.distance.toFixed(1)} km away
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {worker.responseTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Worker previous work samples */}
                    <WorkerPhotos workerId={worker.id} />
                  </button>
                ))}
                <Button
                  className="w-full"
                  disabled={!selectedWorker}
                  onClick={() => setStep(4)}
                  data-testid="button-confirm-worker"
                >
                  Book {selectedWorker?.name ?? "Selected Worker"} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Schedule ── */}
        {step === 4 && selectedWorker && quote && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Schedule & Pay Deposit</h2>
              <p className="text-muted-foreground text-sm">Confirm timing and pay the deposit to lock in your booking</p>
            </div>

            {/* Worker summary */}
            <Card>
              <CardContent className="py-4 flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={getWorkerImage(selectedWorker.specialty)} />
                  <AvatarFallback>{selectedWorker.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{selectedWorker.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedWorker.specialty} · {selectedWorker.location}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold text-sm">{selectedWorker.rating.toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Timing */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">When do you need the job done?</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsNow(true)}
                  data-testid="button-schedule-now"
                  className={`p-4 rounded-md border-2 text-sm font-medium text-center ${isNow ? "border-primary bg-primary/5" : "border-border hover-elevate"}`}
                >
                  <Zap className="w-5 h-5 mx-auto mb-1" />
                  Right Now
                  <p className="text-xs text-muted-foreground mt-0.5 font-normal">Immediate dispatch</p>
                </button>
                <button
                  type="button"
                  onClick={() => setIsNow(false)}
                  data-testid="button-schedule-later"
                  className={`p-4 rounded-md border-2 text-sm font-medium text-center ${!isNow ? "border-primary bg-primary/5" : "border-border hover-elevate"}`}
                >
                  <Calendar className="w-5 h-5 mx-auto mb-1" />
                  Schedule
                  <p className="text-xs text-muted-foreground mt-0.5 font-normal">Pick date & time</p>
                </button>
              </div>
              {!isNow && (
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} data-testid="input-date" />
                  <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} data-testid="input-time" />
                </div>
              )}
            </div>

            {/* Deposit summary */}
            <Card className="border-primary/20">
              <CardContent className="py-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated range</span>
                  <span className="font-medium">KES {quote.min.toLocaleString()} – {quote.max.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recommended price</span>
                  <span className="font-medium">KES {quote.midpoint.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Deposit ({quote.depositPercent}%)</span>
                  <span className="text-primary">KES {quote.deposit.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">Balance of ~KES {(quote.midpoint - quote.deposit).toLocaleString()} paid after service</p>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              onClick={handleConfirmDeposit}
              disabled={depositLoading || (!isNow && (!scheduledDate || !scheduledTime))}
            >
              {depositLoading ? "Confirming…" : `Pay Deposit KES ${quote.deposit.toLocaleString()} via M-Pesa`}
            </Button>
          </div>
        )}

        {/* ── Step 5: Booking confirmed ── */}
        {step === 5 && jobRequest && selectedWorker && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-1">Booking Confirmed!</h2>
              <p className="text-muted-foreground text-sm">Your fundi will arrive soon. Deposit payment required.</p>
            </div>

            <Card className="border-primary/20">
              <CardContent className="py-5 space-y-3">
                <h3 className="font-semibold">Worker Contact</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={getWorkerImage(selectedWorker.specialty)} />
                      <AvatarFallback>{selectedWorker.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedWorker.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedWorker.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md text-sm">
                    <Phone className="w-4 h-4 text-primary" />
                    <span>{selectedWorker.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md text-sm">
                    <Mail className="w-4 h-4 text-primary" />
                    <span>{selectedWorker.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full bg-green-600"
              onClick={() => setShowStk(true)}
              data-testid="button-pay-deposit"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Pay Deposit KES {quote?.deposit.toLocaleString()} via M-Pesa
            </Button>

            {showStk && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-md p-4 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Waiting for admin to confirm your payment…</p>
                <p className="text-xs text-muted-foreground">You will be able to proceed once payment is verified.</p>
              </div>
            )}

            <PaymentDialog
              open={showStk}
              amount={quote?.deposit ?? 0}
              label="Deposit Payment"
              onClose={() => setShowStk(true)}
            />
          </div>
        )}

        {/* ── Step 6: Payment & Review ── */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ThumbsUp className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-1">Job Complete!</h2>
              <p className="text-muted-foreground text-sm">Pay the balance and leave a review</p>
            </div>

            {!paymentDone ? (
              <>
                <Card className="border-primary/20">
                  <CardContent className="py-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Job total</span>
                      <span>KES {quote?.midpoint.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deposit paid</span>
                      <span className="text-green-600">- KES {quote?.deposit.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Balance Due</span>
                      <span className="text-primary">
                        KES {((quote?.midpoint ?? 0) - (quote?.deposit ?? 0)).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Button className="w-full bg-green-600" onClick={() => setShowStk(true)} data-testid="button-pay-balance">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Pay Balance via M-Pesa
                </Button>

                {showStk && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-md p-4 text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Waiting for admin to confirm your balance payment…</p>
                    <p className="text-xs text-muted-foreground">You will be able to proceed once payment is verified.</p>
                  </div>
                )}

                <PaymentDialog
                  open={showStk}
                  amount={(quote?.midpoint ?? 0) - (quote?.deposit ?? 0)}
                  label="Balance Payment"
                  onClose={() => setShowStk(true)}
                />
              </>
            ) : (
              <Card className="border-green-500/20">
                <CardContent className="py-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-700 dark:text-green-400">Payment received</span>
                  </div>
                  <h3 className="font-semibold">Rate your experience</h3>
                  <StarPicker value={rating} onChange={setRating} />
                  <Textarea
                    placeholder="Share your experience…"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="min-h-20"
                    data-testid="textarea-review"
                  />
                  <Button className="w-full" onClick={handleFinish} data-testid="button-finish">
                    Submit Review & Finish
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
