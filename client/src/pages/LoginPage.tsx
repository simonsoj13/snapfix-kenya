import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Wrench, User, HardHat, Phone, Mail, Lock, Eye, EyeOff } from "lucide-react";

type Role = "customer" | "worker";

export default function LoginPage() {
  const { login } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login fields
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const handleLogin = async () => {
    if (!credential || !password) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data);
      navigate("/");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !phone || !regPassword) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (!phone.startsWith("+")) {
      toast({ title: "Include country code", description: "e.g. +254712345678", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password: regPassword, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data);
      navigate("/");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <Wrench className="w-8 h-8 text-primary" />
            <span className="text-3xl font-bold text-primary">FixIt</span>
          </div>
          <p className="text-muted-foreground text-sm">Connect with skilled repair professionals</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription>Sign in or create your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="w-full mb-6">
                <TabsTrigger value="login" className="flex-1" data-testid="tab-login">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="flex-1" data-testid="tab-register">Register</TabsTrigger>
              </TabsList>

              {/* ── Sign In ── */}
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="credential">Email or Phone Number</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="credential"
                      placeholder="email@example.com or +254712..."
                      className="pl-9"
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      data-testid="input-credential"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      className="pl-9 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      data-testid="input-password"
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
                  data-testid="button-login"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    className="text-primary underline"
                    onClick={() => setTab("register")}
                    data-testid="link-register"
                  >
                    Register
                  </button>
                </p>
              </TabsContent>

              {/* ── Register ── */}
              <TabsContent value="register" className="space-y-4">
                {/* Role picker */}
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("customer")}
                      data-testid="button-role-customer"
                      className={`flex flex-col items-center gap-2 p-4 rounded-md border-2 transition-colors ${
                        role === "customer"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                    >
                      <User className={`w-6 h-6 ${role === "customer" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium ${role === "customer" ? "text-primary" : ""}`}>
                        Customer
                      </span>
                      <span className="text-xs text-muted-foreground text-center">I need repairs done</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("worker")}
                      data-testid="button-role-worker"
                      className={`flex flex-col items-center gap-2 p-4 rounded-md border-2 transition-colors ${
                        role === "worker"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                    >
                      <HardHat className={`w-6 h-6 ${role === "worker" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium ${role === "worker" ? "text-primary" : ""}`}>
                        Worker
                      </span>
                      <span className="text-xs text-muted-foreground text-center">I offer services</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-name"
                      placeholder="John Doe"
                      className="pl-9"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      data-testid="input-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="email@example.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-phone"
                      placeholder="+254712345678"
                      className="pl-9"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Choose a strong password"
                      className="pl-9 pr-10"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                      data-testid="input-reg-password"
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
                  onClick={handleRegister}
                  disabled={loading}
                  data-testid="button-register"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    className="text-primary underline"
                    onClick={() => setTab("login")}
                    data-testid="link-login"
                  >
                    Sign in
                  </button>
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <span className="text-primary cursor-pointer">Terms of Service</span> &amp;{" "}
          <span className="text-primary cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
