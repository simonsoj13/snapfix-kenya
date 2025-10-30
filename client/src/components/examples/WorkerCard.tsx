import WorkerCard from "../WorkerCard";
import plumberImage from "@assets/generated_images/Plumber_profile_photo_d5e1cff1.png";

export default function WorkerCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <WorkerCard
        id="1"
        name="John Smith"
        specialty="Master Plumber"
        hourlyRate={85}
        rating={4.9}
        reviewCount={127}
        distance={2.3}
        profileImage={plumberImage}
        verified={true}
        availableNow={true}
        onViewProfile={() => console.log("View profile clicked")}
        onRequest={() => console.log("Request clicked")}
      />
    </div>
  );
}
