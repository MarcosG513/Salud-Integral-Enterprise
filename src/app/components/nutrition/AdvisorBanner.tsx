import { TriangleAlert } from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";

export function AdvisorBanner() {
  const { metrics } = useClinicalEngine();
  const deficit = metrics.effectiveDeficitTarget ?? 0;
  const isDeficit = deficit > 0;

  return (
    <footer className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-5 py-3 shadow-xs">
      <div className="flex items-center gap-2 border-r border-emerald-200 pr-3">
        <TriangleAlert className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-700">
          Estado Metabólico
        </span>
      </div>
      <p className="font-mono text-xs text-slate-700 flex-1 min-w-[200px]">
        {isDeficit ? (
          <>
            <span className="text-sky-700 font-bold">Déficit controlado activo de {deficit} kcal.</span>{" "}
            Priorizando alimentos de alta saciedad y densidad proteica (piso glucídico protegido).
          </>
        ) : (
          <>
            <span className="text-emerald-700 font-bold">Balance Energético Estable.</span>{" "}
            Optimizando densidad de micronutrientes, recuperación y sensibilidad a la insulina.
          </>
        )}
      </p>
      <span className="ml-auto flex shrink-0 items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-emerald-700 font-bold">
        <span className="h-2 w-2 rounded-full bg-emerald-500" /> activo
      </span>
    </footer>
  );
}
