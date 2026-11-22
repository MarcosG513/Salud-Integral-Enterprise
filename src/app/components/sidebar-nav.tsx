import {
  LayoutDashboard,
  Salad,
  Dumbbell,
  HeartPulse,
  Pill,
  Activity,
  User,
  HelpCircle,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Tablero", icon: LayoutDashboard },
  { id: "nutrition", label: "Nutrición", icon: Salad },
  { id: "training", label: "Entrenamiento", icon: Dumbbell },
  { id: "hormonal", label: "Salud Hormonal", icon: HeartPulse },
  { id: "supplements", label: "Suplementos", icon: Pill },
  { id: "help", label: "Guía y Ayuda", icon: HelpCircle },
];

interface SidebarNavProps {
  active: string;
  setActive: (id: string) => void;
}

export function SidebarNav({ active, setActive }: SidebarNavProps) {
  return (
    <aside className="flex w-full md:w-20 md:h-screen md:fixed md:inset-y-0 md:left-0 shrink-0 flex-row md:flex-col items-center justify-between md:justify-start gap-1 sm:gap-3 md:gap-6 border-b md:border-b-0 md:border-r border-slate-200/80 bg-white/95 px-2 sm:px-4 py-2 md:py-8 backdrop-blur-xl z-50 shadow-sm">
      {/* Brand mark */}
      <div
        className="hidden sm:flex size-10 md:size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shrink-0 shadow-lg shadow-rose-500/30 spring-bounce"
      >
        <Activity className="size-5 md:size-6 text-white" strokeWidth={2.5} />
      </div>

      <nav className="flex flex-row md:flex-col items-center gap-0.5 sm:gap-2.5 flex-1 justify-center">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              title={item.label}
              aria-label={item.label}
              className={`group relative flex min-w-[44px] min-h-[44px] size-11 sm:size-12 items-center justify-center rounded-2xl transition-all duration-200 spring-bounce cursor-pointer ${
                isActive
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
        type="button"
        onClick={() => setActive("profile")}
        title="Perfil del Operador"
        aria-label="Perfil del Operador"
        className={`min-w-[44px] min-h-[44px] size-11 sm:size-10 rounded-full border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
          active === "profile"
            ? "border-rose-500 bg-rose-50 text-rose-600 shadow-sm"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
        }`}
      >
        <User className="w-5 h-5" strokeWidth={2} />
      </button>
    </aside>
  );
}
