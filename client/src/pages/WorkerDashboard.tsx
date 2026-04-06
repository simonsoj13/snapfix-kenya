import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import {
  Wallet, Briefcase, ShieldCheck, Camera, MapPin, Clock,
  CheckCircle2, LogOut, ArrowRight, AlertCircle, Upload,
  Phone, CreditCard, TrendingUp, X, FileCheck, Eye, Navigation,
} from "lucide-react";
import type { JobRequest } from "@shared/schema";
import snapfixLogo from "/snapfix-logo.jpg";

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  pending:          { label: "Pending",       class: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  quoted:           { label: "Quoted",        class: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  "deposit-paid":   { label: "Deposit Paid",  class: "bg-primary/10 text-primary" },
  "fundi-arrived":  { label: "Fundi Arrived", class: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  "in-progress":    { label: "In Progress",   class: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  "balance-due":    { label: "Balance Due",   class: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  completed:        { label: "Completed",     class: "bg-green-500/10 text-green-600 dark:text-green-400" },
  cancelled:        { label: "Cancelled",     class: "bg-destructive/10 text-destructive" },
};



function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImageUploadSlot({
  label, value, onChange, testId,
}: { label: string; value: string | null; onChange: (v: string | null) => void; testId?: string }) {
  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    onChange(b64);
  }, [onChange]);

  return (
    <label
      className="relative flex flex-col items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer hover-elevate text-center min-h-24 overflow-hidden"
      data-testid={testId}
    >
      <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value ? (
        <>
          <img src={value} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </>
      ) : (
        <>
          <Camera className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </>
      )}
    </label>
  );
}

function SampleUploadSlot({
  index, value, onChange,
}: { index: number; value: string | null; onChange: (v: string | null) => void }) {
  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    onChange(b64);
  }, [onChange]);

  return (
    <label
      className="relative aspect-square flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-xl cursor-pointer hover-elevate overflow-hidden"
      data-testid={`upload-sample-${index}`}
    >
      <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value ? (
        <>
          <img src={value} alt={`Sample ${index}`} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
          <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
        </>
      ) : (
        <>
          <Upload className="w-5 h-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Photo {index}</span>
        </>
      )}
    </label>
  );
}

