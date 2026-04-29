import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ReviewCard from "@/components/ReviewCard";
import { Star, CheckCircle2, MapPin, Clock, Briefcase, Calendar, MessageSquare } from "lucide-react";
import type { Worker, Review } from "@shared/schema";
import { getWorkerImage } from "@/lib/workerImages";

interface WorkerProfileModalProps {
  worker: Worker | null;
  open: boolean;
  onClose: () => void;
  onRequestSubmit?: (workerId: string, description: string, location: string, date: string) => void;
  prefillDescription?: string;
}

function timeAgo(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  if (d < 30) return `${Math.floor(d / 7)} week${Math.floor(d / 7) === 1 ? "" : "s"} ago`;
  if (d < 365) return `${Math.floor(d / 30)} month${Math.floor(d / 30) === 1 ? "" : "s"} ago`;
  return `${Math.floor(d / 365)} yr ago`;
}

export default function WorkerProfileModal({
  worker,
  open,
  onClose,
  onRequestSubmit,
  prefillDescription = "",
}: WorkerProfileModalProps) {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [jobDescription, setJobDescription] = useState(prefillDescription);
  const [location, setLocation] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: allReviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
    enabled: open && !!worker,
  });
  const workerReviews = worker
    ? allReviews
        .filter((r) => r.workerId === worker.id)
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    : [];

  if (!worker) return null;

  const handleSubmitRequest = async () => {
    if (!jobDescription || !location) return;
    setIsSubmitting(true);
    try {
      onRequestSubmit?.(worker.id, jobDescription, location, preferredDate);
      setShowRequestForm(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{worker.name} Profile</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar className="w-20 h-20 flex-shrink-0">
            <AvatarImage src={worker.profileImage || getWorkerImage(worker.specialty)} alt={worker.name} />
            <AvatarFallback className="text-2xl">{worker.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold">{worker.name}</h2>
              {worker.verified === 1 && (
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-muted-foreground">{worker.specialty}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span className="font-semibold">{worker.rating.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">
                ({worker.reviewCount} reviews)
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{worker.location} · {worker.distance.toFixed(1)} mi away</span>
            </div>
            {worker.availableNow === 1 && (
              <Badge variant="secondary" className="mt-2">Available Now</Badge>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold">${worker.hourlyRate}</p>
            <p className="text-sm text-muted-foreground">per hour</p>
          </div>
        </div>

        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{worker.jobsCompleted}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Briefcase className="w-3 h-3" />Jobs Done
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold">{worker.yearsExperience}</p>
            <p className="text-xs text-muted-foreground">Years Exp.</p>
          </div>
          <div>
            <p className="text-base font-bold">{worker.responseTime}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />Response
            </p>
          </div>
        </div>

        <Separator />

        {/* Bio */}
        <div>
          <h3 className="font-semibold mb-2">About</h3>
          <p className="text-sm text-muted-foreground">{worker.bio}</p>
        </div>

        <Separator />

        {/* Reviews */}
        <div>
          <h3 className="font-semibold mb-3">Recent Reviews</h3>
          {workerReviews.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground" data-testid="empty-reviews">
              <MessageSquare className="w-6 h-6" />
              <p className="text-sm">No reviews yet — be the first to hire this fundi!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workerReviews.slice(0, 5).map((review) => (
                <ReviewCard
                  key={review.id}
                  reviewerName={review.customerName}
                  rating={review.rating}
                  date={timeAgo(review.createdAt)}
                  comment={review.comment}
                  verified={true}
                />
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Request Form or CTA */}
        {showRequestForm ? (
          <div className="space-y-4">
            <h3 className="font-semibold">Request Service</h3>
            <div className="space-y-2">
              <Label htmlFor="job-desc">Job Description</Label>
              <Textarea
                id="job-desc"
                placeholder="Describe what needs to be done..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-24"
                data-testid="textarea-job-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Your Location</Label>
              <Input
                id="location"
                placeholder="Enter your address..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                data-testid="input-location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Preferred Date</Label>
              <Input
                id="date"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                data-testid="input-preferred-date"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRequestForm(false)}
                data-testid="button-cancel-request"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitRequest}
                disabled={!jobDescription || !location || isSubmitting}
                data-testid="button-submit-request"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              data-testid="button-close-profile"
            >
              Close
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setJobDescription(prefillDescription);
                setShowRequestForm(true);
              }}
              data-testid="button-request-service"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Request Service
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
