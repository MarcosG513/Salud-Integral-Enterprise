// ─────────────────────────────────────────────────────────────────────────────
// ADAPTADOR DE SALUD NATIVO (Capacitor: Health Connect Android / HealthKit iOS)
// Detección segura sin añadir dependencias nativas rotas en Gradle;
// devuelve 'manual_fallback' cuando no exista puente nativo disponible.
// ─────────────────────────────────────────────────────────────────────────────

import { Capacitor } from "@capacitor/core";

export type NativeHealthStatus = "synced" | "permission_denied" | "manual_fallback";

export interface NativeHealthSyncResult {
  status: NativeHealthStatus;
  platform: "android" | "ios" | "web";
  provider: "health_connect" | "healthkit" | "manual";
  steps: number | null;
  sleepHours: number | null;
  message: string;
  syncedAt: number;
}

function getRuntimeCapacitorPlugins(): Record<string, any> | null {
  try {
    const capAny = Capacitor as any;
    if (capAny?.Plugins && typeof capAny.Plugins === "object") {
      return capAny.Plugins;
    }
    const winPlugins = (window as any)?.Capacitor?.Plugins;
    if (winPlugins && typeof winPlugins === "object") {
      return winPlugins;
    }
    return null;
  } catch {
    return null;
  }
}

export function getNativeHealthPlatformInfo(): {
  isNative: boolean;
  platform: "android" | "ios" | "web";
  provider: "health_connect" | "healthkit" | "manual";
} {
  try {
    if (!Capacitor.isNativePlatform()) {
      return { isNative: false, platform: "web", provider: "manual" };
    }
    const rawPlatform = Capacitor.getPlatform();
    if (rawPlatform === "android") {
      return { isNative: true, platform: "android", provider: "health_connect" };
    }
    if (rawPlatform === "ios") {
      return { isNative: true, platform: "ios", provider: "healthkit" };
    }
    return { isNative: false, platform: "web", provider: "manual" };
  } catch {
    return { isNative: false, platform: "web", provider: "manual" };
  }
}

function startOfTodayIso(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export async function syncNativeHealthData(): Promise<NativeHealthSyncResult> {
  const info = getNativeHealthPlatformInfo();
  const syncedAt = Date.now();

  if (!info.isNative) {
    return {
      status: "manual_fallback",
      platform: "web",
      provider: "manual",
      steps: null,
      sleepHours: null,
      message:
        "Entorno web detectado. Introduce tus pasos y horas de sueño manualmente o abre la app Android/iOS para sincronizar.",
      syncedAt,
    };
  }

  const plugins = getRuntimeCapacitorPlugins();
  const bridge =
    plugins?.HealthConnect ||
    plugins?.Health ||
    plugins?.CapacitorHealthkit ||
    null;

  if (!bridge) {
    return {
      status: "manual_fallback",
      platform: info.platform,
      provider: info.provider,
      steps: null,
      sleepHours: null,
      message:
        info.platform === "android"
          ? "Health Connect listo para vincularse cuando se active el plugin nativo; usa el registro rápido manual mientras tanto."
          : "HealthKit listo para vincularse cuando se active el plugin nativo; usa el registro rápido manual mientras tanto.",
      syncedAt,
    };
  }

  try {
    if (typeof bridge.requestAuthorization === "function") {
      const auth = await bridge.requestAuthorization({
        read: ["steps", "sleep"],
      });
      if (auth && auth.granted === false) {
        return {
          status: "permission_denied",
          platform: info.platform,
          provider: info.provider,
          steps: null,
          sleepHours: null,
          message:
            "Permisos de salud denegados en el dispositivo. Puedes concederlos en Ajustes o registrar tus datos manualmente.",
          syncedAt,
        };
      }
    } else if (typeof bridge.requestPermissions === "function") {
      const perm = await bridge.requestPermissions({
        read: ["Steps", "SleepSession"],
      });
      if (perm && perm.granted === false) {
        return {
          status: "permission_denied",
          platform: info.platform,
          provider: info.provider,
          steps: null,
          sleepHours: null,
          message:
            "Permisos de Health Connect denegados. Registra pasos y sueño manualmente por ahora.",
          syncedAt,
        };
      }
    }

    const startDate = startOfTodayIso();
    const endDate = new Date().toISOString();

    let steps: number | null = null;
    let sleepHours: number | null = null;

    if (typeof bridge.queryAggregated === "function") {
      const stepsRes = await bridge.queryAggregated({
        dataType: "steps",
        startDate,
        endDate,
      });
      const rawSteps = Number(stepsRes?.total ?? stepsRes?.value);
      if (Number.isFinite(rawSteps) && rawSteps >= 0) {
        steps = Math.round(rawSteps);
      }

      const sleepRes = await bridge.queryAggregated({
        dataType: "sleep",
        startDate,
        endDate,
      });
      const rawHours = Number(sleepRes?.hours ?? sleepRes?.value);
      if (Number.isFinite(rawHours) && rawHours > 0 && rawHours <= 16) {
        sleepHours = Math.round(rawHours * 10) / 10;
      }
    }

    if (steps === null && sleepHours === null) {
      return {
        status: "manual_fallback",
        platform: info.platform,
        provider: info.provider,
        steps: null,
        sleepHours: null,
        message:
          "No se encontraron lecturas recientes en el puente de salud. Usa los campos manuales aquí abajo.",
        syncedAt,
      };
    }

    return {
      status: "synced",
      platform: info.platform,
      provider: info.provider,
      steps,
      sleepHours,
      message: "Datos de actividad y sueño sincronizados desde el dispositivo.",
      syncedAt,
    };
  } catch {
    return {
      status: "manual_fallback",
      platform: info.platform,
      provider: info.provider,
      steps: null,
      sleepHours: null,
      message:
        "No fue posible consultar el historial nativo de salud. Registra pasos y sueño manualmente.",
      syncedAt,
    };
  }
}
