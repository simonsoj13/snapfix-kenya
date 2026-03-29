import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import {
  User, Phone, Mail, Bell, Shield, CreditCard, LogOut, HardHat,
} from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [_, navigate] = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <h1 className="text-2xl font-semibold">Profile</h1>

        {/* Profile Header */}
        <Card className="p-6">
          <div className="flex items-center gap-5">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-xl font-bold truncate">{user.name}</h2>
                <Badge variant="secondary" className="flex-shrink-0">
                  {user.role === "worker" ? (
                    <><HardHat className="w-3 h-3 mr-1" />Worker</>
                  ) : (
                    <><User className="w-3 h-3 mr-1" />Customer</>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">{user.phone}</p>
            </div>
          </div>
        </Card>

        {/* Account info */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="w-4 h-4" />
            Account Information
          </h3>
          <Separator />
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground w-20">Name</span>
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground w-20">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground w-20">Phone</span>
              <span className="font-medium">{user.phone}</span>
            </div>
          </div>
        </Card>

        {/* Settings */}
        <Card className="p-6 space-y-1">
          <h3 className="font-semibold mb-3">Settings</h3>
          <Button variant="ghost" className="w-full justify-start gap-3" data-testid="button-notifications">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3" data-testid="button-payment">
            <CreditCard className="w-5 h-5" />
            Payment Methods
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3" data-testid="button-privacy">
            <Shield className="w-5 h-5" />
            Privacy &amp; Security
          </Button>
        </Card>

        <Button
          variant="destructive"
          className="w-full gap-2"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
