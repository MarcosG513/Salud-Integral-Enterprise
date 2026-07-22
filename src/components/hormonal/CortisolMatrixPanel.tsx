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
      detail: "Exposición a la luz solar + carga de proteína · aprovechar el despertar para máximo impulso hormonal",
      color: COLORS.cyan,
      status: "SINCRONIZADO",
      tooltipTerm: "cortisol am",
    },
    {
      icon: Dumbbell,
      window: "16:00 – 17:30",
      title: "Ventana Post-Entrenamiento",
      metric: "45g CHO",
      detail: "Atenuar cortisol del entreno · recuperación de insulina + señalización mTOR post-esfuerzo",
      color: COLORS.lime,
      status: "ÓPTIMO",
      tooltipTerm: null,
    },
    {
      icon: Sun,
      window: "12:00 – 14:00",
      title: "Meseta Adrenal del Mediodía",
      metric: "8.4 µg/dL",
      detail: "Línea base estable · evitar cafeína acumulada para proteger el descanso de la tarde",
      color: COLORS.textMute,
      status: "ESTABLE",
      tooltipTerm: "cortisol",
    },
    {
      icon: Moon,
      window: "21:30 – 23:00",
      title: "GABA / Melatonina Nocturna",
      metric: "3 mg MEL",
      detail: "Relajación GABAérgica · nadir de cortisol permite oleada nocturna de LH y testosterona",
      color: COLORS.lime,
      status: "SINCRONIZADO",
      tooltipTerm: "mel",
    },
  ];

  // Calculate circadian sync percentage based on user's consistency metrics
  const syncPercentage = Math.round(96 - (profile.deficitTarget / 1000) * 8 - (100 - profile.cnsReadiness) * 0.1);

  return (
    <GlassCard title="Cortisol · Matriz de Alineación Circadiana" code="HPA//CIRC-04" accent={COLORS.cyan}>
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(7,10,19,0.6)", border: `1px solid ${COLORS.border}` }}>
          <span className="uppercase text-xs tracking-[0.12em] flex items-center gap-1" style={{ color: COLORS.textDim }}>
            Sincronización Circadiana Diaria
            <GlossaryTooltip term="circadian interceptor" />
          </span>
          <span style={{ ...mono, color: COLORS.lime, fontSize: 14, fontWeight: "bold" }}>{syncPercentage}%</span>
        </div>

        <div className="relative flex flex-1 flex-col gap-2.5">
          {anchors.map((a, i) => {
            const Icon = a.icon;
            return (
              <div
                key={`cortisol-anchor-${a.title}`}
                className="relative flex gap-3 rounded-lg p-3"
                style={{ background: "rgba(7,10,19,0.55)", border: `1px solid ${COLORS.border}` }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                  style={{ background: `${a.color}12`, border: `1px solid ${a.color}55` }}
                >
                  <Icon size={17} color={a.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-sm text-slate-200 font-medium">
                      {a.title}
                      {a.tooltipTerm && <GlossaryTooltip term={a.tooltipTerm} instanceId={`cortisol-anchor-${a.title}-${a.tooltipTerm}`} />}
                    </span>
                    <span style={{ ...mono, color: a.color, fontSize: 13, fontWeight: "bold" }}>{a.metric}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{ ...mono, color: COLORS.textDim, fontSize: 11 }}>{a.window}</span>
                    <span
                      className="rounded-sm px-1.5 py-0.5"
                      style={{ ...mono, color: a.color, fontSize: 10, background: `${a.color}14`, letterSpacing: "0.08em" }}
                    >
                      {a.status}
                    </span>
                  </div>
                  <p style={{ ...mono, color: COLORS.textDim, fontSize: 11, lineHeight: 1.5, marginTop: 4 }}>{a.detail}</p>
                </div>
                <span style={{ ...mono, color: COLORS.border, fontSize: 11, position: "absolute", top: 8, right: 10 }}>
                  0{i + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
