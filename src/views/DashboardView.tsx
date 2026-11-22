import { useState, useEffect } from "react";
import { useClinicalEngine } from "../context/clinical-engine-context";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { 
  Flame, Dumbbell, Dna, Timer, Scale, Cpu, User, ChevronDown, ChevronUp, Sparkles, HeartPulse
} from "lucide-react";
import { MacroRings } from "../app/components/widgets/macro-rings";
import { GlossaryTooltip } from "../app/components/widgets/ClinicalGlossary";
import { SupplementChronoWidget } from "../components/supplements/SupplementChronoWidget";

export function DashboardView({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { 
    profile, 
    metrics, 
    updateProfileVariable, 
    supplementChecklist, 
    toggleSupplementChecked,
    activeWorkout,
    // ATO V7
    atoDirective,
    isATOPending,
    isATOStale,
    cooldownSeconds,
    triggerATODiagnosis,
  } = useClinicalEngine();

  const [showTelemetry, setShowTelemetry] = useState(false);

  const weightValues = profile.weightLogs;
  
  // Recharts weight logs chart data
  const chartData = weightValues.map((w: number, i: number) => ({
    day: `D${i + 1}`,
    weight: w
  }));

  const activeWeek = profile.mesocycleWeek;
  const overrideActive = metrics.training.isSNCOverrideActive;

  const isCooldownActive = cooldownSeconds > 0;
  const hasPatch = !!atoDirective;

  const statusConfig = isATOPending
    ? { dot: "#F59E0B", label: "Analizando...", pulse: true }
    : isATOStale
    ? { dot: "#F59E0B", label: "Modificado", pulse: false }
    : hasPatch
    ? { dot: "#10B981", label: "Sincronizado", pulse: false }
    : { dot: "#64748B", label: "En espera", pulse: false };

  return (
    <div className="relative flex-1 w-full max-w-full flex flex-col gap-4 sm:gap-6 p-4 sm:p-8 bg-slate-50 text-slate-900 font-sans">
      
      {/* Header Greeting */}
      <header className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-white p-5 sm:px-6 sm:py-5 border border-slate-100 shadow-xl shadow-slate-200/50 shrink-0 w-full min-w-0">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 p-0.5 shadow-lg shadow-rose-500/25 spring-bounce">
            <div className="size-full bg-white rounded-[14px] flex items-center justify-center">
              <User className="size-6 text-rose-500" />
            </div>
          </div>
          <div>
            <h1 className="text-slate-900 text-lg sm:text-xl font-extrabold tracking-tight">
              ¡Hola, {profile.username || "Marcos"}! 👋
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
              Tu cuerpo está en estado óptimo hoy. Recuperación del SNC: <span className="font-bold text-emerald-600">{profile.cnsReadiness}%</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 rounded-2xl text-xs font-semibold">
            <span className="text-slate-500">SNC:</span>
            <input 
              type="range"
              min="40"
              max="100"
              value={profile.cnsReadiness}
              onChange={(e) => updateProfileVariable("cnsReadiness", parseInt(e.target.value))}
              className="w-16 accent-rose-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-bold text-slate-800">{profile.cnsReadiness}%</span>
          </div>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 px-4 py-2 text-xs text-slate-700 hover:bg-slate-200 transition-all font-bold spring-bounce shrink-0 cursor-pointer"
          >
            Ajustes
          </button>
        </div>
      </header>

      {/* ── AI Coach Card (Friendly ATO Copilot) ─────────────────────────────── */}
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-600 p-5 sm:px-6 sm:py-5 text-white shadow-xl shadow-rose-500/20 w-full min-w-0 spring-bounce">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white font-bold text-lg">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base tracking-wide">Entrenador IA · Gemini 3.8 Flash</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md font-semibold">
                {statusConfig.label}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/90 font-medium mt-0.5 leading-relaxed">
              {atoDirective?.clinicalSummary || "Tu plan nutricional y volumetría están sincronizados con tu tasa metabólica actual."}
            </p>
          </div>
        </div>

        <button
          onClick={() => triggerATODiagnosis(true)}
          disabled={isCooldownActive || isATOPending}
          className="bg-white text-slate-900 hover:bg-slate-100 font-extrabold rounded-2xl px-5 py-2.5 text-xs tracking-wide shadow-md transition-all shrink-0 spring-bounce w-full sm:w-auto text-center cursor-pointer disabled:opacity-60"
        >
          {isCooldownActive ? `Enfriamiento (${cooldownSeconds}s)` : isATOPending ? "Analizando..." : isATOStale ? "Recalibrar IA" : "Optimizar Con IA"}
        </button>
      </div>

      {/* Main Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 flex-1 w-full min-w-0">
        
        {/* Activity Rings Widget */}
        <div className="xl:col-span-2 xl:row-span-2">
          <MacroRings />
        </div>

        {/* Training Summary Card */}
        <div className="xl:col-span-2 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Dumbbell size={18} className="text-indigo-500" /> Plan de Entrenamiento
            </h3>
            <span className="font-mono text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-bold uppercase tracking-wider">
              {profile.routineType}
            </span>
          </div>

          <div className="my-4 space-y-3">
            <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
              <span className="text-slate-500 font-medium shrink-0">Fase Actual:</span>
              <span className="font-bold text-slate-900 uppercase text-right">{metrics.training.phaseName} (Semana {activeWeek}/5)</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
              <span className="text-slate-500 font-medium shrink-0">Series Prescritas:</span>
              <span className="font-bold text-indigo-600 font-mono text-right">
                {String(metrics.training.sets).toLowerCase().includes("series")
                  ? metrics.training.sets
                  : `${metrics.training.sets} series`}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
              <span className="text-slate-500 font-medium shrink-0">Objetivo RIR:</span>
              <span className="font-bold text-emerald-600 font-mono text-right">{metrics.training.intensity}</span>
            </div>
          </div>

          {activeWorkout && (
            <div className="mb-3 p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs font-semibold">
              <span className="text-indigo-700 font-bold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" /> Rutina Activa: {activeWorkout.name}
              </span>
              <span className="text-indigo-600">
                {activeWorkout.exercises.reduce((acc: number, ex: any) => acc + ex.completedSets.filter(Boolean).length, 0)} series
              </span>
            </div>
          )}

          <div className={`p-3.5 rounded-2xl text-xs font-medium ${
            overrideActive 
              ? "bg-rose-50 border border-rose-200 text-rose-700" 
              : "bg-emerald-50 border border-emerald-100 text-emerald-800"
          }`}>
            <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs mb-1">
              <Cpu size={14} className={overrideActive ? "animate-pulse text-rose-500" : "text-emerald-500"} />
              {overrideActive ? "Límite de Volumen Activo" : "Señalización Anabólica Óptima"}
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {overrideActive 
                ? "Volumen limitado a un máximo de 3 series por ejercicio para proteger la recuperación muscular."
                : "Sistema neuromuscular sin restricciones. Entrenamiento permitido hasta tu máximo potencial."
              }
            </p>
          </div>
        </div>

        {/* Energy & Recovery Card */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Dna size={18} className="text-rose-500" /> Nivel de Energía (EA)
            </h3>
            <span className={`h-2.5 w-2.5 rounded-full ${metrics.isREDSTriggered ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`} />
          </div>

          <div className="my-3 flex flex-col items-center">
            {/* SVG Activity Ring */}
            <div className="relative size-28 flex items-center justify-center my-1">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#F1F5F9" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={metrics.isREDSTriggered ? "#FF5E7E" : "#10B981"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 * (1 - Math.min(60, metrics.energyAvailability) / 60)}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-black font-mono ${metrics.isREDSTriggered ? "text-rose-500" : "text-emerald-600"}`}>
                  {metrics.energyAvailability}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">kcal/kg</span>
              </div>
            </div>

            <div className="w-full flex items-center justify-between text-xs border-t border-slate-100 pt-3 mt-2 font-medium">
              <span className="text-slate-500">Umbral RED-S:</span>
              <span className="font-bold text-rose-500">30 kcal/kg</span>
            </div>
          </div>

          <div className={`p-2.5 rounded-2xl text-[11px] text-center font-bold uppercase tracking-wider ${
            metrics.isREDSTriggered ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700"
          }`}>
            {metrics.isREDSTriggered ? "⚠ Déficit Energético Alto" : "✓ Estado Energético Óptimo"}
          </div>
        </div>

        {/* Supplement Ticker Widget */}
        <SupplementChronoWidget />

      </div>

      {/* ── Collapsible Clinical Telemetry Section ────────────────────────────── */}
      <div className="w-full rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xl shadow-slate-200/50 mt-2 transition-all">
        <button
          onClick={() => setShowTelemetry(!showTelemetry)}
          className="w-full flex items-center justify-between cursor-pointer font-bold text-sm sm:text-base text-slate-900 group"
        >
          <div className="flex items-center gap-2">
            <HeartPulse className="size-5 text-rose-500 group-hover:scale-110 transition-transform" />
            <span>📊 Mi Telemetría y Laboratorio Avanzado</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>{showTelemetry ? "Ocultar detalles" : "Ver gráficos de peso y laboratorio"}</span>
            {showTelemetry ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </div>
        </button>

        {showTelemetry && (
          <div className="mt-6 border-t border-slate-100 pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weight Chart */}
            <div className="flex flex-col justify-between">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2 mb-3">
                <Scale size={15} className="text-cyan-500" /> Tendencia de Peso (EMA)
              </h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weightgrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                    <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                    <Tooltip
                      contentStyle={{ background: "#FFFFFF", border: `1px solid #E2E8F0`, borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: "#06B6D4", fontWeight: "bold" }}
                    />
                    <Area type="monotone" dataKey="weight" stroke="#06B6D4" strokeWidth={3} fill="url(#weightgrad)" dot={{ r: 4, fill: "#06B6D4" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3 text-xs text-slate-500 font-semibold">
                <span>Peso Tendencia: <span className="text-cyan-600 font-bold">{metrics.trendWeight} kg</span></span>
                <span>TMB Cunningham: <span className="text-emerald-600 font-bold">{metrics.bmr} kcal</span></span>
              </div>
            </div>

            {/* Telemetry metadata */}
            <div className="flex flex-col gap-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">Resumen de Parámetros Fisiológicos</h4>
              <p className="leading-relaxed">
                Todos los datos de laboratorio e interacciones suplementarias son procesados continuamente por la arquitectura de clinical engine context.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">TASA TMB</span>
                  <span className="font-bold text-slate-800 text-sm">{metrics.bmr} kcal</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">ENERGÍA EA</span>
                  <span className="font-bold text-slate-800 text-sm">{metrics.energyAvailability} kcal/kg</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default DashboardView;
