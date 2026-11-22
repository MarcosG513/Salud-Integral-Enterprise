import { useState, lazy, Suspense } from "react";
import { DashboardLayout } from "./components/dashboard-layout";
import { ViewSkeletonLoader } from "./components/ui/ViewSkeletonLoader";
import { ClinicalEngineProvider } from "../context/clinical-engine-context";
import type { ExternalQuickLogTab } from "../components/quick-log/QuickActionBottomSheet";

const SettingsDrawer = lazy(() => import("../components/settings-drawer"));
const HelpCenterView = lazy(() => import("../views/HelpCenterView"));

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [quickLogRequest, setQuickLogRequest] = useState<{
    tab: ExternalQuickLogTab;
    nonce: number;
  } | null>(null);
  const [onboardingAction, setOnboardingAction] = useState<{
    mode: "welcome" | "tour";
    nonce: number;
  } | null>(null);

  const helpView = (
    <Suspense fallback={<ViewSkeletonLoader title="Cargando Guía y Centro de Ayuda..." />}>
      <HelpCenterView
        onNavigateTab={setActiveTab}
        onOpenSettings={() => setIsDrawerOpen(true)}
        onOpenQuickLog={(tab) => setQuickLogRequest({ tab, nonce: Date.now() })}
        onLaunchOnboarding={(mode) => {
          setActiveTab("dashboard");
          setOnboardingAction({ mode, nonce: Date.now() });
        }}
      />
    </Suspense>
  );

  return (
    <ClinicalEngineProvider>
      <div
        className="size-full min-h-[100dvh] text-slate-900 bg-slate-50 antialiased selection:bg-rose-500 selection:text-white"
        style={{
          fontFamily:
            "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
          background: "#F8FAFC",
        }}
      >
        <DashboardLayout
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          onOpenSettings={() => setIsDrawerOpen(true)}
          helpView={helpView}
          quickLogRequest={quickLogRequest}
          onboardingAction={onboardingAction}
        />
        {isDrawerOpen && (
          <Suspense fallback={null}>
            <SettingsDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
          </Suspense>
        )}
      </div>
    </ClinicalEngineProvider>
  );
}
