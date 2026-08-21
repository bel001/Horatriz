import { describe, expect, it } from "vitest";
import {
  agruparEnCursos,
  gruposDeCurso,
  numeroDeGrupo,
  profesDeGrupoCompatibles,
} from "@/lib/groups";
import type { Sesion } from "@/lib/model";

function sesion(parcial: Partial<Sesion>): Sesion {
  return {
    id: `s-${Math.random().toString(36).slice(2)}`,
    curso: parcial.curso ?? "",
    codigo: parcial.codigo ?? "",
    nrc: parcial.nrc ?? "",
    seccion: parcial.seccion ?? "A",
    tipo: parcial.tipo ?? "T",
    liga: parcial.liga ?? "",
    idLiga: parcial.idLiga ?? "",
    dia: parcial.dia ?? "LUN",
    inicio: parcial.inicio ?? 7 * 60,
    fin: parcial.fin ?? 9 * 60,
    aula: parcial.aula ?? "A-301",
    docente: parcial.docente ?? "JUAN PEREZ",
  };
}

describe("agruparEnCursos", () => {
  it("agrupa T+P+L por ID LIGA en una sola opción", () => {
    const sesiones = [
      sesion({ codigo: "CEMP113", curso: "Cálculo I", tipo: "T", idLiga: "1001", nrc: "80123" }),
      sesion({ codigo: "CEMP113", curso: "Cálculo I", tipo: "P", idLiga: "1001", nrc: "80124", dia: "MAR" }),
      sesion({ codigo: "CEMP113", curso: "Cálculo I", tipo: "L", idLiga: "1001", nrc: "80125", dia: "JUE" }),
    ];
    const { cursos, opcionesSinLiga } = agruparEnCursos(sesiones);
    expect(cursos).toHaveLength(1);
    expect(cursos[0].opciones).toHaveLength(1);
    expect(cursos[0].opciones[0].sesiones).toHaveLength(3);
    expect(opcionesSinLiga).toBe(0);
  });

  it("agrupa correctamente T1, P1, L1 en la misma liga (ejemplo GEST PROYECT SIST DE INFORMAC)", () => {
    const sesiones = [
      sesion({ codigo: "ICSI-678", curso: "GEST PROYECT SIST DE INFORMAC", tipo: "T", idLiga: "T1", liga: "P1 L1", nrc: "5054", dia: "LUN" }),
      sesion({ codigo: "ICSI-678", curso: "GEST PROYECT SIST DE INFORMAC", tipo: "P", idLiga: "P1", liga: "T1 L1", nrc: "5055", dia: "LUN" }),
      sesion({ codigo: "ICSI-678", curso: "GEST PROYECT SIST DE INFORMAC", tipo: "L", idLiga: "L1", liga: "T1 P1", nrc: "5056", dia: "LUN" }),
      sesion({ codigo: "ICSI-678", curso: "GEST PROYECT SIST DE INFORMAC", tipo: "L", idLiga: "L1", liga: "T1 P1", nrc: "9763", dia: "MAR" }),
      sesion({ codigo: "ICSI-678", curso: "GEST PROYECT SIST DE INFORMAC", tipo: "T", idLiga: "T2", liga: "P2 L2", nrc: "9764", dia: "MAR" }),
      sesion({ codigo: "ICSI-678", curso: "GEST PROYECT SIST DE INFORMAC", tipo: "P", idLiga: "P2", liga: "T2 L2", nrc: "9765", dia: "MAR" }),
      sesion({ codigo: "ICSI-678", curso: "GEST PROYECT SIST DE INFORMAC", tipo: "L", idLiga: "L2", liga: "T2 P2", nrc: "9766", dia: "MAR" }),
    ];
    const { cursos } = agruparEnCursos(sesiones);
    expect(cursos).toHaveLength(1);
    expect(cursos[0].opciones).toHaveLength(3);
    for (const opt of cursos[0].opciones) {
      const tipos = opt.sesiones.map((s) => s.tipo);
      expect(tipos).toContain("T");
      expect(tipos).toContain("P");
      expect(tipos).toContain("L");
    }
  });

  it("agrupa ceros iniciales (T01, P01, L01) y letras (TA, PA, LA) universalmente", () => {
    const sesionesZero = [
      sesion({ codigo: "MED-101", tipo: "T", idLiga: "T01", nrc: "101" }),
      sesion({ codigo: "MED-101", tipo: "P", idLiga: "P01", nrc: "102" }),
    ];
    const resZero = agruparEnCursos(sesionesZero);
    expect(resZero.cursos[0].opciones).toHaveLength(1);
    expect(resZero.cursos[0].opciones[0].sesiones).toHaveLength(2);

    const sesionesLetra = [
      sesion({ codigo: "DER-202", tipo: "T", idLiga: "TA", nrc: "201" }),
      sesion({ codigo: "DER-202", tipo: "P", idLiga: "PA", nrc: "202" }),
    ];
    const resLetra = agruparEnCursos(sesionesLetra);
    expect(resLetra.cursos[0].opciones).toHaveLength(1);
    expect(resLetra.cursos[0].opciones[0].sesiones).toHaveLength(2);
  });

  it("crea dos opciones cuando hay dos ID LIGA distintos", () => {
    const sesiones = [
      sesion({ codigo: "CEMP113", tipo: "T", idLiga: "1001", nrc: "80123", dia: "LUN" }),
      sesion({ codigo: "CEMP113", tipo: "P", idLiga: "1001", nrc: "80124", dia: "MAR" }),
      sesion({ codigo: "CEMP113", tipo: "T", idLiga: "1002", nrc: "80130", dia: "MIE" }),
      sesion({ codigo: "CEMP113", tipo: "P", idLiga: "1002", nrc: "80131", dia: "JUE" }),
    ];
    const { cursos } = agruparEnCursos(sesiones);
    expect(cursos[0].opciones).toHaveLength(2);
  });

  it("sin liga agrupa por NRC y contabiliza opcionesSinLiga", () => {
    const sesiones = [
      sesion({ codigo: "FISI001", tipo: "T", nrc: "80150", dia: "LUN" }),
      sesion({ codigo: "FISI001", tipo: "T", nrc: "80151", dia: "MAR" }),
    ];
    const { cursos, opcionesSinLiga } = agruparEnCursos(sesiones);
    expect(cursos[0].opciones).toHaveLength(2);
    expect(opcionesSinLiga).toBe(2);
  });

  it("fusiona bloques del mismo día en la misma opción", () => {
    const sesiones = [
      sesion({ codigo: "CEMP113", tipo: "P", idLiga: "1001", nrc: "80124", dia: "MAR", inicio: 7 * 60, fin: 9 * 60 }),
      sesion({ codigo: "CEMP113", tipo: "P", idLiga: "1001", nrc: "80124", dia: "JUE", inicio: 7 * 60, fin: 9 * 60 }),
    ];
    const { cursos } = agruparEnCursos(sesiones);
    expect(cursos[0].opciones[0].sesiones).toHaveLength(2);
  });

  it("nunca mezcla grupos: cada opción pertenece a un solo grupo", () => {
    const sesiones = [
      sesion({ codigo: "CEMP113", tipo: "T", idLiga: "1001", liga: "6T/6P", nrc: "80123", dia: "LUN" }),
      sesion({ codigo: "CEMP113", tipo: "P", idLiga: "1001", liga: "6P/6T", nrc: "80124", dia: "MAR" }),
      sesion({ codigo: "CEMP113", tipo: "L", idLiga: "1001", liga: "6P/6T", nrc: "80125", dia: "JUE" }),
      sesion({ codigo: "CEMP113", tipo: "T", idLiga: "1002", liga: "6T/6P", nrc: "80130", dia: "MIE" }),
      sesion({ codigo: "CEMP113", tipo: "P", idLiga: "1002", liga: "6P/6T", nrc: "80131", dia: "JUE" }),
    ];
    const { cursos } = agruparEnCursos(sesiones);
    const opcion = cursos[0].opciones[0];
    const grupos = new Set(opcion.sesiones.map((s) => s.idLiga));
    expect(grupos.size).toBe(1);
    for (const o of cursos[0].opciones) {
      const gs = new Set(o.sesiones.map((s) => s.idLiga));
      expect(gs.size).toBe(1);
    }
  });

  it("gruposDeCurso agrupa profesores por tipo y por grupo", () => {
    const sesiones = [
      sesion({ codigo: "CEMP113", tipo: "T", idLiga: "1001", docente: "JUAN PEREZ" }),
      sesion({ codigo: "CEMP113", tipo: "P", idLiga: "1001", docente: "JUAN PEREZ", dia: "MAR" }),
      sesion({ codigo: "CEMP113", tipo: "L", idLiga: "1001", docente: "MARIA LOPEZ", dia: "JUE" }),
      sesion({ codigo: "CEMP113", tipo: "T", idLiga: "1002", docente: "CARLOS RUIZ", dia: "MIE" }),
      sesion({ codigo: "CEMP113", tipo: "P", idLiga: "1002", docente: "CARLOS RUIZ", dia: "JUE" }),
      sesion({ codigo: "CEMP113", tipo: "L", idLiga: "1002", docente: "MARIA LOPEZ", dia: "VIE" }),
    ];
    const { cursos } = agruparEnCursos(sesiones);
    const grupos = gruposDeCurso(cursos[0]);
    expect(grupos).toHaveLength(2);
    expect(grupos[0].profs.T).toEqual(["JUAN PEREZ"]);
    expect(grupos[0].profs.P).toEqual(["JUAN PEREZ"]);
    expect(grupos[0].profs.L).toEqual(["MARIA LOPEZ"]);
    expect(grupos[1].profs.T).toEqual(["CARLOS RUIZ"]);
    expect(grupos[1].profs.L).toEqual(["MARIA LOPEZ"]);
  });

  it("filtra profesores compatibles del mismo grupo (T1→L1, no L2)", () => {
    const sesiones = [
      sesion({ codigo: "CEMP113", tipo: "T", idLiga: "1", docente: "JUAN PEREZ" }),
      sesion({ codigo: "CEMP113", tipo: "P", idLiga: "1", docente: "ANA FLORES", dia: "MAR" }),
      sesion({ codigo: "CEMP113", tipo: "L", idLiga: "1", docente: "MARIA LOPEZ", dia: "JUE" }),
      sesion({ codigo: "CEMP113", tipo: "T", idLiga: "2", docente: "CARLOS RUIZ", dia: "MIE" }),
      sesion({ codigo: "CEMP113", tipo: "P", idLiga: "2", docente: "JORGE VEGA", dia: "JUE" }),
      sesion({ codigo: "CEMP113", tipo: "L", idLiga: "2", docente: "ROSA MARTINEZ", dia: "VIE" }),
    ];
    const { cursos } = agruparEnCursos(sesiones);
    const grupos = gruposDeCurso(cursos[0]);

    // Sin selección previa: muestra todos los profesores de cada tipo.
    expect(profesDeGrupoCompatibles(grupos, {}, "L")).toEqual([
      "MARIA LOPEZ",
      "ROSA MARTINEZ",
    ]);

    // Elijo T1 (JUAN PEREZ): L solo ofrece los laboratorios del grupo 1.
    expect(
      profesDeGrupoCompatibles(grupos, { T: "JUAN PEREZ" }, "L")
    ).toEqual(["MARIA LOPEZ"]);

    // Igual para práctica y para el otro grupo.
    expect(
      profesDeGrupoCompatibles(grupos, { T: "JUAN PEREZ" }, "P")
    ).toEqual(["ANA FLORES"]);
    expect(
      profesDeGrupoCompatibles(grupos, { T: "CARLOS RUIZ" }, "L")
    ).toEqual(["ROSA MARTINEZ"]);

    // T y P del grupo 1 fijados: L sigue siendo solo el del grupo 1.
    expect(
      profesDeGrupoCompatibles(grupos, { T: "JUAN PEREZ", P: "ANA FLORES" }, "L")
    ).toEqual(["MARIA LOPEZ"]);

    // Elecciones de grupos distintos no dejan laboratorio compatible.
    expect(
      profesDeGrupoCompatibles(grupos, { T: "JUAN PEREZ", P: "JORGE VEGA" }, "L")
    ).toEqual([]);
  });

  it("numeroDeGrupo identifica T1/P1/L1 vs T2/P2/L2", () => {
    const sesiones = [
      sesion({ codigo: "CEMP113", tipo: "T", idLiga: "1", nrc: "100001", docente: "JUAN PEREZ" }),
      sesion({ codigo: "CEMP113", tipo: "P", idLiga: "1", nrc: "100002", docente: "ANA FLORES", dia: "MAR" }),
      sesion({ codigo: "CEMP113", tipo: "L", idLiga: "1", nrc: "100003", docente: "MARIA LOPEZ", dia: "JUE" }),
      sesion({ codigo: "CEMP113", tipo: "T", idLiga: "2", nrc: "100004", docente: "CARLOS RUIZ", dia: "MIE" }),
      sesion({ codigo: "CEMP113", tipo: "P", idLiga: "2", nrc: "100005", docente: "JORGE VEGA", dia: "JUE" }),
      sesion({ codigo: "CEMP113", tipo: "L", idLiga: "2", nrc: "100006", docente: "ROSA MARTINEZ", dia: "VIE" }),
    ];
    const { cursos } = agruparEnCursos(sesiones);
    const grupos = gruposDeCurso(cursos[0]);
    const de = (idLiga: string) =>
      cursos[0].opciones.flatMap((o) => o.sesiones).find((s) => s.idLiga === idLiga)!;
    expect(numeroDeGrupo(grupos, de("1"))).toBe(1);
    expect(numeroDeGrupo(grupos, de("2"))).toBe(2);
    expect(numeroDeGrupo(grupos, de("2"))).not.toBe(1);
  });

  it("fusiona automáticamente horarios del mismo curso agregados en múltiples tandas", () => {
    const sesionesTanda1 = [
      sesion({ codigo: "CEMP-112", curso: "Matemática Básica", tipo: "T", nrc: "1001", dia: "LUN" }),
    ];
    const sesionesTanda2 = [
      sesion({ codigo: "", curso: "Matematica Basica", tipo: "T", nrc: "1002", dia: "MAR" }),
      sesion({ codigo: "CEMP-112", curso: "", tipo: "P", nrc: "1003", dia: "VIE" }),
    ];
    const { cursos } = agruparEnCursos([...sesionesTanda1, ...sesionesTanda2]);
    expect(cursos).toHaveLength(1);
    expect(cursos[0].nombre).toBe("Matemática Básica");
    expect(cursos[0].codigo).toBe("CEMP-112");
    expect(cursos[0].opciones).toHaveLength(3);
  });
});