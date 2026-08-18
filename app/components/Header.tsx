import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { LimpiarDatos } from "./LimpiarDatos";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/85">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="Horatriz Logo"
            className="h-9 w-9 rounded-xl object-cover shadow-xs transition-transform group-hover:scale-105"
          />
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