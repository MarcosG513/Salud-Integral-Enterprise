import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  X,
  Scale,
  Utensils,
  Moon,
  Dumbbell,
  Camera,
  Mic,
  MicOff,
  Check,
  ArrowUpRight,
  Trash2,
  Sparkles,
  Tag,
  Activity,
  AlertCircle,
} from "lucide-react";
import { useClinicalEngine } from "../../context/clinical-engine-context";
import { FOODS } from "../../app/components/nutrition/nutrition-data";
import { parseLocaleInt, parseLocaleNumber } from "../../lib/number-utils";
import {
  analyzeMealDescription,
  analyzeMealPhoto,
  compressImageForVision,
  isSpeechRecognitionSupported,
  startSpanishDictation,
  type NutritionConfidence,
} from "../../services/nutritionAiService";
import { syncNativeHealthData } from "../../services/healthSync";

type QuickTab = "peso" | "comida" | "habitos" | "entreno";
export type ExternalQuickLogTab = QuickTab | "weight" | "meal" | "sleep" | "training";
type FoodSubMode = "rapido" | "etiqueta" | "ai_describe" | "photo_detect";

function mapExternalTabToQuickTab(tab: ExternalQuickLogTab): QuickTab {
  switch (tab) {
    case "weight":
    case "peso":
      return "peso";
    case "meal":
    case "comida":
      return "comida";
    case "sleep":
    case "habitos":
      return "habitos";
    case "training":
    case "entreno":
      return "entreno";
  }
}

interface EditableAiIngredient {
  id: string;
  name: string;
  baseGrams: number;
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  gramsDraft: string;
  multiplier: number;
  confidence: NutritionConfidence;
  servingLabel: string;
  isCustomEditable?: boolean;
  customKcalDraft?: string;
  customProteinDraft?: string;
  customCarbsDraft?: string;
  customFatDraft?: string;
}

const QUICK_FAVORITES = ["pollo", "huevo", "avena", "arroz", "salmon"];
const MULTIPLIER_PRESETS = [0.5, 1, 1.5, 2] as const;

const CONFIDENCE_STYLE: Record<
  NutritionConfidence,
  { label: string; className: string }
