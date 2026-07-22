import { ShieldAlert, Wind, CheckCircle2 } from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";

function Gauge({ pct }: { pct: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  // Ensure pct is bounded
  const boundedPct = Math.max(0, Math.min(1, pct));
  
  // Determine color based on pct
  const strokeColor = boundedPct >= 0.75 ? "#00F0FF" : boundedPct >= 0.50 ? "#A855F7" : "#FF4D4D";
  const glowShadow = `drop-shadow(0 0 6px ${strokeColor})`;

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 140 140" className="w-full max-w-[150px]" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1E293B" strokeWidth={10} />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - boundedPct)}
          style={{
            filter: glowShadow,
            transition: "stroke-dashoffset 0.5s ease-in-out, stroke 0.5s ease",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular-nums text-white" style={{ fontWeight: 800, fontSize: "1.6rem" }}>
          {Math.round(boundedPct * 100)}%
        </span>
        <span style={{ fontSize: "0.68rem", fontWeight: 600, color: strokeColor }}>
          {boundedPct >= 0.75 ? "Óptimo" : boundedPct >= 0.50 ? "Subóptimo" : "Deficiente"}
        </span>
      </div>
    </div>
  );
}

export function EndothelialMonitor() {
  const { profile, metrics } = useClinicalEngine();

  const getAlertBanner = () => {
    if (metrics.isREDSTriggered) {
      return (
        <div
          className="mt-auto rounded-xl border border-[#FF4D4D]/40 bg-[#FF4D4D]/[0.08] p-4 animate-pulse"
          style={{ boxShadow: "inset 0 0 20px rgba(255,77,77,0.12)" }}
        >
          <div className="mb-2 flex items-center gap-2">
            <ShieldAlert className="size-4 text-[#FF4D4D]" />
            <span
              className="text-[#FF4D4D]"
              style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em" }}
            >
              CRÍTICO · RED-S ACTIVO
            </span>
          </div>
          <p className="text-slate-300 animate-all duration-300" style={{ fontSize: "0.72rem", lineHeight: 1.5 }}>
            Déficit Relativo de Energía en el Deporte detectado (Disponibilidad Energética:{" "}
            <span className="text-[#FF4D4D] font-bold">{metrics.energyAvailability} kcal/kg FFM/día</span>). 
            Grasas bloqueadas en <span className="text-[#FF4D4D] font-bold">{metrics.macros.fat}g</span> (0.6 g/kg). 
            Carbos comprimidos a <span className="text-[#FF4D4D] font-bold">{metrics.macros.carbs}g</span> para proteger la línea base hormonal.
          </p>
        </div>
      );
    }

    if (metrics.isHardClampActive) {
      return (
        <div
          className="mt-auto rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/[0.08] p-4"
          style={{ boxShadow: "inset 0 0 20px rgba(245,158,11,0.12)" }}
        >
          <div className="mb-2 flex items-center gap-2">
            <ShieldAlert className="size-4 text-[#F59E0B]" />
            <span
              className="text-[#F59E0B]"
              style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em" }}
            >
              ADVERTENCIA · CIERRE DE LÍPIDOS ACTIVO
            </span>
          </div>
          <p className="text-slate-300 animate-all duration-300" style={{ fontSize: "0.72rem", lineHeight: 1.5 }}>
            Sistema de Cierre de Lípidos Hormonal Activo. Piso de lípidos bloqueado en{" "}
            <span className="text-[#F59E0B] font-bold">0.6 g/kg</span> ({metrics.macros.fat}g/día) para salvaguardar
            la testosterona endógena. Carbohidratos ajustados automáticamente.
          </p>
        </div>
      );
    }

    // Default stable state
    return (
      <div
        className="mt-auto rounded-xl border border-[#39FF14]/30 bg-[#39FF14]/[0.04] p-4"
        style={{ boxShadow: "inset 0 0 20px rgba(57,255,20,0.06)" }}
      >
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle2 className="size-4 text-[#39FF14]" />
          <span
            className="text-[#39FF14]"
            style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em" }}
          >
            ESTADO DEL SISTEMA · NOMINAL
          </span>
        </div>
        <p className="text-slate-300 animate-all duration-300" style={{ fontSize: "0.72rem", lineHeight: 1.5 }}>
          Todos los parámetros fisiológicos nominales. La Disponibilidad Energética es{" "}
          <span className="text-[#39FF14] font-bold">{metrics.energyAvailability} kcal/kg FFM/día</span>. 
          Base endocrina asegurada.
        </p>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-[#1E293B] bg-white/[0.03] p-6 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Wind className="size-4 text-[#00F0FF]" />
        <h3 style={{ fontWeight: 600, fontSize: "0.9rem" }}>Flujo Endotelial</h3>
      </div>

      <div className="flex flex-col items-center gap-1 pb-2">
        <Gauge pct={metrics.noxScore / 100} />
        <span className="text-slate-400 mt-2" style={{ fontSize: "0.72rem" }}>
          Índice NOx · L-Citrulina ({profile.citrullineGrams}g)
        </span>
      </div>

      {getAlertBanner()}
    </div>
  );
}
