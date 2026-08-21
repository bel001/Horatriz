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