import { Sunrise, Sun, Zap, Moon, Clock } from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";

export function NutrientTimeline() {
  const { metrics } = useClinicalEngine();
  const targetCalories = metrics.targetCalories;

  const MEALS_CONFIG = [
    {
      id: "breakfast",
      name: "Desayuno",
      pct: 35,
      icon: Sunrise,
      tag: "0–30 min post-despertar",
      tagIcon: Clock,
      baseOats: 90,
      baseEggs: 3,
      itemsTemplate: (oats: number, eggs: number) => [
        "Aislado de suero 40g",
        `Avena ${oats}g`,
        "Arándanos 100g",
        `Huevos x${eggs}`,
      ],
      accent: "#10B981",
    },
    {
      id: "lunch",
      name: "Almuerzo",
      pct: 30,
      icon: Sun,
      tag: "Ancla del mediodía",
      tagIcon: Clock,
      baseChicken: 220,
      baseRice: 120,
      itemsTemplate: (chicken: number, rice: number) => [
        `Pechuga de pollo ${chicken}g`,
        `Arroz basmati ${rice}g`,
        "Aguacate 50g",
      ],
      accent: "#0284C7",
    },
    {
      id: "postworkout",
      name: "Post-Entrenamiento",
      pct: 15,
      icon: Zap,
      tag: "Ventana de glucógeno",
      tagIcon: Clock,
      baseDextrose: 45,
      baseProtein: 35,
      itemsTemplate: (dextrose: number, protein: number) => [
        `Dextrosa ${dextrose}g`,
        `Proteína de suero ${protein}g`,
        "Creatina 3–5g",
      ],
      accent: "#8B5CF6",
    },
    {
      id: "dinner",
      name: "Cena",
      pct: 20,
      icon: Moon,
      tag: "Relajación de cortisol",
      tagIcon: Clock,
      baseSalmon: 180,
      basePotato: 150,
      itemsTemplate: (salmon: number, potato: number) => [
        `Salmón ${salmon}g`,
        `Camote ${potato}g`,
        "Brócoli 120g",
      ],
      accent: "#06B6D4",
    },
  ];

  const scale = targetCalories / 2800;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm text-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900">
            Cronología de Sincronización de Nutrientes
          </h3>
          <span className="text-slate-600 text-xs">
            Protocolo de distribución cada 3–4 h · 4 comidas
          </span>
        </div>
        <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-sky-700 text-[11px] font-bold font-mono">
          ADAPTATIVO
        </span>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MEALS_CONFIG.map((meal) => {
          const Icon = meal.icon;
          const TagIcon = meal.tagIcon;
          const mealKcal = Math.round(targetCalories * (meal.pct / 100));

          let items: string[] = [];
          if (meal.id === "breakfast") {
            items = meal.itemsTemplate(
              Math.round((meal.baseOats ?? 90) * scale),
              Math.max(1, Math.round((meal.baseEggs ?? 3) * scale))
            );
          } else if (meal.id === "lunch") {
            items = meal.itemsTemplate(
              Math.round((meal.baseChicken ?? 220) * scale),
              Math.round((meal.baseRice ?? 120) * scale)
            );
          } else if (meal.id === "postworkout") {
            items = meal.itemsTemplate(
              Math.round((meal.baseDextrose ?? 45) * scale),
              Math.round((meal.baseProtein ?? 35) * scale)
            );
          } else if (meal.id === "dinner") {
            items = meal.itemsTemplate(
              Math.round((meal.baseSalmon ?? 180) * scale),
              Math.round((meal.basePotato ?? 150) * scale)
            );
          }

          return (
            <div
              key={`meal-${meal.id}`}
              className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="flex size-8 items-center justify-center rounded-xl"
                    style={{
                      background: `${meal.accent}15`,
                      color: meal.accent,
                    }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="text-slate-900 text-xs font-bold">{meal.name}</span>
                </div>
                <span
                  className="tabular-nums font-mono font-bold text-sm"
                  style={{ color: meal.accent }}
                >
                  {meal.pct}%
                </span>
              </div>

              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${meal.pct}%`,
                    background: meal.accent,
                  }}
                />
              </div>

              <div className="mb-2 flex items-center gap-1.5 text-slate-600 text-[11px]">
                <TagIcon className="size-3" />
                <span>{meal.tag}</span>
              </div>

              <div className="mb-3 tabular-nums text-slate-900 font-bold text-xs font-mono">
                {mealKcal.toLocaleString()} kcal
              </div>

              <ul className="mt-auto space-y-1">
                {items.map((item, idx) => (
                  <li
                    key={`item-${meal.id}-${idx}`}
                    className="flex items-center gap-1.5 text-slate-600 text-xs"
                  >
                    <span className="text-slate-400">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
