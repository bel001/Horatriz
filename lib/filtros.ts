import type { HorarioResult } from "./model";

export interface FiltrosHorario {
  sinHuecos: boolean;
  diaLibre: boolean;
  creditosMin: number;
  horaMax: number;
}

export const FILTROS_INICIALES: FiltrosHorario = {
  sinHuecos: false,
  diaLibre: false,
  creditosMin: 0,
  horaMax: 0,
};

export function filtrarHorarios(
  horarios: HorarioResult[],
  filtros: FiltrosHorario
): HorarioResult[] {
  return horarios.filter((h) => {
    if (filtros.sinHuecos && h.minutosHuecos > 0) return false;
    if (filtros.diaLibre && h.diasConClase.length >= DIAS_TOTAL) return false;
    if (filtros.creditosMin > 0 && h.totalCreditos < filtros.creditosMin) return false;
    if (filtros.horaMax > 0) {
      const finMax = Math.max(...h.sesiones.map((s) => s.fin));
      if (finMax > filtros.horaMax) return false;
    }
    return true;
  });
}

const DIAS_TOTAL = 7;
