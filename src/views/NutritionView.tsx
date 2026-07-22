import { useState } from "react";
import { SyncBanner } from "../app/components/nutrition/SyncBanner";
import { ChronoTimeline } from "../app/components/nutrition/ChronoTimeline";
import { FoodSelectorGrid } from "../app/components/nutrition/FoodSelectorGrid";
import { PortionsEngine } from "../app/components/nutrition/PortionsEngine";
import { AdvisorBanner } from "../app/components/nutrition/AdvisorBanner";

export function NutritionView() {
  const [selectedFoods, setSelectedFoods] = useState<string[]>(["pollo", "huevo"]);

  const toggleFood = (id: string) => {
    setSelectedFoods((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full max-w-full min-w-0 min-h-screen h-auto px-3 sm:px-6 py-4 flex flex-col gap-4 overflow-y-auto overflow-x-hidden bg-slate-50 text-slate-900">
      <SyncBanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full min-w-0 flex-1">
        <ChronoTimeline />
        <FoodSelectorGrid selected={selectedFoods} onToggle={toggleFood} />
        <PortionsEngine selected={selectedFoods} />
      </div>

      <AdvisorBanner />
    </div>
  );
}

export default NutritionView;
