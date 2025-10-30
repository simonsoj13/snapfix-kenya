import PhotoUploadCard from "../PhotoUploadCard";

export default function PhotoUploadCardExample() {
  return (
    <PhotoUploadCard
      onFileSelect={(file) => console.log("File selected:", file.name)}
    />
  );
}
