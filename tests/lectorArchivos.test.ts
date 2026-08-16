import { describe, expect, it } from "vitest";
import {
  aTextoColumnas,
  detectarTipoArchivo,
  reconstruirLineasPdf,
} from "@/lib/lectorArchivos";

describe("aTextoColumnas", () => {
  it("convierte filas en líneas separadas por tab", () => {
    const lineas = aTextoColumnas([
      ["NRC", "DIA", "HORA", "AULA"],
      [120123, "LUN", "07:00-09:00", "A-201"],
    ]);
    expect(lineas).toBe(
      "NRC\tDIA\tHORA\tAULA\n120123\tLUN\t07:00-09:00\tA-201"
    );
  });

  it("ignora filas completamente vacías", () => {
    const lineas = aTextoColumnas([
      ["NRC", "DIA"],
      [],
      [null, undefined],
      [120123, "LUN"],
    ]);
    expect(lineas).toBe("NRC\tDIA\n120123\tLUN");
  });

  it("sustituye saltos de línea internos de una celda por espacios", () => {
    const lineas = aTextoColumnas([["JUAN\nPEREZ", "A-201"]]);
    expect(lineas).toBe("JUAN PEREZ\tA-201");
  });

  it("produce texto apto para el parser de columnas", async () => {
    const { parseTexto } = await import("@/lib/parser");
    const lineas = aTextoColumnas([
      ["CODIGO", "NRC", "SECC", "TIPO", "LIGA", "ID LIGA", "DIA", "HORA", "AULA", "DOCENTE"],
      ["CEMP-112", 120123, "A", "T", 12, 3001, "LUN", "07:00-09:00", "A-201", "JUAN PEREZ"],
      ["CEMP-112", 120124, "A", "P", 12, 3001, "MIE", "07:00-09:00", "A-201", "JUAN PEREZ"],
    ]);
    const res = parseTexto(lineas);
    expect(res.modo).toBe("columnas");
    expect(res.filas).toHaveLength(2);
    expect(res.filas[0].nrc).toBe("120123");
    expect(res.filas[0].idLiga).toBe("3001");
    expect(res.filas[0].codigo).toBe("CEMP-112");
  });
});

describe("detectarTipoArchivo", () => {
  it("reconoce extensiones válidas", () => {
    expect(detectarTipoArchivo("oferta.XLSX")).toBe("excel");
    expect(detectarTipoArchivo("oferta.xls")).toBe("excel");
    expect(detectarTipoArchivo("oferta.csv")).toBe("csv");
    expect(detectarTipoArchivo("oferta.txt")).toBe("txt");
    expect(detectarTipoArchivo("oferta.pdf")).toBe("pdf");
  });

  it("lanza error con formato desconocido", () => {
    expect(() => detectarTipoArchivo("oferta.doc")).toThrow(/no soportado/i);
  });
});

describe("reconstruirLineasPdf", () => {
  it("agrupa items por línea y ordena por X", () => {
    const lineas = reconstruirLineasPdf([
      { str: "HORA", x: 300, y: 10, width: 30 },
      { str: "DIA", x: 60, y: 10, width: 20 },
      { str: "AULA", x: 20, y: 10, width: 20 },
    ]);
    expect(lineas).toBe("AULA\tDIA\tHORA");
  });

  it("separa columnas con tab cuando el hueco es grande", () => {
    const lineas = reconstruirLineasPdf([
      { str: "NRC", x: 10, y: 5, width: 24 },
      { str: "120123", x: 120, y: 5, width: 40 },
    ]);
    expect(lineas).toBe("NRC\t120123");
  });

  it("une palabras cercanas con un solo espacio", () => {
    const lineas = reconstruirLineasPdf([
      { str: "JUAN", x: 10, y: 5, width: 30 },
      { str: "PEREZ", x: 44, y: 5, width: 36 },
    ]);
    expect(lineas).toBe("JUAN PEREZ");
  });

  it("mantiene filas distintas separadas", () => {
    const lineas = reconstruirLineasPdf([
      { str: "CEMP-112", x: 10, y: 5, width: 60 },
      { str: "MATE-201", x: 10, y: 30, width: 60 },
    ]);
    expect(lineas).toBe("CEMP-112\nMATE-201");
  });
});
