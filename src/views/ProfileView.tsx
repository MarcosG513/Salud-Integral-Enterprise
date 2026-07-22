import { IdentityNode } from "../components/profile/identity-node";
import { DimensionsMatrix } from "../components/profile/dimensions-matrix";
import { BodyComposition } from "../components/profile/body-composition";
import { WeightLedger } from "../components/profile/weight-ledger";

export function ProfileView() {
  return (
    <div
      className="relative flex-1 min-h-screen w-full flex flex-col gap-6 overflow-y-auto p-4 sm:p-8 bg-slate-50 text-slate-900"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Ambience grids */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: `linear-gradient(#1E293B 1px, transparent 1px), linear-gradient(90deg, #1E293B 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 80%)",
        }}
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[60%] -translate-x-1/2 rounded-full opacity-10"
        style={{ background: `radial-gradient(circle, #00F0FF, transparent 70%)` }}
      />

      <div className="relative z-10 flex flex-1 flex-col gap-4">
        {/* Nodo de Identidad del Operador */}
        <IdentityNode />

        {/* Matriz Bento de Paneles */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-0">
          <div className="min-h-[350px] xl:min-h-0">
            <DimensionsMatrix />
          </div>
          <div className="min-h-[350px] xl:min-h-0">
            <BodyComposition />
          </div>
          <div className="min-h-[350px] xl:min-h-0">
            <WeightLedger />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileView;
