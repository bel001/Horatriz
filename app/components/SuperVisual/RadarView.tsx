"use client";

import { useMemo } from "react";
import type { Preferencias } from "@/lib/model";
import type { MetricasHorario } from "@/lib/scoring";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function buildRadarValues(
  m: MetricasHorario,
  prefs: Preferencias,
  totalEsperadosDoc: number
): [number, number, number, number] {
  const huecosRatio = m.minutosClase + m.minutosHuecos > 0 ? m.minutosHuecos / (m.minutosClase + m.minutosHuecos) : 0;
  const vHuecos = 1 - huecosRatio;
  const diasPref = prefs.diasLibresPreferidos.length;
  const vDias = diasPref > 0 ? m.diasLibresLogrados / diasPref : clamp01(1 - m.diasConClase.length / 7);
  const madrugadaRatio = m.minutosClase > 0 ? Math.min(1, m.minutosMadrugada / m.minutosClase) : 0;
  const vMadrugada = 1 - madrugadaRatio;
  // Si no hay preferencia de docente, no mostrar 100% engañoso — usar neutral 0.55 para no penalizar ni bonificar
  const vDoc = totalEsperadosDoc > 0 ? m.coincidenciasEspecificas / totalEsperadosDoc : 0.55;
  return [clamp01(vHuecos), clamp01(vDias), clamp01(vDoc), clamp01(vMadrugada)];
}

export function RadarView({
  metricas,
  prefs,
  totalEsperadosDoc,
}: {
  metricas: MetricasHorario;
  prefs: Preferencias;
  totalEsperadosDoc: number;
}) {
  const [vHue, vDias, vDoc, vMad] = useMemo(
    () => buildRadarValues(metricas, prefs, totalEsperadosDoc),
    [metricas, prefs, totalEsperadosDoc]
  );

  const hasDocPref = totalEsperadosDoc > 0;

  const radarPts = useMemo(() => {
    const cx = 50, cy = 50, r = 36;
    const vals = [vHue, vDias, vDoc, vMad];
    const angles = [-90, 0, 90, 180];
    return vals
      .map((v, i) => {
        const ang = (angles[i] * Math.PI) / 180;
        const rr = r * (0.15 + 0.85 * v);
        const x = cx + Math.cos(ang) * rr;
        const y = cy + Math.sin(ang) * rr;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [vHue, vDias, vDoc, vMad]);

  const pct = (v: number) => `${Math.round(v * 100)}%`;

  return (
    <div
      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      aria-label={`Radar de coherencia: sin huecos ${pct(vHue)}, días libres ${pct(vDias)}, docentes ${hasDocPref ? pct(vDoc) : "sin preferencia"}, no madrugar ${pct(vMad)}`}
      role="img"
    >
      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">◈ Coherencia de preferencias</h4>
      <div className="mt-3 flex justify-center">
        <div className="relative h-[180px] w-[180px]">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <polygon points="50,14 86,50 50,86 14,50" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="0.8" />
            <polygon points="50,32 68,50 50,68 32,50" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="0.6" strokeDasharray="2 2" />
            <line x1="50" y1="14" x2="50" y2="86" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="0.6" />
            <line x1="14" y1="50" x2="86" y2="50" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="0.6" />
            <polygon points={radarPts} fill="rgb(16 185 129 / 0.18)" stroke="rgb(16 185 129)" strokeWidth="1.6" strokeLinejoin="round" className="motion-safe:transition-all motion-safe:duration-500" />
            {radarPts.split(" ").map((pt, i) => {
              const [x, y] = pt.split(",").map(Number);
              return <circle key={i} cx={x} cy={y} r="2.2" fill="rgb(16 185 129)" stroke="white" strokeWidth="1" />;
            })}
            {/* labels — use style fill via class on <g> wrapper not text fill attr */}
            <g className="fill-zinc-600 dark:fill-zinc-400">
              <text x="50" y="10" textAnchor="middle" fontSize="5.5" fontWeight="800">Huecos</text>
              <text x="92" y="51.5" textAnchor="start" fontSize="5.5" fontWeight="800">Días</text>
              <text x="50" y="96" textAnchor="middle" fontSize="5.5" fontWeight="800">Docentes</text>
              <text x="8" y="51.5" textAnchor="end" fontSize="5.5" fontWeight="800">Madrug.</text>
            </g>
          </svg>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
        {[
          { label: "Sin huecos", v: vHue },
          { label: "Días libres", v: vDias },
          { label: "Docentes", v: vDoc, empty: !hasDocPref },
          { label: "No madrugar", v: vMad },
        ].map((it) => (
          <div key={it.label} className="flex items-center justify-between rounded-xl bg-zinc-50 px-2.5 py-1.5 dark:bg-zinc-900">
            <span className="font-semibold text-zinc-600 dark:text-zinc-400">{it.label}</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{it.empty ? "—" : pct(it.v)}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        Área más grande = mejor encaje. {hasDocPref ? "Si un vértice queda corto, ajusta ese peso." : "Docentes en — porque no fijaste preferencia."}
      </p>
    </div>
  );
}
