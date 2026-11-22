/**
 * Salud Integral Enterprise V5 — Cloud Functions (v2)
 * Hermetic Serverless Proxy for Autonomous Telemetry Orchestrator (ATO)
 * Region: europe-west1
 * Secrets: GEMINI_API_KEY (Google Cloud Secret Manager / Cloud Functions Secrets)
 */

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

// ── Secret Definition ─────────────────────────────────────────────────────────
// Bound via Secret Manager; never check in or store in functions/.env
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

// ── CORS Helper ───────────────────────────────────────────────────────────────
function getAllowedOrigin(origin?: string): string | null {
  if (!origin) return null;

  const envOrigin = process.env.ALLOWED_ORIGIN;
  if (envOrigin && origin === envOrigin) {
    return origin;
  }

  // Allowed specific origins
  const exactAllowed = [
    "https://saludintegral.app",
    "capacitor://localhost",
    "http://localhost:5173",
    "http://localhost:3000",
  ];
  if (exactAllowed.includes(origin)) {
    return origin;
  }

  // Allowed domain suffixes (Firebase Hosting & Cloud Run)
  if (
    origin.endsWith(".web.app") ||
    origin.endsWith(".firebaseapp.com") ||
    origin.endsWith(".run.app")
  ) {
    return origin;
  }

  return null;
}

// ── Clinical System Prompt & JSON Schema (100% Spanish) ───────────────────────
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
  description: "Directiva clínica de telemetría neuroendocrina y deportiva redactada estrictamente en español",
  properties: {
    axisStatus: {
      type: "STRING",
      enum: ["OPTIMAL", "FUNCTIONAL_DOMINANT", "SUPPRESSED_WARNING", "CRITICAL_RESET"],
      description: "Estado funcional del eje hipotálamo-hipofisario-gonadal",
    },
    clinicalSummary: {
      type: "STRING",
      description: "Resumen diagnóstico y prescripción fisiológica redactada estrictamente en español",
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
      description: "Alertas y recomendaciones clínicas de suplementación redactadas estrictamente en español",
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

// ── Cloud Function v2 Export ──────────────────────────────────────────────────
export const atoProxy = onRequest(
  {
    region: "europe-west1",
    secrets: [geminiApiKey],
  },
  async (req, res) => {
    // 1. CORS Validation & Headers
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
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed. Only POST is accepted." });
      return;
    }

    // 2. Secret Resolution (defineSecret or process.env fallback)
    const apiKey = geminiApiKey.value() || process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      console.error("[atoProxy] GEMINI_API_KEY secret is unconfigured or empty.");
      res.status(503).json({
        error: "Server Configuration Error: GEMINI_API_KEY secret is not configured.",
      });
      return;
    }

    // 3. Payload Validation
    const body = req.body as Partial<ATOInputPayload> | undefined;
    if (!body || !body.labs || typeof body.energyAvailability !== "number" || !body.profile) {
      res.status(400).json({
        error: "Invalid request payload. Expected { labs, energyAvailability, profile }.",
      });
      return;
    }

    // 4. Model Cascade Setup
    const configuredModel = process.env.GEMINI_MODEL;
    const DEFAULT_CASCADE = [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
    ];
    const modelCascade = configuredModel
      ? [configuredModel, ...DEFAULT_CASCADE.filter((m) => m !== configuredModel)]
      : DEFAULT_CASCADE;

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

    let directive: any = null;
    let lastError: any = null;

    // 5. Cascade Execution
    for (const model of modelCascade) {
      const modelStartTime = Date.now();
      try {
        console.log(`[atoProxy] Attempting inference with model: ${model}`);
        const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), 12000);

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
          console.warn(`[atoProxy] Model ${model} returned HTTP ${errStatus} in ${Date.now() - modelStartTime}ms: ${errText.slice(0, 150)}`);
          lastError = new Error(`Model ${model} HTTP status ${errStatus}`);
          continue;
        }

        const data: any = await response.json();
        const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
          console.warn(`[atoProxy] Model ${model} returned empty candidate text in ${Date.now() - modelStartTime}ms`);
          lastError = new Error(`Model ${model} returned empty content`);
          continue;
        }

        const parsed = JSON.parse(textContent);
        if (!parsed.axisStatus || !parsed.clinicalSummary) {
          console.warn(`[atoProxy] Model ${model} produced incomplete payload in ${Date.now() - modelStartTime}ms`);
          lastError = new Error(`Model ${model} produced incomplete payload`);
          continue;
        }

        console.log(`[atoProxy] Model ${model} succeeded in ${Date.now() - modelStartTime}ms`);

        directive = {
          ...parsed,
          _source: "gemini_proxy",
          _model: model,
          _timestamp: Date.now(),
        };
        break; // Successfully obtained directive
      } catch (err: any) {
        console.warn(`[atoProxy] Model ${model} failed after ${Date.now() - modelStartTime}ms:`, err.message || err);
        lastError = err;
      }
    }

    if (!directive) {
      res.status(502).json({
        error: "All Gemini models in cascade failed to generate directive.",
        details: lastError?.message || "Cascade exhausted",
      });
      return;
    }

    res.status(200).json({ directive });
  }
);
