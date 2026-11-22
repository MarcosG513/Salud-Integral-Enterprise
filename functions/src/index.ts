/**
 * Salud Integral Enterprise — Cloud Functions (v2)
 * Hermetic Serverless Proxies for:
 *  1) atoProxy (/api/ato)
 *  2) nutritionVisionProxy (/api/nutrition-vision)
 * Region: europe-west1
 * Runtime: Node.js 22
 * Secrets: GEMINI_API_KEY (Google Cloud Secret Manager)
 */

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

// ── Secret Definition ─────────────────────────────────────────────────────────
// Bound via Secret Manager; never store keys in functions/.env
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// ── Types ─────────────────────────────────────────────────────────────────────
interface ATOInputPayload {
  labs: {
    lh: number;
    fsh: number;
    testosterone: number;
    shbg: number;
    cortisol: number;
    prolactina?: number;
    estradiol?: number;
  };
  energyAvailability: number;
  profile: {
    age: number;
    bodyFat: number;
    activityFactor: number;
    mesocycleWeek: number;
    deficitTarget: number;
    cnsReadiness: number;
    weightLogs: number[];
  };
}

interface NutritionVisionInputPayload {
  mode: "describe" | "photo";
  text?: string;
  imageBase64?: string;
  mimeType?: string;
}

interface RawNutritionItem {
  name?: unknown;
  estimatedGrams?: unknown;
  servingLabel?: unknown;
  calories?: unknown;
  protein?: unknown;
  carbs?: unknown;
  fat?: unknown;
  confidence?: unknown;
}

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/webp",
  "image/png",
]);

const DEFAULT_MODEL_CASCADE = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
];

// ── Shared CORS, Endpoint & Model Helpers ─────────────────────────────────────
function getAllowedOrigin(origin?: string): string | null {
  if (!origin) return null;

  const envOrigin = process.env.ALLOWED_ORIGIN;
  if (envOrigin && origin === envOrigin) {
    return origin;
  }

  const exactAllowed = [
    "https://salud-integral-enterprise.web.app",
    "https://saludintegral.app",
    "capacitor://localhost",
    "http://localhost:5173",
    "http://localhost:3000",
  ];
  if (exactAllowed.includes(origin)) {
    return origin;
  }

  if (
    origin.endsWith(".web.app") ||
    origin.endsWith(".firebaseapp.com") ||
    origin.endsWith(".run.app")
  ) {
    return origin;
  }

  return null;
}

function applyCorsAndValidateMethod(
  req: { headers: Record<string, unknown>; method?: string },
  res: {
    setHeader: (name: string, value: string) => void;
    status: (code: number) => any;
  },
  fnName: string
): string | null {
  const reqOrigin = req.headers.origin as string | undefined;
  const allowedOrigin = getAllowedOrigin(reqOrigin);

  if (allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "86400");
  }

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return null;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed. Only POST is accepted." });
    return null;
  }

  const apiKey = geminiApiKey.value() || process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    console.error(`[${fnName}] GEMINI_API_KEY secret is unconfigured or empty.`);
    res.status(503).json({
      error: "Server Configuration Error: GEMINI_API_KEY secret is not configured.",
    });
    return null;
  }

  return apiKey;
}

/**
 * Dual endpoint adapter supporting Vertex AI Express ("AQ.") & Google AI Studio keys
 */
