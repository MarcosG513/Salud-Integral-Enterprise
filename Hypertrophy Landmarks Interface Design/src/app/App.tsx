import { useState } from "react";
import { Activity, Cpu, Radio } from "lucide-react";
import { MesocycleStrip } from "./components/MesocycleStrip";
import { VolumeMatrix } from "./components/VolumeMatrix";
import { RoutineGrid } from "./components/RoutineGrid";
import { CNSInterceptor } from "./components/CNSInterceptor";
import { DoreySync } from "./components/DoreySync";
import { CNS_READINESS, CNS_CRITICAL_THRESHOLD } from "./components/telemetry-data";

export default function App() {
  const [activeWeek, setActiveWeek] = useState(3);
  const override = CNS_READINESS[activeWeek] < CNS_CRITICAL_THRESHOLD;

  return (
    <div
      className="size-full min-h-screen bg-[#070A13] text-slate-200 flex flex-col overflow-hidden"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* faint grid backdrop */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(#1E293B 1px, transparent 1px), linear-gradient(90deg, #1E293B 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative flex flex-col h-screen p-4 gap-4">
        {/* Header */}
        <header className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-md border border-[#1E293B] bg-[#0F1322] flex items-center justify-center">
              <Activity className="size-4 text-[#00F0FF]" />
            </div>
            <div>
              <h1 className="text-sm tracking-tight text-slate-100 leading-none">
                Hypertrophy Landmarks & CNS Autoregulator
              </h1>
              <span className="font-mono text-[9px] tracking-[0.3em] text-slate-500 uppercase">
                Internal View · Neuro-Fatigue Telemetry
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-sm border border-[#1E293B] text-slate-400">
              <Radio className="size-3 text-[#00F0FF]" /> Streaming
            </span>
            <span
              className={[
                "flex items-center gap-1.5 px-2 py-1 rounded-sm border",
                override ? "border-[#FF4D4D] text-[#FF4D4D]" : "border-[#1E293B] text-slate-400",
              ].join(" ")}
            >
              <Cpu className="size-3" /> {override ? "CNS Lock" : "CNS OK"}
            </span>
          </div>
        </header>

        {/* Top strip */}
        <div className="shrink-0">
          <MesocycleStrip activeWeek={activeWeek} onSelect={setActiveWeek} />
        </div>

        {/* Main tri-panel grid */}
        <main className="flex-1 min-h-0 grid grid-cols-[300px_1fr_340px] gap-4">
          <VolumeMatrix activeWeek={activeWeek} />
          <RoutineGrid activeWeek={activeWeek} />
          <CNSInterceptor activeWeek={activeWeek} />
        </main>

        {/* Bottom bar */}
        <div className="shrink-0">
          <DoreySync />
        </div>
      </div>
    </div>
  );
}
