import { Sunrise, Sun, Zap, Moon, Clock } from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";

export function NutrientTimeline() {
  const { metrics } = useClinicalEngine();
  const targetCalories = metrics.targetCalories;

  // Baseline percentages for Cortisol Mitigation Protocol (sum to 100%)
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
      accent: "#39FF14",
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
      accent: "#00F0FF",
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
        `Proteína hidrolizada ${protein}g`,
        "Creatina 5g",
      ],
      accent: "#A855F7",
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
      accent: "#39FF14",
    },
  ];

  // Scale factor based on reference 2800 kcal
  const scale = targetCalories / 2800;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#1E293B] bg-white/[0.03] p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 style={{ fontWeight: 600, fontSize: "0.95rem" }}>
            Cronología de Sincronización de Nutrientes
          </h3>
          <span className="text-slate-500" style={{ fontSize: "0.72rem" }}>
            Protocolo de Mitigación de Cortisol · 4 comidas
          </span>
        </div>
        <span
          className="rounded-md bg-[#00F0FF]/10 px-2 py-0.5 text-[#00F0FF]"
          style={{ fontSize: "0.65rem", fontWeight: 600 }}
        >
          ADAPTATIVO
        </span>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MEALS_CONFIG.map((meal) => {
          const Icon = meal.icon;
          const TagIcon = meal.tagIcon;
          
          // Calculate dynamic kcal for this meal
          const mealKcal = Math.round(targetCalories * (meal.pct / 100));

          // Generate dynamic items list scaled to calorie target
          let items: string[] = [];
          if (meal.id === "breakfast") {
            const oats = Math.round(meal.baseOats * scale);
            const eggs = Math.max(1, Math.round(meal.baseEggs * scale));
            items = meal.itemsTemplate(oats, eggs);
          } else if (meal.id === "lunch") {
            const chicken = Math.round(meal.baseChicken * scale);
            const rice = Math.round(meal.baseRice * scale);
            items = meal.itemsTemplate(chicken, rice);
          } else if (meal.id === "postworkout") {
            const dextrose = Math.round(meal.baseDextrose * scale);
            const protein = Math.round(meal.baseProtein * scale);
            items = meal.itemsTemplate(dextrose, protein);
          } else if (meal.id === "dinner") {
            const salmon = Math.round(meal.baseSalmon * scale);
            const potato = Math.round(meal.basePotato * scale);
            items = meal.itemsTemplate(salmon, potato);
          }

          return (
            <div
              key={`meal-${meal.id}`}
              className="flex flex-col rounded-xl border border-[#1E293B] bg-black/25 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="flex size-8 items-center justify-center rounded-lg"
                    style={{
                      background: `${meal.accent}18`,
                      color: meal.accent,
                    }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="text-slate-200" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                    {meal.name}
                  </span>
                </div>
                <span
                  className="tabular-nums"
                  style={{ color: meal.accent, fontWeight: 700, fontSize: "0.9rem" }}
                >
                  {meal.pct}%
                </span>
              </div>

              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[#1E293B]">
                <div
                  className="h-full rounded-full animate-all duration-500"
                  style={{
                    width: `${meal.pct}%`,
                    background: meal.accent,
                    boxShadow: `0 0 8px ${meal.accent}`,
                  }}
                />
              </div>

              <div className="mb-3 flex items-center gap-1.5 text-slate-500">
                <TagIcon className="size-3" />
                <span style={{ fontSize: "0.65rem" }}>{meal.tag}</span>
              </div>

              <div className="mb-3 tabular-nums text-slate-300 font-bold" style={{ fontSize: "0.72rem" }}>
                {mealKcal.toLocaleString()} kcal
              </div>

              <ul className="mt-auto space-y-1">
                {items.map((item, idx) => (
                  <li
                    key={`item-${meal.id}-${idx}`}
                    className="flex items-center gap-1.5 text-slate-400"
                    style={{ fontSize: "0.68rem" }}
                  >
                    <span
                      className="size-1 rounded-full"
                      style={{ background: meal.accent }}
                    />
                    {item}
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
