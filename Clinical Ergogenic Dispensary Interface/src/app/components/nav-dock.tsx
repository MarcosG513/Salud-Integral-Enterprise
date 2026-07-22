import { useState } from "react";
import { LayoutDashboard, Pill, Apple, Dna, Activity } from "lucide-react";
import { COLORS, mono } from "./telemetry-primitives";

const ITEMS = [
  { id: "dash", label: "Main Dashboard", Icon: LayoutDashboard },
  { id: "supp", label: "Supplementation", Icon: Pill },
  { id: "nutri", label: "Nutrition", Icon: Apple },
  { id: "horm", label: "Hormonal", Icon: Dna },
];

export function NavDock() {
  const [active, setActive] = useState("supp");
  return (
    <div
      className="rounded-lg backdrop-blur-xl px-3 py-2.5 flex items-center justify-between"
      style={{
        background: "linear-gradient(160deg, rgba(15,19,34,0.92), rgba(9,12,22,0.94))",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div className="flex items-center gap-1.5">
        {ITEMS.map(({ id, label, Icon }) => {
          const on = id === active;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md transition-all"
              style={{
                border: `1px solid ${on ? COLORS.cyan + "66" : "transparent"}`,
                background: on ? `${COLORS.cyan}12` : "transparent",
                color: on ? COLORS.cyan : "#64748B",
              }}
            >
              <Icon size={14} />
              <span className="text-[11px] uppercase tracking-[0.12em]" style={{ fontWeight: 600 }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 pr-2">
        <Activity size={13} style={{ color: COLORS.lime }} />
        <span className="text-[9px] uppercase tracking-[0.15em]" style={{ ...mono, color: "#64748B" }}>
          Telemetry Sync
        </span>
        <span className="text-[10px]" style={{ ...mono, color: COLORS.lime }}>ONLINE</span>
      </div>
    </div>
  );
}
