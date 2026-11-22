// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES DE PARSEO NUMÉRICO RESILIENTE (Soporte coma/punto decimal ES)
// Previene trampas `NaN` y reinyección de `0` al borrar con Backspace.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convierte texto numérico con separador decimal `,` o `.` en `number` finito,
 * o devuelve `null` si la cadena está vacía o no representa un número válido.
 */
export function parseLocaleNumber(val: string): number | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (trimmed === "") return null;
  const normalized = trimmed.replace(",", ".");
  // Evitar estados parciales como "." o "-"
  if (normalized === "." || normalized === "-" || normalized === "-.") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Convierte texto numérico a entero válido o devuelve `null`.
 */
export function parseLocaleInt(val: string): number | null {
  const num = parseLocaleNumber(val);
  if (num === null) return null;
  const intVal = Math.trunc(num);
  return Number.isFinite(intVal) ? intVal : null;
}
