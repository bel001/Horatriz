"use client";

import { useMemo, useState } from "react";
import type { Dia, FilaParseada, Tipo } from "@/lib/model";
import { DIAS, TIPO_LABEL } from "@/lib/model";
import { fmtHora, toMinutes } from "@/lib/time";
import { Badge, Checkbox, inputCls } from "./ui";
import { colorDeCurso } from "./GridSemana";

export function EditorFilas({
  filas,
  onChange,
}: {
  filas: FilaParseada[];
  onChange: (f: FilaParseada[]) => void;
}) {
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());

  const actualizar = (id: string, patch: Partial<FilaParseada>) => {
    onChange(filas.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const grupos = useMemo(() => {
    const mapa = new Map<string, FilaParseada[]>();
    for (const f of filas) {
      const clave = (f.codigo || f.curso || "Sin curso").trim();
      const arr = mapa.get(clave) ?? [];
      arr.push(f);
      mapa.set(clave, arr);
    }
    return [...mapa.entries()];
  }, [filas]);

  const validas = filas.filter((f) => f.dia && f.inicio !== null && f.fin !== null).length;
  const todasAbiertas = grupos.length > 0 && abiertos.size === grupos.length;

  const toggle = (clave: string) => {
    setAbiertos((prev) => {
      const n = new Set(prev);
      if (n.has(clave)) n.delete(clave);
      else n.add(clave);
      return n;
    });
  };

  const toggleTodas = () => {
    setAbiertos(todasAbiertas ? new Set() : new Set(grupos.map(([c]) => c)));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <Badge color="sky">{filas.length} filas</Badge>
        <Badge color="emerald">{validas} listas para agrupar</Badge>
        <span>Revisa y corrige las filas resaltadas en ámbar.</span>
        {grupos.length > 0 && (
          <button
            type="button"
            onClick={toggleTodas}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
          >
            {todasAbiertas ? "Contraer todo" : "Expandir todo"}
          </button>
        )}
      </div>

      {grupos.length === 0 && (
        <p className="rounded-xl border border-zinc-200 p-6 text-center text-sm text-zinc-400 dark:border-zinc-800">
          No hay filas para revisar.
        </p>
      )}

      {grupos.map(([clave, filasGrupo]) => {
        const abierto = abiertos.has(clave);
        const curso = filasGrupo.find((f) => f.curso)?.curso ?? clave;
        const codigo = filasGrupo.find((f) => f.codigo)?.codigo ?? "";
        const incompletas = filasGrupo.filter(
          (f) => f.dia && (f.inicio === null || f.fin === null)
        ).length;
        const ignoradas = filasGrupo.filter((f) => f.ignorada).length;
        return (
          <div
            key={clave}
            className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
          >
            <button
              type="button"
              onClick={() => toggle(clave)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <span className="text-xs text-zinc-400">{abierto ? "▾" : "▸"}</span>
              <span
                className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${colorDeCurso(codigo || clave)}`}
              />
              <span className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                {curso}
              </span>
              {codigo && <Badge color="zinc">{codigo}</Badge>}
              <span className="ml-auto flex items-center gap-1.5">
                {incompletas > 0 && (
                  <Badge color="amber">{incompletas} incompletas</Badge>
                )}
                {ignoradas > 0 && <Badge color="rose">{ignoradas} ign.</Badge>}
                <Badge color="sky">
                  {filasGrupo.length} {filasGrupo.length === 1 ? "fila" : "filas"}
                </Badge>
              </span>
            </button>
            {abierto && (
              <div className="border-t border-zinc-200 dark:border-zinc-800">
                <TablaFilas filas={filasGrupo} actualizar={actualizar} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TablaFilas({
  filas,
  actualizar,
}: {
  filas: FilaParseada[];
  actualizar: (id: string, patch: Partial<FilaParseada>) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] border-collapse text-sm">
        <thead>
          <tr className="bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <th className="px-2 py-2 font-semibold">Ign.</th>
            <th className="px-2 py-2 font-semibold">NRC</th>
            <th className="px-2 py-2 font-semibold">Sec.</th>
            <th className="px-2 py-2 font-semibold">Tipo</th>
            <th className="px-2 py-2 font-semibold">Liga</th>
            <th className="px-2 py-2 font-semibold">ID Liga</th>
            <th className="px-2 py-2 font-semibold">Día</th>
            <th className="px-2 py-2 font-semibold">Inicio</th>
            <th className="px-2 py-2 font-semibold">Fin</th>
            <th className="px-2 py-2 font-semibold">Aula</th>
            <th className="px-2 py-2 font-semibold">Docente</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => {
            const incompleta = f.dia && (f.inicio === null || f.fin === null);
            return (
              <tr
                key={f.id}
                className={`border-t border-zinc-100 dark:border-zinc-800 ${
                  f.ignorada
                    ? "opacity-40"
                    : incompleta
                      ? "bg-amber-50 dark:bg-amber-950/30"
                      : ""
                }`}
              >
                <td className="px-2 py-1">
                  <Checkbox
                    checked={f.ignorada}
                    onChange={(v) => actualizar(f.id, { ignorada: v })}
                    label={""}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className={`${inputCls()} w-20`}
                    value={f.nrc}
                    onChange={(e) => actualizar(f.id, { nrc: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className={`${inputCls()} w-12`}
                    value={f.seccion}
                    onChange={(e) => actualizar(f.id, { seccion: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1">
                  <select
                    className={inputCls()}
                    value={f.tipo}
                    onChange={(e) => actualizar(f.id, { tipo: e.target.value as Tipo | "" })}
                  >
                    <option value="">—</option>
                    {(Object.keys(TIPO_LABEL) as Tipo[]).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input
                    className={`${inputCls()} w-16`}
                    value={f.liga}
                    onChange={(e) => actualizar(f.id, { liga: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className={`${inputCls()} w-20`}
                    value={f.idLiga}
                    onChange={(e) => actualizar(f.id, { idLiga: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1">
                  <select
                    className={inputCls()}
                    value={f.dia}
                    onChange={(e) => actualizar(f.id, { dia: e.target.value as Dia | "" })}
                  >
                    <option value="">—</option>
                    {DIAS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input
                    type="time"
                    className={inputCls()}
                    value={f.inicio === null ? "" : fmtHora(f.inicio)}
                    onChange={(e) => {
                      const v = e.target.value;
                      actualizar(f.id, { inicio: v ? toMinutes(v) : null });
                    }}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="time"
                    className={inputCls()}
                    value={f.fin === null ? "" : fmtHora(f.fin)}
                    onChange={(e) => {
                      const v = e.target.value;
                      actualizar(f.id, { fin: v ? toMinutes(v) : null });
                    }}
                  />
                </td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-1">
                    <input
                      className={`${inputCls()} w-20`}
                      value={f.aula}
                      onChange={(e) =>
                        actualizar(f.id, {
                          aula: e.target.value,
                          esVirtual:
                            e.target.value.toUpperCase() === "NINGUNO" ||
                            /\b(NO\s+PRESENCIAL|VIRTUAL)\b/i.test(e.target.value),
                        })
                      }
                    />
                    {f.esVirtual || !f.aula || f.aula.toUpperCase() === "NINGUNO" ? (
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 shrink-0" title="Clase No Presencial / Virtual">
                        💻 Virt.
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-500 shrink-0" title={`Clase Presencial en Aula ${f.aula}`}>
                        🏛️
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1">
                  <input
                    className={`${inputCls()} min-w-32`}
                    value={f.docente}
                    onChange={(e) => actualizar(f.id, { docente: e.target.value })}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
