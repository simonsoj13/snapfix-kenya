import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Smartphone, Banknote, ThumbsUp, BadgeCheck, Gift,
} from "lucide-react";

// ── Area options ──────────────────────────────────────────────────────────────
const AREAS = [
  { id: "bathroom",     label: "Bathroom" },
  { id: "kitchen",      label: "Kitchen" },
  { id: "sitting-room", label: "Sitting Room" },
  { id: "bedroom",      label: "Bedroom" },
  { id: "compound",     label: "Compound" },
];

// ── Step indicator ────────────────────────────────────────────────────────────
const STEPS = ["Photo", "Describe", "Quote", "Worker", "Schedule", "Booked", "Payment"];

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

// ── Star picker ───────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          data-testid={`star-${n}`}
          className="transition-transform active:scale-110"
        >
          <Star className={`w-8 h-8 ${n <= value ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

// ── STK Push Dialog ───────────────────────────────────────────────────────────
function StkPushDialog({
  open,
  amount,
  phone,
  onSuccess,
  onClose,
}: {
  open: boolean;
  amount: number;
  phone: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [pin, setPin] = useState("");

  const handleConfirm = async () => {
    if (pin.length < 4) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2200));
    setProcessing(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            M-Pesa STK Push
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="bg-green-500/10 rounded-md p-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground">Payment request sent to</p>
            <p className="font-semibold">{phone}</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              KES {amount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Balance payment after service</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mpesa-pin">Enter M-Pesa PIN</Label>
            <Input
              id="mpesa-pin"
              type="password"
              maxLength={6}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="text-center text-xl tracking-widest"
              data-testid="input-mpesa-pin"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={processing}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleConfirm}
              disabled={pin.length < 4 || processing}
              data-testid="button-confirm-payment"
            >
              {processing ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BookingFlow() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(0);

  // Step 0: Photo
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiCategory, setAiCategory] = useState("General");

  // Step 1: Describe
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  // Step 2: Quote
  const [quote, setQuote] = useState<{ quoted: number; deposit: number; breakdown: string } | null>(null);
  const [quotingLoading, setQuotingLoading] = useState(false);

  // Step 3: Worker
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Step 4: Schedule
  const [isNow, setIsNow] = useState(true);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);

  // Step 5: Booking
  const [jobRequest, setJobRequest] = useState<JobRequest | null>(null);

  // Step 6: Payment
  const [showStk, setShowStk] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [rating, setRating] = useState(5);
  const [tip, setTip] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers/search", aiCategory],
    queryFn: () =>
      aiCategory && aiCategory !== "General"
        ? fetch(`/api/workers/search?specialty=${encodeURIComponent(aiCategory)}`).then((r) => r.json())
        : fetch("/api/workers").then((r) => r.json()),
    enabled: step === 3,
  });

  // ── Step handlers ────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadedFile(file);
    setImageUrl(URL.createObjectURL(file));
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
          quotedAmount: quote.quoted,
          depositAmount: quote.deposit,
          workerContactShown: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJobRequest(data);
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
    toast({ title: "All done!", description: "Thank you for using FixIt." });
    navigate("/requests");
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  // ── Renders ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (step === 0 ? navigate("/") : prev())}
            data-testid="button-back"
          >
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
              <p className="text-muted-foreground text-sm">
                Take or upload a photo of the problem — our AI will identify the repair type automatically.
              </p>
            </div>
            <PhotoUploadCard onFileSelect={handleFileSelect} />
            {isAnalyzing && (
              <Card>
                <CardContent className="py-6 flex items-center gap-3">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <div>
                    <p className="font-medium">Analysing your photo…</p>
                    <p className="text-xs text-muted-foreground">AI is identifying the repair type</p>
                  </div>
                </CardContent>
              </Card>
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
          </div>
        )}

        {/* ── Step 1: Describe ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Describe the Problem</h2>
              <p className="text-muted-foreground text-sm">
                Tell us a bit more so we can get you the right quote.
              </p>
            </div>

            {/* Area selector */}
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
                      area === a.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover-elevate"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">
                Describe the problem
              </Label>
              <Textarea
                id="description"
                placeholder="e.g. The tap is leaking and water is dripping under the sink…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-28"
                data-testid="textarea-description"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-base font-semibold">
                Your address / location
              </Label>
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
              <h2 className="text-2xl font-bold mb-1">Your Quote</h2>
              <p className="text-muted-foreground text-sm">Based on your description and area</p>
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
                {/* Quote card */}
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="py-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="font-semibold">AI-Generated Estimate</span>
                      <Badge variant="secondary" className="ml-auto">For {AREAS.find((a) => a.id === area)?.label}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-background rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">Total Quote</p>
                        <p className="text-3xl font-bold text-primary">
                          KES {quote.quoted.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-background rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">Deposit (30%)</p>
                        <p className="text-3xl font-bold">
                          KES {quote.deposit.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">{quote.breakdown}</p>
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
                  Deposit paid upfront · Balance paid after work is completed
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
              <h2 className="text-2xl font-bold mb-1">Choose Your Worker</h2>
              <p className="text-muted-foreground text-sm">
                Select the professional you'd like to book
              </p>
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
                      selectedWorker?.id === worker.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover-elevate"
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
                          {worker.verified === 1 && (
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                          {worker.availableNow === 1 && (
                            <Badge variant="secondary" className="text-xs">Available Now</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{worker.specialty} · {worker.location}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-0.5 text-xs">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            {worker.rating.toFixed(1)} ({worker.reviewCount})
                          </span>
                          <span className="text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-0.5" />{worker.responseTime}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold">KES {(worker.hourlyRate * 120).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">est. rate</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <Button
              className="w-full"
              disabled={!selectedWorker}
              onClick={() => setStep(4)}
              data-testid="button-next-schedule"
            >
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* ── Step 4: Schedule + Deposit ── */}
        {step === 4 && selectedWorker && quote && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Schedule &amp; Deposit</h2>
              <p className="text-muted-foreground text-sm">
                Choose when you'd like the work done and confirm your deposit
              </p>
            </div>

            {/* When */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">When do you need the service?</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsNow(true)}
                  data-testid="button-schedule-now"
                  className={`p-4 rounded-md border-2 flex flex-col items-center gap-2 transition-colors ${
                    isNow ? "border-primary bg-primary/5" : "border-border hover-elevate"
                  }`}
                >
                  <Zap className={`w-6 h-6 ${isNow ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="font-medium text-sm">Right Now</span>
                  <span className="text-xs text-muted-foreground">Immediate dispatch</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsNow(false)}
                  data-testid="button-schedule-later"
                  className={`p-4 rounded-md border-2 flex flex-col items-center gap-2 transition-colors ${
                    !isNow ? "border-primary bg-primary/5" : "border-border hover-elevate"
                  }`}
                >
                  <Calendar className={`w-6 h-6 ${!isNow ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="font-medium text-sm">Schedule</span>
                  <span className="text-xs text-muted-foreground">Pick a date &amp; time</span>
                </button>
              </div>

              {!isNow && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="sched-date">Date</Label>
                    <Input
                      id="sched-date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      data-testid="input-scheduled-date"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sched-time">Time</Label>
                    <Input
                      id="sched-time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      data-testid="input-scheduled-time"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Deposit summary */}
            <Card className="bg-muted/30">
              <CardContent className="py-4 space-y-3">
                <p className="font-semibold">Deposit to Confirm Booking</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Worker</span>
                    <span className="font-medium">{selectedWorker.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total quote</span>
                    <span className="font-medium">KES {quote.quoted.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>Deposit due now</span>
                    <span className="text-primary">KES {quote.deposit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance after work</span>
                    <span className="font-medium">KES {(quote.quoted - quote.deposit).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deposit is paid via M-Pesa. Balance collected via STK push after work is completed.
                </p>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              onClick={handleConfirmDeposit}
              disabled={depositLoading || (!isNow && (!scheduledDate || !scheduledTime))}
              data-testid="button-confirm-deposit"
            >
              {depositLoading ? "Processing…" : `Pay Deposit · KES ${quote.deposit.toLocaleString()}`}
            </Button>
          </div>
        )}

        {/* ── Step 5: Booked / Worker contact ── */}
        {step === 5 && selectedWorker && quote && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-1">Booking Confirmed!</h2>
              <p className="text-muted-foreground text-sm">
                Your deposit of <strong>KES {quote.deposit.toLocaleString()}</strong> has been received.
                {isNow
                  ? " Your worker is on their way."
                  : ` Scheduled for ${scheduledDate} at ${scheduledTime}.`}
              </p>
            </div>

            {/* Worker deployed card */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary animate-pulse" />
                  Worker Deployed
                  {isNow && <Badge variant="secondary" className="ml-auto animate-pulse">En Route</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={getWorkerImage(selectedWorker.specialty)} />
                    <AvatarFallback>{selectedWorker.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-lg">{selectedWorker.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedWorker.specialty}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-medium">{selectedWorker.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">· {selectedWorker.yearsExperience} yrs exp</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact details — revealed after deposit */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Worker Contact
                  </p>
                  <a
                    href={`tel:${selectedWorker.phone}`}
                    className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover-elevate"
                    data-testid="link-worker-phone"
                  >
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="font-medium">{selectedWorker.phone}</span>
                  </a>
                  <a
                    href={`mailto:${selectedWorker.email}`}
                    className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover-elevate"
                    data-testid="link-worker-email"
                  >
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="font-medium">{selectedWorker.email}</span>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Balance reminder */}
            <Card>
              <CardContent className="py-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit paid</span>
                  <span className="text-green-600 font-medium">KES {quote.deposit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Balance (pay after work)</span>
                  <span>KES {(quote.quoted - quote.deposit).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              onClick={() => setStep(6)}
              data-testid="button-work-done"
            >
              <Banknote className="w-4 h-4 mr-2" />
              Work Done — Pay Balance
            </Button>
          </div>
        )}

        {/* ── Step 6: Payment + Rating ── */}
        {step === 6 && selectedWorker && quote && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {paymentDone ? "All Done!" : "Pay &amp; Rate"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {paymentDone
                  ? "Thank you for using FixIt. Your review helps other customers."
                  : "Pay the balance and let others know how it went."}
              </p>
            </div>

            {!paymentDone ? (
              <>
                {/* Balance payment */}
                <Card>
                  <CardContent className="py-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Balance Payment</p>
                        <p className="text-sm text-muted-foreground">via M-Pesa STK Push</p>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        KES {(quote.quoted - quote.deposit).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => setShowStk(true)}
                      data-testid="button-pay-balance"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Pay via M-Pesa
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Payment confirmed */}
                <Card className="bg-green-500/5 border-green-500/30">
                  <CardContent className="py-4 flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400">Payment Received</p>
                      <p className="text-sm text-muted-foreground">KES {(quote.quoted - quote.deposit).toLocaleString()} paid successfully</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Rating */}
                <Card>
                  <CardContent className="py-5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={getWorkerImage(selectedWorker.specialty)} />
                        <AvatarFallback>{selectedWorker.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{selectedWorker.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedWorker.specialty}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Rate your experience</Label>
                      <StarPicker value={rating} onChange={setRating} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="review-text">Leave a review (optional)</Label>
                      <Textarea
                        id="review-text"
                        placeholder="How was the service?"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="min-h-20"
                        data-testid="textarea-review"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Tip */}
                <Card>
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-primary" />
                      <p className="font-semibold text-sm">Add a Tip (optional)</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[0, 100, 200, 500, 1000].map((t) => (
                        <Button
                          key={t}
                          size="sm"
                          variant={tip === t ? "default" : "outline"}
                          onClick={() => setTip(t)}
                          data-testid={`button-tip-${t}`}
                        >
                          {t === 0 ? "No Tip" : `KES ${t}`}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Button
                  className="w-full"
                  onClick={handleFinish}
                  data-testid="button-finish"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Submit &amp; Finish
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* STK Push Dialog */}
      {quote && user && (
        <StkPushDialog
          open={showStk}
          amount={quote.quoted - quote.deposit}
          phone={user.phone}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowStk(false)}
        />
      )}
    </div>
  );
}
