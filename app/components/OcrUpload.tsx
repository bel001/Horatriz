"use client";

import { useEffect, useRef, useState } from "react";
import { OCR_DESCARGA_MENSAJES, limpiarTextoOcr } from "@/lib/ocr";
import { Btn, Card } from "./ui";

type Estado = "idle" | "cargando" | "procesando" | "error";

const MAX_DIMENSION = 2400;

async function preprocesarImagen(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("No se pudo leer la imagen"));
      el.src = url;
    });
    const escala = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * escala));
    const h = Math.max(1, Math.round(img.height * escala));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const datos = ctx.getImageData(0, 0, w, h);
    const d = datos.data;
    const contraste = 1.35;
    const bias = 128 * (1 - contraste);
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const v = g * contraste + bias;
      d[i] = d[i + 1] = d[i + 2] = Math.min(255, Math.max(0, v));
    }
    ctx.putImageData(datos, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function OcrUpload({ onTexto }: { onTexto: (texto: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado>("idle");
  const [progreso, setProgreso] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  const manejarArchivo = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen (JPG, PNG, WebP).");
      return;
    }
    setError("");
    setPreview(URL.createObjectURL(file));
    setEstado("cargando");
    setProgreso(0);
    setMensaje("Preparando…");

    try {
      const T = await import("tesseract.js");
      const worker = await T.createWorker("spa", T.OEM.DEFAULT, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setEstado("procesando");
          setProgreso(m.progress);
          setMensaje(OCR_DESCARGA_MENSAJES[m.status] ?? m.status);
        },
      });
      try {
        const canvas = await preprocesarImagen(file);
        const { data } = await worker.recognize(canvas);
        onTexto(limpiarTextoOcr(data.text));
      } finally {
        await worker.terminate();
      }
    } catch (err) {
      console.error(err);
      setError(
        "Ocurrió un error durante el OCR. Verifica la conexión (la primera vez descarga el modelo de español) e inténtalo de nuevo."
      );
      setEstado("error");
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            void manejarArchivo(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          1. Sube una foto de tu oferta académica
        </h2>
        <span className="text-xs text-zinc-400">JPG, PNG o WebP</span>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) void manejarArchivo(f);
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-zinc-700 dark:bg-zinc-950/50 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/30"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void manejarArchivo(f);
          }}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Vista previa"
            className="max-h-44 rounded-lg object-contain shadow-sm"
          />
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-zinc-400 dark:text-zinc-500">
              <rect x="3" y="3" width="18" height="18" rx="2.5" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
            </svg>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Arrastra tu foto aquí o{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                selecciona un archivo
              </span>
            </p>
            <p className="text-xs text-zinc-400">
              Se procesa en tu navegador, no se sube a ningún servidor.
            </p>
          </>
        )}
      </div>

      {(estado === "cargando" || estado === "procesando") && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>{mensaje}</span>
            <span>{Math.round(progreso * 100)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-200"
              style={{ width: `${Math.max(4, Math.round(progreso * 100))}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
          <div className="mt-2">
            <Btn variant="secondary" onClick={() => setError("")}>
              Entendido
            </Btn>
          </div>
        </div>
      )}

      {(estado === "cargando" || estado === "procesando") && (
        <p className="mt-3 text-xs text-zinc-400">
          La primera vez puede tardar al descargar el modelo OCR (~15 MB).
        </p>
      )}
    </Card>
  );
}