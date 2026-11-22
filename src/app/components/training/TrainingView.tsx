import { Activity, Cpu, Radio } from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";
import { MesocycleStrip } from "./MesocycleStrip";
import { VolumeMatrix } from "./VolumeMatrix";
import { RoutineGrid } from "./RoutineGrid";
import { CNSInterceptor } from "./CNSInterceptor";
import { DoreySync } from "./DoreySync";

export function TrainingView() {
  const { profile, metrics, updateProfileVariable } = useClinicalEngine();

  const activeWeek = profile.mesocycleWeek;
  const setActiveWeek = (week: number) => {
    updateProfileVariable("mesocycleWeek", week);
  };

  const override = metrics.training.isSNCOverrideActive && (activeWeek === 3 || activeWeek === 4);

  return (
    <div
      className="w-full max-w-full min-w-0 bg-slate-50 text-slate-900 flex flex-col p-3 sm:p-6 gap-6"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full max-w-full min-w-0 rounded-3xl bg-white p-5 sm:px-6 sm:py-5 border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="size-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/10 spring-bounce">
            <Activity className="size-5 text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 truncate max-w-full">
              Entrenamiento y Recuperación Muscular
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5 truncate max-w-full">
              Sincronización de Carga y Prescripción RIR
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold shrink-0 flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold">
            <Radio className="size-3.5 text-emerald-500" /> Sistema Activo
          </span>
          <span
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-bold",
              override ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-100 text-slate-700",
            ].join(" ")}
          >
            <Cpu className="size-3.5" /> {override ? "Límite de Volumen Activo" : "SNC Normal"}
          </span>
        </div>
      </header>

      {/* Top strip */}
      <div className="w-full max-w-full min-w-0">
        <MesocycleStrip activeWeek={activeWeek} onSelect={setActiveWeek} />
      </div>

      {/* Main tri-panel grid */}
      <main className="grid grid-cols-1 xl:grid-cols-[300px_1fr_340px] gap-4 w-full max-w-full min-w-0">
        <div className="w-full max-w-full min-w-0">
          <VolumeMatrix activeWeek={activeWeek} />
        </div>
        <div className="w-full max-w-full min-w-0">
          <RoutineGrid activeWeek={activeWeek} />
        </div>
        <div className="w-full max-w-full min-w-0">
          <CNSInterceptor activeWeek={activeWeek} />
        </div>
      </main>

      {/* Bottom bar */}
      <div className="w-full max-w-full min-w-0">
        <DoreySync />
      </div>
    </div>
  );
}

export default TrainingView;
