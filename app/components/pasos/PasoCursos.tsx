"use client";

import type { Curso, Preferencias, ResultadoGeneracion, Tipo } from "@/lib/model";
import { TIPO_LABEL } from "@/lib/model";
import { gruposDeCurso, profesDeGrupoCompatibles } from "@/lib/groups";
import { Badge, Btn, Card, Checkbox, Paso, inputCls } from "../ui";
import { PreferenciasPanel } from "../PreferenciasPanel";
import { dotDeCurso } from "../GridSemana";

export function PasoCursos({
  cursos,
  seleccionados,
  setSeleccionados,
  creditos,
  setCreditos,
  docPref,
  setDocPref,
  fijados,
  setFijados,
  colores,
  prefs,
  setPrefs,
  onEliminarCurso,
  sinLiga,
  compartido,
  onCompartir,
  previa,
  onVolver,
  onGenerar,
}: {
  cursos: Curso[];
  seleccionados: Set<string>;
  setSeleccionados: React.Dispatch<React.SetStateAction<Set<string>>>;
  creditos: Record<string, number>;
  setCreditos: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  docPref: Record<string, Partial<Record<Tipo, string>>>;
  setDocPref: React.Dispatch<React.SetStateAction<Record<string, Partial<Record<Tipo, string>>>>>;
  fijados: Record<string, string>;
  setFijados: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  colores: Record<string, string>;
  prefs: Preferencias;
  setPrefs: (p: Preferencias) => void;
  onEliminarCurso: (codigo: string) => void;
  sinLiga: number;
  compartido: boolean;
  onCompartir: () => void;
  previa: ResultadoGeneracion | null;
  onVolver: () => void;
  onGenerar: () => void;
}) {
  const toggleSeleccion = (codigo: string) => {
    setSeleccionados((prev) => {
      const n = new Set(prev);
      if (n.has(codigo)) n.delete(codigo);
      else n.add(codigo);
      return n;
    });
  };

  const seleccionarTodos = (val: boolean) => {
    setSeleccionados(val ? new Set(cursos.map((c) => c.codigo)) : new Set());
  };

  const totalCreditos = cursos
    .filter((c) => seleccionados.has(c.codigo))
    .reduce((sum, c) => sum + (creditos[c.codigo] ?? c.creditos ?? 0), 0);

  return (
    <div className="space-y-6">
      <Paso
        n={3}
        titulo="Cursos y Preferencias"
        descripcion="Selecciona los cursos que llevarás este semestre, ajusta docentes preferidos, fija secciones y configura tus bloques personales."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge color="emerald">
            {seleccionados.size} de {cursos.length} cursos seleccionados
          </Badge>
          <Badge color="sky">{totalCreditos} créditos totales</Badge>
          {sinLiga > 0 && (
            <Badge color="amber">{sinLiga} opciones sin LIGA agrupadas</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" onClick={onCompartir}>
            {compartido ? "¡Enlace copiado! 📋" : "🔗 Compartir oferta"}
          </Btn>
          <Btn
            variant="ghost"
            onClick={() => seleccionarTodos(seleccionados.size < cursos.length)}
          >
            {seleccionados.size < cursos.length ? "Seleccionar todos" : "Desmarcar todos"}
          </Btn>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Columna Izquierda: Cursos */}
        <div className="space-y-4 lg:col-span-7">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Lista de Cursos ({cursos.length})
          </h3>

          {cursos.map((curso) => {
            const sel = seleccionados.has(curso.codigo);
            const grupos = gruposDeCurso(curso);
            const tiposPresentes: Tipo[] = [];
            for (const t of ["T", "P", "L"] as const) {
              if (grupos.some((g) => (g.profs[t]?.length ?? 0) > 0)) tiposPresentes.push(t);
            }

            return (
              <Card
                key={curso.codigo}
                className={`transition-all ${
                  sel
                    ? "border-emerald-200 bg-white dark:border-emerald-900/60 dark:bg-zinc-900"
                    : "opacity-60 bg-zinc-50 dark:bg-zinc-950"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={sel}
                      onChange={() => toggleSeleccion(curso.codigo)}
                      label=""
                    />
                    <span
                      className={`h-3 w-3 shrink-0 rounded-full ${dotDeCurso(curso.codigo, colores)}`}
                    />
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-50">
                        {curso.nombre || curso.codigo}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <Badge color="zinc">{curso.codigo}</Badge>
                        <span>{curso.opciones.length} opciones</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-zinc-500">Créditos:</span>
                      <input
                        type="number"
                        min={0}
                        max={15}
                        className="w-14 rounded-lg border border-zinc-200 px-2 py-1 text-center font-bold dark:border-zinc-800 dark:bg-zinc-800"
                        value={creditos[curso.codigo] ?? curso.creditos ?? 0}
                        onChange={(e) =>
                          setCreditos((prev) => ({
                            ...prev,
                            [curso.codigo]: parseInt(e.target.value || "0", 10),
                          }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      title="Eliminar curso"
                      onClick={() => onEliminarCurso(curso.codigo)}
                      className="rounded p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Preferencias de docente y Fijar sección */}
                {sel && (
                  <div className="mt-4 space-y-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    {/* Preferencia por tipo T/P/L */}
                    {tiposPresentes.length > 0 && (
                      <div className="grid gap-2 sm:grid-cols-3 text-xs">
                        {tiposPresentes.map((tipo) => {
                          const profes = profesDeGrupoCompatibles(grupos, docPref[curso.codigo] ?? {}, tipo);
                          const profVal = docPref[curso.codigo]?.[tipo] ?? "";
                          return (
                            <div key={tipo}>
                              <span className="mb-1 block font-semibold text-zinc-500">
                                Docente {TIPO_LABEL[tipo]}:
                              </span>
                              <select
                                className={`${inputCls()} py-1 text-xs`}
                                value={profVal}
                                onChange={(e) =>
                                  setDocPref((prev) => ({
                                    ...prev,
                                    [curso.codigo]: {
                                      ...(prev[curso.codigo] ?? {}),
                                      [tipo]: e.target.value,
                                    },
                                  }))
                                }
                              >
                                <option value="">Cualquier docente</option>
                                {profes.map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Fijar opción específica */}
                    {curso.opciones.length > 1 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-500">
                          📌 Fijar opción única de horario:
                        </span>
                        <select
                          className={`${inputCls()} w-56 py-1 text-xs`}
                          value={fijados[curso.codigo] ?? ""}
                          onChange={(e) =>
                            setFijados((prev) => ({
                              ...prev,
                              [curso.codigo]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Ninguna fijada (Explorar todas)</option>
                          {curso.opciones.map((o) => (
                            <option key={o.id} value={o.id}>
                              Sección {o.seccion || o.nrc} ({o.sesiones.length} sesiones)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Columna Derecha: Panel de Preferencias */}
        <div className="space-y-4 lg:col-span-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Preferencias & Bloques Personales
          </h3>
          <PreferenciasPanel prefs={prefs} onChange={setPrefs} />
        </div>
      </div>

      {/* Previa de generación */}
      {previa && (
        <Card className="border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-emerald-900 dark:text-emerald-300">
              ⚡ Pre-cálculo de combinación: {previa.horarios.length} horarios viables encontrados ({previa.considerados} evaluados en {previa.tiempoMs}ms)
            </span>
            {previa.horarios.length > 0 && (
              <Badge color="emerald">
                Puntaje máximo actual: {previa.horarios[0].score}%
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Botones de acción */}
      <div className="flex items-center justify-between pt-4">
        <Btn variant="secondary" onClick={onVolver}>
          ← Volver a Revisar
        </Btn>
        <Btn
          disabled={seleccionados.size === 0}
          onClick={onGenerar}
          className="text-base px-7 py-3"
        >
          🎲 Generar y Optimizar Horarios ➔
        </Btn>
      </div>
    </div>
  );
}
