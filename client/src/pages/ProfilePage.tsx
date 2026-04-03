import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, Bell, Shield, CreditCard, LogOut, HardHat, Pencil, Check, X, KeyRound } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editEmail, setEditEmail] = useState(user?.email ?? "");
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");
  const [editOldPassword, setEditOldPassword] = useState("");
  const [editNewPassword, setEditNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  if (!user) return null;

  const saveField = async (field: string) => {
    setSaving(true);
    try {
      let body: any = {};
      if (field === "name") body = { name: editName };
      if (field === "email") body = { email: editEmail };
      if (field === "phone") body = { phone: editPhone };
      if (field === "password") body = { oldPassword: editOldPassword, newPassword: editNewPassword };

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      toast({ title: "Saved!", description: "Your profile has been updated." });
      setEditingField(null);
      setEditOldPassword("");
      setEditNewPassword("");
      // Update local user
      if (field === "name") user.name = editName;
      if (field === "email") user.email = editEmail;
      if (field === "phone") user.phone = editPhone;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const EditRow = ({ field, label, icon: Icon, value, editValue, setEditValue, type = "text" }: any) => (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="text-muted-foreground w-20 text-sm">{label}</span>
      {editingField === field ? (
        <div className="flex-1 flex gap-2">
          <Input type={type} value={editValue} onChange={(e: any) => setEditValue(e.target.value)} className="h-8 text-sm" autoFocus />
          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => saveField(field)} disabled={saving}><Check className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setEditingField(null)}><X className="w-4 h-4" /></Button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-between">
          <span className="font-medium text-sm">{value}</span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingField(field)}><Pencil className="w-3 h-3" /></Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <h1 className="text-2xl font-semibold">Profile</h1>

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
                  {user.role === "worker" ? <><HardHat className="w-3 h-3 mr-1" />Worker</> : <><User className="w-3 h-3 mr-1" />Customer</>}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">{user.phone}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4" />Account Information</h3>
          <Separator />
          <div className="space-y-4 text-sm">
            <EditRow field="name" label="Name" icon={User} value={user.name} editValue={editName} setEditValue={setEditName} />
            <EditRow field="email" label="Email" icon={Mail} value={user.email} editValue={editEmail} setEditValue={setEditEmail} type="email" />
            <EditRow field="phone" label="Phone" icon={Phone} value={user.phone} editValue={editPhone} setEditValue={setEditPhone} type="tel" />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4" />Change Password</h3>
          <Separator />
          {editingField === "password" ? (
            <div className="space-y-3">
              <div><Label className="text-xs">Current Password</Label><Input type="password" value={editOldPassword} onChange={(e) => setEditOldPassword(e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">New Password</Label><Input type="password" value={editNewPassword} onChange={(e) => setEditNewPassword(e.target.value)} className="mt-1" /></div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => saveField("password")} disabled={saving}>Save Password</Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditingField(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setEditingField("password")}>Change Password</Button>
          )}
        </Card>

        <Card className="p-6 space-y-1">
          <h3 className="font-semibold mb-3">Settings</h3>
          <Button variant="ghost" className="w-full justify-start gap-3"><Bell className="w-5 h-5" />Notification Preferences</Button>
          <Button variant="ghost" className="w-full justify-start gap-3"><CreditCard className="w-5 h-5" />Payment Methods</Button>
          <Button variant="ghost" className="w-full justify-start gap-3"><Shield className="w-5 h-5" />Privacy & Security</Button>
        </Card>

        <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}><LogOut className="w-5 h-5" />Log Out</Button>
      </div>
    </div>
  );
}
