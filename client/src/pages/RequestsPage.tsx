import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import JobStatusBadge from "@/components/JobStatusBadge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { getJobRequestsByUser, updateJobRequestStatus } from "@/lib/api";
import type { JobRequest } from "@shared/schema";
import { Calendar, MapPin, Wrench, Zap, Navigation, Eye, Image } from "lucide-react";
import { useLocation } from "wouter";

type JobStatus = "pending" | "in-progress" | "completed" | "cancelled" | "deposit-paid" | "assigned" | "quoted";

function WorkSamplesSection({ workerId }: { workerId: string }) {
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const { data } = useQuery<{ workSamples: string[]; workerName: string }>({
    queryKey: ["/api/workers/work-samples", workerId],
    queryFn: () => fetch(`/api/workers/${workerId}/work-samples`).then((r) => r.json()),
    enabled: !!workerId,
  });

  if (!data || data.workSamples.length === 0) return null;

  return (
    <>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <Image className="w-3.5 h-3.5" /> {data.workerName}'s Previous Work
        </p>
        <div className="flex gap-2 flex-wrap">
          {data.workSamples.map((sample, i) => (
            <img
              key={i}
              src={sample}
              alt={`Work sample ${i + 1}`}
              className="w-16 h-16 rounded-md object-cover cursor-pointer border border-border hover:opacity-90 transition-opacity"
              onClick={() => setPreviewImg(sample)}
              data-testid={`img-work-sample-${workerId}-${i}`}
            />
          ))}
        </div>
      </div>
      <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Work Sample Preview
            </DialogTitle>
          </DialogHeader>
          {previewImg && <img src={previewImg} alt="Preview" className="w-full rounded-lg object-contain max-h-[60vh]" />}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function RequestsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [_, navigate] = useLocation();
  const userId = user?.id ?? "";

  const { data: requests = [], isLoading } = useQuery<JobRequest[]>({
    queryKey: ["/api/job-requests/user", userId],
    queryFn: () => getJobRequestsByUser(userId),
    enabled: !!userId,
    refetchInterval: 15000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateJobRequestStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/job-requests/user", userId] });
      toast({ title: "Request updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update request.", variant: "destructive" });
    },
  });

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
                Book your first repair — take a photo and get matched instantly.
              </p>
            </div>
            <Button onClick={() => navigate("/book")} data-testid="button-book-now">
              Book a Repair
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <h1 className="text-2xl font-semibold">My Requests</h1>
          <Button size="sm" onClick={() => navigate("/book")} data-testid="button-new-request">
            + New Request
          </Button>
        </div>
        <div className="space-y-4">
          {requests.map((req) => {
            const isOnTheWay = (req as any).workerOnWay === 1;
            const eta = (req as any).estimatedArrival as string | null;

            return (
              <Card key={req.id} className="p-6" data-testid={`card-request-${req.id}`}>
                {/* Worker on the way banner */}
                {isOnTheWay && (
                  <div className="mb-4 flex items-center gap-3 bg-primary/10 text-primary rounded-lg px-4 py-3">
                    <Navigation className="w-5 h-5 flex-shrink-0 animate-pulse" />
                    <div>
                      <p className="font-semibold text-sm">Your Fundi is on the way!</p>
                      {eta && (
                        <p className="text-xs mt-0.5">Estimated arrival: <strong>{eta}</strong></p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {req.imageUrl && (
                    <img
                      src={req.imageUrl}
                      alt="Your photo"
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-border"
                      data-testid={`img-request-photo-${req.id}`}
                    />
                  )}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold">{req.category}</h3>
                          <JobStatusBadge status={req.status as JobStatus} />
                          {req.isNow === 1 && (
                            <Badge variant="secondary" className="gap-1">
                              <Zap className="w-3 h-3" />Immediate
                            </Badge>
                          )}
                        </div>
                        {req.area && (
                          <p className="text-xs text-muted-foreground capitalize mb-0.5">
                            Area: {req.area.replace("-", " ")}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {req.description}
                        </p>
                      </div>
                    </div>

                    {/* Quote info */}
                    {req.quotedAmount && (
                      <div className="flex gap-4 text-sm flex-wrap">
                        <span className="text-muted-foreground">
                          Quote: <strong>KES {req.quotedAmount.toLocaleString()}</strong>
                        </span>
                        {req.depositAmount && (
                          <span className="text-muted-foreground">
                            Deposit paid: <strong className="text-green-600">KES {req.depositAmount.toLocaleString()}</strong>
                          </span>
                        )}
                      </div>
                    )}

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

                    {/* Fundi's work samples (visible to customer) */}
                    {req.workerId && (
                      <WorkSamplesSection workerId={req.workerId} />
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {/* Cancel Worker — after deposit paid but before completion */}
                      {(req.status === "deposit-paid" || req.status === "in-progress") && req.workerId && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: req.id, status: "cancelled" })}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-cancel-worker-${req.id}`}
                        >
                          Cancel Worker
                        </Button>
                      )}
                      {/* Cancel Request — before deposit or no worker */}
                      {req.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: req.id, status: "cancelled" })}
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
