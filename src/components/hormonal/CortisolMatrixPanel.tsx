import { Sunrise, Dumbbell, Sun, Moon } from "lucide-react";
import { useClinicalEngine } from "../../context/clinical-engine-context";
import { GlassCard } from "./GlassCard";
import { COLORS, mono } from "./tokens";
import { GlossaryTooltip } from "../../app/components/widgets/ClinicalGlossary";

export function CortisolMatrixPanel() {
  const { profile } = useClinicalEngine();

  const anchors = [
    {
      icon: Sunrise,
      window: "06:30 – 08:00",
      title: "Pico de Cortisol AM",
      metric: "CAR +142%",
      detail: "Exposición a la luz solar + carga de proteína · impulso hormonal matutino",
      accentBg: "bg-amber-50 text-amber-600 border-amber-200",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      metricColor: "text-amber-700",
      status: "SINCRONIZADO",
      tooltipTerm: "cortisol am",
    },
    {
      icon: Dumbbell,
      window: "16:00 – 17:30",
      title: "Ventana Post-Entrenamiento",
      metric: "45g CHO",
      detail: "Atenuar cortisol del entreno · recuperación de insulina + señalización mTOR post-esfuerzo",
      accentBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      metricColor: "text-emerald-700",
      status: "ÓPTIMO",
      tooltipTerm: null,
    },
    {
      icon: Sun,
      window: "12:00 – 14:00",
      title: "Meseta Adrenal del Mediodía",
      metric: "8.4 µg/dL",
      detail: "Línea base estable · evitar cafeína acumulada para proteger el descanso de la tarde",
      accentBg: "bg-sky-50 text-sky-600 border-sky-200",
      badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
      metricColor: "text-sky-700",
      status: "ESTABLE",
      tooltipTerm: "cortisol",
    },
    {
      icon: Moon,
      window: "21:30 – 23:00",
      title: "GABA / Melatonina Nocturna",
      metric: "3 mg MEL",
      detail: "Relajación GABAérgica · nadir de cortisol permite oleada nocturna de LH y testosterona",
      accentBg: "bg-indigo-50 text-indigo-600 border-indigo-200",
      badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
      metricColor: "text-indigo-700",
      status: "SINCRONIZADO",
      tooltipTerm: "mel",
    },
  ];

  // Calculate circadian sync percentage based on user's consistency metrics
  const syncPercentage = Math.round(96 - (profile.deficitTarget / 1000) * 8 - (100 - profile.cnsReadiness) * 0.1);

  return (
    <GlassCard title="Cortisol · Matriz de Alineación Circadiana" code="HPA//CIRC-04" accent="#0284C7">
      <div className="flex h-full flex-col gap-3.5 text-left">
        <div className="flex items-center justify-between gap-2 rounded-2xl px-4 py-2.5 bg-slate-50 border border-slate-200 shadow-xs">
          <span className="uppercase text-xs tracking-[0.12em] font-mono font-bold flex items-center gap-2 min-w-0 text-slate-600">
            <span className="min-w-0 break-words">Sincronización Circadiana Diaria</span>
            <span className="shrink-0 -my-1.5">
              <GlossaryTooltip term="circadian interceptor" />
            </span>
          </span>
          <span style={{ ...mono }} className="font-mono text-sm font-extrabold text-emerald-700 shrink-0">{syncPercentage}%</span>
        </div>

        <div className="relative flex flex-1 flex-col gap-2.5">
          {anchors.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={`cortisol-anchor-${a.title}`}
                className="relative flex gap-3.5 rounded-2xl p-3.5 bg-slate-50 border border-slate-200 shadow-xs"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${a.accentBg} shadow-xs`}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0 text-sm text-slate-900 font-bold">
                      <span className="min-w-0 break-words">{a.title}</span>
                      {a.tooltipTerm && (
                        <span className="shrink-0 -my-1.5">
                          <GlossaryTooltip term={a.tooltipTerm} instanceId={`cortisol-anchor-${a.title}-${a.tooltipTerm}`} />
                        </span>
                      )}
                    </span>
                    <span style={{ ...mono }} className={`font-mono text-xs font-black shrink-0 ${a.metricColor}`}>{a.metric}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{ ...mono }} className="font-mono text-slate-500 text-xs font-semibold">{a.window}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 border text-[10px] font-mono font-bold tracking-wider ${a.badgeClass}`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <p style={{ ...mono }} className="font-mono text-slate-600 text-xs leading-relaxed mt-1 font-medium">{a.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
