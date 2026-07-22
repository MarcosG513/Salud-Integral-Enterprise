import { LayoutDashboard, HeartPulse, Salad, FlaskConical } from "lucide-react";
import { COLORS, mono } from "./tokens";

const tabs = [
  { id: "dashboard", label: "Main Dashboard", icon: LayoutDashboard },
  { id: "hormonal", label: "Hormonal Health", icon: HeartPulse },
  { id: "nutrition", label: "Nutrition Views", icon: Salad },
  { id: "labs", label: "Lab Panels", icon: FlaskConical },
];

interface NavDockProps {
  active: string;
  onChange: (id: string) => void;
}

export function NavDock({ active, onChange }: NavDockProps) {
  return (
    <div className="flex justify-center">
      <div
        className="flex items-center gap-1 rounded-xl p-1.5 backdrop-blur-xl"
        style={{ background: "rgba(15,19,34,0.9)", border: `1px solid ${COLORS.border}` }}
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
              style={{
                background: isActive ? `${COLORS.cyan}14` : "transparent",
                border: `1px solid ${isActive ? COLORS.cyan : "transparent"}`,
                color: isActive ? COLORS.cyan : COLORS.textDim,
              }}
            >
              <Icon size={15} />
              <span style={{ ...mono, fontSize: 11, letterSpacing: "0.04em" }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
