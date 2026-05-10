import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/context/AuthContext";
import NotificationPanel from "@/components/NotificationPanel";
import snapfixLogo from "/snapfix-logo.jpg";

interface TopNavProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onProfileClick?: () => void;
  onAdminClick?: () => void;
}

export default function TopNav({
  onProfileClick,
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
          <img
            src={snapfixLogo}
            alt="Snap-Fix Kenya"
            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
          />
          <span className="text-base font-bold tracking-tight leading-tight">
            Snap-Fix <span className="text-primary">Kenya</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <NotificationPanel />
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
