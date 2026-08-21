import { describe, expect, it } from "vitest";
import type { Preferencias, Sesion } from "@/lib/model";
import { DEFAULT_PREFERENCIAS } from "@/lib/model";
import { generarHorarios } from "@/lib/generator";
import { agruparEnCursos } from "@/lib/groups";
import { puntuarHorario } from "@/lib/scoring";

function s(
  partial: Partial<Sesion> & { codigo: string; inicio: number; fin: number }
): Sesion {
  return {
    id: `${partial.codigo}-${partial.dia || "LUN"}-${partial.inicio}`,
    codigo: partial.codigo,
    curso: partial.curso || `Curso ${partial.codigo}`,
    tipo: partial.tipo || "T",
    seccion: partial.seccion || "A",
    docente: partial.docente || "DOCENTE",
    aula: partial.aula || "A1",
    dia: partial.dia || "LUN",
    inicio: partial.inicio,
    fin: partial.fin,
    nrc: partial.nrc || "100001",
    liga: partial.liga || "1",
    idLiga: partial.idLiga || "1",
  };
}

const PREF_VACIO: Preferencias = {
  ...DEFAULT_PREFERENCIAS,
  pesoHuecos: 0,
  pesoDiasLibres: 0,
  pesoMadrugada: 0,
  pesoDocentes: 0,
};

