import { describe, expect, it } from "vitest";
import {
  analizarLinea,
  normalizarTexto,
  parseTexto,
  filaASesion,
} from "@/lib/parser";

const TEXTO_COLUMNAS = `CODIGO    NRC      SECC  TIPO  LIGA   ID LIGA  DIA   HORA          AULA     DOCENTE
CEMP113   80123    A     T     17     1001     LUN   07:00-09:00   A-301    JUAN PEREZ
CEMP113   80124    A     P     17     1001     MAR   07:00-09:00   A-301    JUAN PEREZ
CEMP113   80125    A     L     17     1001     JUE   14:00-16:00   L-102    MARIA LOPEZ
FISI001   80150    B     T     3      1010     VIE   08:00-10:00   B-210    CARLOS RUIZ`;

describe("parser: normalizarTexto", () => {
  it("limpia líneas en blanco y saltos", () => {
    const out = normalizarTexto("LUN\n\nMAR\r\n\r\nSAB");
    expect(out.split("\n")).toEqual(["LUN", "MAR", "SAB"]);
  });
});

describe("parser: parseTexto modo columnas", () => {
  const res = parseTexto(TEXTO_COLUMNAS);

  it("detecta cabecera y parsea 4 filas", () => {
    expect(res.modo).toBe("columnas");
    expect(res.filas).toHaveLength(4);
  });

  it("mapea campos por columna", () => {
    const f = res.filas[0];
    expect(f.nrc).toBe("80123");
    expect(f.codigo).toBe("CEMP113");
    expect(f.seccion).toBe("A");
    expect(f.tipo).toBe("T");
    expect(f.liga).toBe("17");
    expect(f.idLiga).toBe("1001");
    expect(f.dia).toBe("LUN");
    expect(f.inicio).toBe(7 * 60);
    expect(f.fin).toBe(9 * 60);
    expect(f.aula).toBe("A-301");
    expect(f.docente).toBe("JUAN PEREZ");
    expect(f.confianza).toBeGreaterThan(0.8);
  });

  it("convierte fila a sesión", () => {
    const s = filaASesion(res.filas[0]);
    expect(s).not.toBeNull();
    expect(s!.tipo).toBe("T");
    expect(s!.idLiga).toBe("1001");
  });

  it("ignora filas sin datos esenciales", () => {
    const res2 = parseTexto(`CODIGO NRC DIA HORA
CEMP113 80123 LUN 07:00-09:00
nota al pie alineada por error`);
    expect(res2.filas).toHaveLength(1);
  });
});

describe("parser: analizarLinea modo regex", () => {
  it("extrae campos de texto plano", () => {
    const f = analizarLinea("CEMP113 Cálculo I A T LIGA 17 ID LIGA 1001 NRC 801234 LUN 07:00-09:00 A-301 JUAN PEREZ");
    expect(f.nrc).toBe("801234");
    expect(f.idLiga).toBe("1001");
    expect(f.dia).toBe("LUN");
    expect(f.inicio).toBe(420);
    expect(f.fin).toBe(540);
    expect(f.aula).toBe("A-301");
    expect(f.curso).toContain("Cálculo");
  });

  it("no lanza con texto vacío", () => {
    const f = analizarLinea("");
    expect(f.dia).toBe("");
    expect(f.inicio).toBeNull();
  });
});