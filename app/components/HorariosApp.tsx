"use client";

import { useEffect, useState } from "react";
import type {
  Curso,
  HorarioResult,
  ResultadoGeneracion,
} from "@/lib/model";
import { parseTexto, filaASesion } from "@/lib/parser";
import { agruparEnCursos } from "@/lib/groups";
import { generarHorarios } from "@/lib/generator";
import { stepper } from "./ui";
import { useEstadoHorarios } from "@/lib/hooks/useEstadoHorarios";
import { PasoTexto } from "./pasos/PasoTexto";
import { PasoRevisar } from "./pasos/PasoRevisar";
import { PasoCursosResultados } from "./pasos/PasoCursosResultados";
import { PasoResultados } from "./pasos/PasoResultados";

const PASOS = ["Texto", "Revisar", "Cursos y Horario"];

export default function HorariosApp() {
  const {
    paso,
    setPaso,
    texto,
    setTexto,
    advertencias,
    setAdvertencias,
    filas,
    setFilas,
    cursos,
    setCursos,
    sinLiga,
    setSinLiga,
    seleccionados,
    setSeleccionados,
    prefs,
    setPrefs,
    modo,
    setModo,
    creditos,
    setCreditos,
    docPref,
    setDocPref,
    colores,
    fijados,
    setFijados,
    agregando,
    setAgregando,
    compartido,
    compartir,
    borradores,
    guardarBorrador,
    eliminarBorrador,
  } = useEstadoHorarios();

  const [resultado, setResultado] = useState<ResultadoGeneracion | null>(null);

  // Construir selección y parámetros para generación
  const construirGeneracion = () => {
    const seleccion = cursos.filter((c) => seleccionados.has(c.codigo));
    const prefsGen = {
      ...prefs,
      docentesPorCurso: docPref,
    };
    const fijadosGen: Record<string, string> = {};
    for (const c of seleccion) {
      const p = fijados[c.codigo];
      if (p && c.opciones.some((o) => o.id === p)) fijadosGen[c.codigo] = p;
    }
    return { seleccion, prefsGen, fijadosGen };
  };

  // Cálculo en tiempo real con debounce
  useEffect(() => {
    const t = window.setTimeout(() => {
      const { seleccion, prefsGen, fijadosGen } = construirGeneracion();
      if (seleccion.length === 0) {
        setResultado(null);
        return;
      }
      const res = generarHorarios(seleccion, prefsGen, {
        maxResultados: 60,
        maxMs: 2000,
        fijados: fijadosGen,
      });
      setResultado(res);
    }, 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursos, seleccionados, prefs, creditos, docPref, fijados]);

  const claveFila = (f: (typeof filas)[number]): string =>
    `${f.codigo}|${f.curso}|${f.nrc}|${f.dia}|${f.inicio}|${f.fin}`;

  const analizar = (textoEntrada?: string) => {
    const entr = textoEntrada ?? texto;
    const res = parseTexto(entr);
    setFilas((prev) => {
      if (!agregando || prev.length === 0) return res.filas;
      const existentes = new Set(prev.map(claveFila));
      const nuevas = res.filas.filter((f) => !existentes.has(claveFila(f)));
      if (nuevas.length === 0) return prev;
      return [...prev, ...nuevas];
    });
    setAdvertencias(res.advertencias);
    setModo(res.modo);
    setAgregando(false);
    setPaso(1);
  };

  const construirCursos = () => {
    const sesiones = filas
      .map(filaASesion)
      .filter((s): s is NonNullable<typeof s> => s !== null);
    const { cursos: nuevos, opcionesSinLiga } = agruparEnCursos(sesiones);
    setCursos(nuevos);
    setSeleccionados((prev) => {
      const n = new Set(prev);
      for (const c of nuevos) n.add(c.codigo);
      return n;
    });
    setCreditos((prev) => {
      const n = { ...prev };
      for (const c of nuevos) {
        if (n[c.codigo] === undefined && c.creditos) n[c.codigo] = c.creditos;
      }
      return n;
    });
    setSinLiga(opcionesSinLiga);
    setPaso(2);
  };

  const eliminarCurso = (codigo: string) => {
    const curso = cursos.find((c) => c.codigo === codigo);
    setCursos((prev) => prev.filter((c) => c.codigo !== codigo));
    setSeleccionados((prev) => {
      const n = new Set(prev);
      n.delete(codigo);
      return n;
    });
    setCreditos((prev) => {
      const n = { ...prev };
      delete n[codigo];
      return n;
    });
    setDocPref((prev) => {
      const n = { ...prev };
      delete n[codigo];
      return n;
    });
    setFijados((prev) => {
      const n = { ...prev };
      delete n[codigo];
      return n;
    });
    setFilas((prev) =>
      prev.filter((f) => {
        if (f.codigo === codigo) return false;
        if (curso && !f.codigo && f.curso === curso.nombre) return false;
        return true;
      })
    );
  };

  return (
    <main suppressHydrationWarning className="mx-auto flex-1 w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
      {/* Indicador de Pasos / Stepper Interactivo */}
      {stepper(Math.min(paso, 2), PASOS, (idx) => setPaso(idx))}

      {/* Pantalla según Paso */}
      {paso === 0 && (
        <PasoTexto
          texto={texto}
          setTexto={setTexto}
          onAnalizar={analizar}
        />
      )}

      {paso === 1 && (
        <PasoRevisar
          filas={filas}
          setFilas={setFilas}
          advertencias={advertencias}
          modo={modo}
          onVolver={() => setPaso(0)}
          onAgregarMas={() => {
            setAgregando(true);
            setPaso(0);
          }}
          onContinuar={construirCursos}
        />
      )}

      {paso >= 2 && (
        <PasoCursosResultados
          cursos={cursos}
          seleccionados={seleccionados}
          setSeleccionados={setSeleccionados}
          creditos={creditos}
          setCreditos={setCreditos}
          docPref={docPref}
          setDocPref={setDocPref}
          fijados={fijados}
          setFijados={setFijados}
          colores={colores}
          prefs={prefs}
          setPrefs={setPrefs}
          onEliminarCurso={eliminarCurso}
          sinLiga={sinLiga}
          compartido={compartido}
          onCompartir={compartir}
          resultado={resultado}
          borradores={borradores}
          onGuardarBorrador={guardarBorrador}
          onEliminarBorrador={eliminarBorrador}
          onVolver={() => setPaso(1)}
          onAgregarMas={() => {
            setAgregando(true);
            setPaso(0);
          }}
        />
      )}
    </main>
  );
}

export function ResultadosView({
  resultado,
  colores = {},
  onVolver,
}: {
  resultado: ResultadoGeneracion | null;
  seleccionados?: Set<string>;
  onVolver: () => void;
  onReiniciar?: () => void;
  onCompartir?: () => void;
  compartido?: boolean;
  onImprimir?: (h: HorarioResult) => void;
  colores?: Record<string, string>;
}) {
  return (
    <PasoResultados
      resultado={resultado}
      colores={colores}
      borradores={[]}
      onGuardarBorrador={() => {}}
      onEliminarBorrador={() => {}}
      onVolver={onVolver}
    />
  );
}