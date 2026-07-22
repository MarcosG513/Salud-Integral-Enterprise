import { useEffect, useState } from "react";
import { ShieldCheck, Database, Cpu } from "lucide-react";
import { IdentityNode } from "./components/identity-node";
import { DimensionsMatrix } from "./components/dimensions-matrix";
import { BodyComposition } from "./components/body-composition";
import { WeightLedger } from "./components/weight-ledger";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const STORE_KEY = "biometric_profile_v1";

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export default function App() {
  const persisted = loadState();
  const [height, setHeight] = useState<number>(persisted?.height ?? 178);
  const [age, setAge] = useState<number>(persisted?.age ?? 31);
  const [sex, setSex] = useState<"M" | "F">(persisted?.sex ?? "M");
  const [bodyFat, setBodyFat] = useState<number>(persisted?.bodyFat ?? 18.5);
  const [weights, setWeights] = useState<number[]>(
    persisted?.weights ?? [85.4, 84.8, 85.1, 84.9, 84.6, 85.0, 84.7, 80.0]
  );

  useEffect(() => {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ height, age, sex, bodyFat, weights })
    );
  }, [height, age, sex, bodyFat, weights]);

  const currentWeight = weights[weights.length - 1] ?? 0;

  return (
    <div
      className="size-full overflow-auto"
      style={{ background: "#070A13", fontFamily: MONO }}
    >
      {/* subtle grid backdrop */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(#0F1322 1px, transparent 1px), linear-gradient(90deg, #0F1322 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 90%)",
        }}
      />

      <div className="relative mx-auto flex min-h-full max-w-[1600px] flex-col gap-4 p-4 lg:p-6">
        {/* Title strip */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="uppercase tracking-[0.14em] text-[#E2E8F0]"
              style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700 }}
            >
              User Biometric Profile{" "}
              <span className="text-[#00F0FF]">&</span> Anthropometric Control Center
            </h1>
            <p className="mt-0.5 text-[#475569]" style={{ fontFamily: MONO, fontSize: 11 }}>
              /internal/telemetry/anthropometrics · rev 2.4.1
            </p>
          </div>
          <span
            className="hidden rounded border px-3 py-1.5 uppercase tracking-[0.2em] text-[#39FF14] sm:inline-block"
            style={{ borderColor: "rgba(57,255,20,0.3)", background: "rgba(57,255,20,0.05)", fontFamily: MONO, fontSize: 10 }}
          >
            ● SYNCED
          </span>
        </div>

        <IdentityNode />

        {/* Main bento grid */}
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <DimensionsMatrix
              height={height}
              setHeight={setHeight}
              age={age}
              setAge={setAge}
              sex={sex}
              setSex={setSex}
            />
          </div>
          <div className="lg:col-span-5">
            <BodyComposition bodyFat={bodyFat} setBodyFat={setBodyFat} weight={currentWeight} />
          </div>
          <div className="lg:col-span-4">
            <WeightLedger weights={weights} onAppend={(w) => setWeights((p) => [...p, w])} />
          </div>
        </div>

        {/* Bottom sync bar */}
        <footer
          className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border px-4 py-2.5 backdrop-blur-xl"
          style={{ background: "rgba(15,19,34,0.72)", borderColor: "#1E293B" }}
        >
          <span className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 11 }}>
            <ShieldCheck size={14} color="#39FF14" />
            <span className="text-[#64748B]">SYSTEM HEALTH:</span>
            <span className="text-[#39FF14]">OPTIMAL</span>
          </span>
          <span className="h-3 w-px" style={{ background: "#1E293B" }} />
          <span className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 11 }}>
            <Database size={14} color="#00F0FF" />
            <span className="text-[#64748B]">LOCALSTORAGE PERSISTENCE:</span>
            <span className="text-[#00F0FF]">ON</span>
          </span>
          <span className="h-3 w-px" style={{ background: "#1E293B" }} />
          <span className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 11 }}>
            <Cpu size={14} color="#00F0FF" />
            <span className="text-[#64748B]">CORE ENGINE:</span>
            <span className="text-[#00F0FF]">CUNNINGHAM ACTIVE</span>
          </span>
          <span className="ml-auto text-[#334155]" style={{ fontFamily: MONO, fontSize: 10 }}>
            NODE::BAQ-CO · {new Date().toISOString().slice(0, 19)}Z
          </span>
        </footer>
      </div>
    </div>
  );
}
