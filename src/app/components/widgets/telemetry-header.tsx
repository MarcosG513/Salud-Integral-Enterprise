import { Cpu, ChevronDown } from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";

interface TelemetryHeaderProps {
  onOpenSettings: () => void;
}

export function TelemetryHeader({ onOpenSettings }: TelemetryHeaderProps) {
  const { profile, metrics } = useClinicalEngine();

  return (
    <div className="flex h-full items-center justify-between gap-6 rounded-2xl border border-[#1E293B] bg-white/[0.03] p-6 backdrop-blur-xl">
      <div
        className="flex cursor-pointer items-center gap-5 select-none hover:opacity-85 transition-opacity"
        onClick={onOpenSettings}
        title="Abrir Parámetros Clínicos"
      >
        <div className="relative">
          <div
            className="flex size-14 items-center justify-center rounded-full border border-[#00F0FF]/40 bg-gradient-to-br from-[#0f2a33] to-[#0b1620] text-[#00F0FF]"
            style={{ boxShadow: "0 0 24px 2px rgba(0,240,255,0.45)" }}
          >
            <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>MM</span>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-[#0b0f19] bg-[#39FF14]" />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span style={{ fontWeight: 700, fontSize: "1.15rem" }}>
              {profile.username || "Marcos M."}
            </span>
            <ChevronDown className="size-4 text-slate-500" />
          </div>
          <div className="flex flex-col gap-0.5 text-slate-400" style={{ fontSize: "0.82rem" }}>
            <span>
              Periodización ·{" "}
              <span className="text-[#00F0FF] font-semibold">
                Semana {profile.mesocycleWeek}: {metrics.training.phaseName}
              </span>
            </span>
            <span className="text-[11px] text-slate-500">
              Objetivo de volumen: <span className="text-white font-bold">{metrics.training.sets}</span> (Objetivo: {metrics.training.intensity})
              {metrics.training.isSNCOverrideActive && (
                <span className="ml-2 text-[#FF4D4D] font-bold animate-pulse">
                  [ANULACIÓN DE SALVAGUARDA DEL SNC ACTIVA]
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 rounded-full border border-[#39FF14]/30 bg-[#39FF14]/[0.07] px-4 py-2"
          style={{ boxShadow: "inset 0 0 12px rgba(57,255,20,0.12)" }}
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#39FF14] opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-[#39FF14]" />
          </span>
          <Cpu className="size-3.5 text-[#39FF14]" />
          <span
            className="text-[#39FF14]"
            style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.03em" }}
          >
            Motor Clínico V3.0 Pro Activo
          </span>
        </div>
      </div>
    </div>
  );
}
