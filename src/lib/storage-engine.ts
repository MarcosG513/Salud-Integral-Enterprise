// ─────────────────────────────────────────────────────────────────────────────
// MOTOR DE ALMACENAMIENTO OFFLINE-FIRST & MIGRACIÓN DETERMINISTA
// Salud Integral Enterprise V6.0 — LocalStorage Síncrono + Espejo IndexedDB + Cola Sync
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
  ONBOARDING: "sie_v7_onboarding",
  WEEKLY_CHECKIN: "sie_v7_weekly_checkin",
  SYNC_QUEUE: "sie_v7_sync_queue",
} as const;

export type StorageKey = (typeof SIE_STORAGE_KEYS)[keyof typeof SIE_STORAGE_KEYS];

export interface SyncQueueEntry {
  id: string;
  entityKey: string;
  operation: "upsert" | "delete";
  payload: unknown;
  timestamp: number;
  status: "pending" | "synced";
}

export interface OfflineStorageStatus {
  indexedDbAvailable: boolean;
  pendingSyncCount: number;
  lastQueuedAt: number | null;
}

const IDB_NAME = "sie_enterprise_offline_v1";
const IDB_VERSION = 1;
const IDB_KV_STORE = "kv_store";
const IDB_SYNC_STORE = "sync_queue";
const MAX_SYNC_QUEUE_ITEMS = 200;

let idbPromise: Promise<IDBDatabase | null> | null = null;

function isIndexedDbSupported(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function getOfflineDb(): Promise<IDBDatabase | null> {
  if (!isIndexedDbSupported()) {
    return Promise.resolve(null);
  }
  if (idbPromise) {
    return idbPromise;
  }

  idbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_KV_STORE)) {
          db.createObjectStore(IDB_KV_STORE, { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains(IDB_SYNC_STORE)) {
          db.createObjectStore(IDB_SYNC_STORE, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return idbPromise;
}

export function mirrorKeyToIndexedDB(key: string, value: unknown): void {
  if (!isIndexedDbSupported()) return;
  void getOfflineDb().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(IDB_KV_STORE, "readwrite");
      tx.objectStore(IDB_KV_STORE).put({
        key,
        value,
        updatedAt: Date.now(),
      });
    } catch {
      // Silently ignore IDB background write failures
    }
  });
}

export function deleteKeyFromIndexedDB(key: string): void {
  if (!isIndexedDbSupported()) return;
  void getOfflineDb().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(IDB_KV_STORE, "readwrite");
      tx.objectStore(IDB_KV_STORE).delete(key);
    } catch {
      // Silently ignore
    }
  });
}

/**
 * Restaura claves sie_v7_* faltantes en localStorage desde el espejo IndexedDB.
 */
export async function hydrateFromIndexedDBIfEmpty(): Promise<number> {
  if (!isIndexedDbSupported() || typeof window === "undefined" || !window.localStorage) {
    return 0;
  }
  const db = await getOfflineDb();
  if (!db) return 0;

  return new Promise<number>((resolve) => {
    try {
      const tx = db.transaction(IDB_KV_STORE, "readonly");
      const req = tx.objectStore(IDB_KV_STORE).getAll();
      req.onsuccess = () => {
        const records = Array.isArray(req.result) ? req.result : [];
        let restored = 0;
        for (const rec of records) {
          if (
            rec &&
            typeof rec.key === "string" &&
            rec.key.startsWith("sie_v7_") &&
            rec.key !== SIE_STORAGE_KEYS.SYNC_QUEUE &&
            localStorage.getItem(rec.key) === null
          ) {
            try {
              localStorage.setItem(rec.key, JSON.stringify(rec.value));
              restored += 1;
            } catch {
              // ignore storage quota issue
            }
          }
        }
        resolve(restored);
      };
      req.onerror = () => resolve(0);
    } catch {
      resolve(0);
    }
  });
}

function readSyncQueueRaw(): SyncQueueEntry[] {
  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const raw = localStorage.getItem(SIE_STORAGE_KEYS.SYNC_QUEUE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SyncQueueEntry[]) : [];
  } catch {
    return [];
  }
}

function writeSyncQueueRaw(entries: SyncQueueEntry[]): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    localStorage.setItem(SIE_STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(entries));
  } catch {
    // ignore quota error for queue persistence
  }
}

/**
 * Encola una mutación idempotente por entityKey (reemplaza pendientes previos
 * de la misma clave para evitar duplicación offline).
 */
