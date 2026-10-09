"use client";

import Image from "next/image";
import { useState } from "react";
import { Btn, Card, Paso } from "../ui";
import { OcrUpload } from "../OcrUpload";
import { SubirArchivo } from "../SubirArchivo";

const TEXTO_EJEMPLO = `CODIGO    NRC      SECC  TIPO  LIGA   ID LIGA  DIA   HORA          AULA     DOCENTE
CEMP-112  120123   A     T     12     3001     LUN   07:00-09:00   A-201    JUAN PEREZ
CEMP-112  120124   A     P     12     3001     MIE   07:00-09:00   A-201    JUAN PEREZ
CEMP-112  120125   A     L     12     3001     JUE   14:00-16:00   L-105    MARIA LOPEZ
CEMP-112  120133   B     T     13     3002     LUN   09:00-11:00   A-203    CARLOS RUIZ
CEMP-112  120134   B     P     13     3002     MIE   09:00-11:00   A-203    CARLOS RUIZ
CEMP-112  120135   B     L     13     3002     JUE   16:00-18:00   L-107    MARIA LOPEZ
MATE-201  220111   A     T     5      3007     MAR   08:00-10:00   B-105    LUIS TORRES
MATE-201  220112   A     P     5      3007     JUE   08:00-10:00   B-105    LUIS TORRES
MATE-201  220121   B     T     6      3008     VIE   10:00-12:00   B-107    ANA FLORES
MATE-201  220122   B     P     6      3008     VIE   12:00-14:00   B-107    ANA FLORES
INGE-100  330101   A     T     9      3010     MAR   14:00-16:00   NRB-301  PEDRO GARCIA
INGE-100  330102   A     L     9      3010     VIE   08:00-10:00   NRB-301  PEDRO GARCIA
FISICA    440201   A     T     20     3015     LUN   11:00-13:00   C-105    SOFIA MENDOZA
FISICA    440202   B     T     21     3016     MIE   11:00-13:00   C-110    JORGE VEGA`;

export function PasoTexto({
  texto,
  setTexto,
  onAnalizar,
}: {
  texto: string;
  setTexto: (t: string) => void;
  onAnalizar: (txt?: string) => void;
}) {
  const [tab, setTab] = useState<"texto" | "foto" | "archivo">("texto");

  const manejarTextoOcr = (t: string) => {
    setTexto(t);
    onAnalizar(t);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Paso
        n={1}
        titulo="Añade tu oferta académica"
        descripcion="Pega la información del portal o impórtala desde un archivo. La revisaremos antes de generar horarios."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900" role="tablist" aria-label="Forma de añadir la oferta">
            {([
              ["texto", "Pegar texto"],
              ["archivo", "Subir archivo"],
              ["foto", "Usar una foto"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`min-h-11 rounded-lg px-2 text-xs font-semibold transition-colors sm:text-sm ${tab === id ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950" : "text-slate-600 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "texto" && (
            <Card className="space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950 dark:text-zinc-50">Texto del portal académico</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Copia la tabla completa; no necesitas ordenarla antes.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTexto(TEXTO_EJEMPLO)}
                  className="min-h-9 rounded-lg px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                >
                  Usar datos de ejemplo
                </button>
              </div>
              <textarea
                rows={13}
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-5 text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:ring-emerald-950"
                placeholder="Pega aquí la oferta académica…"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                suppressHydrationWarning
                onPaste={(e) => {
                  const items = e.clipboardData?.items;
                  if (items && Array.from(items).some((item) => item.type.startsWith("image/"))) setTab("foto");
                }}
              />
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
                <p className="text-xs text-slate-500 dark:text-zinc-400">Acepta tablas, texto UPAO y filas con NRC/LIGA.</p>
                <Btn disabled={!texto.trim()} onClick={() => onAnalizar()} className="w-full sm:w-auto">
                  Detectar cursos
                  <span aria-hidden="true">→</span>
                </Btn>
              </div>
            </Card>
          )}

          {tab === "archivo" && <SubirArchivo onTexto={manejarTextoOcr} />}
          {tab === "foto" && <OcrUpload onTexto={manejarTextoOcr} />}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="space-y-4 p-5">
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Procesamiento local</p>
              <h2 className="mt-1 text-base font-semibold text-slate-950 dark:text-zinc-50">Tu oferta no se envía a Horatriz</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-400">El análisis, la generación y el guardado se realizan en este navegador.</p>
            </div>
            <ol className="space-y-3 text-sm text-slate-600 dark:text-zinc-300">
              {[
                "Añade la oferta académica",
                "Revisa las filas detectadas",
                "Elige y compara horarios",
              ].map((item, index) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-zinc-800 dark:text-zinc-200">{index + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
          </Card>

          <details className="group rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold text-slate-800 dark:text-zinc-200">
              Cómo copiar desde el portal
              <span className="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
            </summary>
            <div className="space-y-4 border-t border-slate-100 p-4 text-xs text-slate-600 dark:border-zinc-800 dark:text-zinc-400">
              <div>
                <p className="mb-2 font-medium text-slate-800 dark:text-zinc-200">1. Muestra 50 filas por página</p>
                <Image src="/guia/guia_1.png" alt="Selector de 50 filas por página" width={520} height={180} className="h-auto w-full rounded-lg border border-slate-200 dark:border-zinc-700" />
              </div>
              <div>
                <p className="mb-2 font-medium text-slate-800 dark:text-zinc-200">2. Selecciona y copia todo</p>
                <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-700">
                  <Image src="/guia/guia_2.png" alt="Tabla del portal seleccionada" width={520} height={180} className="h-auto w-full opacity-70" />
                  <span className="absolute inset-0 flex items-center justify-center font-mono font-semibold text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.8)]">Ctrl + A · Ctrl + C</span>
                </div>
              </div>
            </div>
          </details>
        </aside>
      </div>
    </div>
  );
}
