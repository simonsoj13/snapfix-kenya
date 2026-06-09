import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useRoute } from "wouter";
import {
  Building2, Calendar, CheckCircle2, Clock, AlertCircle, TrendingUp, MapPin, Star, Wrench,
  ChevronRight, Eye, MessageSquare, Plus, LogOut, Home, BarChart3, Zap, Filter,
} from "lucide-react";

interface BundleInfo {
  id: string;
  orgName: string;
  planType: string;
  units: number;
  monthlyJobQuota: number;
  monthlyPrice: number;
  status: string;
  startDate: string;
  renewalDate: string;
}

interface Property {
  id: string;
  bundleId: string;
  propertyName: string;
  address: string;
  units: number;
}

interface BundleJob {
  id: string;
  bundleId: string;
  propertyId: string;
  category: string;
  description: string;
  priority: string;
  status: string; // scheduled, assigned, in-progress, completed, cancelled
  scheduledDate: string;
  assignedWorkerName: string | null;
  estimatedCost: number;
  actualCost: number | null;
  completedDate: string | null;
  rating: number | null;
  feedback: string | null;
  beforePhoto: string | null;
  afterPhoto: string | null;
  createdAt: string;
}

interface UsageStats {
  jobsScheduled: number;
  jobsCompleted: number;
  jobsInProgress: number;
  jobsCancelled: number;
  totalSpent: number;
}

