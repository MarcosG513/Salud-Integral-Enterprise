import { useClinicalEngine } from "../../../context/clinical-engine-context";

type Props = { activeWeek: number };

export function CNSInterceptor({ activeWeek }: Props) {
  const { profile, metrics } = useClinicalEngine();

  const readiness = profile.cnsReadiness;
  const critical = metrics.training.isSNCOverrideActive;
  const accent = critical ? "#EF4444" : readiness < 70 ? "#8B5CF6" : "#0284C7";

  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - readiness / 100);

  return (
    <div
      className={`rounded-3xl border bg-white shadow-xl shadow-slate-200/40 p-5 h-full flex flex-col text-slate-900 transition-all ${
        critical ? "border-rose-300 ring-2 ring-rose-500/20" : "border-slate-200/80"
      }`}
    >
      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs tracking-[0.25em] font-mono font-bold uppercase text-slate-900">
          Interceptor de SNC
        </span>
        <span
          className={`font-mono text-xs tracking-widest px-2.5 py-0.5 rounded-full border uppercase font-bold ${
            critical ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          {critical ? "Anulación" : "Nominal"}
        </span>
      </div>

      {/* Readiness dial */}
      <div className="flex flex-col items-center py-4">
        <div className="relative size-[135px]">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="#F1F5F9" strokeWidth={8} />
            <circle
              cx="60" cy="60" r={R} fill="none" stroke={accent} strokeWidth={8}
              strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl font-black tracking-tight text-slate-900">
              {readiness}
              <span className="text-base text-slate-400 font-semibold">%</span>
            </span>
            <span className="font-mono text-xs tracking-[0.2em] text-slate-500 uppercase mt-0.5 font-bold">
              Preparación
            </span>
          </div>
        </div>
      </div>

      {/* sub-metrics */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { k: "VFC rMSSD", v: `${Math.round(28 + readiness * 0.6)}ms` },
          { k: "Déficit de Agarre", v: `${Math.max(0, Math.round((100 - readiness) * 0.4))}%` },
          { k: "Reacción (Taps)", v: `${Math.round(210 + (100 - readiness) * 1.4)}ms` },
          { k: "Déficit de Sueño", v: `${((100 - readiness) / 30).toFixed(1)}h` },
        ].map((m) => (
          <div key={`sub-metric-${m.k}`} className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 shadow-xs">
            <div className="font-mono text-xs tracking-wider text-slate-500 uppercase font-semibold">{m.k}</div>
            <div className={`font-mono text-sm font-extrabold mt-0.5 ${readiness < 45 ? "text-rose-600" : "text-slate-900"}`}>
              {m.v}
            </div>
          </div>
        ))}
      </div>

      {/* Override readout */}
      <div className="pt-4 mt-auto w-full max-w-full min-w-0">
        {critical ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 w-full max-w-full min-w-0 break-words overflow-hidden shadow-xs">
            <div className="flex items-center gap-2 mb-1.5 min-w-0">
              <span className="size-2 rounded-full bg-rose-600 animate-pulse shrink-0" />
              <span className="font-mono text-xs tracking-[0.15em] text-rose-700 uppercase font-bold truncate">
                Anulación de SNC Activa
              </span>
            </div>
            <p className="text-xs leading-relaxed text-rose-800 break-words font-medium">
              Colisión de Señalización Molecular Detectada{" "}
              <span className="font-mono text-rose-900 font-bold">(interferencia AMPK / mTORC1)</span>. Limitando el
              volumen de hipertrofia a un máximo estricto de{" "}
              <span className="font-mono text-rose-900 font-bold">3 series efectivas de tensión mecánica pesada</span> por movimiento.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-3.5 w-full max-w-full min-w-0 break-words overflow-hidden shadow-xs">
            <div className="flex items-center gap-2 mb-1.5 min-w-0">
              <span className="size-2 rounded-full shrink-0 bg-sky-600" />
              <span className="font-mono text-xs tracking-[0.15em] uppercase font-bold truncate text-sky-800">
                Autorregulador Despejado
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 break-words font-medium">
              Señalización anabólica coherente. mTORC1 dominante · AMPK suprimida. Hitos de volumen
              prescritos liberados hasta el límite total de <span className="font-mono text-slate-900 font-bold">MRV</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
