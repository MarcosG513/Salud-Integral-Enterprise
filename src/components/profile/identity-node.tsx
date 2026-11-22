import { Radio } from "lucide-react";
import { useClinicalEngine } from "../../context/clinical-engine-context";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

function EditableIdentity({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="min-w-0 text-left">
      <span
        className="block mb-1 uppercase tracking-[0.2em] text-slate-500 font-mono text-xs font-semibold"
        style={{ fontFamily: MONO }}
      >
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none text-slate-900 border-b border-slate-200 focus:border-sky-500 transition-colors truncate font-mono text-base font-bold"
        style={{ fontFamily: MONO }}
      />
    </div>
  );
}

export function IdentityNode() {
  const { profile, updateProfileVariable } = useClinicalEngine();

  const handleUsernameChange = (val: string) => {
    updateProfileVariable?.("username", val);
  };

  return (
    <header className="relative flex items-center gap-6 rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 p-6 shrink-0">
      {/* Premium technical avatar badge */}
      <div className="relative shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-600 shadow-sm">
          <span style={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: MONO }}>MM</span>
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-500 animate-pulse" />
      </div>

      <div className="flex-1 min-w-0">
        <EditableIdentity 
          label="ID_OPERADOR" 
          value={profile?.username ?? "Marcos M."} 
          onChange={handleUsernameChange} 
        />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-xs font-bold shadow-xs">
          <Radio size={14} className="text-emerald-600 animate-pulse" />
          <span
            className="uppercase tracking-[0.14em]"
            style={{ fontFamily: MONO }}
          >
            EN VIVO
          </span>
        </div>
      </div>
    </header>
  );
}
