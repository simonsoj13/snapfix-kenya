import { type LucideIcon } from "lucide-react";

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
    <button
      type="button"
      onClick={onClick}
      data-testid={`card-category-${name.toLowerCase().replace(/\s+/g, "-")}`}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all hover-elevate active-elevate-2 cursor-pointer w-full aspect-square
        ${isSelected
          ? "bg-primary text-primary-foreground shadow-md"
          : "bg-white dark:bg-card border border-border text-foreground"
        }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-white/20" : "bg-primary/10"}`}>
        <Icon className={`w-5 h-5 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
      </div>
      <span className={`text-xs font-medium text-center leading-tight ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
        {name}
      </span>
    </button>
  );
}
