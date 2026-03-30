import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import {
  User, HardHat, Phone, Mail, Lock, Eye, EyeOff, Camera, Upload, ShieldCheck,
} from "lucide-react";
import snapfixLogo from "/snapfix-logo.jpg";

type Role = "customer" | "worker";
type RegStep = "details" | "worker-docs";

export default function LoginPage() {
  const { login } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regStep, setRegStep] = useState<RegStep>("details");

  // Login fields
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [idUploaded, setIdUploaded] = useState(false);
  const [sampleUploaded, setSampleUploaded] = useState(false);

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
      navigate(data.role === "worker" ? "/worker" : "/");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDetails = () => {
    if (!name || !email || !phone || !regPassword) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (!phone.startsWith("+")) {
      toast({ title: "Include country code", description: "e.g. +254712345678", variant: "destructive" });
      return;
    }
    if (role === "worker") {
      setRegStep("worker-docs");
    } else {
      handleRegisterSubmit();
    }
  };

  const handleRegisterSubmit = async () => {
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
      navigate(data.role === "worker" ? "/worker" : "/");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-5">
        {/* Brand */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <img src={snapfixLogo} alt="Snap-Fix Kenya" className="w-20 h-20 rounded-2xl object-cover shadow-md" />
          </div>
          <h1 className="text-2xl font-bold">Snap-Fix Kenya</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect with skilled repair professionals</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setRegStep("details"); }}>
              <TabsList className="w-full mb-5">
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
                      placeholder="email@example.com or +254712…"
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
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button className="w-full" onClick={handleLogin} disabled={loading} data-testid="button-login">
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Admin?{" "}
                  <button className="text-primary underline" onClick={() => navigate("/admin-login")} data-testid="link-admin-login">
                    Use Admin Portal
                  </button>
                </p>
              </TabsContent>

              {/* ── Register ── */}
              <TabsContent value="register" className="space-y-4">
                {regStep === "details" ? (
                  <>
                    {/* Role picker */}
                    <div className="space-y-2">
                      <Label>I am a</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { id: "customer" as Role, icon: User,    label: "Customer", sub: "I need repairs done" },
                          { id: "worker"   as Role, icon: HardHat, label: "Fundi",    sub: "I offer services" },
                        ] as const).map(({ id, icon: Icon, label, sub }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setRole(id)}
                            data-testid={`button-role-${id}`}
                            className={`flex flex-col items-center gap-2 p-4 rounded-md border-2 transition-colors ${
                              role === id ? "border-primary bg-primary/5" : "border-border hover-elevate"
                            }`}
                          >
                            <Icon className={`w-6 h-6 ${role === id ? "text-primary" : "text-muted-foreground"}`} />
                            <span className={`text-sm font-medium ${role === id ? "text-primary" : ""}`}>{label}</span>
                            <span className="text-xs text-muted-foreground text-center">{sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="reg-name" placeholder="John Doe" className="pl-9" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-name" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="reg-email" type="email" placeholder="email@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-email" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="reg-phone" placeholder="+254712345678" className="pl-9" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-phone" />
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
                          data-testid="input-reg-password"
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleRegisterDetails}
                      disabled={loading}
                      data-testid="button-next-register"
                    >
                      {role === "worker" ? "Next: Upload Documents" : loading ? "Creating account…" : "Create Account"}
                    </Button>
                  </>
                ) : (
                  /* ── Worker docs step ── */
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
                      <h3 className="font-semibold">Verify Your Identity</h3>
                      <p className="text-xs text-muted-foreground">Upload your ID and work samples to get started as a Fundi</p>
                    </div>

                    {/* ID Upload */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" /> National ID / Passport
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Front Side", "Back Side"].map((side) => (
                          <label
                            key={side}
                            className="flex flex-col items-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer hover-elevate"
                            data-testid={`upload-id-${side.replace(" ", "-").toLowerCase()}`}
                          >
                            <input type="file" accept="image/*" className="hidden" onChange={() => setIdUploaded(true)} />
                            <Camera className={`w-6 h-6 ${idUploaded ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="text-xs text-center text-muted-foreground">{side}</span>
                          </label>
                        ))}
                      </div>
                      {idUploaded && <p className="text-xs text-primary">ID uploaded</p>}
                    </div>

                    {/* Work samples */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-primary" /> Work Samples (up to 3)
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((i) => (
                          <label
                            key={i}
                            className="aspect-square flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-xl cursor-pointer hover-elevate"
                            data-testid={`upload-sample-${i}`}
                          >
                            <input type="file" accept="image/*" className="hidden" onChange={() => setSampleUploaded(true)} />
                            <Upload className={`w-5 h-5 ${sampleUploaded ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="text-xs text-muted-foreground">Photo {i}</span>
                          </label>
                        ))}
                      </div>
                      {sampleUploaded && <p className="text-xs text-primary">Sample photos uploaded</p>}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setRegStep("details")} data-testid="button-back-details">
                        Back
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleRegisterSubmit}
                        disabled={loading}
                        data-testid="button-register"
                      >
                        {loading ? "Creating…" : "Create Account"}
                      </Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Documents will be reviewed by admin within 24 hours.
                    </p>
                  </div>
                )}

                {regStep === "details" && (
                  <p className="text-center text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <button className="text-primary underline" onClick={() => setTab("login")} data-testid="link-login">
                      Sign in
                    </button>
                  </p>
                )}
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
