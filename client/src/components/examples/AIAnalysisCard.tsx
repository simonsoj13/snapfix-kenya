import AIAnalysisCard from "../AIAnalysisCard";
import { useState } from "react";

export default function AIAnalysisCardExample() {
  const [description, setDescription] = useState(
    "Kitchen sink has a leak under the basin. Water is dripping from the pipe connection. Needs immediate attention to prevent water damage."
  );

  return (
    <div className="max-w-2xl">
      <AIAnalysisCard
        imageUrl="https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400"
        description={description}
        category="Plumbing"
        confidence={95}
        onDescriptionChange={setDescription}
        onFindWorkers={() => console.log("Find workers clicked")}
      />
    </div>
  );
}
