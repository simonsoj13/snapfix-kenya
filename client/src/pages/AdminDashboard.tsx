import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import WorkerMapView from "@/components/WorkerMapView";
import JobStatusBadge from "@/components/JobStatusBadge";
import { getWorkerImage } from "@/lib/workerImages";
import type { Worker, JobRequest, WorkerVerification } from "@shared/schema";
import {
  Users, Briefcase, Star, TrendingUp, MapPin, CheckCircle2, Clock, XCircle, Activity,
  ToggleLeft, ToggleRight, LogOut, CreditCard, RotateCcw, HeadphonesIcon,
  Settings, MessageSquare, ShieldCheck, ThumbsUp, ThumbsDown, ImageIcon, Eye,
} from "lucide-react";
import SnapfixLogo from "@/components/SnapfixLogo";

interface AdminStats {
  totalWorkers: number; activeWorkers: number;
  totalRequests: number; pendingRequests: number;
  completedRequests: number; inProgressRequests: number;
  cancelledRequests: number; avgRating: number;
  totalRevenue: number; totalUsers: number;
}
interface TrendPoint { day: string; requests: number; completed: number; revenue: number; }
interface CategoryPoint { name: string; value: number; }
interface Transaction {
  id: string; customerName: string; workerName: string; amount: number;
  type: string; status: string; phone: string; mpesaRef: string;
  category: string; createdAt: string;
}
interface SupportTicket {
  id: string; userName: string; userRole: string; subject: string; message: string;
  status: string; priority: string; createdAt: string; response?: string;
}
interface PricingConfig { category: string; baseMin: number; baseMax: number; depositPercent: number; }

const PIE_COLORS = ["#0d9488","#f97316","#3b82f6","#8b5cf6","#ef4444","#06b6d4"];

