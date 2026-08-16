"use client";

import { borrarEstado } from "@/lib/estado";

export function LimpiarDatos() {
  return (
    <button
      type="button"
      title="Borrar todos los datos guardados"
      aria-label="Borrar todos los datos guardados"
      onClick={() => {
        if (window.confirm("¿Borrar todos los datos guardados?")) {
          borrarEstado();
          window.location.hash = "";
          window.location.reload();
        }
      }}
      className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4.5 w-4.5"
      >
        <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
      </svg>
    </button>
  );
}
