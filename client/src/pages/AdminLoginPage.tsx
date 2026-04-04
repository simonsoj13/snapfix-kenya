import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, KeyRound, CheckCircle2 } from "lucide-react";
import snapfixLogo from "/snapfix-logo.jpg";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotCred, setForgotCred] = useState("");
  const [forgotStep, setForgotStep] = useState<"enter" | "code" | "done">("enter");
  const [forgotCode, setForgotCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data);
      navigate("/admin");
    } catch (err: any) {
      toast({ title: "Access denied", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async () => {
    if (!forgotCred) return;
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: forgotCred }),
    });
    const data = await res.json();
    setDevCode(data.devCode);
    setForgotStep("code");
    toast({
      title: "Reset code ready!",
      description: data.devCode
        ? "Your code is shown below. Copy it before closing."
        : data.message ?? "Check your email.",
    });
  };

  const handleForgotReset = async () => {
    if (!forgotCred || !forgotCode || !newPassword) return;
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: forgotCred, code: forgotCode, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) { toast({ title: "Reset failed", description: data.error, variant: "destructive" }); return; }
    setForgotStep("done");
    toast({ title: "Password reset!", description: "You can now sign in with your new password." });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src={snapfixLogo} alt="Snap-Fix Kenya" className="w-20 h-20 rounded-2xl object-cover" />
          </div>
          <h1 className="text-2xl font-bold">Snap-Fix Kenya</h1>
          <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            ADMIN PORTAL
          </div>
          <p className="text-muted-foreground text-sm mt-2">Restricted access — authorised personnel only</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Admin Sign In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@snapfix.ke"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  data-testid="input-admin-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Admin password"
                  className="pl-9 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  data-testid="input-admin-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={loading}
              data-testid="button-admin-login"
            >
              {loading ? "Authenticating…" : "Sign In to Admin"}
            </Button>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button
                className="text-primary underline"
                onClick={() => { setForgotCred(""); setForgotStep("enter"); setForgotOpen(true); }}
                data-testid="button-admin-forgot"
              >
                Forgot password?
              </button>
              <button
                className="text-primary underline"
                onClick={() => navigate("/login")}
                data-testid="link-customer-login"
              >
                Customer / Worker login
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          All admin actions are logged and monitored.
        </p>
      </div>

      {/* ── Forgot Password Dialog ── */}
      <Dialog open={forgotOpen} onOpenChange={(o) => { setForgotOpen(o); if (!o) { setForgotStep("enter"); setForgotCode(""); setNewPassword(""); setDevCode(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" /> Reset Admin Password
            </DialogTitle>
          </DialogHeader>

          {forgotStep === "enter" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter your admin email address to receive a reset code.</p>
              <div className="space-y-2">
                <Label htmlFor="forgot-admin-email">Admin Email</Label>
                <Input
                  id="forgot-admin-email"
                  type="email"
                  placeholder="admin@snapfix.ke"
                  value={forgotCred}
                  onChange={(e) => setForgotCred(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleForgotRequest()}
                  data-testid="input-forgot-admin-email"
                />
              </div>
              <Button className="w-full" onClick={handleForgotRequest} disabled={!forgotCred} data-testid="button-send-admin-reset">
                Send Reset Code
              </Button>
            </div>
          )}

          {forgotStep === "code" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {devCode
                  ? "Copy the code below and enter it to reset your password."
                  : <>A reset code was sent to <strong>{forgotCred}</strong>. Check your inbox.</>}
              </p>
              {devCode && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Your Reset Code</p>
                  <p className="text-3xl font-bold tracking-widest text-primary font-mono">{devCode}</p>
                  <p className="text-xs text-muted-foreground">Copy this code — it expires in 10 minutes</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="admin-reset-code">Reset Code</Label>
                <Input
                  id="admin-reset-code"
                  placeholder="6-digit code"
                  maxLength={6}
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center tracking-widest text-lg"
                  data-testid="input-admin-reset-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-new-password">New Password</Label>
                <Input
                  id="admin-new-password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleForgotReset()}
                  data-testid="input-admin-new-password"
                />
              </div>
              <Button className="w-full" onClick={handleForgotReset} disabled={forgotCode.length < 6 || newPassword.length < 6} data-testid="button-confirm-admin-reset">
                Reset Password
              </Button>
            </div>
          )}

          {forgotStep === "done" && (
            <div className="space-y-4 text-center py-2">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
              <p className="font-semibold">Password Reset Successful!</p>
              <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
              <Button className="w-full" onClick={() => { setForgotOpen(false); setForgotStep("enter"); }} data-testid="button-close-admin-reset">
                Sign In Now
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
