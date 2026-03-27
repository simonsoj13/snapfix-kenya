import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import JobStatusBadge from "@/components/JobStatusBadge";
import { useToast } from "@/hooks/use-toast";
import { getJobRequestsByUser, updateJobRequestStatus } from "@/lib/api";
import type { JobRequest } from "@shared/schema";
import { Calendar, MapPin, Wrench } from "lucide-react";

const DEMO_USER_ID = "demo-user-1";

type JobStatus = "pending" | "in-progress" | "completed" | "cancelled";

export default function RequestsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<JobRequest[]>({
    queryKey: ["/api/job-requests/user", DEMO_USER_ID],
    queryFn: () => getJobRequestsByUser(DEMO_USER_ID),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateJobRequestStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/job-requests/user", DEMO_USER_ID] });
      toast({ title: "Request updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update request.", variant: "destructive" });
    },
  });

  const handleCancel = (id: string) => {
    updateStatusMutation.mutate({ id, status: "cancelled" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl font-semibold mb-6">My Requests</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl font-semibold mb-6">My Requests</h1>
          <Card className="p-12 flex flex-col items-center justify-center text-center gap-4">
            <Wrench className="w-16 h-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No requests yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Upload a photo of your repair need on the Home page to get started.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-semibold mb-6">My Requests</h1>
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="p-6" data-testid={`card-request-${req.id}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold">{req.category}</h3>
                        <JobStatusBadge status={req.status as JobStatus} />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {req.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{req.location}</span>
                    </div>
                    {req.preferredDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{req.preferredDate}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {req.status === "pending" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancel(req.id)}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-cancel-${req.id}`}
                      >
                        Cancel Request
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
