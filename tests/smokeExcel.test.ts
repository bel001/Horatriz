import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { aTextoColumnas } from "@/lib/lectorArchivos";
import { parseTexto } from "@/lib/parser";
import { filaASesion } from "@/lib/parser";
import { agruparEnCursos } from "@/lib/groups";

describe("flujo archivo Excel", () => {
  it("hoja de cálculo completa: filas -> parser -> cursos con liga", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["CODIGO", "NRC", "SECC", "TIPO", "LIGA", "ID LIGA", "DIA", "HORA", "AULA", "DOCENTE"],
        ["CEMP-112", 120123, "A", "T", 12, 3001, "LUN", "07:00-09:00", "A-201", "JUAN PEREZ"],
        ["CEMP-112", 120124, "A", "P", 12, 3001, "MIE", "07:00-09:00", "A-201", "JUAN PEREZ"],
        ["CEMP-112", 120125, "A", "L", 12, 3001, "JUE", "14:00-16:00", "L-105", "MARIA LOPEZ"],
        ["MATE-201", 220111, "A", "T", 5, 3007, "MAR", "08:00-10:00", "B-105", "LUIS TORRES"],
        ["MATE-201", 220112, "A", "P", 5, 3007, "JUE", "08:00-10:00", "B-105", "LUIS TORRES"],
      ]),
      "Hoja1"
    );
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const wb2 = XLSX.read(buf, { type: "array" });
    const hoja = wb2.Sheets[wb2.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Cell[]>(hoja, { header: 1 });

    const res = parseTexto(aTextoColumnas(rows));
    expect(res.modo).toBe("columnas");
    expect(res.filas).toHaveLength(5);

    const sesiones = res.filas
      .map(filaASesion)
      .filter((s): s is NonNullable<typeof s> => s !== null);
    const { cursos, opcionesSinLiga } = agruparEnCursos(sesiones);

    expect(opcionesSinLiga).toBe(0);
    expect(cursos).toHaveLength(2);
    const cemp = cursos.find((c) => c.codigo === "CEMP-112");
    expect(cemp?.opciones).toHaveLength(1);
    expect(new Set(cemp?.opciones[0].sesiones.map((s) => s.tipo))).toEqual(
      new Set(["T", "P", "L"])
    );
  });
});

type Cell = string | number | boolean | null | undefined;
