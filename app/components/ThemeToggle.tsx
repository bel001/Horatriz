"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [tema, setTema] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setTema(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const alternar = () => {
    const next = tema === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("horatriz-theme", next);
    setTema(next);
  };

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Cambiar tema claro u oscuro"
      title={tema === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      {tema === "dark" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}