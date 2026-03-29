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
import LoginPage from "@/pages/LoginPage";
import BookingFlow from "@/pages/BookingFlow";
import NotFound from "@/pages/not-found";
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Public routes
  if (location === "/login") {
    if (user) return <Redirect to="/" />;
    return <LoginPage />;
  }

  // Auth guard
  if (!user) return <Redirect to="/login" />;

  // Admin — full screen, no chrome
  if (location === "/admin") {
    return (
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
      </Switch>
    );
  }

  // Book — full screen, no bottom nav
  if (location === "/book") {
    return (
      <Switch>
        <Route path="/book" component={BookingFlow} />
      </Switch>
    );
  }

  const activeTab = getActiveTab(location);
  const handleTabChange = (tab: Tab) => navigate(TAB_ROUTES[tab]);

  return (
    <>
      <TopNav
        onSearchClick={() => navigate("/search")}
        onProfileClick={() => navigate("/profile")}
        onAdminClick={() => navigate("/admin")}
        notificationCount={0}
      />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/requests" component={RequestsPage} />
        <Route path="/profile" component={ProfilePage} />
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