function buildGeminiEndpointUrl(model: string, apiKey: string): string {
  const encodedKey = encodeURIComponent(apiKey);
  if (apiKey.startsWith("AQ.")) {
    return `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent?key=${encodedKey}`;
  }
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodedKey}`;
}

function getModelCascade(): string[] {
  const configuredModel = process.env.GEMINI_MODEL;
  return configuredModel
    ? [configuredModel, ...DEFAULT_MODEL_CASCADE.filter((m) => m !== configuredModel)]
    : DEFAULT_MODEL_CASCADE;
}

async function runGeminiJsonCascade<T>(
  fnName: string,
  apiKey: string,
  requestPayload: unknown,
  timeoutMs: number,
  validateParsed: (parsed: any) => T | null
): Promise<{ data?: T; model?: string; lastError?: any }> {
  const modelCascade = getModelCascade();
  let lastError: any = null;

  for (const model of modelCascade) {
    const modelStartTime = Date.now();
    try {
      console.log(`[${fnName}] Attempting inference with model: ${model}`);
      const endpointUrl = buildGeminiEndpointUrl(model, apiKey);

      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), timeoutMs);

      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
        signal: abortController.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errStatus = response.status;
        const errText = await response.text();
        console.warn(
          `[${fnName}] Model ${model} returned HTTP ${errStatus} in ${Date.now() - modelStartTime}ms: ${errText.slice(0, 150)}`
        );
        lastError = new Error(`Model ${model} HTTP status ${errStatus}`);
        continue;
      }

      const rawJson: any = await response.json();
      const textContent = rawJson?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textContent || typeof textContent !== "string") {
        console.warn(
          `[${fnName}] Model ${model} returned empty candidate text in ${Date.now() - modelStartTime}ms`
        );
        lastError = new Error(`Model ${model} returned empty content`);
        continue;
      }

      const parsed = JSON.parse(textContent);
      const validated = validateParsed(parsed);
      if (!validated) {
        console.warn(
          `[${fnName}] Model ${model} produced incomplete payload in ${Date.now() - modelStartTime}ms`
        );
        lastError = new Error(`Model ${model} produced incomplete payload`);
        continue;
      }

      console.log(
        `[${fnName}] Model ${model} succeeded in ${Date.now() - modelStartTime}ms`
      );
      return { data: validated, model };
    } catch (err: any) {
      console.warn(
        `[${fnName}] Model ${model} failed after ${Date.now() - modelStartTime}ms:`,
        err?.message || err
      );
      lastError = err;
    }
  }

  return { lastError };
}

// ── ATO Prompt & Schema (100% Spanish) ────────────────────────────────────────
const CLINICAL_SYSTEM_PROMPT = `Eres el Autonomous Telemetry Orchestrator (ATO), un médico especialista y fisiólogo clínico endocrino-deportivo de IA para Salud Integral Enterprise.
Tu misión es analizar la telemetría neuroendocrina (LH, FSH, Testosterona Total, SHBG, Cortisol, Prolactina, Estradiol), la Disponibilidad Energética (EA en kcal/kg FFM/día) y el perfil de entrenamiento y recuperación del usuario para prescribir micro-ajustes adaptativos y alertas clínicas personalizadas.

REGLA DE IDIOMA INQUEBRANTABLE (OBLIGATORIA):
RESPONDE SIEMPRE EN ESPAÑOL (es-CO/es-ES) claro, técnico, empático y cercano. Todos los campos de texto libre ('clinicalSummary', alertas nutricionales y de suplementación en 'supplementAlerts') DEBEN redactarse estrictamente en español. NUNCA devuelvas frases, palabras o párrafos en inglés.

Directrices Clínicas de Interpretación:
1. axisStatus:
   - "OPTIMAL": Testosterona en rango óptimo, Cortisol bajo/medio, LH normal, EA >= 35 kcal/kg FFM.
   - "FUNCTIONAL_DOMINANT": Fatiga acumulada, cortisol matutino elevado (>18 µg/dL), EA marginal (30-35 kcal/kg FFM) o estradiol elevado (>40 pg/mL).
   - "SUPPRESSED_WARNING": Hipogonadismo funcional subclínico, prolactina elevada (>18 ng/mL), ratio Cortisol/Testosterona desfavorable, EA baja (25-30 kcal/kg FFM).
   - "CRITICAL_RESET": Estado de RED-S severo / Supresión Hipotalámica Hipogonadotrópica (Testosterona < 300 ng/dL, LH < 1.5 UI/L o EA < 25 kcal/kg FFM).
2. nutritionPatch:
   - carbMultiplierBonus: entre -0.05 y +0.35 (incrementar carbohidratos en supresión/reset para restaurar la conversión de T3 y leptina).
   - recommendedDeficitSurplus: ajuste calórico recomendado (0 para eliminar el déficit en estados críticos de reset, o negativo si el corte calórico es seguro).
3. trainingPatch:
   - volumeMode: "MEV" (Volumen Mínimo Efectivo), "MAV" (Volumen Máximo Adaptativo), "MRV" (Volumen Máximo Recuperable) o "DELOAD" (Descarga).
   - intensityCapRIR: límite recomendado de Repeticiones en Reserva (ej. RIR 2-3 en fatiga, RIR 1-2 en óptimo).
   - deloadSuggested: true si se requiere descarga programada de recuperación.
