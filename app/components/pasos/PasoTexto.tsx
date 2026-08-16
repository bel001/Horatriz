"use client";

import { useState } from "react";
import { Badge, Btn, Card, Paso } from "../ui";
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

const TEXTO_EJEMPLO_BANNER = `ARQUITECTURA DE SISTEMAS	ING SISTEM E INTELIG ARTIFIC	112	J02	0	5038	2026-II (PREGRADO)	CABALLERO ALVARADO, ARMANDO (Principal)
Lunes 18:00 - 19:45
Tipo: Class Edificio: Ninguno Salón: Ninguno
CAMPUS PRINCIPAL TRUJILLO	50 de 50 lugares disponibles. LIGADAS PRÁCTICA

ARQUITECTURA DE SISTEMAS	ING SISTEM E INTELIG ARTIFIC	112	J03	0	5039	2026-II (PREGRADO)	CABALLERO ALVARADO, ARMANDO (Principal)
Lunes 19:50 - 21:35
Tipo: Class Edificio: Ninguno Salón: Ninguno
CAMPUS PRINCIPAL TRUJILLO	30 de 30 lugares disponibles. LIGADAS LABORATORIO

CUSTOMER DEVELOPMENT	ING SISTEM E INTELIG ARTIFIC	113	J01	3	5041	2026-II (PREGRADO)	CALDERON SEDANO, JOSE (Principal)
Viernes 07:00 - 08:45
Tipo: Class Edificio: PABELLÓN G Salón: G702
CAMPUS PRINCIPAL TRUJILLO	50 de 50 lugares disponibles. LIGADAS TEORÍA

CUSTOMER DEVELOPMENT	ING SISTEM E INTELIG ARTIFIC	113	J02	0	5042	2026-II (PREGRADO)	CALDERON SEDANO, JOSE (Principal)
Viernes 08:50 - 10:35
Tipo: Class Edificio: PABELLÓN G Salón: G701
CAMPUS PRINCIPAL TRUJILLO	25 de 25 lugares disponibles. LIGADAS LABORATORIO

AUTOMATIZACION INTELIGENTE DE PROCESOS	ING SISTEM E INTELIG ARTIFIC	114	J01	3	6807	2026-II (PREGRADO)	GAYTÁN TOLEDO, CARLOS (Principal)
Miércoles 07:00 - 08:45
Tipo: Class Edificio: PABELLÓN G Salón: G602
CAMPUS PRINCIPAL TRUJILLO	60 de 60 lugares disponibles. LIGADAS TEORÍA

AUTOMATIZACION INTELIGENTE DE PROCESOS	ING SISTEM E INTELIG ARTIFIC	114	J02	0	6808	2026-II (PREGRADO)	URRELO HUIMAN, LUIS (Principal)
Miércoles 08:50 - 10:35
Tipo: Class Edificio: PABELLÓN G Salón: G701
CAMPUS PRINCIPAL TRUJILLO	30 de 30 lugares disponibles. LIGADAS LABORATORIO`;

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
  const [avisoOcr, setAvisoOcr] = useState<string | null>(null);

  const manejarTextoOcr = (t: string) => {
    setTexto(t);
    onAnalizar(t);
  };

  const manejarErrorArchivo = (err: Error) => {
    if (err.message.startsWith("PDF_ESCANADO:")) {
      setAvisoOcr(err.message.replace("PDF_ESCANADO:", "").trim());
      setTab("foto");
    } else {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <Paso
        n={1}
        titulo="Ingresa tu Oferta Académica"
        descripcion="Copia y pega el texto de tu portal universitario, o sube una foto / archivo de tu horario."
      />

      {avisoOcr && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          <span className="font-bold">💡 Notificación de PDF:</span> {avisoOcr}
        </div>
      )}

      {/* Pestañas de Selección de Modo */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-1">
        <button
          type="button"
          onClick={() => setTab("texto")}
          className={`border-b-2 px-5 py-2.5 text-sm font-bold transition-all rounded-t-lg ${
            tab === "texto"
              ? "border-emerald-600 bg-emerald-50/60 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300 font-black"
              : "border-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-white"
          }`}
        >
          📝 Pegar Texto libre
        </button>
        <button
          type="button"
          onClick={() => setTab("archivo")}
          className={`border-b-2 px-5 py-2.5 text-sm font-bold transition-all rounded-t-lg ${
            tab === "archivo"
              ? "border-emerald-600 bg-emerald-50/60 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300 font-black"
              : "border-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-white"
          }`}
        >
          📁 Subir Archivo (PDF, Excel, TXT)
        </button>
      </div>

      {/* Contenido según Tab */}
      {tab === "texto" && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Pegar texto de oferta o portal académico
            </label>
          </div>
          <textarea
            rows={10}
            className="w-full rounded-xl border border-zinc-200 p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            placeholder="Pega aquí los cursos en texto o presiona Ctrl+V con una captura de pantalla..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            suppressHydrationWarning
            onPaste={(e) => {
              const items = e.clipboardData?.items;
              if (items) {
                for (let i = 0; i < items.length; i++) {
                  if (items[i].type.startsWith("image/")) {
                    setTab("foto");
                    break;
                  }
                }
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              📋 Tip: Presiona <kbd className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[10px] dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">Ctrl + V</kbd> para pegar texto o una captura de pantalla en la app.
            </span>
            <Btn disabled={!texto.trim()} onClick={() => onAnalizar()}>
              Analizar Oferta Académica ➔
            </Btn>
          </div>
        </Card>
      )}

      {/* Guía Visual de Copiado */}
      <Card className="space-y-4 border-emerald-100 bg-emerald-50/30 dark:border-emerald-950/60 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
          <span className="text-xl">📖</span>
          <div>
            <h3 className="text-sm font-black tracking-wide text-zinc-900 dark:text-zinc-100 uppercase">
              Guía: Pasos recomendados para copiar la oferta
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Sigue estos 2 sencillos pasos en tu portal para copiar la tabla de asignaturas:
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Paso 1: Paginación en 50 */}
          <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200">
              <span>Paso 1: Ajustar paginación</span>
              <Badge color="amber">1</Badge>
            </div>
            <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950">
              <img
                src="/guia/guia_1.png"
                alt="Ajustar paginación en 50 por página"
                className="h-16 object-contain"
              />
            </div>
            <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 pt-1">
              💡 Recomendación: poner en 50.
            </p>
          </div>

          {/* Paso 2: Control + A y copiar todo el texto (Con letras borrosas) */}
          <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200">
              <span>Paso 2: Copiar todo el texto</span>
              <Badge color="emerald">2</Badge>
            </div>
            <div className="relative h-28 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <img
                src="/guia/guia_2.png"
                alt="Seleccionar y copiar texto con letras borrosas"
                className="h-full w-full object-cover blur-[3.5px] opacity-80 select-none pointer-events-none"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <span className="rounded-lg bg-zinc-900/85 px-3 py-1.5 text-xs font-mono font-black text-white shadow-md border border-white/20">
                  ⌨️ Ctrl + A → Ctrl + C
                </span>
              </div>
            </div>
            <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 pt-1">
              📋 Control + A y copiar todo el texto.
            </p>
          </div>
        </div>
      </Card>



      {tab === "archivo" && (
        <Card>
          <SubirArchivo
            onTexto={(t: string) => {
              setTexto(t);
              onAnalizar(t);
            }}
          />
        </Card>
      )}
    </div>
  );
}
