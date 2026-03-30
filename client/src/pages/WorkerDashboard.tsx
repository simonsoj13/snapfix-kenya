import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import {
  Wallet, Briefcase, ShieldCheck, Camera, MapPin, Star, Clock,
  CheckCircle2, LogOut, ArrowRight, AlertCircle, Upload,
  Phone, CreditCard, TrendingUp, Eye, ImageIcon, X, Loader2,
} from "lucide-react";
import type { JobRequest } from "@shared/schema";
import SnapfixLogo from "@/components/SnapfixLogo";

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  pending:       { label: "Pending",       class: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  quoted:        { label: "Quoted",        class: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  "deposit-paid":{ label: "Deposit Paid",  class: "bg-primary/10 text-primary" },
  "in-progress": { label: "In Progress",   class: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  completed:     { label: "Completed",     class: "bg-green-500/10 text-green-600 dark:text-green-400" },
  cancelled:     { label: "Cancelled",     class: "bg-destructive/10 text-destructive" },
};

const MOCK_WALLET_HISTORY = [
  { id: "1", label: "Plumbing job - Alice W.", amount: 3500, type: "credit", date: "2026-03-28" },
  { id: "2", label: "Withdrawal to M-Pesa",   amount: 2000, type: "debit",  date: "2026-03-27" },
  { id: "3", label: "Electrical job - James K.", amount: 5200, type: "credit", date: "2026-03-25" },
  { id: "4", label: "Platform fee",            amount: 520,  type: "debit",  date: "2026-03-25" },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function WorkerDashboard() {
  const { user, logout } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [viewPhoto, setViewPhoto] = useState<{ url: string; title: string } | null>(null);

  // ID upload state
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [samples, setSamples] = useState<(string | null)[]>([null, null, null, null, null]);
  const [submittingDocs, setSubmittingDocs] = useState(false);
  const [docsSubmitted, setDocsSubmitted] = useState(false);

  const { data: jobs = [], isLoading } = useQuery<JobRequest[]>({
    queryKey: ["/api/job-requests/worker", user?.id],
    queryFn: () => fetch(`/api/job-requests/worker/${user?.id}`).then((r) => r.json()),
    enabled: !!user?.id,
  });

  const availableJobs = jobs.filter((j) => ["pending", "quoted", "deposit-paid"].includes(j.status));
  const activeJobs    = jobs.filter((j) => j.status === "in-progress");
  const completedJobs = jobs.filter((j) => j.status === "completed");

  const walletBalance = 6180;
  const pendingPayout = 3500;

  const handleAcceptJob = (jobId: string) => {
    toast({ title: "Job accepted!", description: "Customer has been notified. Good luck!" });
  };

  const handleIdFile = async (side: "front" | "back", file: File) => {
    const b64 = await fileToBase64(file);
    if (side === "front") setIdFront(b64);
    else setIdBack(b64);
  };

  const handleSampleFile = async (index: number, file: File) => {
    const b64 = await fileToBase64(file);
    setSamples((prev) => {
      const next = [...prev];
      next[index] = b64;
      return next;
    });
  };

  const handleSubmitDocs = async () => {
    if (!idFront || !idBack) {
      toast({ title: "Missing ID photos", description: "Please upload both sides of your ID.", variant: "destructive" });
      return;
    }
    const workSamples = samples.filter(Boolean) as string[];
    setSubmittingDocs(true);
    try {
      const res = await fetch("/api/worker/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: user?.id, idFront, idBack, workSamples }),
      });
      if (!res.ok) throw new Error("Failed");
      setDocsSubmitted(true);
      toast({ title: "Documents submitted!", description: "Admin will review within 24 hours." });
    } catch {
      toast({ title: "Submission failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmittingDocs(false);
    }
  };

  const handleSubmitSupport = async () => {
    if (!supportSubject || !supportMessage) return;
    try {
      await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.name,
          userRole: "worker",
          subject: supportSubject,
          message: supportMessage,
          status: "open",
          priority: "medium",
        }),
      });
      toast({ title: "Ticket submitted!", description: "Our team will respond within 24 hours." });
      setSupportOpen(false);
      setSupportSubject("");
      setSupportMessage("");
    } catch {
      toast({ title: "Failed to submit", variant: "destructive" });
    }
  };

  const initials = user?.name?.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2) ?? "W";
  const idUploaded = !!idFront && !!idBack;
  const sampleUploaded = samples.some(Boolean);

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="bg-primary px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <SnapfixLogo size={36} showBackground />
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-0 text-xs">Worker</Badge>
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={() => { logout(); navigate("/login"); }}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="w-14 h-14 border-2 border-white/30">
            <AvatarFallback className="bg-white/20 text-white font-bold text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-white text-xl font-bold">{user?.name}</h1>
            <p className="text-white/80 text-sm">{user?.phone}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-white/70" />
              <span className="text-xs text-white/70">Fundi Account</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet overview */}
      <div className="px-4 -mt-4 mb-4">
        <Card className="border-primary/20">
          <CardContent className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-primary">KES {walletBalance.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Pending Payout</p>
                <p className="text-2xl font-bold">KES {pendingPayout.toLocaleString()}</p>
              </div>
            </div>
            <Button className="w-full mt-4 gap-2" variant="outline" size="sm" data-testid="button-withdraw">
              <CreditCard className="w-4 h-4" />
              Withdraw to M-Pesa
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="px-4">
        <Tabs defaultValue="jobs">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="jobs" className="flex-1" data-testid="tab-jobs">
              <Briefcase className="w-4 h-4 mr-1.5" /> Jobs
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex-1" data-testid="tab-wallet">
              <Wallet className="w-4 h-4 mr-1.5" /> Wallet
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-1" data-testid="tab-profile">
              <ShieldCheck className="w-4 h-4 mr-1.5" /> Verify
            </TabsTrigger>
          </TabsList>

          {/* ── Jobs tab ── */}
          <TabsContent value="jobs" className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Available", value: availableJobs.length, icon: AlertCircle, color: "text-yellow-500" },
                { label: "Active",    value: activeJobs.length,    icon: Clock,         color: "text-primary" },
                { label: "Done",      value: completedJobs.length, icon: CheckCircle2,  color: "text-green-500" },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label}>
                  <CardContent className="py-3 text-center">
                    <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                    <p className="text-xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">No jobs yet</h3>
                  <p className="text-sm text-muted-foreground">New jobs will appear here when customers book you.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {availableJobs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">INCOMING JOBS</h3>
                    {availableJobs.map((job) => (
                      <Card key={job.id} className="mb-3 border-primary/20">
                        <CardContent className="py-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-sm">{job.category}</span>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <MapPin className="w-3 h-3 flex-shrink-0" /> {job.location}
                              </div>
                            </div>
                            <Badge className={(STATUS_BADGE[job.status] ?? STATUS_BADGE["pending"]).class + " border-0 text-xs flex-shrink-0"}>
                              {(STATUS_BADGE[job.status] ?? STATUS_BADGE["pending"]).label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{job.description}</p>
                          {job.imageUrl && (
                            <button
                              type="button"
                              onClick={() => setViewPhoto({ url: job.imageUrl!, title: `${job.category} — Customer Photo` })}
                              className="group relative w-full h-32 rounded-md overflow-hidden border hover-elevate"
                              data-testid={`photo-job-${job.id}`}
                            >
                              <img src={job.imageUrl} alt="Customer problem photo" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                                <Eye className="w-5 h-5 text-white" />
                                <span className="text-white text-xs font-medium">View Photo</span>
                              </div>
                            </button>
                          )}
                          {job.quotedAmount && (
                            <p className="text-sm font-bold">KES {job.quotedAmount.toLocaleString()}</p>
                          )}
                          <Button
                            size="sm"
                            className="w-full gap-1"
                            onClick={() => handleAcceptJob(job.id)}
                            data-testid={`button-accept-job-${job.id}`}
                          >
                            Accept Job <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <h3 className="text-sm font-semibold text-muted-foreground mb-2">ALL JOBS</h3>
                {jobs.map((job) => (
                  <Card key={job.id} className="mb-2">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {job.imageUrl && (
                            <button
                              type="button"
                              onClick={() => setViewPhoto({ url: job.imageUrl!, title: `${job.category} — Customer Photo` })}
                              className="group relative w-10 h-10 rounded-md overflow-hidden border flex-shrink-0 hover-elevate"
                            >
                              <img src={job.imageUrl} alt="Job photo" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-3 h-3 text-white" />
                              </div>
                            </button>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{job.category}{job.area ? ` — ${job.area}` : ""}</p>
                            <p className="text-xs text-muted-foreground truncate">{job.location}</p>
                          </div>
                        </div>
                        <Badge className={(STATUS_BADGE[job.status] ?? STATUS_BADGE["pending"]).class + " border-0 text-xs flex-shrink-0"}>
                          {(STATUS_BADGE[job.status] ?? STATUS_BADGE["pending"]).label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setSupportOpen(true)}
              data-testid="button-support"
            >
              <Phone className="w-4 h-4" /> Contact Support
            </Button>
          </TabsContent>

          {/* ── Wallet tab ── */}
          <TabsContent value="wallet" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Earnings Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This Week</span>
                  <span className="font-semibold">KES 8,700</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This Month</span>
                  <span className="font-semibold">KES 32,400</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee (10%)</span>
                  <span className="text-destructive font-semibold">- KES 3,240</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2 mt-1">
                  <span className="font-medium">Net Earnings</span>
                  <span className="font-bold text-primary">KES 29,160</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">RECENT TRANSACTIONS</h3>
              {MOCK_WALLET_HISTORY.map((tx) => (
                <Card key={tx.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{tx.label}</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                      <span className={`font-bold text-sm ${tx.type === "credit" ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                        {tx.type === "credit" ? "+" : "-"}KES {tx.amount.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button className="w-full gap-2" data-testid="button-withdraw-mpesa">
              <CreditCard className="w-4 h-4" /> Withdraw KES {walletBalance.toLocaleString()} to M-Pesa
            </Button>
          </TabsContent>

          {/* ── Verify tab ── */}
          <TabsContent value="profile" className="space-y-4">
            {docsSubmitted ? (
              <Card>
                <CardContent className="py-8 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <h3 className="font-semibold">Documents Submitted</h3>
                  <p className="text-sm text-muted-foreground">Admin will review your ID and work samples within 24 hours. You'll be notified once approved.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* ID Upload */}
                <Card>
                  <CardContent className="py-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">National ID / Passport</h3>
                      {idUploaded && <Badge className="bg-green-500/10 text-green-600 border-0 text-xs ml-auto">Ready</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload a clear photo of your National ID (front and back) or Passport. Required to start accepting jobs.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {(["front", "back"] as const).map((side) => {
                        const preview = side === "front" ? idFront : idBack;
                        return (
                          <label
                            key={side}
                            className="relative flex flex-col items-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer hover-elevate text-center overflow-hidden aspect-[4/3]"
                            data-testid={`upload-id-${side}`}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleIdFile(side, e.target.files[0])}
                            />
                            {preview ? (
                              <>
                                <img src={preview} alt={`ID ${side}`} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                                <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-2">
                                  <span className="text-white text-xs font-medium capitalize">ID {side} ✓</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <Camera className="w-6 h-6 text-muted-foreground mt-3" />
                                <span className="text-xs text-muted-foreground capitalize">ID {side}</span>
                              </>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Work Samples */}
                <Card>
                  <CardContent className="py-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">Work Samples</h3>
                      {sampleUploaded && (
                        <Badge className="bg-green-500/10 text-green-600 border-0 text-xs ml-auto">
                          {samples.filter(Boolean).length}/5 uploaded
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload up to 5 photos of your previous work. This helps customers choose you with confidence.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {samples.map((preview, i) => (
                        <label
                          key={i}
                          className="relative aspect-square flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-xl cursor-pointer hover-elevate overflow-hidden"
                          data-testid={`upload-sample-${i + 1}`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleSampleFile(i, e.target.files[0])}
                          />
                          {preview ? (
                            <>
                              <img src={preview} alt={`Sample ${i + 1}`} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                              <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-1">
                                <span className="text-white text-xs">{i + 1} ✓</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Photo {i + 1}</span>
                            </>
                          )}
                        </label>
                      ))}
                    </div>

                    <Button
                      className="w-full gap-2"
                      onClick={handleSubmitDocs}
                      disabled={submittingDocs || !idFront || !idBack}
                      data-testid="button-submit-verification"
                    >
                      {submittingDocs ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                      ) : (
                        <><ShieldCheck className="w-4 h-4" /> Submit for Verification</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Status card */}
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${idUploaded && sampleUploaded ? "bg-green-500" : "bg-yellow-500"}`} />
                      <div>
                        <p className="text-sm font-medium">
                          {idUploaded && sampleUploaded ? "Ready to Submit" : "Verification Incomplete"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {idUploaded && sampleUploaded
                            ? "All documents uploaded. Press Submit to send for admin review."
                            : "Upload your ID (both sides) and at least one work sample to get verified."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <ImageIcon className="w-4 h-4 text-primary" />
              {viewPhoto?.title}
            </DialogTitle>
          </DialogHeader>
          {viewPhoto && (
            <div className="rounded-md overflow-hidden">
              <img src={viewPhoto.url} alt={viewPhoto.title} className="w-full object-contain max-h-[60vh]" />
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              <Input
                placeholder="e.g. Payment not received"
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                data-testid="input-support-subject"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                placeholder="Describe your issue in detail…"
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                className="min-h-24"
                data-testid="textarea-support-message"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSupportOpen(false)}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={!supportSubject || !supportMessage}
                onClick={handleSubmitSupport}
                data-testid="button-submit-support"
              >
                Submit Ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
