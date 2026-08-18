"use client";

import type { FilaParseada } from "@/lib/model";
import { Btn, Card, Paso } from "../ui";
import { EditorFilas } from "../EditorFilas";

export function PasoRevisar({
  filas,
  setFilas,
  advertencias,
  modo,
  onVolver,
  onAgregarMas,
  onContinuar,
}: {
  filas: FilaParseada[];
  setFilas: (f: FilaParseada[]) => void;
  advertencias: string[];
  modo: "columnas" | "regex" | "portalupao" | "bannerupao";
  onVolver: () => void;
  onAgregarMas: () => void;
  onContinuar: () => void;
}) {
  const validas = filas.filter((f) => f.dia && f.inicio !== null && f.fin !== null).length;

  return (
    <div className="space-y-6">
      <Paso
        n={2}
        titulo="Revisar y Corregir Parseo"
        descripcion="Verifica que las clases se hayan clasificado adecuadamente por curso y corrige cualquier fila marcada en ámbar."
      />

      {advertencias.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <span className="text-base">⚠️</span>
            <div className="space-y-1 text-xs">
              <span className="font-bold">Advertencias del parseo ({modo}):</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {advertencias.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Banner Prominente con Botón Directo */}
      <Card className="border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-950 dark:bg-emerald-950/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-sm">
              ✓
            </span>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-emerald-100">
                ¡Se detectaron {validas} clases válidas correctamente!
              </h4>
              <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5 font-medium">
                No necesitas editar nada en la tabla a menos que veas una casilla resaltada en ámbar.
              </p>
            </div>
          </div>
          <Btn
            variant="primary"
            disabled={validas === 0}
            onClick={onContinuar}
            className="w-full sm:w-auto text-xs py-2.5 px-4 font-bold shrink-0"
          >
            Todo se ve bien ➔ Ver mi Horario ({validas} clases)
          </Btn>
        </div>
      </Card>

      <EditorFilas filas={filas} onChange={setFilas} />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <Btn variant="secondary" onClick={onVolver}>
          ← Volver a Texto
        </Btn>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" onClick={onAgregarMas}>
            + Agregar más cursos
          </Btn>
          <Btn disabled={validas === 0} onClick={onContinuar}>
            Confirmar y Continuar ({validas} filas) ➔
          </Btn>
        </div>
      </div>
    </div>
  );
}
