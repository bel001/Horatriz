import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { LimpiarDatos } from "./LimpiarDatos";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/75 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/70">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/25">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <rect x="3" y="4" width="18" height="17" rx="2.5" />
              <path d="M8 2v4M16 2v4M3 9h18M7 14l2 2 3.5-4" />
            </svg>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              Hora<span className="text-emerald-600 dark:text-emerald-400">triz</span>
            </span>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Tu horario ideal, optimizado
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:inline-flex dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
            Beta · Procesamiento local
          </span>
          <LimpiarDatos />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}