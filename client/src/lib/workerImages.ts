import plumberImage from "@assets/generated_images/Plumber_profile_photo_d5e1cff1.png";
import electricianImage from "@assets/generated_images/Electrician_profile_photo_51938b86.png";
import welderImage from "@assets/generated_images/Welder_profile_photo_d7ee56b2.png";
import carpenterImage from "@assets/generated_images/Carpenter_profile_photo_6c8a5025.png";

const specialtyImages: Record<string, string> = {
  Plumbing: plumberImage,
  Electrical: electricianImage,
  Welding: welderImage,
  Carpentry: carpenterImage,
  HVAC: electricianImage,
  Appliance: welderImage,
};

export function getWorkerImage(specialty: string): string {
  return specialtyImages[specialty] ?? plumberImage;
}
