"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Dia, Sesion } from "@/lib/model";
import { DIA_LABEL, TIPO_LABEL } from "@/lib/model";
import { DIA_INDEX } from "@/lib/parser";
import { fmtDuracion, fmtHora } from "@/lib/time";
import type { GrupoProf } from "@/lib/groups";
import { numeroDeGrupo } from "@/lib/groups";

const HORA_INICIO = 6 * 60;
const HORA_FIN = 22 * 60;

/** Minimum width (px) each day column needs to display legibly */
const MIN_COL_WIDTH = 120;
/** Width reserved for the time labels column */
const TIME_COL_WIDTH = 44;

/** Hook that tracks a container's width via ResizeObserver */
function useContainerWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  const updateWidth = useCallback(() => {
    if (ref.current) setWidth(ref.current.clientWidth);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    updateWidth(); // initial read
    if (!ref.current) return;
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => updateWidth());
      ro.observe(ref.current);
      return () => ro.disconnect();
    }
    // Fallback for environments without ResizeObserver
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [updateWidth]);

  return [ref, width];
}

export interface ColorCurso {
  nombre: string;
  dot: string;
  celda: string;
}

export const PALETA_CURSOS: ColorCurso[] = [
  { nombre: "sky", dot: "bg-sky-500", celda: "bg-sky-700 text-white border-sky-400 dark:bg-sky-900 dark:text-white dark:border-sky-500" },
  { nombre: "emerald", dot: "bg-emerald-500", celda: "bg-emerald-700 text-white border-emerald-400 dark:bg-emerald-900 dark:text-white dark:border-emerald-500" },
  { nombre: "amber", dot: "bg-amber-500", celda: "bg-amber-700 text-white border-amber-400 dark:bg-amber-900 dark:text-white dark:border-amber-500" },
  { nombre: "rose", dot: "bg-rose-500", celda: "bg-rose-700 text-white border-rose-400 dark:bg-rose-900 dark:text-white dark:border-rose-500" },
  { nombre: "violet", dot: "bg-violet-500", celda: "bg-violet-700 text-white border-violet-400 dark:bg-violet-900 dark:text-white dark:border-violet-500" },
  { nombre: "teal", dot: "bg-teal-500", celda: "bg-teal-700 text-white border-teal-400 dark:bg-teal-900 dark:text-white dark:border-teal-500" },
  { nombre: "fuchsia", dot: "bg-fuchsia-500", celda: "bg-fuchsia-700 text-white border-fuchsia-400 dark:bg-fuchsia-900 dark:text-white dark:border-fuchsia-500" },
  { nombre: "indigo", dot: "bg-indigo-500", celda: "bg-indigo-700 text-white border-indigo-400 dark:bg-indigo-900 dark:text-white dark:border-indigo-500" },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function paletaDeCurso(
  codigo: string,
  colores?: Record<string, string>
): ColorCurso {
  const key = colores?.[codigo];
  return (
    PALETA_CURSOS.find((p) => p.nombre === key) ??
    PALETA_CURSOS[hash(codigo) % PALETA_CURSOS.length]
  );
}

export function colorDeCurso(codigo: string, colores?: Record<string, string>): string {
  return paletaDeCurso(codigo, colores).celda;
}

export function dotDeCurso(codigo: string, colores?: Record<string, string>): string {
  return paletaDeCurso(codigo, colores).dot;
}

const TIPO_ICONO: Record<string, string> = {
  T: "📖",
  P: "✍️",
  L: "🧪",
};

interface HuecoInfo {
  inicio: number;
  fin: number;
  duracionMin: number;
}

export function GridSemana({
  sesiones,
  colores,
  gruposPorCurso,
  mostrarHuecos = true,
}: {
  sesiones: Sesion[];
  colores?: Record<string, string>;
  gruposPorCurso?: Record<string, GrupoProf[]>;
  mostrarHuecos?: boolean;
}) {
  const [verSemanaCompleta, setVerSemanaCompleta] = useState(false);
  const [formato12h, setFormato12h] = useState(false);

  useEffect(() => {
    try {
      const vSemana = localStorage.getItem("horatriz_ver_semana_completa") || localStorage.getItem("upao_ver_semana_completa");
      if (vSemana !== null) {
        setVerSemanaCompleta(vSemana === "true");
      }
      const vFormato = localStorage.getItem("horatriz_formato_12h") || localStorage.getItem("upao_formato_12h");
      if (vFormato !== null) {
        setFormato12h(vFormato === "true");
      }
    } catch {}
  }, []);

  const toggleVerSemanaCompleta = () => {
    setVerSemanaCompleta((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("horatriz_ver_semana_completa", String(next));
      } catch {}
      return next;
    });
  };

  const toggleFormato12h = () => {
    setFormato12h((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("horatriz_formato_12h", String(next));
      } catch {}
      return next;
    });
  };

  const diasUnicos = [...new Set(sesiones.map((s) => s.dia))].sort(
    (a, b) => DIA_INDEX[a] - DIA_INDEX[b]
  );

  const tieneDomingo = sesiones.some((s) => s.dia === "DOM");

  const diasAMostrar: Dia[] = verSemanaCompleta
    ? (tieneDomingo
        ? ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"]
        : ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB"])
    : (diasUnicos.length > 0 ? diasUnicos : ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB"]);

  const [diaActivoMovil, setDiaActivoMovil] = useState<Dia>(diasAMostrar[0] ?? "LUN");

  if (sesiones.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
        Sin sesiones seleccionadas.
      </p>
    );
  }

  const [vistaAgenda, setVistaAgenda] = useState(false);
  const [containerRef, containerWidth] = useContainerWidth();

  // Todos los días de la semana se muestran de lado a lado, permitiendo scroll horizontal en móvil
  const diasGrid = diasAMostrar;
  const sesionesDelGrid = sesiones;

  // Recorte adaptativo de horas: ajustado a las sesiones existentes para mantener un alto compacto
  const horaInicioReal = sesionesDelGrid.length > 0
    ? Math.max(HORA_INICIO, Math.min(...sesionesDelGrid.map((s) => s.inicio)) - 60)
    : HORA_INICIO;
  const horaFinReal = sesionesDelGrid.length > 0
    ? Math.min(HORA_FIN, Math.max(...sesionesDelGrid.map((s) => s.fin)) + 60)
    : HORA_FIN;

  // Redondear a horas enteras
  const horaInicioSnap = Math.floor(horaInicioReal / 60) * 60;
  const horaFinSnap = Math.ceil(horaFinReal / 60) * 60;

  const totalHoras = Math.max(1, (horaFinSnap - horaInicioSnap) / 60);
  const pxPorHora = containerWidth < 400 ? 50 : containerWidth < 640 ? 56 : 72;
  const altoDia = totalHoras * pxPorHora;

  const marcas = Array.from(
    { length: Math.floor(totalHoras) + 1 },
    (_, i) => horaInicioSnap + i * 60
  );

  // Calcular huecos por día
  const huecosPorDia = new Map<Dia, HuecoInfo[]>();
  if (mostrarHuecos) {
    for (const d of diasAMostrar) {
      const sesDia = sesiones
        .filter((s) => s.dia === d)
        .sort((a, b) => a.inicio - b.inicio);

      const listHuecos: HuecoInfo[] = [];
      for (let i = 0; i < sesDia.length - 1; i++) {
        const actualFin = sesDia[i].fin;
        const sigInicio = sesDia[i + 1].inicio;
        if (sigInicio > actualFin) {
          const duracionMin = sigInicio - actualFin;
          // Solo mostrar como hueco si la ventana libre supera los 10 minutos
          // (los recesos estándar de 5 min entre clases no son horas muertas)
          if (duracionMin > 10) {
            listHuecos.push({
              inicio: actualFin,
              fin: sigInicio,
              duracionMin,
            });
          }
        }
      }
      if (listHuecos.length > 0) {
        huecosPorDia.set(d, listHuecos);
      }
    }
  }

  return (
    <div ref={containerRef} className="space-y-2 sm:space-y-3">
      {/* Toolbar: Vista Compacta / Completa, Formato 24h/12h, Vista Agenda */}
      <div className="flex flex-wrap items-center justify-between text-xs pb-1 gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleVerSemanaCompleta}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              !verSemanaCompleta
                ? "bg-emerald-600 text-white shadow-xs font-bold"
                : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
            title="Alternar entre vista compacta (días con clase) y vista completa"
          >
            {!verSemanaCompleta ? "🗓️ Vista compacta" : "🗓️ Vista completa"}
          </button>
          <button
            type="button"
            onClick={toggleFormato12h}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              !formato12h
                ? "bg-emerald-600 text-white shadow-xs font-bold"
                : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
            title="Alternar formato de hora entre 24h y 12h AM/PM"
          >
            {!formato12h ? "🕒 Formato 24h" : "🕒 Formato 12h (AM/PM)"}
          </button>
          <button
            type="button"
            onClick={() => setVistaAgenda(!vistaAgenda)}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              vistaAgenda
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {vistaAgenda ? "📊 Gráfica" : "📋 Agenda (Lista)"}
          </button>
        </div>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
          {diasAMostrar.length} días · Desliza ↔️ para explorar la semana
        </span>
      </div>

      {/* Vista Agenda (Lista Compacta) */}
      {vistaAgenda ? (() => {
        const sesionesDelDia = sesionesDelGrid.filter(s => s.dia === diaActivoMovil);
        return (
        <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-md dark:border-zinc-800 dark:bg-zinc-950">
          {/* Selector de día para la vista agenda */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {diasAMostrar.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDiaActivoMovil(d)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  diaActivoMovil === d
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {DIA_LABEL[d]}
              </button>
            ))}
          </div>
          <div className="text-xs font-black uppercase text-zinc-700 dark:text-zinc-300 border-b pb-2 dark:border-zinc-800 flex items-center justify-between">
            <span>📅 {DIA_LABEL[diaActivoMovil]}</span>
            <span className="text-[10px] font-semibold text-zinc-500">
              {sesionesDelDia.length} clase{sesionesDelDia.length !== 1 ? "s" : ""}
            </span>
          </div>
          {sesionesDelDia.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-400">
              🌴 Sin clases programadas para este día.
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {sesionesDelDia
                .sort((a, b) => a.inicio - b.inicio)
                .map((s) => {
                  const cInfo = paletaDeCurso(s.codigo, colores);
                  return (
                    <div
                      key={s.id}
                      className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
                    >
                      <div className="shrink-0 text-center font-bold text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
                        <div>{fmtHora(s.inicio, formato12h)}</div>
                        <div className="text-[10px] opacity-60">a</div>
                        <div>{fmtHora(s.fin, formato12h)}</div>
                      </div>
                      <div className="border-l border-zinc-200 pl-3 dark:border-zinc-800 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${cInfo.dot}`} />
                          <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            {s.curso}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                          <span className="font-semibold bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
                            {TIPO_LABEL[s.tipo]} ({s.seccion || s.nrc})
                          </span>
                          {s.aula && (
                            <span className="font-mono bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded text-[10px]">
                              📍 {s.aula}
                            </span>
                          )}
                          {s.docente && (
                            <span className="truncate max-w-[200px]">
                              👤 {s.docente}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
        );
      })() : (
        /* Grid Principal */
        <div className="overflow-x-auto overflow-y-visible rounded-xl border border-zinc-200 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-950">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${diasAMostrar.length}, minmax(${MIN_COL_WIDTH}px, 1fr))`,
            }}
          >
          {/* Header de días */}
          <div className="border-r border-b border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900" />
          {diasGrid.map((d) => (
            <div
              key={d}
              className="border-r border-b border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 last:border-r-0"
            >
              <div className="px-1 py-2 text-center text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
                {DIA_LABEL[d]}
              </div>
            </div>
          ))}

          {/* Marcas de tiempo */}
          <div
            className="relative border-r border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
            style={{ height: altoDia }}
          >
            {marcas.map((h) => (
              <span
                key={h}
                className={`absolute right-1 sm:right-1.5 translate-y-[-50%] text-[9px] sm:text-[10px] font-bold tabular-nums text-zinc-600 dark:text-zinc-400 ${
                  h === horaInicioSnap ? "translate-y-0" : ""
                }`}
                style={{ top: ((h - horaInicioSnap) / 60) * pxPorHora }}
              >
                {fmtHora(h, formato12h)}
              </span>
            ))}
          </div>

          {/* Columnas de días */}
          {diasGrid.map((d) => (
            <div
              key={d}
              className="relative border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 last:border-r-0"
              style={{ height: altoDia }}
            >
              {/* Líneas horizontales por hora */}
              {marcas.map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-zinc-200/90 dark:border-zinc-800/80"
                  style={{ top: ((h - horaInicioSnap) / 60) * pxPorHora }}
                />
              ))}

              {/* Render de Huecos entre clases */}
              {huecosPorDia.get(d)?.map((hk) => {
                const top = ((hk.inicio - horaInicioSnap) / 60) * pxPorHora;
                const alto = ((hk.duracionMin) / 60) * pxPorHora;
                return (
                  <div
                    key={`hueco-${hk.inicio}`}
                    className="absolute inset-x-1 z-0 flex items-center justify-center rounded border border-dashed border-amber-400/80 bg-amber-50/90 text-amber-900 dark:border-amber-500/70 dark:bg-amber-950/40 dark:text-amber-300 font-bold"
                    style={{ top, height: Math.max(alto - 2, 18) }}
                    title={`Hueco de ${fmtDuracion(hk.duracionMin)}`}
                  >
                    <span className="px-1 text-[10px] tracking-tight truncate">
                      ⏳ Hueco: {fmtDuracion(hk.duracionMin)}
                    </span>
                  </div>
                );
              })}

              {/* Render de Sesiones */}
              {sesiones
                .filter((s) => s.dia === d)
                .map((s) => {
                  const top = ((s.inicio - horaInicioSnap) / 60) * pxPorHora;
                  const alto = ((s.fin - s.inicio) / 60) * pxPorHora;
                  const grupos = s.codigo ? gruposPorCurso?.[s.codigo] : undefined;
                  const numGrupo = grupos ? numeroDeGrupo(grupos, s) : 1;
                  const tagGrupo = `${s.tipo}${numGrupo}`; // Ej: T1, T2, P1, P2, L1, L2
                  const iconoTipo = TIPO_ICONO[s.tipo] ?? "";

                  const esMuyCorto = alto < 60;
                  const esCorto = alto < 95;

                  return (
                    <div
                      key={s.id}
                      className={`absolute inset-x-1 z-10 flex flex-col justify-between overflow-hidden rounded-xl border-2 px-2 py-1.5 shadow-md transition-colors hover:z-30 hover:border-white ${
                        s.esLleno
                          ? "ring-2 ring-rose-500 border-rose-500 " + colorDeCurso(s.codigo, colores)
                          : colorDeCurso(s.codigo, colores)
                      }`}
                      style={{ top, height: Math.max(alto - 2, 24) }}
                      title={`${s.esLleno ? "[TURNO LLENO] " : ""}${s.curso} · ${tagGrupo} ${s.nrc ? "NRC: " + s.nrc + " " : ""}${s.docente ? "· " + s.docente : ""} · ${fmtHora(s.inicio, formato12h)}-${fmtHora(s.fin, formato12h)} · ${s.aula}`}
                    >
                      <div className="space-y-1">
                        {/* Banner de Advertencia si está lleno */}
                        {s.esLleno && (
                          <div className="rounded bg-rose-600 px-1.5 py-0.5 text-center text-[9.5px] font-black uppercase text-white shadow animate-pulse">
                            ⚠️ Turno Lleno
                          </div>
                        )}

                        {/* Fila 1: Nombre del Curso y Tag T1, P1, L1... */}
                        <div className="flex items-start justify-between gap-1 leading-tight">
                          <span className="font-black text-[12px] tracking-normal break-words line-clamp-2 uppercase text-white drop-shadow-xs">
                            {s.curso || s.codigo}
                          </span>
                          <span
                            className="shrink-0 rounded px-1.5 py-0.5 bg-black/75 text-white border border-white/40 text-[10px] font-black tracking-wider shadow-xs"
                            title={`Tipo y Grupo: ${tagGrupo}`}
                          >
                            {iconoTipo} {tagGrupo}
                          </span>
                        </div>

                        {/* Fila 2: NRC (si el alto lo permite) */}
                        {!esMuyCorto && s.nrc && (
                          <div className="text-[10.5px] font-mono font-black text-white/95 leading-tight">
                            NRC: {s.nrc} {s.seccion ? `(${s.seccion})` : ""}
                          </div>
                        )}

                        {/* Fila 3: Docente (si el alto lo permite) */}
                        {!esCorto && (
                          <div className="text-[11px] font-bold text-white leading-tight truncate pt-0.5">
                            👤 {s.docente ? s.docente : "Sin docente"}
                          </div>
                        )}
                      </div>

                      {/* Fila Footer: Hora y Aula / Modalidad */}
                      {(() => {
                        const esVirt = s.esVirtual || !s.aula || s.aula.toUpperCase() === "NINGUNO";
                        return (
                          <div className="mt-1 flex items-center justify-between border-t border-white/40 pt-1 text-[10.5px] font-black text-white leading-tight shrink-0">
                            <span className="tabular-nums">⏰ {`${fmtHora(s.inicio, formato12h)}–${fmtHora(s.fin, formato12h)}`}</span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-mono border font-black shadow-xs ${
                                esVirt
                                  ? "bg-purple-900 text-purple-100 border-purple-300"
                                  : "bg-black/75 text-white border-white/40"
                              }`}
                              title={esVirt ? "Modalidad No Presencial / Virtual" : `Modalidad Presencial en Aula ${s.aula}`}
                            >
                              {esVirt ? "💻 Virtual" : `📍 ${s.aula}`}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}