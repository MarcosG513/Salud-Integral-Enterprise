import {
  LayoutDashboard,
  Salad,
  Dumbbell,
  HeartPulse,
  Pill,
  Activity,
  User,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Tablero", icon: LayoutDashboard },
  { id: "nutrition", label: "Nutrición", icon: Salad },
  { id: "training", label: "Entrenamiento", icon: Dumbbell },
  { id: "hormonal", label: "Salud Hormonal", icon: HeartPulse },
  { id: "supplements", label: "Suplementos", icon: Pill },
];

interface SidebarNavProps {
  active: string;
  setActive: (id: string) => void;
}

export function SidebarNav({ active, setActive }: SidebarNavProps) {
  return (
    <aside className="flex w-full md:w-20 md:h-full shrink-0 flex-row md:flex-col items-center justify-between md:justify-start gap-3 md:gap-8 border-b md:border-b-0 md:border-r border-slate-200/80 bg-white/90 px-4 py-2.5 md:py-8 backdrop-blur-xl z-50 shadow-sm">
      {/* Brand mark */}
      <div
        className="flex size-10 md:size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shrink-0 shadow-lg shadow-rose-500/30 spring-bounce"
      >
        <Activity className="size-5 md:size-6 text-white" strokeWidth={2.5} />
      </div>

      <nav className="flex flex-row md:flex-col items-center gap-1.5 sm:gap-3 flex-1 justify-center">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              title={item.label}
              className={`group relative flex size-9 sm:size-12 items-center justify-center rounded-2xl transition-all duration-200 spring-bounce ${
                isActive
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon
                className="size-5 md:size-[22px]"
                strokeWidth={2}
              />
            </button>
          );
        })}
      </nav>

      <button
        onClick={() => setActive("profile")}
        title="Perfil del Operador"
        className={`size-8 sm:size-9 rounded-full border flex items-center justify-center transition-all shrink-0 min-h-[36px] ${
          active === "profile"
            ? "border-[#00F0FF] bg-[#00F0FF]/15 text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.28)]"
            : "border-[#1E293B] bg-white/[0.03] text-slate-500 hover:border-slate-500 hover:text-slate-200"
        }`}
      >
        <User className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
      </button>
    </aside>
  );
}
