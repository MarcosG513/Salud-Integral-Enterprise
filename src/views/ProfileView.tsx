import { useState, useRef } from "react";
import { Download, Upload, CheckCircle, AlertTriangle, Database, Info } from "lucide-react";
import { useClinicalEngine } from "../context/clinical-engine-context";
import { IdentityNode } from "../components/profile/identity-node";
import { DimensionsMatrix } from "../components/profile/dimensions-matrix";
import { BodyComposition } from "../components/profile/body-composition";
import { WeightLedger } from "../components/profile/weight-ledger";
import { SIE_STORAGE_KEYS, safeSetItem } from "../lib/storage-engine";

export function ProfileView() {
  const { profile, foodLogs, customFoods, hormonalLabValues, activeWorkout } = useClinicalEngine();
  const [downloaded, setDownloaded] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    const backupData = {
      version: "5.0",
      exportDate: new Date().toISOString(),
      profile,
      foodLogs,
      customFoods,
      labs: hormonalLabValues,
      activeWorkout,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salud-integral-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        if (!raw || raw.trim() === "") throw new Error("El archivo seleccionado está vacío.");

        // Protección contra Prototype Pollution
        if (raw.includes("__proto__") || raw.includes("constructor") || raw.includes("prototype")) {
          throw new Error("El archivo contiene propiedades no autorizadas por seguridad.");
        }

        const data = JSON.parse(raw);
        if (typeof data !== "object" || data === null || Array.isArray(data)) {
          throw new Error("Formato de respaldo JSON no válido.");
        }

        // Validación de rangos fisiológicos
        if (data.profile) {
          if (typeof data.profile.bodyFat === "number" && (data.profile.bodyFat < 3 || data.profile.bodyFat > 60)) {
            throw new Error("Porcentaje de grasa corporal fuera de límites fisiológicos (3%–60%).");
          }
          if (Array.isArray(data.profile.weightLogs)) {
            const invalidWeight = data.profile.weightLogs.some((w: any) => typeof w !== "number" || w < 30 || w > 300);
            if (invalidWeight) {
              throw new Error("Registros de peso fuera de límites clínicos seguros (30–300 kg).");
            }
          }
          safeSetItem(SIE_STORAGE_KEYS.PROFILE, data.profile);
        }

        if (Array.isArray(data.foodLogs)) {
          safeSetItem(SIE_STORAGE_KEYS.FOOD_LOGS, data.foodLogs);
        }

        if (data.customFoods && typeof data.customFoods === "object") {
          safeSetItem(SIE_STORAGE_KEYS.CUSTOM_FOODS, data.customFoods);
        }

        if (data.labs && typeof data.labs === "object") {
          safeSetItem(SIE_STORAGE_KEYS.LABS, data.labs);
        }

        if (data.activeWorkout) {
          safeSetItem(SIE_STORAGE_KEYS.WORKOUT, data.activeWorkout);
        }

        setImportSuccess(true);
        setTimeout(() => {
          setImportSuccess(false);
          window.location.reload();
        }, 1200);
      } catch (err: any) {
        setImportError(err?.message || "Error al procesar el archivo.");
        setTimeout(() => setImportError(null), 4500);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div
      className="relative flex-1 w-full flex flex-col gap-6 p-4 sm:p-8 bg-slate-50 text-slate-900"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="relative z-10 flex flex-1 flex-col gap-6">
        {/* Nodo de Identidad del Operador */}
        <IdentityNode />

        {/* Matriz Bento de Paneles */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="min-h-[400px]">
            <DimensionsMatrix />
          </div>
          <div className="min-h-[400px]">
            <BodyComposition />
          </div>
          <div className="min-h-[400px]">
            <WeightLedger />
          </div>
        </div>

        {/* Portabilidad y Respaldo Clínico */}
        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 text-sky-600 shadow-xs">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Portabilidad y Respaldo Clínico
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Exporta o restaura toda tu telemetría médica, bitácoras de peso, perfiles hormonales y macronutrientes en formato JSON universal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Input oculto para importación */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-mono text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer ${
                importSuccess
                  ? "bg-emerald-600 text-white shadow-emerald-500/20"
                  : importError
                  ? "bg-rose-600 text-white shadow-rose-500/20"
                  : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-slate-200/50 hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {importSuccess ? (
                <>
                  <CheckCircle size={16} />
                  <span>¡DATOS RESTAURADOS!</span>
                </>
              ) : importError ? (
                <>
                  <AlertTriangle size={16} />
                  <span>ERROR AL IMPORTAR</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>📤 Importar Backup (JSON)</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportBackup}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-mono text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer ${
                downloaded
                  ? "bg-emerald-600 text-white shadow-emerald-500/20"
                  : "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {downloaded ? (
                <>
                  <CheckCircle size={16} />
                  <span>¡BACKUP DESCARGADO!</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>📥 Exportar Backup Clínico (JSON)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback visual de error al importar */}
        {importError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-rose-500" />
            <span>{importError}</span>
          </div>
        )}

        {/* Aviso Clínico Editorial */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/40 flex items-start gap-4">
          <div className="size-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 mt-0.5">
            <Info size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Aviso Clínico Informativo & Responsabilidad Médica
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Las métricas fisiológicas, estimaciones antropométricas (Katch-McArdle / Cunningham 1980 / Mifflin-St Jeor), cálculos de disponibilidad energética (Consenso IOC 2023) y directivas del orquestador ATO son herramientas digitales de soporte educativo y optimización personal del rendimiento. No sustituyen el criterio médico profesional, diagnóstico clínico ni tratamiento endocrinológico. Consulta siempre a un profesional sanitario colegiado antes de emprender cambios drásticos en tus parámetros hormonales, calóricos o de entrenamiento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileView;
