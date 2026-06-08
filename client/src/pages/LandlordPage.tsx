import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, Check, Package, Building2, Landmark, GraduationCap,
  HospitalIcon, BriefcaseBusiness, Shield, Clock, TrendingUp,
  FileText, Headphones, Wrench, Star, ChevronRight,
} from "lucide-react";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    subtitle: "1–10 Units",
    price: "KES 4,999",
    period: "/month",
    highlight: false,
    accentClass: "border-blue-500/40",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    features: [
      "Up to 10 repair jobs per month",
      "Priority Fundi matching",
      "Monthly repairs report (PDF)",
      "WhatsApp priority support",
      "Per-unit job tracking",
      "Basic analytics overview",
    ],
    icon: Package,
  },
  {
    id: "professional",
    name: "Professional",
    subtitle: "11–50 Units",
    price: "KES 12,999",
    period: "/month",
    highlight: true,
    accentClass: "border-primary/60",
    badgeClass: "bg-primary/10 text-primary",
    features: [
      "Up to 40 repair jobs per month",
      "Dedicated account manager",
      "Preventive maintenance scheduler",
      "Real-time multi-job dashboard",
      "4-hour SLA response guarantee",
      "Bulk M-Pesa invoicing",
      "Priority emergency response 24/7",
      "Detailed analytics & trends",
    ],
    icon: Building2,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    subtitle: "50+ Units / Institutions",
    price: "Custom",
    period: "pricing",
    highlight: false,
    accentClass: "border-orange-500/40",
    badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    features: [
      "Unlimited repair jobs",
      "Multi-property / campus management",
      "On-site Fundi team deployment",
      "API integration (CMMS / ERP)",
      "Custom SLA agreements",
      "Branded reports & invoices",
      "Quarterly maintenance audits",
      "Dedicated 24/7 support line",
      "Staff access & admin sub-accounts",
    ],
    icon: Landmark,
  },
];

const TRUST_ITEMS = [
  { icon: Shield, title: "Verified Fundis Only", desc: "Every technician is ID-verified and background-checked before they can accept jobs." },
  { icon: Clock, title: "SLA Guaranteed", desc: "Response time guarantees backed by admin oversight and real-time job monitoring." },
  { icon: TrendingUp, title: "Detailed Reporting", desc: "Monthly spend breakdowns, job summaries, and property-level analytics." },
  { icon: FileText, title: "M-Pesa Invoicing", desc: "One consolidated M-Pesa payment per billing cycle — no petty cash needed." },
  { icon: Headphones, title: "Dedicated Support", desc: "A named account manager familiar with your properties and requirements." },
  { icon: Wrench, title: "All Trades Covered", desc: "Plumbing, electrical, carpentry, HVAC, painting, appliances, and emergency repairs." },
];

const ORG_TYPES = [
  { value: "landlord", label: "Landlord / Property Owner", icon: Building2 },
  { value: "agency", label: "Real Estate Agency", icon: BriefcaseBusiness },
  { value: "school", label: "School / University", icon: GraduationCap },
  { value: "hospital", label: "Hospital / Clinic", icon: HospitalIcon },
  { value: "corporate", label: "Corporate Office", icon: BriefcaseBusiness },
  { value: "government", label: "Government / County", icon: Landmark },
  { value: "other", label: "Other Organisation", icon: Package },
];

