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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon2", "Tue2", "Wed2", "Thu2", "Fri2", "Sat2", "Sun2"];

export function WeightTrend() {
  const { profile, metrics } = useClinicalEngine();

  // Calculate EMA weights array locally for plotting the trend line
  const alpha = 0.095;
  const emaWeights: number[] = [];
  if (profile.weightLogs && profile.weightLogs.length > 0) {
    emaWeights.push(profile.weightLogs[0]);
    for (let i = 1; i < profile.weightLogs.length; i++) {
      const emaVal = alpha * profile.weightLogs[i] + (1 - alpha) * emaWeights[i - 1];
      emaWeights.push(parseFloat(emaVal.toFixed(3)));
    }
  }

  const initialWeight = profile.weightLogs && profile.weightLogs.length > 0 ? profile.weightLogs[0] : 85.4;
  const weightDiff = metrics.trendWeight - initialWeight;
  const isLoss = weightDiff <= 0;
  const diffText = `${isLoss ? "" : "+"}${weightDiff.toFixed(1)} kg`;

  // Map weightLogs to chartData
  const chartData = (profile.weightLogs || []).map((w: number, idx: number) => ({
    d: DAYS[idx % DAYS.length] || `Day ${idx + 1}`,
    w: w,
    ema: emaWeights[idx] !== undefined ? emaWeights[idx] : w,
  }));

  // State to track hover data dynamically
  const [hoveredData, setHoveredData] = useState<{ d: string; w: number; ema: number } | null>(null);

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

  const handleMouseLeave = () => {
    setHoveredData(null);
  };

  const displayWeight = hoveredData ? hoveredData.w : (profile.weightLogs && profile.weightLogs.length > 0 ? profile.weightLogs[profile.weightLogs.length - 1] : 82.4);
  const displayEma = hoveredData ? hoveredData.ema : metrics.trendWeight;
  const displayLabel = hoveredData ? `Logged: ${hoveredData.d}` : "Current Smoothed EMA";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#1E293B] bg-white/[0.03] p-6 backdrop-blur-xl">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 style={{ fontWeight: 600, fontSize: "0.95rem" }}>
            Weight Trend Analytics
          </h3>
          <span className="text-slate-500" style={{ fontSize: "0.72rem" }}>
            Smoothed EMA-20 · Real Trend
          </span>
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${
            isLoss
              ? "border-[#39FF14]/25 bg-[#39FF14]/[0.06] text-[#39FF14]"
              : "border-[#FF4D4D]/25 bg-[#FF4D4D]/[0.06] text-[#FF4D4D]"
          }`}
        >
          {isLoss ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />}
          <span style={{ fontSize: "0.72rem", fontWeight: 600 }}>{diffText}</span>
        </div>
      </div>

      {/* Hero Display Panel */}
      <div className="mb-4 flex items-center justify-between border-b border-[#1E293B]/60 pb-3">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-500">{displayLabel}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white tabular-nums">{displayEma.toFixed(2)} kg</span>
            <span className="text-xs text-slate-400 font-medium">
              (Raw: <span className="tabular-nums">{displayWeight.toFixed(1)}</span>)
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-slate-400 max-w-[120px]">
          Alpha factor <span className="text-[#00F0FF] font-mono">0.095</span> active
        </div>
      </div>

      <div className="relative flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 12, right: 12, left: -24, bottom: 0 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs key="chart-def">
              <linearGradient id="wGlow" x1="0" y1="0" x2="0" y2="1" key="gradient-wGlow">
                <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="emaGlow" x1="0" y1="0" x2="0" y2="1" key="gradient-emaGlow">
                <stop offset="0%" stopColor="#39FF14" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#39FF14" stopOpacity={0} />
              </linearGradient>
              <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%" key="filter-lineGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              key="chart-grid"
              stroke="#1e293b"
              strokeDasharray="3 3"
              vertical={false}
              opacity={0.3}
            />

            <XAxis
              key="chart-xaxis"
              dataKey="d"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 10 }}
              dy={6}
            />

            <YAxis
              key="chart-yaxis"
              domain={["dataMin - 0.5", "dataMax + 0.5"]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 10 }}
              width={34}
            />

            <Tooltip
              key="chart-tooltip"
              cursor={{ stroke: "#00F0FF", strokeDasharray: "4 4", strokeOpacity: 0.5 }}
              content={() => null} // Dynamic tooltips render inside standard header metric panel
            />

            {/* Scale Weight Area */}
            <Area
              key="chart-area-w"
              type="monotone"
              dataKey="w"
              stroke="#00F0FF"
              strokeWidth={1.5}
              fill="url(#wGlow)"
              dot={{ stroke: "#00F0FF", strokeWidth: 1, r: 2, fill: "#0b0f19" }}
              activeDot={{ stroke: "#00F0FF", strokeWidth: 2, r: 5, fill: "#00F0FF" }}
            />

            {/* EMA Trend Line */}
            <Area
              key="chart-area-ema"
              type="monotone"
              dataKey="ema"
              stroke="#39FF14"
              strokeWidth={2.5}
              fill="url(#emaGlow)"
              style={{ filter: "url(#lineGlow)" }}
              dot={false}
              activeDot={{ stroke: "#39FF14", strokeWidth: 2, r: 6, fill: "#39FF14" }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="absolute bottom-1 right-2 flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[#00F0FF]" />
            <span className="text-slate-400">Scale Log</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[#39FF14]" />
            <span className="text-slate-400">EMA-20 Trend</span>
          </div>
        </div>
      </div>
    </div>
  );
}
