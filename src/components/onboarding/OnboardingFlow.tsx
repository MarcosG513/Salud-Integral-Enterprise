import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  Compass,
  Sparkles,
  X,
  ArrowRight,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";
import { useClinicalEngine } from "../../context/clinical-engine-context";
import { parseLocaleInt, parseLocaleNumber } from "../../lib/number-utils";
import { SIE_STORAGE_KEYS, safeGetItem, safeSetItem } from "../../lib/storage-engine";
import type { BiologicalSex } from "../../engine/bmrEngine";
import type {
  TrainingEnvironment,
  TrainingGoal,
  TrainingSchedule,
} from "../../engine/macroAllocator";

export interface OnboardingState {
  completedWelcome: boolean;
  dismissedChecklist: boolean;
  tourCompleted: boolean;
}

const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  completedWelcome: false,
  dismissedChecklist: false,
  tourCompleted: false,
};

const TOUR_STEPS = [
  {
    title: "Anillos y Calibración Autónomo",
    body: "Observa tus macros diarios y el progreso del algoritmo adaptativo. La app aprende tu gasto energético real sin ajustes manuales.",
  },
  {
    title: "Registro Diario en 2 Toques",
    body: "Usa el botón flotante inferior derecho para anotar peso matutino, comidas rápidas, horas de sueño o pasos en cuestión de segundos.",
  },
  {
    title: "Entrenamiento Casa o Gimnasio",
    body: "Tu rutina ACSM 2026 se adapta al equipo disponible y ajusta las series automáticamente si detecta deuda de sueño o fatiga.",
  },
  {
    title: "Suplementos y Escudo Endocrino",
    body: "El dispensario adapta dosis y horarios a tu descanso, mientras el Escudo IOC 2023 protege tus lípidos y salud hormonal.",
  },
];

const ACTIVITY_OPTIONS = [
  { value: "1.2", label: "Sedentario (oficina / pocos pasos)" },
  { value: "1.375", label: "Ligero (1–3 días activos/sem)" },
  { value: "1.55", label: "Moderado (3–5 días/sem)" },
  { value: "1.725", label: "Alto (6–7 días o trabajo físico)" },
  { value: "1.9", label: "Atleta (doble sesión diaria)" },
];

