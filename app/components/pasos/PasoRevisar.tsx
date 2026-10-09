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
  const validas = filas.filter((f) => !f.ignorada && f.dia && f.inicio !== null && f.fin !== null).length;
  const conProblemas = filas.filter(
    (f) => !f.ignorada && (!f.dia || f.inicio === null || f.fin === null)
  ).length;
  const ignoradas = filas.filter((f) => f.ignorada).length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <Paso
        n={2}
        titulo="Revisa los datos detectados"
        descripcion="Comprueba las filas que necesitan atención. Puedes editar cualquier dato antes de continuar."
      />

      {advertencias.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">!</span>
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

      <Card className="grid gap-3 p-3 sm:grid-cols-3 sm:p-4">
        <div className="rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30">
          <p className="text-2xl font-semibold tabular-nums text-emerald-800 dark:text-emerald-300">{validas}</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">filas listas</p>
        </div>
        <div className={`rounded-xl px-4 py-3 ${conProblemas ? "bg-amber-50 dark:bg-amber-950/30" : "bg-slate-50 dark:bg-zinc-800/60"}`}>
          <p className={`text-2xl font-semibold tabular-nums ${conProblemas ? "text-amber-800 dark:text-amber-300" : "text-slate-700 dark:text-zinc-200"}`}>{conProblemas}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">requieren atención</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-zinc-800/60">
          <p className="text-2xl font-semibold tabular-nums text-slate-700 dark:text-zinc-200">{ignoradas}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">ignoradas</p>
        </div>
      </Card>

      <EditorFilas filas={filas} onChange={setFilas} />

      <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_12px_36px_rgb(15_23_42/0.12)] backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/95">
        <Btn variant="ghost" onClick={onVolver}>
          <span aria-hidden="true">←</span> Volver
        </Btn>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Btn variant="secondary" onClick={onAgregarMas}>
            Añadir más datos
          </Btn>
          <Btn disabled={validas === 0} onClick={onContinuar} className="min-w-48">
            Continuar con {validas} filas <span aria-hidden="true">→</span>
          </Btn>
        </div>
      </div>
    </div>
  );
}
