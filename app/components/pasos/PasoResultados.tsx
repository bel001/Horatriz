"use client";

import { useRef, useState } from "react";
import type { HorarioResult, ResultadoGeneracion } from "@/lib/model";
import { fmtDuracion } from "@/lib/time";
import { toPng } from "html-to-image";
import { descargarIcs } from "@/lib/ical";
import { Badge, Btn, Card, Checkbox, Paso, inputCls } from "../ui";
import { GridSemana } from "../GridSemana";
import { ComparadorHorarios } from "../ComparadorHorarios";
import type { BorradorGuardado } from "@/lib/hooks/useEstadoHorarios";

export function PasoResultados({
  resultado,
  colores,
  borradores,
  onGuardarBorrador,
  onEliminarBorrador,
  onVolver,
}: {
  resultado: ResultadoGeneracion | null;
  colores: Record<string, string>;
  borradores: BorradorGuardado[];
  onGuardarBorrador: (nombre: string, horario: HorarioResult) => void;
  onEliminarBorrador: (id: string) => void;
  onVolver: () => void;
}) {
  const [idxSeleccionado, setIdxSeleccionado] = useState<number>(0);
  const [filtroSinHuecos, setFiltroSinHuecos] = useState(false);
  const [filtroDiaLibre, setFiltroDiaLibre] = useState(false);
  const [mostrandoComparador, setMostrandoComparador] = useState(false);
  const [nombreBorrador, setNombreBorrador] = useState("");
  const [guardadoExitosa, setGuardadoExitosa] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  if (!resultado || resultado.horarios.length === 0) {
    return (
      <div className="space-y-6">
        <Paso
          n={4}
          titulo="No se encontraron horarios viables"
          descripcion="Las restricciones configuradas descartan todas las combinaciones posibles."
        />
        <Card className="border-rose-200 bg-rose-50 p-6 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          <h3 className="font-bold">Sugerencias para resolver conflictos:</h3>
          <ul className="mt-2 list-disc pl-5 text-xs space-y-1">
            <li>Relaja las reglas estrictas (días sin clases o no salir después de).</li>
            <li>Elimina o ajusta los bloques personales bloqueados.</li>
            <li>Revisa si hay cruces de horario obligatorios entre dos cursos seleccionados.</li>
          </ul>
        </Card>
        <Btn variant="secondary" onClick={onVolver}>
          ← Ajustar Cursos y Preferencias
        </Btn>
      </div>
    );
  }

  // Filtrado rápido
  let horariosFiltrados = resultado.horarios;
  if (filtroSinHuecos) {
    horariosFiltrados = horariosFiltrados.filter((h) => h.minutosHuecos === 0);
  }
  if (filtroDiaLibre) {
    horariosFiltrados = horariosFiltrados.filter((h) => h.diasConClase.length < 6);
  }

  const horarioActual = horariosFiltrados[idxSeleccionado] ?? horariosFiltrados[0];

  const exportarPng = async () => {
    if (!gridRef.current) return;
    try {
      const dataUrl = await toPng(gridRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `horario_${horarioActual.score}pts.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert("Error al exportar imagen PNG.");
    }
  };

  const exportarIcs = () => {
    descargarIcs(horarioActual, `horario_${horarioActual.score}pts.ics`);
  };

  const handleGuardar = () => {
    onGuardarBorrador(nombreBorrador, horarioActual);
    setNombreBorrador("");
    setGuardadoExitosa(true);
    setTimeout(() => setGuardadoExitosa(false), 2500);
  };

  return (
    <div className="space-y-6">
      <Paso
        n={4}
        titulo="Horarios Optimizados Generados"
        descripcion="Explora las combinaciones ordenadas de mejor a peor según tus criterios y exporta tu horario final."
      />

      {/* Chips de filtro rápido */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Filtros Rápidos:
          </span>
          <Checkbox
            checked={filtroSinHuecos}
            onChange={setFiltroSinHuecos}
            label="Sin huecos"
          />
          <Checkbox
            checked={filtroDiaLibre}
            onChange={setFiltroDiaLibre}
            label="Día libre garantizado"
          />
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" onClick={() => setMostrandoComparador(true)}>
            🔀 Comparar Horarios
          </Btn>
        </div>
      </div>

      {/* Grid de Resultados: Lista de Opciones + Vista Previa */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Columna Izquierda: Opciones Rankeadas */}
        <div className="space-y-3 lg:col-span-5">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
            <span>{horariosFiltrados.length} de {resultado.horarios.length} horarios</span>
            <span>Orden por Puntaje 100%</span>
          </div>

          {horariosFiltrados.map((item, idx) => {
            const activo = item === horarioActual;
            return (
              <Card
                key={idx}
                className={`cursor-pointer transition-all ${
                  activo
                    ? "ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/20"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                }`}
              >
                <div onClick={() => setIdxSeleccionado(idx)} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400">
                      Opción #{idx + 1}
                    </span>
                    <Badge color={item.score >= 80 ? "emerald" : item.score >= 50 ? "amber" : "rose"}>
                      Puntaje: {item.score}%
                    </Badge>
                  </div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {item.nombre}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>📅 {item.diasConClase.length} días</span>
                    <span>⏱️ {fmtDuracion(item.totalMinutos)} lectivas</span>
                    <span className={item.minutosHuecos > 0 ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
                      ⏳ {item.minutosHuecos > 0 ? fmtDuracion(item.minutosHuecos) + " hueco" : "Sin huecos"}
                    </span>
                    <span>🎓 {item.totalCreditos} créd.</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Columna Derecha: Vista Previa de Parrilla y Exportación */}
        <div className="space-y-4 lg:col-span-7">
          {horarioActual && (
            <Card className="space-y-4">
              {/* Header de la opción actual */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <div>
                  <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                    Horario Opción #{idxSeleccionado + 1} ({horarioActual.score}%)
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {horarioActual.totalCreditos} créditos totales · {horarioActual.diasConClase.length} días de clase
                  </p>
                </div>

                {/* Acciones de exportación */}
                <div className="flex items-center gap-2">
                  <Btn variant="secondary" onClick={exportarIcs} title="Descargar archivo .ics para Google Calendar / iCal">
                    📅 iCal (.ics)
                  </Btn>
                  <Btn variant="primary" onClick={exportarPng} title="Descargar como imagen PNG">
                    🖼️ PNG
                  </Btn>
                </div>
              </div>

              {/* Guardar en borradores */}
              <div className="flex items-center gap-2 rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-800/40">
                <input
                  className={`${inputCls()} text-xs`}
                  placeholder="Nombre para guardar este horario (ej. Plan A)"
                  value={nombreBorrador}
                  onChange={(e) => setNombreBorrador(e.target.value)}
                />
                <Btn variant="secondary" onClick={handleGuardar}>
                  {guardadoExitosa ? "¡Guardado! 💾" : "💾 Guardar"}
                </Btn>
              </div>

              {/* Grid Semanal Renderizado */}
              <div ref={gridRef} className="p-2 bg-white dark:bg-zinc-900 rounded-xl">
                <GridSemana
                  sesiones={horarioActual.sesiones}
                  colores={colores}
                  mostrarHuecos={true}
                />
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Sección de Borradores Guardados */}
      {borradores.length > 0 && (
        <Card className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            💾 Tus Horarios Guardados ({borradores.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {borradores.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{b.nombre}</h4>
                  <p className="text-[10px] text-zinc-400">{b.fecha} · {b.horario.score}% score</p>
                </div>
                <button
                  type="button"
                  onClick={() => onEliminarBorrador(b.id)}
                  className="rounded p-1 text-zinc-400 hover:text-rose-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal Comparador */}
      {mostrandoComparador && (
        <ComparadorHorarios
          horarios={resultado.horarios}
          colores={colores}
          onCerrar={() => setMostrandoComparador(false)}
        />
      )}

      {/* Volver */}
      <div className="pt-4">
        <Btn variant="secondary" onClick={onVolver}>
          ← Volver a Cursos y Preferencias
        </Btn>
      </div>
    </div>
  );
}
