import { useState, lazy, Suspense } from "react";
import { SidebarNav } from "./sidebar-nav";
import { ViewSkeletonLoader } from "./ui/ViewSkeletonLoader";

// Dashboard view (kept eager for instantaneous first paint)
import { DashboardView } from "../../views/DashboardView";

// Lazy-loaded secondary views (code splitting)
const NutritionView = lazy(() => import("../../views/NutritionView"));
const TrainingView = lazy(() => import("./training/TrainingView"));
const HormonalView = lazy(() => import("../../views/HormonalView"));
const SupplementsView = lazy(() => import("../../views/SupplementsView"));
const ProfileView = lazy(() => import("../../views/ProfileView"));
const QuickActionBottomSheet = lazy(() => import("../../components/quick-log/QuickActionBottomSheet"));

interface DashboardLayoutProps {
  onOpenSettings: () => void;
}

export function DashboardLayout({ onOpenSettings }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView onOpenSettings={onOpenSettings} onNavigateTab={setActiveTab} />;

      case "nutrition":
        return (
          <Suspense fallback={<ViewSkeletonLoader title="Cargando Módulo de Nutrición..." />}>
            <NutritionView />
          </Suspense>
        );

      case "training":
        return (
          <Suspense fallback={<ViewSkeletonLoader title="Cargando Módulo de Entrenamiento..." />}>
            <TrainingView />
          </Suspense>
        );

      case "hormonal":
        return (
          <Suspense fallback={<ViewSkeletonLoader title="Cargando Módulo Hormonal & Ejes..." />}>
            <HormonalView />
          </Suspense>
        );

      case "supplements":
        return (
          <Suspense fallback={<ViewSkeletonLoader title="Cargando Dispensario de Suplementos..." />}>
            <SupplementsView />
          </Suspense>
        );

      case "profile":
        return (
          <Suspense fallback={<ViewSkeletonLoader title="Cargando Perfil & Telemetría..." />}>
            <ProfileView />
          </Suspense>
        );

      default:
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-200/50">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Módulo No Encontrado</h2>
              <p className="text-slate-500 text-sm mb-6">El bloque de telemetría solicitado no está disponible.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full max-w-full overflow-x-hidden flex-col md:flex-row bg-[#F8FAFC]">
      <SidebarNav active={activeTab} setActive={setActiveTab} />
      <main className="w-full max-w-full min-w-0 h-[100dvh] overflow-y-auto overflow-x-hidden pt-[env(safe-area-inset-top,0.75rem)] pb-[env(safe-area-inset-bottom,1.5rem)] px-2 sm:px-6 py-3 ml-0 md:ml-20 flex-1 flex flex-col">
        {renderContent()}
      </main>
      <Suspense fallback={null}>
        <QuickActionBottomSheet onNavigateTab={setActiveTab} />
      </Suspense>
    </div>
  );
}
