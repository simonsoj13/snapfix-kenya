import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
}

export default function SearchBar({
  placeholder = "Search by service or location",
  onSearch,
  onFilterClick,
}: SearchBarProps) {
  return (
    <div className="flex gap-2 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          className="pl-10 h-12 rounded-full"
          onChange={(e) => onSearch?.(e.target.value)}
          data-testid="input-search"
        />
      </div>
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-full flex-shrink-0"
        onClick={onFilterClick}
        data-testid="button-filter"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </Button>
    </div>
  );
}
