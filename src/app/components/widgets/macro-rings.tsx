import { useClinicalEngine } from "../../../context/clinical-engine-context";
import { ShieldAlert } from "lucide-react";

const STROKE = 9;

function Ring({
  r,
  pct,
  color,
}: {
  r: number;
  pct: number;
  color: string;
}) {
  const c = 2 * Math.PI * r;
  const boundedPct = Math.max(0, Math.min(1, pct));
  return (
    <>
      {/* Light neutral track background */}
      <circle
        cx="120"
        cy="120"
        r={r}
        fill="none"
        stroke="#F1F5F9"
        strokeWidth={STROKE}
      />
      {/* Vivid progress ring */}
      <circle
        cx="120"
        cy="120"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - boundedPct)}
        style={{
          transition: "stroke-dashoffset 0.5s ease-in-out",
        }}
      />
    </>
  );
}

export function MacroRings() {
  const { metrics } = useClinicalEngine();

  const consumedProtein = metrics.consumedMacros.protein;
  const consumedCarbs = metrics.consumedMacros.carbs;
  const consumedFats = metrics.consumedMacros.fat;

  const totalConsumedKcal = metrics.consumedMacros.calories;

  const proteinPct = metrics.macros.protein > 0 ? consumedProtein / metrics.macros.protein : 0;
  const carbPct = metrics.macros.carbs > 0 ? consumedCarbs / metrics.macros.carbs : 0;
  const fatPct = metrics.macros.fat > 0 ? consumedFats / metrics.macros.fat : 0;

  const ringsData = [
    { label: "Proteína", value: `${consumedProtein.toFixed(0)} / ${metrics.macros.protein} g`, pct: proteinPct, color: "#10B981", r: 92 },
    { label: "Carbos", value: `${consumedCarbs.toFixed(0)} / ${metrics.macros.carbs} g`, pct: carbPct, color: "#0284C7", r: 72 },
    { label: "Grasas", value: `${consumedFats.toFixed(0)} / ${metrics.macros.fat} g`, pct: fatPct, color: "#06B6D4", r: 52 },
  ];

  const getStatusBadge = () => {
    if (metrics.isREDSTriggered) {
      return (
        <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-rose-700 font-extrabold text-xs">
          ESCUDO IOC 2023
        </span>
      );
    }
    if (metrics.isHardClampActive) {
      return (
        <span className="rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-sky-700 font-extrabold text-xs">
          PISO PROTEGIDO
        </span>
      );
    }
    return (
      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-700 font-extrabold text-xs">
        {metrics.algorithmStatus === "calibrating" ? "CALIBRANDO" : "ACTUALIZANDO"}
      </span>
    );
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 tracking-tight">Anillos de Homeostasis</h3>
          <p className="text-[11px] font-medium text-slate-600">
            {metrics.algorithmStatusBadge || "Calibrando algoritmo"} ({metrics.calibrationProgressPct ?? 50}%)
          </p>
        </div>
        {getStatusBadge()}
      </div>
      
      <div className="relative flex flex-1 items-center justify-center min-h-[210px]">
        <svg
          viewBox="0 0 240 240"
          className="w-full max-w-[230px]"
          style={{ transform: "rotate(-90deg)" }}
        >
          {ringsData.map((ring) => (
            <g key={`group-${ring.label}`}>
              <Ring r={ring.r} pct={ring.pct} color={ring.color} />
            </g>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center max-w-[110px] mx-auto text-center pointer-events-none">
          <span className="tabular-nums text-slate-900 font-black text-xl sm:text-2xl tracking-tight leading-none font-mono">
            {totalConsumedKcal.toLocaleString()}
          </span>
          <span className="text-slate-600 font-bold text-[11px] sm:text-xs mt-1 leading-tight">
            / {metrics.targetCalories.toLocaleString()} kcal
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {ringsData.map((ring) => (
          <div
            key={`detail-${ring.label}`}
            className="rounded-2xl border border-slate-200/80 bg-slate-50 p-2.5 text-center shadow-xs"
          >
            <div className="mb-1 flex items-center justify-center gap-1.5">
              <span
                className="size-2.5 rounded-full"
                style={{ background: ring.color }}
              />
              <span className="text-slate-900 font-black text-xs">
                {ring.label}
              </span>
            </div>
            <span className="tabular-nums text-slate-700 font-mono text-[11px] font-bold block">
              {ring.value}
            </span>
          </div>
        ))}
      </div>

      {metrics.isREDSTriggered && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-left text-xs font-medium text-rose-800 shadow-xs">
          <div className="mb-1 flex items-center gap-1.5 font-bold uppercase tracking-wider text-rose-700">
            <ShieldAlert className="size-4 text-rose-600 animate-pulse" />
            <span>PROTECCIÓN ACTIVA POR RED-S</span>
          </div>
          <p className="leading-relaxed text-rose-900 font-medium text-xs">
            Déficit Relativo de Energía en el Deporte detectado. Grasas protegidas al piso mínimo de 0.6g/kg.
          </p>
        </div>
      )}
    </div>
  );
}
