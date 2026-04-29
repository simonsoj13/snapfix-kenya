import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import JobStatusBadge from "@/components/JobStatusBadge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { getJobRequestsByUser } from "@/lib/api";
import type { JobRequest } from "@shared/schema";
import {
  Calendar, MapPin, Wrench, Zap, Navigation, Eye, Image,
  CheckCircle2, Smartphone, Banknote, UserX, UserCheck, ClipboardCheck,
  ArrowRight, X,
} from "lucide-react";
import { useLocation } from "wouter";

type ExtJobRequest = JobRequest & { workerOnWay?: number; estimatedArrival?: string | null };

/* ── M-Pesa Till Payment Dialog ──────────────────────────────────────── */
function StkPushDialog({
  open, amount, onSuccess, onClose,
}: { open: boolean; amount: number; phone: string; onSuccess: () => void; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" /> Pay Balance via M-Pesa
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="bg-green-500/10 border border-green-500/20 rounded-md p-4 text-center space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Balance Payment</p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">KES {amount.toLocaleString()}</p>
          </div>

          <div className="bg-muted rounded-md p-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground">M-Pesa Till Number</p>
            <p className="text-4xl font-bold tracking-widest text-primary" data-testid="text-till-number">324225</p>
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
              After paying, tap below so admin can verify and complete your job.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} data-testid="button-cancel-payment">
              Cancel
            </Button>
            <Button
              className="flex-1 bg-green-600 gap-2"
              onClick={onSuccess}
              data-testid="button-confirm-payment"
            >
              <CheckCircle2 className="w-4 h-4" /> I have paid
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Work Samples ─────────────────────────────────────────────────────── */
function WorkSamplesSection({ workerId }: { workerId: string }) {
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const { data } = useQuery<{ workSamples: string[]; workerName: string }>({
    queryKey: ["/api/workers/work-samples", workerId],
    queryFn: () => fetch(`/api/workers/${workerId}/work-samples`).then((r) => r.json()),
    enabled: !!workerId,
  });

  if (!data || !data.workSamples || data.workSamples.length === 0) return null;

  return (
    <>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <Image className="w-3.5 h-3.5" /> {data.workerName}'s Previous Work
        </p>
        <div className="flex gap-2 flex-wrap">
          {data.workSamples.map((sample, i) => (
            <img
              key={i}
              src={sample}
              alt={`Work sample ${i + 1}`}
              className="w-16 h-16 rounded-md object-cover cursor-pointer border border-border"
              onClick={() => setPreviewImg(sample)}
              data-testid={`img-work-sample-${workerId}-${i}`}
            />
          ))}
        </div>
      </div>
      <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Work Sample
            </DialogTitle>
          </DialogHeader>
          {previewImg && <img src={previewImg} alt="Preview" className="w-full rounded-lg object-contain max-h-[60vh]" />}
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────── */
export default function RequestsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [_, navigate] = useLocation();
  const userId = user?.id ?? "";

  const [payBalanceJob, setPayBalanceJob] = useState<ExtJobRequest | null>(null);
  const [ratingJob, setRatingJob] = useState<ExtJobRequest | null>(null);
  const [starRating, setStarRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  // ── Detect unfinished booking draft so user can resume ──────────────
  const [draft, setDraft] = useState<{ step?: number; aiCategory?: string; description?: string } | null>(null);
  useEffect(() => {
    const check = () => {
      try {
        const saved = localStorage.getItem("snapfix_booking_draft");
        if (!saved) { setDraft(null); return; }
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.step === "number" && parsed.step > 0) setDraft(parsed);
        else setDraft(null);
      } catch { setDraft(null); }
    };
    check();
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, []);
  const dismissDraft = () => { try { localStorage.removeItem("snapfix_booking_draft"); } catch {}; setDraft(null); };

  const handleConfirmArrived = async (jobId: string) => {
    try {
      await fetch(`/api/job-requests/${jobId}/arrived`, { method: "PATCH" });
      qc.invalidateQueries({ queryKey: ["/api/job-requests/user", userId] });
      toast({ title: "Confirmed!", description: "Fundi arrival confirmed." });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const handleConfirmComplete = async (jobId: string) => {
    try {
      await fetch(`/api/job-requests/${jobId}/complete`, { method: "PATCH" });
      qc.invalidateQueries({ queryKey: ["/api/job-requests/user", userId] });
      toast({ title: "Work confirmed complete!", description: "Please pay the balance to finish." });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const handleSubmitRating = async () => {
    if (!ratingJob) return;
    setSubmittingRating(true);
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId, workerId: ratingJob.workerId, rating: starRating,
          comment: ratingComment, customerName: user?.name ?? "Customer",
          jobCategory: ratingJob.category,
        }),
      });
      toast({ title: "Thank you for your rating! ⭐" });
      setRatingJob(null); setRatingComment(""); setStarRating(5);
    } catch { toast({ title: "Failed to submit rating", variant: "destructive" }); }
    finally { setSubmittingRating(false); }
  };

  const { data: requests = [], isLoading } = useQuery<ExtJobRequest[]>({
    queryKey: ["/api/job-requests/user", userId],
    queryFn: () => getJobRequestsByUser(userId),
    enabled: !!userId,
    refetchInterval: 15000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/job-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/job-requests/user", userId] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update. Please try again.", variant: "destructive" });
    },
  });

  const handleFundiArrived = (req: ExtJobRequest) => {
    updateStatus.mutate({ id: req.id, status: "fundi-arrived" });
    toast({ title: "Check-in confirmed!", description: "Fundi arrival has been recorded." });
  };

  const handleJobComplete = (req: ExtJobRequest) => {
    updateStatus.mutate({ id: req.id, status: "balance-due" });
    toast({ title: "Job marked complete!", description: "Please pay the remaining balance to finish." });
  };

  const handleCancelWorker = (req: ExtJobRequest) => {
    updateStatus.mutate({ id: req.id, status: "cancelled" });
    toast({ title: "Worker cancelled", description: "Your booking has been cancelled." });
  };

  const handleBalancePaid = async (req: ExtJobRequest) => {
    await fetch(`/api/job-requests/${req.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    qc.invalidateQueries({ queryKey: ["/api/job-requests/user", userId] });
    setPayBalanceJob(null);
    toast({ title: "Payment successful!", description: "Job marked as complete. Thank you!" });
    setRatingJob(payBalanceJob);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl font-semibold mb-6">My Requests</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const draftBanner = draft && (
    <Card className="mb-6 border-primary/40 bg-primary/5" data-testid="card-resume-draft">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <ClipboardCheck className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" data-testid="text-draft-title">Continue your booking</p>
          <p className="text-xs text-muted-foreground truncate">
            {draft.aiCategory ? `${draft.aiCategory} request` : "Repair request"} — saved at step {(draft.step ?? 0) + 1}
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => navigate("/book")} data-testid="button-resume-draft">
          Resume <ArrowRight className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={dismissDraft} data-testid="button-dismiss-draft">
          <X className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );

  if (requests.length === 0) {
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl font-semibold mb-6">My Requests</h1>
          {draftBanner}
          <Card className="p-12 flex flex-col items-center justify-center text-center gap-4">
            <Wrench className="w-16 h-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No requests yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Book your first repair — take a photo and get matched instantly.
              </p>
            </div>
            <Button onClick={() => navigate("/book")} data-testid="button-book-now">
              Book a Repair
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <h1 className="text-2xl font-semibold">My Requests</h1>
          <Button size="sm" onClick={() => navigate("/book")} data-testid="button-new-request">
            + New Request
          </Button>
        </div>

        {draftBanner}

        <div className="space-y-4">
          {requests.map((req) => {
            const isOnTheWay = req.workerOnWay === 1;
            const eta = req.estimatedArrival;
            const balance = (req.quotedAmount ?? 0) - (req.depositAmount ?? 0);

            return (
              <Card key={req.id} data-testid={`card-request-${req.id}`}>
                <CardContent className="p-6 space-y-4">

                  {/* ── Worker on the way banner ── */}
                  {isOnTheWay && req.status === "deposit-paid" && (
                    <div className="flex items-center gap-3 bg-primary/10 text-primary rounded-lg px-4 py-3">
                      <Navigation className="w-5 h-5 flex-shrink-0 animate-pulse" />
                      <div>
                        <p className="font-semibold text-sm">Your Fundi is on the way!</p>
                        {eta && <p className="text-xs mt-0.5">Estimated arrival: <strong>{eta}</strong></p>}
                      </div>
                    </div>
                  )}

                  {/* ── Fundi accepted banner ── */}
                  {req.status === "in-progress" && !isOnTheWay && (
                    <div className="flex items-center gap-3 bg-green-500/10 text-green-700 rounded-lg px-4 py-3">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Fundi accepted your job!</p>
                        <p className="text-xs mt-0.5">They will contact you shortly.</p>
                      </div>
                    </div>
                  )}

                  {/* ── Fundi arrived banner ── */}
                  {req.status === "fundi-arrived" && (
                    <div className="flex items-center gap-3 bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded-lg px-4 py-3">
                      <UserCheck className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Fundi has arrived and is working</p>
                        <p className="text-xs mt-0.5 opacity-80">Confirm job completion once work is done.</p>
                      </div>
                    </div>
                  )}

                  {/* ── Balance due banner ── */}
                  {req.status === "balance-due" && (
                    <div className="flex items-center gap-3 bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-lg px-4 py-3">
                      <Banknote className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Job confirmed complete — balance payment due</p>
                        <p className="text-xs mt-0.5 opacity-80">Pay the remaining KES {balance.toLocaleString()} to close this job.</p>
                      </div>
                    </div>
                  )}

                  {/* ── Main content row ── */}
                  <div className="flex items-start gap-4">
                    {req.imageUrl && (
                      <img
                        src={req.imageUrl}
                        alt="Your photo"
                        className="w-24 h-24 rounded-xl object-cover flex-shrink-0 border-2 border-primary/20 cursor-pointer shadow-md hover:opacity-90 transition-opacity"
                        data-testid={`img-request-photo-${req.id}`}
                        
                      />
                    )}

                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold">{req.category}</h3>
                            <JobStatusBadge status={req.status} />
                            {req.isNow === 1 && (
                              <Badge variant="secondary" className="gap-1">
                                <Zap className="w-3 h-3" /> Immediate
                              </Badge>
                            )}
                          </div>
                          {req.area && (
                            <p className="text-xs text-muted-foreground capitalize">
                              Area: {req.area.replace("-", " ")}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                            {req.description}
                          </p>
                        </div>
                      </div>

                      {/* Quote & deposit info */}
                      {req.quotedAmount && (
                        <div className="flex gap-4 text-sm flex-wrap">
                          <span className="text-muted-foreground">
                            Quote: <strong>KES {req.quotedAmount.toLocaleString()}</strong>
                          </span>
                          {req.depositAmount && (
                            <span className="text-muted-foreground">
                              Deposit paid: <strong className="text-green-600">KES {req.depositAmount.toLocaleString()}</strong>
                            </span>
                          )}
                          {req.status === "balance-due" && (
                            <span className="text-muted-foreground">
                              Balance: <strong className="text-purple-600">KES {balance.toLocaleString()}</strong>
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{req.location}</span>
                        </div>
                        {req.preferredDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{req.preferredDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Fundi work samples */}
                      {req.workerId && <WorkSamplesSection workerId={req.workerId} />}
                    </div>
                  </div>

                  {/* ── Action buttons ── */}
                  <div className="flex gap-2 flex-wrap pt-1 border-t">

                    {/* Step 1: After deposit paid — Fundi Arrived check-in */}
                    {req.status === "deposit-paid" && req.workerId && (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleFundiArrived(req)}
                        disabled={updateStatus.isPending}
                        data-testid={`button-fundi-arrived-${req.id}`}
                      >
                        <UserCheck className="w-4 h-4" /> Fundi Has Arrived
                      </Button>
                    )}

                    {/* Step 2: After fundi arrives — Confirm Job Complete */}
                    {(req.status === "fundi-arrived" || req.status === "in-progress") && (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleJobComplete(req)}
                        disabled={updateStatus.isPending}
                        data-testid={`button-job-complete-${req.id}`}
                      >
                        <ClipboardCheck className="w-4 h-4" /> Confirm Job Complete
                      </Button>
                    )}

                    {/* Step 3: Pay balance */}
                    {req.status === "balance-due" && (
                      <Button
                        size="sm"
                        className="gap-1.5 bg-green-600"
                        onClick={() => setPayBalanceJob(req)}
                        data-testid={`button-pay-balance-${req.id}`}
                      >
                        <Banknote className="w-4 h-4" /> Pay Balance — KES {balance.toLocaleString()}
                      </Button>
                    )}

                    {/* Cancel Worker — before fundi arrives */}
                    {(req.status === "deposit-paid" || req.status === "fundi-arrived") && req.workerId && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleCancelWorker(req)}
                        disabled={updateStatus.isPending}
                        data-testid={`button-cancel-worker-${req.id}`}
                      >
                        <UserX className="w-4 h-4" /> Cancel Worker
                      </Button>
                    )}

                    {/* Cancel Request — pending/quoted only */}
                    {(req.status === "pending" || req.status === "quoted") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => updateStatus.mutate({ id: req.id, status: "cancelled" })}
                        disabled={updateStatus.isPending}
                        data-testid={`button-cancel-${req.id}`}
                      >
                        Cancel Request
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* M-Pesa balance payment dialog */}
      <StkPushDialog
        open={!!payBalanceJob}
        amount={(payBalanceJob?.quotedAmount ?? 0) - (payBalanceJob?.depositAmount ?? 0)}
        phone={user?.phone ?? "+254700000000"}
        onSuccess={() => payBalanceJob && handleBalancePaid(payBalanceJob)}
        onClose={() => setPayBalanceJob(null)}
      />

      {/* Rating Dialog */}
      <Dialog open={!!ratingJob} onOpenChange={() => setRatingJob(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rate your Fundi ⭐</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">How was your experience with {ratingJob?.category} service?</p>
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => setStarRating(star)} className="text-3xl transition-transform hover:scale-110">
                  {star <= starRating ? "⭐" : "☆"}
                </button>
              ))}
            </div>
            <div>
              <Label>Comment (optional)</Label>
              <Textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} placeholder="Tell others about your experience..." className="mt-1" rows={3} />
            </div>
            <Button className="w-full" onClick={handleSubmitRating} disabled={submittingRating}>
              {submittingRating ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

  );
}
