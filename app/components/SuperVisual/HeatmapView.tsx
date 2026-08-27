"use client";

import { DIAS, DIA_LABEL, HORARIO_RANGO } from "@/lib/model";
import type { Dia } from "@/lib/model";
import { solapan } from "@/lib/time";

const HORAS = Array.from({ length: HORARIO_RANGO.span / 60 }, (_, i) => HORARIO_RANGO.min / 60 + i); // 6..22

export function HeatmapView({
  sesiones,
  diasConClase,
}: {
  sesiones: { dia: Dia; inicio: number; fin: number }[];
  diasConClase: Dia[];
}) {
  // Build occupancy via solapan (preciso), bucket = [h*60, (h+1)*60)
  const occupied = (dia: Dia, h: number) => {
    const bIni = h * 60;
    const bFin = bIni + 60;
    return sesiones.some((s) => s.dia === dia && solapan(s.inicio, s.fin, bIni, bFin));
  };

  const maxOverlap = (dia: Dia, h: number) => {
    const bIni = h * 60;
    const bFin = bIni + 60;
    let cnt = 0;
    for (const s of sesiones) if (s.dia === dia && solapan(s.inicio, s.fin, bIni, bFin)) cnt++;
    return cnt;
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <div className="grid grid-cols-[44px_repeat(7,1fr)] gap-1 text-[10px] font-bold">
            <div />
            {DIAS.slice(0, 7).map((d) => (
              <div
                key={d}
                className={`rounded-lg px-1 py-1 text-center ${diasConClase.includes(d) ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}
              >
                {d}
              </div>
            ))}
            {HORAS.map((h) => (
              <div key={h} className="contents">
                <div className="flex items-center justify-end pr-1 font-mono text-[10px] text-zinc-400">{String(h).padStart(2, "0")}:00</div>
                {DIAS.slice(0, 7).map((d) => {
                  const cnt = maxOverlap(d, h);
                  const has = occupied(d, h);
                  const intensidad = cnt === 0 ? 0 : cnt === 1 ? 0.55 : 1;
                  return (
                    <div
                      key={`${d}-${h}`}
                      className="h-6 rounded-md border motion-safe:transition"
                      style={{
                        background: has ? `rgb(16 185 129 / ${intensidad})` : "transparent",
                        borderColor: has ? `rgb(16 185 129 / ${Math.max(0.35, intensidad)})` : "rgb(228 228 231)",
                      }}
                      title={has ? `${DIA_LABEL[d]} ${h}:00 — ${cnt} bloque(s)` : `${DIA_LABEL[d]} ${h}:00 — libre`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        Intensidad por hora (solape exacto). Verde = ocupado. Columnas vacías → días libres reales (rango 06:00-22:00 unificado).
      </p>
    </div>
  );
}