export function enqueueSyncMutation(
  entityKey: string,
  operation: "upsert" | "delete",
  payload: unknown
): void {
  if (!entityKey || entityKey === SIE_STORAGE_KEYS.SYNC_QUEUE) return;
  const now = Date.now();
  const entry: SyncQueueEntry = {
    id: `${entityKey}:${now}`,
    entityKey,
    operation,
    payload,
    timestamp: now,
    status: "pending",
  };

  const current = readSyncQueueRaw().filter(
    (item) => !(item.entityKey === entityKey && item.status === "pending")
  );
  const next = [...current, entry].slice(-MAX_SYNC_QUEUE_ITEMS);
  writeSyncQueueRaw(next);

  if (isIndexedDbSupported()) {
    void getOfflineDb().then((db) => {
      if (!db) return;
      try {
        const tx = db.transaction(IDB_SYNC_STORE, "readwrite");
        const store = tx.objectStore(IDB_SYNC_STORE);
        store.clear();
        next.forEach((item) => store.put(item));
      } catch {
        // Silently ignore IDB sync queue write failures
      }
    });
  }
}

export function getPendingSyncQueue(): SyncQueueEntry[] {
  return readSyncQueueRaw().filter((item) => item.status === "pending");
}

export function markSyncEntriesCompleted(ids: string[]): void {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const idSet = new Set(ids);
  const remaining = readSyncQueueRaw().filter((item) => !idSet.has(item.id));
  writeSyncQueueRaw(remaining);

  if (isIndexedDbSupported()) {
    void getOfflineDb().then((db) => {
      if (!db) return;
      try {
        const tx = db.transaction(IDB_SYNC_STORE, "readwrite");
        const store = tx.objectStore(IDB_SYNC_STORE);
        ids.forEach((id) => store.delete(id));
      } catch {
        // Silently ignore
      }
    });
  }
}

export function getOfflineStorageStatus(): OfflineStorageStatus {
  const pending = getPendingSyncQueue();
  const lastQueuedAt =
    pending.length > 0 ? pending[pending.length - 1].timestamp : null;
  return {
    indexedDbAvailable: isIndexedDbSupported(),
    pendingSyncCount: pending.length,
    lastQueuedAt,
  };
}

/**
 * Migración Idempotente: Traslada claves fragmentadas heredadas al nuevo esquema sie_v7_*
 * y purga las claves obsoletas del navegador.
 */
export function runStorageMigration(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;

    const isMigrated = localStorage.getItem("sie_v7_migrated");
    if (isMigrated === "true") return;

    const legacyPairs: Array<[string, StorageKey]> = [
      ["user_profile_v5", SIE_STORAGE_KEYS.PROFILE],
      ["food_logs_v5", SIE_STORAGE_KEYS.FOOD_LOGS],
      ["custom_foods_v5", SIE_STORAGE_KEYS.CUSTOM_FOODS],
      ["hormonal_labs_v6", SIE_STORAGE_KEYS.LABS],
      ["supplement_checklist_v5", SIE_STORAGE_KEYS.SUPPLEMENT_CHECKLIST],
      ["supplement_custom_v6", SIE_STORAGE_KEYS.SUPPLEMENT_CUSTOM],
      ["active_workout_v5", SIE_STORAGE_KEYS.WORKOUT],
      ["ato_directive_current", SIE_STORAGE_KEYS.ATO],
    ];

    legacyPairs.forEach(([oldKey, newKey]) => {
      if (!localStorage.getItem(newKey)) {
        const val = localStorage.getItem(oldKey);
        if (val) {
          localStorage.setItem(newKey, val);
        }
      }
    });

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

// Ejecución al importar el módulo + hidratación asíncrona de respaldo IndexedDB
runStorageMigration();
void hydrateFromIndexedDBIfEmpty();

/**
 * Lectura síncrona segura con JSON.parse y fallback ante corrupción o ausencia
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
 * Escritura segura en localStorage + espejo IndexedDB + encolado sync offline-first
 */
export function safeSetItem<T>(key: string, value: T): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    localStorage.setItem(key, JSON.stringify(value));

    if (key !== SIE_STORAGE_KEYS.SYNC_QUEUE) {
      mirrorKeyToIndexedDB(key, value);
      if (key.startsWith("sie_v7_")) {
        enqueueSyncMutation(key, "upsert", value);
      }
    }
    return true;
  } catch (err: any) {
    if (err?.name === "QuotaExceededError" || err?.code === 22) {
      console.warn("[StorageEngine] QuotaExceededError: purga de emergencia de caché transitorio...");
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith("ato_cache_")) {
            localStorage.removeItem(k);
          }
        }
        localStorage.setItem(key, JSON.stringify(value));
        if (key !== SIE_STORAGE_KEYS.SYNC_QUEUE) {
          mirrorKeyToIndexedDB(key, value);
        }
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
    if (key !== SIE_STORAGE_KEYS.SYNC_QUEUE) {
      deleteKeyFromIndexedDB(key);
      if (key.startsWith("sie_v7_")) {
        enqueueSyncMutation(key, "delete", null);
      }
    }
  } catch {}
}
