import { Cpu, ChevronDown, HelpCircle } from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";

interface TelemetryHeaderProps {
  onOpenSettings: () => void;
  onOpenHelp?: () => void;
}

export function TelemetryHeader({ onOpenSettings, onOpenHelp }: TelemetryHeaderProps) {
  const { profile, metrics } = useClinicalEngine();

  return (
    <div className="flex h-full items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm text-slate-900 min-w-0">
      <div
        className="flex cursor-pointer items-center gap-4 sm:gap-5 select-none hover:opacity-85 transition-opacity min-w-0 flex-1"
        onClick={onOpenSettings}
        title="Abrir Parámetros Clínicos"
      >
        <div className="relative shrink-0">
          <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700 shadow-xs">
            <span className="font-bold text-base sm:text-lg">MM</span>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-500" />
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base text-slate-900">
              {profile.username || "Marcos M."}
            </span>
            <ChevronDown className="size-4 text-slate-500" />
          </div>
          <div className="flex flex-col gap-0.5 text-slate-600 text-xs">
            <span>
              Periodización ·{" "}
              <span className="text-sky-700 font-bold">
                Semana {profile.mesocycleWeek}: {metrics.training.phaseName}
              </span>
            </span>
            <span className="text-[11px] text-slate-500">
              Objetivo de volumen:{" "}
              <span className="text-slate-900 font-bold">{metrics.training.sets}</span> (
              {metrics.training.intensity})
              {metrics.isREDSTriggered && (
                <span className="ml-2 text-rose-600 font-bold">
                  [ESCUDO ENDOCRINO ACTIVO]
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2">
          <span className="relative flex size-2">
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <Cpu className="size-3.5 text-emerald-600" />
          <span className="text-emerald-700 text-xs font-bold tracking-wide">
            {metrics.algorithmStatusBadge || "Motor Autónomo V6"}
          </span>
        </div>

        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            aria-label="Abrir guía de uso y ayuda"
            title="Guía de Uso y Configuración"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors cursor-pointer shrink-0"
          >
            <HelpCircle size={19} />
          </button>
        )}
      </div>
    </div>
  );
}
