import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";
import { useRef } from "react";

interface PhotoUploadCardProps {
  onFileSelect?: (file: File) => void;
}

export default function PhotoUploadCard({ onFileSelect }: PhotoUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment");
      fileInputRef.current.click();
    }
  };

  const handleUploadImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="p-8 flex flex-col items-center justify-center gap-6 border-2 border-dashed">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-testid="input-file-upload"
      />
      <Camera className="w-16 h-16 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">What needs fixing?</h2>
        <p className="text-muted-foreground">
          Take or upload a photo of the repair you need
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Button
          size="lg"
          variant="default"
          onClick={handleTakePhoto}
          className="gap-2"
          data-testid="button-take-photo"
        >
          <Camera className="w-5 h-5" />
          Take Photo
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleUploadImage}
          className="gap-2"
          data-testid="button-upload-image"
        >
          <Upload className="w-5 h-5" />
          Upload Image
        </Button>
      </div>
    </Card>
  );
}