4. supplementAlerts:
   - Lista de recomendaciones clínicas breves y específicas en español (ej. modulación de cortisol con Ashwagandha KSM-66, soporte del SNC con magnesio, higiene de sueño o sincronización de carbohidratos perientrenamiento).

Tu salida DEBE ser estrictamente un objeto JSON válido que cumpla con el esquema definido.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  description:
    "Directiva clínica de telemetría neuroendocrina y deportiva redactada estrictamente en español",
  properties: {
    axisStatus: {
      type: "STRING",
      enum: [
        "OPTIMAL",
        "FUNCTIONAL_DOMINANT",
        "SUPPRESSED_WARNING",
        "CRITICAL_RESET",
      ],
      description: "Estado funcional del eje hipotálamo-hipofisario-gonadal",
    },
    clinicalSummary: {
      type: "STRING",
      description:
        "Resumen diagnóstico y prescripción fisiológica redactada estrictamente en español",
    },
    nutritionPatch: {
      type: "OBJECT",
      description: "Ajuste prescrito de macronutrientes y balance calórico",
      properties: {
        carbMultiplierBonus: {
          type: "NUMBER",
          description: "Multiplicador de ajuste en carbohidratos (-0.05 a +0.35)",
        },
        recommendedDeficitSurplus: {
          type: "NUMBER",
          description: "Ajuste calórico en kcal prescrito (ej. 0 o valor negativo)",
        },
      },
      required: ["carbMultiplierBonus", "recommendedDeficitSurplus"],
    },
    trainingPatch: {
      type: "OBJECT",
      description: "Ajuste adaptativo de volumen e intensidad de entrenamiento",
      properties: {
        volumeMode: {
          type: "STRING",
          enum: ["MEV", "MAV", "MRV", "DELOAD"],
          description: "Modo de volumen del mesociclo (MEV, MAV, MRV, DELOAD)",
        },
        intensityCapRIR: {
          type: "NUMBER",
          description: "Tope de intensidad en Repeticiones en Reserva (RIR)",
        },
        deloadSuggested: {
          type: "BOOLEAN",
          description: "Indica si se prescribe una descarga de recuperación",
        },
      },
      required: ["volumeMode", "intensityCapRIR", "deloadSuggested"],
    },
    supplementAlerts: {
      type: "ARRAY",
      description:
        "Alertas y recomendaciones clínicas de suplementación redactadas estrictamente en español",
      items: { type: "STRING" },
    },
  },
  required: [
    "axisStatus",
    "clinicalSummary",
    "nutritionPatch",
    "trainingPatch",
    "supplementAlerts",
  ],
};

// ── Nutrition Vision Prompt & Schema (100% Spanish) ───────────────────────────
const NUTRITION_SYSTEM_PROMPT = `Eres un nutricionista clínico y bioquímico deportivo de IA para Salud Integral Enterprise.
Tu tarea es desglosar comidas descritas en texto o fotografiadas ingrediente por ingrediente (razonamiento paso a paso por componente: fuente proteica, base de carbohidratos, grasas/aceites ocultos o salsas y acompañamientos/bebidas) para minimizar errores en platos compuestos.

REGLAS OBLIGATORIAS:
1. IDIOMA ESTRICTO: Responde SIEMPRE en ESPAÑOL claro, práctico y sin juicios morales ni tonos punitivos.
2. DESGLOSE POR INGREDIENTE: Nunca agrupes un plato complejo como un único ítem genérico si puedes separar sus ingredientes visibles o mencionados (ej. "Pechuga de pollo a la plancha", "Arroz blanco cocido", "Aceite de oliva de cocción").
3. CONFIANZA HONESTA (confidence):
   - "high": peso o porción exacta descrita explícitamente (ej. "150g de pechuga y 80g de arroz") o envase claro.
   - "medium": porción casera estándar o foto con referencia clara de plato/mano/cubierto.
   - "low": descripción ambigua ("un plato de pasta") o fotografía sin referencia de escala/tamaño ni claridad de aceites ocultos.
4. VALIDACIÓN TÁCTIL SIEMPRE ACTIVA: Marca siempre "requiresPortionCheck": true para que el usuario revise y ajuste los gramos antes de guardar.
5. CONSEJO GLUCÉMICO: Incluye en "glycemicTip" un consejo práctico y empático de 1 a 2 frases sobre secuencia de ingesta (fibra/proteína primero), saciedad o caminata ligera postprandial de 10 minutos.

Devuelve estrictamente JSON válido según el esquema.`;

