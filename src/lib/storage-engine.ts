// ─────────────────────────────────────────────────────────────────────────────
// MOTOR DE ALMACENAMIENTO OFFLINE-FIRST & MIGRACIÓN DETERMINISTA
// Salud Integral Enterprise V5.0 — Esquema v7 Unificado
// ─────────────────────────────────────────────────────────────────────────────

export const SIE_STORAGE_KEYS = {
  PROFILE: "sie_v7_profile",
  FOOD_LOGS: "sie_v7_food_logs",
  CUSTOM_FOODS: "sie_v7_custom_foods",
  LABS: "sie_v7_labs",
  SUPPLEMENT_CHECKLIST: "sie_v7_supplement_checklist",
  SUPPLEMENT_CUSTOM: "sie_v7_supplement_custom",
  WORKOUT: "sie_v7_workout",
  WORKOUT_HISTORY: "sie_v7_workout_history",
  ATO: "sie_v7_ato",
} as const;

export type StorageKey = typeof SIE_STORAGE_KEYS[keyof typeof SIE_STORAGE_KEYS];

/**
 * Migración Idempotente: Traslada claves fragmentadas heredadas al nuevo esquema sie_v7_*
 * y purga las claves obsoletas del navegador.
 */
export function runStorageMigration(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;

    const isMigrated = localStorage.getItem("sie_v7_migrated");
    if (isMigrated === "true") return;

    // 1. Profile
    if (!localStorage.getItem(SIE_STORAGE_KEYS.PROFILE)) {
      const oldProfile = localStorage.getItem("user_profile_v5");
      if (oldProfile) {
        localStorage.setItem(SIE_STORAGE_KEYS.PROFILE, oldProfile);
      }
    }

    // 2. Food Logs
    if (!localStorage.getItem(SIE_STORAGE_KEYS.FOOD_LOGS)) {
      const oldFood = localStorage.getItem("food_logs_v5");
      if (oldFood) {
        localStorage.setItem(SIE_STORAGE_KEYS.FOOD_LOGS, oldFood);
      }
    }

    // 3. Custom Foods
    if (!localStorage.getItem(SIE_STORAGE_KEYS.CUSTOM_FOODS)) {
      const oldCustom = localStorage.getItem("custom_foods_v5");
      if (oldCustom) {
        localStorage.setItem(SIE_STORAGE_KEYS.CUSTOM_FOODS, oldCustom);
      }
    }

    // 4. Hormonal Labs
    if (!localStorage.getItem(SIE_STORAGE_KEYS.LABS)) {
      const oldLabs = localStorage.getItem("hormonal_labs_v6");
      if (oldLabs) {
        localStorage.setItem(SIE_STORAGE_KEYS.LABS, oldLabs);
      }
    }

    // 5. Supplements
    if (!localStorage.getItem(SIE_STORAGE_KEYS.SUPPLEMENT_CHECKLIST)) {
      const oldChecklist = localStorage.getItem("supplement_checklist_v5");
      if (oldChecklist) {
        localStorage.setItem(SIE_STORAGE_KEYS.SUPPLEMENT_CHECKLIST, oldChecklist);
      }
    }

    if (!localStorage.getItem(SIE_STORAGE_KEYS.SUPPLEMENT_CUSTOM)) {
      const oldCustomSupp = localStorage.getItem("supplement_custom_v6");
      if (oldCustomSupp) {
        localStorage.setItem(SIE_STORAGE_KEYS.SUPPLEMENT_CUSTOM, oldCustomSupp);
      }
    }

    // 6. Workout
    if (!localStorage.getItem(SIE_STORAGE_KEYS.WORKOUT)) {
      const oldWorkout = localStorage.getItem("active_workout_v5");
      if (oldWorkout) {
        localStorage.setItem(SIE_STORAGE_KEYS.WORKOUT, oldWorkout);
      }
    }

    // 7. ATO Directive
    if (!localStorage.getItem(SIE_STORAGE_KEYS.ATO)) {
      const oldAto = localStorage.getItem("ato_directive_current");
      if (oldAto) {
        localStorage.setItem(SIE_STORAGE_KEYS.ATO, oldAto);
      }
    }

    // Purgar claves legacy obsoletas
    const legacyKeys = [
      "user_profile_v5",
      "food_logs_v5",
      "custom_foods_v5",
      "weight_history_v5",
      "hormonal_labs_v6",
      "supplement_custom_v6",
      "supplement_checklist_v5",
      "active_workout_v5",
      "ato_directive_current",
      "v5_active_glossary",
    ];

    legacyKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });

    localStorage.setItem("sie_v7_migrated", "true");
    console.info("[StorageEngine] Migración determinista a sie_v7_* completada con éxito.");
  } catch (err) {
    console.warn("[StorageEngine] Advertencia durante la migración de almacenamiento:", err);
  }
}

// Ejecución al importar el módulo
runStorageMigration();

/**
 * Lectura segura con JSON.parse y fallback ante corrupción o ausencia
 */
export function safeGetItem<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined" || !window.localStorage) return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[StorageEngine] Error al parsear clave '${key}', usando fallback.`, err);
    return fallback;
  }
}

/**
 * Escritura segura con protección contra QuotaExceededError
 */
export function safeSetItem<T>(key: string, value: T): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err: any) {
    if (err?.name === "QuotaExceededError" || err?.code === 22) {
      console.warn("[StorageEngine] QuotaExceededError: purga de emergencia de caché transitorio...");
      try {
        // Purgar entradas temporales de caché ATO para liberar espacio
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith("ato_cache_")) {
            localStorage.removeItem(k);
          }
        }
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (retryErr) {
        console.error("[StorageEngine] Fallo al almacenar tras purga de emergencia.", retryErr);
        return false;
      }
    }
    console.error(`[StorageEngine] Fallo al escribir clave '${key}':`, err);
    return false;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    localStorage.removeItem(key);
  } catch {}
}
