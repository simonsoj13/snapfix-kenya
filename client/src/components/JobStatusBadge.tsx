import { Badge } from "@/components/ui/badge";

interface JobStatusBadgeProps {
  status: "pending" | "in-progress" | "completed" | "cancelled";
}

export default function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const variants = {
    pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
    "in-progress": { label: "In Progress", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
    completed: { label: "Completed", className: "bg-green-500/10 text-green-700 dark:text-green-400" },
    cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
  };

  const variant = variants[status];

  return (
    <Badge className={`${variant.className} font-semibold text-xs uppercase`}>
      {variant.label}
    </Badge>
  );
}
