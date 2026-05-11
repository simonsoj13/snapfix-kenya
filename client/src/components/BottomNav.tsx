import { Home, Search, FileText, User } from "lucide-react";

interface BottomNavProps {
  activeTab?: "home" | "search" | "requests" | "profile";
  onTabChange?: (tab: "home" | "search" | "requests" | "profile") => void;
}

export default function BottomNav({ activeTab = "home", onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "home" as const, icon: Home, label: "Home" },
    { id: "search" as const, icon: Search, label: "Search" },
    { id: "requests" as const, icon: FileText, label: "Requests" },
    { id: "profile" as const, icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="flex h-16 items-center justify-around">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange?.(id)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              activeTab === id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`button-tab-${id}`}
          >
            <Icon className={`w-5 h-5 ${activeTab === id ? "fill-current" : ""}`} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
