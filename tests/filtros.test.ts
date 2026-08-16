import { describe, expect, it } from "vitest";
import { filtrarHorarios } from "@/lib/filtros";
import type { Curso, HorarioResult, Opcion, Sesion } from "@/lib/model";

function sesion(p: Partial<Sesion>): Sesion {
  return {
    id: "s",
    curso: "Curso",
    codigo: "C1",
    nrc: "1",
    seccion: "A",
    tipo: "T",
    liga: "",
    idLiga: "",
    dia: "LUN",
    inicio: 7 * 60,
    fin: 8 * 60,
    aula: "A-1",
    docente: "Doc",
    ...p,
  };
}

function horario(over: Partial<HorarioResult>): HorarioResult {
  const curso: Curso = { codigo: "C1", nombre: "Curso C1", opciones: [], creditos: 3 };
  const s = sesion({ curso: curso.nombre });
  const opcion: Opcion = {
    id: "o1",
    nrc: "1",
    seccion: "A",
    liga: "",
    sesiones: [s],
    docente: "Doc",
    aula: "A-1",
  };
  return {
    cuadro: [{ curso, opcion }],
    nombre: "X",
    score: 80,
    totalMinutos: 60,
    minutosHuecos: 0,
    diasConClase: ["LUN"],
    sesiones: [s],
    totalCreditos: 3,
    docentesRepetidos: [],
    ...over,
  };
}

describe("filtrarHorarios", () => {
  it("filtra por huecos", () => {
    const hs = [horario({ minutosHuecos: 30 }), horario({ minutosHuecos: 0 })];
    const res = filtrarHorarios(hs, {
      sinHuecos: true,
      diaLibre: false,
      creditosMin: 0,
      horaMax: 0,
    });
    expect(res).toHaveLength(1);
    expect(res[0].minutosHuecos).toBe(0);
  });

  it("filtra por día libre (no todos los días con clase)", () => {
    const hs = [
      horario({
        diasConClase: ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"],
      }),
      horario({ diasConClase: ["LUN", "MAR"] }),
    ];
    const res = filtrarHorarios(hs, {
      sinHuecos: false,
      diaLibre: true,
      creditosMin: 0,
      horaMax: 0,
    });
    expect(res).toHaveLength(1);
    expect(res[0].diasConClase).toHaveLength(2);
  });

  it("filtra por créditos mínimos", () => {
    const hs = [horario({ totalCreditos: 3 }), horario({ totalCreditos: 6 })];
    const res = filtrarHorarios(hs, {
      sinHuecos: false,
      diaLibre: false,
      creditosMin: 5,
      horaMax: 0,
    });
    expect(res).toHaveLength(1);
    expect(res[0].totalCreditos).toBe(6);
  });

  it("filtra por hora máxima de salida", () => {
    const hs = [
      horario({ sesiones: [sesion({ inicio: 14 * 60, fin: 16 * 60 })] }),
      horario({
        sesiones: [sesion({ inicio: 18 * 60, fin: 20 * 60 })],
        totalMinutos: 120,
      }),
    ];
    const res = filtrarHorarios(hs, {
      sinHuecos: false,
      diaLibre: false,
      creditosMin: 0,
      horaMax: 19 * 60,
    });
    expect(res).toHaveLength(1);
  });
});
