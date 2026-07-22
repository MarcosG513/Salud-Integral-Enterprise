import { ChronoStrip } from "./components/chrono-strip";
import { DispensaryMatrix } from "./components/dispensary-matrix";
import { CycleScheduler } from "./components/cycle-scheduler";
import { InteractionInterceptor } from "./components/interaction-interceptor";
import { NavDock } from "./components/nav-dock";
import { COLORS, mono } from "./components/telemetry-primitives";

export default function App() {
  return (
    <div
      className="size-full min-h-screen p-4 flex flex-col gap-4"
      style={{
        background: `radial-gradient(1200px 600px at 20% -10%, #0B1020 0%, ${COLORS.space} 55%)`,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ border: `1px solid ${COLORS.lime}55`, background: `${COLORS.lime}0D` }}
          >
            <span style={{ ...mono, color: COLORS.lime, fontWeight: 800 }}>℞</span>
          </div>
          <div>
            <h1 className="text-slate-100 tracking-tight" style={{ fontWeight: 700 }}>
              Clinical Ergogenic Dispensary & Supplementation Matrix
            </h1>
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500" style={mono}>
              Nutrient-Timing Telemetry · Internal View · Rev 4.8
            </div>
          </div>
        </div>
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md"
          style={{ border: `1px solid ${COLORS.border}`, background: "rgba(15,19,34,0.7)" }}
        >
          <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Subject ID</span>
          <span className="text-[11px]" style={{ ...mono, color: COLORS.cyan }}>ATH-0447-Δ</span>
        </div>
      </div>

      {/* 1 · Top strip */}
      <ChronoStrip />

      {/* 2·3·4 · Three-panel bento */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        <div className="lg:col-span-4 min-h-0">
          <DispensaryMatrix />
        </div>
        <div className="lg:col-span-4 min-h-0">
          <CycleScheduler />
        </div>
        <div className="lg:col-span-4 min-h-0">
          <InteractionInterceptor />
        </div>
      </div>

      {/* 5 · Bottom dock */}
      <NavDock />
    </div>
  );
}
