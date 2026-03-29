import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Menu, Bell, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface TopNavProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  onAdminClick?: () => void;
  notificationCount?: number;
}

export default function TopNav({
  onMenuClick,
  onSearchClick,
  onNotificationsClick,
  onProfileClick,
  onAdminClick,
  notificationCount = 0,
}: TopNavProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
            data-testid="button-menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">FixIt</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSearchClick}
            data-testid="button-search"
          >
            <Search className="w-5 h-5" />
          </Button>
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
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
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
            className="w-9 h-9 cursor-pointer"
            onClick={onProfileClick}
            data-testid="button-profile-avatar"
          >
            <AvatarImage src="" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );
}
