import { AlertTriangle, ShieldCheck, Moon, Ban } from "lucide-react";
import { COLORS, GlassCard, PanelHeader, mono } from "./telemetry-primitives";

type Intercept = {
  id: string;
  level: "block" | "warn" | "clear";
  code: string;
  title: string;
  body: string;
  time: string;
};

const INTERCEPTS: Intercept[] = [
  {
    id: "caf",
    level: "block",
    code: "INTERCEPCIÓN CIRCADIANA",
    title: "Cafeína registrada después de las 14:00",
    body: "El antagonismo competitivo del receptor de adenosina corre el riesgo de alterar la arquitectura del sueño profundo. Bloqueando la ventana de absorción de la tarde.",
    time: "16:24",
  },
  {
    id: "iron",
    level: "warn",
    code: "CONFLICTO DE QUELACIÓN",
    title: "Coingestión de Hierro + Calcio",
    body: "La competencia de cationes divalentes en el transportador DMT1 reduce la absorción de hierro no hemo en ~45%. Se recomienda separar por 2h.",
    time: "12:10",
  },
  {
    id: "cit",
    level: "clear",
    code: "SINERGIA VERIFICADA",
    title: "Sinergia L-Citrulina + Nitrato",
    body: "Las vías eNOS y nitrato-nitrito-NO no son competitivas. Vasodilatación combinada aprobada para la ventana pre-entrenamiento.",
    time: "16:00",
  },
];

const CFG = {
  block: { accent: COLORS.coral, Icon: Ban, label: "BLOQUEADO" },
  warn: { accent: "#FFB020", Icon: AlertTriangle, label: "ADVERTENCIA" },
  clear: { accent: COLORS.lime, Icon: ShieldCheck, label: "APROBADO" },
} as const;

export function InteractionInterceptor() {
  return (
    <GlassCard className="h-full flex flex-col" glow={`${COLORS.coral}1F`}>
      <PanelHeader
        index="03"
        title="Interceptor de Interacción de Nutrientes"
        accent={COLORS.coral}
        right={<Moon size={13} style={{ color: "#64748B" }} />}
      />

      <div className="p-3 flex-1 overflow-auto space-y-2.5">
        {INTERCEPTS.map((it) => {
          const { accent, Icon, label } = CFG[it.level];
          return (
            <div
              key={`intercept-${it.id}`}
              className="rounded-md p-3"
              style={{ border: `1px solid ${accent}55`, background: `${accent}0A` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={13} style={{ color: accent }} />
                  <span className="text-xs uppercase tracking-[0.14em] font-mono font-bold" style={{ color: accent }}>
                    {it.code}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono" style={{ color: "#64748B" }}>{it.time}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded uppercase tracking-[0.12em] font-mono font-bold"
                    style={{ color: accent, border: `1px solid ${accent}66` }}
                  >
                    {label}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-[11.5px] text-slate-100 font-semibold">{it.title}</div>
              <div className="mt-1 text-xs leading-relaxed text-slate-400 font-mono">
                {it.body}
              </div>
            </div>
          );
        })}

        {/* Circadian absorption map */}
        <div
          className="rounded-md p-3"
          style={{ border: `1px solid ${COLORS.border}`, background: "rgba(7,10,19,0.5)" }}
        >
          <div className="text-xs uppercase tracking-[0.15em] text-slate-500 mb-2 font-mono">Mapa de Ventanas de Absorción</div>
          <div className="flex gap-[3px]">
            {Array.from({ length: 24 }).map((_, h) => {
              const blocked = h >= 14;
              const active = h >= 16 && h < 18;
              return (
                <div key={`circadian-hour-${h}`} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm"
                    style={{
                      height: 22,
                      background: active
                        ? COLORS.cyan
                        : blocked
                        ? `${COLORS.coral}55`
                        : `${COLORS.lime}33`,
                      boxShadow: active ? `0 0 8px ${COLORS.cyan}` : "none",
                    }}
                  />
                  {h % 6 === 0 && (
                    <span className="text-[7px] font-mono" style={{ color: "#475569" }}>
                      {String(h).padStart(2, "0")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs uppercase tracking-[0.1em] font-mono" style={{ ...mono }}>
            <span style={{ color: COLORS.lime }}>■ Abierto</span>
            <span style={{ color: COLORS.cyan }}>■ Activo</span>
            <span style={{ color: COLORS.coral }}>■ Bloqueado</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
