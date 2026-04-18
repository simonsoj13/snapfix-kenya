import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import RequestsPage from "@/pages/RequestsPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminLoginPage from "@/pages/AdminLoginPage";
import LoginPage from "@/pages/LoginPage";
import BookingFlow from "@/pages/BookingFlow";
import WorkerDashboard from "@/pages/WorkerDashboard";
import SupportPage from "@/pages/SupportPage";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import ErrorBoundary from "@/components/ErrorBoundary";

const TAB_ROUTES = {
  home: "/",
  search: "/search",
  requests: "/requests",
  profile: "/profile",
} as const;
type Tab = keyof typeof TAB_ROUTES;

function getActiveTab(pathname: string): Tab {
  if (pathname === "/search") return "search";
  if (pathname === "/requests") return "requests";
  if (pathname === "/profile") return "profile";
  return "home";
}

function Router() {
  const [location, navigate] = useLocation();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  // ── Admin login — always public ──
  if (location === "/admin-login") {
    if (user?.role === "admin") return <Redirect to="/admin" />;
    return <AdminLoginPage />;
  }

  // ── Main login — always public ──
  if (location === "/login") {
    if (user && user.role !== "admin") return <Redirect to="/" />;
    if (user?.role === "admin") return <Redirect to="/admin" />;
    return <LoginPage />;
  }

  // ── Unauthenticated → send to login ──
  if (location === "/") return <LandingPage />;
  if (!user) return <Redirect to="/login" />;

  // ── Admin user ──
  if (user.role === "admin") {
    if (location === "/admin") return <AdminDashboard />;
    return <Redirect to="/admin" />;
  }

  // ── Worker user ──
  if (user.role === "worker") {
    if (location === "/worker") return <WorkerDashboard />;
    if (location === "/book") return <BookingFlow />;
    return <Redirect to="/worker" />;
  }

  // ── Booking ──
  if (location === "/book") {
    return (
      <Switch>
        <Route path="/book" component={BookingFlow} />
      </Switch>
    );
  }

  // ── Customer app ──
  const activeTab = getActiveTab(location);
  const handleTabChange = (tab: Tab) => navigate(TAB_ROUTES[tab]);

  return (
    <>
      <TopNav
        onSearchClick={() => navigate("/search")}
        onProfileClick={() => navigate("/profile")}
        notificationCount={0}
      />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/requests" component={RequestsPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/support" component={SupportPage} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ErrorBoundary>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
