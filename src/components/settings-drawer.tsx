import React from 'react';
import { useClinicalEngine } from '../context/clinical-engine-context';
import { GlossaryTooltip } from '../app/components/widgets/ClinicalGlossary';

export function SettingsDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { profile, updateProfileVariable, addWeightLog } = useClinicalEngine();
  const [newWeight, setNewWeight] = React.useState('');

  // Local string draft states for resilient, glitch-free input handling
  const [bodyFatDraft, setBodyFatDraft] = React.useState(String(profile.bodyFat ?? ''));
  const [ageDraft, setAgeDraft] = React.useState(String(profile.age ?? ''));
  const [citrullineDraft, setCitrullineDraft] = React.useState(String(profile.citrullineGrams ?? ''));
  const [timingDraft, setTimingDraft] = React.useState(String(profile.citrullineTimingMin ?? ''));

  // Sync drafts when profile updates or drawer opens
  React.useEffect(() => {
    setBodyFatDraft(String(profile.bodyFat ?? ''));
    setAgeDraft(String(profile.age ?? ''));
    setCitrullineDraft(String(profile.citrullineGrams ?? ''));
    setTimingDraft(String(profile.citrullineTimingMin ?? ''));
  }, [profile.bodyFat, profile.age, profile.citrullineGrams, profile.citrullineTimingMin, isOpen]);

  if (!isOpen) return null;

  const handleAddWeight = () => {
    const normalized = newWeight.replace(',', '.').trim();
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed) && parsed > 0) {
      addWeightLog(Number(parsed.toFixed(1)));
      setNewWeight('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop translúcido */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 h-full max-h-[100dvh]">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 text-slate-900 shadow-2xl flex flex-col h-full max-h-[100dvh] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0.5rem)]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Ajustes y Perfil Biométrico
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configuración y Calibración Fisiológica
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-900 text-xs font-bold border border-slate-200 px-3.5 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          {/* Formulario / Inputs */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* ── Sección 01: Composición Corporal ─────────────────────────────── */}
            <div className="rounded-2xl p-4 space-y-3.5 bg-slate-50/70 border border-slate-100 shadow-xs">
              <h3 className="text-[11px] font-bold text-sky-600 font-mono tracking-[0.2em] uppercase flex items-center gap-1.5">
                <span className="h-px flex-1 bg-sky-200" />
                01. COMPOSICIÓN CORPORAL
                <span className="h-px flex-1 bg-sky-200" />
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Porcentaje de Grasa */}
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>Grasa Corporal (%)</span>
                    <GlossaryTooltip
                      term="porcentaje_grasa_panel"
                      instanceId="tcp-fat-percent"
                      position="bottom"
                    />
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={bodyFatDraft}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBodyFatDraft(val);
                      const normalized = val.replace(',', '.');
                      const parsed = parseFloat(normalized);
                      if (!isNaN(parsed) && parsed >= 0) {
                        updateProfileVariable('bodyFat', parsed);
                      }
                    }}
                    onBlur={() => {
                      const normalized = bodyFatDraft.replace(',', '.');
                      const parsed = parseFloat(normalized);
                      if (!isNaN(parsed) && parsed >= 0) {
                        updateProfileVariable('bodyFat', parsed);
                        setBodyFatDraft(String(parsed));
                      } else {
                        setBodyFatDraft(String(profile.bodyFat ?? 14.5));
                      }
                    }}
                    className="w-full rounded-xl px-3 py-2 text-sm font-mono font-bold bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-xs"
                  />
                </div>

                {/* Edad */}
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>Edad (Años)</span>
                    <GlossaryTooltip
                      term="edad_panel"
                      instanceId="tcp-age"
                      position="bottom"
                    />
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={ageDraft}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAgeDraft(val);
                      const parsed = parseInt(val, 10);
                      if (!isNaN(parsed) && parsed > 0) {
                        updateProfileVariable('age', parsed);
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseInt(ageDraft, 10);
                      if (!isNaN(parsed) && parsed > 0) {
                        updateProfileVariable('age', parsed);
                        setAgeDraft(String(parsed));
                      } else {
                        setAgeDraft(String(profile.age ?? 34));
                      }
                    }}
                    className="w-full rounded-xl px-3 py-2 text-sm font-mono font-bold bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Registro de Peso Crudo */}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                  <span>Añadir Registro de Peso (kg)</span>
                  <GlossaryTooltip
                    term="peso_crudo_panel"
                    instanceId="tcp-weight-log"
                    position="bottom"
                  />
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ej: 85.2"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddWeight();
                    }}
                    className="flex-1 rounded-xl px-3 py-2 text-sm font-mono font-bold bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-xs"
                  />
                  <button
                    onClick={handleAddWeight}
                    className="rounded-xl px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 transition-all shadow-xs cursor-pointer spring-bounce"
                  >
                    + Log
                  </button>
                </div>
              </div>
            </div>

            {/* ── Sección 02: Termodinámica & Déficit ──────────────────────────── */}
            <div className="rounded-2xl p-4 space-y-3.5 bg-amber-50/40 border border-amber-100 shadow-xs">
              <h3 className="text-[11px] font-bold text-amber-700 font-mono tracking-[0.2em] uppercase flex items-center gap-1.5">
                <span className="h-px flex-1 bg-amber-200" />
                02. TERMODINÁMICA &amp; DÉFICIT
                <span className="h-px flex-1 bg-amber-200" />
              </h3>

              {/* Déficit Calórico */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center text-xs font-semibold text-slate-700">
                    Déficit Calórico Diario
                    <GlossaryTooltip
                      term="deficit_calorico_panel"
                      instanceId="tcp-deficit"
                      position="bottom"
                    />
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-700 tabular-nums">
                    {profile.deficitTarget} kcal
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1500"
                  step="50"
                  value={profile.deficitTarget}
                  onChange={(e) => updateProfileVariable('deficitTarget', parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-amber-500"
                />
                <div className="flex justify-between mt-1 font-mono text-[10px] text-slate-500">
                  <span>0 · Mantenimiento</span>
                  <span className="text-amber-700 font-bold">500 · Óptimo</span>
                  <span className="text-rose-600 font-bold">1500 · Agresivo</span>
                </div>
              </div>

              {/* Gasto Actividad Física */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center text-xs font-semibold text-slate-700">
                    Gasto por Actividad Física
                    <GlossaryTooltip
                      term="gasto_actividad_panel"
                      instanceId="tcp-exercise-calories"
                      position="bottom"
                    />
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800 tabular-nums">
                    {profile.exerciseCalories} kcal
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="25"
                  value={profile.exerciseCalories}
                  onChange={(e) => updateProfileVariable('exerciseCalories', parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-slate-600"
                />
                <div className="flex justify-between mt-1 font-mono text-[10px] text-slate-500">
                  <span>0 · Reposo</span>
                  <span>1000 · Alta Intensidad</span>
                </div>
              </div>
            </div>

            {/* ── Sección 03: Vasodilatación & Suplementos ─────────────────────── */}
            <div className="rounded-2xl p-4 space-y-3.5 bg-emerald-50/40 border border-emerald-100 shadow-xs">
              <h3 className="text-[11px] font-bold text-emerald-700 font-mono tracking-[0.2em] uppercase flex items-center gap-1.5">
                <span className="h-px flex-1 bg-emerald-200" />
                03. VASODILATACIÓN &amp; SUPLEMENTOS
                <span className="h-px flex-1 bg-emerald-200" />
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* L-Citrulina */}
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span>L-Citrulina (g)</span>
                    <GlossaryTooltip
                      term="citrulina_dosis_panel"
                      instanceId="tcp-citrulline-dose"
                      position="bottom"
                    />
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={citrullineDraft}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCitrullineDraft(val);
                      const normalized = val.replace(',', '.');
                      const parsed = parseFloat(normalized);
                      if (!isNaN(parsed) && parsed >= 0) {
                        updateProfileVariable('citrullineGrams', parsed);
                      }
                    }}
                    onBlur={() => {
                      const normalized = citrullineDraft.replace(',', '.');
                      const parsed = parseFloat(normalized);
                      if (!isNaN(parsed) && parsed >= 0) {
                        updateProfileVariable('citrullineGrams', parsed);
                        setCitrullineDraft(String(parsed));
                      } else {
                        setCitrullineDraft(String(profile.citrullineGrams ?? 8.0));
                      }
                    }}
                    className="w-full rounded-xl px-3 py-2 text-sm font-mono font-bold bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
                  />
                  <span className="font-mono text-[10px] text-slate-500 mt-1 block">
                    Rango eficaz: 6–8 g
                  </span>
                </div>

                {/* Timing */}
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span>Timing (min)</span>
                    <GlossaryTooltip
                      term="timing_suplementos_panel"
                      instanceId="tcp-timing"
                      position="bottom"
                    />
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={timingDraft}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTimingDraft(val);
                      const parsed = parseInt(val, 10);
                      if (!isNaN(parsed) && parsed >= 0) {
                        updateProfileVariable('citrullineTimingMin', parsed);
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseInt(timingDraft, 10);
                      if (!isNaN(parsed) && parsed >= 0) {
                        updateProfileVariable('citrullineTimingMin', parsed);
                        setTimingDraft(String(parsed));
                      } else {
                        setTimingDraft(String(profile.citrullineTimingMin ?? 35));
                      }
                    }}
                    className="w-full rounded-xl px-3 py-2 text-sm font-mono font-bold bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
                  />
                  <span className="font-mono text-[10px] text-slate-500 mt-1 block">
                    Óptimo: 30–45 min
                  </span>
                </div>
              </div>
            </div>

            {/* ── Sección 04: Periodización & Horario Circadiano ────────────────── */}
            <div className="rounded-2xl p-4 space-y-3.5 bg-indigo-50/40 border border-indigo-100 shadow-xs">
              <h3 className="text-[11px] font-bold text-indigo-700 font-mono tracking-[0.2em] uppercase flex items-center gap-1.5">
                <span className="h-px flex-1 bg-indigo-200" />
                04. PERIODIZACIÓN &amp; DESCANSO
                <span className="h-px flex-1 bg-indigo-200" />
              </h3>

              {/* Horario de Entreno & Hora de Sueño (Entrada mínima V6) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Horario de Entreno
                  </label>
                  <select
                    value={profile.horarioEntreno || "afternoon"}
                    onChange={(e) => updateProfileVariable("horarioEntreno", e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-xs font-mono font-semibold bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
                  >
                    <option value="morning">Mañana (~07:00)</option>
                    <option value="afternoon">Tarde (~16:00)</option>
                    <option value="evening">Noche (~20:00)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Hora de Dormir
                  </label>
                  <select
                    value={profile.bedtimeHour ?? 23}
                    onChange={(e) => updateProfileVariable("bedtimeHour", parseInt(e.target.value))}
                    className="w-full rounded-xl px-3 py-2 text-xs font-mono font-semibold bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
                  >
                    <option value="21">21:00 h</option>
                    <option value="22">22:00 h</option>
                    <option value="23">23:00 h</option>
                    <option value="24">00:00 h</option>
                  </select>
                </div>
              </div>

              {/* Semana del Mesociclo */}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Semana del Mesociclo Activa</span>
                  <GlossaryTooltip
                    term="semana_mesociclo_panel"
                    instanceId="tcp-mesocycle-week"
                    position="top"
                  />
                </label>
                <select
                  value={profile.mesocycleWeek}
                  onChange={(e) => updateProfileVariable('mesocycleWeek', parseInt(e.target.value))}
                  className="w-full rounded-xl px-3 py-2 text-xs font-mono font-semibold bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs cursor-pointer"
                >
                  <option value="1">Semana 1 · MEV — Volumen Mínimo Efectivo</option>
                  <option value="2">Semana 2 · MAV-1 — Acumulación Progresiva</option>
                  <option value="3">Semana 3 · MAV-2 — Estímulo Progresivo</option>
                  <option value="4">Semana 4 · MAV/MRV — Estímulo Alto ACSM 2026</option>
                  <option value="5">Semana 5 · DELOAD — Mantenimiento MV (4–8)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-100 shrink-0 flex justify-between items-center text-xs font-mono text-slate-500">
            <span className="text-[10px] uppercase tracking-wider">
              Clinical Node Core · v3.5 Pro
            </span>
            <span className="text-emerald-600 font-bold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sincronizado
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
export default SettingsDrawer;
