// ─────────────────────────────────────────────────────────────────────────────
// ATO Central Engine — Autonomous Telemetry Orchestrator
// Powered by: gemini-3.5-flash-lite
// Quota strategy: 15 RPM Free Tier — payload hash cache + 30s cooldown guard
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ATOInput {
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

export interface ATODirective {
  axisStatus: "OPTIMAL" | "FUNCTIONAL_DOMINANT" | "SUPPRESSED_WARNING" | "CRITICAL_RESET";
  clinicalSummary: string;
  nutritionPatch: {
    carbMultiplierBonus: number;
    recommendedDeficitSurplus: number;
  };
  trainingPatch: {
    volumeMode: "MEV" | "MAV" | "MRV" | "DELOAD";
    intensityCapRIR: number;
    deloadSuggested: boolean;
  };
  supplementAlerts: string[];
  _source?: "gemini" | "cache" | "fallback";
  _timestamp?: number;
}

export interface ATOResult {
  directive: ATODirective | null;
  cooldownRemaining?: number; // ms remaining if cooldown is active
  error?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const COOLDOWN_MS = 30_000;          // 30 seconds between API calls
const CACHE_TTL_MS = 5 * 60_000;    // 5-minute cache TTL per payload hash
const LS_TIMESTAMP_KEY = "ato_last_call_timestamp";
const LS_CACHE_PREFIX = "ato_cache_";
const TIMEOUT_MS = 15_000;           // 15-second request timeout

// ── Payload Hashing (djb2 fast string hash) ───────────────────────────────────

function computeHash(input: ATOInput): string {
  const raw = JSON.stringify({
    labs: input.labs,
    energyAvailability: input.energyAvailability,
    profile: input.profile,
  });
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
    hash = hash & hash; // convert to 32-bit int
  }
  return (hash >>> 0).toString(16); // unsigned hex
}

// ── LocalStorage Cache Layer ───────────────────────────────────────────────────

function readCache(hash: string): ATODirective | null {
  try {
    const raw = localStorage.getItem(LS_CACHE_PREFIX + hash);
    if (!raw) return null;
    const cached: ATODirective = JSON.parse(raw);
    const age = Date.now() - (cached._timestamp ?? 0);
    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(LS_CACHE_PREFIX + hash);
      return null;
    }
    return { ...cached, _source: "cache" };
  } catch {
    return null;
  }
}

function writeCache(hash: string, directive: ATODirective): void {
  try {
    const toStore: ATODirective = { ...directive, _timestamp: Date.now(), _source: "gemini" };
    localStorage.setItem(LS_CACHE_PREFIX + hash, JSON.stringify(toStore));
  } catch {
    // localStorage full or disabled — silently skip caching
  }
}

// ── Cooldown Guard ─────────────────────────────────────────────────────────────

export function getCooldownRemaining(): number {
  try {
    const ts = Number(localStorage.getItem(LS_TIMESTAMP_KEY) ?? 0);
    const elapsed = Date.now() - ts;
    return Math.max(0, COOLDOWN_MS - elapsed);
  } catch {
    return 0;
  }
}

function stampCooldown(): void {
  try {
    localStorage.setItem(LS_TIMESTAMP_KEY, String(Date.now()));
  } catch {}
}

// ── Structured System Prompt ───────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are ATO — Autonomous Telemetry Orchestrator — a clinical AI engine embedded in a precision health dashboard. Your role is to analyze hormonal lab values, energy availability, and training profile data, then synthesize a concise clinical directive.

CRITICAL: Respond ONLY with a single JSON object. No markdown, no prose, no code fences — pure JSON only.

Output schema (strict):
{
  "axisStatus": "OPTIMAL" | "FUNCTIONAL_DOMINANT" | "SUPPRESSED_WARNING" | "CRITICAL_RESET",
  "clinicalSummary": "<string, max 120 chars, in Spanish>",
  "nutritionPatch": {
    "carbMultiplierBonus": <float, -0.5 to +0.5, adjustment to carb allocation>,
    "recommendedDeficitSurplus": <integer kcal, negative=deficit, positive=surplus>
  },
  "trainingPatch": {
    "volumeMode": "MEV" | "MAV" | "MRV" | "DELOAD",
    "intensityCapRIR": <integer 0-4, reps in reserve cap>,
    "deloadSuggested": <boolean>
  },
  "supplementAlerts": [<string array, max 3 items, in Spanish, each max 60 chars>]
}

