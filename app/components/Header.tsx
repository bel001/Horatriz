import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { LimpiarDatos } from "./LimpiarDatos";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-lg object-cover"
          />
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight text-slate-950 dark:text-zinc-50">
              Hora<span className="text-emerald-600 dark:text-emerald-400">triz</span>
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Horarios universitarios
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 text-xs text-slate-500 md:inline-flex dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Tus datos permanecen en este dispositivo
          </span>
          <LimpiarDatos />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
