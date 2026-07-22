import { useClinicalEngine } from "../../../context/clinical-engine-context";

type Props = { activeWeek: number };

export function CNSInterceptor({ activeWeek }: Props) {
  const { profile, metrics } = useClinicalEngine();

  const readiness = profile.cnsReadiness;
  const critical = metrics.training.isSNCOverrideActive;
  const accent = critical ? "#FF4D4D" : readiness < 70 ? "#A855F7" : "#00F0FF";

  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - readiness / 100);

  return (
    <div
      className={[
        "rounded-md border bg-[#0F1322]/80 backdrop-blur-xl h-full flex flex-col transition-colors duration-300",
        critical ? "border-[#FF4D4D] animate-pulse" : "border-[#1E293B]",
      ].join(" ")}
      style={critical ? { boxShadow: "0 0 24px -4px rgba(255,77,77,0.4)" } : undefined}
    >
      <div className="px-4 py-3 border-b border-[#1E293B] flex items-center justify-between">
        <span className="text-xs tracking-[0.25em] font-mono uppercase" style={{ color: accent }}>
          Interceptor de SNC
        </span>
        <span
          className={[
            "font-mono text-xs tracking-widest px-2 py-0.5 rounded-sm border uppercase",
            critical ? "border-[#FF4D4D] text-[#FF4D4D]" : "border-[#1E293B] text-slate-500",
          ].join(" ")}
        >
          {critical ? "Anulación" : "Nominal"}
        </span>
      </div>

      {/* Readiness dial */}
      <div className="flex flex-col items-center py-5">
        <div className="relative size-[140px]">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="#1E293B" strokeWidth={8} />
            <circle
              cx="60" cy="60" r={R} fill="none" stroke={accent} strokeWidth={8}
              strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl tracking-tight" style={{ color: accent }}>
              {readiness}
              <span className="text-base text-slate-500">%</span>
            </span>
            <span className="font-mono text-xs tracking-[0.2em] text-slate-500 uppercase mt-1">
              Preparación
            </span>
          </div>
        </div>
      </div>

      {/* sub-metrics */}
      <div className="grid grid-cols-2 gap-px bg-[#1E293B] mx-4 rounded-sm overflow-hidden border border-[#1E293B]">
        {[
          { k: "VFC rMSSD", v: `${Math.round(28 + readiness * 0.6)}ms` },
          { k: "Déficit de Agarre", v: `${Math.max(0, Math.round((100 - readiness) * 0.4))}%` },
          { k: "Reacción (Taps)", v: `${Math.round(210 + (100 - readiness) * 1.4)}ms` },
          { k: "Déficit de Sueño", v: `${((100 - readiness) / 30).toFixed(1)}h` },
        ].map((m) => (
          <div key={`sub-metric-${m.k}`} className="bg-[#0F1322] px-3 py-2">
            <div className="font-mono text-xs tracking-wider text-slate-500 uppercase">{m.k}</div>
            <div className="font-mono text-sm" style={{ color: readiness < 45 ? "#FF4D4D" : "#e2e8f0" }}>
              {m.v}
            </div>
          </div>
        ))}
      </div>

      {/* Override readout */}
      <div className="px-4 pt-4 pb-4 mt-auto w-full max-w-full min-w-0">
        {critical ? (
          <div className="rounded-sm border border-[#FF4D4D] bg-[#FF4D4D]/[0.07] p-3 w-full max-w-full min-w-0 break-words overflow-hidden">
            <div className="flex items-center gap-2 mb-2 min-w-0">
              <span className="size-2 rounded-full bg-[#FF4D4D] animate-pulse shrink-0" />
              <span className="font-mono text-xs tracking-[0.15em] text-[#FF4D4D] uppercase font-bold truncate">
                Anulación de SNC Activa
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300 break-words overflow-hidden">
              Colisión de Señalización Molecular Detectada{" "}
              <span className="font-mono text-[#FF4D4D] font-bold break-words">(interferencia AMPK / mTORC1)</span>. Limitando el
              volumen de hipertrofia a un máximo estricto de{" "}
              <span className="font-mono text-[#FF4D4D] font-bold break-words">3 series efectivas de tensión mecánica pesada</span> por movimiento.
            </p>
          </div>
        ) : (
          <div className="rounded-sm border border-[#1E293B] bg-[#00F0FF]/[0.03] p-3 w-full max-w-full min-w-0 break-words overflow-hidden">
            <div className="flex items-center gap-2 mb-2 min-w-0">
              <span className="size-2 rounded-full shrink-0" style={{ background: accent }} />
              <span className="font-mono text-xs tracking-[0.15em] uppercase font-bold truncate" style={{ color: accent }}>
                Autorregulador Despejado
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400 break-words overflow-hidden">
              Señalización anabólica coherente. mTORC1 dominante · AMPK suprimida. Hitos de volumen
              prescritos liberados hasta el límite total de <span className="font-mono text-slate-200 font-bold break-words">MRV</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
