import { useState } from "react";
import { SyncBanner } from "./components/SyncBanner";
import { ChronoTimeline } from "./components/ChronoTimeline";
import { FoodSelectorGrid } from "./components/FoodSelectorGrid";
import { PortionsEngine } from "./components/PortionsEngine";
import { AdvisorBanner } from "./components/AdvisorBanner";

export default function App() {
  const [selected, setSelected] = useState<string[]>(["pollo", "huevo"]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#070A13] text-slate-200">
      <SyncBanner />
      <div className="flex flex-1 overflow-hidden">
        <ChronoTimeline />
        <FoodSelectorGrid selected={selected} onToggle={toggle} />
        <PortionsEngine selected={selected} />
      </div>
      <AdvisorBanner />
    </div>
  );
}
