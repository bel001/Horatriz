import type { ReactNode } from "react";

export function Btn({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] dark:focus-visible:ring-offset-zinc-950";
  const variantes = {
    primary:
      "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:bg-emerald-800",
    secondary:
      "border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white",
    ghost:
      "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled ? true : undefined}
      suppressHydrationWarning
      title={title}
      className={`${base} ${variantes[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-zinc-800/90 dark:bg-zinc-900 min-w-0 max-w-full ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  color = "zinc",
}: {
  children: ReactNode;
  color?: "zinc" | "emerald" | "amber" | "rose" | "sky";
}) {
  const colores = {
    zinc: "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    emerald:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900",
    amber:
      "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900",
    rose: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900",
    sky: "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${colores[color]}`}
    >
      {children}
    </span>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
      {children}
    </label>
  );
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-emerald-600"
    />
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer select-none items-start gap-2 text-sm text-slate-800 dark:text-zinc-200 font-medium">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(e) => onChange(e.target.checked)}
        suppressHydrationWarning
        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-emerald-600 focus:ring-emerald-500 dark:border-zinc-700"
      />
      <span>{label}</span>
    </label>
  );
}

export function inputCls(): string {
  return "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-emerald-900/40";
}

export function Paso({
  titulo,
  descripcion,
  n,
}: {
  titulo: string;
  descripcion: string;
  n: number;
}) {
  return (
    <div className="mb-6 flex items-start gap-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-black text-white shadow-xs">
        {n}
      </div>
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-zinc-50">
          {titulo}
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">{descripcion}</p>
      </div>
    </div>
  );
}

export function stepper(
  actual: number,
  pasos: string[],
  onSelectPaso?: (index: number) => void,
  disabledPasos?: Set<number>
) {
  return (
    <nav aria-label="Navegación de pasos">
      <ol className="mb-8 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {pasos.map((p, i) => {
          const hecho = i < actual;
          const activo = i === actual;
          const esClickeable = Boolean(onSelectPaso) && !disabledPasos?.has(i);

          return (
            <li key={p} className="flex flex-1 items-center gap-2 min-w-max sm:min-w-0">
              <button
                type="button"
                disabled={!esClickeable}
                onClick={() => onSelectPaso?.(i)}
                className={`flex flex-1 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition-all text-left ${
                  esClickeable ? "cursor-pointer hover:scale-[1.01] active:scale-[0.98]" : ""
                } ${
                  disabledPasos?.has(i)
                    ? "border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600"
                    : hecho
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                      : activo
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                        : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
                }`}
                title={disabledPasos?.has(i) ? `Completa los pasos anteriores primero` : `Ir a la vista: ${p}`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                    disabledPasos?.has(i)
                      ? "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                      : hecho
                        ? "bg-emerald-600 text-white"
                        : activo
                          ? "bg-white/25 text-white"
                          : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                  }`}
                >
                  {hecho ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="whitespace-nowrap truncate">{p}</span>
              </button>
              {i < pasos.length - 1 && (
                <span
                  className={`h-px flex-1 hidden sm:block ${
                    i < actual
                      ? "bg-emerald-500"
                      : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}