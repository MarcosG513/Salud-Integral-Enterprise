import { useState } from "react";
import { DashboardLayout } from "./components/dashboard-layout";
import { ClinicalEngineProvider } from "../context/clinical-engine-context";
import { SettingsDrawer } from "../components/settings-drawer";

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <ClinicalEngineProvider>
      <div
        className="size-full min-h-screen text-slate-900 bg-slate-50 antialiased selection:bg-rose-500 selection:text-white"
        style={{
          fontFamily:
            "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
          background: "#F8FAFC",
        }}
      >
        <DashboardLayout onOpenSettings={() => setIsDrawerOpen(true)} />
        <SettingsDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      </div>
    </ClinicalEngineProvider>
  );
}
