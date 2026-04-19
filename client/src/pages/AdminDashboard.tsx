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
import { Banknote } from "lucide-react";
import JobStatusBadge from "@/components/JobStatusBadge";
import { getWorkerImage } from "@/lib/workerImages";
import type { Worker, JobRequest } from "@shared/schema";
import {
  Users, Briefcase, Star, TrendingUp, MapPin, CheckCircle2, Clock, XCircle, Activity,
  ToggleLeft, ToggleRight, LogOut, CreditCard, RotateCcw, HeadphonesIcon,
  Settings, MessageSquare, FileCheck, ThumbsUp, ThumbsDown, Eye, ShieldCheck, Image, User,
} from "lucide-react";
import snapfixLogo from "/snapfix-logo.jpg";

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
interface WorkerVerification {
  userId: string; workerName: string; email: string; phone: string;
  specialty?: string; bio?: string; yearsExperience?: number;
  idFront: string | null; idBack: string | null; workSamples: string[];
  status: "pending" | "approved" | "rejected";
  submittedAt: string; reviewedAt?: string; reviewNote?: string;
}

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


function CustomerProfilesTable() {
  const [search, setSearch] = useState("");
  const { data: customers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetch("/api/admin/users").then(r => r.json()),
    refetchInterval: 30000,
  });

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name, email or phone..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading customers...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No customers found.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {c.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    {c.name ?? "—"}
                  </div>
                </TableCell>
                <TableCell>{c.email ?? "—"}</TableCell>
                <TableCell>{c.phone ?? "—"}</TableCell>
                <TableCell>{c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-KE") : "—"}</TableCell>
                <TableCell>
                  <Badge variant={c.isVerified ? "default" : "secondary"}>
                    {c.isVerified ? "Verified" : "Unverified"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [_, navigate] = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editOldPassword, setEditOldPassword] = useState("");
  const [editNewPassword, setEditNewPassword] = useState("");
  const { toast } = useToast();
  const { logout } = useAuth();
  const saveProfile = async () => {
    const body = editNewPassword 
      ? { oldPassword: editOldPassword, newPassword: editNewPassword }
      : { name: editName };
    const stored = localStorage.getItem("snapfix_user") || localStorage.getItem("fixit_user") || "{}"; const adminId = JSON.parse(stored)?.id ?? "";
    await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json", "x-user-id": adminId }, body: JSON.stringify(body) });
    toast({ title: "Profile updated!" });
    setShowProfile(false);
    setEditOldPassword(""); setEditNewPassword("");
  };
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
  const { data: companyBalance = { balance: 0 }, refetch: refetchBalance } = useQuery<{ balance: number }>({
    queryKey: ["/api/admin/company-balance"],
    queryFn: () => fetch("/api/admin/company-balance").then((r) => r.json()),
    refetchInterval: 5000,
  });

  const { data: transactions = [], refetch: refetchTx } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    queryFn: () => fetch("/api/admin/transactions").then((r) => r.json()),
  });
  const { data: tickets = [], refetch: refetchTickets } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support"],
    queryFn: () => fetch("/api/support").then((r) => r.json()),
  });
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

  const approveMutation = useMutation({
    mutationFn: (txId: string) =>
      fetch(`/api/admin/transactions/${txId}/approve`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      toast({ title: "Payment approved!", description: "Customer can now proceed to next step." });
      refetchTx();
      refetchBalance();
    },
  });

  const reverseMutation = useMutation({
    mutationFn: (txId: string) =>
      fetch(`/api/admin/transactions/${txId}/reverse`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      refetchTx();
      toast({ title: "Transaction reversed", description: "Funds will be returned to customer." });
      refetchTx();
      refetchBalance();
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
  const [verifyPreview, setVerifyPreview] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  const { data: verifications = [], refetch: refetchVerifications } = useQuery<WorkerVerification[]>({
    queryKey: ["/api/admin/verifications"],
    queryFn: () => fetch("/api/admin/verifications").then((r) => r.json()),
    refetchInterval: 15000,
  });

  const reviewVerification = useMutation({
    mutationFn: ({ userId, status, reviewNote }: { userId: string; status: string; reviewNote?: string }) =>
      fetch(`/api/admin/verifications/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote }),
      }).then((r) => r.json()),
    onSuccess: () => {
      refetchVerifications();
      toast({ title: "Verification updated" });
    },
  });

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

  const openTickets = tickets.filter((t) => t.status !== "resolved").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 md:px-8 gap-4">
          <div className="flex items-center gap-3">
            <img src={snapfixLogo} alt="Snap-Fix Kenya" className="w-9 h-9 rounded-lg object-cover" />
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
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setShowProfile(true)} data-testid="button-admin-profile">
              <User className="w-4 h-4" /> Profile
            </Button>
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
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />Verifications
              {verifications.filter((v) => v.status === "pending").length > 0 && (
                <Badge className="ml-1 bg-destructive text-destructive-foreground text-xs border-0 no-default-active-elevate">
                  {verifications.filter((v) => v.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="customers" data-testid="tab-customers">
              <Users className="w-4 h-4 mr-1" /> Customers
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
                              <img
                                src={req.imageUrl}
                                alt="Customer photo"
                                className="w-12 h-12 rounded-md object-cover cursor-pointer border border-border"
                                onClick={() => setVerifyPreview(req.imageUrl)}
                                data-testid={`img-request-photo-${req.id}`}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                                <Image className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell><Badge variant="secondary">{req.category === "Emergency" ? "🚨 " : ""}{req.category}</Badge></TableCell>
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

            {/* Company Balance Card */}
            <Card className="mb-4 border-green-500/30 bg-green-500/5">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Company Balance</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      KES {companyBalance.balance.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">From approved transactions</p>
                  <p className="text-xs text-muted-foreground">{transactions.filter(t => t.status === "completed").length} completed</p>
                </div>
              </CardContent>
            </Card>

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
                            <div className="flex flex-col gap-1">
                              {tx.status === "pending" && (
                                <Button
                                  size="sm"
                                  className="gap-1.5 text-xs whitespace-nowrap bg-green-600 hover:bg-green-700"
                                  onClick={() => approveMutation.mutate(tx.id)}
                                  disabled={approveMutation.isPending}
                                  data-testid={`button-approve-${tx.id}`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                </Button>
                              )}
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
                                <span className="text-xs text-muted-foreground italic">Reversed</span>
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

          {/* ── Verifications ── */}
          <TabsContent value="verifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Fundi Verification Submissions
                  <Badge variant="secondary" className="ml-auto">{verifications.length} total</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {verifications.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No verification submissions yet</p>
                ) : verifications.map((v) => (
                  <div key={v.userId} className="border rounded-lg p-4 space-y-4" data-testid={`card-verification-${v.userId}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold">{v.workerName}</p>
                        <p className="text-xs text-muted-foreground">{v.email} · {v.phone}</p>
                        {v.specialty && <p className="text-xs text-primary font-medium mt-0.5">🔧 {v.specialty} · {v.yearsExperience ?? 0} yrs experience</p>}
                        {v.bio && <p className="text-xs text-muted-foreground mt-0.5 italic">"{v.bio}"</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Submitted: {new Date(v.submittedAt).toLocaleString("en-KE")}
                        </p>
                      </div>
                      <Badge className={`border-0 text-xs ${
                        v.status === "approved" ? "bg-green-500/10 text-green-700 dark:text-green-400"
                        : v.status === "rejected" ? "bg-destructive/10 text-destructive"
                        : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                      }`}>
                        {v.status === "pending" ? "Under Review" : v.status}
                      </Badge>
                    </div>

                    {/* ID Photos — Admin only */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> NATIONAL ID / PASSPORT (Admin Only)
                      </p>
                      <div className="flex gap-3">
                        {v.idFront ? (
                          <div className="space-y-1">
                            <img
                              src={v.idFront}
                              alt="ID Front"
                              className="w-28 h-20 object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setVerifyPreview(v.idFront)}
                              data-testid={`img-id-front-${v.userId}`}
                            />
                            <p className="text-xs text-muted-foreground text-center">Front</p>
                          </div>
                        ) : <div className="w-28 h-20 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">No front</div>}
                        {v.idBack ? (
                          <div className="space-y-1">
                            <img
                              src={v.idBack}
                              alt="ID Back"
                              className="w-28 h-20 object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setVerifyPreview(v.idBack)}
                              data-testid={`img-id-back-${v.userId}`}
                            />
                            <p className="text-xs text-muted-foreground text-center">Back</p>
                          </div>
                        ) : <div className="w-28 h-20 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">No back</div>}
                      </div>
                    </div>

                    {/* Work Samples */}
                    {v.workSamples.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                          <Image className="w-3.5 h-3.5" /> WORK SAMPLES ({v.workSamples.length})
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {v.workSamples.map((sample, i) => (
                            <div key={i} className="space-y-1">
                              <img
                                src={sample}
                                alt={`Work sample ${i + 1}`}
                                className="w-20 h-20 object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setVerifyPreview(sample)}
                                data-testid={`img-sample-${v.userId}-${i}`}
                              />
                              <p className="text-xs text-muted-foreground text-center">Photo {i + 1}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review actions */}
                    {v.status === "pending" && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="space-y-1">
                          <Label className="text-xs">Rejection note (optional)</Label>
                          <Input
                            placeholder="Reason for rejection…"
                            value={rejectNote[v.userId] ?? ""}
                            onChange={(e) => setRejectNote((p) => ({ ...p, [v.userId]: e.target.value }))}
                            className="text-sm"
                            data-testid={`input-reject-note-${v.userId}`}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
                            onClick={() => reviewVerification.mutate({ userId: v.userId, status: "approved" })}
                            disabled={reviewVerification.isPending}
                            data-testid={`button-approve-${v.userId}`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 gap-1"
                            onClick={() => reviewVerification.mutate({ userId: v.userId, status: "rejected", reviewNote: rejectNote[v.userId] })}
                            disabled={reviewVerification.isPending}
                            data-testid={`button-reject-${v.userId}`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </div>
                      </div>
                    )}
                    {v.status !== "pending" && v.reviewedAt && (
                      <p className="text-xs text-muted-foreground border-t pt-2">
                        Reviewed: {new Date(v.reviewedAt).toLocaleString("en-KE")}
                        {v.reviewNote && ` — ${v.reviewNote}`}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Pricing Config ── */}
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Customer Profiles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerProfilesTable />
              </CardContent>
            </Card>
          </TabsContent>

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

      {/* Image Preview Dialog */}
      <Dialog open={!!verifyPreview} onOpenChange={() => setVerifyPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Image Preview
            </DialogTitle>
          </DialogHeader>
          {verifyPreview && (
            <img src={verifyPreview} alt="Preview" className="w-full rounded-lg object-contain max-h-[70vh]" />
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

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent>
          <DialogHeader><DialogTitle>Admin Profile</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Name</Label><Input value={editName} onChange={e => setEditName(e.target.value)} className="mt-1" /></div>
            
            <div><Label>Current Password</Label><Input type="password" value={editOldPassword} onChange={e => setEditOldPassword(e.target.value)} className="mt-1" /></div>
            <div><Label>New Password (leave blank to keep)</Label><Input type="password" value={editNewPassword} onChange={e => setEditNewPassword(e.target.value)} className="mt-1" /></div>
            <Button className="w-full" onClick={saveProfile}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
