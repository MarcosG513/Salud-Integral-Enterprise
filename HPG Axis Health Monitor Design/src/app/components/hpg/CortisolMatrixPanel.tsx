import { Sunrise, Dumbbell, Sun, Moon } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { COLORS, mono } from "./tokens";

const anchors = [
  {
    icon: Sunrise,
    window: "06:30 – 08:00",
    title: "Morning Cortisol Spike",
    metric: "CAR +142%",
    detail: "Sunlight exposure + protein prime · leverage awakening response for drive",
    color: COLORS.cyan,
    status: "SYNCED",
  },
  {
    icon: Dumbbell,
    window: "16:00 – 17:30",
    title: "Post-Workout Glycogen Window",
    metric: "45g CHO",
    detail: "Blunt training cortisol · insulin-mediated recovery + mTOR signalling",
    color: COLORS.lime,
    status: "OPTIMAL",
  },
  {
    icon: Sun,
    window: "12:00 – 14:00",
    title: "Midday Adrenal Plateau",
    metric: "8.4 µg/dL",
    detail: "Stable baseline · avoid caffeine stacking to protect afternoon taper",
    color: COLORS.textMute,
    status: "STABLE",
  },
  {
    icon: Moon,
    window: "21:30 – 23:00",
    title: "Nighttime GABA / Melatonin",
    metric: "0.3 mg Mel",
    detail: "GABAergic wind-down · cortisol nadir enables nocturnal LH testosterone surge",
    color: COLORS.lime,
    status: "SYNCED",
  },
];

export function CortisolMatrixPanel() {
  return (
    <GlassCard title="Cortisol · Circadian Alignment Matrix" code="HPA//CIRC-04" accent={COLORS.cyan}>
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(7,10,19,0.6)", border: `1px solid ${COLORS.border}` }}>
          <span className="uppercase" style={{ color: COLORS.textDim, fontSize: 9, letterSpacing: "0.14em" }}>
            Daily Synchronization
          </span>
          <span style={{ ...mono, color: COLORS.lime, fontSize: 13 }}>92.4%</span>
        </div>

        <div className="relative flex flex-1 flex-col gap-2.5">
          {anchors.map((a, i) => {
            const Icon = a.icon;
            return (
              <div
                key={a.title}
                className="relative flex gap-3 rounded-lg p-3"
                style={{ background: "rgba(7,10,19,0.55)", border: `1px solid ${COLORS.border}` }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                  style={{ background: `${a.color}12`, border: `1px solid ${a.color}55` }}
                >
                  <Icon size={16} color={a.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span style={{ color: "#E2E8F0", fontSize: 12 }}>{a.title}</span>
                    <span style={{ ...mono, color: a.color, fontSize: 11 }}>{a.metric}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ ...mono, color: COLORS.textDim, fontSize: 9 }}>{a.window}</span>
                    <span
                      className="rounded-sm px-1.5"
                      style={{ ...mono, color: a.color, fontSize: 8, background: `${a.color}14`, letterSpacing: "0.08em" }}
                    >
                      {a.status}
                    </span>
                    <span style={{ ...mono, color: COLORS.textDim, fontSize: 9, marginLeft: "auto", opacity: 0 }}>·</span>
                  </div>
                  <p style={{ ...mono, color: COLORS.textDim, fontSize: 9, lineHeight: 1.5, marginTop: 4 }}>{a.detail}</p>
                </div>
                <span style={{ ...mono, color: COLORS.border, fontSize: 10, position: "absolute", top: 8, right: 10 }}>
                  0{i + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