export default function WorkerDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [_, navigate] = useLocation();
  
  const { toast } = useToast();
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");



  const [etaOpen, setEtaOpen] = useState(false);
  const [etaJobId, setEtaJobId] = useState<string | null>(null);
  const [etaValue, setEtaValue] = useState("30 minutes");

  // Verification images (base64 strings)
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [samples, setSamples] = useState<(string | null)[]>([null, null, null, null, null]);
  const [submitting, setSubmitting] = useState(false);
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const { data: jobs = [], isLoading } = useQuery<JobRequest[]>({
    queryKey: ["/api/job-requests/worker", user?.id],
    queryFn: () => fetch(`/api/job-requests/worker/${user?.id}`).then((r) => r.json()),
    enabled: !!user?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions/worker", user?.id],
    queryFn: () => fetch(`/api/transactions/worker/${user?.id}`).then(r => r.json()),
    enabled: !!user?.id,
  });

  const { data: walletUser } = useQuery({
    queryKey: ["/api/user", user?.id],
    queryFn: () => fetch(`/api/user/${user?.id}`).then(r => r.json()),
    enabled: !!user?.id,
  });

  const { data: verifyStatus, refetch: refetchVerify } = useQuery({
    queryKey: ["/api/workers/verify-docs", user?.id],
    queryFn: () => fetch(`/api/workers/verify-docs/${user?.id}`).then((r) => r.json()),
    enabled: !!user?.id,
  });

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) { navigate("/login"); return null; }

  const availableJobs = jobs.filter((j) => ["pending", "quoted", "deposit-paid"].includes(j.status));
  const activeJobs    = jobs.filter((j) => ["in-progress", "fundi-arrived", "balance-due"].includes(j.status));
  const completedJobs = jobs.filter((j) => j.status === "completed");

  const walletBalance = walletUser?.walletBalance ?? 0;
  const pendingPayout = transactions.filter(t => t.status === "pending").reduce((sum, t) => sum + t.amount, 0);

  const uploadedCount = [idFront, idBack, ...samples.filter(Boolean)].length;
  const uploadProgress = Math.min(100, Math.round((uploadedCount / 7) * 100));


  const handleAcceptJob = async (jobId: string) => {
    try {
      await fetch(`/api/job-requests/${jobId}/accept`, { method: "PATCH" });
      qc.invalidateQueries({ queryKey: ["/api/job-requests/worker", user.id] });
  } catch (error) {
    console.error("Error accepting job:", error);
  }
};


  const handleDeclineJob = async (jobId: string) => {
    try {
      await fetch(`/api/job-requests/${jobId}/decline`, { method: "PATCH" });
      qc.invalidateQueries({ queryKey: ["/api/job-requests/worker", user.id] });
      toast({ title: "Job declined" });
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const newStatus = isOnline ? 0 : 1;
      await fetch(`/api/workers/${user.id}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availableNow: newStatus }),
      });
      setIsOnline(!isOnline);
      toast({ title: newStatus === 1 ? "You are now Online 🟢" : "You are now Offline 🔴" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleMarkOnTheWay = async () => {
    if (!etaJobId) return;
    try {
      await fetch(`/api/job-requests/${etaJobId}/on-the-way`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimatedArrival: etaValue }),
      });
      qc.invalidateQueries({ queryKey: ["/api/job-requests/worker", user?.id] });
      toast({ title: "Customer notified!", description: `ETA sent: ${etaValue}` });
      setEtaOpen(false);
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleSubmitVerification = async () => {
    if (!user) return;
    if (!idFront || !idBack) {
      toast({ title: "ID documents required", description: "Please upload both front and back of your ID.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/workers/verify-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          workerName: user.name,
          email: user.email,
          phone: user.phone,
          idFront,
          idBack,
          workSamples: samples.filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      await refetchVerify();
      toast({ title: "Verification submitted!", description: "Admin will review your documents within 24 hours." });
    } catch {
      toast({ title: "Failed to submit", variant: "destructive" });
    } finally {
      setSubmitting(false);
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

  const verifyStatusBadge = verifyStatus?.status === "approved"
    ? { label: "Verified", class: "bg-green-500/10 text-green-600 border-0" }
    : verifyStatus?.status === "rejected"
    ? { label: "Rejected", class: "bg-destructive/10 text-destructive border-0" }
    : verifyStatus?.status === "pending"
    ? { label: "Under Review", class: "bg-yellow-500/10 text-yellow-600 border-0" }
    : null;

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="bg-primary px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <img src={snapfixLogo} alt="Snap-Fix Kenya" className="w-10 h-10 rounded-xl object-cover" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5 text-white text-xs" onClick={handleToggleAvailability}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400" : "bg-red-400"}`} />
              {isOnline ? "Online" : "Offline"}
            </Button>
            <Badge className="bg-white/20 text-white border-0 text-xs">Fundi</Badge>
            <Button variant="ghost" size="icon" className="text-white" onClick={() => { logout(); navigate("/login"); }} data-testid="button-logout">
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
            <p className="text-white/80 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-white/70" />
              <span className="text-xs text-white/70">Fundi Account</span>
              {verifyStatusBadge && (
                <Badge className={`text-xs ${verifyStatusBadge.class}`}>{verifyStatusBadge.label}</Badge>
              )}
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
                <p className="text-2xl font-bold text-primary" data-testid="text-wallet-balance">
                  KES {walletBalance.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Pending Payout</p>
                <p className="text-2xl font-bold">KES {pendingPayout.toLocaleString()}</p>
              </div>
            </div>
            <Button className="w-full mt-4 gap-2" variant="outline" size="sm" data-testid="button-withdraw">
              <CreditCard className="w-4 h-4" /> Withdraw to M-Pesa
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
                { label: "Active",    value: activeJobs.length,    icon: Clock,        color: "text-primary" },
                { label: "Done",      value: completedJobs.length, icon: CheckCircle2, color: "text-green-500" },
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
                {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
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
                          <div className="flex items-start gap-3">
                            {job.imageUrl && (
                              <img
                                src={job.imageUrl}
                                alt="Customer photo"
                                className="w-24 h-24 rounded-xl object-cover flex-shrink-0 cursor-pointer border-2 border-primary/20 shadow-md"
                                onClick={() => setPreviewImg(job.imageUrl)}
                                data-testid={`img-job-photo-${job.id}`}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className={"font-semibold text-sm " + (job.category === "Emergency" ? "text-red-500" : "")}>{job.category === "Emergency" ? "🚨 " : ""}{job.category}</span>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                    <MapPin className="w-3 h-3" /> {job.location}
                                  </div>
                                </div>
                                <Badge className={(STATUS_BADGE[job.status] ?? STATUS_BADGE["pending"]).class + " border-0 text-xs flex-shrink-0"}>
                                  {(STATUS_BADGE[job.status] ?? STATUS_BADGE["pending"]).label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{job.description}</p>
                              {job.quotedAmount && <p className="text-sm font-bold mt-1">KES {job.quotedAmount.toLocaleString()}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1 gap-1" onClick={() => handleAcceptJob(job.id)} data-testid={`button-accept-job-${job.id}`}>
                              Accept Job <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                            {job.status === "deposit-paid" && job.workerOnWay !== 1 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => { setEtaJobId(job.id); setEtaOpen(true); }}
                                data-testid={`button-on-the-way-${job.id}`}
                              >
                                <Navigation className="w-3.5 h-3.5" /> On My Way
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">ALL JOBS</h3>
                {jobs.map((job) => (
                  <Card key={job.id} className="mb-2">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-3">
                        {job.imageUrl && (
                          <img
                            src={job.imageUrl}
                            alt="Customer photo"
                            className="w-10 h-10 rounded-md object-cover flex-shrink-0 cursor-pointer border border-border"
                            onClick={() => setPreviewImg(job.imageUrl)}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{job.category} — {job.area}</p>
                          <p className="text-xs text-muted-foreground truncate">{job.location}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <Badge className={(STATUS_BADGE[job.status] ?? STATUS_BADGE["pending"]).class + " border-0 text-xs"}>
                            {(STATUS_BADGE[job.status] ?? STATUS_BADGE["pending"]).label}
                          </Badge>
                          {job.status === "deposit-paid" && job.workerOnWay !== 1 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1 h-6"
                              onClick={() => { setEtaJobId(job.id); setEtaOpen(true); }}
                            >
                              <Navigation className="w-3 h-3" /> On My Way
                            </Button>
                          )}
                          {job.workerOnWay === 1 && (
                            <span className="text-xs text-primary font-medium flex items-center gap-1">
                              <Navigation className="w-3 h-3" /> Heading there
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Button variant="outline" className="w-full gap-2" onClick={() => setSupportOpen(true)} data-testid="button-support">
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
                <div className="border-t pt-2 flex justify-between text-sm font-bold">
                  <span>Net Earnings</span>
                  <span className="text-primary">KES 29,160</span>
                </div>
              </CardContent>
            </Card>
            <h3 className="text-sm font-semibold text-muted-foreground">TRANSACTION HISTORY</h3>
            <div className="space-y-2">
              {transactions.map((tx) => (
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
            {/* Status card */}
            {verifyStatus ? (
              <Card className={verifyStatus.status === "approved" ? "border-green-500/30" : verifyStatus.status === "rejected" ? "border-destructive/30" : "border-yellow-500/30"}>
                <CardContent className="py-4 flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${verifyStatus.status === "approved" ? "bg-green-500" : verifyStatus.status === "rejected" ? "bg-destructive" : "bg-yellow-500"}`} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm capitalize">{verifyStatus.status === "pending" ? "Under Review" : verifyStatus.status}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {verifyStatus.status === "approved" && "Your identity has been verified. You can now accept jobs!"}
                      {verifyStatus.status === "rejected" && (verifyStatus.reviewNote ?? "Documents were not accepted. Please resubmit.")}
                      {verifyStatus.status === "pending" && "Admin is reviewing your documents. Usually within 24 hours."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Submitted: {new Date(verifyStatus.submittedAt).toLocaleString("en-KE")}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-3 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">Upload your ID and work samples to start accepting jobs.</p>
                </CardContent>
              </Card>
            )}

            {/* Upload progress */}
            {uploadedCount > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Upload progress</span>
                  <span>{uploadedCount} / 7 documents</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* ID Upload */}
            <Card>
              <CardContent className="py-4 space-y-4">
                <div className="w-full space-y-4 mb-6">
                  <h3 className="font-semibold text-base">Your Details</h3>
                  <div className="w-full">
                    <Label className="text-sm font-medium">Specialty</Label>
                    <select value={specialty} onChange={e => setSpecialty(e.target.value)} className="w-full mt-1 border rounded-md p-2.5 text-sm bg-background block">
                      <option value="">Select your specialty</option>
                      <option>Plumbing</option>
                      <option>Electrical</option>
                      <option>Welding</option>
                      <option>Carpentry</option>
                      <option>HVAC</option>
                      <option>Appliance</option>
                      <option>Painting</option>
                      <option>General</option>
                    </select>
                  </div>
                  <div className="w-full">
                    <Label className="text-sm font-medium">Years of Experience</Label>
                    <Input type="number" value={yearsExp} onChange={e => setYearsExp(e.target.value)} placeholder="e.g. 5" className="mt-1 w-full" />
                  </div>
                  <div className="w-full">
                    <Label className="text-sm font-medium">Brief Description</Label>
                    <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Describe what you do and your expertise..." className="mt-1 w-full" rows={3} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 mb-1">
                  <h3 className="font-semibold">National ID / Passport</h3>
                  {idFront && idBack && <Badge className="bg-green-500/10 text-green-600 border-0 text-xs">Both uploaded</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mb-3">Upload a clear photo of the front and back of your ID.</p>
                <div className="grid grid-cols-2 gap-3">
                  <ImageUploadSlot label="Front Side" value={idFront} onChange={setIdFront} testId="upload-id-front" />
                  <ImageUploadSlot label="Back Side"  value={idBack}  onChange={setIdBack}  testId="upload-id-back"  />
                </div>
                {(idFront || idBack) && (
                  <div className="flex gap-2">
                    {idFront && (
                      <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => setPreviewImg(idFront)} data-testid="button-preview-id-front">
                        <Eye className="w-3.5 h-3.5" /> Front
                      </Button>
                    )}
                    {idBack && (
                      <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => setPreviewImg(idBack)} data-testid="button-preview-id-back">
                        <Eye className="w-3.5 h-3.5" /> Back
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Work Samples */}
            <Card>
              <CardContent className="py-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Work Samples</h3>
                  {samples.filter(Boolean).length > 0 && (
                    <Badge className="bg-green-500/10 text-green-600 border-0 text-xs ml-auto">
                      {samples.filter(Boolean).length} uploaded
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Upload up to 5 photos of your previous work.</p>
                <div className="grid grid-cols-3 gap-2">
                  {samples.map((s, i) => (
                    <SampleUploadSlot
                      key={i}
                      index={i + 1}
                      value={s}
                      onChange={(v) => setSamples((prev) => { const n = [...prev]; n[i] = v; return n; })}
                    />
                  ))}
                </div>
                {samples.some(Boolean) && (
                  <div className="flex gap-2 flex-wrap">
                    {samples.map((s, i) => s && (
                      <Button key={i} size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => setPreviewImg(s)} data-testid={`button-preview-sample-${i + 1}`}>
                        <Eye className="w-3.5 h-3.5" /> Photo {i + 1}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              className="w-full gap-2"
              onClick={handleSubmitVerification}
              disabled={submitting || (!idFront && !idBack)}
              data-testid="button-submit-verification"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Submitting…</>
              ) : (
                <><FileCheck className="w-4 h-4" /> Submit for Admin Verification</>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {/* ETA / On The Way Dialog */}
      <Dialog open={etaOpen} onOpenChange={setEtaOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-primary" /> Notify Customer — On My Way
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Let the customer know you are heading to their location. Select your estimated arrival time.
            </p>
            <div className="space-y-1.5">
              <Label>Estimated Arrival Time</Label>
              <select
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
                value={etaValue}
                onChange={(e) => setEtaValue(e.target.value)}
                data-testid="select-eta"
              >
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>45 minutes</option>
                <option>1 hour</option>
                <option>1.5 hours</option>
                <option>2 hours</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEtaOpen(false)}>Cancel</Button>
              <Button className="flex-1 gap-1" onClick={handleMarkOnTheWay} data-testid="button-confirm-eta">
                <Navigation className="w-4 h-4" /> Send Notification
              </Button>
            </div>
          </div>
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
              <Input placeholder="e.g. Payment not received" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} data-testid="input-support-subject" />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea placeholder="Describe your issue in detail…" value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} className="min-h-24" data-testid="textarea-support-message" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSupportOpen(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!supportSubject || !supportMessage} onClick={handleSubmitSupport} data-testid="button-submit-support">
                Submit Ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview */}
      <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
        <DialogContent className="max-w-lg p-2">
          <button className="absolute top-2 right-2 z-10 p-1 bg-black/60 rounded-full" onClick={() => setPreviewImg(null)} data-testid="button-close-preview">
            <X className="w-4 h-4 text-white" />
          </button>
          {previewImg && <img src={previewImg} alt="Preview" className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
