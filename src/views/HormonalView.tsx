import { Info } from "lucide-react";
import { useClinicalEngine } from "../context/clinical-engine-context";
import { AxisStatusBar } from "../components/hormonal/AxisStatusBar";
import { EnergyAvailabilityPanel } from "../components/hormonal/EnergyAvailabilityPanel";
import { DoreyProtocolPanel } from "../components/hormonal/DoreyProtocolPanel";
import { CortisolMatrixPanel } from "../components/hormonal/CortisolMatrixPanel";
import { mono } from "../components/hormonal/tokens";

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
      className="relative flex-1 w-full flex flex-col gap-6 p-4 sm:p-8 bg-slate-50 text-slate-900 transition-all duration-300"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="relative z-10 flex flex-1 flex-col gap-6">
        <AxisStatusBar suppressed={suppressed} />

        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
          <EnergyAvailabilityPanel ea={ea} onEaChange={handleEaChange} />
          <DoreyProtocolPanel />
          <CortisolMatrixPanel />
        </div>

        {/* Aviso Clínico Editorial */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/40 flex items-start gap-4">
          <div className="size-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 mt-0.5">
            <Info size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Aviso Clínico Informativo · Eje Hipotálamo-Hipofisario-Gonadal
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Los rangos de referencia hormonales (LH, FSH, Testosterona Total, SHBG, Cortisol) y las directivas de disponibilidad energética (EA) son modelos orientativos de monitorización deportiva. Las fluctuaciones hormonales pueden derivar de factores multifactoriales (sueño, estrés laboral, infección o ritmo circadiano). Este panel no emite diagnósticos médicos ni sustituye una analítica serológica supervisada por un endocrinólogo colegiado.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 pt-2 text-slate-500 font-mono text-xs">
          <span style={{ ...mono }}>
            MONITOR-HPG v2.6 · VISTA CLÍNICA INTERNA
          </span>
          <span style={{ ...mono }}>
            SINCRONIZACIÓN DE TELEMETRÍA · {new Date().toISOString().slice(0, 19).replace("T", " ")}Z
          </span>
        </div>
      </div>
    </div>
  );
}

export default HormonalView;
