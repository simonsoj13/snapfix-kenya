import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import PhotoUploadCard from "@/components/PhotoUploadCard";
import { getWorkerImage } from "@/lib/workerImages";
import type { Worker, JobRequest } from "@shared/schema";
import {
  ArrowLeft, ArrowRight, Camera, MapPin, Clock, Star,
  CheckCircle2, Zap, Calendar, Phone, Mail,
  Smartphone, Banknote,
} from "lucide-react";

function WorkerPhotos({ workerId }: { workerId: string }) {
  const { data } = useQuery<{ workSamples: string[]; workerName: string }>({
    queryKey: ["/api/workers", workerId, "work-samples"],
    queryFn: () => fetch(`/api/workers/${workerId}/work-samples`).then((r) => r.json()),
  });
  if (!data?.workSamples?.length) return null;
  return (
    <div className="space-y-2 mt-2">
      <p className="text-xs text-muted-foreground font-medium">Work Samples</p>
      <div className="grid grid-cols-3 gap-1">
        {data.workSamples.map((url, i) => (
          <img key={i} src={url} alt="work sample" className="rounded object-cover aspect-square w-full" />
        ))}
      </div>
    </div>
  );
}

const STEPS = ["Photo", "Describe", "Quote", "Worker", "Schedule", "Pay", "Complete"];
const CATEGORIES = ["Plumbing","Electrical","Carpentry","Painting","Welding","HVAC","Appliance","General"];
const AREAS = ["bathroom","kitchen","sitting-room","bedroom","compound"];

