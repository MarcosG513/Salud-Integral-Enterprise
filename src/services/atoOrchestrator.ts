// ─────────────────────────────────────────────────────────────────────────────
// ATO Central Engine — Autonomous Telemetry Orchestrator
// Client-side Driver (Hermetic: Zero API Keys on Client)
// Routes via Vercel Serverless Proxy (/api/ato) or VITE_ATO_PROXY_URL
// Includes Circuit Breaker + 4 Local Resilience Barriers + Heuristic Fallback
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
  _source?: "gemini" | "gemini_proxy" | "cache" | "fallback";
  _model?: string;
  _timestamp?: number;
}

export interface ATOResult {
  directive: ATODirective | null;
  cooldownRemaining?: number; // ms remaining if cooldown is active
  error?: string;
}

// ── Constants & Configuration ─────────────────────────────────────────────────

const PROXY_URL = import.meta.env.VITE_ATO_PROXY_URL || "/api/ato";

const COOLDOWN_MS = 30_000;          // 30 seconds between calls
const CACHE_TTL_MS = 5 * 60_000;    // 5-minute cache TTL per payload hash
const MAX_CACHE_ENTRIES = 12;       // LRU ceiling for ato_cache_es_v2_* entries
const LS_TIMESTAMP_KEY = "ato_last_call_timestamp";
const LS_CACHE_PREFIX = "ato_cache_es_v2_";
const TIMEOUT_MS = 15_000;           // 15-second request timeout
const RETRY_DELAYS_MS = [600, 1400]; // Exponential backoff for HTTP 429 / 503

// ── Circuit Breaker Pattern ───────────────────────────────────────────────────
// 3 consecutive failures -> state OPEN for 60s -> auto retry in HALF_OPEN

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailureTime: 0,
  state: "CLOSED",
};

const CB_FAILURE_THRESHOLD = 3;
const CB_RESET_TIMEOUT_MS = 60_000;

export function isCircuitBreakerOpen(): boolean {
  if (circuitBreaker.state === "OPEN") {
    if (Date.now() - circuitBreaker.lastFailureTime > CB_RESET_TIMEOUT_MS) {
      circuitBreaker.state = "HALF_OPEN";
      return false;
    }
    return true;
  }
  return false;
}

export function recordBreakerSuccess(): void {
  circuitBreaker.failures = 0;
  circuitBreaker.state = "CLOSED";
}

export function recordBreakerFailure(): void {
  circuitBreaker.failures += 1;
  circuitBreaker.lastFailureTime = Date.now();
  if (circuitBreaker.failures >= CB_FAILURE_THRESHOLD) {
    circuitBreaker.state = "OPEN";
    console.warn("[ATO CircuitBreaker] 3 consecutive failures. State OPEN for 60s.");
  }
}

export function resetCircuitBreaker(): void {
  circuitBreaker.failures = 0;
  circuitBreaker.lastFailureTime = 0;
  circuitBreaker.state = "CLOSED";
}

// ── Payload Hashing (djb2 fast string hash with floats normalized to 1 decimal) ─

function round1(value: number | undefined): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.round(value * 10) / 10;
}

function computeHash(input: ATOInput): string {
  const lastWeight = input.profile.weightLogs?.length
    ? round1(input.profile.weightLogs[input.profile.weightLogs.length - 1]) ?? 70
    : 70;

  const raw = JSON.stringify({
    labs: {
      lh: round1(input.labs.lh),
      fsh: round1(input.labs.fsh),
      testosterone: round1(input.labs.testosterone),
      shbg: round1(input.labs.shbg),
      cortisol: round1(input.labs.cortisol),
      prolactina: round1(input.labs.prolactina),
      estradiol: round1(input.labs.estradiol),
    },
    energyAvailability: round1(input.energyAvailability) ?? 0,
    profile: {
      age: round1(input.profile.age),
      bodyFat: round1(input.profile.bodyFat),
      activityFactor: round1(input.profile.activityFactor),
      mesocycleWeek: Math.round(input.profile.mesocycleWeek),
      deficitTarget: Math.round(input.profile.deficitTarget),
      cnsReadiness: round1(input.profile.cnsReadiness),
      lastWeight,
    },
  });
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
    hash = hash & hash; // convert to 32-bit int
  }
  return (hash >>> 0).toString(16); // unsigned hex
}

// ── LocalStorage Cache Layer with TTL + LRU Purge ─────────────────────────────

interface CachedATOEntry extends ATODirective {
  _lastUsedAt?: number;
}

