import { useMemo, useState } from "react";
import {
  Search,
  X,
  CheckCircle2,
  Circle,
  Sparkles,
  Bot,
  Settings,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Compass,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { useClinicalEngine } from "../context/clinical-engine-context";
import {
  HELP_CATEGORIES,
  HELP_GUIDES,
  HELP_FAQS,
  normalizeHelpSearch,
  type HelpActionTarget,
  type HelpCategoryId,
} from "../data/help-guide-db";
import { GLOSSARY_TERMS } from "../data/glossary-db";
import { SIE_STORAGE_KEYS, safeGetItem } from "../lib/storage-engine";
import type { OnboardingState } from "../components/onboarding/OnboardingFlow";

export interface HelpCenterViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenSettings: () => void;
  onOpenQuickLog: (tab: "weight" | "meal" | "sleep" | "training") => void;
  onLaunchOnboarding: (mode: "welcome" | "tour") => void;
}

const DEFAULT_ONBOARDING_SNAPSHOT: OnboardingState = {
  completedWelcome: false,
  dismissedChecklist: false,
  tourCompleted: false,
};

export function HelpCenterView({
  onNavigateTab,
  onOpenSettings,
  onOpenQuickLog,
  onLaunchOnboarding,
}: HelpCenterViewProps) {
  const {
    profile,
    foodLogs,
    supplementChecklist,
    activeWorkout,
    workoutHistory,
  } = useClinicalEngine();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | HelpCategoryId>("all");
  const [openGuideIds, setOpenGuideIds] = useState<Record<string, boolean>>({
    "inicio-perfil-minimo": true,
  });
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({});

  const onboardingState = safeGetItem<OnboardingState>(
    SIE_STORAGE_KEYS.ONBOARDING,
    DEFAULT_ONBOARDING_SNAPSHOT
  );

  const executeAction = (action?: HelpActionTarget) => {
    if (!action) return;
    if (action.launchOnboarding) {
      onLaunchOnboarding(action.launchOnboarding);
      return;
    }
    if (action.openQuickLogTab) {
      onOpenQuickLog(action.openQuickLogTab);
      return;
    }
    if (action.openSettings) {
      onOpenSettings();
      return;
    }
    if (action.targetView) {
      onNavigateTab(action.targetView);
    }
  };

  // Live 5-milestone Mapa de Configuración Inicial
  const setupMilestones = useMemo(() => {
    const profileCustomized =
      Boolean(onboardingState.completedWelcome) ||
      profile.peso !== 84.7 ||
      profile.edad !== 34;

    const trainingConfigured =
      Boolean(onboardingState.completedWelcome) ||
      profile.entornoEntreno !== "gym" ||
      profile.horarioEntreno !== "afternoon" ||
      Boolean(activeWorkout) ||
      (workoutHistory?.length ?? 0) > 0;

    const hasWeightRecorded =
      (profile.weightLogs?.length ?? 0) > 7 ||
      (profile.dailyTelemetryLogs?.length ?? 0) > 0;

    const hasFoodRecorded = (foodLogs?.length ?? 0) > 0;

    const hasSupplementsReviewed =
      Object.values(supplementChecklist || {}).some(Boolean) ||
      Boolean(profile.ashwagandhaSafetyCleared) ||
      Boolean(profile.optInVascularVitality);

    return [
      {
        id: "step-profile",
        title: "Perfil básico y objetivo configurados",
        detail: "10 datos mínimos para activar Mifflin-St Jeor / Cunningham y tus metas diarias.",
        done: profileCustomized,
        action: {
          label: profileCustomized ? "Revisar perfil" : "Configurar ahora",
          launchOnboarding: "welcome",
        } as HelpActionTarget,
      },
      {
        id: "step-training",
        title: "Entorno Casa/Gym y horario definidos",
        detail: "Ajusta ejercicios ACSM 2026 según tu equipo y tu ventana circadiana.",
        done: trainingConfigured,
        action: {
          label: trainingConfigured ? "Ver rutina" : "Configurar ahora",
          targetView: "training",
        } as HelpActionTarget,
      },
      {
        id: "step-weight",
        title: "Primer peso registrado para iniciar EMA-20",
        detail: "Suaviza fluctuaciones diarias y empieza a calibrar tu TDEE real.",
        done: hasWeightRecorded,
        action: {
          label: hasWeightRecorded ? "Registrar nuevo" : "Configurar ahora",
          openQuickLogTab: "weight",
        } as HelpActionTarget,
      },
      {
        id: "step-food",
        title: "Primera comida registrada (Rápido o IA)",
        detail: "Usa alimentos base, etiqueta, voz o foto con ajuste táctil de porciones.",
        done: hasFoodRecorded,
        action: {
          label: hasFoodRecorded ? "Añadir otra" : "Configurar ahora",
          openQuickLogTab: "meal",
        } as HelpActionTarget,
      },
      {
        id: "step-supps",
        title: "Dispensario de suplementos revisado",
        detail: "Activa Creatina/Suero o completa compuertas de seguridad si aplican.",
        done: hasSupplementsReviewed,
        action: {
          label: hasSupplementsReviewed ? "Gestionar" : "Configurar ahora",
          targetView: "supplements",
        } as HelpActionTarget,
      },
    ];
  }, [
    onboardingState.completedWelcome,
    profile.peso,
    profile.edad,
    profile.entornoEntreno,
    profile.horarioEntreno,
    profile.weightLogs?.length,
    profile.dailyTelemetryLogs?.length,
    profile.ashwagandhaSafetyCleared,
    profile.optInVascularVitality,
    activeWorkout,
    workoutHistory?.length,
    foodLogs?.length,
    supplementChecklist,
  ]);

  const completedMilestonesCount = setupMilestones.filter((m) => m.done).length;
  const setupProgressPct = Math.round((completedMilestonesCount / setupMilestones.length) * 100);

  const normalizedQuery = useMemo(() => normalizeHelpSearch(searchQuery), [searchQuery]);
  const isSearching = normalizedQuery.length > 0;

  const filteredGuides = useMemo(() => {
    return HELP_GUIDES.filter((guide) => {
      const catMatch =
        isSearching || selectedCategory === "all" || guide.category === selectedCategory;
      if (!catMatch) return false;
      if (!isSearching) return true;

      const haystack = normalizeHelpSearch(
        `${guide.title} ${guide.summary} ${guide.whatAiDoes} ${guide.whatYouConfigure.join(
          " "
        )} ${guide.proTip} ${guide.keywords.join(" ")}`
      );
      return haystack.includes(normalizedQuery);
    });
  }, [isSearching, selectedCategory, normalizedQuery]);

  const filteredFaqs = useMemo(() => {
    return HELP_FAQS.filter((faq) => {
      const catMatch =
        isSearching || selectedCategory === "all" || faq.category === selectedCategory;
      if (!catMatch) return false;
      if (!isSearching) return true;

      const haystack = normalizeHelpSearch(
        `${faq.question} ${faq.answer} ${faq.keywords.join(" ")}`
      );
      return haystack.includes(normalizedQuery);
    });
  }, [isSearching, selectedCategory, normalizedQuery]);

  const matchingGlossaryEntries = useMemo(() => {
    if (!isSearching) return [];
    const unique = new Map<string, { term: string; definition: string; significance: string }>();
    Object.values(GLOSSARY_TERMS).forEach((entry) => {
      const haystack = normalizeHelpSearch(
        `${entry.term} ${entry.definition} ${entry.significance}`
      );
      if (haystack.includes(normalizedQuery) && !unique.has(entry.term)) {
        unique.set(entry.term, entry);
      }
    });
    return Array.from(unique.values()).slice(0, 10);
  }, [isSearching, normalizedQuery]);

  const toggleGuide = (id: string) => {
    setOpenGuideIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="relative flex-1 w-full max-w-full flex flex-col gap-5 sm:gap-6 p-2 sm:p-4 lg:p-6 bg-slate-50 text-slate-900 font-sans pb-24 sm:pb-10">
      {/* 1. Cabecera con Buscador Instantáneo */}
      <header className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="size-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
              <BookOpen size={22} />
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 mb-1">
                Guía Interactiva v6.1.0
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Guía de Uso y Configuración
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                Descubre qué calcula la app automáticamente y cómo ajustar cada herramienta paso a paso.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-xs font-extrabold text-slate-800 shrink-0 cursor-pointer"
          >
            <Settings size={15} className="text-slate-600 shrink-0" />
            <span>Abrir Ajustes Clínicos</span>
          </button>
        </div>

        {/* Instant Search Input */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tema, duda o término (ej. creatina, RIR, foto IA, sueño, Dorey)..."
              aria-label="Buscar en guías, preguntas frecuentes y glosario"
              className="w-full min-h-[46px] rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
            />
          </div>
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Limpiar búsqueda"
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 shrink-0 cursor-pointer"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {isSearching && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Resultados unificados para &ldquo;{searchQuery.trim()}&rdquo;:</span>
            <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-sky-800 font-bold">
              {filteredGuides.length} guías
            </span>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-emerald-800 font-bold">
              {filteredFaqs.length} preguntas
            </span>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-slate-800 font-bold">
              {matchingGlossaryEntries.length} términos clínicos
            </span>
          </div>
        )}
      </header>

      {/* 2. Mapa de Configuración Inicial (Live Checklist) + Cómo funciona en 60s (cuando no hay búsqueda activa) */}
      {!isSearching && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Live Setup Map */}
          <section
            aria-label="Mapa de configuración inicial"
            className="xl:col-span-7 rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-slate-900">
                  Mapa de Configuración Inicial
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Progreso real detectado automáticamente en tu cuenta local.
                </p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-mono font-extrabold text-emerald-800 shrink-0">
                {completedMilestonesCount} de {setupMilestones.length} configurados
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden"
                role="progressbar"
                aria-valuenow={setupProgressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progreso de configuración general"
              >
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${setupProgressPct}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 shrink-0">
                {setupProgressPct}%
              </span>
            </div>

            <div className="space-y-2.5">
              {setupMilestones.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-3.5 ${
                    item.done
                      ? "border-emerald-200 bg-emerald-50/60"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {item.done ? (
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Circle size={18} className="text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                        {item.detail}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => executeAction(item.action)}
                    className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold shrink-0 cursor-pointer transition-colors ${
                      item.done
                        ? "border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50"
                        : "bg-sky-600 hover:bg-sky-700 text-white"
                    }`}
                  >
                    <span>{item.action.label}</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Right column: 60 Seconds Visual Cycle + Tour Launcher */}
          <div className="xl:col-span-5 flex flex-col gap-5">
            <section
              aria-label="Cómo funciona la app en 60 segundos"
              className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm space-y-4"
            >
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Cómo funciona la app en 60 segundos
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Un flujo simple en 3 pasos para evitar configuraciones manuales pesadas.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    step: "1",
                    title: "Tus datos básicos",
                    desc: "Indicas peso, estatura, sueño, objetivo y si entrenas en Casa o Gimnasio.",
                    badgeClass: "bg-sky-50 border-sky-200 text-sky-800",
                  },
                  {
                    step: "2",
                    title: "Registras en 2 toques",
                    desc: "Usas el botón '+' inferior derecho para anotar peso, comida (texto, foto o rápido), sueño y rutinas.",
                    badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-800",
                  },
                  {
                    step: "3",
                    title: "La IA recalibra tus metas",
                    desc: "El motor EMA-20 y el Escudo Endocrino ajustan calorías, agua y series cada semana por ti.",
                    badgeClass: "bg-rose-50 border-rose-200 text-rose-700",
                  },
                ].map((stage) => (
                  <div
                    key={stage.step}
                    className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5"
                  >
                    <span
                      className={`size-8 rounded-xl border flex items-center justify-center font-mono text-sm font-black shrink-0 ${stage.badgeClass}`}
                    >
                      {stage.step}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                        {stage.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Voluntary Micro-Tour & Reset Launcher */}
            <section
              aria-label="Asistentes y tour guiado"
              className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                  <Compass size={19} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Tour interactivo y asistente inicial
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    ¿Quieres repasar la pantalla principal en 4 tarjetas breves o rehacer tu perfil básico desde cero?
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onLaunchOnboarding("tour")}
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-extrabold cursor-pointer"
                >
                  <Sparkles size={15} />
                  <span>Relanzar tour guiado</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLaunchOnboarding("welcome")}
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 px-4 py-2.5 text-xs font-extrabold cursor-pointer"
                >
                  <RotateCcw size={15} />
                  <span>Reabrir bienvenida</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* 3. Explorador por Categorías y Guías Detalladas */}
      <section aria-label="Guías paso a paso por módulo" className="space-y-4">
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-slate-900">
              Guías paso a paso por herramienta
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {filteredGuides.length} guías mostradas
            </span>
          </div>

          {!isSearching && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`min-h-[44px] rounded-2xl border px-3.5 py-2 text-xs font-bold cursor-pointer transition-colors ${
                  selectedCategory === "all"
                    ? "border-sky-600 bg-sky-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Todas las áreas
              </button>
              {HELP_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`min-h-[44px] rounded-2xl border px-3.5 py-2 text-xs font-bold cursor-pointer transition-colors ${
                      active
                        ? "border-sky-600 bg-sky-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {cat.shortLabel}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {filteredGuides.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm space-y-2">
            <p className="text-sm font-bold text-slate-900">
              No encontramos guías para &ldquo;{searchQuery.trim()}&rdquo;
            </p>
            <p className="text-xs text-slate-600">
              Prueba con palabras como &ldquo;creatina&rdquo;, &ldquo;RIR&rdquo;, &ldquo;sueño&rdquo;, &ldquo;foto&rdquo; o &ldquo;offline&rdquo;.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGuides.map((guide) => {
              const isOpen = isSearching || Boolean(openGuideIds[guide.id]);
              const catMeta = HELP_CATEGORIES.find((c) => c.id === guide.category);

              return (
                <article
                  key={guide.id}
                  className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm transition-all"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggleGuide(guide.id)}
                    className="w-full min-h-[48px] flex items-start justify-between gap-3 text-left cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="inline-block rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-800">
                        {catMeta?.shortLabel || guide.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                        {guide.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {guide.summary}
                      </p>
                    </div>
                    <span className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 shrink-0">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-4 border-t border-slate-100 pt-4 space-y-3.5">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                        {/* Box 1: What AI/App calculates automatically */}
                        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 space-y-1.5">
                          <h4 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-sky-900">
                            <Bot size={15} className="text-sky-700 shrink-0" />
                            <span>🤖 Qué calcula la app sola</span>
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            {guide.whatAiDoes}
                          </p>
                        </div>

                        {/* Box 2: What user configures step-by-step */}
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
                          <h4 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                            <Settings size={15} className="text-emerald-700 shrink-0" />
                            <span>⚙️ Qué debes configurar tú (paso a paso)</span>
                          </h4>
                          <ol className="list-decimal pl-4 space-y-1.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
                            {guide.whatYouConfigure.map((stepText, idx) => (
                              <li key={idx}>{stepText}</li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                        <div className="flex items-start gap-2 min-w-0">
                          <Lightbulb size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-700 leading-relaxed min-w-0">
                            <strong className="text-slate-900">Consejo práctico: </strong>
                            {guide.proTip}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => executeAction(guide.action)}
                          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 text-xs font-extrabold shrink-0 cursor-pointer"
                        >
                          <span>{guide.action.label}</span>
                          <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Preguntas Frecuentes (FAQ) */}
      {filteredFaqs.length > 0 && (
        <section
          aria-label="Preguntas frecuentes"
          className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle size={20} className="text-rose-500 shrink-0" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Preguntas Frecuentes (FAQ)
              </h2>
              <p className="text-xs text-slate-600">
                Respuestas directas a las dudas más comunes al empezar.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredFaqs.map((faq) => {
              const isOpen = isSearching || Boolean(openFaqIds[faq.id]);
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full min-h-[44px] flex items-center justify-between gap-3 text-left cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 min-w-0 leading-snug">
                      {faq.question}
                    </span>
                    <span className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shrink-0">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-2.5 border-t border-slate-200/70 pt-3 space-y-3">
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {faq.answer}
                      </p>
                      {faq.action && (
                        <button
                          type="button"
                          onClick={() => executeAction(faq.action)}
                          className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white hover:bg-sky-50 px-3.5 py-2 text-xs font-extrabold text-sky-800 cursor-pointer"
                        >
                          <span>{faq.action.label}</span>
                          <ArrowUpRight size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Coincidencias en el Glosario Clínico (visible al buscar) */}
      {isSearching && matchingGlossaryEntries.length > 0 && (
        <section
          aria-label="Términos del glosario clínico coincidentes"
          className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm space-y-3.5"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-sky-600 shrink-0" />
            <h2 className="text-base font-extrabold text-slate-900">
              Diccionario Clínico Relacionado
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {matchingGlossaryEntries.map((entry) => (
              <div
                key={entry.term}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1.5"
              >
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  {entry.term}
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {entry.definition}
                </p>
                <p className="text-[11px] text-slate-600 border-l-2 border-emerald-500 pl-2.5 py-0.5">
                  <strong className="text-slate-800">Para qué sirve: </strong>
                  {entry.significance}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default HelpCenterView;
