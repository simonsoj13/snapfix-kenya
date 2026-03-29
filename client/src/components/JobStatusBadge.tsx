import { Badge } from "@/components/ui/badge";
import { Clock, Activity, CheckCircle2, XCircle } from "lucide-react";

type Status = "pending" | "in-progress" | "completed" | "cancelled";

const CONFIG: Record<Status, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
  "in-progress": { label: "In Progress", icon: Activity, className: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  completed: { label: "Completed", icon: CheckCircle2, className: "bg-green-500/10 text-green-700 dark:text-green-400" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "bg-red-500/10 text-red-500" },
};

export default function JobStatusBadge({ status }: { status: Status }) {
  const cfg = CONFIG[status] ?? CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <Badge variant="secondary" className={`gap-1 whitespace-nowrap ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
}
