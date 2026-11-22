import { useState } from "react";
import { Check, Plus, ClipboardList, Flame, HeartPulse } from "lucide-react";
import { FOODS, FoodItem } from "./nutrition-data";
import { useClinicalEngine } from "../../../context/clinical-engine-context";

interface Props {
  selected: string[];
  onToggle: (id: string) => void;
}

function MacroCell({ value, unit, color }: { value: number; unit: string; color: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[12px] font-semibold" style={{ color }}>
        {value.toFixed(1)}
      </span>
      <span className="font-mono text-xs uppercase tracking-wider text-slate-600">{unit}</span>
    </div>
  );
}

export function FoodSelectorGrid({ selected, onToggle }: Props) {
  const { customFoods, logFoodItem, addCustomFood, foodLogs, removeFoodLog } = useClinicalEngine();

  // Combine static and custom foods
  const allFoods = [...FOODS, ...Object.values(customFoods)] as FoodItem[];

  // Quick Log form states
  const [logGrams, setLogGrams] = useState(100);
  const [logSuccess, setLogSuccess] = useState(false);

  // Custom Food form states
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [cName, setCName] = useState("");
  const [cCategory, setCCategory] = useState("Custom / Otros");
  const [cKcal, setCKcal] = useState("");
  const [cProtein, setCProtein] = useState("");
  const [cCarbs, setCCarbs] = useState("");
  const [cFats, setCFats] = useState("");

  const handleQuickLog = () => {
    if (selected.length === 0) return;
    selected.forEach((id) => {
      const food = allFoods.find((f) => f.id === id);
      if (food) {
        logFoodItem(food, logGrams);
      }
    });
    setLogSuccess(true);
    setTimeout(() => setLogSuccess(false), 2000);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cKcal) return;

    const newFood: FoodItem = {
      id: `custom-${cName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      name: cName,
      category: cCategory,
      emoji: "🥗",
      kcal: Number(cKcal) || 0,
      protein: Number(cProtein) || 0,
      carbs: Number(cCarbs) || 0,
      fats: Number(cFats) || 0,
    };

    addCustomFood(newFood);
    onToggle(newFood.id); // Auto-select it!
    setCName("");
    setCKcal("");
    setCProtein("");
    setCCarbs("");
    setCFats("");
    setShowCustomForm(false);
  };

  return (
    <section className="flex flex-col w-full min-w-0 border border-slate-100 rounded-3xl bg-white shadow-xl shadow-slate-200/50 overflow-hidden min-h-[350px]">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
        <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
          Selector Interactivo de Alimentos
        </h2>
        <button
          onClick={() => setShowCustomForm(!showCustomForm)}
          className="flex items-center gap-1.5 rounded-2xl bg-indigo-50 border border-indigo-100 px-3 py-1.5 font-mono text-xs text-indigo-600 font-bold hover:bg-indigo-100 transition-all uppercase tracking-wider spring-bounce cursor-pointer"
        >
          <Plus size={12} /> Alimento Personalizado
        </button>
      </div>

      {/* Custom Food Form Drawer */}
      {showCustomForm && (
        <form onSubmit={handleCreateCustom} className="border-b border-slate-100 bg-slate-50 p-4 shrink-0 space-y-3 font-mono text-xs text-slate-900">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-500 font-bold">
            <span>Nuevo Ingrediente Personalizado</span>
            <button type="button" onClick={() => setShowCustomForm(false)} className="text-slate-400 hover:text-slate-700">✕ Cerrar</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-500 uppercase mb-1 font-bold">Nombre</label>
              <input required value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Ej. Crema de Arroz" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 outline-none text-slate-900" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase mb-1 font-bold">Categoría</label>
              <input value={cCategory} onChange={(e) => setCCategory(e.target.value)} placeholder="Ej. Carb rápido" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 outline-none text-slate-900" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs text-slate-500 uppercase mb-1 font-bold">Kcal</label>
              <input type="number" required value={cKcal} onChange={(e) => setCKcal(e.target.value)} placeholder="360" className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 outline-none text-slate-900 text-center" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase mb-1 font-bold">Prot (g)</label>
              <input type="number" value={cProtein} onChange={(e) => setCProtein(e.target.value)} placeholder="20" className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 outline-none text-slate-900 text-center" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase mb-1 font-bold">Carb (g)</label>
              <input type="number" value={cCarbs} onChange={(e) => setCCarbs(e.target.value)} placeholder="50" className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 outline-none text-slate-900 text-center" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase mb-1 font-bold">Grasa (g)</label>
              <input type="number" value={cFats} onChange={(e) => setCFats(e.target.value)} placeholder="5" className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 outline-none text-slate-900 text-center" />
            </div>
          </div>
          <button type="submit" className="w-full rounded-2xl bg-indigo-600 text-white font-extrabold py-2 hover:bg-indigo-700 transition-all uppercase text-xs tracking-wider shadow-md shadow-indigo-500/20 spring-bounce cursor-pointer">
            Guardar Ingrediente
          </button>
        </form>
      )}

      {/* Table Headers */}
      <div className="grid grid-cols-[minmax(125px,1.8fr)_repeat(4,minmax(40px,1fr))] gap-1.5 border-b border-slate-100 bg-slate-50 px-3.5 py-2.5 shrink-0 font-bold text-xs text-slate-500 font-mono uppercase tracking-wider">
        <div>Alimento</div>
        <div className="text-right px-1">Kcal</div>
        <div className="text-right px-1">Prot</div>
        <div className="text-right px-1">Carb</div>
        <div className="text-right px-1">Grasa</div>
      </div>

      {/* Foods Grid List */}
      <div className="flex-1 p-3 sm:p-4">
        <div className="flex flex-col gap-2.5">
          {allFoods.map((f) => {
            const isSel = selected.includes(f.id);
            return (
              <button
                key={`food-${f.id}`}
                onClick={() => onToggle(f.id)}
                className={`grid grid-cols-[minmax(125px,1.8fr)_repeat(4,minmax(40px,1fr))] gap-1.5 items-center rounded-2xl border px-3.5 py-3 text-left transition-all spring-bounce cursor-pointer ${
                  isSel
                    ? "border-rose-400 bg-rose-50/50 shadow-md shadow-rose-500/10"
                    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-[125px] flex-1">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                      isSel ? "border-rose-500 bg-rose-500 text-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSel && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                  </span>
                  <div className="leading-tight flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5 whitespace-normal break-words leading-tight">
                      <span className="shrink-0">{f.emoji || "🥗"}</span>
                      <span className="whitespace-normal break-words">{f.name}</span>
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500 whitespace-normal leading-tight mt-0.5">
                      {f.category}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono text-xs font-extrabold text-emerald-600 tabular-nums px-1">{f.kcal}</div>
                <div className="text-right font-mono text-xs font-bold text-slate-700 tabular-nums px-1">{f.protein}g</div>
                <div className="text-right font-mono text-xs font-bold text-sky-600 tabular-nums px-1">{f.carbs}g</div>
                <div className="text-right font-mono text-xs font-bold text-amber-600 tabular-nums px-1">{f.fats}g</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Log Console */}
      <div className="border-t border-slate-100 bg-slate-50/90 p-3 shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-slate-500 font-bold">Gramos:</span>
          <input
            type="number"
            value={logGrams}
            onChange={(e) => setLogGrams(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-1 outline-none text-slate-900 text-center font-mono font-bold text-xs shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
        <button
          onClick={handleQuickLog}
          disabled={selected.length === 0}
          className={`flex-1 rounded-2xl font-bold py-2 font-mono text-xs tracking-wider uppercase transition-all shadow-sm ${
            selected.length > 0
              ? logSuccess
                ? "bg-emerald-600 text-white shadow-emerald-600/25"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/25 cursor-pointer"
              : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
          }`}
        >
          {logSuccess ? "✓ Registrado con Éxito" : `Registrar Seleccionados (${selected.length})`}
        </button>
      </div>

      {/* Daily Logs Timeline Drawer */}
      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 shrink-0 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-500 uppercase flex items-center gap-1.5 font-semibold">
          <ClipboardList size={13} className="text-indigo-600" /> Línea de Tiempo de Registros:
        </span>
        <span className="text-indigo-600 font-bold">{foodLogs.length} alimentos registrados hoy</span>
      </div>
    </section>
  );
}