export function purgeExpiredCache(): void {
  try {
    const keysToRemove: string[] = [];
    const activeEntries: Array<{ key: string; lastUsed: number }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Clean legacy English cache keys or expired/oversized Spanish cache keys
      if (key && (key.startsWith("ato_cache_") || key.startsWith(LS_CACHE_PREFIX))) {
        if (!key.startsWith(LS_CACHE_PREFIX)) {
          keysToRemove.push(key);
          continue;
        }
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const cached: CachedATOEntry = JSON.parse(raw);
            const age = Date.now() - (cached._timestamp ?? 0);
            if (age > CACHE_TTL_MS) {
              keysToRemove.push(key);
            } else {
              activeEntries.push({
                key,
                lastUsed: cached._lastUsedAt ?? cached._timestamp ?? 0,
              });
            }
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }

    // LRU eviction if cache exceeds MAX_CACHE_ENTRIES
    if (activeEntries.length > MAX_CACHE_ENTRIES) {
      activeEntries.sort((a, b) => a.lastUsed - b.lastUsed);
      const excessCount = activeEntries.length - MAX_CACHE_ENTRIES;
      for (let i = 0; i < excessCount; i++) {
        keysToRemove.push(activeEntries[i].key);
      }
    }

    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

// Execute purge when service loads
purgeExpiredCache();

function readCache(hash: string): ATODirective | null {
  try {
    const fullKey = LS_CACHE_PREFIX + hash;
    const raw = localStorage.getItem(fullKey);
    if (!raw) return null;
    const cached: CachedATOEntry = JSON.parse(raw);
    const age = Date.now() - (cached._timestamp ?? 0);
    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(fullKey);
      return null;
    }
    const touched: CachedATOEntry = { ...cached, _lastUsedAt: Date.now() };
    localStorage.setItem(fullKey, JSON.stringify(touched));
    return { ...touched, _source: "cache" };
  } catch {
    return null;
  }
}

function writeCache(hash: string, directive: ATODirective): void {
  try {
    const now = Date.now();
    const toStore: CachedATOEntry = {
      ...directive,
      _timestamp: now,
      _lastUsedAt: now,
      _source: directive._source || "gemini",
    };
    localStorage.setItem(LS_CACHE_PREFIX + hash, JSON.stringify(toStore));
    purgeExpiredCache();
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

// ── Proxy Client Call with AbortController & Exponential Backoff (429/503) ────

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callATOProxy(input: ATOInput): Promise<ATODirective> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if ((res.status === 429 || res.status === 503) && attempt < RETRY_DELAYS_MS.length) {
        await sleepMs(RETRY_DELAYS_MS[attempt]);
        continue;
      }

      if (!res.ok) {
        throw new Error(`PROXY_STATUS_${res.status}`);
      }

      const data = await res.json();
      if (!data?.directive?.axisStatus || !data?.directive?.clinicalSummary) {
        throw new Error("INVALID_PROXY_PAYLOAD");
      }

      recordBreakerSuccess();
      return data.directive;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      lastError = err;
    }
  }

  recordBreakerFailure();
  throw lastError;
}

// ── Extended Local Mathematical Fallback Heuristic Engine ─────────────────────
// Evaluates Testosterone, Cortisol, LH, EA, Prolactin, Estradiol & CNS
// Purely offline, zero crashes, zero external API calls

export function computeFallbackDirective(input: ATOInput): ATODirective {
  const { labs, energyAvailability, profile } = input;

  // ─ Extended Prolactin & Estradiol checks ─
  const hasHighProlactin = typeof labs.prolactina === "number" && labs.prolactina > 18;
  const e2 = labs.estradiol;
  const t = labs.testosterone;
  const isHighEstradiol = typeof e2 === "number" && e2 > 40;
  const isHighE2ToTRatio = typeof e2 === "number" && typeof t === "number" && t > 0 && (e2 / t > 0.08);

  // ─ Axis status ─
  let axisStatus: ATODirective["axisStatus"] = "OPTIMAL";
  if (labs.testosterone < 300 || labs.lh < 1.5 || energyAvailability < 25) {
    axisStatus = "CRITICAL_RESET";
  } else if (
    labs.testosterone < 350 || 
    labs.cortisol > 22 || 
    energyAvailability < 30 ||
    hasHighProlactin ||
    isHighE2ToTRatio
  ) {
    axisStatus = "SUPPRESSED_WARNING";
  } else if (
    labs.testosterone < 550 || 
    labs.cortisol > 18 || 
    energyAvailability < 35 ||
    isHighEstradiol
  ) {
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
  if (hasHighProlactin) supplementAlerts.push("Prolactina elevada (>18 ng/mL): considerar P-5-P (B6) y Zinc");
  if (isHighEstradiol || isHighE2ToTRatio) supplementAlerts.push("Estradiol elevado: moderar aromatización con Zinc y hábitos");

  // ─ Summary ─
  const summaryMap: Record<ATODirective["axisStatus"], string> = {
    OPTIMAL: "Eje HPG estable. Continuar protocolo actual sin ajustes.",
    FUNCTIONAL_DOMINANT: isHighEstradiol
      ? "Eje HPG funcional con leve elevación estrogénica. Monitorear."
      : "Eje HPG funcional con señales de alerta. Monitorear.",
    SUPPRESSED_WARNING: hasHighProlactin
      ? "Alerta: Prolactina elevada suprimiendo eje gonadal. Reducir estrés."
      : "Supresión parcial detectada. Reducir déficit y volumen.",
    CRITICAL_RESET: "Supresión crítica. Protocolizar descarga y rescatar energía.",
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

  // 1. Cache hit — return immediately, no network call
  const cached = readCache(hash);
  if (cached) {
    return { directive: cached };
  }

  // 2. Cooldown guard
  const cooldownRemaining = getCooldownRemaining();
  if (cooldownRemaining > 0 && !forceSkipCooldown) {
    return { directive: null, cooldownRemaining };
  }

  // 3. Circuit breaker guard: if open, immediately serve offline heuristics
  if (isCircuitBreakerOpen()) {
    console.warn("[ATO] Circuit breaker is OPEN — serving offline fallback heuristics.");
    const fallback = computeFallbackDirective(input);
    writeCache(hash, fallback);
    return { directive: fallback, error: "CIRCUIT_BREAKER_OPEN" };
  }

  // 4. Stamp cooldown
  stampCooldown();

  // 5. Proxy call with automatic heuristic fallback
  try {
    const directive = await callATOProxy(input);
    const result: ATODirective = { ...directive, _source: directive._source || "gemini_proxy", _timestamp: Date.now() };
    writeCache(hash, result);
    return { directive: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[ATO] Proxy call failed (${message}) — activating fallback heuristics.`);

    const fallback = computeFallbackDirective(input);
    writeCache(hash, fallback);
    return { directive: fallback, error: message };
  }
}
