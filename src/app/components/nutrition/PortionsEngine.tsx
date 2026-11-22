import { useState } from "react";
import { CornerDownRight, Sigma } from "lucide-react";
import { FOODS } from "./nutrition-data";

interface Props {
  selected: string[];
}

export function PortionsEngine({ selected }: Props) {
  // Let the user interactively adjust target for this session!
  const [targetProtein, setTargetProtein] = useState(55);
  const [targetFat, setTargetFat] = useState(18);

  const items = FOODS.filter((f) => selected.includes(f.id));

  // Compute incidental macros from selected items EXCEPT Pechuga de Pollo (pollo)
  let incidentalProtein = 0;
  let incidentalFat = 0;
  const incidentalDetails: { name: string; protein: number; fats: number }[] = [];

  items.forEach((f) => {
    if (f.id !== "pollo") {
      const servingGrams = 100; // Assumed standard serving
      const p = (f.protein * servingGrams) / 100;
      const fat = (f.fats * servingGrams) / 100;
      incidentalProtein += p;
      incidentalFat += fat;
      incidentalDetails.push({ name: f.name, protein: p, fats: fat });
    }
  });

  const hasChicken = selected.includes("pollo");
  const remainingProtein = Math.max(0, targetProtein - incidentalProtein);

  // Pechuga de Pollo has 31.0g protein per 100g
  const chicken = FOODS.find((f) => f.id === "pollo");
  const rawChickenNeeded = chicken ? (remainingProtein / chicken.protein) * 100 : 0;
  const remainingFatAllowance = Math.max(0, targetFat - incidentalFat);

  return (
    <aside className="flex flex-col w-full min-w-0 border border-slate-100 rounded-3xl bg-white shadow-xl shadow-slate-200/50 overflow-hidden min-h-[300px]">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <Sigma className="h-4 w-4 text-emerald-600" />
        <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
          Ingeniería Inversa · Porciones
        </h2>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Session Target Lock with Sliders */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono">
            Objetivos de la Sesión
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white p-3 border border-slate-100 shadow-sm">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Proteína</span>
                <span className="text-emerald-700 font-mono font-extrabold">{targetProtein}g</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={targetProtein}
                onChange={(e) => setTargetProtein(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div className="rounded-xl bg-white p-3 border border-slate-100 shadow-sm">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Grasa Perm.</span>
                <span className="text-amber-700 font-mono font-extrabold">{targetFat}g</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="2"
                value={targetFat}
                onChange={(e) => setTargetFat(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Telemetry Trace */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700 shadow-xs">
          <div className="mb-2.5 flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            Trazado de Telemetría
          </div>

          {items.length === 0 ? (
            <p className="text-slate-500">// Selecciona alimentos clínicos para calcular porciones...</p>
          ) : (
            <div className="space-y-3 text-slate-600">
              {incidentalDetails.length > 0 ? (
                <div className="space-y-2">
                  <p className="flex items-baseline justify-between">
                    <span className="text-slate-600 font-medium">› Grasas Incidentales:</span>
                    <span className="font-bold text-amber-700 font-mono">{incidentalFat.toFixed(1)}g</span>
                  </p>
                  <p className="flex items-center justify-between pl-3 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <CornerDownRight className="h-3 w-3 shrink-0 text-slate-400" />
                      Permiso de grasa residual →
                    </span>
                    <span className="text-amber-700 font-bold font-mono">{remainingFatAllowance.toFixed(1)}g</span>
                  </p>
                  <p className="flex items-baseline justify-between pt-1">
                    <span className="text-slate-600 font-medium">› Proteína Incidental:</span>
                    <span className="font-bold text-emerald-700 font-mono">{incidentalProtein.toFixed(1)}g</span>
                  </p>
                  <p className="flex items-center justify-between pl-3 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <CornerDownRight className="h-3 w-3 shrink-0 text-slate-400" />
                      Proteína restante →
                    </span>
                    <span className="text-emerald-700 font-bold font-mono">{remainingProtein.toFixed(1)}g</span>
                  </p>
                </div>
              ) : (
                <p className="text-slate-500">// Sin fuentes de macros incidentales seleccionadas.</p>
              )}

              {hasChicken ? (
                <div className="border-t border-slate-200/80 pt-2.5 space-y-1">
                  <p className="text-slate-900 font-medium flex items-baseline justify-between">
                    <span>
                      <span className="text-emerald-600 font-bold mr-1">›</span> Pechuga de Pollo Limpia Cruda:
                    </span>
                    <span className="font-extrabold text-emerald-700 font-mono text-sm">
                      {rawChickenNeeded.toFixed(0)}g
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    El pollo rinde 31g de proteína neta por cada 100g en crudo.
                  </p>
                </div>
              ) : (
                <div className="border-t border-slate-200/80 pt-2 text-slate-500 text-[11px]">
                  // Agrega Pechuga de Pollo para calcular los gramos requeridos.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Computed Portions Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 shadow-xs">
          <div className="mb-2.5 font-mono text-xs uppercase tracking-wider text-slate-600 font-bold">
            Pesos Crudos Calculados (Por porción de 100g)
          </div>
          <div className="space-y-1.5">
            {items.length === 0 && (
              <p className="font-mono text-xs text-slate-500 italic">— sin elementos —</p>
            )}
            {items.map((f) => {
              const grams = f.id === "pollo" ? rawChickenNeeded : 100;
              return (
                <div
                  key={`portion-${f.id}`}
                  className="flex items-center justify-between rounded-xl bg-white border border-slate-200/70 px-3 py-2 shadow-xs"
                >
                  <span className="text-xs font-semibold text-slate-800">{f.name}</span>
                  <span className="font-mono text-xs font-extrabold text-sky-700">
                    {grams.toFixed(0)}g
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