const STATUS_COLOR: Record<string, { badge: string; icon: any; label: string }> = {
  scheduled: { badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: Calendar, label: "Scheduled" },
  assigned: { badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400", icon: CheckCircle2, label: "Assigned" },
  "in-progress": { badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400", icon: Zap, label: "In Progress" },
  completed: { badge: "bg-green-500/10 text-green-600 dark:text-green-400", icon: CheckCircle2, label: "Completed" },
  cancelled: { badge: "bg-destructive/10 text-destructive", icon: AlertCircle, label: "Cancelled" },
};

export default function LandlordDashboard() {
  const { user, logout } = useAuth();
  const [match, params] = useRoute("/landlord-dashboard");
  const navigate = (path: string) => window.location.href = path;
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
  const [jobDetailsOpen, setJobDetailsOpen] = useState<BundleJob | null>(null);
  const [scheduleJobOpen, setScheduleJobOpen] = useState(false);
  const [newJobCategory, setNewJobCategory] = useState("");
  const [newJobDescription, setNewJobDescription] = useState("");
  const [newJobDate, setNewJobDate] = useState("");
  const [newJobPriority, setNewJobPriority] = useState("normal");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Fetch bundle info
  const { data: bundle, isLoading: bundleLoading } = useQuery<BundleInfo>({
    queryKey: ["/api/landlord/bundle", user?.id],
    queryFn: () => fetch(`/api/landlord/bundle/${user?.id}`).then(r => r.json()),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Fetch properties
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/landlord/properties", bundle?.id],
    queryFn: () => fetch(`/api/landlord/properties/${bundle?.id}`).then(r => r.json()),
    enabled: !!bundle?.id,
  });

  // Fetch jobs
  const { data: jobs = [] } = useQuery<BundleJob[]>({
    queryKey: ["/api/landlord/jobs", bundle?.id],
    queryFn: () => fetch(`/api/landlord/jobs/${bundle?.id}`).then(r => r.json()),
    enabled: !!bundle?.id,
    refetchInterval: 15000,
  });

  // Fetch usage stats
  const { data: usage } = useQuery<UsageStats>({
    queryKey: ["/api/landlord/usage", bundle?.id],
    queryFn: () => fetch(`/api/landlord/usage/${bundle?.id}`).then(r => r.json()),
    enabled: !!bundle?.id,
    refetchInterval: 10000,
  });

  // Schedule new job
  const scheduleJobMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPropertyId || !newJobCategory || !newJobDescription || !newJobDate) {
        throw new Error("Fill all fields");
      }
      const res = await fetch("/api/landlord/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: bundle?.id,
          propertyId: selectedPropertyId,
          category: newJobCategory,
          description: newJobDescription,
          scheduledDate: newJobDate,
          priority: newJobPriority,
        }),
      });
      if (!res.ok) throw new Error("Failed to schedule");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/landlord/jobs", bundle?.id] });
      setScheduleJobOpen(false);
      setNewJobCategory("");
      setNewJobDescription("");
      setNewJobDate("");
      setNewJobPriority("normal");
      toast({ title: "Job scheduled!", description: "Fundi will be assigned soon." });
    },
    onError: () => {
      toast({ title: "Failed to schedule job", variant: "destructive" });
    },
  });

  if (bundleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto" />
              <h3 className="font-bold text-lg">No Active Bundle</h3>
              <p className="text-sm text-muted-foreground">Subscribe to a bundle to start managing your repairs.</p>
              <Button onClick={() => navigate("/landlord")} variant="outline">
                View Bundles
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const sortedJobs = [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const filteredJobs = filterStatus === "all" ? sortedJobs : sortedJobs.filter(j => j.status === filterStatus);
  
  const completionRate = jobs.length > 0 ? Math.round((jobs.filter(j => j.status === "completed").length / jobs.length) * 100) : 0;
  const remainingQuota = Math.max(0, bundle.monthlyJobQuota - (usage?.jobsScheduled ?? 0));

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-base">{bundle.orgName}</h1>
              <p className="text-xs text-muted-foreground capitalize">{bundle.planType} Plan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" /> {bundle.status}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} data-testid="button-home">
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/login"); }} data-testid="button-logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Properties</p>
                  <p className="text-2xl font-bold mt-1">{properties.length}</p>
                </div>
                <Building2 className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Jobs This Month</p>
                  <p className="text-2xl font-bold mt-1">{usage?.jobsCompleted ?? 0}/{bundle.monthlyJobQuota}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{remainingQuota} remaining</p>
                </div>
                <Zap className="w-5 h-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Completion Rate</p>
                  <p className="text-2xl font-bold mt-1">{completionRate}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{jobs.filter(j => j.status === "completed").length} completed</p>
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Spent This Month</p>
                  <p className="text-2xl font-bold mt-1">KES {(usage?.totalSpent ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">of monthly budget</p>
                </div>
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Jobs Alert */}
        {jobs.filter(j => j.status === "in-progress").length > 0 && (
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Zap className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  {jobs.filter(j => j.status === "in-progress").length} job{jobs.filter(j => j.status === "in-progress").length !== 1 ? "s" : ""} in progress
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Monitor progress in the Jobs tab below</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4 grid grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Jobs Timeline</TabsTrigger>
            <TabsTrigger value="properties" data-testid="tab-properties">Properties</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Jobs Timeline Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs border rounded-md px-2 py-1 bg-background"
                  data-testid="select-job-filter"
                >
                  <option value="all">All Jobs</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <Button size="sm" onClick={() => setScheduleJobOpen(true)} className="gap-1.5" data-testid="button-schedule-job">
                <Plus className="w-4 h-4" /> Schedule Job
              </Button>
            </div>

            {filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-semibold">No jobs yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Schedule your first maintenance job</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job) => {
                  const statusInfo = STATUS_COLOR[job.status];
                  const prop = properties.find(p => p.id === job.propertyId);
                  return (
                    <Card key={job.id} className="hover:shadow-md transition-shadow" data-testid={`card-job-${job.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{job.category}</span>
                              <Badge className={`text-xs border-0 ${statusInfo.badge}`}>
                                {statusInfo.label}
                              </Badge>
                              <span className={`text-xs font-medium px-2 py-1 rounded ${
                                job.priority === "urgent" ? "bg-red-500/10 text-red-600"
                                : job.priority === "high" ? "bg-orange-500/10 text-orange-600"
                                : job.priority === "normal" ? "bg-blue-500/10 text-blue-600"
                                : "bg-muted text-muted-foreground"
                              }`}>
                                {job.priority}
                              </span>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {prop?.propertyName || "—"}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(job.scheduledDate).toLocaleDateString("en-KE")}
                              </div>
                              {job.assignedWorkerName && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                  {job.assignedWorkerName}
                                </div>
                              )}
                            </div>

                            {/* Cost tracking */}
                            <div className="flex items-center gap-4 text-xs flex-wrap pt-1">
                              <span className="text-muted-foreground">
                                Est: <strong>KES {job.estimatedCost?.toLocaleString() || "—"}</strong>
                              </span>
                              {job.actualCost && (
                                <span className="text-muted-foreground">
                                  Actual: <strong>KES {job.actualCost.toLocaleString()}</strong>
                                </span>
                              )}
                            </div>

                            {/* Rating & Feedback */}
                            {job.status === "completed" && job.rating && (
                              <div className="flex items-center gap-1 text-xs">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${i < job.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1"
                              onClick={() => setJobDetailsOpen(job)}
                              data-testid={`button-view-${job.id}`}
                            >
                              <Eye className="w-4 h-4" /> View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.map((prop) => {
                const propJobs = jobs.filter(j => j.propertyId === prop.id);
                const completed = propJobs.filter(j => j.status === "completed").length;
                return (
                  <Card key={prop.id} data-testid={`card-property-${prop.id}`}>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="font-semibold">{prop.propertyName}</p>
                        <p className="text-sm text-muted-foreground">{prop.address}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Units</p>
                          <p className="font-bold">{prop.units}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Jobs</p>
                          <p className="font-bold">{completed}/{propJobs.length} completed</p>
                        </div>
                      </div>
                      {prop.notes && <p className="text-xs text-muted-foreground italic">"{prop.notes}"</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Job Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { status: "scheduled", count: jobs.filter(j => j.status === "scheduled").length },
                    { status: "assigned", count: jobs.filter(j => j.status === "assigned").length },
                    { status: "in-progress", count: jobs.filter(j => j.status === "in-progress").length },
                    { status: "completed", count: jobs.filter(j => j.status === "completed").length },
                  ].map(({ status, count }) => (
                    <div key={status} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{status}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Monthly Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Jobs Scheduled</span>
                    <span className="font-semibold">{usage?.jobsScheduled ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Jobs Completed</span>
                    <span className="font-semibold">{usage?.jobsCompleted ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Spent</span>
                    <span className="font-semibold">KES {(usage?.totalSpent ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Avg Cost/Job</span>
                    <span className="font-semibold">
                      KES {usage?.jobsCompleted && usage.jobsCompleted > 0 ? Math.round(usage.totalSpent / usage.jobsCompleted).toLocaleString() : "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent completed jobs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recently Completed</CardTitle>
              </CardHeader>
              <CardContent>
                {jobs.filter(j => j.status === "completed").slice(0, 5).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No completed jobs yet</p>
                ) : (
                  <div className="space-y-2">
                    {jobs.filter(j => j.status === "completed").slice(0, 5).map((job) => (
                      <div key={job.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                        <span className="text-muted-foreground truncate max-w-sm">{job.category} — {job.description}</span>
                        <span className="font-semibold flex-shrink-0">KES {job.actualCost?.toLocaleString() || job.estimatedCost?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Schedule Job Dialog */}
      <Dialog open={scheduleJobOpen} onOpenChange={setScheduleJobOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Schedule Maintenance Job
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Property *</Label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                data-testid="select-property"
              >
                <option value="">Select property…</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.propertyName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Category *</Label>
              <select
                value={newJobCategory}
                onChange={(e) => setNewJobCategory(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                data-testid="select-category"
              >
                <option value="">Select category…</option>
                <option>Plumbing</option>
                <option>Electrical</option>
                <option>Carpentry</option>
                <option>Painting</option>
                <option>HVAC</option>
                <option>Appliance</option>
                <option>General</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the job…"
                value={newJobDescription}
                onChange={(e) => setNewJobDescription(e.target.value)}
                className="text-sm"
                rows={3}
                data-testid="input-job-description"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Scheduled Date *</Label>
              <Input
                type="date"
                value={newJobDate}
                onChange={(e) => setNewJobDate(e.target.value)}
                data-testid="input-job-date"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <select
                value={newJobPriority}
                onChange={(e) => setNewJobPriority(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                data-testid="select-priority"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setScheduleJobOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={() => scheduleJobMutation.mutate()} disabled={scheduleJobMutation.isPending} data-testid="button-confirm-schedule">
                {scheduleJobMutation.isPending ? "Scheduling…" : "Schedule Job"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Details Dialog */}
      <Dialog open={!!jobDetailsOpen} onOpenChange={() => setJobDetailsOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Job Details
            </DialogTitle>
          </DialogHeader>
          {jobDetailsOpen && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <p className="font-semibold">{jobDetailsOpen.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge className={`border-0 text-xs ${STATUS_COLOR[jobDetailsOpen.status].badge}`}>
                    {STATUS_COLOR[jobDetailsOpen.status].label}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{jobDetailsOpen.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Scheduled Date</p>
                  <p className="text-sm font-medium">{new Date(jobDetailsOpen.scheduledDate).toLocaleDateString("en-KE")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Worker</p>
                  <p className="text-sm font-medium">{jobDetailsOpen.assignedWorkerName || "—"}</p>
                </div>
              </div>

              {jobDetailsOpen.status === "completed" && (
                <>
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-semibold text-sm">Completion Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Completed Date</p>
                        <p className="text-sm">{new Date(jobDetailsOpen.completedDate || "").toLocaleDateString("en-KE")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Rating</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < (jobDetailsOpen.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {jobDetailsOpen.feedback && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Feedback</p>
                        <p className="text-sm italic">"{jobDetailsOpen.feedback}"</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-sm">Cost</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated:</span>
                  <span className="font-semibold">KES {jobDetailsOpen.estimatedCost?.toLocaleString() || "—"}</span>
                </div>
                {jobDetailsOpen.actualCost && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Actual:</span>
                    <span className="font-semibold">KES {jobDetailsOpen.actualCost.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {(jobDetailsOpen.beforePhoto || jobDetailsOpen.afterPhoto) && (
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold text-sm">Photos</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {jobDetailsOpen.beforePhoto && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Before</p>
                        <img src={jobDetailsOpen.beforePhoto} alt="Before" className="w-full h-24 object-cover rounded-md border" />
                      </div>
                    )}
                    {jobDetailsOpen.afterPhoto && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">After</p>
                        <img src={jobDetailsOpen.afterPhoto} alt="After" className="w-full h-24 object-cover rounded-md border" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={() => setJobDetailsOpen(null)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
