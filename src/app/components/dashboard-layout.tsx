import { useState } from "react";
import { SidebarNav } from "./sidebar-nav";

// Dashboard view
import { DashboardView } from "../../views/DashboardView";

// Nutrition view
import { NutritionView } from "../../views/NutritionView";

// Training view components
import { TrainingView } from "./training/TrainingView";

// Hormonal view components
import { HormonalView } from "../../views/HormonalView";

// Supplements view components
import { SupplementsView } from "../../views/SupplementsView";

// Profile view components
import { ProfileView } from "../../views/ProfileView";

interface DashboardLayoutProps {
  onOpenSettings: () => void;
}

export function DashboardLayout({ onOpenSettings }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView onOpenSettings={onOpenSettings} />;

      case "nutrition":
        return <NutritionView />;

      case "training":
        return <TrainingView />;

      case "hormonal":
        return <HormonalView />;

      case "supplements":
        return <SupplementsView />;

      case "profile":
        return <ProfileView />;

      default:
        return (
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full rounded-2xl border border-[#1E293B] bg-white/[0.02] p-8 text-center backdrop-blur-xl">
              <h2 className="text-lg font-bold text-white mb-2">Módulo No Encontrado</h2>
              <p className="text-slate-400 text-sm mb-6">El bloque de telemetría solicitado no está disponible.</p>
            </div>
          </main>
        );
    }
  };

  return (
    <div className="flex min-h-screen h-auto w-full max-w-full overflow-y-auto overflow-x-hidden flex-col md:flex-row">
      <SidebarNav active={activeTab} setActive={setActiveTab} />
      <main className="w-full max-w-full min-w-0 min-h-screen h-auto overflow-y-auto overflow-x-hidden pt-safe pb-safe px-2 sm:px-6 py-3 ml-0 md:ml-64 flex-1 flex flex-col">
        {renderContent()}
      </main>
    </div>
  );
}
