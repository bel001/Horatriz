"use client";

import { useState } from "react";
import type { HorarioResult } from "@/lib/model";
import { fmtDuracion } from "@/lib/time";
import { Badge, Btn, Card } from "./ui";
import { GridSemana } from "./GridSemana";

export function ComparadorHorarios({
  horarios,
  colores,
  onCerrar,
}: {
  horarios: HorarioResult[];
  colores?: Record<string, string>;
  onCerrar: () => void;
}) {
  const [seleccionados, setSeleccionados] = useState<number[]>(
    horarios.length >= 2 ? [0, 1] : [0]
  );

  const toggleSeleccion = (idx: number) => {
    if (seleccionados.includes(idx)) {
      if (seleccionados.length <= 1) return; // Mantener al menos 1
      setSeleccionados(seleccionados.filter((i) => i !== idx));
    } else {
      if (seleccionados.length >= 3) {
        // Máximo 3 para comparar
        setSeleccionados([...seleccionados.slice(1), idx]);
      } else {
        setSeleccionados([...seleccionados, idx]);
      }
    }
  };

  const elegidos = seleccionados
    .map((i) => ({ index: i, item: horarios[i] }))
    .filter((e) => e.item !== undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              🔀 Comparador Lado a Lado
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Selecciona hasta 3 opciones de horario para evaluar sus diferencias.
            </p>
          </div>
          <Btn variant="secondary" onClick={onCerrar}>
            Cerrar ✕
          </Btn>
        </div>

        {/* Bar de Selección */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-200 bg-zinc-50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Comparando ({seleccionados.length}/3):
          </span>
          {horarios.map((h, idx) => {
            const activo = seleccionados.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleSeleccion(idx)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  activo
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                }`}
              >
                <span>Opción #{idx + 1}</span>
                <Badge color={h.score >= 80 ? "emerald" : h.score >= 50 ? "amber" : "rose"}>
                  {h.score}%
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Grilla Comparativa */}
        <div className="flex-1 overflow-y-auto p-6">
          <div
            className="grid gap-6"
            style={{
              gridTemplateColumns: `repeat(${elegidos.length}, minmax(300px, 1fr))`,
            }}
          >
            {elegidos.map(({ index, item }) => (
              <Card key={index} className="flex flex-col space-y-4">
                <div className="flex items-start justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Opción #{index + 1}
                    </span>
                    <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                      Puntaje: {item.score}%
                    </h3>
                  </div>
                  <Badge color={item.score >= 80 ? "emerald" : item.score >= 50 ? "amber" : "rose"}>
                    {item.score >= 80 ? "Excelente" : item.score >= 50 ? "Aceptable" : "Bajo"}
                  </Badge>
                </div>

                {/* Métricas clave */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/50">
                    <span className="block text-zinc-500 dark:text-zinc-400">Días de Clase</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {item.diasConClase.length} días ({item.diasConClase.join(", ")})
                    </span>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/50">
                    <span className="block text-zinc-500 dark:text-zinc-400">Huecos / Libres</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {item.minutosHuecos > 0 ? fmtDuracion(item.minutosHuecos) : "Sin huecos 🎉"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/50">
                    <span className="block text-zinc-500 dark:text-zinc-400">Créditos Totales</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {item.totalCreditos} créditos
                    </span>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/50">
                    <span className="block text-zinc-500 dark:text-zinc-400">Horas Lectivas</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {fmtDuracion(item.totalMinutos)}
                    </span>
                  </div>
                </div>

                {/* Vista previa Grid */}
                <div className="flex-1">
                  <span className="mb-2 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Horario Semanal:
                  </span>
                  <GridSemana
                    sesiones={item.sesiones}
                    colores={colores}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
