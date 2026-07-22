import { useState } from "react";
import { Fingerprint, Radio } from "lucide-react";
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
        className="block mb-1 uppercase tracking-[0.2em] text-[#475569] font-mono text-xs"
        style={{ fontFamily: MONO }}
      >
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none text-[#E2E8F0] border-b border-transparent focus:border-[#00F0FF] transition-colors truncate font-mono"
        style={{ fontFamily: MONO, fontSize: 15, fontWeight: 500 }}
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
    <header
      className="relative flex items-center gap-6 rounded-xl border px-5 py-4 backdrop-blur-xl overflow-hidden shrink-0"
      style={{
        background: "rgba(15, 19, 34, 0.72)",
        borderColor: "#1E293B",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px opacity-70"
        style={{ background: "linear-gradient(90deg, transparent, #00F0FF, transparent)" }}
      />
      
      {/* Premium technical avatar badge */}
      <div className="relative shrink-0">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#00F0FF]/60 bg-gradient-to-br from-[#0f2a33] to-[#0b1620] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.4)]"
        >
          <span style={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: MONO }}>MM</span>
        </div>
        <span className="absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-[#0f1322] bg-[#39FF14] animate-pulse" />
      </div>

      <div className="flex-1 min-w-0">
        <EditableIdentity 
          label="ID_OPERADOR" 
          value={profile?.username ?? "Marcos M."} 
          onChange={handleUsernameChange} 
        />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Radio size={14} color="#39FF14" className="animate-pulse" />
          <span
            className="uppercase tracking-[0.14em] text-[#39FF14] font-mono text-[11px] font-bold"
            style={{ fontFamily: MONO }}
          >
            EN VIVO
          </span>
        </div>
      </div>
    </header>
  );
}