Axis status logic:
- OPTIMAL: testosterone ≥ 550, cortisol ≤ 18, EA ≥ 35, CNS ≥ 75
- FUNCTIONAL_DOMINANT: testosterone 350-549, or cortisol 18-22, or EA 30-34
- SUPPRESSED_WARNING: testosterone 300-349, or cortisol > 22, or EA < 30
- CRITICAL_RESET: testosterone < 300, or LH < 1.5, or EA < 25

Respond now with the JSON directive based on the telemetry data provided.`;

// ── Gemini REST API Call ───────────────────────────────────────────────────────

async function callGeminiAPI(input: ATOInput, apiKey: string): Promise<ATODirective> {
  const userContent = `TELEMETRÍA CLÍNICA:
Laboratorio Hormonal:
  - LH: ${input.labs.lh} UI/L (ref: 1.7–8.6)
  - FSH: ${input.labs.fsh} UI/L (ref: 1.5–12.4)
  - Testosterona Total: ${input.labs.testosterone} ng/dL (ref: 300–1000)
  - SHBG: ${input.labs.shbg} nmol/L (ref: 10–57)
  - Cortisol: ${input.labs.cortisol} µg/dL (ref: 6–23)
  - Prolactina: ${input.labs.prolactina ?? "N/A"} ng/mL
  - Estradiol: ${input.labs.estradiol ?? "N/A"} pg/mL

Disponibilidad Energética: ${input.energyAvailability.toFixed(1)} kcal/kg FFM/día
Déficit calórico objetivo: ${input.profile.deficitTarget} kcal
Semana de mesociclo: ${input.profile.mesocycleWeek}/5
Preparación SNC: ${input.profile.cnsReadiness}%
Factor de actividad: ${input.profile.activityFactor}
Grasa corporal: ${input.profile.bodyFat}%
Edad: ${input.profile.age} años

