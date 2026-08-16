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
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] dark:focus-visible:ring-offset-zinc-950";
  const variantes = {
    primary:
      "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700",
    secondary:
      "border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white",
    ghost:
      "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white",
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
      className={`rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none min-w-0 max-w-full ${className}`}
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
    zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colores[color]}`}
    >
      {children}
    </span>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
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
    <label className="flex cursor-pointer select-none items-start gap-2 text-sm">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(e) => onChange(e.target.checked)}
        suppressHydrationWarning
        className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-emerald-600 focus:ring-emerald-500 dark:border-zinc-700"
      />
      <span>{label}</span>
    </label>
  );
}

export function inputCls(): string {
  return "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-emerald-900/40";
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
    <div className="mb-6 flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-base font-bold text-white shadow-md shadow-emerald-600/25">
        {n}
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {titulo}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{descripcion}</p>
      </div>
    </div>
  );
}

export function stepper(
  actual: number,
  pasos: string[],
  onSelectPaso?: (index: number) => void
) {
  return (
    <nav aria-label="Navegación de pasos">
      <ol className="mb-8 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {pasos.map((p, i) => {
          const hecho = i < actual;
          const activo = i === actual;
          const esClickeable = Boolean(onSelectPaso);

          return (
            <li key={p} className="flex flex-1 items-center gap-2 min-w-max sm:min-w-0">
              <button
                type="button"
                disabled={!esClickeable}
                onClick={() => onSelectPaso?.(i)}
                className={`flex flex-1 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition-all text-left ${
                  esClickeable ? "cursor-pointer hover:scale-[1.01] active:scale-[0.98]" : ""
                } ${
                  hecho
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                    : activo
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
                }`}
                title={`Ir a la vista: ${p}`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                    hecho
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