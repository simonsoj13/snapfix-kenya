import { useState } from "react";
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
import { Star, CheckCircle2, MapPin, Clock, Briefcase, Calendar } from "lucide-react";
import type { Worker } from "@shared/schema";
import { getWorkerImage } from "@/lib/workerImages";

interface WorkerProfileModalProps {
  worker: Worker | null;
  open: boolean;
  onClose: () => void;
  onRequestSubmit?: (workerId: string, description: string, location: string, date: string) => void;
  prefillDescription?: string;
}

//todo: remove mock functionality
const mockReviews = [
  {
    id: "1",
    reviewerName: "Sarah M.",
    rating: 5,
    date: "2 weeks ago",
    comment: "Excellent work! Fixed everything quickly and professionally. Very clean and tidy.",
    verified: true,
  },
  {
    id: "2",
    reviewerName: "James K.",
    rating: 5,
    date: "1 month ago",
    comment: "Very responsive and arrived on time. Highly recommend!",
    verified: true,
  },
  {
    id: "3",
    reviewerName: "Linda P.",
    rating: 4,
    date: "2 months ago",
    comment: "Great service, fair pricing. Will definitely call again.",
    verified: false,
  },
];

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
            <AvatarImage src={getWorkerImage(worker.specialty)} alt={worker.name} />
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
          <div className="space-y-3">
            {mockReviews.map((review) => (
              <ReviewCard key={review.id} {...review} />
            ))}
          </div>
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
