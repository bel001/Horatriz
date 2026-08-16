// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreferenciasPanel } from "@/app/components/PreferenciasPanel";
import { ResultadosView } from "@/app/components/HorariosApp";
import { DEFAULT_PREFERENCIAS } from "@/lib/model";
import type {
  Curso,
  HorarioResult,
  Opcion,
  ResultadoGeneracion,
  Sesion,
} from "@/lib/model";

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

function horario(minutosHuecos: number): HorarioResult {
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
    minutosHuecos,
    diasConClase: ["LUN"],
    sesiones: [s],
    totalCreditos: 3,
    docentesRepetidos: [],
  };
}

describe("PreferenciasPanel", () => {
  it("activa y desactiva 'Evitar horas muertas'", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PreferenciasPanel
        prefs={{ ...DEFAULT_PREFERENCIAS, pesoHuecos: 0 }}
        onChange={onChange}
      />
    );
    await user.click(screen.getByLabelText("Evitar horas muertas (huecos)"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ pesoHuecos: 1 })
    );
  });

  it("registra un día en las reglas estrictas", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PreferenciasPanel prefs={{ ...DEFAULT_PREFERENCIAS }} onChange={onChange} />);
    await user.click(screen.getByLabelText("Sin clases Lunes"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        restricciones: expect.objectContaining({ sinDias: ["LUN"] }),
      })
    );
  });
});

describe("ResultadosView", () => {
  const resultado: ResultadoGeneracion = {
    horarios: [horario(30), horario(0)],
    considerados: 2,
    podados: 0,
    limite: false,
    tiempoMs: 10,
  };

  const renderVista = () =>
    render(
      <ResultadosView
        resultado={resultado}
        seleccionados={new Set(["C1"])}
        onVolver={vi.fn()}
        onReiniciar={vi.fn()}
        onCompartir={vi.fn()}
        compartido={false}
        onImprimir={vi.fn()}
        colores={{}}
      />
    );

  it("muestra el conteo de horarios", () => {
    renderVista();
    expect(screen.getByText(/2 de 2 horarios/)).toBeInTheDocument();
  });

  it("muestra las opciones generadas", () => {
    renderVista();
    expect(screen.getAllByText(/Opción #1/).length).toBeGreaterThan(0);
  });
});
