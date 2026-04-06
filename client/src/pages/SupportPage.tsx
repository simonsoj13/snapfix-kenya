import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft, HeadphonesIcon, MessageSquare, Phone } from "lucide-react";

export default function SupportPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject || !message) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.name,
          userRole: user?.role ?? "customer",
          subject,
          message,
          status: "open",
          priority: subject.toLowerCase().includes("emergency") ? "high" : "medium",
        }),
      });
      toast({ title: "Ticket submitted!", description: "We'll get back to you within 24 hours." });
      setSubject("");
      setMessage("");
    } catch {
      toast({ title: "Failed to submit", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary px-4 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" className="text-white" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-white text-xl font-bold">Customer Support</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <HeadphonesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold">How can we help?</p>
            <p className="text-white/80 text-sm">We respond within 24 hours</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <Card>
          <CardContent className="py-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Submit a Ticket
            </h3>
            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Payment issue, Worker didn't arrive..." className="mt-1" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your issue in detail..." className="mt-1" rows={4} />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Ticket"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Contact Us Directly
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">Phone: <span className="font-medium text-foreground">+254 700 000 000</span></p>
              <p className="text-muted-foreground">Email: <span className="font-medium text-foreground">support@snapfix.ke</span></p>
              <p className="text-muted-foreground">Hours: <span className="font-medium text-foreground">Mon-Sat, 7AM - 9PM</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
