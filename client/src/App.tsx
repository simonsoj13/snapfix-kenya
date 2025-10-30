import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import RequestsPage from "@/pages/RequestsPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/not-found";
import { useState } from "react";

function Router() {
  const [activeTab, setActiveTab] = useState<"home" | "search" | "requests" | "profile">("home");

  const handleTabChange = (tab: "home" | "search" | "requests" | "profile") => {
    setActiveTab(tab);
    const routes = {
      home: "/",
      search: "/search",
      requests: "/requests",
      profile: "/profile",
    };
    window.location.hash = routes[tab];
  };

  return (
    <>
      <TopNav
        onMenuClick={() => console.log("Menu clicked")}
        onSearchClick={() => window.location.hash = "/search"}
        onNotificationsClick={() => console.log("Notifications clicked")}
        onProfileClick={() => window.location.hash = "/profile"}
        notificationCount={2}
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
