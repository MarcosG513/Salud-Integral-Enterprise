import { AlertTriangle, ShieldCheck, Moon, Ban } from "lucide-react";
import { GlassCard, PanelHeader, mono } from "./telemetry-primitives";

type Intercept = {
  id: string;
  level: "block" | "warn" | "clear";
  code: string;
  title: string;
  body: string;
  time: string;
};

const INTERCEPTS: Intercept[] = [
  {
    id: "caf",
    level: "block",
    code: "INTERCEPCIÓN CIRCADIANA",
    title: "Cafeína registrada después de las 14:00",
    body: "El antagonismo competitivo del receptor de adenosina corre el riesgo de alterar la arquitectura del sueño profundo. Bloqueando la ventana de absorción de la tarde.",
    time: "16:24",
  },
  {
    id: "iron",
    level: "warn",
    code: "CONFLICTO DE QUELACIÓN",
    title: "Coingestión de Hierro + Calcio",
    body: "La competencia de cationes divalentes en el transportador DMT1 reduce la absorción de hierro no hemo en ~45%. Se recomienda separar por 2h.",
    time: "12:10",
  },
  {
    id: "cit",
    level: "clear",
    code: "SINERGIA VERIFICADA",
    title: "Sinergia L-Citrulina + Nitrato",
    body: "Las vías eNOS y nitrato-nitrito-NO no son competitivas. Vasodilatación combinada aprobada para la ventana pre-entrenamiento.",
    time: "16:00",
  },
];

const CFG = {
  block: { 
    accent: "#EF4444", 
    Icon: Ban, 
    label: "BLOQUEADO",
    bgClass: "bg-rose-50/70 border-rose-200 text-rose-900",
    badgeClass: "bg-rose-100 border-rose-300 text-rose-700" 
  },
  warn: { 
    accent: "#F59E0B", 
    Icon: AlertTriangle, 
    label: "ADVERTENCIA",
    bgClass: "bg-amber-50/70 border-amber-200 text-amber-900",
    badgeClass: "bg-amber-100 border-amber-300 text-amber-700" 
  },
  clear: { 
    accent: "#10B981", 
    Icon: ShieldCheck, 
    label: "APROBADO",
    bgClass: "bg-emerald-50/70 border-emerald-200 text-emerald-900",
    badgeClass: "bg-emerald-100 border-emerald-300 text-emerald-700" 
  },
} as const;

export function InteractionInterceptor() {
  return (
    <GlassCard className="h-full flex flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/40">
      <PanelHeader
        index="03"
        title="Interceptor de Interacción de Nutrientes"
        accent="#EF4444"
        right={<Moon size={14} className="text-slate-400" />}
      />

      <div className="p-1 flex-1 overflow-auto space-y-3">
        {INTERCEPTS.map((it) => {
          const { Icon, label, bgClass, badgeClass, accent } = CFG[it.level];
          return (
            <div
              key={`intercept-${it.id}`}
              className={`rounded-2xl p-4 border shadow-xs transition-all ${bgClass}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={15} style={{ color: accent }} />
                  <span className="text-xs uppercase tracking-[0.14em] font-mono font-black" style={{ color: accent }}>
                    {it.code}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-500">{it.time}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-lg uppercase tracking-[0.12em] font-mono font-bold border ${badgeClass}`}
                  >
                    {label}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs sm:text-sm text-slate-900 font-extrabold">{it.title}</div>
              <div className="mt-1 text-xs leading-relaxed text-slate-600 font-mono font-medium">
                {it.body}
              </div>
            </div>
          );
        })}

        {/* Circadian absorption map */}
        <div
          className="rounded-2xl p-4 border border-slate-200 bg-slate-50 shadow-xs"
        >
          <div className="text-xs uppercase tracking-[0.15em] text-slate-600 mb-3 font-mono font-bold">Mapa de Ventanas de Absorción</div>
          <div className="flex gap-[3px]">
            {Array.from({ length: 24 }).map((_, h) => {
              const blocked = h >= 14;
              const active = h >= 16 && h < 18;
              return (
                <div key={`circadian-hour-${h}`} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-md transition-all"
                    style={{
                      height: 24,
                      background: active
                        ? "#0284C7"
                        : blocked
                        ? "#FECACA"
                        : "#A7F3D0",
                    }}
                  />
                  {h % 6 === 0 && (
                    <span className="text-[8px] font-mono font-bold text-slate-500">
                      {String(h).padStart(2, "0")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs uppercase tracking-[0.1em] font-mono font-bold" style={{ ...mono }}>
            <span className="text-emerald-700">■ Abierto</span>
            <span className="text-sky-700">■ Activo</span>
            <span className="text-rose-600">■ Bloqueado</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
