import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS, GlassCard, PanelHeader, Meter, mono, StatusDot } from "./telemetry-primitives";

const SAT_DATA = [
  { wk: "S1", sat: 18 },
  { wk: "S2", sat: 41 },
  { wk: "S3", sat: 63 },
  { wk: "S4", sat: 74 },
  { wk: "S5", sat: 82 },
  { wk: "S6", sat: 87 },
  { wk: "S7", sat: 90 },
  { wk: "S8", sat: 92 },
];

const CYCLES = [
  { name: "Ashwagandha KSM-66", week: 3, total: 8, desens: "Mínimo", accent: COLORS.lime },
  { name: "Tolerancia a la Cafeína", week: 5, total: 6, desens: "Elevado", accent: COLORS.coral },
  { name: "Mantenimiento de Creatina", week: 12, total: 0, desens: "Estable", accent: COLORS.cyan },
];

export function CycleScheduler() {
  return (
    <GlassCard className="h-full flex flex-col" glow={`${COLORS.cyan}22`}>
      <PanelHeader
        index="02"
        title="Biodisponibilidad y Adaptación del Ciclo"
        accent={COLORS.cyan}
        right={
          <span className="text-xs uppercase tracking-[0.15em] font-mono" style={{ color: COLORS.cyan }}>
            Saturación Sistémica
          </span>
        }
      />

      <div className="p-4 flex-1 flex flex-col gap-4 overflow-auto">
        {/* Featured cycle */}
        <div
          className="rounded-md p-4"
          style={{ border: `1px solid ${COLORS.border}`, background: "rgba(7,10,19,0.5)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-slate-100 font-semibold">
              Ashwagandha KSM-66 · Ciclo de 8 Semanas
            </span>
            <span className="text-[13px] font-mono font-bold" style={{ color: COLORS.lime }}>
              Semana 3 / 8
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Meter value={(3 / 8) * 100} accent={COLORS.lime} />
            <span className="text-xs shrink-0 font-mono" style={{ color: "#64748B" }}>37.5%</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <StatusDot accent={COLORS.lime} />
            <span className="text-xs uppercase tracking-[0.12em] text-slate-400">
              Nivel de Desensibilización del Receptor:
            </span>
            <span className="text-[11px] font-mono font-bold animate-pulse" style={{ color: COLORS.lime }}>
              Mínimo
            </span>
          </div>
        </div>

        {/* Saturation chart */}
        <div
          className="rounded-md p-3"
          style={{ border: `1px solid ${COLORS.border}`, background: "rgba(7,10,19,0.5)" }}
        >
          <div className="text-xs uppercase tracking-[0.15em] text-slate-500 mb-1 px-1 font-mono">
            Curva de Saturación Plasmática — Equivalente en mg/L
          </div>
          <div style={{ height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SAT_DATA} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="satfill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.cyan} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={COLORS.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="wk" tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: COLORS.fill, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontFamily: "monospace", fontSize: 11 }}
                  labelStyle={{ color: COLORS.cyan }}
                  itemStyle={{ color: "#E2E8F0" }}
                />
                <Area type="monotone" dataKey="sat" stroke={COLORS.cyan} strokeWidth={2} fill="url(#satfill)" dot={{ r: 2, fill: COLORS.cyan }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active cycles list */}
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.15em] text-slate-500 px-1 font-mono">Fases de Carga Activas</div>
          {CYCLES.map((c) => (
            <div
              key={`cycle-load-${c.name}`}
              className="rounded-md px-3 py-2.5 flex items-center gap-3"
              style={{ border: `1px solid ${COLORS.border}`, background: "rgba(7,10,19,0.4)" }}
            >
              <StatusDot accent={c.accent} />
              <span className="text-[11px] text-slate-200 flex-1 truncate font-medium">{c.name}</span>
              <span className="text-xs font-mono" style={{ color: c.accent }}>
                {c.total > 0 ? `S${c.week}/${c.total}` : "PERPETUO"}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded uppercase tracking-[0.1em] font-mono"
                style={{ color: c.accent, border: `1px solid ${c.accent}44` }}
              >
                {c.desens}
              </span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
