import { useState, lazy, Suspense } from "react";
import { DashboardLayout } from "./components/dashboard-layout";
import { ClinicalEngineProvider } from "../context/clinical-engine-context";

const SettingsDrawer = lazy(() => import("../components/settings-drawer"));

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
        <DashboardLayout onOpenSettings={() => setIsDrawerOpen(true)} />
        {isDrawerOpen && (
          <Suspense fallback={null}>
            <SettingsDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
          </Suspense>
        )}
      </div>
    </ClinicalEngineProvider>
  );
}
