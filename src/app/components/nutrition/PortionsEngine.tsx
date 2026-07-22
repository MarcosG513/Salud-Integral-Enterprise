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
                <span className="text-emerald-600 font-mono font-extrabold">{targetProtein}g</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={targetProtein}
                onChange={(e) => setTargetProtein(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#39FF14]"
              />
            </div>
            <div className="rounded-sm bg-[#070A13] p-2">
              <div className="flex justify-between font-mono text-xs uppercase tracking-wider text-slate-600">
                <span>Grasa Perm.</span>
                <span className="text-[#F5A623]">{targetFat}g</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="2"
                value={targetFat}
                onChange={(e) => setTargetFat(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#F5A623]"
              />
            </div>
          </div>
        </div>

        {/* Telemetry Trace */}
        <div className="rounded-sm border border-[#1E293B] bg-[#0F1322] p-3 font-mono text-[11px] leading-relaxed">
          <div className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#00F0FF]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00F0FF]" />
            Trazado de Telemetría
          </div>

          {items.length === 0 ? (
            <p className="text-slate-500">// Selecciona alimentos clínicos para calcular porciones...</p>
          ) : (
            <div className="space-y-3 text-slate-400">
              {incidentalDetails.length > 0 ? (
                <div className="space-y-2">
                  <p>
                    <span className="text-slate-500">›</span> Grasas Incidentales:{" "}
                    <span className="font-bold text-[#F5A623]">{incidentalFat.toFixed(1)}g</span>
                  </p>
                  <p className="flex gap-1.5 pl-3 text-slate-500 text-xs">
                    <CornerDownRight className="h-3 w-3 shrink-0 translate-y-0.5" />
                    Permiso de grasa residual →{" "}
                    <span className="text-[#F5A623] font-bold">{remainingFatAllowance.toFixed(1)}g</span>
                  </p>
                  <p>
                    <span className="text-slate-500">›</span> Proteína Incidental:{" "}
                    <span className="font-bold text-[#39FF14]">{incidentalProtein.toFixed(1)}g</span>
                  </p>
                  <p className="flex gap-1.5 pl-3 text-slate-500 text-xs">
                    <CornerDownRight className="h-3 w-3 shrink-0 translate-y-0.5" />
                    Proteína restante →{" "}
                    <span className="text-[#39FF14] font-bold">{remainingProtein.toFixed(1)}g</span>
                  </p>
                </div>
              ) : (
                <p className="text-slate-500">// Sin fuentes de macros incidentales seleccionadas.</p>
              )}

              {hasChicken ? (
                <div className="border-t border-[#1E293B] pt-2 space-y-1">
                  <p className="text-slate-200">
                    <span className="text-[#39FF14] font-bold">›</span> Pechuga de Pollo Limpia Cruda:{" "}
                    <span className="font-bold text-[#39FF14] [text-shadow:0_0_10px_rgba(57,255,20,0.4)]">
                      {rawChickenNeeded.toFixed(0)}g
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    El pollo rinde 31g de proteína por cada 100g.
                  </p>
                </div>
              ) : (
                <div className="border-t border-[#1E293B] pt-2 text-slate-500 text-xs">
                  // Agrega Pechuga de Pollo para calcular los gramos requeridos.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Computed Portions Table */}
        <div className="rounded-sm border border-[#1E293B] bg-[#0F1322] p-3">
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-slate-500">
            Pesos Crudos Calculados (Por porción de 100g)
          </div>
          <div className="space-y-1.5">
            {items.length === 0 && (
              <p className="font-mono text-xs text-slate-600">— sin elementos —</p>
            )}
            {items.map((f) => {
              const grams = f.id === "pollo" ? rawChickenNeeded : 100;
              return (
                <div
                  key={`portion-${f.id}`}
                  className="flex items-center justify-between rounded-sm bg-[#070A13] px-2.5 py-1.5"
                >
                  <span className="text-[11px] text-slate-300">{f.name}</span>
                  <span className="font-mono text-[12px] font-bold text-[#00F0FF]">
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
