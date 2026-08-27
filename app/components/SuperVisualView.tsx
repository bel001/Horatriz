"use client";

import { useMemo, useState } from "react";
import type { Curso, Horario, HorarioResult, Preferencias } from "@/lib/model";
import { DIA_LABEL, DIAS, HORARIO_RANGO, metaDeScore } from "@/lib/model";
import type { Dia } from "@/lib/model";
import { DIA_INDEX } from "@/lib/parser";
import { fmtDuracion, fmtHora } from "@/lib/time";
import { metricasHorario } from "@/lib/scoring";
import { dotDeCurso, paletaDeCurso } from "./GridSemana";
import { ScoreRing } from "./SuperVisual/ScoreRing";
import { KpiGrid } from "./SuperVisual/KpiGrid";
import { TimelineView, type Lane } from "./SuperVisual/TimelineView";
import { HeatmapView } from "./SuperVisual/HeatmapView";
import { RadarView } from "./SuperVisual/RadarView";

type Tab = "timeline" | "heatmap";

export function SuperVisualView({
  horario,
  cursos,
  prefs,
  colores,
  ocultarAnsiedad = false,
}: {
  horario: HorarioResult | null;
  cursos: Curso[];
  prefs: Preferencias;
  colores?: Record<string, string>;
  ocultarAnsiedad?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("timeline");
  const [formato12h, setFormato12h] = useState(false);

  const derived = useMemo(() => {
    if (!horario) return null;
    const cuadro: Horario[] = horario.cuadro ?? [];
    // Si hay cuadro usamos metricas reales, sino fallback a sesiones (más fiel que [] vacías)
    const m =
      cuadro.length > 0
        ? metricasHorario(cuadro, prefs)
        : (() => {
            // construir pseudo-cuadro mínimo desde sesiones para que radar no sea 0
            const pseudo: Horario[] = [{ curso: { codigo: "_", nombre: "_", opciones: [] }, opcion: { id: "_", nrc: "", seccion: "", liga: "", sesiones: horario.sesiones, docente: "", aula: "" } }];
            try {
              return metricasHorario(pseudo, prefs);
            } catch {
              return metricasHorario([], prefs);
            }
          })();
    const sesiones = horario.sesiones;
    const diasConClase = horario.diasConClase;
    const huecos = horario.minutosHuecos;
    const lectivas = horario.totalMinutos;
    const score = horario.score;
    const creditos = horario.totalCreditos;
    const densidad = lectivas > 0 ? (lectivas / (diasConClase.length || 1) / 60).toFixed(1) : "0";
    const eficiencia = lectivas + huecos > 0 ? Math.round((lectivas / (lectivas + huecos)) * 100) : 100;
    // Barras normalizadas (0-100) con lógica explicable
    const huecosBar = huecos === 0 ? 100 : Math.max(0, 100 - (huecos / 180) * 100); // 180m = 3h de hueco saturan
    const diasBar = ((7 - diasConClase.length) / 7) * 100;
    const creditosBar = Math.min(100, (creditos / 22) * 100); // 22cr techo semestre
    const huecosFmt = huecos === 0 ? "0" : fmtDuracion(huecos);
    return { m, sesiones, diasConClase, huecos, lectivas, score, creditos, densidad, eficiencia, huecosBar, diasBar, creditosBar, huecosFmt };
  }, [horario, prefs]);

  const lanes: Lane[] = useMemo(() => {
    if (!horario) return [];
    const porDia = new Map<Dia, typeof horario.sesiones>();
    for (const s of horario.sesiones) {
      const arr = porDia.get(s.dia) ?? [];
      arr.push(s);
      porDia.set(s.dia, arr);
    }
    return [...porDia.entries()]
      .sort((a, b) => DIA_INDEX[a[0]] - DIA_INDEX[b[0]])
      .map(([dia, arr]) => ({ dia, sesiones: arr.sort((a, b) => a.inicio - b.inicio) }));
  }, [horario]);

  const totalEsperadosDoc = useMemo(() => {
    const porCurso = prefs.docentesPorCurso ?? {};
    return Object.values(porCurso).flatMap((v) => Object.values(v)).filter(Boolean).length;
  }, [prefs.docentesPorCurso]);

  if (!horario || !derived) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-gradient-to-br from-zinc-50 via-white to-emerald-50/40 p-10 text-center dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-emerald-950/20">
        <div className="mx-auto max-w-xl space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-xl text-white shadow-lg">✨</div>
          <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">Vista SuperVisual</h3>
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Selecciona al menos un curso y genera horarios para ver tu dashboard editorial: KPIs, heatmap de carga, timeline y radar de preferencias.
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Tip: pega texto con bloques <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">T1 / P1 / L1</code> para agrupación perfecta.
          </p>
        </div>
      </div>
    );
  }

  const { m, sesiones, diasConClase, huecos, lectivas, score, creditos, densidad, eficiencia, huecosBar, diasBar, creditosBar, huecosFmt } = derived;
  const meta = metaDeScore(score);

  return (
    <div className="space-y-4">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-emerald-200/40 via-teal-200/30 to-sky-200/20 opacity-60 blur-3xl will-change-transform dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-sky-900/20" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-violet-200/30 via-fuchsia-200/20 to-amber-200/20 opacity-40 blur-3xl will-change-transform dark:from-violet-900/15 dark:via-fuchsia-900/10 dark:to-amber-900/10" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <ScoreRing score={score} size={110} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black leading-tight text-zinc-900 dark:text-zinc-100 sm:text-lg">
                  {diasConClase.length === 0 ? "Horario vacío" : `${diasConClase.length} días · ${fmtDuracion(lectivas)} lectivas`}
                </h3>
                <span className={`hidden rounded-full bg-gradient-to-r px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm sm:inline-flex ${meta.gradient}`}>
                  {meta.icon} {meta.label}
                </span>
              </div>
              <p className="mt-1 max-w-[52ch] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {creditos} créditos · {sesiones.length} bloques · {eficiencia}% eficiencia (clase vs hueco) · {densidad}h/día promedio
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  📅 {diasConClase.join(" · ") || "—"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${huecos === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"}`}
                >
                  {huecos === 0 ? "✨ Sin huecos" : `⏳ Huecos ${fmtDuracion(huecos)}`}
                </span>
                {m.docentesRepetidos.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300">
                    👥 {m.docentesRepetidos.length} docente{m.docentesRepetidos.length > 1 ? "s" : ""} repetido
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 self-start lg:self-center">
            <button
              type="button"
              onClick={() => setFormato12h((v) => !v)}
              aria-pressed={formato12h}
              aria-label={formato12h ? "Cambiar a formato 24 horas" : "Cambiar a formato 12 horas AM/PM"}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {formato12h ? "🕐 12h" : "🕒 24h"}
            </button>
            <div className="hidden h-6 w-px bg-zinc-200 dark:bg-zinc-800 sm:block" aria-hidden />
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
              {cursos.length} cursos · {sesiones.length} sesiones
            </span>
          </div>
        </div>

        <div className="relative mt-5">
          <KpiGrid
            diasConClase={diasConClase}
            huecos={huecos}
            lectivas={lectivas}
            creditos={creditos}
            eficiencia={eficiencia}
            huecosBar={huecosBar}
            diasBar={diasBar}
            creditosBar={creditosBar}
            densidad={densidad}
            huecosFmt={huecosFmt}
          />
        </div>
      </div>

      {/* Middle */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex rounded-full bg-zinc-100 p-1 dark:bg-zinc-900" role="tablist" aria-label="Vista de ocupación">
                {(["timeline", "heatmap"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    aria-label={t === "timeline" ? "Ver timeline por día" : "Ver mapa de calor semanal"}
                    onClick={() => setTab(t)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-safe:duration-150 ${tab === t ? "bg-zinc-900 text-white shadow dark:bg-white dark:text-zinc-900" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"}`}
                  >
                    {t === "timeline" ? "⏱ Timeline" : "🔥 Heatmap"}
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
                {HORARIO_RANGO.min / 60}:00 — {HORARIO_RANGO.max / 60}:00 · {diasConClase.length} días activos
              </span>
            </div>

            <div className="mt-4">
              {tab === "timeline" ? <TimelineView lanes={lanes} formato12h={formato12h} /> : <HeatmapView sesiones={sesiones} diasConClase={diasConClase} />}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-4 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">🧬 ADN del horario</h4>
              <span className="text-[11px] font-mono text-zinc-400">{sesiones.length} bloques</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sesiones
                .slice()
                .sort((a, b) => DIA_INDEX[a.dia] - DIA_INDEX[b.dia] || a.inicio - b.inicio)
                .map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    title={`${s.curso} · ${DIA_LABEL[s.dia]} ${fmtHora(s.inicio, formato12h)}-${fmtHora(s.fin, formato12h)}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${dotDeCurso(s.codigo, colores)}`} />
                    {s.tipo}·{s.dia} {fmtHora(s.inicio, formato12h)}
                  </span>
                ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <RadarView metricas={m} prefs={prefs} totalEsperadosDoc={totalEsperadosDoc} />

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">📚 Reparto por curso</h4>
            <div className="mt-3 space-y-2.5">
              {horario.cuadro
                .slice()
                .sort((a, b) => a.curso.nombre.localeCompare(b.curso.nombre))
                .map(({ curso, opcion }) => {
                  const horas = opcion.sesiones.reduce((acc, s) => acc + (s.fin - s.inicio), 0);
                  const pal = paletaDeCurso(curso.codigo, colores);
                  return (
                    <div key={curso.codigo} className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${pal.dot}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">{curso.nombre}</span>
                          <span className="shrink-0 text-[11px] font-mono font-bold text-zinc-500">{fmtDuracion(horas)}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div className="h-full rounded-full bg-zinc-900 dark:bg-white motion-safe:transition-all" style={{ width: `${Math.min(100, (horas / 360) * 100)}%` }} />
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {opcion.sesiones.map((s) => (
                            <span key={s.id} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              {s.dia} {fmtHora(s.inicio, formato12h)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {(() => {
            const lista = ocultarAnsiedad
              ? (horario.advertencias ?? []).filter((a) => !/lleno|vacante|agotad/i.test(a))
              : (horario.advertencias ?? []);
            if (lista.length === 0) return null;
            return (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">⚠️ Observaciones</h4>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs font-medium leading-relaxed text-amber-900 dark:text-amber-200">
                  {lista.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">🗂 Sesiones por día</h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DIAS.filter((d) => sesiones.some((s) => s.dia === d)).map((d) => {
            const arr = sesiones.filter((s) => s.dia === d).sort((a, b) => a.inicio - b.inicio);
            return (
              <div key={d} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">{DIA_LABEL[d]}</span>
                  <span className="text-[11px] font-mono text-zinc-500">{arr.length} bloques</span>
                </div>
                <div className="space-y-1.5">
                  {arr.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 shadow-xs dark:bg-zinc-950">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${dotDeCurso(s.codigo, colores)}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold leading-none text-zinc-900 dark:text-zinc-100">{s.curso}</div>
                        <div className="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                          {fmtHora(s.inicio, formato12h)}–{fmtHora(s.fin, formato12h)} · {s.aula || "Virtual"} {s.docente ? `· ${s.docente.split(" ").slice(0, 2).join(" ")}` : ""}
                        </div>
                      </div>
                      <span className="shrink-0 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-black text-white dark:bg-white dark:text-zinc-900">{s.tipo}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