export default function BookingFlow() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [step, setStep] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [isNow, setIsNow] = useState(true);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [quote, setQuote] = useState<{ min: number; max: number; midpoint: number; deposit: number; depositPercent: number; breakdown: string; complexityLabel?: string; note?: string } | null>(null);
  const [quotingLoading, setQuotingLoading] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [jobRequest, setJobRequest] = useState<JobRequest | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  // Resume draft notification
  useEffect(() => {
    const saved = localStorage.getItem("bookingDraft");
    if (!saved) return;
    try {
      const d = JSON.parse(saved);
      if (d.category && d.description) {
        toast({
          title: "📋 Unfinished Booking",
          description: `You were booking ${d.category} repair. Want to continue?`,
          duration: 10000,
          action: (
            <Button 
              size="sm" 
              onClick={() => {
                if (d.category) setCategory(d.category);
                if (d.description) setDescription(d.description);
                if (d.area) setArea(d.area);
                if (d.location) setJobLocation(d.location);
                if (d.isNow !== undefined) setIsNow(d.isNow);
                if (d.scheduledDate) setScheduledDate(d.scheduledDate);
                if (d.scheduledTime) setScheduledTime(d.scheduledTime);
                // Go to Step 1 (Describe) where the draft data shows
                setStep(1);
              }}
            >
              Continue
            </Button>
          ),
        });
      }
    } catch {}
  }, []);
  // Auto-detect location using browser geolocation
  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    toast({ title: "Detecting location..." });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const address = data.display_name || data.name || "Unknown location";
          // Extract neighborhood/city from address
          const parts = address.split(',');
          const shortAddress = parts.slice(0, 2).join(', ');
          setJobLocation(shortAddress);
          toast({ title: "📍 Location detected!", description: shortAddress });
        } catch {
          toast({ title: "Could not detect location", variant: "destructive" });
        }
      },
      () => {
        toast({ title: "Location permission denied", variant: "destructive" });
      }
    );
  };

  // Fetch workers
  const fetchWorkers = useCallback(async () => {
    setLoadingWorkers(true);
    try {
      const res = await fetch(`/api/workers/search?specialty=${encodeURIComponent(category)}&verified=true`);
      const data = await res.json();
      setWorkers(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Failed to load fundis", variant: "destructive" });
    } finally {
      setLoadingWorkers(false);
    }
  }, [category, toast]);

  // Fetch quote
  const fetchQuote = useCallback(async () => {
    if (!category || !area || !description) return;
    setQuotingLoading(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, area, description }),
      });
      const data = await res.json();
      setQuote(data);
    } catch {
      toast({ title: "Quote failed", variant: "destructive" });
    } finally {
      setQuotingLoading(false);
    }
  }, [category, area, description, toast]);

  // Auto-fetch workers when quote is ready
  useEffect(() => {
    if (quote) fetchWorkers();
  }, [quote, fetchWorkers]);


  // Create booking
  const createBooking = useCallback(async () => {
    if (!selectedWorker || !user) return;
    setDepositLoading(true);
    try {
      const res = await fetch("/api/job-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          workerId: selectedWorker.id,
          category,
          description,
          area,
          location: jobLocation,
          imageUrl: imageUrl || "",
          isNow: isNow ? 1 : 0,
          preferredDate: isNow ? null : scheduledDate,
          preferredTime: isNow ? null : scheduledTime,
          quotedAmount: quote?.midpoint ?? null,
          depositAmount: quote?.deposit ?? null,
          status: "pending",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setJobRequest(data);
      setStep(5);
      toast({ title: "Booking created!", description: "Proceed to pay deposit." });
    } catch (e: any) {
      toast({ title: "Booking failed", description: e.message, variant: "destructive" });
    } finally {
      setDepositLoading(false);
    }
  }, [selectedWorker, user, category, description, area, jobLocation, imageUrl, isNow, scheduledDate, scheduledTime, quote, toast]);

  // Poll for approval at step 5
  useEffect(() => {
    if (!jobRequest?.id || paymentDone || step !== 5) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/job-requests/user/${user?.id}`);
        const jobs = await res.json();
        const job = jobs.find((j: any) => j.id === jobRequest.id);
        if (job && ["deposit-paid", "in-progress"].includes(job.status)) {
          setPaymentDone(true);
          clearInterval(interval);
          toast({ title: "✅ Deposit confirmed!", description: "Your fundi has been notified." });
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [jobRequest?.id, paymentDone, step, user?.id, toast]);

  // Real-time notifications via SSE
  useEffect(() => {
    if (!user?.id) return;
    const evtSource = new EventSource(`/api/notifications/stream/${user.id}`);
    
    evtSource.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "notification") {
        toast({
          title: msg.data.title,
          description: msg.data.message,
          duration: 6000,
        });
      }
    };
    
    return () => evtSource.close();
  }, [user?.id, toast]);


  // Submit review
  const submitReview = async () => {
    if (!jobRequest || !selectedWorker) return;
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: jobRequest.id,
          workerId: selectedWorker.id,
          userId: user?.id,
          rating,
          comment: reviewText,
          customerName: user?.name ?? "Customer",
          jobCategory: category,
        }),
      });
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      navigate("/requests");
    } catch {
      toast({ title: "Failed to submit review", variant: "destructive" });
    }
  };

  const go = (n: number) => setStep(n);

  return (
    <div className="max-w-xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => step > 0 ? go(step - 1) : navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="font-bold text-lg">Book a Repair</h1>
        <Badge variant="outline">{step + 1}/{STEPS.length}</Badge>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? "bg-primary text-white" : i === step ? "bg-primary text-white ring-2 ring-primary/30" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 w-4 ${i < step ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-5 space-y-5">

          {/* ── Step 0: Photo ── */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Upload a Photo</h2>
              <p className="text-sm text-muted-foreground">Take or upload a photo of what needs to be fixed.</p>
              <PhotoUploadCard
                photos={imageUrl ? [imageUrl] : []}
                onPhotosChange={(urls) => setImageUrl(urls[0] ?? "")}
                maxPhotos={1}
              />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => go(1)}>
                  Skip Photo →
                </Button>
                <Button className="flex-1" onClick={() => go(1)}>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 1: Describe ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Describe the Problem</h2>
              <div>
                <Label>Category</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setCategory(c)}
                      className={`p-2 rounded-md border text-sm font-medium transition-all ${category === c ? "border-primary bg-primary/5 text-primary" : "border-border"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what needs fixing..." rows={3} className="mt-1" />
              </div>
              <div>
                <Label>Area / Room</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {AREAS.map((a) => (
                    <button key={a} onClick={() => setArea(a)}
                      className={`p-2 rounded-md border text-xs font-medium capitalize transition-all ${area === a ? "border-primary bg-primary/5 text-primary" : "border-border"}`}>
                      {a.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Your Location</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={jobLocation} onChange={(e) => setJobLocation(e.target.value)}
                    placeholder="e.g. Westlands, Nairobi" className="flex-1" />
                  <Button type="button" variant="outline" size="icon" onClick={detectLocation} title="Use my location">
                    📍
                  </Button>
                </div>
              </div>
              <Button className="w-full" disabled={!category || !description || !area || !jobLocation}
                onClick={() => { fetchQuote(); go(2); }}>
                Get Quote <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* ── Step 2: Quote + Fundis Combined ── */}
                    {/* ── Step 2: Quote ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Your Estimated Quote</h2>
              {quotingLoading ? (
                <div className="text-center py-8 text-muted-foreground">Calculating quote...</div>
              ) : quote ? (
                <div className="space-y-3">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Estimated Range</p>
                    <p className="text-3xl font-bold">KES {quote.min.toLocaleString()} – {quote.max.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{quote.breakdown}</p>
                    {quote.complexityLabel && <Badge variant="secondary">{quote.complexityLabel}</Badge>}
                  </div>
                  <div className="flex justify-between text-sm p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Deposit required</span>
                    <span className="font-bold text-primary">KES {quote.deposit.toLocaleString()}</span>
                  </div>
                  {quote.note && <p className="text-xs text-muted-foreground text-center">{quote.note}</p>}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Could not load quote. Please try again.</div>
              )}
              <Button className="w-full" onClick={() => { fetchWorkers(); go(3); }}>
                Find a Fundi <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* ── Step 3: Worker ── */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Choose a Fundi</h2>
              {loadingWorkers ? (
                <div className="text-center py-8 text-muted-foreground">Finding fundis near you...</div>
              ) : workers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No fundis available right now. Try again later.</div>
              ) : (
                <div className="space-y-3">
                  {workers.map((w) => (
                    <div key={w.id} onClick={() => setSelectedWorker(w)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedWorker?.id === w.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                      <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={w.profileImage || getWorkerImage(w.specialty)} />
                          <AvatarFallback>{w.name?.[0] ?? "F"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">{w.name}</p>
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              {w.rating ?? "4.5"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{w.specialty}</p>
                          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                            {w.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{w.location}</span>}
                            {w.experience && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{w.experience} yrs</span>}
                          </div>
                          <WorkerPhotos workerId={w.id} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button className="w-full" disabled={!selectedWorker} onClick={() => go(4)}>
                Book {selectedWorker?.name ?? "Selected Fundi"} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* ── Step 4: Schedule ── */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Schedule & Confirm</h2>
              <div className="flex gap-3">
                <Button variant={isNow ? "default" : "outline"} className="flex-1" onClick={() => setIsNow(true)}>
                  <Zap className="w-4 h-4 mr-2" /> Right Now
                </Button>
                <Button variant={!isNow ? "default" : "outline"} className="flex-1" onClick={() => setIsNow(false)}>
                  <Calendar className="w-4 h-4 mr-2" /> Schedule
                </Button>
              </div>
              {!isNow && (
                <div className="space-y-3">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="mt-1" />
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                <p><span className="text-muted-foreground">Category:</span> <strong>{category}</strong></p>
                <p><span className="text-muted-foreground">Fundi:</span> <strong>{selectedWorker?.name}</strong></p>
                <p><span className="text-muted-foreground">Location:</span> <strong>{jobLocation}</strong></p>
                {quote && <p><span className="text-muted-foreground">Deposit:</span> <strong className="text-primary">KES {quote.deposit.toLocaleString()}</strong></p>}
              </div>

              <Button className="w-full" disabled={depositLoading || (!isNow && (!scheduledDate || !scheduledTime))}
                onClick={() => { createBooking(); }}>
                {depositLoading ? "Creating booking..." : "Confirm Booking"}
              </Button>
            </div>
          )}

          {/* ── Step 5: Pay Deposit ── */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold">Booking Confirmed!</h2>
                <p className="text-sm text-muted-foreground mt-1">Pay deposit to activate your fundi.</p>
              </div>

              {/* Fundi contact */}
              {selectedWorker && (
                <div className="border rounded-xl p-4 space-y-2">
                  <p className="font-semibold text-sm">Your Fundi</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedWorker?.profileImage || getWorkerImage(selectedWorker?.specialty)} />
                      <AvatarFallback>{selectedWorker?.name?.[0] ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedWorker?.name ?? "Your Fundi"}</p>
                      <p className="text-xs text-muted-foreground">{selectedWorker?.specialty ?? ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" /><span>{selectedWorker?.phone ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" /><span>{selectedWorker?.email ?? "—"}</span>
                  </div>
                </div>
              )}

              {!paymentDone ? (
                <div className="space-y-3">
                  <div className="bg-muted rounded-xl p-4 text-center space-y-1">
                    <p className="text-xs text-muted-foreground">M-Pesa Till Number</p>
                    <p className="text-4xl font-bold tracking-widest text-primary">324225</p>
                    <p className="text-xs text-muted-foreground">Snap-Fix Kenya</p>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1 px-1">
                    <p>1. Open M-Pesa on your phone</p>
                    <p>2. Select <strong>Lipa na M-Pesa</strong></p>
                    <p>3. Select <strong>Buy Goods & Services</strong></p>
                    <p>4. Enter Till: <strong>324225</strong></p>
                    <p>5. Enter amount: <strong>KES {quote?.deposit.toLocaleString() ?? "—"}</strong></p>
                    <p>6. Enter PIN and confirm</p>
                  </div>
                  <Button className="w-full bg-green-600" onClick={async () => {
                    if (!jobRequest || !user) return;
                    await fetch("/api/transactions/pending", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId: user.id, jobId: jobRequest.id, amount: quote?.deposit ?? 0, type: "deposit", phone: user.phone }),
                    });
                    await fetch(`/api/job-requests/${jobRequest.id}/status`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "awaiting-deposit-approval" }),
                    });
                    toast({ title: "Payment recorded!", description: "Waiting for admin to verify..." });
                  }}>
                    <Banknote className="w-4 h-4 mr-2" /> I Have Paid
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                    <p className="font-semibold text-green-700">Deposit Confirmed!</p>
                    <p className="text-xs text-muted-foreground">Your fundi has been notified and is on the way.</p>
                  </div>
                  <Button className="w-full" onClick={() => navigate("/requests")}>
                    View My Requests
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Step 6: Complete & Review ── */}
          {step === 6 && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Job Complete!</h2>
              <p className="text-sm text-muted-foreground">Thank you for using Snap-Fix Kenya</p>
              <div className="text-left space-y-2">
                <Label>Rate your fundi</Label>
                <div className="flex gap-2 justify-center">
                  {[1,2,3,4,5].map((s) => (
                    <button key={s} onClick={() => setRating(s)} className="text-3xl">
                      {s <= rating ? "⭐" : "☆"}
                    </button>
                  ))}
                </div>
                <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience..." rows={3} />
              </div>
              <Button className="w-full" onClick={submitReview}>Submit & Finish</Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
