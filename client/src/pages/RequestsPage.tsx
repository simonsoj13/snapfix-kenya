import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import JobStatusBadge from "@/components/JobStatusBadge";
import { Calendar, MapPin } from "lucide-react";
import plumberImage from "@assets/generated_images/Plumber_profile_photo_d5e1cff1.png";
import electricianImage from "@assets/generated_images/Electrician_profile_photo_51938b86.png";

//todo: remove mock functionality
const mockRequests = [
  {
    id: "1",
    service: "Plumbing",
    description: "Kitchen sink leak repair",
    worker: {
      name: "John Smith",
      image: plumberImage,
    },
    status: "in-progress" as const,
    date: "Today, 2:00 PM",
    location: "123 Main St, Brooklyn, NY",
  },
  {
    id: "2",
    service: "Electrical",
    description: "Outlet installation in living room",
    worker: {
      name: "Sarah Johnson",
      image: electricianImage,
    },
    status: "completed" as const,
    date: "Dec 15, 2024",
    location: "456 Oak Ave, Queens, NY",
  },
  {
    id: "3",
    service: "Plumbing",
    description: "Bathroom faucet replacement",
    status: "pending" as const,
    date: "Pending",
    location: "789 Elm St, Manhattan, NY",
  },
];

export default function RequestsPage() {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-semibold mb-6">My Requests</h1>

        <div className="space-y-4">
          {mockRequests.map((request) => (
            <Card key={request.id} className="p-6" data-testid={`card-request-${request.id}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{request.service}</h3>
                        <JobStatusBadge status={request.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.description}
                      </p>
                    </div>
                  </div>

                  {request.worker && (
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={request.worker.image} alt={request.worker.name} />
                        <AvatarFallback>{request.worker.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{request.worker.name}</p>
                        <p className="text-xs text-muted-foreground">Assigned Worker</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{request.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{request.location}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`button-view-details-${request.id}`}
                    >
                      View Details
                    </Button>
                    {request.status === "pending" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        data-testid={`button-cancel-${request.id}`}
                      >
                        Cancel Request
                      </Button>
                    )}
                    {request.status === "completed" && (
                      <Button
                        size="sm"
                        data-testid={`button-review-${request.id}`}
                      >
                        Leave Review
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
