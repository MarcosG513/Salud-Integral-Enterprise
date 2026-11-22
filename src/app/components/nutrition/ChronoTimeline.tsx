import { useClinicalEngine } from "../../../context/clinical-engine-context";
import { MEALS, MealPhase } from "./nutrition-data";

const MACROS: { key: "protein" | "carbs" | "fats"; fill: "fillProtein" | "fillCarbs" | "fillFats"; label: string; gradient: string; glow: string }[] = [
  { key: "protein", fill: "fillProtein", label: "PRO", gradient: "linear-gradient(90deg, #10B981, #34D399)", glow: "rgba(16,185,129,0.4)" },
  { key: "carbs", fill: "fillCarbs", label: "CHO", gradient: "linear-gradient(90deg, #06B6D4, #38BDF8)", glow: "rgba(6,182,212,0.4)" },
  { key: "fats", fill: "fillFats", label: "FAT", gradient: "linear-gradient(90deg, #F59E0B, #FBBF24)", glow: "rgba(245,158,11,0.4)" },
];

function MacroLine({ meal, m }: { meal: MealPhase; m: (typeof MACROS)[number] }) {
  const target = meal[m.key];
  const logged = meal[m.fill];
  const pct = target ? Math.min(100, (logged / target) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 font-mono text-xs font-bold tracking-widest text-slate-500">{m.label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 border border-slate-200">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: m.gradient, boxShadow: `0 0 8px ${m.glow}` }}
        />
      </div>
      <span className="w-16 text-right font-mono text-xs font-bold text-slate-700">
        {logged}<span className="text-slate-400 font-normal">/{target}g</span>
      </span>
    </div>
  );
}

const MEAL_IMAGES: Record<string, string> = {
  breakfast: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=600&q=80",
  lunch: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
  postworkout: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80",
  dinner: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80",
};

export function ChronoTimeline() {
  const { foodLogs, metrics } = useClinicalEngine();

  // Distribute logged foods into meal buckets based on timestamp hours
  const fillBreakfast = { protein: 0, carbs: 0, fats: 0 };
  const fillLunch = { protein: 0, carbs: 0, fats: 0 };
  const fillPost = { protein: 0, carbs: 0, fats: 0 };
  const fillDinner = { protein: 0, carbs: 0, fats: 0 };

  foodLogs.forEach((item: any) => {
    const dateObj = item.timestamp ? new Date(item.timestamp) : new Date();
    const hour = dateObj.getHours();
    const factor = (item.grams || 100) / 100;
    const pro = (item.protein || 0) * factor;
    const cho = (item.carbs || 0) * factor;
    const fat = (item.fats || 0) * factor;

    if (hour >= 5 && hour < 11) {
      fillBreakfast.protein += pro;
      fillBreakfast.carbs += cho;
      fillBreakfast.fats += fat;
    } else if (hour >= 11 && hour < 15) {
      fillLunch.protein += pro;
      fillLunch.carbs += cho;
      fillLunch.fats += fat;
    } else if (hour >= 15 && hour < 19) {
      fillPost.protein += pro;
      fillPost.carbs += cho;
      fillPost.fats += fat;
    } else {
      fillDinner.protein += pro;
      fillDinner.carbs += cho;
      fillDinner.fats += fat;
    }
  });

  const scaledMeals = MEALS.map((meal) => {
    const scaleFactor = meal.pct / 100;
    let logged = { protein: 0, carbs: 0, fats: 0 };
    if (meal.id === "breakfast") logged = fillBreakfast;
    if (meal.id === "lunch") logged = fillLunch;
    if (meal.id === "postworkout") logged = fillPost;
    if (meal.id === "dinner") logged = fillDinner;

    return {
      ...meal,
      protein: Math.round(metrics.macros.protein * scaleFactor),
      carbs: Math.round(metrics.macros.carbs * scaleFactor),
      fats: Math.round(metrics.macros.fat * scaleFactor),
      fillProtein: Math.round(logged.protein),
      fillCarbs: Math.round(logged.carbs),
      fillFats: Math.round(logged.fats)
    };
  });

  return (
    <aside className="flex flex-col w-full min-w-0 border border-slate-100 rounded-3xl bg-white shadow-xl shadow-slate-200/50 overflow-hidden min-h-[300px]">
      <div className="border-b border-slate-100 px-5 py-4 shrink-0">
        <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
           Comidas y Metas del Día
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {scaledMeals.map((meal) => (
          <div
            key={`timeline-meal-${meal.id}`}
            className="relative rounded-2xl border border-slate-100 bg-slate-50/50 overflow-hidden transition-all hover:shadow-md w-full max-w-full min-w-0 spring-bounce"
          >
            {/* Meal Photography Banner */}
            <div className="relative h-24 w-full overflow-hidden">
              <img
                src={MEAL_IMAGES[meal.id] || MEAL_IMAGES.breakfast}
                alt={meal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent flex items-end p-3 justify-between">
                <div>
                  <h3 className="text-white font-extrabold text-sm tracking-tight">{meal.name}</h3>
                  <p className="text-white/80 text-[10px] font-medium">{meal.phase}</p>
                </div>
                <span className="rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-xs font-bold text-white">
                  {meal.pct}% del total
                </span>
              </div>
            </div>

            <div className="p-3.5 space-y-2 bg-white">
              {MACROS.map((m) => (
                <MacroLine key={`macro-${meal.id}-${m.key}`} meal={meal} m={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
