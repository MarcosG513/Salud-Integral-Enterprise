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
      className="relative flex-1 min-h-screen p-4 sm:p-8 flex flex-col gap-6 overflow-y-auto bg-slate-50 text-slate-900"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
            style={{ border: `1px solid ${COLORS.lime}55`, background: `${COLORS.lime}0D` }}
          >
            <span style={{ ...mono, color: COLORS.lime, fontWeight: 800 }}>℞</span>
          </div>
          <div>
            <h1 className="text-slate-100 tracking-tight font-bold text-base leading-tight">
              Dispensario Ergogénico Clínico y Matriz de Suplementación
            </h1>
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500 font-mono mt-0.5" style={mono}>
              Telemetría de Sincronización de Nutrientes · Vista Interna · Rev 4.8
            </div>
          </div>
        </div>
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md"
          style={{ border: `1px solid ${COLORS.border}`, background: "rgba(15,19,34,0.7)" }}
        >
          <span className="text-xs uppercase tracking-[0.15em] text-slate-500 font-mono">ID del Sujeto</span>
          <span className="text-[11px] font-mono" style={{ color: COLORS.cyan }}>ATH-0447-Δ</span>
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
