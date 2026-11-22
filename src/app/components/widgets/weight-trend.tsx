import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function WeightTrend() {
  const { profile, metrics } = useClinicalEngine();

  const alpha = 0.095;
  const rawLogs: number[] =
    Array.isArray(profile.weightLogs) && profile.weightLogs.length > 0
      ? profile.weightLogs
      : [profile.peso || 70];

  const emaWeights: number[] = [];
  if (rawLogs.length > 0) {
    emaWeights.push(rawLogs[0]);
    for (let i = 1; i < rawLogs.length; i++) {
      const emaVal = alpha * rawLogs[i] + (1 - alpha) * emaWeights[i - 1];
      emaWeights.push(parseFloat(emaVal.toFixed(2)));
    }
  }

  const initialWeight = rawLogs[0];
  const weightDiff = metrics.trendWeight - initialWeight;
  const isLoss = weightDiff <= 0;
  const diffText = `${isLoss ? "" : "+"}${weightDiff.toFixed(1)} kg`;

  const chartData = rawLogs.map((w: number, idx: number) => ({
    id: `wt-pt-${idx}`,
    d: `${DAYS[idx % DAYS.length]} ${idx + 1}`,
    w,
    ema: emaWeights[idx] !== undefined ? emaWeights[idx] : w,
  }));

  const [hoveredData, setHoveredData] = useState<{
    d: string;
    w: number;
    ema: number;
  } | null>(null);

  const handleMouseMove = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const payload = state.activePayload[0].payload;
      setHoveredData({
        d: payload.d,
        w: payload.w,
        ema: payload.ema,
      });
    } else {
      setHoveredData(null);
    }
  };

  const displayWeight = hoveredData
    ? hoveredData.w
    : rawLogs[rawLogs.length - 1];
  const displayEma = hoveredData ? hoveredData.ema : metrics.trendWeight;
  const displayLabel = hoveredData
    ? `Registro: ${hoveredData.d}`
    : "Tendencia Suavizada EMA-20";

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm text-slate-900">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900">
            Tendencia de Peso (EMA-20)
          </h3>
          <span className="text-xs text-slate-600 font-medium">
            Filtro pasa-bajas exponencial · α = 0.095
          </span>
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
            isLoss
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-sky-200 bg-sky-50 text-sky-700"
          }`}
        >
          {isLoss ? (
            <TrendingDown className="size-3.5" />
          ) : (
            <TrendingUp className="size-3.5" />
          )}
          <span>{diffText}</span>
        </div>
      </div>

      {/* Hero Display Panel */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
            {displayLabel}
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-slate-900 tabular-nums font-mono">
              {displayEma.toFixed(2)} kg
            </span>
            <span className="text-xs text-slate-600 font-medium">
              (Báscula:{" "}
              <span className="tabular-nums font-bold text-slate-800">
                {displayWeight.toFixed(1)} kg
              </span>
              )
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-slate-600">
          <span className="font-semibold block">{metrics.algorithmStatusBadge}</span>
          <span className="text-[11px] text-cyan-700 font-mono font-bold">
            {metrics.calibrationProgressPct}% confianza
          </span>
        </div>
      </div>

      <div className="relative flex-1 min-h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -24, bottom: 0 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredData(null)}
          >
            <defs key="wt-chart-defs">
              <linearGradient
                id="wGlowLight"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
                key="wt-grad-raw"
              >
                <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
              <linearGradient
                id="emaGlowLight"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
                key="wt-grad-ema"
              >
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              key="wt-chart-grid"
              stroke="#E2E8F0"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              key="wt-chart-xaxis"
              dataKey="d"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748B", fontSize: 10 }}
              dy={6}
            />

            <YAxis
              key="wt-chart-yaxis"
              domain={["dataMin - 0.5", "dataMax + 0.5"]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748B", fontSize: 10 }}
              width={36}
            />

            <Tooltip
              key="wt-chart-tooltip"
              cursor={{ stroke: "#0284C7", strokeDasharray: "4 4", strokeOpacity: 0.5 }}
              content={() => null}
            />

            <Area
              key="wt-area-raw"
              type="monotone"
              dataKey="w"
              stroke="#06B6D4"
              strokeWidth={1.75}
              fill="url(#wGlowLight)"
              dot={{ stroke: "#06B6D4", strokeWidth: 1.5, r: 2.5, fill: "#FFFFFF" }}
              activeDot={{ stroke: "#0284C7", strokeWidth: 2, r: 5, fill: "#06B6D4" }}
            />

            <Area
              key="wt-area-ema"
              type="monotone"
              dataKey="ema"
              stroke="#10B981"
              strokeWidth={2.5}
              fill="url(#emaGlowLight)"
              dot={false}
              activeDot={{ stroke: "#10B981", strokeWidth: 2, r: 6, fill: "#10B981" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Legend */}
      <div className="mt-3 flex items-center justify-center gap-6 border-t border-slate-100 pt-3 text-xs text-slate-600 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-cyan-500" />
          <span>Peso Báscula</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>Tendencia EMA-20</span>
        </div>
      </div>
    </div>
  );
}

export default WeightTrend;