Genera la directiva ATO ahora.`;

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userContent }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 512,
      responseMimeType: "application/json",
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (response.status === 429) {
      throw new Error("RATE_LIMIT_429");
    }

    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }

    const json = await response.json();
    const rawText: string =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/```json|```/gi, "").trim();
    const directive: ATODirective = JSON.parse(cleaned);

    // Validate required fields
    if (!directive.axisStatus || !directive.clinicalSummary) {
      throw new Error("INVALID_SCHEMA");
    }

    return directive;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Local Mathematical Fallback Heuristic Engine ──────────────────────────────
// Triggered when: 429, timeout, missing key, invalid JSON, or any throw.
// Computes directive purely from thresholds — zero API calls, zero crashes.

function computeFallbackDirective(input: ATOInput): ATODirective {
  const { labs, energyAvailability, profile } = input;

  // ─ Axis status ─
  let axisStatus: ATODirective["axisStatus"] = "OPTIMAL";
  if (labs.testosterone < 300 || labs.lh < 1.5 || energyAvailability < 25) {
    axisStatus = "CRITICAL_RESET";
  } else if (labs.testosterone < 350 || labs.cortisol > 22 || energyAvailability < 30) {
    axisStatus = "SUPPRESSED_WARNING";
  } else if (labs.testosterone < 550 || labs.cortisol > 18 || energyAvailability < 35) {
    axisStatus = "FUNCTIONAL_DOMINANT";
  }

  // ─ Nutrition patch ─
  let carbMultiplierBonus = 0.0;
  let recommendedDeficitSurplus = -profile.deficitTarget;

  if (axisStatus === "CRITICAL_RESET") {
    carbMultiplierBonus = 0.3;
    recommendedDeficitSurplus = 0; // eliminate deficit on critical
  } else if (axisStatus === "SUPPRESSED_WARNING") {
    carbMultiplierBonus = 0.15;
    recommendedDeficitSurplus = Math.round(-profile.deficitTarget * 0.5);
  } else if (axisStatus === "OPTIMAL") {
    carbMultiplierBonus = -0.05;
  }

  // ─ Training patch ─
  let volumeMode: ATODirective["trainingPatch"]["volumeMode"] = "MAV";
  let intensityCapRIR = 2;
  let deloadSuggested = false;

  if (axisStatus === "CRITICAL_RESET" || profile.mesocycleWeek >= 5) {
    volumeMode = "DELOAD";
    intensityCapRIR = 4;
    deloadSuggested = true;
  } else if (axisStatus === "SUPPRESSED_WARNING" || profile.cnsReadiness < 65) {
    volumeMode = "MEV";
    intensityCapRIR = 3;
  } else if (profile.mesocycleWeek >= 4) {
    volumeMode = "MRV";
    intensityCapRIR = 1;
  } else if (profile.mesocycleWeek >= 2) {
    volumeMode = "MAV";
    intensityCapRIR = 2;
  } else {
    volumeMode = "MEV";
    intensityCapRIR = 3;
  }

  // ─ Supplement alerts ─
  const supplementAlerts: string[] = [];
  if (labs.cortisol > 20) supplementAlerts.push("Cortisol elevado: aumentar KSM-66 a 900mg");
  if (labs.testosterone < 400) supplementAlerts.push("Testosterona baja: priorizar Zinc + D3");
  if (energyAvailability < 30) supplementAlerts.push("EA crítica: añadir carbohidratos pre-entreno");

  // ─ Summary ─
  const summaryMap: Record<ATODirective["axisStatus"], string> = {
    OPTIMAL: "Eje HPG estable. Continuar protocolo actual sin ajustes.",
    FUNCTIONAL_DOMINANT: "Eje HPG funcional con señales de alerta. Monitorear.",
    SUPPRESSED_WARNING: "Supresión parcial detectada. Reducir déficit y volumen.",
    CRITICAL_RESET: "Supresión crítica. Protocolizar descarga y restacar energía.",
  };

  return {
    axisStatus,
    clinicalSummary: summaryMap[axisStatus],
    nutritionPatch: {
      carbMultiplierBonus: Math.round(carbMultiplierBonus * 100) / 100,
      recommendedDeficitSurplus,
    },
    trainingPatch: {
      volumeMode,
      intensityCapRIR,
      deloadSuggested,
    },
    supplementAlerts,
    _source: "fallback",
    _timestamp: Date.now(),
  };
}

// ── Main Exported Function ─────────────────────────────────────────────────────

export async function runATODiagnosis(input: ATOInput, forceSkipCooldown = false): Promise<ATOResult> {
  const hash = computeHash(input);

  // 1. Cache hit — return immediately, no API call
  const cached = readCache(hash);
  if (cached) {
    return { directive: cached };
  }

  // 2. Cooldown guard
  const cooldownRemaining = getCooldownRemaining();
  if (cooldownRemaining > 0 && !forceSkipCooldown) {
    return { directive: null, cooldownRemaining };
  }

  // 3. API key check
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_key_here") {
    console.warn("[ATO] No Gemini API key configured — running fallback heuristics.");
    const fallback = computeFallbackDirective(input);
    writeCache(hash, fallback);
    return { directive: fallback };
  }

  // 4. Stamp cooldown before making the call (prevents race conditions)
  stampCooldown();

  // 5. Gemini API call with fallback safety net
  try {
    const directive = await callGeminiAPI(input, apiKey);
    const result: ATODirective = { ...directive, _source: "gemini", _timestamp: Date.now() };
    writeCache(hash, result);
    return { directive: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[ATO] Gemini call failed (${message}) — activating fallback heuristics.`);

    // On 429, do NOT stamp a new cooldown — original stamp is fine
    // On abort/timeout — cooldown already stamped
    const fallback = computeFallbackDirective(input);
    // Cache the fallback too, to avoid hammering on retry
    writeCache(hash, fallback);
    return { directive: fallback, error: message };
  }
}
