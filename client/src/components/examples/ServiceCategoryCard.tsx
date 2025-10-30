import ServiceCategoryCard from "../ServiceCategoryCard";
import { Wrench } from "lucide-react";

export default function ServiceCategoryCardExample() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <ServiceCategoryCard
        icon={Wrench}
        name="Plumbing"
        onClick={() => console.log("Plumbing selected")}
      />
      <ServiceCategoryCard
        icon={Wrench}
        name="Electrical"
        onClick={() => console.log("Electrical selected")}
        isSelected={true}
      />
    </div>
  );
}