describe("generarHorarios", () => {
  it("filtra combinaciones con colisión horaria", () => {
    const sesiones = [
      // Curso A: opción 1 (viernes 16-18) y opción 2 (martes 16-18)
      s({ codigo: "A001", tipo: "T", idLiga: "1", nrc: "100001", dia: "VIE", inicio: 16 * 60, fin: 18 * 60 }),
      s({ codigo: "A001", tipo: "T", idLiga: "2", nrc: "100002", dia: "MAR", inicio: 16 * 60, fin: 18 * 60 }),
      // Curso B: opción 1 (viernes 17-19) choca con A-opt1, opción 2 (martes 15-17) choca con A-opt2
      s({ codigo: "B001", tipo: "T", idLiga: "1", nrc: "200001", dia: "VIE", inicio: 17 * 60, fin: 19 * 60 }),
      s({ codigo: "B001", tipo: "T", idLiga: "2", nrc: "200002", dia: "MAR", inicio: 15 * 60, fin: 17 * 60 }),
    ];
    const { cursos } = agruparEnCursos(sesiones);

    const res = generarHorarios(cursos, PREF_VACIO, { maxResultados: 10 });

    // 2x2 = 4 combinaciones.
    // (A1, B1) choca el VIE 17-18. (A2, B2) choca el MAR 16-17.
    // (A1, B2) ok. (A2, B1) ok.
    expect(res.horarios).toHaveLength(2);
  });

  it("posiciona siempre en la Opción #1 al horario con el docente preferido por curso", () => {
    const sesiones = [
      s({ codigo: "TESIS", curso: "Tesis I", tipo: "T", idLiga: "1", nrc: "5065", docente: "CIEZA MOSTACERO", dia: "JUE", inicio: 14 * 60, fin: 17 * 60 }),
      s({ codigo: "TESIS", curso: "Tesis I", tipo: "T", idLiga: "2", nrc: "5066", docente: "GUTIERREZ GUTIERREZ JORGE LUIS", dia: "JUE", inicio: 18 * 60, fin: 21 * 60 }),
    ];
    const { cursos } = agruparEnCursos(sesiones);
    const prefsConProf: Preferencias = {
      ...PREF_VACIO,
      pesoDocentes: 1,
      docentesPorCurso: {
        TESIS: { T: "GUTIERREZ GUTIERREZ JORGE LUIS" },
      },
    };
    const res = generarHorarios(cursos, prefsConProf);
    expect(res.horarios).toHaveLength(2);
    expect(res.horarios[0].cuadro[0].opcion.docente).toContain("GUTIERREZ GUTIERREZ JORGE LUIS");
  });

  it("permite ligas vacías (no descarta por liga desajustada)", () => {
    const sesiones = [
      s({ codigo: "A001", tipo: "T", idLiga: "", nrc: "100001", dia: "LUN", inicio: 8 * 60, fin: 10 * 60 }),
      s({ codigo: "B001", tipo: "T", idLiga: "", nrc: "200001", dia: "MAR", inicio: 8 * 60, fin: 10 * 60 }),
    ];
    const { cursos } = agruparEnCursos(sesiones);
    const res = generarHorarios(cursos, PREF_VACIO);
    expect(res.horarios).toHaveLength(1);
  });

  it("respeta la opción fijada por el usuario", () => {
    const sesiones = [
      s({ codigo: "A001", tipo: "T", idLiga: "1", nrc: "100001", dia: "LUN", inicio: 8 * 60, fin: 10 * 60 }),
      s({ codigo: "A001", tipo: "T", idLiga: "2", nrc: "100002", dia: "MAR", inicio: 8 * 60, fin: 10 * 60 }),
    ];
    const { cursos } = agruparEnCursos(sesiones);
    const idOpt2 = cursos[0].opciones[1].id;

    const res = generarHorarios(cursos, PREF_VACIO, { fijados: { A001: idOpt2 } });

    expect(res.horarios).toHaveLength(1);
    expect(res.horarios[0].cuadro[0].opcion.id).toBe(idOpt2);
  });

  it("combina correctamente T + P + L ligadas de un mismo curso", () => {
    const sesiones = [
      s({ codigo: "A001", tipo: "T", idLiga: "1", nrc: "100", dia: "LUN", inicio: 8 * 60, fin: 10 * 60 }),
      s({ codigo: "A001", tipo: "P", idLiga: "1", nrc: "101", dia: "LUN", inicio: 10 * 60, fin: 12 * 60 }),
      s({ codigo: "A001", tipo: "T", idLiga: "2", nrc: "102", dia: "MAR", inicio: 8 * 60, fin: 10 * 60 }),
      s({ codigo: "A001", tipo: "P", idLiga: "2", nrc: "103", dia: "MAR", inicio: 10 * 60, fin: 12 * 60 }),
    ];
    const { cursos } = agruparEnCursos(sesiones);
    const res = generarHorarios(cursos, PREF_VACIO);

    expect(res.horarios).toHaveLength(2);
    expect(res.horarios[0].cuadro[0].opcion.sesiones).toHaveLength(2);
  });

  it("aplica la restricción estricta sinDias", () => {
    const sesiones = [
      s({ codigo: "A001", tipo: "T", idLiga: "1", nrc: "100001", dia: "LUN", inicio: 8 * 60, fin: 10 * 60 }),
      s({ codigo: "A001", tipo: "T", idLiga: "2", nrc: "100002", dia: "MAR", inicio: 8 * 60, fin: 10 * 60 }),
    ];
    const { cursos } = agruparEnCursos(sesiones);
    const res = generarHorarios(cursos, {
      ...PREF_VACIO,
      restricciones: { sinDias: ["LUN"], horaMax: 0, maxHorasDia: 0 },
    });
    expect(res.horarios).toHaveLength(1);
    expect(res.horarios[0].cuadro[0].opcion.sesiones[0].dia).toBe("MAR");
  });

  it("aplica la restricción estricta horaMax", () => {
    const sesiones = [
      s({ codigo: "A001", tipo: "T", idLiga: "1", nrc: "100001", dia: "LUN", inicio: 14 * 60, fin: 16 * 60 }),
      s({ codigo: "A001", tipo: "T", idLiga: "2", nrc: "100002", dia: "LUN", inicio: 18 * 60, fin: 20 * 60 }),
    ];
    const { cursos } = agruparEnCursos(sesiones);
    const res = generarHorarios(cursos, {
      ...PREF_VACIO,
      restricciones: { sinDias: [], horaMax: 17 * 60, maxHorasDia: 0 },
    });
    expect(res.horarios).toHaveLength(1);
    expect(res.horarios[0].cuadro[0].opcion.sesiones[0].fin).toBe(16 * 60);
  });

  it("aplica la restricción estricta maxHorasDia", () => {
    const sesiones = [
      // Opción 1: 6 horas el LUN
      s({ codigo: "A001", tipo: "T", idLiga: "1", nrc: "100", dia: "LUN", inicio: 8 * 60, fin: 14 * 60 }),
      // Opción 2: 2 horas el LUN
      s({ codigo: "A001", tipo: "T", idLiga: "2", nrc: "101", dia: "LUN", inicio: 8 * 60, fin: 10 * 60 }),
    ];
    const { cursos } = agruparEnCursos(sesiones);
    const res = generarHorarios(cursos, {
      ...PREF_VACIO,
      restricciones: { sinDias: [], horaMax: 0, maxHorasDia: 4 },
    });
    expect(res.horarios).toHaveLength(1);
  });
});

