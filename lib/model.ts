export const DIAS = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"] as const;
export type Dia = (typeof DIAS)[number];

export type Tipo = "T" | "P" | "L";

export const TIPO_LABEL: Record<Tipo, string> = {
  T: "Teoría",
  P: "Práctica",
  L: "Laboratorio",
};

export const DIA_LABEL: Record<Dia, string> = {
  LUN: "Lunes",
  MAR: "Martes",
  MIE: "Miércoles",
  JUE: "Jueves",
  VIE: "Viernes",
  SAB: "Sábado",
  DOM: "Domingo",
};

export interface Sesion {
  id: string;
  curso: string;
  codigo: string;
  nrc: string;
  seccion: string;
  tipo: Tipo;
  liga: string;
  idLiga: string;
  dia: Dia;
  inicio: number;
  fin: number;
  aula: string;
  docente: string;
  creditos?: number;
  esLleno?: boolean;
  esVirtual?: boolean;
}

export interface Opcion {
  id: string;
  nrc: string;
  seccion: string;
  liga: string;
  sesiones: Sesion[];
  docente: string;
  aula: string;
  esLleno?: boolean;
  esVirtual?: boolean;
}

export interface Curso {
  codigo: string;
  nombre: string;
  opciones: Opcion[];
  creditos?: number;
}

export interface FilaParseada {
  id: string;
  curso: string;
  codigo: string;
  nrc: string;
  seccion: string;
  tipo: Tipo | "";
  liga: string;
  idLiga: string;
  dia: Dia | "";
  inicio: number | null;
  fin: number | null;
  aula: string;
  docente: string;
  confianza: number;
  ignorada: boolean;
  creditos?: number;
  esLleno?: boolean;
  esVirtual?: boolean;
}

export interface BloquePersonal {
  id: string;
  titulo: string;
  dia: Dia;
  inicio: number;
  fin: number;
}

export interface Restricciones {
  sinDias: Dia[];
  horaMax: number;
  maxHorasDia: number;
  bloquesPersonales?: BloquePersonal[];
  sinTurnosLlenos?: boolean;
}

export const SIN_RESTRICCIONES: Restricciones = {
  sinDias: [],
  horaMax: 0,
  maxHorasDia: 0,
  bloquesPersonales: [],
  sinTurnosLlenos: false,
};

export interface Preferencias {
  pesoHuecos: number;
  pesoDiasLibres: number;
  diasLibresPreferidos: Dia[];
  pesoMadrugada: number;
  horaMinimaClase: number;
  pesoDocentes: number;
  docentesPreferidos: string[];
  creditosMin: number;
  creditosMax: number;
  restricciones: Restricciones;
  docentesPorCurso: Record<string, Partial<Record<Tipo, string>>>;
  perfilAcademico?: "compacto" | "equilibrado" | "finde" | null;
}

export const DEFAULT_PREFERENCIAS: Preferencias = {
  pesoHuecos: 0.4,
  pesoDiasLibres: 0.25,
  diasLibresPreferidos: ["VIE", "SAB"],
  pesoMadrugada: 0.15,
  horaMinimaClase: 8 * 60,
  pesoDocentes: 0.2,
  docentesPreferidos: [],
  creditosMin: 0,
  creditosMax: 0,
  restricciones: { ...SIN_RESTRICCIONES },
  docentesPorCurso: {},
};

export interface Horario {
  curso: Curso;
  opcion: Opcion;
}

export interface HorarioResult {
  cuadro: Horario[];
  nombre: string;
  score: number;
  totalMinutos: number;
  minutosHuecos: number;
  diasConClase: Dia[];
  sesiones: Sesion[];
  totalCreditos: number;
  docentesRepetidos: { docente: string; cursos: string[]; dias: Dia[] }[];
  advertencias?: string[];
}

export interface ResultadoGeneracion {
  horarios: HorarioResult[];
  considerados: number;
  podados: number;
  limite: boolean;
  tiempoMs: number;
  flexibilizado?: boolean;
  restriccionesRelajadas?: string[];
}

export const SCORE_UMBRALES = {
  elite: 85,
  solido: 65,
  ajustable: 45,
} as const;

export type ScoreTier = "elite" | "solido" | "ajustable" | "base";

export function tierDeScore(score: number): ScoreTier {
  if (score >= SCORE_UMBRALES.elite) return "elite";
  if (score >= SCORE_UMBRALES.solido) return "solido";
  if (score >= SCORE_UMBRALES.ajustable) return "ajustable";
  return "base";
}

export const SCORE_META: Record<ScoreTier, { label: string; icon: string; colorCls: string; gradient: string; badgeColor: "emerald" | "sky" | "amber" | "rose"; stop0: string; stop1: string }> = {
  elite: { label: "Élite", icon: "✨", colorCls: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-500 to-teal-500", badgeColor: "emerald", stop0: "#10b981", stop1: "#14b8a6" },
  solido: { label: "Sólido", icon: "🔥", colorCls: "text-sky-600 dark:text-sky-400", gradient: "from-sky-500 to-indigo-500", badgeColor: "sky", stop0: "#0ea5e9", stop1: "#6366f1" },
  ajustable: { label: "Ajustable", icon: "⚡", colorCls: "text-amber-600 dark:text-amber-400", gradient: "from-amber-500 to-orange-500", badgeColor: "amber", stop0: "#f59e0b", stop1: "#f97316" },
  base: { label: "Base", icon: "🧩", colorCls: "text-rose-600 dark:text-rose-400", gradient: "from-rose-500 to-pink-500", badgeColor: "rose", stop0: "#f43f5e", stop1: "#ec4899" },
};

export function metaDeScore(score: number) {
  return SCORE_META[tierDeScore(score)];
}

export const HORARIO_RANGO = {
  min: 6 * 60,
  max: 22 * 60,
  get span() {
    return this.max - this.min;
  },
} as const;