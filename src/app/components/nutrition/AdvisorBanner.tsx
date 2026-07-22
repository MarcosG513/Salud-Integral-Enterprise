import { TriangleAlert } from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";

export function AdvisorBanner() {
  const { profile } = useClinicalEngine();
  const isDeficit = profile.deficitTarget > 0;

  return (
    <footer className="flex items-center gap-3 border-t border-[#39FF14]/25 bg-gradient-to-r from-[#39FF14]/[0.06] to-transparent px-6 py-2">
      <div className="flex items-center gap-2 border-r border-[#1E293B] pr-3">
        <TriangleAlert className="h-3.5 w-3.5 text-[#39FF14]" />
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#39FF14]">
          Estado de Asesoría
        </span>
      </div>
      <p className="truncate font-mono text-[11px] text-slate-400">
        {isDeficit ? (
          <>
            <span className="text-[#00F0FF]">Déficit calórico activo de {profile.deficitTarget} kcal detectado.</span>{" "}
            Priorizando alimentos integrales de gran volumen y baja densidad calórica para un manejo óptimo de la saciedad de la leptina.
          </>
        ) : (
          <>
            <span className="text-[#39FF14]">Balance Energético Estable.</span>{" "}
            Optimizando densidad de micronutrientes, rendimiento físico y pautas de sensibilidad a la insulina.
          </>
        )}
      </p>
      <span className="ml-auto flex shrink-0 items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-slate-600">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#39FF14]" /> activo
      </span>
    </footer>
  );
}
