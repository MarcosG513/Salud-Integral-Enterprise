// ─────────────────────────────────────────────────────────────────────────────
// MULTIMODAL NUTRITION AI SERVICE (Hermetic Client -> Firebase Functions v2)
// Soporta AI Describe (texto/voz) y Photo Detect (compresión <canvas> 1024px)
// Exige siempre validación táctil de porciones antes de persistir en foodLogs.
// ─────────────────────────────────────────────────────────────────────────────

export type NutritionConfidence = "high" | "medium" | "low";

export interface NutritionAiItem {
  id: string;
  name: string;
  estimatedGrams: number;
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: NutritionConfidence;
}

export interface NutritionAiResponse {
  items: NutritionAiItem[];
  glycemicTip: string;
  requiresPortionCheck: true;
  _model?: string;
  _mode?: "describe" | "photo";
  _timestamp?: number;
}

export interface CompressedMealImage {
  base64: string;
  mimeType: "image/jpeg";
  previewDataUrl: string;
  sizeKB: number;
  width: number;
  height: number;
}

const NUTRITION_TIMEOUT_MS = 25_000;
const RETRY_DELAYS_MS = [600, 1400];

export function resolveNutritionProxyUrl(): string {
  const explicitUrl = import.meta.env.VITE_NUTRITION_PROXY_URL as string | undefined;
  if (explicitUrl && explicitUrl.trim().length > 0) {
    return explicitUrl.trim();
  }

  const atoUrl = import.meta.env.VITE_ATO_PROXY_URL as string | undefined;
  if (atoUrl && atoUrl.trim().length > 0) {
    const trimmed = atoUrl.trim();
    if (trimmed.includes("/api/ato")) {
      return trimmed.replace(/\/api\/ato\/?$/, "/api/nutrition-vision");
    }
    try {
      const parsed = new URL(trimmed);
      return `${parsed.origin}/api/nutrition-vision`;
    } catch {
      // fallback below
    }
  }

  return "/api/nutrition-vision";
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeClientItems(rawItems: any[]): NutritionAiItem[] {
  return rawItems
    .filter((item) => item && typeof item.name === "string" && item.name.trim().length > 0)
    .map((item, idx) => {
      const grams = Number(item.estimatedGrams);
      const safeGrams =
        Number.isFinite(grams) && grams > 0 ? Math.min(3000, Math.max(1, Math.round(grams))) : 100;
      const toNum = (v: unknown) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0;
      };
      const conf: NutritionConfidence =
        item.confidence === "high" || item.confidence === "medium" || item.confidence === "low"
          ? item.confidence
          : "medium";

      return {
        id: `ai-item-${Date.now()}-${idx}`,
        name: String(item.name).trim(),
        estimatedGrams: safeGrams,
        servingLabel:
          typeof item.servingLabel === "string" && item.servingLabel.trim().length > 0
            ? item.servingLabel.trim()
            : `${safeGrams} g`,
        calories: Math.round(toNum(item.calories)),
        protein: toNum(item.protein),
        carbs: toNum(item.carbs),
        fat: toNum(item.fat),
        confidence: conf,
      };
    });
}

async function postNutritionVision(
  payload: Record<string, unknown>
): Promise<NutritionAiResponse> {
  const endpoint = resolveNutritionProxyUrl();
  let lastError: Error = new Error("No fue posible contactar con el servicio nutricional IA.");

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NUTRITION_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if ((response.status === 429 || response.status === 503) && attempt < RETRY_DELAYS_MS.length) {
        await sleepMs(RETRY_DELAYS_MS[attempt]);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }

      const json = await response.json();
      const result = json?.result;
      if (!result || !Array.isArray(result.items)) {
        throw new Error("INVALID_NUTRITION_PAYLOAD");
      }

      const items = sanitizeClientItems(result.items);
      if (items.length === 0) {
        throw new Error("EMPTY_NUTRITION_ITEMS");
      }

      return {
        items,
        glycemicTip:
          typeof result.glycemicTip === "string" && result.glycemicTip.trim().length > 0
            ? result.glycemicTip.trim()
            : "Acompaña tus carbohidratos con proteína y fibra para suavizar el pico posprandial.",
        requiresPortionCheck: true,
        _model: typeof result._model === "string" ? result._model : undefined,
        _mode: result._mode === "photo" ? "photo" : "describe",
        _timestamp: typeof result._timestamp === "number" ? result._timestamp : Date.now(),
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") {
        lastError = new Error("Tiempo de espera agotado al analizar la comida.");
      } else if (err instanceof Error) {
        lastError = err;
      }
    }
  }

  throw lastError;
}

