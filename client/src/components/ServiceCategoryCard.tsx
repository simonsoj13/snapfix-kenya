import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ServiceCategoryCardProps {
  icon: LucideIcon;
  name: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function ServiceCategoryCard({
  icon: Icon,
  name,
  onClick,
  isSelected = false,
}: ServiceCategoryCardProps) {
  return (
    <Card
      className={`p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover-elevate active-elevate-2 ${
        isSelected ? "border-primary" : ""
      }`}
      onClick={onClick}
      data-testid={`card-category-${name.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <Icon className="w-12 h-12 text-primary" />
      <span className="text-sm font-medium text-center">{name}</span>
    </Card>
  );
}
