import { useState } from "react";
import { MapPin, Fingerprint, Radio } from "lucide-react";

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
    <div className="min-w-0">
      <span
        className="block mb-1 uppercase tracking-[0.2em] text-[#475569]"
        style={{ fontFamily: MONO, fontSize: 10 }}
      >
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none text-[#E2E8F0] border-b border-transparent focus:border-[#00F0FF] transition-colors truncate"
        style={{ fontFamily: MONO, fontSize: 15, fontWeight: 500 }}
      />
    </div>
  );
}

export function IdentityNode() {
  const [operatorId, setOperatorId] = useState(
    "Marcos Guillermo Mogollón Ortega"
  );
  const [coreRole, setCoreRole] = useState(
    "Electronic Technician / Software Developer"
  );

  return (
    <header
      className="relative flex items-center gap-6 rounded-xl border px-5 py-4 backdrop-blur-xl overflow-hidden"
      style={{
        background: "rgba(15, 19, 34, 0.72)",
        borderColor: "#1E293B",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px opacity-70"
        style={{ background: "linear-gradient(90deg, transparent, #00F0FF, transparent)" }}
      />
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border"
        style={{ borderColor: "#1E293B", background: "rgba(0,240,255,0.06)" }}
      >
        <Fingerprint size={24} color="#00F0FF" />
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
        <EditableIdentity label="OPERATOR_ID" value={operatorId} onChange={setOperatorId} />
        <EditableIdentity label="CORE_ROLE" value={coreRole} onChange={setCoreRole} />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div
          className="flex items-center gap-2 rounded-md border px-3 py-2"
          style={{ borderColor: "rgba(0,240,255,0.4)", background: "rgba(0,240,255,0.06)" }}
        >
          <MapPin size={14} color="#00F0FF" />
          <span
            className="uppercase tracking-[0.14em] text-[#00F0FF]"
            style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600 }}
          >
            LOCATION: BARRANQUILLA, CO
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Radio size={14} color="#39FF14" className="animate-pulse" />
          <span
            className="uppercase tracking-[0.14em] text-[#39FF14]"
            style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600 }}
          >
            LIVE
          </span>
        </div>
      </div>
    </header>
  );
}
