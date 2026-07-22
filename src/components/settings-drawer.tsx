import React from 'react';
import { useClinicalEngine } from '../context/clinical-engine-context';
import { GlossaryTooltip } from '../app/components/widgets/ClinicalGlossary';

export function SettingsDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { profile, updateProfileVariable, addWeightLog } = useClinicalEngine();
  const [newWeight, setNewWeight] = React.useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop translúcido */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 text-slate-900 shadow-2xl flex flex-col backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Ajustes y Perfil Biométrico
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configuración de Métricas
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-900 text-xs font-bold border border-slate-200 px-3 py-1.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          {/* Formulario / Inputs */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#1E293B transparent"
            }}
          >

            {/* ── Sección 01: Composición Corporal ─────────────────────────────── */}
            <div
              className="rounded-xl p-4 space-y-3.5"
              style={{ background: "rgba(0,240,255,0.03)", border: "1px solid rgba(0,240,255,0.12)" }}
            >
              <h3 className="text-[10px] font-bold text-[#00F0FF] font-mono tracking-[0.2em] uppercase flex items-center gap-1.5">
                <span className="h-px flex-1 bg-[#00F0FF]/20" />
                01. COMPOSICIÓN CORPORAL
                <span className="h-px flex-1 bg-[#00F0FF]/20" />
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Porcentaje de Grasa */}
                <div>
                  <label className="flex items-center text-[11px] text-slate-400 mb-1.5 font-mono">
                    Grasa Corporal (%)
                    <GlossaryTooltip
                      term="porcentaje_grasa_panel"
                      instanceId="tcp-fat-percent"
                      position="bottom"
                    />
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={profile.bodyFat}
                    onChange={(e) => updateProfileVariable('bodyFat', parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-100 focus:outline-none transition-all"
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid #1E293B",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#00F0FF66"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#1E293B"; }}
                  />
                </div>

                {/* Edad */}
                <div>
                  <label className="flex items-center text-[11px] text-slate-400 mb-1.5 font-mono">
                    Edad (Años)
                    <GlossaryTooltip
                      term="edad_panel"
                      instanceId="tcp-age"
                      position="bottom"
                    />
                  </label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => updateProfileVariable('age', parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-100 focus:outline-none transition-all"
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid #1E293B",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#00F0FF66"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#1E293B"; }}
                  />
                </div>
              </div>

              {/* Registro de Peso Crudo */}
              <div>
                <label className="flex items-center text-[11px] text-slate-400 mb-1.5 font-mono">
                  Añadir Registro de Peso Crudo (kg)
                  <GlossaryTooltip
                    term="peso_crudo_panel"
                    instanceId="tcp-weight-log"
                    position="bottom"
                  />
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ej: 85.2"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="flex-1 rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-100 focus:outline-none transition-all"
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid #1E293B",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#00F0FF66"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#1E293B"; }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newWeight) {
                        addWeightLog(parseFloat(newWeight));
                        setNewWeight('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newWeight) { addWeightLog(parseFloat(newWeight)); setNewWeight(''); }
                    }}
                    className="rounded-lg px-3 text-xs font-mono font-bold uppercase tracking-wider transition-all hover:scale-105"
                    style={{
                      background: "rgba(0,240,255,0.1)",
                      border: "1px solid rgba(0,240,255,0.3)",
                      color: "#00F0FF",
                    }}
                  >
                    + LOG
                  </button>
                </div>
              </div>
            </div>

            {/* ── Sección 02: Termodinámica & Déficit ──────────────────────────── */}
            <div
              className="rounded-xl p-4 space-y-3.5"
              style={{ background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.15)" }}
            >
              <h3 className="text-[10px] font-bold text-amber-400 font-mono tracking-[0.2em] uppercase flex items-center gap-1.5">
                <span className="h-px flex-1 bg-amber-400/20" />
                02. TERMODINÁMICA &amp; DÉFICIT
                <span className="h-px flex-1 bg-amber-400/20" />
              </h3>

              {/* Déficit Calórico */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center text-[11px] text-slate-400 font-mono">
                    Déficit Calórico Semanal Objetivo
                    <GlossaryTooltip
                      term="deficit_calorico_panel"
                      instanceId="tcp-deficit"
                      position="bottom"
                    />
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
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
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "#F59E0B", background: "#1E293B" }}
                />
                <div className="flex justify-between mt-1 font-mono text-[9px] text-slate-600">
                  <span>0 · Mantenimiento</span>
                  <span style={{ color: "#F59E0B" }}>500 · Óptimo</span>
                  <span className="text-red-500">1500 · Agresivo</span>
                </div>
              </div>

              {/* Gasto Actividad Física */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center text-[11px] text-slate-400 font-mono">
                    Gasto por Actividad Física
                    <GlossaryTooltip
                      term="gasto_actividad_panel"
                      instanceId="tcp-exercise-calories"
                      position="bottom"
                    />
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-300 tabular-nums">
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
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "#64748B", background: "#1E293B" }}
                />
                <div className="flex justify-between mt-1 font-mono text-[9px] text-slate-600">
                  <span>0 · Reposo</span>
                  <span>1000 · Alta Intensidad</span>
                </div>
              </div>
            </div>

            {/* ── Sección 03: Vasodilatación & Suplementos ─────────────────────── */}
            <div
              className="rounded-xl p-4 space-y-3.5"
              style={{ background: "rgba(57,255,20,0.02)", border: "1px solid rgba(57,255,20,0.15)" }}
            >
              <h3 className="text-[10px] font-bold text-[#39FF14] font-mono tracking-[0.2em] uppercase flex items-center gap-1.5">
                <span className="h-px flex-1 bg-[#39FF14]/20" />
                03. VASODILATACIÓN &amp; SUPLEMENTOS
                <span className="h-px flex-1 bg-[#39FF14]/20" />
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* L-Citrulina */}
                <div>
                  <label className="flex items-center text-[11px] text-slate-400 mb-1.5 font-mono">
                    L-Citrulina (g)
                    <GlossaryTooltip
                      term="citrulina_dosis_panel"
                      instanceId="tcp-citrulline-dose"
                      position="bottom"
                    />
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="15"
                    value={profile.citrullineGrams}
                    onChange={(e) => updateProfileVariable('citrullineGrams', parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-100 focus:outline-none transition-all"
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid #1E293B",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "rgba(57,255,20,0.5)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#1E293B"; }}
                  />
                  <span className="font-mono text-[9px] text-slate-600 mt-0.5 block">
                    Rango eficaz: 6–8 g
                  </span>
                </div>

                {/* Timing */}
                <div>
                  <label className="flex items-center text-[11px] text-slate-400 mb-1.5 font-mono">
                    Timing Pre-Cama/Gym (min)
                    <GlossaryTooltip
                      term="timing_suplementos_panel"
                      instanceId="tcp-timing"
                      position="bottom"
                    />
                  </label>
                  <input
                    type="number"
                    value={profile.citrullineTimingMin}
                    onChange={(e) => updateProfileVariable('citrullineTimingMin', parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-100 focus:outline-none transition-all"
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid #1E293B",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "rgba(57,255,20,0.5)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#1E293B"; }}
                  />
                  <span className="font-mono text-[9px] text-slate-600 mt-0.5 block">
                    Óptimo: 30–45 min
                  </span>
                </div>
              </div>
            </div>

            {/* ── Sección 04: Periodización & SNC ─────────────────────────────── */}
            <div
              className="rounded-xl p-4 space-y-3.5"
              style={{ background: "rgba(168,85,247,0.03)", border: "1px solid rgba(168,85,247,0.18)" }}
            >
              <h3 className="text-[10px] font-bold text-purple-400 font-mono tracking-[0.2em] uppercase flex items-center gap-1.5">
                <span className="h-px flex-1 bg-purple-400/20" />
                04. PERIODIZACIÓN &amp; SNC
                <span className="h-px flex-1 bg-purple-400/20" />
              </h3>

              {/* Readiness SNC */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center text-[11px] text-slate-400 font-mono">
                    Readiness / Recuperación del SNC
                    <GlossaryTooltip
                      term="readiness_snc_panel"
                      instanceId="tcp-cns-readiness"
                      position="top"
                    />
                  </span>
                  <span
                    className="font-mono text-xs font-bold tabular-nums"
                    style={{ color: profile.cnsReadiness < 70 ? "#FF4D4D" : "#A855F7" }}
                  >
                    {profile.cnsReadiness}%
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={profile.cnsReadiness}
                  onChange={(e) => updateProfileVariable('cnsReadiness', parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    accentColor: profile.cnsReadiness < 70 ? "#FF4D4D" : "#A855F7",
                    background: "#1E293B",
                  }}
                />
                <div className="flex justify-between mt-1 font-mono text-[9px]">
                  <span className="text-red-500">30% · Neurofatiga</span>
                  <span className="text-slate-600">70% · Umbral</span>
                  <span className="text-purple-400">100% · Óptimo</span>
                </div>
              </div>

              {/* Semana del Mesociclo */}
              <div>
                <label className="flex items-center text-[11px] text-slate-400 mb-1.5 font-mono">
                  Semana del Mesociclo Activa
                  <GlossaryTooltip
                    term="semana_mesociclo_panel"
                    instanceId="tcp-mesocycle-week"
                    position="top"
                  />
                </label>
                <select
                  value={profile.mesocycleWeek}
                  onChange={(e) => updateProfileVariable('mesocycleWeek', parseInt(e.target.value))}
                  className="w-full rounded-lg px-2.5 py-2 text-[11px] font-mono text-slate-100 focus:outline-none cursor-pointer transition-all"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    border: "1px solid #1E293B",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(168,85,247,0.5)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#1E293B"; }}
                >
                  <option value="1">Semana 1 · MEV — Volumen Mínimo Efectivo</option>
                  <option value="2">Semana 2 · MAV-1 — Acumulación Progresiva</option>
                  <option value="3">Semana 3 · MAV-2 — Pico Adaptativo</option>
                  <option value="4">Semana 4 · MRV — Overreaching / Fallo Muscular</option>
                  <option value="5">Semana 5 · DELOAD — Descarga Clínica</option>
                </select>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div
            className="px-6 py-3 border-t shrink-0 flex justify-between items-center"
            style={{ borderColor: "#1E293B" }}
          >
            <span className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">
              Clinical Node Core · v3.0.0 Pro
            </span>
            <span className="font-mono text-[9px] text-[#00F0FF] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#39FF14] animate-pulse" />
              Sincronizado
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}