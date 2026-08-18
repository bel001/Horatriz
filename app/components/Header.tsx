import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { LimpiarDatos } from "./LimpiarDatos";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/85">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs transition-transform group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path d="M8 2v4M16 2v4M3 9h18M7 14l2 2 3.5-4" />
            </svg>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-black tracking-tight text-slate-900 dark:text-zinc-50">
              Hora<span className="text-emerald-600 dark:text-emerald-400">triz</span>
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Tu horario universitario ideal
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-[11px] font-bold text-emerald-700 sm:inline-flex dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            🎓 100% Gratis para Estudiantes
          </span>
          <LimpiarDatos />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}