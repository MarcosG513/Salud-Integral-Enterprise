import { ShieldAlert, Wind, CheckCircle2 } from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";

function Gauge({ pct }: { pct: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const boundedPct = Math.max(0, Math.min(1, pct));

  const strokeColor =
    boundedPct >= 0.75 ? "#10B981" : boundedPct >= 0.5 ? "#0284C7" : "#F43F5E";

  return (
    <div className="relative flex items-center justify-center">
      <svg
        viewBox="0 0 140 140"
        className="w-full max-w-[150px]"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle cx="70" cy="70" r={r} fill="none" stroke="#F1F5F9" strokeWidth={10} />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - boundedPct)}
          style={{
            transition: "stroke-dashoffset 0.5s ease-in-out, stroke 0.5s ease",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular-nums text-slate-900 font-black text-2xl font-mono">
          {Math.round(boundedPct * 100)}%
        </span>
        <span className="text-xs font-bold" style={{ color: strokeColor }}>
          {boundedPct >= 0.75 ? "Óptimo" : boundedPct >= 0.5 ? "Subóptimo" : "Deficiente"}
        </span>
      </div>
    </div>
  );
}

export function EndothelialMonitor() {
  const { profile, metrics } = useClinicalEngine();

  const getAlertBanner = () => {
    if (metrics.isREDSTriggered) {
      return (
        <div className="mt-auto rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <ShieldAlert className="size-4 text-rose-600" />
            <span className="text-xs font-bold tracking-wide text-rose-700">
              ESCUDO ENDOCRINO IOC 2023 ACTIVO
            </span>
          </div>
          <p className="text-xs leading-relaxed text-rose-800 font-medium">
            Disponibilidad Energética:{" "}
            <span className="font-bold">{metrics.energyAvailability} kcal/kg FFM/día</span>.
            Pisos de lípidos ({metrics.macros.fat}g) y carbohidratos ({metrics.macros.carbs}g) protegidos mediante ajuste calórico positivo y control de volumen.
          </p>
        </div>
      );
    }

    if (metrics.isHardClampActive) {
      return (
        <div className="mt-auto rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <ShieldAlert className="size-4 text-amber-600" />
            <span className="text-xs font-bold tracking-wide text-amber-800">
              PROTECCIÓN HORMONAL ACTIVA
            </span>
          </div>
          <p className="text-xs leading-relaxed text-amber-900 font-medium">
            Pisos hormonales protegidos: mínimo <span className="font-bold">0.6 g/kg</span> de lípidos ({metrics.macros.fat}g/día) y disponibilidad glucídica segura asegurados.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-auto rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="mb-1.5 flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <span className="text-xs font-bold tracking-wide text-emerald-700">
            ESTADO DEL SISTEMA · NOMINAL
          </span>
        </div>
        <p className="text-xs leading-relaxed text-emerald-800 font-medium">
          Parámetros fisiológicos estables. Disponibilidad Energética:{" "}
          <span className="font-bold">{metrics.energyAvailability} kcal/kg FFM/día</span>.
          Base endocrina asegurada.
        </p>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm text-slate-900">
      <div className="flex items-center gap-2">
        <Wind className="size-4 text-sky-600" />
        <h3 className="font-bold text-sm text-slate-900">Flujo Endotelial</h3>
      </div>

      <div className="flex flex-col items-center gap-1 pb-2">
        <Gauge pct={metrics.noxScore / 100} />
        <span className="text-slate-600 mt-2 text-xs font-medium">
          Índice NOx · Malato de L-Citrulina ({profile.citrullineGrams}g)
        </span>
      </div>

      {getAlertBanner()}
    </div>
  );
}
