import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, LayoutDashboard, Wrench } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/context/AuthContext";

interface TopNavProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  onAdminClick?: () => void;
  notificationCount?: number;
}

export default function TopNav({
  onNotificationsClick,
  onProfileClick,
  onAdminClick,
  notificationCount = 0,
}: TopNavProps) {
  const { user } = useAuth();
  const initials = user?.name
    ? user.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Wrench className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">FixIt</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={onNotificationsClick}
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
            </Button>
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onAdminClick}
            data-testid="button-admin"
            title="Admin Dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
          </Button>
          <ThemeToggle />
          <Avatar
            className="w-8 h-8 cursor-pointer ml-1"
            onClick={onProfileClick}
            data-testid="button-profile-avatar"
          >
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );
}
