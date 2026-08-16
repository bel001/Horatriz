import { describe, expect, it } from "vitest";
import { generarIcs } from "../lib/ical";
import type { HorarioResult } from "../lib/model";

describe("ical export", () => {
  it("debe generar un string de iCalendar válido con sesiones", () => {
    const horarioMock: HorarioResult = {
      cuadro: [],
      nombre: "Test Horario",
      score: 90,
      totalMinutos: 240,
      minutosHuecos: 0,
      diasConClase: ["LUN", "MIE"],
      sesiones: [
        {
          id: "s1",
          curso: "MATEMATICA I",
          codigo: "MAT-101",
          nrc: "1234",
          seccion: "A",
          tipo: "T",
          liga: "1",
          idLiga: "100",
          dia: "LUN",
          inicio: 7 * 60,
          fin: 9 * 60,
          aula: "A-101",
          docente: "JUAN PEREZ",
        },
      ],
      totalCreditos: 4,
      docentesRepetidos: [],
    };

    const ics = generarIcs(horarioMock);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("SUMMARY:MATEMATICA I (T)");
    expect(ics).toContain("LOCATION:A-101");
    expect(ics).toContain("FREQ=WEEKLY");
  });
});
