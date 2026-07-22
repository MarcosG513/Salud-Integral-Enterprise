import { useState } from "react";
import { AxisStatusBar } from "./components/hpg/AxisStatusBar";
import { EnergyAvailabilityPanel } from "./components/hpg/EnergyAvailabilityPanel";
import { DoreyProtocolPanel } from "./components/hpg/DoreyProtocolPanel";
import { CortisolMatrixPanel } from "./components/hpg/CortisolMatrixPanel";
import { NavDock } from "./components/hpg/NavDock";
import { COLORS, mono } from "./components/hpg/tokens";

export default function App() {
  const [ea, setEa] = useState(38);
  const [tab, setTab] = useState("hormonal");
  const suppressed = ea < 30;

  return (
    <div
      className="relative flex min-h-screen w-full flex-col gap-4 overflow-hidden p-5"
      style={{ background: COLORS.obsidian }}
    >
      {/* Flash keyframes + subtle grid ambience */}
      <style>{`
        @keyframes hpgFlash { 0%,100% { box-shadow: 0 0 0 1px ${COLORS.crimson}, 0 0 18px ${COLORS.crimson}55; } 50% { box-shadow: 0 0 0 1px ${COLORS.crimson}, 0 0 4px ${COLORS.crimson}22; } }
      `}</style>
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `linear-gradient(${COLORS.border}22 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border}22 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 80%)",
        }}
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[60%] -translate-x-1/2 rounded-full opacity-20"
        style={{ background: `radial-gradient(circle, ${suppressed ? COLORS.crimson : COLORS.cyan}, transparent 70%)` }}
      />

      <div className="relative z-10 flex flex-1 flex-col gap-4">
        <AxisStatusBar suppressed={suppressed} />

        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
          <EnergyAvailabilityPanel ea={ea} onEaChange={setEa} />
          <DoreyProtocolPanel />
          <CortisolMatrixPanel />
        </div>

        <NavDock active={tab} onChange={setTab} />

        <div className="flex items-center justify-between px-1">
          <span style={{ ...mono, color: COLORS.textDim, fontSize: 9, letterSpacing: "0.12em" }}>
            HPG-MONITOR v2.6 · INTERNAL CLINICAL VIEW
          </span>
          <span style={{ ...mono, color: COLORS.textDim, fontSize: 9, letterSpacing: "0.12em" }}>
            TELEMETRY SYNC · {new Date().toISOString().slice(0, 19).replace("T", " ")}Z
          </span>
        </div>
      </div>
    </div>
  );
}
