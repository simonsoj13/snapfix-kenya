import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface ReviewCardProps {
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  date: string;
  comment: string;
  verified?: boolean;
}

export default function ReviewCard({
  reviewerName,
  reviewerAvatar,
  rating,
  date,
  comment,
  verified = false,
}: ReviewCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <Avatar className="w-10 h-10">
          <AvatarImage src={reviewerAvatar} alt={reviewerName} />
          <AvatarFallback>{reviewerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{reviewerName}</span>
                {verified && (
                  <span className="text-xs text-muted-foreground">
                    Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < rating
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
          <p className="text-sm text-foreground">{comment}</p>
        </div>
      </div>
    </Card>
  );
}
