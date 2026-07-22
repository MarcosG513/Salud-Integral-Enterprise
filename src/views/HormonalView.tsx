import { useClinicalEngine } from "../context/clinical-engine-context";
import { AxisStatusBar } from "../components/hormonal/AxisStatusBar";
import { EnergyAvailabilityPanel } from "../components/hormonal/EnergyAvailabilityPanel";
import { DoreyProtocolPanel } from "../components/hormonal/DoreyProtocolPanel";
import { CortisolMatrixPanel } from "../components/hormonal/CortisolMatrixPanel";
import { COLORS, mono } from "../components/hormonal/tokens";

export function HormonalView() {
  const { profile, metrics, updateProfileVariable } = useClinicalEngine();

  const ea = metrics.energyAvailability;
  const suppressed = metrics.isREDSTriggered;

  const handleEaChange = (newEa: number) => {
    // Reverse engineering equation to calculate required deficit Target
    // deficitTarget = tdee - exerciseCalories - (newEa * ffm)
    const newDeficit = metrics.tdee - profile.exerciseCalories - (newEa * metrics.ffm);
    updateProfileVariable("deficitTarget", Math.max(0, Math.round(newDeficit)));
  };

  return (
    <div
      className="relative flex-1 min-h-screen w-full flex flex-col gap-5 overflow-y-auto p-4 sm:p-8 bg-slate-50 text-slate-900 transition-all duration-300"
    >
      {/* Flash keyframes + subtle grid ambience */}
      <style>{`
        @keyframes hpgFlash { 
          0%, 100% { box-shadow: inset 0 0 50px rgba(255, 77, 77, 0.35); border-color: ${COLORS.crimson}; }
          50% { box-shadow: inset 0 0 15px rgba(255, 77, 77, 0.1); border-color: ${COLORS.crimson}33; }
        }
      `}</style>
      
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(${COLORS.border}22 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border}22 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 80%)",
        }}
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[60%] -translate-x-1/2 rounded-full opacity-15"
        style={{ background: `radial-gradient(circle, ${suppressed ? COLORS.crimson : COLORS.cyan}, transparent 70%)` }}
      />

      <div className="relative z-10 flex flex-1 flex-col gap-4">
        <AxisStatusBar suppressed={suppressed} />

        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
          <EnergyAvailabilityPanel ea={ea} onEaChange={handleEaChange} />
          <DoreyProtocolPanel />
          <CortisolMatrixPanel />
        </div>

        <div className="flex items-center justify-between px-1 mt-4">
          <span style={{ ...mono, color: COLORS.textDim, fontSize: 9, letterSpacing: "0.12em" }}>
            MONITOR-HPG v2.6 · VISTA CLÍNICA INTERNA
          </span>
          <span style={{ ...mono, color: COLORS.textDim, fontSize: 9, letterSpacing: "0.12em" }}>
            SINCRONIZACIÓN DE TELEMETRÍA · {new Date().toISOString().slice(0, 19).replace("T", " ")}Z
          </span>
        </div>
      </div>
    </div>
  );
}

export default HormonalView;
