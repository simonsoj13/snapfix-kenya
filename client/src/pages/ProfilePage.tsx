import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Bell,
  Shield,
  CreditCard,
  LogOut,
} from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-semibold mb-6">Profile</h1>

        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="text-2xl">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-semibold mb-1">John Doe</h2>
              <p className="text-muted-foreground mb-4">john.doe@example.com</p>
              <Button variant="outline" size="sm" data-testid="button-edit-profile">
                Edit Profile
              </Button>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="John Doe" data-testid="input-name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue="john.doe@example.com"
                data-testid="input-email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                defaultValue="+1 (555) 123-4567"
                data-testid="input-phone"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                defaultValue="123 Main St, New York, NY 10001"
                data-testid="input-address"
              />
            </div>
          </div>
        </Card>

        {/* Settings */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          <div className="space-y-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
              Notification Preferences
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              data-testid="button-payment"
            >
              <CreditCard className="w-5 h-5" />
              Payment Methods
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              data-testid="button-privacy"
            >
              <Shield className="w-5 h-5" />
              Privacy & Security
            </Button>
          </div>
        </Card>

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full gap-2"
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
