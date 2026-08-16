"use client";

import { useRef, useState } from "react";
import { leerArchivoComoTexto } from "@/lib/lectorArchivos";
import { Btn, Card } from "./ui";

type Estado = "idle" | "cargando" | "error";

const ACEPTADOS = ".txt,.csv,.xlsx,.xls,.pdf";

export function SubirArchivo({ onTexto }: { onTexto: (texto: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado>("idle");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");

  const manejarArchivo = async (file: File) => {
    if (!file) return;
    setError("");
    setNombre(file.name);
    setEstado("cargando");
    try {
      const texto = await leerArchivoComoTexto(file);
      onTexto(texto);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo leer el archivo. Verifica que el formato sea válido."
      );
      setEstado("error");
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          1. Sube tu archivo de oferta académica
        </h2>
        <span className="text-xs text-zinc-400">TXT · CSV · XLSX · XLS · PDF</span>
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
          accept={ACEPTADOS}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void manejarArchivo(f);
          }}
        />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-zinc-400 dark:text-zinc-500">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M9 13h6M9 17h4" />
        </svg>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Arrastra tu archivo aquí o{" "}
          <span className="text-emerald-600 dark:text-emerald-400">
            selecciona un archivo
          </span>
        </p>
        <p className="text-xs text-zinc-400">
          Se procesa en tu navegador, no se sube a ningún servidor.
        </p>
      </div>

      {estado === "cargando" && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin text-emerald-600" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-6.2-8.56" />
          </svg>
          <span>
            Leyendo <span className="font-medium">{nombre}</span>…
          </span>
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
    </Card>
  );
}