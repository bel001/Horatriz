"use client";

import type { Dia } from "@/lib/model";

export interface KpiGridProps {
  diasConClase: Dia[];
  huecos: number;
  lectivas: number;
  creditos: number;
  eficiencia: number; // 0-100
  huecosBar: number; // 0-100 (100 = sin huecos)
  diasBar: number; // 0-100
  creditosBar: number; // 0-100
  densidad: string; // h/día
  huecosFmt: string;
}

export function KpiGrid({ diasConClase, huecos, eficiencia, huecosBar, diasBar, creditosBar, creditos, densidad, huecosFmt }: KpiGridProps) {
  const items = [
    { k: "Eficiencia", v: `${eficiencia}%`, sub: "clase / (clase+hueco)", icon: "⚡", bar: eficiencia },
    { k: "Huecos", v: huecos === 0 ? "0" : huecosFmt, sub: huecos === 0 ? "sin tiempo muerto" : "tiempo muerto", icon: "⏳", bar: huecosBar },
    { k: "Días libres", v: `${7 - diasConClase.length}`, sub: `${diasConClase.length} con clase`, icon: "🌴", bar: diasBar },
    { k: "Créditos", v: `${creditos}`, sub: `${densidad}h/día`, icon: "🎓", bar: creditosBar },
  ] as const;

  return (
    <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {items.map((c) => (
        <div key={c.k} className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {c.icon} {c.k}
            </span>
            <span className="text-[11px] font-mono text-zinc-400">{Math.round(c.bar)}%</span>
          </div>
          <div className="mt-1 text-[18px] font-black tracking-tight text-zinc-900 dark:text-zinc-50">{c.v}</div>
          <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{c.sub}</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 motion-safe:transition-all motion-safe:duration-500"
              style={{ width: `${Math.max(6, Math.min(100, c.bar))}%` }}
              aria-hidden
            />
          </div>
        </div>
      ))}
    </div>
  );
}