export async function analyzeMealDescription(
  text: string
): Promise<NutritionAiResponse> {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error("Describe al menos un alimento o plato para analizar.");
  }
  return postNutritionVision({
    mode: "describe",
    text: cleanText.slice(0, 1500),
  });
}

export async function analyzeMealPhoto(
  imageBase64: string,
  mimeType = "image/jpeg",
  hint?: string
): Promise<NutritionAiResponse> {
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "").trim();
  if (!cleanBase64) {
    throw new Error("Selecciona o captura una fotografía válida.");
  }
  return postNutritionVision({
    mode: "photo",
    imageBase64: cleanBase64,
    mimeType,
    text: hint ? hint.trim().slice(0, 500) : undefined,
  });
}

/**
 * Compresión segura de fotografía en cliente (<canvas>, máximo 1024px, JPEG 0.75)
 */
export async function compressImageForVision(
  file: File,
  maxDimension = 1024,
  quality = 0.75
): Promise<CompressedMealImage> {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("El archivo seleccionado no es una imagen válida.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo decodificar la imagen seleccionada."));
      image.src = objectUrl;
    });

    const scale = Math.min(1, maxDimension / Math.max(img.width || 1, img.height || 1));
    const targetWidth = Math.max(1, Math.round((img.width || 1) * scale));
    const targetHeight = Math.max(1, Math.round((img.height || 1) * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("El navegador no pudo inicializar el lienzo de compresión.");
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    let base64 = dataUrl.split(",")[1] || "";

    // Segundo paso si supera ~1.5 MB base64
    if (base64.length > 1_500_000) {
      dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      base64 = dataUrl.split(",")[1] || "";
    }

    if (base64.length > 3_800_000) {
      throw new Error("La fotografía es demasiado pesada incluso tras comprimirla.");
    }

    const sizeKB = Math.max(1, Math.round((base64.length * 3) / 4 / 1024));

    return {
      base64,
      mimeType: "image/jpeg",
      previewDataUrl: dataUrl,
      sizeKB,
      width: targetWidth,
      height: targetHeight,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// ── Dictado por Voz Web Speech API (con degradación limpia en WebViews) ──────
function getSpeechRecognitionConstructor(): (new () => any) | null {
  if (typeof window === "undefined") return null;
  const win = window as any;
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

export function startSpanishDictation(handlers: {
  onResult: (transcript: string) => void;
  onError: (message: string) => void;
  onEnd?: () => void;
}): { stop: () => void } | null {
  const Ctor = getSpeechRecognitionConstructor();
  if (!Ctor) {
    handlers.onError(
      "El dictado por voz no está disponible en este WebView o navegador. Escribe tu comida manualmente."
    );
    handlers.onEnd?.();
    return null;
  }

  try {
    const recognition = new Ctor();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript;
      if (typeof transcript === "string" && transcript.trim().length > 0) {
        handlers.onResult(transcript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      const code = event?.error || "unknown";
      if (code === "not-allowed" || code === "service-not-allowed") {
        handlers.onError("Permiso de micrófono denegado. Puedes escribir la descripción manualmente.");
      } else if (code !== "aborted") {
        handlers.onError("No se pudo capturar el dictado de voz. Intenta escribir tu comida.");
      }
    };

    recognition.onend = () => {
      handlers.onEnd?.();
    };

    recognition.start();
    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {}
      },
    };
  } catch {
    handlers.onError("Dictado por voz no compatible en este dispositivo.");
    handlers.onEnd?.();
    return null;
  }
}
