import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard, PanelHeader, Meter, StatusDot } from "./telemetry-primitives";

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
  { name: "Ashwagandha KSM-66", week: 3, total: 8, desens: "Mínimo", accent: "#10B981", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { name: "Tolerancia a la Cafeína", week: 5, total: 6, desens: "Elevado", accent: "#EF4444", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" },
  { name: "Mantenimiento de Creatina", week: 12, total: 0, desens: "Estable", accent: "#0284C7", badgeClass: "bg-sky-50 text-sky-700 border-sky-200" },
];

export function CycleScheduler() {
  return (
    <GlassCard className="h-full flex flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/40">
      <PanelHeader
        index="02"
        title="Biodisponibilidad y Adaptación del Ciclo"
        accent="#0284C7"
        right={
          <span className="text-xs uppercase tracking-[0.15em] font-mono font-bold text-sky-700">
            Saturación Sistémica
          </span>
        }
      />

      <div className="flex-1 flex flex-col gap-4 overflow-auto p-1">
        {/* Featured cycle */}
        <div
          className="rounded-2xl p-4 border border-slate-200 bg-slate-50 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-slate-900 font-extrabold">
              Ashwagandha KSM-66 · Ciclo de 8 Semanas
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
              Semana 3 / 8
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <Meter value={(3 / 8) * 100} accent="#10B981" height={7} />
            <span className="text-xs shrink-0 font-mono font-bold text-slate-500">37.5%</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <StatusDot accent="#10B981" />
            <span className="text-xs uppercase tracking-[0.12em] text-slate-500 font-mono font-semibold">
              Nivel de Desensibilización del Receptor:
            </span>
            <span className="text-xs font-mono font-extrabold text-emerald-700">
              Mínimo
            </span>
          </div>
        </div>

        {/* Saturation chart */}
        <div
          className="rounded-2xl p-4 border border-slate-200 bg-slate-50 shadow-xs"
        >
          <div className="text-xs uppercase tracking-[0.15em] text-slate-600 mb-2 font-mono font-bold">
            Curva de Saturación Plasmática — Equivalente en mg/L
          </div>
          <div style={{ height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SAT_DATA} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="satfill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284C7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="wk" tick={{ fill: "#64748B", fontSize: 10, fontFamily: "monospace", fontWeight: 600 }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10, fontFamily: "monospace", fontWeight: 600 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontFamily: "monospace", fontSize: 12, color: "#0F172A", fontWeight: 700 }}
                  labelStyle={{ color: "#0284C7" }}
                  itemStyle={{ color: "#0F172A" }}
                />
                <Area type="monotone" dataKey="sat" stroke="#0284C7" strokeWidth={2.5} fill="url(#satfill)" dot={{ r: 3, fill: "#0284C7" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active cycles list */}
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.15em] text-slate-500 font-mono font-bold">Fases de Carga Activas</div>
          {CYCLES.map((c) => (
            <div
              key={`cycle-load-${c.name}`}
              className="rounded-2xl px-3.5 py-2.5 flex items-center gap-3 border border-slate-200 bg-slate-50 shadow-xs"
            >
              <StatusDot accent={c.accent} />
              <span className="text-xs text-slate-900 flex-1 truncate font-bold">{c.name}</span>
              <span className="text-xs font-mono font-extrabold" style={{ color: c.accent }}>
                {c.total > 0 ? `S${c.week}/${c.total}` : "PERPETUO"}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-lg uppercase tracking-[0.1em] font-mono font-bold border ${c.badgeClass}`}
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
