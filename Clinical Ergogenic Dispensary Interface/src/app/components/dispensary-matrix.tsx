import { COLORS, GlassCard, PanelHeader, Meter, mono } from "./telemetry-primitives";

type Compound = {
  id: string;
  name: string;
  abbr: string;
  dose: string;
  tracked: string; // raw mg tracking
  saturation: number;
  pathway: string;
  cls: "A" | "B";
};

const COMPOUNDS: Compound[] = [
  { id: "cre", name: "Creatine Monohydrate", abbr: "CrM", dose: "5.0 g", tracked: "5000 / 5000 mg", saturation: 100, pathway: "ATP Resynthesis", cls: "A" },
  { id: "cit", name: "L-Citrulline Malate", abbr: "CitM", dose: "8.0 g", tracked: "0 / 8000 mg", saturation: 0, pathway: "eNOS Saturation", cls: "A" },
  { id: "ash", name: "Ashwagandha KSM-66", abbr: "KSM", dose: "600 mg", tracked: "600 / 600 mg", saturation: 74, pathway: "Cortisol Blunting", cls: "A" },
  { id: "caf", name: "Caffeine Anhydrous", abbr: "CAF", dose: "200 mg", tracked: "200 / 200 mg", saturation: 88, pathway: "Adenosine Antagonism", cls: "A" },
  { id: "bet", name: "Beta-Alanine", abbr: "β-ALA", dose: "3.2 g", tracked: "1600 / 3200 mg", saturation: 50, pathway: "Carnosine Buffering", cls: "A" },
  { id: "the", name: "L-Theanine", abbr: "THN", dose: "100 mg", tracked: "100 / 100 mg", saturation: 62, pathway: "Alpha-Wave Modulation", cls: "B" },
];

function ClassTag({ cls }: { cls: "A" | "B" }) {
  const accent = cls === "A" ? COLORS.lime : COLORS.cyan;
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-[0.1em]"
      style={{ ...mono, color: accent, border: `1px solid ${accent}55`, background: `${accent}12` }}
    >
      Class {cls}
    </span>
  );
}

export function DispensaryMatrix() {
  return (
    <GlassCard className="h-full flex flex-col">
      <PanelHeader
        index="01"
        title="Class A Evidence Dispensary"
        accent={COLORS.lime}
        right={
          <span className="text-[9px] uppercase tracking-[0.15em]" style={{ ...mono, color: "#64748B" }}>
            {COMPOUNDS.length} Compounds
          </span>
        }
      />
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {COMPOUNDS.map((c) => {
          const accent = c.cls === "A" ? COLORS.lime : COLORS.cyan;
          const empty = c.saturation === 0;
          return (
            <div
              key={c.id}
              className="rounded-md p-3 transition-colors hover:bg-white/[0.02]"
              style={{
                border: `1px solid ${empty ? COLORS.coral + "55" : COLORS.border}`,
                background: empty ? `${COLORS.coral}08` : "rgba(7,10,19,0.5)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-[10px] px-1.5 py-1 rounded shrink-0"
                    style={{ ...mono, color: accent, border: `1px solid ${accent}44`, background: `${accent}0D` }}
                  >
                    {c.abbr}
                  </span>
                  <span className="text-[12px] text-slate-100 truncate" style={{ fontWeight: 600 }}>
                    {c.name}
                  </span>
                </div>
                <ClassTag cls={c.cls} />
              </div>

              <div className="mt-2.5 grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[8px] uppercase tracking-[0.12em] text-slate-500">Eff. Dose</div>
                  <div className="text-[13px]" style={{ ...mono, color: accent, fontWeight: 700 }}>{c.dose}</div>
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-[0.12em] text-slate-500">Raw Track</div>
                  <div className="text-[11px] text-slate-300" style={mono}>{c.tracked}</div>
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-[0.12em] text-slate-500">Pathway</div>
                  <div className="text-[10px] text-slate-300" style={{ fontWeight: 500 }}>{c.pathway}</div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <Meter value={c.saturation} accent={empty ? COLORS.coral : accent} height={5} />
                <span
                  className="text-[10px] tabular-nums shrink-0"
                  style={{ ...mono, color: empty ? COLORS.coral : accent }}
                >
                  {c.saturation}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
