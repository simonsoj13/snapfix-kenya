import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import WorkerMapView from "@/components/WorkerMapView";
import JobStatusBadge from "@/components/JobStatusBadge";
import { getWorkerImage } from "@/lib/workerImages";
import type { Worker, JobRequest } from "@shared/schema";
import {
  Users, Briefcase, Star, DollarSign, TrendingUp, MapPin,
  CheckCircle2, Clock, XCircle, Activity, ArrowLeft,
  ToggleLeft, ToggleRight,
} from "lucide-react";
import { useLocation } from "wouter";

// ── Types ────────────────────────────────────────────────────────────────────
interface AdminStats {
  totalWorkers: number;
  activeWorkers: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  inProgressRequests: number;
  cancelledRequests: number;
  avgRating: number;
  totalRevenue: number;
  totalUsers: number;
}

interface TrendPoint {
  day: string;
  requests: number;
  completed: number;
  revenue: number;
}

interface CategoryPoint {
  name: string;
  value: number;
}

// ── Palette for pie chart ────────────────────────────────────────────────────
const PIE_COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4"];

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  title, value, subtitle, icon: Icon, trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
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
          <p className={`text-xs mt-1 font-medium ${trend.positive ? "text-green-600" : "text-red-500"}`}>
            {trend.positive ? "▲" : "▼"} {Math.abs(trend.value)}% vs last week
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
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

  const toggleMutation = useMutation({
    mutationFn: (workerId: string) =>
      fetch(`/api/admin/workers/${workerId}/toggle-availability`, { method: "PATCH" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/workers"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Worker availability updated" });
    },
  });

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
      toast({ title: "Request status updated" });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 md:px-8 gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back-home">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">FixIt Admin</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Platform Operations Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground hidden sm:inline">Live</span>
            </div>
            <Badge variant="secondary">Admin</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers ?? "—"}
            subtitle="Registered on platform"
            icon={Users}
            trend={{ value: 12, positive: true }}
          />
          <StatCard
            title="Active Workers"
            value={`${stats?.activeWorkers ?? "—"} / ${stats?.totalWorkers ?? "—"}`}
            subtitle="Currently available"
            icon={Briefcase}
            trend={{ value: 5, positive: true }}
          />
          <StatCard
            title="Total Revenue"
            value={stats ? `$${stats.totalRevenue.toLocaleString()}` : "—"}
            subtitle="Platform earnings"
            icon={DollarSign}
            trend={{ value: 18, positive: true }}
          />
          <StatCard
            title="Avg. Rating"
            value={stats?.avgRating ?? "—"}
            subtitle="Across all workers"
            icon={Star}
            trend={{ value: 2, positive: true }}
          />
        </div>

        {/* Request status row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats?.pendingRequests ?? 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats?.inProgressRequests ?? 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats?.completedRequests ?? 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold">{stats?.cancelledRequests ?? 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="map" data-testid="tab-map">Live Map</TabsTrigger>
            <TabsTrigger value="workers" data-testid="tab-workers">Workers</TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests">Requests</TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Request volume chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="w-4 h-4" />
                    Request Volume – Last 7 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={trend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                      <Area type="monotone" dataKey="requests" name="Total Requests" stroke="#3b82f6" fill="url(#gReq)" strokeWidth={2} />
                      <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" fill="url(#gComp)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Service Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Revenue bar chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="w-4 h-4" />
                  Daily Revenue – Last 7 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: number) => [`$${v}`, "Revenue"]} />
                    <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Live Map Tab ── */}
          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="w-4 h-4" />
                  Live Worker Locations
                  <Badge variant="secondary" className="ml-auto">
                    {workers.filter((w) => w.availableNow === 1).length} available
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden rounded-b-lg">
                <div className="h-[520px]">
                  <WorkerMapView workers={workers} />
                </div>
              </CardContent>
            </Card>

            {/* Quick worker status strip */}
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

          {/* ── Workers Tab ── */}
          <TabsContent value="workers">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Worker Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Worker</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Rate</TableHead>
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
                          <TableCell>
                            <Badge variant="secondary" className="whitespace-nowrap">{worker.specialty}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                              <span className="text-sm font-medium">{worker.rating.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">({worker.reviewCount})</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">${worker.hourlyRate}/hr</TableCell>
                          <TableCell>{worker.jobsCompleted}</TableCell>
                          <TableCell>{worker.distance.toFixed(1)} mi</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={worker.availableNow === 1
                                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                : "bg-muted text-muted-foreground"}
                            >
                              {worker.availableNow === 1 ? "Available" : "Offline"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 whitespace-nowrap"
                              onClick={() => toggleMutation.mutate(worker.id)}
                              disabled={toggleMutation.isPending}
                              data-testid={`button-toggle-${worker.id}`}
                            >
                              {worker.availableNow === 1
                                ? <ToggleRight className="w-4 h-4 text-green-600" />
                                : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
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

          {/* ── Requests Tab ── */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  All Job Requests
                  {requests.length === 0 && (
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      — No requests yet. Submit one from the home page.
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                            No job requests yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        requests.map((req) => (
                          <TableRow key={req.id} data-testid={`row-request-${req.id}`}>
                            <TableCell>
                              <Badge variant="secondary">{req.category}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <p className="text-sm line-clamp-2">{req.description}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate max-w-[120px]">{req.location}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <JobStatusBadge status={req.status as any} />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {req.status === "pending" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                    onClick={() => updateRequestStatus.mutate({ id: req.id, status: "in-progress" })}
                                    data-testid={`button-start-${req.id}`}
                                  >
                                    Start
                                  </Button>
                                )}
                                {req.status === "in-progress" && (
                                  <Button
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => updateRequestStatus.mutate({ id: req.id, status: "completed" })}
                                    data-testid={`button-complete-${req.id}`}
                                  >
                                    Complete
                                  </Button>
                                )}
                                {(req.status === "pending" || req.status === "in-progress") && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="text-xs"
                                    onClick={() => updateRequestStatus.mutate({ id: req.id, status: "cancelled" })}
                                    data-testid={`button-cancel-admin-${req.id}`}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
