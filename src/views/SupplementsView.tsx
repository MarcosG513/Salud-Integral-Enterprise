import { useClinicalEngine } from "../context/clinical-engine-context";
import { ChronoStrip } from "../components/supplements/chrono-strip";
import { DispensaryMatrix } from "../components/supplements/dispensary-matrix";
import { CycleScheduler } from "../components/supplements/cycle-scheduler";
import { InteractionInterceptor } from "../components/supplements/interaction-interceptor";
import { COLORS, mono } from "../components/supplements/telemetry-primitives";

export function SupplementsView() {
  const { profile } = useClinicalEngine();

  return (
    <div
      className="relative flex-1 p-4 sm:p-8 flex flex-col gap-6 bg-slate-50 text-slate-900"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-xs"
          >
            <span style={{ ...mono, fontWeight: 800 }}>℞</span>
          </div>
          <div>
            <h1 className="text-slate-900 tracking-tight font-bold text-base leading-tight">
              Dispensario Ergogénico Clínico y Matriz de Suplementación
            </h1>
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500 font-mono mt-0.5" style={mono}>
              Telemetría de Sincronización de Nutrientes · Vista Interna · Rev 4.8
            </div>
          </div>
        </div>
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-xs"
        >
          <span className="text-xs uppercase tracking-[0.15em] text-slate-500 font-mono font-semibold">ID del Sujeto</span>
          <span className="text-xs font-mono font-bold text-sky-600">ATH-0447-Δ</span>
        </div>
      </div>

      {/* 1 · Top strip */}
      <ChronoStrip />

      {/* 2·3·4 · Three-panel bento */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-0">
        <div className="min-h-[350px] xl:min-h-0">
          <DispensaryMatrix />
        </div>
        <div className="min-h-[350px] xl:min-h-0">
          <CycleScheduler />
        </div>
        <div className="min-h-[350px] xl:min-h-0">
          <InteractionInterceptor />
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between px-1 text-slate-500 font-mono text-xs mt-2">
        <span>℞ DISPENSARIO v4.8 · CUMPLIMIENTO CLÍNICO ACTIVO</span>
        <span>ÚLTIMA DOSIS SINCRONIZADA · {(profile.username || "Marcos M.").toUpperCase()}</span>
      </div>
    </div>
  );
}

export default SupplementsView;
