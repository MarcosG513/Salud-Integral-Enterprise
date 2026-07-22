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
  { wk: "W1", sat: 18 },
  { wk: "W2", sat: 41 },
  { wk: "W3", sat: 63 },
  { wk: "W4", sat: 74 },
  { wk: "W5", sat: 82 },
  { wk: "W6", sat: 87 },
  { wk: "W7", sat: 90 },
  { wk: "W8", sat: 92 },
];

const CYCLES = [
  { name: "Ashwagandha KSM-66", week: 3, total: 8, desens: "Minimal", accent: COLORS.lime },
  { name: "Caffeine Tolerance", week: 5, total: 6, desens: "Elevated", accent: COLORS.coral },
  { name: "Creatine Maintenance", week: 12, total: 0, desens: "Stable", accent: COLORS.cyan },
];

export function CycleScheduler() {
  return (
    <GlassCard className="h-full flex flex-col" glow={`${COLORS.cyan}22`}>
      <PanelHeader
        index="02"
        title="Bioavailability & Cycle Adaptation"
        accent={COLORS.cyan}
        right={
          <span className="text-[9px] uppercase tracking-[0.15em]" style={{ ...mono, color: COLORS.cyan }}>
            Systemic Saturation
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
            <span className="text-[12px] text-slate-100" style={{ fontWeight: 600 }}>
              Ashwagandha KSM-66 · 8-Week Cycle
            </span>
            <span className="text-[13px]" style={{ ...mono, color: COLORS.lime, fontWeight: 700 }}>
              Week 3 / 8
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Meter value={(3 / 8) * 100} accent={COLORS.lime} />
            <span className="text-[10px] shrink-0" style={{ ...mono, color: "#64748B" }}>37.5%</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <StatusDot accent={COLORS.lime} />
            <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
              Receptor Desensitization Level:
            </span>
            <span className="text-[11px]" style={{ ...mono, color: COLORS.lime, fontWeight: 600 }}>
              Minimal
            </span>
          </div>
        </div>

        {/* Saturation chart */}
        <div
          className="rounded-md p-3"
          style={{ border: `1px solid ${COLORS.border}`, background: "rgba(7,10,19,0.5)" }}
        >
          <div className="text-[9px] uppercase tracking-[0.15em] text-slate-500 mb-1 px-1">
            Plasma Saturation Curve — mg/L Equivalent
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
          <div className="text-[9px] uppercase tracking-[0.15em] text-slate-500 px-1">Active Loading Phases</div>
          {CYCLES.map((c) => (
            <div
              key={c.name}
              className="rounded-md px-3 py-2.5 flex items-center gap-3"
              style={{ border: `1px solid ${COLORS.border}`, background: "rgba(7,10,19,0.4)" }}
            >
              <StatusDot accent={c.accent} />
              <span className="text-[11px] text-slate-200 flex-1 truncate" style={{ fontWeight: 500 }}>{c.name}</span>
              <span className="text-[10px]" style={{ ...mono, color: c.accent }}>
                {c.total > 0 ? `W${c.week}/${c.total}` : "PERPETUAL"}
              </span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-[0.1em]"
                style={{ ...mono, color: c.accent, border: `1px solid ${c.accent}44` }}
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