const NUTRITION_RESPONSE_SCHEMA = {
  type: "OBJECT",
  description:
    "Desglose nutricional por ingredientes con tip glucémico redactado estrictamente en español",
  properties: {
    items: {
      type: "ARRAY",
      description: "Lista de ingredientes desglosados con estimación de porción y macros totales para esa porción",
      items: {
        type: "OBJECT",
        properties: {
          name: {
            type: "STRING",
            description: "Nombre del ingrediente en español",
          },
          estimatedGrams: {
            type: "NUMBER",
            description: "Peso estimado de la porción en gramos (>0)",
          },
          servingLabel: {
            type: "STRING",
            description: "Etiqueta de porción legible (ej. '1 plato hondo (~250 g)', '1 cda (~10 g)')",
          },
          calories: {
            type: "NUMBER",
            description: "Calorías totales de esa porción estimada (kcal)",
          },
          protein: {
            type: "NUMBER",
            description: "Proteína total de esa porción (g)",
          },
          carbs: {
            type: "NUMBER",
            description: "Carbohidratos totales de esa porción (g)",
          },
          fat: {
            type: "NUMBER",
            description: "Grasas totales de esa porción (g)",
          },
          confidence: {
            type: "STRING",
            enum: ["high", "medium", "low"],
            description: "Nivel de confianza de la estimación de porción",
          },
        },
        required: [
          "name",
          "estimatedGrams",
          "servingLabel",
          "calories",
          "protein",
          "carbs",
          "fat",
          "confidence",
        ],
      },
    },
    glycemicTip: {
      type: "STRING",
      description: "Consejo glucémico práctico y breve de 1-2 frases en español",
    },
    requiresPortionCheck: {
      type: "BOOLEAN",
      description: "Siempre true para requerir validación táctil del usuario",
    },
  },
  required: ["items", "glycemicTip", "requiresPortionCheck"],
};

function sanitizeNutritionItems(rawItems: RawNutritionItem[]) {
  return rawItems
    .filter((item) => item && typeof item.name === "string" && item.name.trim().length > 0)
    .slice(0, 15)
    .map((item) => {
      const gramsRaw = Number(item.estimatedGrams);
      const estimatedGrams =
        Number.isFinite(gramsRaw) && gramsRaw > 0
          ? Math.min(3000, Math.max(1, Math.round(gramsRaw)))
          : 100;

      const toMacro = (v: unknown) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0;
      };

      const confRaw = typeof item.confidence === "string" ? item.confidence : "medium";
      const confidence =
        confRaw === "high" || confRaw === "medium" || confRaw === "low"
          ? confRaw
          : "medium";

      return {
        name: String(item.name).trim().slice(0, 120),
        estimatedGrams,
        servingLabel:
          typeof item.servingLabel === "string" && item.servingLabel.trim().length > 0
            ? item.servingLabel.trim().slice(0, 80)
            : `${estimatedGrams} g`,
        calories: Math.round(toMacro(item.calories)),
        protein: toMacro(item.protein),
        carbs: toMacro(item.carbs),
        fat: toMacro(item.fat),
        confidence,
      };
    });
}

