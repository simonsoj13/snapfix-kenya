import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import type { PricingConfig } from "@shared/schema";
import {
  ArrowLeft, ArrowRight, MapPin, CheckCircle2, Zap, Calendar,
  Banknote, Info, Store, Camera, Upload,
} from "lucide-react";

const STEPS = ["Photo", "Describe", "Your Price", "Schedule", "Posted!"];
const CATEGORIES = ["Plumbing", "Electrical", "Carpentry", "Painting", "Welding", "HVAC", "Appliance", "Emergency", "General"];
const AREAS = ["bathroom", "kitchen", "sitting-room", "bedroom", "compound", "outdoor"];

export default function BookingFlow() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [step, setStep] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [aiCategory, setAiCategory] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [isNow, setIsNow] = useState(true);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [offeredPrice, setOfferedPrice] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [postedJobId, setPostedJobId] = useState<string | null>(null);
  const [depositPaid, setDepositPaid] = useState(false);

  const { data: pricingConfigs = [] } = useQuery<PricingConfig[]>({
    queryKey: ["/api/pricing"],
  });

  const activePricing = pricingConfigs.find((p) => p.category === category)
    ?? pricingConfigs.find((p) => p.category === "General");

  const minPrice = activePricing?.baseMin ?? 500;
  const depositAmount = offeredPrice
    ? Math.round(Number(offeredPrice) * 0.3 / 100) * 100
    : 0;

  // Restore draft
  useEffect(() => {
    const saved = localStorage.getItem("bookingDraft");
    if (!saved) return;
    try {
      const d = JSON.parse(saved);
      if (d.category && d.description) {
        toast({
          title: "Unfinished Booking",
          description: `You were booking ${d.category} repair. Resume from where you left off?`,
          duration: 10000,
          action: (
            <Button size="sm" onClick={() => {
              if (d.category) setCategory(d.category);
              if (d.description) setDescription(d.description);
              if (d.area) setArea(d.area);
              if (d.location) setJobLocation(d.location);
              if (d.offeredPrice) setOfferedPrice(String(d.offeredPrice));
              if (d.isNow !== undefined) setIsNow(d.isNow);
              if (d.scheduledDate) setScheduledDate(d.scheduledDate);
              if (d.scheduledTime) setScheduledTime(d.scheduledTime);
              setStep(1);
            }}>Continue</Button>
          ),
        });
      }
    } catch {}
  }, []);

  // Save draft on each relevant change
  useEffect(() => {
    if (!category && !description) return;
    const draft = { category, description, area, location: jobLocation, offeredPrice, isNow, scheduledDate, scheduledTime };
    localStorage.setItem("bookingDraft", JSON.stringify(draft));
  }, [category, description, area, jobLocation, offeredPrice, isNow, scheduledDate, scheduledTime]);

  // Auto-detect location
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
          const parts = (data.display_name || data.name || "").split(",");
          setJobLocation(parts.slice(0, 2).join(", "));
          toast({ title: "Location detected!" });
        } catch {
          toast({ title: "Could not detect location", variant: "destructive" });
        }
      },
      () => toast({ title: "Location permission denied", variant: "destructive" })
    );
  };

  // Submit job posting
  const postJob = useCallback(async () => {
    if (!user) return;
    const price = Number(offeredPrice);
    if (price < minPrice) {
      toast({ title: `Minimum price is KES ${minPrice.toLocaleString()}`, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const deposit = Math.round(price * 0.3 / 100) * 100;
      const res = await fetch("/api/job-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          workerId: null,
          category,
          description,
          area,
          location: jobLocation,
          imageUrl: imageUrl || "",
          isNow: isNow ? 1 : 0,
          preferredDate: isNow ? null : scheduledDate,
          preferredTime: isNow ? null : scheduledTime,
          budget: price,
          quotedAmount: price,
          depositAmount: deposit,
          status: "open",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post job");
      setPostedJobId(data.id);
      localStorage.removeItem("bookingDraft");
      setStep(4);
    } catch (e: any) {
      toast({ title: "Failed to post job", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [user, offeredPrice, minPrice, category, description, area, jobLocation, imageUrl, isNow, scheduledDate, scheduledTime, toast]);

  const go = (n: number) => setStep(n);

  return (
    <div className="max-w-xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => step > 0 ? go(step - 1) : navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="font-bold text-lg">Post a Repair Job</h1>
        <Badge variant="outline">{step + 1}/{STEPS.length}</Badge>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/30" : "bg-muted text-muted-foreground"}`}>
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
              <div>
                <h2 className="font-semibold text-lg">Add a Photo</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Help Fundis see exactly what needs fixing. Our AI can detect the repair category automatically.
                </p>
              </div>

              {/* Photo upload area */}
              <label className="relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer hover-elevate min-h-36">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  data-testid="input-photo-upload"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPhotoUploading(true);
                    try {
                      const reader = new FileReader();
                      const dataUrl = await new Promise<string>((res, rej) => {
                        reader.onload = () => res(reader.result as string);
                        reader.onerror = rej;
                        reader.readAsDataURL(file);
                      });
                      setImageUrl(dataUrl);
                      // AI category detection
                      const fd = new FormData();
                      fd.append("image", file, file.name);
                      const r = await fetch("/api/analyze-image", { method: "POST", body: fd });
                      const d = await r.json();
                      if (d.category) {
                        setAiCategory(d.category);
                        setCategory(d.category);
                        toast({ title: `AI detected: ${d.category}`, description: "You can change this on the next step." });
                      }
                    } catch {
                      toast({ title: "Photo uploaded — AI detection skipped", description: "You can select the category manually." });
                    } finally {
                      setPhotoUploading(false);
                    }
                  }}
                />
                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt="Uploaded" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-40" />
                    <div className="relative z-10 flex flex-col items-center gap-1">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                      <span className="text-sm font-medium">Photo added — tap to change</span>
                    </div>
                  </>
                ) : (
                  <>
                    {photoUploading ? (
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-10 h-10 text-muted-foreground" />
                    )}
                    <div className="text-center">
                      <p className="font-medium text-sm">{photoUploading ? "Analysing photo..." : "Take or upload a photo"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">AI will detect repair category automatically</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Camera className="w-3.5 h-3.5" /> Camera &nbsp;·&nbsp; <Upload className="w-3.5 h-3.5" /> Gallery
                    </div>
                  </>
                )}
              </label>

              {aiCategory && (
                <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-md px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  AI detected: <strong>{aiCategory}</strong>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => go(1)} data-testid="button-skip-photo">
                  Skip Photo
                </Button>
                <Button className="flex-1" onClick={() => go(1)} disabled={photoUploading} data-testid="button-next-photo">
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
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`p-2 rounded-md border text-sm font-medium transition-all ${category === c ? "border-primary bg-primary/5 text-primary" : "border-border"}`}
                      data-testid={`button-category-${c.toLowerCase()}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what needs fixing in detail..."
                  rows={3}
                  className="mt-1"
                  data-testid="textarea-description"
                />
              </div>

              <div>
                <Label>Area / Room</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {AREAS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setArea(a)}
                      className={`p-2 rounded-md border text-xs font-medium capitalize transition-all ${area === a ? "border-primary bg-primary/5 text-primary" : "border-border"}`}
                      data-testid={`button-area-${a}`}
                    >
                      {a.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Your Location</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    placeholder="e.g. Westlands, Nairobi"
                    className="flex-1"
                    data-testid="input-location"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={detectLocation} title="Use my location">
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!category || !description || !area || !jobLocation}
                onClick={() => go(2)}
                data-testid="button-next-describe"
              >
                Set My Price <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* ── Step 2: Set Your Price ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-lg">Set Your Offered Price</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Fundis will see your budget and choose whether to claim your job.
                </p>
              </div>

              {activePricing && (
                <div className="flex items-start gap-2 bg-muted/50 rounded-md px-3 py-3 text-sm">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Minimum for <strong>{category}</strong>: <strong className="text-foreground">KES {activePricing.baseMin.toLocaleString()}</strong>.
                    Offering more increases your chances of getting a Fundi quickly.
                  </span>
                </div>
              )}

              <div>
                <Label>Your Offered Price (KES)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">KES</span>
                  <Input
                    type="number"
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(e.target.value)}
                    placeholder={String(minPrice)}
                    className="pl-12"
                    min={minPrice}
                    data-testid="input-offered-price"
                  />
                </div>
                {offeredPrice && Number(offeredPrice) < minPrice && (
                  <p className="text-xs text-destructive mt-1">
                    Price must be at least KES {minPrice.toLocaleString()}
                  </p>
                )}
              </div>

              {offeredPrice && Number(offeredPrice) >= minPrice && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total job price</span>
                    <span className="font-bold">KES {Number(offeredPrice).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deposit (30%) — paid now</span>
                    <span className="font-bold text-primary">KES {depositAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Balance — paid after job</span>
                    <span className="font-bold">KES {(Number(offeredPrice) - depositAmount).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                disabled={!offeredPrice || Number(offeredPrice) < minPrice}
                onClick={() => go(3)}
                data-testid="button-next-price"
              >
                Set Schedule <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* ── Step 3: Schedule ── */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">When Do You Need This?</h2>

              <div className="flex gap-3">
                <Button
                  variant={isNow ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsNow(true)}
                  data-testid="button-schedule-now"
                >
                  <Zap className="w-4 h-4 mr-2" /> Right Now
                </Button>
                <Button
                  variant={!isNow ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsNow(false)}
                  data-testid="button-schedule-later"
                >
                  <Calendar className="w-4 h-4 mr-2" /> Schedule
                </Button>
              </div>

              {!isNow && (
                <div className="space-y-3">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="mt-1"
                      data-testid="input-date"
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="mt-1"
                      data-testid="input-time"
                    />
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                <p><span className="text-muted-foreground">Category:</span> <strong>{category}</strong></p>
                <p><span className="text-muted-foreground">Area:</span> <strong className="capitalize">{area.replace("-", " ")}</strong></p>
                <p><span className="text-muted-foreground">Location:</span> <strong>{jobLocation}</strong></p>
                <p><span className="text-muted-foreground">Offered Price:</span> <strong className="text-primary">KES {Number(offeredPrice).toLocaleString()}</strong></p>
                <p><span className="text-muted-foreground">Deposit:</span> <strong>KES {depositAmount.toLocaleString()}</strong></p>
                <p><span className="text-muted-foreground">When:</span> <strong>{isNow ? "As soon as possible" : `${scheduledDate} at ${scheduledTime}`}</strong></p>
              </div>

              <Button
                className="w-full"
                disabled={submitting || (!isNow && (!scheduledDate || !scheduledTime))}
                onClick={postJob}
                data-testid="button-post-job"
              >
                {submitting ? "Posting..." : (
                  <><Store className="w-4 h-4 mr-2" /> Post to Marketplace</>
                )}
              </Button>
            </div>
          )}

          {/* Step 4: Pay Deposit */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold">Job Posted!</h2>
                <p className="text-sm text-muted-foreground mt-1">Pay deposit to confirm your booking.</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-1">
                <p><span className="text-muted-foreground">Category:</span> <strong>{category}</strong></p>
                <p><span className="text-muted-foreground">Location:</span> <strong>{jobLocation}</strong></p>
                <p><span className="text-muted-foreground">Total Price:</span> <strong className="text-primary">KES {Number(offeredPrice).toLocaleString()}</strong></p>
                <p><span className="text-muted-foreground">Deposit (30%):</span> <strong className="text-green-600">KES {depositAmount.toLocaleString()}</strong></p>
              </div>
              {!depositPaid ? (
                <div className="space-y-3">
                  <div className="bg-muted rounded-xl p-4 text-center space-y-1">
                    <p className="text-xs text-muted-foreground">M-Pesa Till Number</p>
                    <p className="text-4xl font-bold tracking-widest text-primary">324225</p>
                    <p className="text-xs text-muted-foreground">Snap-Fix Kenya</p>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1 px-1">
                    <p>1. Open M-Pesa on your phone</p>
                    <p>2. Select <strong>Lipa na M-Pesa</strong></p>
                    <p>3. Select <strong>Buy Goods and Services</strong></p>
                    <p>4. Enter Till: <strong>324225</strong></p>
                    <p>5. Enter amount: <strong>KES {depositAmount.toLocaleString()}</strong></p>
                    <p>6. Enter PIN and confirm</p>
                  </div>
                  <Button className="w-full bg-green-600" onClick={async () => {
                    await fetch('/api/transactions/pending', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: user?.id,
                        workerId: "",
                        jobId: postedJobId,
                        amount: depositAmount,
                        type: 'deposit',
                        phone: user?.phone ?? "",
                        mpesaRef: 'PENDING-' + Date.now(),
                        customerName: user?.name ?? "Customer",
                        workerName: "",
                        category,
                        status: 'pending',
                      }),
                    });
                    setDepositPaid(true);
                    toast({ title: 'Payment recorded!', description: 'Waiting for admin to verify. Your job is live in the marketplace.' });
                  }} data-testid="button-confirm-deposit">
                    <Banknote className="w-4 h-4 mr-2" /> I Have Paid
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="font-semibold text-yellow-700 dark:text-yellow-400">Waiting for admin to confirm payment...</p>
                    <p className="text-xs text-muted-foreground">Once verified your fundi will be notified.</p>
                  </div>
                  <Button className="w-full" onClick={() => { localStorage.removeItem("bookingDraft"); navigate('/requests'); }} data-testid="button-view-requests">
                    View My Requests
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
