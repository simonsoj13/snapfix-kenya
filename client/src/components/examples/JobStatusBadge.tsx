import JobStatusBadge from "../JobStatusBadge";

export default function JobStatusBadgeExample() {
  return (
    <div className="flex gap-2 flex-wrap">
      <JobStatusBadge status="pending" />
      <JobStatusBadge status="in-progress" />
      <JobStatusBadge status="completed" />
      <JobStatusBadge status="cancelled" />
    </div>
  );
}
