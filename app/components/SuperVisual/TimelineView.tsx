"use client";

import { DIA_LABEL, HORARIO_RANGO } from "@/lib/model";
import type { Dia, Sesion } from "@/lib/model";
import { fmtDuracion, fmtHora } from "@/lib/time";
import { paletaDeCurso } from "../GridSemana";

export interface Lane {
  dia: Dia;
  sesiones: Sesion[];
}

export function TimelineView({
  lanes,
  formato12h,
}: {
  lanes: Lane[];
  formato12h: boolean;
}) {
  const { min, span } = HORARIO_RANGO;

  if (lanes.length === 0) {
    return <p className="py-6 text-center text-xs text-zinc-400">Sin sesiones para este horario.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="hidden grid-cols-[72px_1fr] gap-2 text-[10px] font-bold text-zinc-400 sm:grid" aria-hidden>
        <span />
        <div className="grid grid-cols-8">
          {[6, 8, 10, 12, 14, 16, 18, 20].map((h) => (
            <span key={h} className="tabular-nums">
              {String(h).padStart(2, "0")}:00
            </span>
          ))}
        </div>
      </div>

      {lanes.map(({ dia, sesiones: arr }) => (
        <div key={dia} className="grid grid-cols-[56px_1fr] items-center gap-2 sm:grid-cols-[72px_1fr]">
          <div className="text-right">
            <div className="text-xs font-black text-zinc-900 dark:text-zinc-100">{DIA_LABEL[dia]}</div>
            <div className="text-[11px] font-medium text-zinc-500">
              {arr.length} bloque{arr.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="relative h-[42px] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute inset-0 grid grid-cols-8 opacity-60" aria-hidden>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border-r border-dashed border-zinc-200 last:border-0 dark:border-zinc-800" />
              ))}
            </div>

            {/* huecos */}
            {(() => {
              const huecosDia: { ini: number; fin: number }[] = [];
              const sorted = [...arr].sort((a, b) => a.inicio - b.inicio);
              for (let i = 0; i < sorted.length - 1; i++) {
                const curFin = sorted[i].fin;
                const nextIni = sorted[i + 1].inicio;
                if (nextIni - curFin > 10) huecosDia.push({ ini: curFin, fin: nextIni });
              }
              return huecosDia.map((hk, idx) => {
                const left = ((hk.ini - min) / span) * 100;
                const w = ((hk.fin - hk.ini) / span) * 100;
                const clampedW = Math.min(100 - left, w);
                if (clampedW <= 0 || left >= 100) return null;
                return (
                  <div
                    key={idx}
                    className="absolute top-1/2 -translate-y-1/2 rounded-full border border-dashed border-amber-300 bg-amber-100/60 dark:border-amber-700 dark:bg-amber-900/20"
                    style={{ left: `${Math.max(0, left)}%`, width: `${clampedW}%`, height: 8 }}
                    title={`Hueco ${fmtDuracion(hk.fin - hk.ini)}`}
                  />
                );
              });
            })()}

            {arr.map((s) => {
              const rawLeft = ((s.inicio - min) / span) * 100;
              const rawW = ((s.fin - s.inicio) / span) * 100;
              const left = Math.max(0, Math.min(100, rawLeft));
              const w = Math.max(6, Math.min(100 - left, rawW));
              const pal = paletaDeCurso(s.codigo);
              return (
                <div
                  key={s.id}
                  className={`absolute top-1.5 bottom-1.5 flex items-center gap-1 rounded-lg border px-1.5 text-[11px] font-bold shadow-xs motion-safe:transition motion-safe:duration-150 hover:z-10 hover:scale-[1.01] ${pal.celda}`}
                  style={{ left: `${left}%`, width: `${w}%` }}
                  title={`${s.curso} ${s.tipo} · ${fmtHora(s.inicio, formato12h)}–${fmtHora(s.fin, formato12h)} · ${s.aula || "Virtual"} · ${s.docente || "—"}`}
                >
                  <span className="truncate leading-none">{s.curso.split(" ").slice(0, 2).join(" ")}</span>
                  <span className="hidden shrink-0 rounded bg-black/15 px-1 py-0.5 text-[9px] font-black tabular-nums text-white sm:inline">
                    {fmtHora(s.inicio, formato12h)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-3 rounded bg-zinc-900 dark:bg-white" /> clase
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-3 rounded border border-dashed border-amber-300 bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30" /> hueco
        </span>
      </div>
    </div>
  );
}
