import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  X,
  Scale,
  Utensils,
  Moon,
  Dumbbell,
  Camera,
  Mic,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { useClinicalEngine } from "../../context/clinical-engine-context";
import { FOODS } from "../../app/components/nutrition/nutrition-data";
import { parseLocaleInt, parseLocaleNumber } from "../../lib/number-utils";

type QuickTab = "peso" | "comida" | "habitos" | "entreno";

const QUICK_FAVORITES = ["pollo", "huevo", "avena", "arroz", "salmon"];

export function QuickActionBottomSheet({
  onNavigateTab,
}: {
  onNavigateTab?: (tab: string) => void;
}) {
  const {
    profile,
    activeWorkout,
    addWeightLog,
    logFoodItem,
    logSleepHours,
    updateDailySteps,
  } = useClinicalEngine();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<QuickTab>("peso");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [phase4Notice, setPhase4Notice] = useState<string | null>(null);

  // Tab 1: Peso
  const [weightDraft, setWeightDraft] = useState(String(profile.peso ?? 80));

  // Tab 2: Comida rápida
  const [selectedFoodId, setSelectedFoodId] = useState("pollo");
  const [gramsDraft, setGramsDraft] = useState("150");

  // Tab 3: Sueño y Pasos
  const [sleepDraft, setSleepDraft] = useState(String(profile.horasSuenoPromedio ?? 7.4));
  const [stepsDraft, setStepsDraft] = useState(String(profile.dailySteps ?? 8500));

  useEffect(() => {
    if (isOpen) {
      setWeightDraft(String(profile.peso ?? 80));
      setSleepDraft(String(profile.horasSuenoPromedio ?? 7.4));
      setStepsDraft(String(profile.dailySteps ?? 8500));
      setFeedback(null);
      setPhase4Notice(null);
    }
  }, [isOpen, profile.peso, profile.horasSuenoPromedio, profile.dailySteps]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const selectedFood = useMemo(
    () => FOODS.find((f) => f.id === selectedFoodId) || FOODS[0],
    [selectedFoodId]
  );

  const parsedGrams = parseLocaleNumber(gramsDraft) ?? 0;
  const previewScale = Math.max(0, parsedGrams) / 100;

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseLocaleNumber(weightDraft);
    if (parsed === null || parsed <= 20 || parsed > 300) {
      setFeedback("Ingresa un peso válido entre 21 y 300 kg.");
      return;
    }
    addWeightLog(parsed);
    setFeedback(`Peso registrado (${parsed} kg). Tendencia EMA-20 actualizada.`);
  };

  const handleSaveFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFood) return;
    const g = parseLocaleNumber(gramsDraft);
    if (g === null || g <= 0 || g > 3000) {
      setFeedback("Ingresa una porción válida en gramos (1–3000 g).");
      return;
    }
    logFoodItem(selectedFood, g);
    setFeedback(`Añadido: ${Math.round(g)} g de ${selectedFood.name}.`);
  };

  const handleSaveHabits = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseLocaleNumber(sleepDraft);
    const s = parseLocaleInt(stepsDraft);

    if (h === null || h <= 0 || h > 16) {
      setFeedback("Ingresa horas de sueño entre 1 y 16.");
      return;
    }
    if (s === null || s < 0 || s > 80000) {
      setFeedback("Ingresa pasos diarios válidos (0–80.000).");
      return;
    }
    logSleepHours(h);
    updateDailySteps(s);
    setFeedback(`Guardado: ${h} h de sueño y ${s.toLocaleString("es-ES")} pasos.`);
  };

  const envLabel =
    profile.entornoEntreno === "home_bodyweight"
      ? "Casa (Peso corporal)"
      : profile.entornoEntreno === "home_bands_dumbbells"
      ? "Casa (Mancuernas / Bandas)"
      : "Gimnasio";

  return (
    <>
      {/* Accessible Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir registro rápido"
        aria-expanded={isOpen}
        style={{
          bottom: "max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))",
        }}
        className="fixed right-4 sm:right-6 z-40 min-w-[52px] min-h-[52px] inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 shadow-xl shadow-indigo-600/30 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
      >
        <Plus size={22} strokeWidth={2.5} />
        <span className="hidden sm:inline text-xs font-extrabold tracking-wide">
          Registro rápido
        </span>
      </button>

      {/* Bottom Sheet Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="fixed inset-0 bg-slate-800/35 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Registro rápido en 2 toques"
            style={{
              paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
            }}
            className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Registro rápido diario
                </h2>
                <p className="text-xs text-slate-600">
                  Actualiza tu telemetría sin salir de la pantalla principal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar registro rápido"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* 4 Quick Tabs */}
            <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-slate-100 p-1">
              {[
                { id: "peso" as const, label: "Peso", Icon: Scale },
                { id: "comida" as const, label: "Comida", Icon: Utensils },
                { id: "habitos" as const, label: "Sueño", Icon: Moon },
                { id: "entreno" as const, label: "Entreno", Icon: Dumbbell },
              ].map(({ id, label, Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setActiveTab(id);
                      setFeedback(null);
                      setPhase4Notice(null);
                    }}
                    className={`min-h-[44px] flex flex-col sm:flex-row items-center justify-center gap-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-white/80"
                    }`}
                  >
                    <Icon size={15} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Peso */}
            {activeTab === "peso" && (
              <form onSubmit={handleSaveWeight} className="space-y-3">
                <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
                  Peso corporal en ayunas (kg)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={weightDraft}
                    onChange={(e) => setWeightDraft(e.target.value)}
                    placeholder="Ej. 84,5"
                    className="min-h-[48px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-base font-mono font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold cursor-pointer"
                >
                  <Check size={16} />
                  <span>Guardar Peso</span>
                </button>
              </form>
            )}

            {/* Tab 2: Comida rápida + mount points Phase 4 */}
            {activeTab === "comida" && (
              <form onSubmit={handleSaveFood} className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FAVORITES.map((fid) => {
                    const item = FOODS.find((f) => f.id === fid);
                    if (!item) return null;
                    const isSelected = selectedFoodId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedFoodId(item.id)}
                        className={`min-h-[38px] rounded-xl border px-2.5 py-1 text-xs font-bold cursor-pointer ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {item.emoji} {item.name.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className="sm:col-span-2 flex flex-col gap-1 text-xs font-bold text-slate-700">
                    Alimento clínico
                    <select
                      value={selectedFoodId}
                      onChange={(e) => setSelectedFoodId(e.target.value)}
                      className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    >
                      {FOODS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.emoji} {f.name} ({f.kcal} kcal/100g)
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                    Gramos (g)
                    <input
                      type="text"
                      inputMode="decimal"
                      value={gramsDraft}
                      onChange={(e) => setGramsDraft(e.target.value)}
                      placeholder="150"
                      className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-mono font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                </div>

                {selectedFood && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between text-xs font-mono text-slate-700">
                    <span>{Math.round(selectedFood.kcal * previewScale)} kcal</span>
                    <span>P: {Math.round(selectedFood.protein * previewScale)}g</span>
                    <span>C: {Math.round(selectedFood.carbs * previewScale)}g</span>
                    <span>G: {Math.round(selectedFood.fats * previewScale)}g</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold cursor-pointer"
                >
                  <Check size={16} />
                  <span>Registrar Alimento</span>
                </button>

                {/* Phase 4 AI Multimodal Mount Points */}
                <div className="border-t border-slate-100 pt-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Captura multimodal asistida</span>
                    <span className="rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-sky-700">
                      Fase 4
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPhase4Notice(
                          "AI Describe (texto/voz con Gemini) se activará en Fase 4 via Cloud Functions."
                        )
                      }
                      className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Mic size={14} className="text-indigo-600" />
                      <span>AI Describe</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPhase4Notice(
                          "Photo Detect (reconocimiento visual de platos) se activará en Fase 4."
                        )
                      }
                      className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Camera size={14} className="text-sky-600" />
                      <span>Photo Detect</span>
                    </button>
                  </div>
                  {phase4Notice && (
                    <p className="text-xs text-sky-800 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 font-medium">
                      {phase4Notice}
                    </p>
                  )}
                </div>
              </form>
            )}

            {/* Tab 3: Sueño y Pasos */}
            {activeTab === "habitos" && (
              <form onSubmit={handleSaveHabits} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                    Horas de sueño anoche (h)
                    <input
                      type="text"
                      inputMode="decimal"
                      value={sleepDraft}
                      onChange={(e) => setSleepDraft(e.target.value)}
                      placeholder="Ej. 7,5"
                      className="min-h-[46px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-mono font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                    Pasos acumulados hoy
                    <input
                      type="text"
                      inputMode="numeric"
                      value={stepsDraft}
                      onChange={(e) => setStepsDraft(e.target.value)}
                      placeholder="Ej. 9000"
                      className="min-h-[46px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-mono font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold cursor-pointer"
                >
                  <Check size={16} />
                  <span>Guardar Sueño y Pasos</span>
                </button>
              </form>
            )}

            {/* Tab 4: Entreno */}
            {activeTab === "entreno" && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1">
                  <p className="font-extrabold text-slate-900">
                    {activeWorkout
                      ? `Sesión activa: ${activeWorkout.name}`
                      : `Modo actual: ${envLabel} · ${profile.diasEntrenoSemana} días/sem`}
                  </p>
                  <p className="text-slate-600">
                    Abre el módulo de entrenamiento para registrar series, RIR observado y cargas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab?.("training");
                    setIsOpen(false);
                  }}
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-extrabold cursor-pointer"
                >
                  <span>Ir a Entrenamiento de Hoy</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            )}

            {feedback && (
              <p
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"
              >
                {feedback}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default QuickActionBottomSheet;