// ── Cloud Function v2: atoProxy ───────────────────────────────────────────────
export const atoProxy = onRequest(
  {
    region: "europe-west1",
    secrets: [geminiApiKey],
  },
  async (req, res) => {
    const apiKey = applyCorsAndValidateMethod(req, res, "atoProxy");
    if (!apiKey) return;

    const body = req.body as Partial<ATOInputPayload> | undefined;
    if (!body || !body.labs || typeof body.energyAvailability !== "number" || !body.profile) {
      res.status(400).json({
        error: "Invalid request payload. Expected { labs, energyAvailability, profile }.",
      });
      return;
    }

    const requestPayload = {
      system_instruction: {
        parts: [{ text: CLINICAL_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Evalúa la siguiente telemetría clínica del paciente y genera la Directiva ATO correspondiente estrictamente en español:\n${JSON.stringify(
                body,
                null,
                2
              )}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    };

    const outcome = await runGeminiJsonCascade(
      "atoProxy",
      apiKey,
      requestPayload,
      12000,
      (parsed) => {
        if (!parsed?.axisStatus || !parsed?.clinicalSummary) return null;
        return parsed;
      }
    );

    if (!outcome.data) {
      res.status(502).json({
        error: "All Gemini models in cascade failed to generate directive.",
        details: outcome.lastError?.message || "Cascade exhausted",
      });
      return;
    }

    res.status(200).json({
      directive: {
        ...outcome.data,
        _source: "gemini_proxy",
        _model: outcome.model,
        _timestamp: Date.now(),
      },
    });
  }
);

// ── Cloud Function v2: nutritionVisionProxy ───────────────────────────────────
export const nutritionVisionProxy = onRequest(
  {
    region: "europe-west1",
    secrets: [geminiApiKey],
    timeoutSeconds: 30,
    memory: "512MiB",
  },
  async (req, res) => {
    const apiKey = applyCorsAndValidateMethod(req, res, "nutritionVisionProxy");
    if (!apiKey) return;

    const body = req.body as Partial<NutritionVisionInputPayload> | undefined;
    if (!body || (body.mode !== "describe" && body.mode !== "photo")) {
      res.status(400).json({
        error: "Payload inválido. Se espera mode: 'describe' o 'photo'.",
      });
      return;
    }

    const mode = body.mode;
    const parts: Array<Record<string, unknown>> = [];

    if (mode === "describe") {
      const cleanText = typeof body.text === "string" ? body.text.trim() : "";
      if (!cleanText || cleanText.length > 1500) {
        res.status(400).json({
          error: "El modo 'describe' requiere un texto válido de 1 a 1500 caracteres.",
        });
        return;
      }

      parts.push({
        text: `Desglosa esta comida descrita por el usuario ingrediente por ingrediente (razonamiento paso a paso de proteínas, hidratos, grasas de cocción y guarniciones) en español y estima porciones realistas:\n"${cleanText}"`,
      });
    } else {
      const rawBase64 = typeof body.imageBase64 === "string" ? body.imageBase64.trim() : "";
      const cleanBase64 = rawBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
      if (!cleanBase64 || cleanBase64.length > 4_500_000) {
        res.status(400).json({
          error: "El modo 'photo' requiere imageBase64 válida (< 3.3 MB codificados).",
        });
        return;
      }

      const cleanMimeType =
        typeof body.mimeType === "string" && ALLOWED_IMAGE_MIME_TYPES.has(body.mimeType)
          ? body.mimeType
          : "image/jpeg";
      const hint =
        typeof body.text === "string" ? body.text.trim().slice(0, 500) : "";

      parts.push({
        inline_data: {
          mime_type: cleanMimeType,
          data: cleanBase64,
        },
      });
      parts.push({
        text: `Analiza esta fotografía de comida ingrediente por ingrediente en español. Si no hay referencia visual de tamaño/peso ni visibilidad de aceites o salsas, reduce 'confidence' a 'low' o 'medium' y marca 'requiresPortionCheck': true.${
          hint ? ` Nota adicional del usuario: "${hint}".` : ""
        }`,
      });
    }

    const requestPayload = {
      system_instruction: {
        parts: [{ text: NUTRITION_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: NUTRITION_RESPONSE_SCHEMA,
      },
    };

    const outcome = await runGeminiJsonCascade(
      "nutritionVisionProxy",
      apiKey,
      requestPayload,
      18000,
      (parsed) => {
        if (!Array.isArray(parsed?.items)) return null;
        const items = sanitizeNutritionItems(parsed.items as RawNutritionItem[]);
        if (items.length === 0) return null;
        const glycemicTip =
          typeof parsed.glycemicTip === "string" && parsed.glycemicTip.trim().length > 0
            ? parsed.glycemicTip.trim().slice(0, 320)
            : "Combina vegetales o fibra antes de los carbohidratos simples y prioriza una caminata suave de 10 minutos tras comer.";
        return {
          items,
          glycemicTip,
          requiresPortionCheck: true,
        };
      }
    );

    if (!outcome.data) {
      res.status(502).json({
        error: "No fue posible analizar la comida en la cascada de modelos Gemini.",
        details: outcome.lastError?.message || "Cascade exhausted",
      });
      return;
    }

    res.status(200).json({
      result: {
        ...outcome.data,
        requiresPortionCheck: true,
        _model: outcome.model,
        _mode: mode,
        _timestamp: Date.now(),
      },
    });
  }
);
