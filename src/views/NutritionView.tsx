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
    <div className="w-full max-w-full min-w-0 px-3 sm:px-6 py-4 flex flex-col gap-4 bg-slate-50 text-slate-900">
      <SyncBanner />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full min-w-0 flex-1">
        <div className="lg:col-span-3 flex flex-col min-w-0">
          <ChronoTimeline />
        </div>
        <div className="lg:col-span-5 flex flex-col min-w-0">
          <FoodSelectorGrid selected={selectedFoods} onToggle={toggleFood} />
        </div>
        <div className="lg:col-span-4 flex flex-col min-w-0">
          <PortionsEngine selected={selectedFoods} />
        </div>
      </div>

      <AdvisorBanner />
    </div>
  );
}

export default NutritionView;
