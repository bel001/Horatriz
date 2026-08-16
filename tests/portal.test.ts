import { describe, expect, it } from "vitest";
import { parseTexto, filaASesion } from "@/lib/parser";
import { agruparEnCursos } from "@/lib/groups";
import { canonLiga, tipoDeLiga, esFormatoPortal } from "@/lib/portal";

const OFERTA = `CURSO - ( ISIA-104 ) COMPUTO DISTRIBUIDO Y PARALELO
PRESENCIAL - ( PRS )

NRC:
12540 SECC:
J06 ID LIGA:
L2 LIGA:
 T2 CRED:
0
BLOQUE:
NOPA BEAULA DIA HORA ID DOCENTE DOCENTE PGG801 MIE,12:30 PM - 02:15 PM 000046447 SANTA CRUZ  DAMIAN ELIAS ENRIQUE

NRC:
5568 SECC:
J01 ID LIGA:
T1 LIGA:
 L1 CRED:
3
BLOQUE:
NOPA BEAULA DIA HORA ID DOCENTE DOCENTE PGG609 MIE,07:00 AM - 08:45 AM 000046447 SANTA CRUZ  DAMIAN ELIAS ENRIQUE

NRC:
5569 SECC:
J02 ID LIGA:
L1 LIGA:
 T1 CRED:
0
BLOQUE:
NOPA BEAULA DIA HORA ID DOCENTE DOCENTE PGG801 JUE,07:00 AM - 08:45 AM 000046447 SANTA CRUZ  DAMIAN ELIAS ENRIQUE CERRADO

NRC:
8433 SECC:
J03 ID LIGA:
L1 LIGA:
 T1 CRED:
0
BLOQUE:
NOPABEAULADIAHORAID DOCENTEDOCENTEPGG801VIE,07:00 AM - 08:45 AM 000046447 SANTA CRUZ  DAMIAN ELIAS ENRIQUE

CURSO - ( CIEN-752 ) ALGEBRA MATRIC Y GEOM ANALIT
PRESENCIAL - ( PRS )

NRC:
10002 SECC:
N07 ID LIGA:
6T LIGA:
 6P CRED:
4
BLOQUE:
SIPABEAULADIAHORAID DOCENTEDOCENTEPGG105LUN,02:20 PM - 04:05 PM000029743FERNANDEZ  JAEGER LUIS RENATO

NRC:
10003 SECC:
N08 ID LIGA:
6P LIGA:
 6T CRED:
0
BLOQUE:
SIPABEAULADIAHORAID DOCENTEDOCENTEPGG403MAR,02:20 PM - 05:55 PM000029743FERNANDEZ  JAEGER LUIS RENATO`;

describe("formato portal UPAO", () => {
  it("detecta el formato", () => {
    expect(esFormatoPortal(OFERTA)).toBe(true);
  });

  it("parsea ambas modalidades de encabezado (con y sin espacios)", () => {
    const res = parseTexto(OFERTA);
    expect(res.modo).toBe("portalupao");
    expect(res.filas).toHaveLength(6);
  });

  it("extrae campos de sesión correctamente", () => {
    const res = parseTexto(OFERTA);
    const f = res.filas[0]; // ISIA-104, MIE 12:30
    expect(f.codigo).toBe("ISIA-104");
    expect(f.curso).toBe("COMPUTO DISTRIBUIDO Y PARALELO");
    expect(f.nrc).toBe("12540");
    expect(f.seccion).toBe("J06");
    expect(f.tipo).toBe("L");
    expect(f.idLiga).toBe("L2|T2");
    expect(f.dia).toBe("MIE");
    expect(f.inicio).toBe(12 * 60 + 30);
    expect(f.fin).toBe(14 * 60 + 15);
    expect(f.aula).toBe("PGG801");
    expect(f.docente).toBe("SANTA CRUZ DAMIAN ELIAS ENRIQUE");
  });

  it("entiende horas AM/PM", () => {
    const res = parseTexto(OFERTA);
    const f = res.filas[1];
    expect(f.inicio).toBe(7 * 60);
    expect(f.fin).toBe(8 * 60 + 45);
  });

  it("extrae aula con cabecera pegada (sin espacios)", () => {
    const res = parseTexto(OFERTA);
    expect(res.filas[3].aula).toBe("PGG801");
    expect(res.filas[4].aula).toBe("PGG105");
  });

  it("quita el marcador CERRADO del docente", () => {
    const res = parseTexto(OFERTA);
    expect(res.filas[2].docente).not.toMatch(/CERRADO/i);
  });

  it("extrae créditos del campo CRED", () => {
    const res = parseTexto(OFERTA);
    expect(res.filas[4].creditos).toBe(4);
    const sesiones = res.filas
      .map(filaASesion)
      .filter((s): s is NonNullable<typeof s> => s !== null);
    const { cursos } = agruparEnCursos(sesiones);
    expect(cursos.find((c) => c.codigo === "CIEN-752")?.creditos).toBe(4);
  });

  it("agrupa por par de liga con NRC con ID LIGA y LIGA cruzados", () => {
    const res = parseTexto(OFERTA);
    const sesiones = res.filas
      .map(filaASesion)
      .filter((s): s is NonNullable<typeof s> => s !== null);
    const { cursos } = agruparEnCursos(sesiones);

    const cien = cursos.find((c) => c.codigo === "CIEN-752");
    expect(cien).toBeDefined();
    // 6T+6P forman UNA sola opción de 2 sesiones
    expect(cien!.opciones).toHaveLength(1);
    const tipos = new Set(cien!.opciones[0].sesiones.map((s) => s.tipo));
    expect(tipos).toEqual(new Set(["T", "P"]));

    const isia = cursos.find((c) => c.codigo === "ISIA-104");
    expect(isia).toBeDefined();
    // {L1,T1} tiene 1 teoría + 2 laboratorios alternativos -> 2 combos
    const optL1 = isia!.opciones.find((o) =>
      o.sesiones.some((s) => s.idLiga === "L1|T1")
    );
    expect(optL1).toBeDefined();
    expect(optL1!.sesiones).toHaveLength(2);
  });
});

describe("helpers del portal", () => {
  it("canonLiga ordena y combina ambos lados", () => {
    expect(canonLiga("L2", "T2")).toBe("L2|T2");
    expect(canonLiga("T2", "L2")).toBe("L2|T2");
    expect(canonLiga("6T", "6P")).toBe("6P|6T");
    expect(canonLiga("", "AP")).toBe("AP");
  });

  it("tipoDeLiga deriva el tipo del sufijo de ID LIGA", () => {
    expect(tipoDeLiga("T1", "L1")).toBe("T");
    expect(tipoDeLiga("L1", "T1")).toBe("L");
    expect(tipoDeLiga("6T", "6P")).toBe("T");
    expect(tipoDeLiga("6P", "6T")).toBe("P");
    expect(tipoDeLiga("AP", "AT")).toBe("P");
  });
});