> = {
  high: {
    label: "Confianza alta",
    className: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  medium: {
    label: "Confianza media",
    className: "bg-sky-50 border-sky-200 text-sky-800",
  },
  low: {
    label: "Revisar porción",
    className: "bg-amber-50 border-amber-200 text-amber-800",
  },
};

function computeScaledMacros(item: EditableAiIngredient) {
  const grams = Math.max(0, parseLocaleNumber(item.gramsDraft) ?? 0);
  if (item.isCustomEditable) {
    const kcal = Math.max(0, parseLocaleNumber(item.customKcalDraft || "0") ?? 0);
    const protein = Math.max(0, parseLocaleNumber(item.customProteinDraft || "0") ?? 0);
    const carbs = Math.max(0, parseLocaleNumber(item.customCarbsDraft || "0") ?? 0);
    const fat = Math.max(0, parseLocaleNumber(item.customFatDraft || "0") ?? 0);
    return { grams, kcal, protein, carbs, fat };
  }

  const ratio = item.baseGrams > 0 ? grams / item.baseGrams : 1;
  return {
    grams,
    kcal: Math.round(item.baseCalories * ratio),
    protein: Math.round(item.baseProtein * ratio * 10) / 10,
    carbs: Math.round(item.baseCarbs * ratio * 10) / 10,
    fat: Math.round(item.baseFat * ratio * 10) / 10,
  };
}

export function QuickActionBottomSheet({
  onNavigateTab,
  externalOpenRequest,
}: {
  onNavigateTab?: (tab: string) => void;
  externalOpenRequest?: { tab: ExternalQuickLogTab; nonce: number } | null;
}) {
  const {
    profile,
    activeWorkout,
    addWeightLog,
    logFoodItem,
    logSleepHours,
    updateDailySteps,
    logDailyTelemetry,
  } = useClinicalEngine();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<QuickTab>("peso");
  const [foodSubMode, setFoodSubMode] = useState<FoodSubMode>("rapido");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Tab 1: Peso
  const [weightDraft, setWeightDraft] = useState(String(profile.peso ?? 80));

  // Tab 2A: Comida rápida
  const [selectedFoodId, setSelectedFoodId] = useState("pollo");
  const [gramsDraft, setGramsDraft] = useState("150");

  // Tab 2B: Etiqueta / Envasado
  const [labelName, setLabelName] = useState("");
  const [labelGrams, setLabelGrams] = useState("100");
  const [labelKcal, setLabelKcal] = useState("");
  const [labelProtein, setLabelProtein] = useState("");
  const [labelCarbs, setLabelCarbs] = useState("");
  const [labelFat, setLabelFat] = useState("");

  // Tab 2C & 2D: AI Describe + Photo Detect + Portion Check
  const [aiDescriptionText, setAiDescriptionText] = useState("");
  const [photoHintText, setPhotoHintText] = useState("");
  const [compressedImage, setCompressedImage] = useState<{
    base64: string;
    mimeType: string;
    previewDataUrl: string;
    sizeKB: number;
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiItems, setAiItems] = useState<EditableAiIngredient[]>([]);
  const [glycemicTip, setGlycemicTip] = useState<string | null>(null);
  const [isPartialLog, setIsPartialLog] = useState(false);
  const dictationRef = useRef<{ stop: () => void } | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Tab 3: Sueño, Pasos & Salud Nativa
  const [sleepDraft, setSleepDraft] = useState(String(profile.horasSuenoPromedio ?? 7.4));
  const [stepsDraft, setStepsDraft] = useState(String(profile.dailySteps ?? 8500));
  const [isHealthSyncing, setIsHealthSyncing] = useState(false);
  const [healthSyncNotice, setHealthSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setWeightDraft(String(profile.peso ?? 80));
      setSleepDraft(String(profile.horasSuenoPromedio ?? 7.4));
      setStepsDraft(String(profile.dailySteps ?? 8500));
      setFeedback(null);
      setErrorNotice(null);
      setHealthSyncNotice(null);
    } else {
      dictationRef.current?.stop();
      setIsListening(false);
    }
  }, [isOpen, profile.peso, profile.horasSuenoPromedio, profile.dailySteps]);

  useEffect(() => {
    if (!externalOpenRequest) return;
    setActiveTab(mapExternalTabToQuickTab(externalOpenRequest.tab));
    setFeedback(null);
    setErrorNotice(null);
    setIsOpen(true);
  }, [externalOpenRequest?.nonce, externalOpenRequest?.tab]);

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

  const aiTotals = useMemo(() => {
    return aiItems.reduce(
      (acc, item) => {
        const scaled = computeScaledMacros(item);
        return {
          calories: acc.calories + scaled.kcal,
          protein: Math.round((acc.protein + scaled.protein) * 10) / 10,
          carbs: Math.round((acc.carbs + scaled.carbs) * 10) / 10,
          fat: Math.round((acc.fat + scaled.fat) * 10) / 10,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [aiItems]);

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    const parsed = parseLocaleNumber(weightDraft);
    if (parsed === null || parsed <= 20 || parsed > 300) {
      setErrorNotice("Ingresa un peso válido entre 21 y 300 kg.");
      return;
    }
    addWeightLog(parsed);
    setFeedback(`Peso registrado (${parsed} kg). Tendencia EMA-20 actualizada.`);
  };

  const handleSaveQuickFood = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    if (!selectedFood) return;
    const g = parseLocaleNumber(gramsDraft);
    if (g === null || g <= 0 || g > 3000) {
      setErrorNotice("Ingresa una porción válida en gramos (1–3000 g).");
      return;
    }
    logFoodItem(selectedFood, g);
    setFeedback(`Añadido: ${Math.round(g)} g de ${selectedFood.name}.`);
  };

  const handleSaveLabelFood = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    const cleanName = labelName.trim();
    const g = parseLocaleNumber(labelGrams);
    const kcal = parseLocaleNumber(labelKcal);
    const p = parseLocaleNumber(labelProtein) ?? 0;
    const c = parseLocaleNumber(labelCarbs) ?? 0;
    const f = parseLocaleNumber(labelFat) ?? 0;

    if (!cleanName) {
      setErrorNotice("Escribe el nombre o código del producto envasado.");
      return;
    }
    if (g === null || g <= 0 || g > 3000) {
      setErrorNotice("Ingresa el peso de la porción en gramos (1–3000 g).");
      return;
    }
    if (kcal === null || kcal < 0) {
      setErrorNotice("Ingresa las calorías de la porción.");
      return;
    }

    const factorTo100g = 100 / g;
    logFoodItem(
      {
        id: `label-${Date.now()}`,
        name: cleanName,
        category: "Etiqueta Nutricional",
        emoji: "🏷️",
        kcal: Math.round(kcal * factorTo100g * 10) / 10,
        protein: Math.round(p * factorTo100g * 10) / 10,
        carbs: Math.round(c * factorTo100g * 10) / 10,
        fats: Math.round(f * factorTo100g * 10) / 10,
      },
      g
    );
    setLabelName("");
    setLabelKcal("");
    setLabelProtein("");
    setLabelCarbs("");
    setLabelFat("");
    setFeedback(`Producto registrado: ${cleanName} (${Math.round(g)} g).`);
  };

  const loadAiResponseForReview = (
    response: Awaited<ReturnType<typeof analyzeMealDescription>>
  ) => {
    setAiItems(
      response.items.map((item) => ({
        id: item.id,
        name: item.name,
        baseGrams: item.estimatedGrams,
        baseCalories: item.calories,
        baseProtein: item.protein,
        baseCarbs: item.carbs,
        baseFat: item.fat,
        gramsDraft: String(item.estimatedGrams),
        multiplier: 1,
        confidence: item.confidence,
        servingLabel: item.servingLabel,
      }))
    );
    setGlycemicTip(response.glycemicTip);
    setIsPartialLog(false);
    setErrorNotice(null);
    setFeedback(null);
  };

  const handleAnalyzeDescription = async () => {
    setErrorNotice(null);
    setFeedback(null);
    if (!aiDescriptionText.trim()) {
      setErrorNotice("Describe qué comiste antes de analizar.");
      return;
    }
    setIsAiLoading(true);
    try {
      const result = await analyzeMealDescription(aiDescriptionText);
      loadAiResponseForReview(result);
    } catch (err: any) {
      setErrorNotice(
        `${err?.message || "Sin conexión con el servicio IA."} Tu texto se ha conservado; puedes usar 'Rápido' o 'Etiqueta'.`
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleToggleDictation = () => {
    setErrorNotice(null);
    if (isListening) {
      dictationRef.current?.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    dictationRef.current = startSpanishDictation({
      onResult: (transcript) => {
        setAiDescriptionText((prev) =>
          prev.trim() ? `${prev.trim()}, ${transcript}` : transcript
        );
      },
      onError: (msg) => {
        setErrorNotice(msg);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  };

  const handlePhotoFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setErrorNotice(null);
    try {
      const compressed = await compressImageForVision(file, 1024, 0.75);
      setCompressedImage({
        base64: compressed.base64,
        mimeType: compressed.mimeType,
        previewDataUrl: compressed.previewDataUrl,
        sizeKB: compressed.sizeKB,
      });
    } catch (err: any) {
      setErrorNotice(err?.message || "No fue posible preparar la fotografía.");
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!compressedImage) {
      setErrorNotice("Selecciona o toma una foto de tu plato primero.");
      return;
    }
    setErrorNotice(null);
    setFeedback(null);
    setIsAiLoading(true);
    try {
      const result = await analyzeMealPhoto(
        compressedImage.base64,
        compressedImage.mimeType,
        photoHintText
      );
      loadAiResponseForReview(result);
    } catch (err: any) {
      setErrorNotice(
        `${err?.message || "Fallo al analizar la foto."} Puedes editar manualmente o pasar a 'Rápido'.`
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyMultiplier = (id: string, mult: number) => {
    setAiItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              multiplier: mult,
              gramsDraft: String(Math.max(1, Math.round(item.baseGrams * mult))),
            }
          : item
      )
    );
  };

  const handleUpdateAiItem = (
    id: string,
    patch: Partial<EditableAiIngredient>
  ) => {
    setAiItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const handleAddManualIngredientRow = () => {
    setAiItems((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        name: "Ingrediente adicional",
        baseGrams: 100,
        baseCalories: 100,
        baseProtein: 0,
        baseCarbs: 0,
        baseFat: 0,
        gramsDraft: "50",
        multiplier: 1,
        confidence: "medium",
        servingLabel: "Personalizado",
        isCustomEditable: true,
        customKcalDraft: "80",
        customProteinDraft: "2",
        customCarbsDraft: "10",
        customFatDraft: "3",
      },
    ]);
  };

  const handleConfirmValidatedMeal = () => {
    setErrorNotice(null);
    if (aiItems.length === 0) {
      setErrorNotice("Añade o mantén al menos un ingrediente para registrar.");
      return;
    }

    let registeredCount = 0;
    for (const item of aiItems) {
      const cleanName = item.name.trim() || "Alimento";
      const scaled = computeScaledMacros(item);
      if (scaled.grams <= 0) continue;

      const factorTo100g = 100 / scaled.grams;
      logFoodItem(
        {
          id: `ai-${item.id}`,
          name: cleanName,
          category: "Registro IA Validado",
          emoji: "🍽️",
          kcal: Math.round(scaled.kcal * factorTo100g * 10) / 10,
          protein: Math.round(scaled.protein * factorTo100g * 10) / 10,
          carbs: Math.round(scaled.carbs * factorTo100g * 10) / 10,
          fats: Math.round(scaled.fat * factorTo100g * 10) / 10,
        },
        scaled.grams
      );
      registeredCount += 1;
    }

    if (registeredCount === 0) {
      setErrorNotice("Verifica que las porciones tengan un gramaje mayor a 0 g.");
      return;
    }

    if (isPartialLog) {
      const todayIso = new Date().toISOString().slice(0, 10);
      logDailyTelemetry({ date: todayIso, isPartialLog: true });
    }

    setAiItems([]);
    setGlycemicTip(null);
    setAiDescriptionText("");
    setPhotoHintText("");
    setCompressedImage(null);
    setFeedback(
      `Confirmados ${registeredCount} ingredientes${
        isPartialLog ? " (marcados como registro parcial)." : "."
      }`
    );
  };

  const handleSaveHabits = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    const h = parseLocaleNumber(sleepDraft);
    const s = parseLocaleInt(stepsDraft);

    if (h === null || h <= 0 || h > 16) {
      setErrorNotice("Ingresa horas de sueño entre 1 y 16.");
      return;
    }
    if (s === null || s < 0 || s > 80000) {
      setErrorNotice("Ingresa pasos diarios válidos (0–80.000).");
      return;
    }
    logSleepHours(h);
    updateDailySteps(s);
    setFeedback(`Guardado: ${h} h de sueño y ${s.toLocaleString("es-ES")} pasos.`);
  };

  const handleNativeHealthSync = async () => {
    setErrorNotice(null);
    setFeedback(null);
    setIsHealthSyncing(true);
    try {
      const result = await syncNativeHealthData();
      setHealthSyncNotice(result.message);
      if (result.status === "synced") {
        if (result.steps !== null) {
          setStepsDraft(String(result.steps));
          updateDailySteps(result.steps);
        }
        if (result.sleepHours !== null) {
          setSleepDraft(String(result.sleepHours));
          logSleepHours(result.sleepHours);
        }
        setFeedback("Lecturas nativas aplicadas al motor clínico.");
      }
    } finally {
      setIsHealthSyncing(false);
    }
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
            className="relative z-10 w-full max-w-lg max-h-[88dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Registro rápido diario
                </h2>
                <p className="text-xs text-slate-600">
                  Telemetría clínica, IA nutricional validada y salud nativa.
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
                      setErrorNotice(null);
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

            {/* Tab 2: Comida (Rápido / Etiqueta / AI Describe / Photo Detect + Portion Validation) */}
            {activeTab === "comida" && (
              <div className="space-y-3.5">
                {/* 4 Food Sub-Mode Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: "rapido" as const, label: "Rápido", Icon: Utensils },
                    { id: "etiqueta" as const, label: "Etiqueta", Icon: Tag },
                    { id: "ai_describe" as const, label: "AI Describe", Icon: Sparkles },
                    { id: "photo_detect" as const, label: "Photo Detect", Icon: Camera },
                  ].map(({ id, label, Icon }) => {
                    const selected = foodSubMode === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setFoodSubMode(id);
                          setErrorNotice(null);
                          setFeedback(null);
                        }}
                        className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl border px-2 text-[11px] font-bold transition-colors cursor-pointer ${
                          selected
                            ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Icon size={13} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-mode A: Quick Food */}
                {foodSubMode === "rapido" && (
                  <form onSubmit={handleSaveQuickFood} className="space-y-3">
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
                  </form>
                )}

                {/* Sub-mode B: Packaged Food Label */}
                {foodSubMode === "etiqueta" && (
                  <form onSubmit={handleSaveLabelFood} className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className="sm:col-span-2 flex flex-col gap-1 text-xs font-bold text-slate-700">
                        Producto / Código EAN
                        <input
                          type="text"
                          value={labelName}
                          onChange={(e) => setLabelName(e.target.value)}
                          placeholder="Ej. Yogur Proteico 20g"
                          className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
                        Porción (g)
                        <input
                          type="text"
                          inputMode="decimal"
                          value={labelGrams}
                          onChange={(e) => setLabelGrams(e.target.value)}
                          className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-mono font-bold text-slate-900"
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-700">
                        kcal
                        <input
                          type="text"
                          inputMode="decimal"
                          value={labelKcal}
                          onChange={(e) => setLabelKcal(e.target.value)}
                          placeholder="140"
                          className="min-h-[42px] rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-mono font-bold text-slate-900"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-700">
                        Prot (g)
                        <input
                          type="text"
                          inputMode="decimal"
                          value={labelProtein}
                          onChange={(e) => setLabelProtein(e.target.value)}
                          placeholder="15"
                          className="min-h-[42px] rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-mono font-bold text-slate-900"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-700">
                        Carbs (g)
                        <input
                          type="text"
                          inputMode="decimal"
                          value={labelCarbs}
                          onChange={(e) => setLabelCarbs(e.target.value)}
                          placeholder="8"
                          className="min-h-[42px] rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-mono font-bold text-slate-900"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-700">
                        Grasas (g)
                        <input
                          type="text"
                          inputMode="decimal"
                          value={labelFat}
                          onChange={(e) => setLabelFat(e.target.value)}
                          placeholder="3"
                          className="min-h-[42px] rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-mono font-bold text-slate-900"
                        />
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
                    >
                      <Check size={16} />
                      <span>Registrar Producto Envasado</span>
                    </button>
                  </form>
                )}

                {/* Sub-mode C: AI Describe (Text + Optional Voice Dictation) */}
                {foodSubMode === "ai_describe" && (
                  <div className="space-y-2.5">
                    <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
                      Describe tu comida en lenguaje natural
                      <textarea
                        rows={3}
                        value={aiDescriptionText}
                        onChange={(e) => setAiDescriptionText(e.target.value)}
                        placeholder="Ej. Dos huevos revueltos con una cucharadita de aceite de oliva, dos rebanadas de pan integral y café con leche"
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                      />
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleDictation}
                        disabled={isAiLoading}
                        title={
                          isSpeechRecognitionSupported()
                            ? "Dictar con micrófono"
                            : "Dictado no disponible en este navegador"
                        }
                        className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold cursor-pointer ${
                          isListening
                            ? "border-rose-300 bg-rose-50 text-rose-700"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                        <span>{isListening ? "Detener" : "Dictar"}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isAiLoading}
                        onClick={handleAnalyzeDescription}
                        className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold disabled:opacity-60 cursor-pointer"
                      >
                        <Sparkles size={15} />
                        <span>
                          {isAiLoading
                            ? "Desglosando ingredientes..."
                            : "Analizar con Gemini IA"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-mode D: Photo Detect (Canvas Compression 1024px) */}
                {foodSubMode === "photo_detect" && (
                  <div className="space-y-2.5">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoFileSelected}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50/70 px-4 py-3 text-xs font-bold text-sky-800 hover:bg-sky-100/70 cursor-pointer"
                    >
                      <Camera size={16} />
                      <span>
                        {compressedImage
                          ? `Cambiar foto (${compressedImage.sizeKB} KB JPEG)`
                          : "Tomar foto o subir imagen del plato"}
                      </span>
                    </button>

                    {compressedImage && (
                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
                        <img
                          src={compressedImage.previewDataUrl}
                          alt="Vista previa de plato comprimido"
                          className="size-16 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900">
                            Imagen optimizada ({compressedImage.sizeKB} KB)
                          </p>
                          <input
                            type="text"
                            value={photoHintText}
                            onChange={(e) => setPhotoHintText(e.target.value)}
                            placeholder="Opcional: ej. 'con 1 cda de aceite'"
                            className="mt-1 w-full min-h-[34px] rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isAiLoading || !compressedImage}
                      onClick={handleAnalyzePhoto}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles size={15} />
                      <span>
                        {isAiLoading ? "Analizando fotografía..." : "Analizar Plato con IA"}
                      </span>
                    </button>
                  </div>
                )}

                {/* Mandatory Tactile Portion Validation Panel */}
                {aiItems.length > 0 && (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-900">
                        Validar porciones antes de guardar
                      </span>
                      <button
                        type="button"
                        onClick={handleAddManualIngredientRow}
                        className="min-h-[34px] rounded-lg border border-indigo-200 bg-white px-2.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                      >
                        + Añadir ingrediente
                      </button>
                    </div>

                    {glycemicTip && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 leading-relaxed">
                        <span className="font-extrabold">Tip glucémico: </span>
                        {glycemicTip}
                      </div>
                    )}

                    <div className="space-y-2.5">
                      {aiItems.map((item) => {
                        const scaled = computeScaledMacros(item);
                        const conf = CONFIDENCE_STYLE[item.confidence];
                        return (
                          <div
                            key={item.id}
                            className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <input
                                type="text"
                                aria-label="Nombre del ingrediente"
                                value={item.name}
                                onChange={(e) =>
                                  handleUpdateAiItem(item.id, { name: e.target.value })
                                }
                                className="flex-1 min-h-[34px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-900"
                              />
                              <button
                                type="button"
                                aria-label={`Eliminar ${item.name}`}
                                onClick={() =>
                                  setAiItems((prev) =>
                                    prev.filter((row) => row.id !== item.id)
                                  )
                                }
                                className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${conf.className}`}
                              >
                                {conf.label} · {item.servingLabel}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-slate-700">
                                {scaled.kcal} kcal · P {scaled.protein}g · C{" "}
                                {scaled.carbs}g · G {scaled.fat}g
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                                <span>g:</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={item.gramsDraft}
                                  onChange={(e) =>
                                    handleUpdateAiItem(item.id, {
                                      gramsDraft: e.target.value,
                                    })
                                  }
                                  className="w-16 min-h-[36px] rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-mono font-bold text-slate-900"
                                />
                              </label>
                              {!item.isCustomEditable &&
                                MULTIPLIER_PRESETS.map((mult) => (
                                  <button
                                    key={mult}
                                    type="button"
                                    onClick={() => handleApplyMultiplier(item.id, mult)}
                                    className={`min-h-[36px] rounded-lg border px-2 text-[11px] font-mono font-bold cursor-pointer ${
                                      item.multiplier === mult
                                        ? "border-indigo-500 bg-indigo-600 text-white"
                                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                    }`}
                                  >
                                    {mult}x
                                  </button>
                                ))}
                            </div>

                            {item.isCustomEditable && (
                              <div className="grid grid-cols-4 gap-1.5 pt-1">
                                {[
                                  { k: "customKcalDraft" as const, lbl: "kcal" },
                                  { k: "customProteinDraft" as const, lbl: "P(g)" },
                                  { k: "customCarbsDraft" as const, lbl: "C(g)" },
                                  { k: "customFatDraft" as const, lbl: "G(g)" },
                                ].map(({ k, lbl }) => (
                                  <label
                                    key={k}
                                    className="flex flex-col text-[10px] font-bold text-slate-600"
                                  >
                                    {lbl}
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={item[k] || "0"}
                                      onChange={(e) =>
                                        handleUpdateAiItem(item.id, { [k]: e.target.value })
                                      }
                                      className="min-h-[34px] rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-mono font-bold text-slate-900"
                                    />
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 flex items-center justify-between text-xs font-mono font-extrabold text-slate-900">
                      <span>Total validado:</span>
                      <span>
                        {aiTotals.calories} kcal · P {aiTotals.protein}g · C{" "}
                        {aiTotals.carbs}g · G {aiTotals.fat}g
                      </span>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPartialLog}
                        onChange={(e) => setIsPartialLog(e.target.checked)}
                        className="size-4 rounded border-slate-300"
                      />
                      <span>
                        Marcar como registro parcial (excluye este día del ajuste TDEE)
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={handleConfirmValidatedMeal}
                      className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold cursor-pointer"
                    >
                      <Check size={16} />
                      <span>Confirmar y registrar</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Sueño y Pasos + Native Health Adapter */}
            {activeTab === "habitos" && (
              <form onSubmit={handleSaveHabits} className="space-y-3">
                <button
                  type="button"
                  disabled={isHealthSyncing}
                  onClick={handleNativeHealthSync}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-extrabold disabled:opacity-60 cursor-pointer"
                >
                  <Activity size={15} />
                  <span>
                    {isHealthSyncing
                      ? "Consultando Salud Nativa..."
                      : "Sincronizar Pasos y Sueño (Health Connect / HealthKit)"}
                  </span>
                </button>

                {healthSyncNotice && (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                    {healthSyncNotice}
                  </p>
                )}

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

            {errorNotice && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 flex items-start gap-2"
              >
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 space-y-1.5">
                  <p>{errorNotice}</p>
                  {activeTab === "comida" &&
                    (foodSubMode === "ai_describe" || foodSubMode === "photo_detect") && (
                      <button
                        type="button"
                        onClick={() => {
                          setFoodSubMode("rapido");
                          setErrorNotice(null);
                        }}
                        className="rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-800 hover:bg-rose-100 cursor-pointer"
                      >
                        Cambiar a registro rápido manual
                      </button>
                    )}
                </div>
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
