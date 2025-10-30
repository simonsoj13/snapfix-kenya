import ReviewCard from "../ReviewCard";

export default function ReviewCardExample() {
  return (
    <div className="space-y-4 max-w-2xl">
      <ReviewCard
        reviewerName="Sarah Johnson"
        rating={5}
        date="2 days ago"
        comment="Excellent work! Fixed my leaking pipe quickly and professionally. Highly recommend!"
        verified={true}
      />
      <ReviewCard
        reviewerName="Mike Davis"
        rating={4}
        date="1 week ago"
        comment="Good service, arrived on time and completed the job efficiently."
      />
    </div>
  );
}
