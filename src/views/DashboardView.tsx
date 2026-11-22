import { useState, useMemo, lazy, Suspense } from "react";
import {
  Dumbbell,
  User,
  ChevronDown,
  ChevronUp,
  Scale,
  HeartPulse,
  ShieldCheck,
  Droplets,
  Moon,
  Footprints,
  Pill,
  Sparkles,
  CalendarCheck,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import { useClinicalEngine } from "../context/clinical-engine-context";
import { generateTrainingPlan } from "../engine/trainingEngine";
import { evaluateSupplementPlan } from "../engine/supplementEngine";
import { MacroRings } from "../app/components/widgets/macro-rings";
import { SIE_STORAGE_KEYS, safeGetItem, safeSetItem } from "../lib/storage-engine";

// Lazy-loaded onboarding & charts (keeps recharts / modal code out of initial paint)
const OnboardingFlow = lazy(() => import("../components/onboarding/OnboardingFlow"));
const WeightTrend = lazy(() =>
  import("../app/components/widgets/weight-trend").then((m) => ({
    default: m.WeightTrend,
  }))
);
const EnergyAvailabilityPanel = lazy(
  () => import("../components/hormonal/EnergyAvailabilityPanel")
);

interface WeeklyCheckInState {
  dayIndex: number; // 0 = Domingo .. 6 = Sábado
  lastCheckInIso: string | null;
}

const WEEKDAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function daysSinceIso(iso: string | null): number | null {
  if (!iso) return null;
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return null;
  return Math.floor((Date.now() - parsed) / (1000 * 60 * 60 * 24));
}

export function DashboardView({
  onOpenSettings,
  onNavigateTab,
}: {
  onOpenSettings: () => void;
  onNavigateTab?: (tab: string) => void;
}) {
  const {
    profile,
    metrics,
    workoutHistory,
    hormonalLabValues,
    supplementChecklist,
    customSupplementDose,
    activeWorkout,
    atoDirective,
    isATOPending,
    isATOStale,
    cooldownSeconds,
    triggerATODiagnosis,
  } = useClinicalEngine();

  const [openWeightAccordion, setOpenWeightAccordion] = useState(false);
  const [openEndocrineAccordion, setOpenEndocrineAccordion] = useState(false);
  const [weeklyCheckIn, setWeeklyCheckIn] = useState<WeeklyCheckInState>(() =>
    safeGetItem<WeeklyCheckInState>(SIE_STORAGE_KEYS.WEEKLY_CHECKIN, {
      dayIndex: 0,
      lastCheckInIso: null,
    })
  );

  const persistWeeklyCheckIn = (next: WeeklyCheckInState) => {
    setWeeklyCheckIn(next);
    safeSetItem(SIE_STORAGE_KEYS.WEEKLY_CHECKIN, next);
  };

  const daysSinceLastCheckIn = daysSinceIso(weeklyCheckIn.lastCheckInIso);
  const isCheckInCurrent = daysSinceLastCheckIn !== null && daysSinceLastCheckIn < 7;

  const trainingPlan = useMemo(
    () =>
      generateTrainingPlan({
        entornoEntreno: profile.entornoEntreno || "gym",
        diasEntrenoSemana: profile.diasEntrenoSemana || 4,
        objetivo: profile.objetivo || "fat_loss",
        modality: profile.trainingModality || "hypertrophy",
        experienceLevel: profile.experienceLevel || "intermediate",
        mesocycleWeek: profile.mesocycleWeek || 1,
        endocrineVolumeReductionPct:
          metrics.endocrineShield?.recommendedVolumeReductionPct ?? 0,
        sleepProtection: metrics.sleepProtection,
        workoutHistory: workoutHistory || [],
        concurrentCardio: profile.concurrentCardio || {
          enabled: false,
          intensity: "low",
          hoursGap: 3,
        },
        loadOverrides: profile.exerciseLoadOverrides || {},
      }),
    [
      profile.entornoEntreno,
      profile.diasEntrenoSemana,
      profile.objetivo,
      profile.trainingModality,
      profile.experienceLevel,
      profile.mesocycleWeek,
      profile.concurrentCardio,
      profile.exerciseLoadOverrides,
      metrics.endocrineShield?.recommendedVolumeReductionPct,
      metrics.sleepProtection,
      workoutHistory,
    ]
  );

  const supplementPlan = useMemo(
    () =>
      evaluateSupplementPlan({
        sexoBiologico: profile.sexoBiologico || "male",
        peso: metrics.trendWeight || profile.peso,
        horarioEntreno: profile.horarioEntreno || "afternoon",
        bedtimeHour: profile.bedtimeHour ?? 23,
        sleepProtection: metrics.sleepProtection,
        hormonalLabValues,
        supplementChecklist: supplementChecklist || {},
        customSupplementDose: customSupplementDose || {},
        creatineActivatedAt: profile.creatineActivatedAt ?? null,
        ashwagandhaSafetyCleared: Boolean(profile.ashwagandhaSafetyCleared),
        optInVascularVitality: Boolean(profile.optInVascularVitality),
        citrullineGrams: profile.citrullineGrams ?? 8.0,
        citrullineTimingMin: profile.citrullineTimingMin ?? 35,
        doreySessionsPerWeek: profile.doreySessionsPerWeek ?? 3,
      }),
    [
      profile.sexoBiologico,
      metrics.trendWeight,
      profile.peso,
      profile.horarioEntreno,
      profile.bedtimeHour,
      metrics.sleepProtection,
      hormonalLabValues,
      supplementChecklist,
      customSupplementDose,
      profile.creatineActivatedAt,
      profile.ashwagandhaSafetyCleared,
      profile.optInVascularVitality,
      profile.citrullineGrams,
      profile.citrullineTimingMin,
      profile.doreySessionsPerWeek,
    ]
  );

  const todaySession = trainingPlan.sessions[0];
  const coreTakenCount = supplementPlan.coreSupplements.filter((s) => s.isTaken).length;
  const coreTotalCount = supplementPlan.coreSupplements.length;
  const isSleepProtected = Boolean(metrics.sleepProtection?.isSleepProtectionActive);

  const isCooldownActive = cooldownSeconds > 0;
  const atoStatusLabel = isATOPending
    ? "Analizando..."
    : isATOStale
    ? "Modificado"
    : atoDirective
    ? "Sincronizado"
    : "En espera";

  return (
    <div className="relative flex-1 w-full max-w-full flex flex-col gap-4 sm:gap-6 p-2 sm:p-4 lg:p-6 bg-slate-50 text-slate-900 font-sans pb-20 sm:pb-8">
      {/* Header Greeting */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-white p-5 sm:px-6 sm:py-5 border border-slate-200/80 shadow-sm w-full min-w-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="size-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <User className="size-6 text-emerald-700" />
          </div>
          <div className="min-w-0">
            <h1 className="text-slate-900 text-lg sm:text-xl font-extrabold tracking-tight truncate">
              ¡Hola, {profile.username || "Atleta"}!
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-medium mt-0.5">
              Sueño:{" "}
              <span className="font-bold text-slate-900">
                {profile.horasSuenoPromedio ?? 7.4} h
              </span>{" "}
              ·{" "}
              <span
                className={
                  isSleepProtected
                    ? "font-bold text-amber-700"
                    : "font-bold text-emerald-700"
                }
              >
                {isSleepProtected
                  ? "Protección por Descanso Activa"
                  : "Recuperación Nominal"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 rounded-xl text-xs font-semibold">
            <span className="text-slate-600">Motor:</span>
            <span className="font-bold text-indigo-700">
              {metrics.algorithmStatusBadge || "Calibrando algoritmo"} (
              {metrics.calibrationProgressPct ?? 0}%)
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs text-slate-800 hover:bg-slate-100 transition-colors font-bold shrink-0 cursor-pointer"
          >
            <SlidersHorizontal size={15} className="text-slate-600" />
            <span>Ajustes</span>
          </button>
        </div>
      </header>

      {/* Lazy Onboarding Flow (Single non-repeating modal + persistent checklist + 4-step tour) */}
      <Suspense fallback={null}>
        <OnboardingFlow onOpenSettings={onOpenSettings} />
      </Suspense>

      {/* Exactly 3 Main Interpretive Cards */}
      <section
        aria-label="Resumen clínico diario"
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0 items-stretch"
      >
        {/* CARD 1: Homeostasis y Macros de Hoy + Check-in Semanal Sin Culpa */}
        <article className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-slate-900">
              1. Homeostasis y Macros de Hoy
            </h2>
            <span className="text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 rounded-full px-2.5 py-0.5">
              {metrics.algorithmStatus === "updating"
                ? "Actualizando TDEE"
                : "Calibrando algoritmo"}
            </span>
          </div>

          <div className="flex-1">
            <MacroRings />
          </div>

          {/* Configurable Guilt-Free Weekly Check-In */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                <CalendarCheck size={15} className="text-emerald-600 shrink-0" />
                <span>Check-in semanal flexible</span>
              </div>
              <select
                aria-label="Día preferido para check-in semanal"
                value={String(weeklyCheckIn.dayIndex)}
                onChange={(e) =>
                  persistWeeklyCheckIn({
                    ...weeklyCheckIn,
                    dayIndex: Number(e.target.value),
                  })
                }
                className="min-h-[36px] rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-700"
              >
                {WEEKDAY_NAMES.map((day, idx) => (
                  <option key={day} value={String(idx)}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isCheckInCurrent
                ? "Revisión semanal al día. Las variaciones de agua o glucógeno son normales: avanza sin compensaciones extremas."
                : `Tu revisión sugerida es el ${WEEKDAY_NAMES[weeklyCheckIn.dayIndex]}. Recuerda: no hay alimentos prohibidos ni castigos por vivir tu semana.`}
            </p>

            <button
              type="button"
              onClick={() =>
                persistWeeklyCheckIn({
                  ...weeklyCheckIn,
                  lastCheckInIso: new Date().toISOString(),
                })
              }
              className={`w-full min-h-[44px] rounded-xl px-3.5 py-2 text-xs font-extrabold transition-colors cursor-pointer ${
                isCheckInCurrent
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isCheckInCurrent
                ? "✓ Check-in semanal completado"
                : "Registrar Check-in Semanal"}
            </button>
          </div>
        </article>

        {/* CARD 2: Entrenamiento de Hoy (ACSM 2026 Live Plan) */}
        <article className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Dumbbell size={17} className="text-indigo-600 shrink-0" />
                  <span>2. Entrenamiento de Hoy</span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {trainingPlan.splitTitle}
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[11px] font-bold text-indigo-800 shrink-0">
                {trainingPlan.environmentLabel}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-600 font-medium">Sesión sugerida:</span>
                <span className="font-extrabold text-slate-900 text-right">
                  {todaySession ? todaySession.focusLabel : "Recuperación activa"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-600 font-medium">Modalidad ACSM:</span>
                <span className="font-bold text-indigo-700 text-right">
                  {trainingPlan.prescription.modalityLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-600 font-medium">Rango e intensidad:</span>
                <span className="font-mono font-bold text-slate-900 text-right">
                  {trainingPlan.prescription.repRangeLabel} reps ·{" "}
                  {trainingPlan.prescription.compoundRirLabel}
                </span>
              </div>
              {todaySession && (
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600 font-medium">Bloque planificado:</span>
                  <span className="font-mono font-bold text-emerald-700 text-right">
                    {todaySession.exercises.length} ejercicios · Semana{" "}
                    {profile.mesocycleWeek}/5
                  </span>
                </div>
              )}
            </div>

            {activeWorkout && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-indigo-900">
                <span>Rutina en curso: {activeWorkout.name}</span>
                <span className="font-mono">
                  {activeWorkout.exercises.reduce(
                    (acc: number, ex: any) =>
                      acc + ex.completedSets.filter(Boolean).length,
                    0
                  )}{" "}
                  series
                </span>
              </div>
            )}

            <div
              className={`rounded-2xl border p-3.5 text-xs space-y-1 ${
                trainingPlan.reactiveDeload.isReactiveDeloadActive ||
                trainingPlan.appliedVolumeReductionPct > 0
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-emerald-200 bg-emerald-50/70 text-emerald-900"
              }`}
            >
              <p className="font-extrabold">
                {trainingPlan.reactiveDeload.isReactiveDeloadActive
                  ? "Deload Reactivo (Volumen de Mantenimiento)"
                  : trainingPlan.appliedVolumeReductionPct > 0
                  ? `Escudo de Volumen Activo (-${trainingPlan.appliedVolumeReductionPct}%)`
                  : "Capacidad de Carga Nominal"}
              </p>
              <p className="leading-relaxed opacity-95">
                {trainingPlan.autoRegulationSummary}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab?.("training")}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-extrabold transition-colors cursor-pointer"
          >
            <span>{activeWorkout ? "Continuar Entrenamiento" : "Abrir Entrenamiento"}</span>
            <ArrowUpRight size={15} />
          </button>
        </article>

        {/* CARD 3: Recuperación y Hábitos */}
        <article className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
          <div className="space-y-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={17} className="text-emerald-600 shrink-0" />
                  <span>3. Recuperación y Hábitos</span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Sueño, pasos NEAT, hidratación y dispensario
                </p>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold shrink-0 ${
                  metrics.isREDSTriggered
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}
              >
                EA {metrics.energyAvailability} kcal/kg
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                  <Moon size={13} className="text-indigo-600" />
                  <span>Sueño</span>
                </div>
                <p className="font-mono text-base font-extrabold text-slate-900 mt-1">
                  {profile.horasSuenoPromedio ?? 7.4} h
                </p>
                <p className="text-[11px] text-slate-600">
                  {isSleepProtected ? "Recortes pausados" : "Descanso adecuado"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                  <Footprints size={13} className="text-sky-600" />
                  <span>Pasos hoy</span>
                </div>
                <p className="font-mono text-base font-extrabold text-slate-900 mt-1">
                  {(profile.dailySteps ?? 8500).toLocaleString("es-ES")}
                </p>
                <p className="text-[11px] text-slate-600">
                  {metrics.stepModifierKcal >= 0 ? "+" : ""}
                  {metrics.stepModifierKcal} kcal NEAT
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                  <Droplets size={13} className="text-cyan-600" />
                  <span>Hidratación</span>
                </div>
                <p className="font-mono text-base font-extrabold text-slate-900 mt-1">
                  {metrics.hydrationLiters} L/día
                </p>
                <p className="text-[11px] text-slate-600">Base fisiológica</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                  <Pill size={13} className="text-emerald-600" />
                  <span>Suplementos</span>
                </div>
                <p className="font-mono text-base font-extrabold text-slate-900 mt-1">
                  {coreTakenCount}/{coreTotalCount} hoy
                </p>
                <p className="text-[11px] text-slate-600">
                  {supplementPlan.caffeineChrono.isBlocked
                    ? `Cafeína bloqueada (>${supplementPlan.caffeineChrono.cutoffHour}h)`
                    : `Corte cafeína ${supplementPlan.caffeineChrono.cutoffHour}:00`}
                </p>
              </div>
            </div>

            {metrics.hydrationDampingActive && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs text-sky-900">
                <span className="font-extrabold block">
                  Amortiguador de retención hídrica activo
                </span>
                <span className="text-sky-800">
                  {metrics.hydrationDampingReasons.join(" · ") ||
                    "Ajuste por creatina/glucógeno evitando falsas alzas en tu TDEE."}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab?.("supplements")}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 px-4 py-2.5 text-xs font-extrabold transition-colors cursor-pointer"
          >
            <span>Gestionar Suplementos</span>
            <ArrowUpRight size={15} />
          </button>
        </article>
      </section>

      {/* Progressive Disclosure Accordion 1: Peso EMA-20 y Telemetría */}
      <section className="w-full rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm">
        <button
          type="button"
          aria-expanded={openWeightAccordion}
          onClick={() => setOpenWeightAccordion((prev) => !prev)}
          className="w-full min-h-[48px] flex items-center justify-between gap-3 cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Scale className="size-5 text-sky-600 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Tendencia de Peso EMA-20 y Telemetría Metabólica
              </h2>
              <p className="text-xs text-slate-600">
                Tendencia {metrics.trendWeight} kg · TMB {metrics.bmr} kcal · TDEE{" "}
                {metrics.tdee} kcal
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 shrink-0">
            <span className="hidden sm:inline">
              {openWeightAccordion ? "Ocultar gráficos" : "Ver análisis"}
            </span>
            {openWeightAccordion ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </button>

        {openWeightAccordion && (
          <div className="mt-5 border-t border-slate-100 pt-5 space-y-4">
            <Suspense
              fallback={
                <div className="h-56 w-full animate-pulse rounded-2xl bg-slate-100" />
              }
            >
              <WeightTrend />
            </Suspense>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">
                  Tasa Metabólica Basal
                </span>
                <span className="font-mono font-extrabold text-slate-900 text-base">
                  {metrics.bmr} kcal
                </span>
                <span className="text-slate-600 block mt-0.5">{metrics.bmrMethod}</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">
                  Gasto Diario Total (TDEE)
                </span>
                <span className="font-mono font-extrabold text-slate-900 text-base">
                  {metrics.tdee} kcal
                </span>
                <span className="text-slate-600 block mt-0.5">
                  Base {metrics.baselineTdee} kcal · Pasos{" "}
                  {metrics.stepModifierKcal >= 0 ? "+" : ""}
                  {metrics.stepModifierKcal} kcal
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">
                  Masa Libre de Grasa (FFM)
                </span>
                <span className="font-mono font-extrabold text-slate-900 text-base">
                  {metrics.ffm} kg
                </span>
                <span className="text-slate-600 block mt-0.5">
                  {metrics.isBodyFatEstimated
                    ? "Estimación Mifflin-St Jeor (sin % grasa)"
                    : `Calculada con ${profile.bodyFat}% grasa corporal`}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Progressive Disclosure Accordion 2: Eje HPG, Disponibilidad Energética y Asesor IA ATO */}
      <section className="w-full rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm">
        <button
          type="button"
          aria-expanded={openEndocrineAccordion}
          onClick={() => setOpenEndocrineAccordion((prev) => !prev)}
          className="w-full min-h-[48px] flex items-center justify-between gap-3 cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <HeartPulse className="size-5 text-rose-600 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Eje HPG, Disponibilidad Energética y Asesor IA ATO
              </h2>
              <p className="text-xs text-slate-600">
                Diagnóstico IOC 2023 solo lectura y recomendaciones Gemini 3.8 Flash
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 shrink-0">
            <span className="hidden sm:inline">
              {openEndocrineAccordion ? "Ocultar detalles" : "Desplegar diagnóstico"}
            </span>
            {openEndocrineAccordion ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </button>

        {openEndocrineAccordion && (
          <div className="mt-5 border-t border-slate-100 pt-5 space-y-5">
            {/* ATO AI Copilot Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-900">
                      Entrenador IA · Gemini 3.8 Flash
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white border border-indigo-200 font-bold text-indigo-800">
                      {atoStatusLabel}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                    {atoDirective?.clinicalSummary ||
                      "Tu plan nutricional y volumetría están sincronizados con tu tasa metabólica actual."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => triggerATODiagnosis(true)}
                disabled={isCooldownActive || isATOPending}
                className="min-h-[44px] w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-60 shrink-0"
              >
                {isCooldownActive
                  ? `Enfriamiento (${cooldownSeconds}s)`
                  : isATOPending
                  ? "Analizando..."
                  : isATOStale
                  ? "Recalibrar IA"
                  : "Optimizar Con IA"}
              </button>
            </div>

            <Suspense
              fallback={
                <div className="h-56 w-full animate-pulse rounded-2xl bg-slate-100" />
              }
            >
              <EnergyAvailabilityPanel />
            </Suspense>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onNavigateTab?.("hormonal")}
                className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800 cursor-pointer"
              >
                <span>Abrir Panel Hormonal Completo</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardView;
