import BottomNav from "../BottomNav";
import { useState } from "react";

export default function BottomNavExample() {
  const [activeTab, setActiveTab] = useState<"home" | "search" | "requests" | "profile">("home");

  return (
    <div className="relative h-20 border">
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
