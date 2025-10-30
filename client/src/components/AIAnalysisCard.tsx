import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface AIAnalysisCardProps {
  imageUrl: string;
  description: string;
  category: string;
  confidence?: number;
  isLoading?: boolean;
  onDescriptionChange?: (description: string) => void;
  onFindWorkers?: () => void;
}

export default function AIAnalysisCard({
  imageUrl,
  description,
  category,
  confidence = 95,
  isLoading = false,
  onDescriptionChange,
  onFindWorkers,
}: AIAnalysisCardProps) {
  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">AI Analysis Results</h3>
        <img
          src={imageUrl}
          alt="Uploaded repair"
          className="w-full h-48 object-cover rounded-md"
          data-testid="img-uploaded-repair"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Analyzing image...</span>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Detected Category:</span>
              <Badge data-testid="badge-category">{category}</Badge>
              <span className="text-xs text-muted-foreground">
                {confidence}% confidence
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Job Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange?.(e.target.value)}
              placeholder="Edit the AI-generated description..."
              className="min-h-32"
              data-testid="textarea-description"
            />
            <p className="text-xs text-muted-foreground">
              AI has generated this description. You can edit it if needed.
            </p>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={onFindWorkers}
            data-testid="button-find-workers"
          >
            Find Workers
          </Button>
        </>
      )}
    </Card>
  );
}
