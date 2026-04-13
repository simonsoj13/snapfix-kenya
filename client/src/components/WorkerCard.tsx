import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star, MapPin, CheckCircle2 } from "lucide-react";
import { getWorkerImage } from "@/lib/workerImages";

interface WorkerCardProps {
  id: string;
  name: string;
  specialty: string;
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  distance: number;
  profileImage: string;
  verified?: boolean;
  availableNow?: boolean;
  bio?: string;
  yearsExperience?: number;
  onViewProfile?: () => void;
  onRequest?: () => void;
}

export default function WorkerCard({
  id,
  name,
  specialty,
  hourlyRate,
  rating,
  reviewCount,
  distance,
  profileImage,
  verified = false,
  availableNow = false,
  bio,
  yearsExperience,
  onViewProfile,
  onRequest,
}: WorkerCardProps) {
  return (
    <Card className="p-6 flex flex-col gap-4" data-testid={`card-worker-${id}`}>
      <div className="flex items-start gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={profileImage || getWorkerImage(specialty)} alt={name} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold truncate" data-testid={`text-worker-name-${id}`}>
              {name}
            </h3>
            {verified && (
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" data-testid={`icon-verified-${id}`} />
            )}
          </div>
          <p className="text-sm text-muted-foreground" data-testid={`text-specialty-${id}`}>
            {specialty} {yearsExperience ? `· ${yearsExperience} yrs exp` : ""}
          </p>
          {bio && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{bio}</p>}
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span className="text-sm font-semibold" data-testid={`text-rating-${id}`}>
              {rating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">({reviewCount})</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xl font-bold" data-testid={`text-rate-${id}`}>
            KES {hourlyRate.toLocaleString()}/hr
          </span>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span data-testid={`text-distance-${id}`}>{distance.toFixed(1)} km away</span>
          </div>
        </div>
        {availableNow && (
          <Badge className="bg-primary/10 text-primary border-0" data-testid={`badge-available-${id}`}>
            Available Now
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onViewProfile}
          data-testid={`button-view-profile-${id}`}
        >
          View Profile
        </Button>
        <Button
          className="flex-1"
          onClick={onRequest}
          data-testid={`button-request-${id}`}
        >
          Request
        </Button>
      </div>
    </Card>
  );
}
