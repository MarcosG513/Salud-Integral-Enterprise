import React from "react";

export function ViewSkeletonLoader({ title = "Cargando módulo clínico..." }: { title?: string }) {
  return (
    <div className="w-full min-h-[420px] flex flex-col gap-6 p-2 sm:p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 bg-slate-200/80 rounded-2xl" />
          <div className="h-3.5 w-36 bg-slate-200/50 rounded-lg" />
        </div>
        <div className="h-8 w-28 bg-slate-200/60 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="h-40 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-3">
          <div className="h-4 w-24 bg-slate-200/70 rounded-md" />
          <div className="h-8 w-32 bg-slate-200/90 rounded-xl" />
          <div className="h-3 w-40 bg-slate-100 rounded-md" />
        </div>
        <div className="h-40 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-3">
          <div className="h-4 w-28 bg-slate-200/70 rounded-md" />
          <div className="h-8 w-36 bg-slate-200/90 rounded-xl" />
          <div className="h-3 w-44 bg-slate-100 rounded-md" />
        </div>
        <div className="h-40 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-3">
          <div className="h-4 w-20 bg-slate-200/70 rounded-md" />
          <div className="h-8 w-28 bg-slate-200/90 rounded-xl" />
          <div className="h-3 w-36 bg-slate-100 rounded-md" />
        </div>
      </div>

      <div className="h-64 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="h-5 w-48 bg-slate-200/80 rounded-lg" />
        <div className="h-40 bg-slate-100/60 rounded-2xl" />
      </div>
    </div>
  );
}