function StatCard({ title, value, subtitle, icon: Icon, trend }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; trend?: { value: number; positive: boolean };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend.positive ? "text-green-600" : "text-destructive"}`}>
            {trend.positive ? "▲" : "▼"} {Math.abs(trend.value)}% vs last week
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const STATUS_TX: Record<string, string> = {
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  reversed:  "bg-destructive/10 text-destructive",
  pending:   "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
};
const PRIORITY_BADGE: Record<string, string> = {
  high:   "bg-destructive/10 text-destructive",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  low:    "bg-primary/10 text-primary",
};

export default function AdminDashboard() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { logout } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [replyOpen, setReplyOpen] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => fetch("/api/admin/stats").then((r) => r.json()),
    refetchInterval: 15000,
  });
  const { data: trend = [] } = useQuery<TrendPoint[]>({
    queryKey: ["/api/admin/requests-trend"],
    queryFn: () => fetch("/api/admin/requests-trend").then((r) => r.json()),
    refetchInterval: 30000,
  });
  const { data: categoryData = [] } = useQuery<CategoryPoint[]>({
    queryKey: ["/api/admin/category-breakdown"],
    queryFn: () => fetch("/api/admin/category-breakdown").then((r) => r.json()),
  });
  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/admin/workers"],
    queryFn: () => fetch("/api/admin/workers").then((r) => r.json()),
    refetchInterval: 10000,
  });
  const { data: requests = [] } = useQuery<JobRequest[]>({
    queryKey: ["/api/admin/requests"],
    queryFn: () => fetch("/api/admin/requests").then((r) => r.json()),
    refetchInterval: 10000,
  });
  const { data: transactions = [], refetch: refetchTx } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    queryFn: () => fetch("/api/admin/transactions").then((r) => r.json()),
  });
  const { data: tickets = [], refetch: refetchTickets } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support"],
    queryFn: () => fetch("/api/support").then((r) => r.json()),
  });
  const { data: verifications = [], refetch: refetchVer } = useQuery<WorkerVerification[]>({
    queryKey: ["/api/admin/verifications"],
    queryFn: () => fetch("/api/admin/verifications").then((r) => r.json()),
    refetchInterval: 10000,
  });

  const [viewPhoto, setViewPhoto] = useState<{ url: string; title: string } | null>(null);
  const { data: pricing = [], refetch: refetchPricing } = useQuery<PricingConfig[]>({
    queryKey: ["/api/pricing"],
    queryFn: () => fetch("/api/pricing").then((r) => r.json()),
  });

  const toggleMutation = useMutation({
    mutationFn: (wId: string) =>
      fetch(`/api/admin/workers/${wId}/toggle-availability`, { method: "PATCH" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/workers"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Worker availability updated" });
    },
  });

  const reverseMutation = useMutation({
    mutationFn: (txId: string) =>
      fetch(`/api/admin/transactions/${txId}/reverse`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      refetchTx();
      toast({ title: "Transaction reversed", description: "Funds will be returned to customer." });
    },
  });

  const updateTicket = useMutation({
    mutationFn: ({ id, ...updates }: { id: string; status?: string; response?: string }) =>
      fetch(`/api/support/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).then((r) => r.json()),
    onSuccess: () => {
      refetchTickets();
      toast({ title: "Ticket updated" });
    },
  });

  const [pricingEdits, setPricingEdits] = useState<Record<string, { baseMin: number; baseMax: number }>>({});

  const savePricing = async (category: string) => {
    const edit = pricingEdits[category];
    if (!edit) return;
    await fetch(`/api/pricing/${encodeURIComponent(category)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edit),
    });
    refetchPricing();
    setPricingEdits((p) => { const n = { ...p }; delete n[category]; return n; });
    toast({ title: `${category} pricing updated` });
  };

  const handleReply = () => {
    if (!replyOpen) return;
    updateTicket.mutate({ id: replyOpen.id, status: "resolved", response: replyText });
    setReplyOpen(null);
    setReplyText("");
  };

  const updateRequestStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/job-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/requests"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Request updated" });
    },
  });

  const approveVerification = useMutation({
    mutationFn: ({ userId, adminNote }: { userId: string; adminNote?: string }) =>
      fetch(`/api/admin/verifications/${userId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote }),
      }).then((r) => r.json()),
    onSuccess: () => { refetchVer(); toast({ title: "Worker ID documents approved" }); },
  });

  const rejectVerification = useMutation({
    mutationFn: ({ userId, adminNote }: { userId: string; adminNote?: string }) =>
      fetch(`/api/admin/verifications/${userId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote }),
      }).then((r) => r.json()),
    onSuccess: () => { refetchVer(); toast({ title: "Worker verification rejected" }); },
  });

  const pendingVerifications = verifications.filter((v) => v.status === "pending").length;
  const openTickets = tickets.filter((t) => t.status !== "resolved").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 md:px-8 gap-4">
          <div className="flex items-center gap-3">
            <SnapfixLogo size={38} showBackground />
            <div>
              <h1 className="text-lg font-bold leading-tight">Snap-Fix Kenya</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground hidden sm:inline">Live</span>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">Admin</Badge>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { logout(); navigate("/admin-login"); }} data-testid="button-admin-logout">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats?.totalUsers ?? "—"} subtitle="Registered on platform" icon={Users} trend={{ value: 12, positive: true }} />
          <StatCard title="Active Fundis" value={`${stats?.activeWorkers ?? "—"} / ${stats?.totalWorkers ?? "—"}`} subtitle="Currently available" icon={Briefcase} trend={{ value: 5, positive: true }} />
          <StatCard title="Revenue (KES)" value={stats ? `${(stats.totalRevenue).toLocaleString()}` : "—"} subtitle="Platform earnings" icon={CreditCard} trend={{ value: 18, positive: true }} />
          <StatCard title="Avg. Rating" value={stats?.avgRating ?? "—"} subtitle="Across all fundis" icon={Star} trend={{ value: 2, positive: true }} />
        </div>

        {/* Status Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pending", value: stats?.pendingRequests ?? 0, icon: Clock, color: "text-yellow-600 bg-yellow-500/10" },
            { label: "In Progress", value: stats?.inProgressRequests ?? 0, icon: Activity, color: "text-blue-600 bg-blue-500/10" },
            { label: "Completed", value: stats?.completedRequests ?? 0, icon: CheckCircle2, color: "text-green-600 bg-green-500/10" },
            { label: "Cancelled", value: stats?.cancelledRequests ?? 0, icon: XCircle, color: "text-destructive bg-destructive/10" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color.split(" ")[1]}`}>
                  <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap gap-1">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="map" data-testid="tab-map">Live Map</TabsTrigger>
            <TabsTrigger value="workers" data-testid="tab-workers">Fundis</TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests">Requests</TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">
              <CreditCard className="w-3.5 h-3.5 mr-1" />Transactions
            </TabsTrigger>
            <TabsTrigger value="support" data-testid="tab-support">
              <HeadphonesIcon className="w-3.5 h-3.5 mr-1" />Support
              {openTickets > 0 && (
                <Badge className="ml-1 bg-destructive text-destructive-foreground text-xs border-0 no-default-active-elevate">{openTickets}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="verifications" data-testid="tab-verifications">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />ID Docs
              {pendingVerifications > 0 && (
                <Badge className="ml-1 bg-yellow-500 text-white border-0 text-xs no-default-active-elevate">{pendingVerifications}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pricing" data-testid="tab-pricing">
              <Settings className="w-3.5 h-3.5 mr-1" />Pricing
            </TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="w-4 h-4" /> Request Volume – Last 7 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={trend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gComp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="day" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="requests" name="Total Requests" stroke="#0d9488" fill="url(#gReq)" strokeWidth={2} />
                      <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" fill="url(#gComp)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Service Categories</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                        {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="w-4 h-4" /> Daily Revenue (KES) – Last 7 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => [`KES ${v.toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="revenue" name="Revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Live Map ── */}
          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="w-4 h-4" /> Live Fundi Locations
                  <Badge variant="secondary" className="ml-auto">{workers.filter((w) => w.availableNow === 1).length} available</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden rounded-b-lg">
                <div className="h-[520px]"><WorkerMapView workers={workers} /></div>
              </CardContent>
            </Card>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {workers.map((w) => (
                <Card key={w.id} className="p-3 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${w.availableNow === 1 ? "bg-green-500" : "bg-muted-foreground"}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{w.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{w.specialty}</p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Workers ── */}
          <TabsContent value="workers">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Fundi Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fundi</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Rate (KES/hr)</TableHead>
                        <TableHead>Jobs</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workers.map((worker) => (
                        <TableRow key={worker.id} data-testid={`row-worker-${worker.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9">
                                <AvatarImage src={getWorkerImage(worker.specialty)} alt={worker.name} />
                                <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm whitespace-nowrap">{worker.name}</p>
                                {worker.verified === 1 && (
                                  <p className="text-xs text-primary flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3" /> Verified
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="secondary" className="whitespace-nowrap">{worker.specialty}</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                              <span className="text-sm font-medium">{worker.rating.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">({worker.reviewCount})</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">KES {worker.hourlyRate.toLocaleString()}</TableCell>
                          <TableCell>{worker.jobsCompleted}</TableCell>
                          <TableCell>{worker.distance.toFixed(1)} km</TableCell>
                          <TableCell>
                            <Badge className={`${worker.availableNow === 1 ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"} border-0`}>
                              {worker.availableNow === 1 ? "Available" : "Offline"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="gap-1.5 whitespace-nowrap" onClick={() => toggleMutation.mutate(worker.id)} disabled={toggleMutation.isPending} data-testid={`button-toggle-${worker.id}`}>
                              {worker.availableNow === 1 ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                              Toggle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Requests ── */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" /> All Job Requests
                  {requests.length === 0 && <span className="text-xs font-normal text-muted-foreground ml-1">— None yet</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Photo</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Quote (KES)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No job requests yet</TableCell></TableRow>
                      ) : requests.map((req) => (
                        <TableRow key={req.id} data-testid={`row-request-${req.id}`}>
                          <TableCell>
                            {req.imageUrl ? (
                              <button type="button" onClick={() => setViewPhoto({ url: req.imageUrl, title: `${req.category} — Customer Photo` })} className="group relative w-14 h-12 rounded-md overflow-hidden border hover-elevate flex-shrink-0" data-testid={`photo-req-${req.id}`}>
                                <img src={req.imageUrl} alt="Customer upload" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-4 h-4 text-white" />
                                </div>
                              </button>
                            ) : (
                              <div className="w-14 h-12 rounded-md border-2 border-dashed flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell><Badge variant="secondary">{req.category}</Badge></TableCell>
                          <TableCell className="max-w-xs"><p className="text-sm line-clamp-2">{req.description}</p></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[120px]">{req.location}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {req.quotedMin && req.quotedMax
                              ? `${req.quotedMin.toLocaleString()}–${req.quotedMax.toLocaleString()}`
                              : req.quotedAmount ? req.quotedAmount.toLocaleString() : "—"}
                          </TableCell>
                          <TableCell><JobStatusBadge status={req.status as any} /></TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {req.status === "pending" && (
                                <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => updateRequestStatus.mutate({ id: req.id, status: "in-progress" })} data-testid={`button-start-${req.id}`}>
                                  Start
                                </Button>
                              )}
                              {req.status === "in-progress" && (
                                <Button size="sm" variant="ghost" className="text-xs gap-1 text-green-600" onClick={() => updateRequestStatus.mutate({ id: req.id, status: "completed" })} data-testid={`button-complete-${req.id}`}>
                                  Complete
                                </Button>
                              )}
                              {req.status !== "cancelled" && req.status !== "completed" && (
                                <Button size="sm" variant="ghost" className="text-xs gap-1 text-destructive" onClick={() => updateRequestStatus.mutate({ id: req.id, status: "cancelled" })} data-testid={`button-cancel-${req.id}`}>
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Transactions ── */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Transaction Monitoring
                  <Badge variant="secondary" className="ml-auto">{transactions.length} total</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Fundi</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount (KES)</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>M-Pesa Ref</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No transactions yet</TableCell></TableRow>
                      ) : transactions.map((tx) => (
                        <TableRow key={tx.id} data-testid={`row-tx-${tx.id}`}>
                          <TableCell className="font-medium text-sm whitespace-nowrap">{tx.customerName}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{tx.workerName}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{tx.category}</Badge></TableCell>
                          <TableCell className="font-bold text-sm">KES {tx.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className="border-0 text-xs capitalize bg-primary/10 text-primary">{tx.type}</Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{tx.mpesaRef}</TableCell>
                          <TableCell>
                            <Badge className={`border-0 text-xs ${STATUS_TX[tx.status] ?? ""}`}>
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleDateString("en-KE")}
                          </TableCell>
                          <TableCell>
                            {tx.status === "completed" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1.5 text-destructive text-xs whitespace-nowrap"
                                onClick={() => reverseMutation.mutate(tx.id)}
                                disabled={reverseMutation.isPending}
                                data-testid={`button-reverse-${tx.id}`}
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Reverse
                              </Button>
                            )}
                            {tx.status === "reversed" && (
                              <span className="text-xs text-muted-foreground">Reversed</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Support ── */}
          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HeadphonesIcon className="w-4 h-4" /> Customer Support Tickets
                  {openTickets > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground border-0 ml-auto no-default-active-elevate">
                      {openTickets} open
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No support tickets</TableCell></TableRow>
                      ) : tickets.map((ticket) => (
                        <TableRow key={ticket.id} data-testid={`row-ticket-${ticket.id}`}>
                          <TableCell className="font-medium text-sm whitespace-nowrap">{ticket.userName}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs capitalize">{ticket.userRole}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm font-medium truncate">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{ticket.message}</p>
                          </TableCell>
                          <TableCell>
                            <Badge className={`border-0 text-xs capitalize ${PRIORITY_BADGE[ticket.priority] ?? ""}`}>
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`border-0 text-xs capitalize ${
                              ticket.status === "resolved"
                                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                : ticket.status === "in-progress"
                                ? "bg-blue-500/10 text-blue-600"
                                : "bg-yellow-500/10 text-yellow-700"
                            }`}>
                              {ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(ticket.createdAt).toLocaleDateString("en-KE")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => { setReplyOpen(ticket); setReplyText(ticket.response ?? ""); }} data-testid={`button-reply-${ticket.id}`}>
                                <MessageSquare className="w-3.5 h-3.5" /> Reply
                              </Button>
                              {ticket.status !== "resolved" && (
                                <Button size="sm" variant="ghost" className="gap-1 text-xs text-muted-foreground" onClick={() => updateTicket.mutate({ id: ticket.id, status: ticket.status === "open" ? "in-progress" : "resolved" })} data-testid={`button-status-${ticket.id}`}>
                                  {ticket.status === "open" ? "Start" : "Resolve"}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ID Verification Docs ── */}
          <TabsContent value="verifications">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Worker ID Document Review
                  {pendingVerifications > 0 && (
                    <Badge className="bg-yellow-500/10 text-yellow-700 border-0 ml-auto">{pendingVerifications} pending</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {verifications.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No document submissions yet</p>
                    <p className="text-xs mt-1">Workers who upload ID documents will appear here for review</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {verifications.map((v) => (
                      <div key={v.userId} className="p-5 space-y-4" data-testid={`verification-${v.userId}`}>
                        {/* Worker info row */}
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
                              {v.workerName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold">{v.workerName}</p>
                              <p className="text-xs text-muted-foreground">{v.workerEmail} · {v.workerPhone}</p>
                              <p className="text-xs text-muted-foreground">Submitted: {new Date(v.submittedAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`border-0 text-xs ${
                              v.status === "approved" ? "bg-green-500/10 text-green-700 dark:text-green-400"
                              : v.status === "rejected" ? "bg-destructive/10 text-destructive"
                              : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                            }`}>
                              {v.status === "approved" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
                              {v.status}
                            </Badge>
                            {v.status === "pending" && (
                              <>
                                <Button size="sm" className="gap-1.5 bg-green-600 text-xs" onClick={() => approveVerification.mutate({ userId: v.userId })} disabled={approveVerification.isPending} data-testid={`button-approve-${v.userId}`}>
                                  <ThumbsUp className="w-3.5 h-3.5" /> Approve
                                </Button>
                                <Button size="sm" variant="ghost" className="gap-1.5 text-destructive text-xs" onClick={() => rejectVerification.mutate({ userId: v.userId })} disabled={rejectVerification.isPending} data-testid={`button-reject-${v.userId}`}>
                                  <ThumbsDown className="w-3.5 h-3.5" /> Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* ID Documents */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ID Documents</p>
                          <div className="flex gap-3 flex-wrap">
                            {v.idFrontUrl ? (
                              <button
                                type="button"
                                onClick={() => setViewPhoto({ url: v.idFrontUrl, title: `${v.workerName} — ID Front` })}
                                className="group relative w-28 h-20 rounded-md overflow-hidden border hover-elevate flex-shrink-0"
                                data-testid={`photo-id-front-${v.userId}`}
                              >
                                <img src={v.idFrontUrl} alt="ID Front" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-5 h-5 text-white" />
                                </div>
                                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-0.5 text-center">Front</span>
                              </button>
                            ) : (
                              <div className="w-28 h-20 rounded-md border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                                No front ID
                              </div>
                            )}
                            {v.idBackUrl ? (
                              <button
                                type="button"
                                onClick={() => setViewPhoto({ url: v.idBackUrl, title: `${v.workerName} — ID Back` })}
                                className="group relative w-28 h-20 rounded-md overflow-hidden border hover-elevate flex-shrink-0"
                                data-testid={`photo-id-back-${v.userId}`}
                              >
                                <img src={v.idBackUrl} alt="ID Back" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-5 h-5 text-white" />
                                </div>
                                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-0.5 text-center">Back</span>
                              </button>
                            ) : (
                              <div className="w-28 h-20 rounded-md border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                                No back ID
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Work samples */}
                        {v.workSamples.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Work Samples</p>
                            <div className="flex gap-3 flex-wrap">
                              {v.workSamples.map((url, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setViewPhoto({ url, title: `${v.workerName} — Work Sample ${i + 1}` })}
                                  className="group relative w-24 h-20 rounded-md overflow-hidden border hover-elevate flex-shrink-0"
                                  data-testid={`photo-sample-${v.userId}-${i}`}
                                >
                                  <img src={url} alt={`Sample ${i + 1}`} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Eye className="w-5 h-5 text-white" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {v.adminNote && (
                          <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
                            Admin note: {v.adminNote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Pricing Config ── */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Pricing Configuration
                  <span className="text-xs font-normal text-muted-foreground ml-1">Edit base price ranges per category (KES)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Min Price (KES)</TableHead>
                        <TableHead>Max Price (KES)</TableHead>
                        <TableHead>Deposit %</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricing.map((p) => {
                        const edit = pricingEdits[p.category];
                        const minVal = edit?.baseMin ?? p.baseMin;
                        const maxVal = edit?.baseMax ?? p.baseMax;
                        return (
                          <TableRow key={p.category} data-testid={`row-pricing-${p.category}`}>
                            <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={minVal}
                                onChange={(e) => setPricingEdits((prev) => ({ ...prev, [p.category]: { baseMin: Number(e.target.value), baseMax: (prev[p.category]?.baseMax ?? p.baseMax) } }))}
                                className="w-28"
                                data-testid={`input-min-${p.category}`}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={maxVal}
                                onChange={(e) => setPricingEdits((prev) => ({ ...prev, [p.category]: { baseMin: (prev[p.category]?.baseMin ?? p.baseMin), baseMax: Number(e.target.value) } }))}
                                className="w-28"
                                data-testid={`input-max-${p.category}`}
                              />
                            </TableCell>
                            <TableCell className="text-sm font-medium">{Math.round(p.depositPercent * 100)}%</TableCell>
                            <TableCell>
                              {edit ? (
                                <Button size="sm" className="text-xs" onClick={() => savePricing(p.category)} data-testid={`button-save-${p.category}`}>
                                  Save
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">Saved</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <ImageIcon className="w-4 h-4 text-primary" />
              {viewPhoto?.title}
            </DialogTitle>
          </DialogHeader>
          {viewPhoto && (
            <div className="rounded-md overflow-hidden">
              <img src={viewPhoto.url} alt={viewPhoto.title} className="w-full object-contain max-h-[70vh]" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={!!replyOpen} onOpenChange={() => setReplyOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Reply to Ticket
            </DialogTitle>
          </DialogHeader>
          {replyOpen && (
            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-md text-sm">
                <p className="font-semibold">{replyOpen.subject}</p>
                <p className="text-muted-foreground mt-1">{replyOpen.message}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Your Response</Label>
                <Textarea
                  placeholder="Type your response to the customer or fundi…"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-28"
                  data-testid="textarea-reply"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setReplyOpen(null)}>Cancel</Button>
                <Button className="flex-1" disabled={!replyText} onClick={handleReply} data-testid="button-send-reply">
                  Send Reply & Resolve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
