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

      {advertencias.length === 0 && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex items-start gap-2.5">
            <span className="text-lg shrink-0">✅</span>
            <div>
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                ¡Se ve bien! En la mayoría de casos no necesitas editar nada.
              </h4>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                Si todos los cursos, días y horarios se detectaron correctamente, simplemente presiona <strong>Confirmar y Continuar</strong> abajo.
                Solo edita las filas marcadas en ámbar si notas algún error.
              </p>
            </div>
          </div>
        </Card>
      )}

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
