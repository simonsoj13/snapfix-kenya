import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/context/AuthContext";
import SnapfixLogo from "@/components/SnapfixLogo";

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
          <SnapfixLogo size={34} showBackground />
          <span className="text-base font-bold tracking-tight leading-tight">
            Snap-Fix <span className="text-primary">Kenya</span>
          </span>
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
