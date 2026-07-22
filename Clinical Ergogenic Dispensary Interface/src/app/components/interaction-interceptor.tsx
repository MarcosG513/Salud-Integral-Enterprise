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
    code: "CIRCADIAN INTERCEPT",
    title: "Caffeine logged after 14:00",
    body: "Adenosine receptor competitive antagonism risks disrupting deep sleep architecture. Blocking evening absorption window.",
    time: "16:24",
  },
  {
    id: "iron",
    level: "warn",
    code: "CHELATION CONFLICT",
    title: "Iron + Calcium co-ingestion",
    body: "Divalent cation competition at DMT1 transporter reduces non-heme iron uptake by ~45%. Recommend 2h separation.",
    time: "12:10",
  },
  {
    id: "cit",
    level: "clear",
    code: "SYNERGY VERIFIED",
    title: "L-Citrulline + Nitrate stack",
    body: "eNOS + nitrate-nitrite-NO pathways non-competitive. Compounded vasodilation cleared for pre-workout window.",
    time: "16:00",
  },
];

const CFG = {
  block: { accent: COLORS.coral, Icon: Ban, label: "BLOCKED" },
  warn: { accent: "#FFB020", Icon: AlertTriangle, label: "WARNING" },
  clear: { accent: COLORS.lime, Icon: ShieldCheck, label: "CLEARED" },
} as const;

export function InteractionInterceptor() {
  return (
    <GlassCard className="h-full flex flex-col" glow={`${COLORS.coral}1F`}>
      <PanelHeader
        index="03"
        title="Nutrient-Interaction Interceptor"
        accent={COLORS.coral}
        right={<Moon size={13} style={{ color: "#64748B" }} />}
      />

      <div className="p-3 flex-1 overflow-auto space-y-2.5">
        {INTERCEPTS.map((it) => {
          const { accent, Icon, label } = CFG[it.level];
          return (
            <div
              key={it.id}
              className="rounded-md p-3"
              style={{ border: `1px solid ${accent}55`, background: `${accent}0A` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={13} style={{ color: accent }} />
                  <span className="text-[10px] uppercase tracking-[0.14em]" style={{ ...mono, color: accent, fontWeight: 700 }}>
                    {it.code}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px]" style={{ ...mono, color: "#64748B" }}>{it.time}</span>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded uppercase tracking-[0.12em]"
                    style={{ ...mono, color: accent, border: `1px solid ${accent}66` }}
                  >
                    {label}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-100" style={{ fontWeight: 600 }}>{it.title}</div>
              <div className="mt-1 text-[10px] leading-relaxed text-slate-400" style={mono}>
                {it.body}
              </div>
            </div>
          );
        })}

        {/* Circadian absorption readout */}
        <div
          className="rounded-md p-3"
          style={{ border: `1px solid ${COLORS.border}`, background: "rgba(7,10,19,0.5)" }}
        >
          <div className="text-[9px] uppercase tracking-[0.15em] text-slate-500 mb-2">Absorption Window Map</div>
          <div className="flex gap-[3px]">
            {Array.from({ length: 24 }).map((_, h) => {
              const blocked = h >= 14;
              const active = h >= 16 && h < 18;
              return (
                <div key={h} className="flex-1 flex flex-col items-center gap-1">
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
                    <span className="text-[7px]" style={{ ...mono, color: "#475569" }}>
                      {String(h).padStart(2, "0")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-3 text-[8px] uppercase tracking-[0.1em]" style={mono}>
            <span style={{ color: COLORS.lime }}>■ Open</span>
            <span style={{ color: COLORS.cyan }}>■ Active</span>
            <span style={{ color: COLORS.coral }}>■ Blocked</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