describe("puntuarHorario", () => {
  it("prioriza horarios sin huecos cuando pesoHuecos es alto", () => {
    const cuadroSinHuecos = [
      { curso: { codigo: "A", nombre: "A", opciones: [] }, opcion: { id: "1", nrc: "", seccion: "", liga: "", sesiones: [s({ codigo: "A", inicio: 7 * 60, fin: 9 * 60 }), s({ codigo: "A", inicio: 9 * 60, fin: 11 * 60, dia: "LUN" })], docente: "", aula: "" } },
    ];
    const cuadroConHueco = [
      { curso: { codigo: "A", nombre: "A", opciones: [] }, opcion: { id: "1", nrc: "", seccion: "", liga: "", sesiones: [s({ codigo: "A", inicio: 7 * 60, fin: 8 * 60 }), s({ codigo: "A", inicio: 12 * 60, fin: 14 * 60, dia: "LUN" })], docente: "", aula: "" } },
    ];
    const prefs: Preferencias = { ...DEFAULT_PREFERENCIAS, pesoHuecos: 1, pesoDiasLibres: 0, pesoMadrugada: 0, pesoDocentes: 0, horaMinimaClase: 0 };
    const a = puntuarHorario(cuadroSinHuecos, prefs).score;
    const b = puntuarHorario(cuadroConHueco, prefs).score;
    expect(a).toBeGreaterThan(b);
  });

  it("bonifica días libres preferidos", () => {
    const sinVieLibre = { curso: { codigo: "A", nombre: "A", opciones: [] }, opcion: { id: "1", nrc: "", seccion: "", liga: "", sesiones: [s({ codigo: "A", inicio: 7 * 60, fin: 9 * 60 }), s({ codigo: "A", inicio: 7 * 60, fin: 9 * 60, dia: "MAR" })], docente: "", aula: "" } };
    const conVieLibre = { curso: { codigo: "A", nombre: "A", opciones: [] }, opcion: { id: "1", nrc: "", seccion: "", liga: "", sesiones: [s({ codigo: "A", inicio: 7 * 60, fin: 9 * 60 }), s({ codigo: "A", inicio: 7 * 60, fin: 9 * 60, dia: "VIE" })], docente: "", aula: "" } };
    const prefs: Preferencias = { ...DEFAULT_PREFERENCIAS, pesoDiasLibres: 1, pesoHuecos: 0, pesoMadrugada: 0, pesoDocentes: 0, horaMinimaClase: 0, diasLibresPreferidos: ["VIE"] };
    const a = puntuarHorario([conVieLibre], prefs).score;
    const b = puntuarHorario([sinVieLibre], prefs).score;
    // conVieLibre: VIE ocupado => 0 libres; sinVieLibre: VIE libre => 1/1
    expect(b).toBeGreaterThanOrEqual(a);
  });

  it("reporta créditos totales del horario", () => {
    const cuadro = {
      curso: { codigo: "A", nombre: "A", opciones: [], creditos: 3 },
      opcion: { id: "1", nrc: "", seccion: "", liga: "", sesiones: [s({ codigo: "A", inicio: 7 * 60, fin: 9 * 60 })], docente: "", aula: "" },
    };
    const prefs = { ...DEFAULT_PREFERENCIAS };
    expect(puntuarHorario([cuadro], prefs).metricas.totalCreditos).toBe(3);
  });

  it("penaliza horarios fuera del rango de créditos objetivo", () => {
    const cuadro = {
      curso: { codigo: "A", nombre: "A", opciones: [], creditos: 6 },
      opcion: { id: "1", nrc: "", seccion: "", liga: "", sesiones: [s({ codigo: "A", inicio: 10 * 60, fin: 12 * 60 })], docente: "", aula: "" },
    };
    const base: Preferencias = { ...DEFAULT_PREFERENCIAS, pesoHuecos: 0, pesoDiasLibres: 0, pesoMadrugada: 0, pesoDocentes: 0, horaMinimaClase: 0 };
    const libre = puntuarHorario([cuadro], base).score;
    const conMin = puntuarHorario([cuadro], { ...base, creditosMin: 8 }).score;
    const conMax = puntuarHorario([cuadro], { ...base, creditosMax: 5 }).score;
    expect(conMin).toBeLessThan(libre);
    expect(conMax).toBeLessThan(libre);
  });

  it("puntúa coincidencia de docente por tipo de clase (Teoría / Práctica / Lab)", () => {
    const base = {
      curso: { codigo: "A", nombre: "Curso A", opciones: [] },
      opcion: {
        id: "1",
        nrc: "100",
        seccion: "A",
        liga: "1",
        sesiones: [
          s({ codigo: "A", curso: "Curso A", tipo: "T", docente: "JUAN PEREZ", inicio: 8 * 60, fin: 10 * 60 }),
          s({ codigo: "A", curso: "Curso A", tipo: "P", docente: "MARIA LOPEZ", inicio: 10 * 60, fin: 12 * 60 }),
        ],
        docente: "JUAN PEREZ",
        aula: "A1",
      },
    };
    const conLopez = base;
    const sinLopez = JSON.parse(JSON.stringify(base)) as typeof base;
    sinLopez.opcion.sesiones[1] = s({ codigo: "A", curso: "Curso A", tipo: "P", docente: "OTRO PROF", inicio: 10 * 60, fin: 12 * 60 });
    const prefs: Preferencias = {
      ...DEFAULT_PREFERENCIAS,
      pesoDocentes: 1,
      pesoHuecos: 0,
      pesoDiasLibres: 0,
      pesoMadrugada: 0,
      horaMinimaClase: 0,
      docentesPorCurso: { A: { P: "MARIA LOPEZ" } },
    };
    const a = puntuarHorario([conLopez], prefs).score;
    const b = puntuarHorario([sinLopez], prefs).score;
    expect(a).toBeGreaterThan(b);
  });

  it("la coincidencia de profesor respeta el grupo (T/P/L del mismo grupo)", () => {
    const basePrefs: Preferencias = {
      ...DEFAULT_PREFERENCIAS,
      pesoDocentes: 1,
      pesoHuecos: 0,
      pesoDiasLibres: 0,
      pesoMadrugada: 0,
      horaMinimaClase: 0,
    };
    const cuadroGrupo1 = [
      {
        curso: { codigo: "A", nombre: "Curso A", opciones: [] },
        opcion: {
          id: "g1",
          nrc: "100001/100002",
          seccion: "A",
          liga: "1",
          sesiones: [
            s({ codigo: "A", tipo: "T", docente: "PEDRO SANCHEZ", nrc: "100001", idLiga: "1", inicio: 8 * 60, fin: 10 * 60 }),
            s({ codigo: "A", tipo: "P", docente: "ANA TORRES", nrc: "100002", idLiga: "1", inicio: 10 * 60, fin: 12 * 60 }),
          ],
          docente: "PEDRO SANCHEZ",
          aula: "A1",
        },
      },
    ];
    const p1 = puntuarHorario(cuadroGrupo1, {
      ...basePrefs,
      docentesPorCurso: { A: { T: "PEDRO SANCHEZ", P: "ANA TORRES" } },
    }).score;

    expect(p1).toBeGreaterThan(50);
  });

  it("respeta estrictamente las restricciones del usuario y devuelve 0 resultados para mostrar la tarjeta explicativa si nada coincide", () => {
    const sesiones = [
      s({ codigo: "A", curso: "Curso A", tipo: "T", dia: "VIE", inicio: 7 * 60, fin: 9 * 60, esLleno: true }),
    ];
    const { cursos } = agruparEnCursos(sesiones);

    const prefsEstrictas: Preferencias = {
      ...DEFAULT_PREFERENCIAS,
      horaMinimaClase: 8 * 60,
      diasLibresPreferidos: ["VIE"],
      restricciones: {
        ...DEFAULT_PREFERENCIAS.restricciones,
        sinTurnosLlenos: true,
        sinDias: ["VIE"],
      },
    };

    const res = generarHorarios(cursos, prefsEstrictas);

    expect(res.horarios.length).toBe(0);
  });
});