export function OnboardingFlow({
  onOpenSettings,
}: {
  onOpenSettings?: () => void;
}) {
  const {
    profile,
    foodLogs,
    activeWorkout,
    workoutHistory,
    updateProfileVariable,
    addWeightLog,
    logSleepHours,
  } = useClinicalEngine();

  const [onboarding, setOnboarding] = useState<OnboardingState>(() =>
    safeGetItem<OnboardingState>(SIE_STORAGE_KEYS.ONBOARDING, DEFAULT_ONBOARDING_STATE)
  );
  const [showWelcome, setShowWelcome] = useState(() => !onboarding.completedWelcome);
  const [showTour, setShowTour] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);

  // Draft controlled strings for the 10 minimal Phase 1 fields
  const [pesoDraft, setPesoDraft] = useState(String(profile.peso ?? 80));
  const [tallaDraft, setTallaDraft] = useState(String(profile.talla ?? 175));
  const [edadDraft, setEdadDraft] = useState(String(profile.edad ?? 30));
  const [sexoDraft, setSexoDraft] = useState<BiologicalSex>(profile.sexoBiologico || "male");
  const [actividadDraft, setActividadDraft] = useState(String(profile.nivelActividad ?? 1.55));
  const [suenoDraft, setSuenoDraft] = useState(String(profile.horasSuenoPromedio ?? 7.4));
  const [entornoDraft, setEntornoDraft] = useState<TrainingEnvironment>(
    profile.entornoEntreno || "gym"
  );
  const [diasDraft, setDiasDraft] = useState(String(profile.diasEntrenoSemana ?? 4));
  const [objetivoDraft, setObjetivoDraft] = useState<TrainingGoal>(
    profile.objetivo || "fat_loss"
  );
  const [horarioDraft, setHorarioDraft] = useState<TrainingSchedule>(
    profile.horarioEntreno || "afternoon"
  );
  const [formError, setFormError] = useState<string | null>(null);

  const persistOnboarding = (next: OnboardingState) => {
    setOnboarding(next);
    safeSetItem(SIE_STORAGE_KEYS.ONBOARDING, next);
  };

  const handleDismissWelcome = () => {
    setShowWelcome(false);
    persistOnboarding({ ...onboarding, completedWelcome: true });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showTour) {
        setShowTour(false);
      } else if (showWelcome) {
        setShowWelcome(false);
        const next = { ...onboarding, completedWelcome: true };
        setOnboarding(next);
        safeSetItem(SIE_STORAGE_KEYS.ONBOARDING, next);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showTour, showWelcome, onboarding]);

  const handleSaveMinimalProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPeso = parseLocaleNumber(pesoDraft);
    const parsedTalla = parseLocaleNumber(tallaDraft);
    const parsedEdad = parseLocaleInt(edadDraft);
    const parsedActividad = parseLocaleNumber(actividadDraft);
    const parsedSueno = parseLocaleNumber(suenoDraft);
    const parsedDias = parseLocaleInt(diasDraft);

    if (parsedPeso === null || parsedPeso < 25 || parsedPeso > 300) {
      setFormError("Ingresa un peso válido entre 25 y 300 kg.");
      return;
    }
    if (parsedTalla === null || parsedTalla < 120 || parsedTalla > 240) {
      setFormError("Ingresa una estatura válida entre 120 y 240 cm.");
      return;
    }
    if (parsedEdad === null || parsedEdad < 14 || parsedEdad > 100) {
      setFormError("Ingresa una edad válida entre 14 y 100 años.");
      return;
    }
    if (parsedSueno === null || parsedSueno < 3 || parsedSueno > 14) {
      setFormError("Ingresa un promedio de sueño entre 3 y 14 horas.");
      return;
    }

    setFormError(null);
    updateProfileVariable("talla", parsedTalla);
    updateProfileVariable("edad", parsedEdad);
    updateProfileVariable("sexoBiologico", sexoDraft);
    updateProfileVariable("nivelActividad", parsedActividad ?? 1.55);
    updateProfileVariable("entornoEntreno", entornoDraft);
    updateProfileVariable("diasEntrenoSemana", Math.max(2, Math.min(7, parsedDias ?? 4)));
    updateProfileVariable("objetivo", objetivoDraft);
    updateProfileVariable("horarioEntreno", horarioDraft);

    if (Math.abs(parsedPeso - profile.peso) >= 0.05) {
      addWeightLog(parsedPeso);
    } else {
      updateProfileVariable("peso", parsedPeso);
    }

    if (Math.abs(parsedSueno - profile.horasSuenoPromedio) >= 0.05) {
      logSleepHours(parsedSueno);
    } else {
      updateProfileVariable("horasSuenoPromedio", parsedSueno);
    }

    handleDismissWelcome();
  };

  // Checklist milestones (4 items)
  const hasWeightLogged =
    (profile.dailyTelemetryLogs?.length ?? 0) > 0 ||
    (profile.weightLogs?.length ?? 0) > 7;
  const hasFoodLogged = (foodLogs?.length ?? 0) > 0;
  const hasTrainingOrSleepLogged =
    Boolean(activeWorkout) ||
    (workoutHistory?.length ?? 0) > 0 ||
    (profile.sleepLogs?.length ?? 0) > 7;

  const milestones = [
    { id: "profile", label: "Perfil clínico mínimo (10 datos)", done: onboarding.completedWelcome },
    { id: "weight", label: "Primer peso o telemetría registrado", done: hasWeightLogged },
    { id: "food", label: "Primera comida de hoy registrada", done: hasFoodLogged },
    { id: "habit", label: "Entreno o sueño actualizado", done: hasTrainingOrSleepLogged },
  ];

  const completedCount = milestones.filter((m) => m.done).length;
  const progressPct = Math.round((completedCount / milestones.length) * 100);

  return (
    <>
      {/* Persistent Progress Checklist */}
      {!onboarding.dismissedChecklist && (
        <section
          aria-label="Lista de inicio rápido"
          className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col gap-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-slate-900">
                  Calibración inicial ({completedCount}/4 hitos)
                </h2>
                <p className="text-xs text-slate-600">
                  Completa lo esencial a tu ritmo para afinar el gasto energético real.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTourIndex(0);
                  setShowTour(true);
                }}
                className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Compass size={15} />
                <span>{onboarding.tourCompleted ? "Repetir tour" : "Tour guiado (4 pasos)"}</span>
              </button>

              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => setShowWelcome(true)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal size={14} />
                  <span className="hidden sm:inline">Perfil rápido</span>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  persistOnboarding({ ...onboarding, dismissedChecklist: true })
                }
                aria-label="Ocultar lista de inicio"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso de configuración inicial"
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 shrink-0">
              {progressPct}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {milestones.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                  item.done
                    ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {item.done ? (
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                ) : (
                  <Circle size={15} className="text-slate-400 shrink-0" />
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Single Non-Repeating Welcome Modal (10 minimal fields) */}
      {showWelcome && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/40 backdrop-blur-xs p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-welcome-title"
        >
          <div className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 mb-1.5">
                  Configuración Autónomo V6 · 10 datos esenciales
                </span>
                <h2
                  id="onboarding-welcome-title"
                  className="text-lg sm:text-xl font-extrabold text-slate-900"
                >
                  Bienvenido a Salud Integral
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  El motor clínico calcula tu TMB (Mifflin-St Jeor o Cunningham automático),
                  macros protegidos y volumen ACSM 2026 sin ajustes manuales complejos.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismissWelcome}
                aria-label="Cerrar bienvenida"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMinimalProfile} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  1. Peso actual (kg)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={pesoDraft}
                    onChange={(e) => setPesoDraft(e.target.value)}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    placeholder="Ej. 78,5"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  2. Estatura (cm)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tallaDraft}
                    onChange={(e) => setTallaDraft(e.target.value)}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    placeholder="Ej. 176"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  3. Edad (años)
                  <input
                    type="text"
                    inputMode="numeric"
                    value={edadDraft}
                    onChange={(e) => setEdadDraft(e.target.value)}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    placeholder="Ej. 32"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  4. Sexo biológico (eje IOC 2023)
                  <select
                    value={sexoDraft}
                    onChange={(e) => setSexoDraft(e.target.value as BiologicalSex)}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="male">Masculino (umbral EA 25 kcal/kg)</option>
                    <option value="female">Femenino (umbral EA 30 kcal/kg)</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  5. Actividad diaria base
                  <select
                    value={actividadDraft}
                    onChange={(e) => setActividadDraft(e.target.value)}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    {ACTIVITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  6. Sueño promedio (horas/noche)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={suenoDraft}
                    onChange={(e) => setSuenoDraft(e.target.value)}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    placeholder="Ej. 7,5"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  7. Entorno de entrenamiento
                  <select
                    value={entornoDraft}
                    onChange={(e) => setEntornoDraft(e.target.value as TrainingEnvironment)}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="gym">Gimnasio completo</option>
                    <option value="home_bands_dumbbells">Casa (mancuernas / bandas)</option>
                    <option value="home_bodyweight">Casa (solo peso corporal)</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  8. Días de entrenamiento / semana
                  <select
                    value={diasDraft}
                    onChange={(e) => setDiasDraft(e.target.value)}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    {[2, 3, 4, 5, 6].map((d) => (
                      <option key={d} value={String(d)}>
                        {d} días por semana
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  9. Objetivo principal
                  <select
                    value={objetivoDraft}
                    onChange={(e) => setObjetivoDraft(e.target.value as TrainingGoal)}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="fat_loss">Pérdida de grasa protegida</option>
                    <option value="recomp">Recomposición corporal</option>
                    <option value="muscle_gain">Ganancia muscular</option>
                    <option value="general_health">Salud metabólica y longevidad</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                  10. Horario habitual de entreno
                  <select
                    value={horarioDraft}
                    onChange={(e) => setHorarioDraft(e.target.value as TrainingSchedule)}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="morning">Mañana</option>
                    <option value="afternoon">Tarde</option>
                    <option value="evening">Noche (control circadiano cafeína)</option>
                  </select>
                </label>
              </div>

              {formError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                  {formError}
                </p>
              )}

              <p className="text-xs text-slate-500 leading-relaxed">
                Opcional: si conoces tu % de grasa corporal, puedes añadirlo más tarde desde{" "}
                <strong className="text-slate-700">Ajustes</strong> para usar Cunningham en lugar
                de Mifflin-St Jeor.
              </p>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDismissWelcome}
                  className="w-full sm:w-auto min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Omitir por ahora
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[44px] rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-indigo-700 cursor-pointer"
                >
                  Guardar Perfil Mínimo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voluntary 4-Step Micro-Tour Modal */}
      {showTour && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/40 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-step-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                Paso {tourIndex + 1} de {TOUR_STEPS.length}
              </span>
              <button
                type="button"
                onClick={() => setShowTour(false)}
                aria-label="Cerrar tour guiado"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <h3 id="tour-step-title" className="text-base font-extrabold text-slate-900">
                {TOUR_STEPS[tourIndex].title}
              </h3>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                {TOUR_STEPS[tourIndex].body}
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 py-1">
              {TOUR_STEPS.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === tourIndex ? "w-6 bg-indigo-600" : "w-2 bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                disabled={tourIndex === 0}
                onClick={() => setTourIndex((i) => Math.max(0, i - 1))}
                className="min-h-[44px] inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Anterior</span>
              </button>

              {tourIndex < TOUR_STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setTourIndex((i) => Math.min(TOUR_STEPS.length - 1, i + 1))}
                  className="min-h-[44px] inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-indigo-700 cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    persistOnboarding({ ...onboarding, tourCompleted: true });
                    setShowTour(false);
                  }}
                  className="min-h-[44px] inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  <span>Entendido</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OnboardingFlow;