export default function LandlordPage() {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [units, setUnits] = useState("");
  const [contactName, setContactName] = useState(user?.name ?? "");
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");
  const [contactEmail, setContactEmail] = useState(user?.email ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!orgName || !orgType || !units || !contactName || !contactPhone || !contactEmail) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/landlord-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id ?? null,
          orgName,
          orgType,
          units,
          preferredPlan: selectedPlan || "undecided",
          contactName,
          contactPhone,
          contactEmail,
          notes,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      toast({ title: "Enquiry submitted!", description: "Our team will call you within 2 business hours." });
    } catch {
      toast({ title: "Failed to submit. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back-landlord">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <span className="font-semibold text-base">Landlord &amp; Organisation Bundles</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-14">

        {/* ── Hero ── */}
        <div className="text-center space-y-4">
          <Badge className="text-xs px-3 py-1 gap-1.5">
            <Building2 className="w-3 h-3" /> Bulk Repair Packages
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            One Plan. All Your Properties.<br />
            <span className="text-primary">Zero Hassle.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
            Built for landlords, real estate agencies, schools, hospitals, and institutions that need fast, verified repairs — managed and billed centrally via M-Pesa.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <Badge variant="outline" className="gap-1.5 text-xs py-1 px-3"><Check className="w-3 h-3 text-green-500" /> Verified Fundis</Badge>
            <Badge variant="outline" className="gap-1.5 text-xs py-1 px-3"><Check className="w-3 h-3 text-green-500" /> Central M-Pesa Billing</Badge>
            <Badge variant="outline" className="gap-1.5 text-xs py-1 px-3"><Check className="w-3 h-3 text-green-500" /> Dedicated Account Manager</Badge>
            <Badge variant="outline" className="gap-1.5 text-xs py-1 px-3"><Check className="w-3 h-3 text-green-500" /> Real-Time Job Tracking</Badge>
          </div>
        </div>

        {/* ── Pricing Plans ── */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center">Choose Your Bundle</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  data-testid={`card-plan-${plan.id}`}
                  className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all hover-elevate space-y-4 ${
                    plan.highlight ? "bg-primary/5" : "bg-card"
                  } ${isSelected ? "border-primary ring-2 ring-primary/20" : plan.accentClass}`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="text-xs px-3 py-0.5 gap-1">
                        <Star className="w-3 h-3 fill-current" /> Most Popular
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${plan.badgeClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-base">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
                    </div>
                    {isSelected && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            All plans include onboarding support. Prices are ex-VAT. Minimum 3-month commitment.
          </p>
        </div>

        {/* ── Trust Features ── */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center">Why Organisations Choose Snap-Fix</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title}>
                  <CardContent className="p-5 flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ── Enquiry Form ── */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold">Get a Custom Quote</h2>
            <p className="text-sm text-muted-foreground">Fill in your details and our team will call you within 2 business hours.</p>
          </div>

          {submitted ? (
            <Card className="max-w-lg mx-auto">
              <CardContent className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Enquiry Received!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Our enterprise team will contact <strong>{contactName}</strong> at <strong>{contactPhone}</strong> within 2 business hours.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => navigate("/")} data-testid="button-back-home-after-enquiry">
                    Back to Home
                  </Button>
                  <Button variant="outline" onClick={() => { setSubmitted(false); setOrgName(""); setNotes(""); }} data-testid="button-new-enquiry">
                    Submit Another Enquiry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Organisation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Organisation / Property Name <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="e.g. Parklands Apartments"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      data-testid="input-org-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Organisation Type <span className="text-destructive">*</span></Label>
                    <Select value={orgType} onValueChange={setOrgType}>
                      <SelectTrigger data-testid="select-org-type">
                        <SelectValue placeholder="Select type…" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORG_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Number of Units / Properties <span className="text-destructive">*</span></Label>
                    <Select value={units} onValueChange={setUnits}>
                      <SelectTrigger data-testid="select-units">
                        <SelectValue placeholder="Select range…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1 – 10 units</SelectItem>
                        <SelectItem value="11-50">11 – 50 units</SelectItem>
                        <SelectItem value="51-100">51 – 100 units</SelectItem>
                        <SelectItem value="100+">100+ units</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preferred Plan</Label>
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger data-testid="select-preferred-plan">
                        <SelectValue placeholder="Select plan…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter — KES 4,999/mo</SelectItem>
                        <SelectItem value="professional">Professional — KES 12,999/mo</SelectItem>
                        <SelectItem value="enterprise">Enterprise — Custom Pricing</SelectItem>
                        <SelectItem value="undecided">Not sure yet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-1 mb-1">
                  <p className="text-sm font-semibold">Contact Person</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Full Name <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Contact person name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      data-testid="input-contact-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone Number <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="+254 7XX XXX XXX"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      data-testid="input-contact-phone"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Email Address <span className="text-destructive">*</span></Label>
                  <Input
                    type="email"
                    placeholder="admin@yourproperty.co.ke"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    data-testid="input-contact-email"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Additional Notes</Label>
                  <Textarea
                    placeholder="Any specific requirements, types of repairs needed, locations, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    data-testid="textarea-enquiry-notes"
                  />
                </div>

                <Button
                  className="w-full gap-2 mt-2"
                  onClick={handleSubmit}
                  disabled={submitting}
                  data-testid="button-submit-enquiry"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Submitting…</>
                  ) : (
                    <>Submit Enquiry <ChevronRight className="w-4 h-4" /></>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By submitting you agree to be contacted by Snap-Fix Kenya. We never share your details.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Org type showcase ── */}
        <div className="space-y-4 pb-4">
          <h2 className="text-xl font-semibold text-center">Who Uses Our Bundles?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {ORG_TYPES.slice(0, 6).map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.value} className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card text-center hover-elevate cursor-default">
                  <Icon className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium leading-tight">{type.label}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
