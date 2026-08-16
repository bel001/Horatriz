"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Curso,
  FilaParseada,
  HorarioResult,
  Preferencias,
  Tipo,
} from "@/lib/model";
import { DEFAULT_PREFERENCIAS } from "@/lib/model";
import { filaASesion } from "@/lib/parser";
import { agruparEnCursos } from "@/lib/groups";
import type { EstadoPersistido } from "@/lib/estado";
import {
  cargarEstado,
  deserializarEstado,
  guardarEstado,
  serializarEstado,
} from "@/lib/estado";

export interface BorradorGuardado {
  id: string;
  nombre: string;
  fecha: string;
  horario: HorarioResult;
}

export function useEstadoHorarios() {
  const [paso, setPaso] = useState(0);
  const [texto, setTexto] = useState("");
  const [advertencias, setAdvertencias] = useState<string[]>([]);
  const [filas, setFilas] = useState<FilaParseada[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [sinLiga, setSinLiga] = useState(0);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [prefs, setPrefs] = useState<Preferencias>(DEFAULT_PREFERENCIAS);
  const [modo, setModo] = useState<"columnas" | "regex" | "portalupao" | "bannerupao">("regex");
  const [creditos, setCreditos] = useState<Record<string, number>>({});
  const [docPref, setDocPref] = useState<Record<string, Partial<Record<Tipo, string>>>>({});
  const [colores, setColores] = useState<Record<string, string>>({});
  const [fijados, setFijados] = useState<Record<string, string>>({});
  const [agregando, setAgregando] = useState(false);
  const [compartido, setCompartido] = useState(false);
  const [borradores, setBorradores] = useState<BorradorGuardado[]>([]);

  // Cargar borradores de localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("horatriz-borradores") || localStorage.getItem("hupao-borradores");
      if (raw) setBorradores(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  const guardarBorrador = useCallback((nombre: string, horario: HorarioResult) => {
    const nuevo: BorradorGuardado = {
      id: Date.now().toString(),
      nombre: nombre.trim() || `Horario #${borradores.length + 1}`,
      fecha: new Date().toLocaleDateString("es-PE", { hour: "2-digit", minute: "2-digit" }),
      horario,
    };
    setBorradores((prev) => {
      const actualizados = [nuevo, ...prev];
      try {
        localStorage.setItem("horatriz-borradores", JSON.stringify(actualizados));
      } catch {
        /* noop */
      }
      return actualizados;
    });
  }, [borradores.length]);

  const eliminarBorrador = useCallback((id: string) => {
    setBorradores((prev) => {
      const actualizados = prev.filter((b) => b.id !== id);
      try {
        localStorage.setItem("horatriz-borradores", JSON.stringify(actualizados));
      } catch {
        /* noop */
      }
      return actualizados;
    });
  }, []);

  // Cargar estado inicial (hash o localStorage)
  useEffect(() => {
    let cancelado = false;
    const aplicar = (e: EstadoPersistido) => {
      setFilas(e.filas);
      setModo(e.modo);
      setAdvertencias(e.advertencias ?? []);
      setPrefs({
        ...DEFAULT_PREFERENCIAS,
        ...e.prefs,
        restricciones: {
          ...DEFAULT_PREFERENCIAS.restricciones,
          ...(e.prefs?.restricciones ?? {}),
        },
      });
      if (e.filas.length === 0) {
        setPaso(0);
        return;
      }
      const sesiones = e.filas
        .map(filaASesion)
        .filter((s): s is NonNullable<typeof s> => s !== null);
      const { cursos: nuevos, opcionesSinLiga } = agruparEnCursos(sesiones);
      setCursos(nuevos);
      setSinLiga(opcionesSinLiga);
      const cr = { ...(e.creditos ?? {}) };
      for (const c of nuevos) {
        if (cr[c.codigo] === undefined && c.creditos) cr[c.codigo] = c.creditos;
      }
      setCreditos(cr);
      setDocPref(e.docPref ?? {});
      setColores(e.colores ?? {});
      setSeleccionados(new Set<string>(e.seleccionados ?? nuevos.map((c: Curso) => c.codigo)));
      setPaso(e.paso >= 2 ? 2 : 1);
    };

    const hash = window.location.hash.replace(/^#d=/, "");
    if (hash) {
      deserializarEstado(hash).then((e) => {
        if (!cancelado && e) aplicar(e);
      });
    } else {
      const e = cargarEstado();
      if (e) aplicar(e);
    }
    return () => {
      cancelado = true;
    };
  }, []);

  // Guardar estado con debounce
  useEffect(() => {
    const t = window.setTimeout(() => {
      guardarEstado({
        v: 1,
        paso,
        filas,
        modo,
        advertencias,
        prefs,
        creditos,
        docPref,
        colores,
        seleccionados: [...seleccionados],
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [paso, filas, modo, advertencias, prefs, creditos, docPref, colores, seleccionados]);

  // Función para compartir via URL hash
  const compartir = useCallback(async () => {
    const e: EstadoPersistido = {
      v: 1,
      paso: 2,
      filas,
      modo,
      advertencias,
      prefs,
      creditos,
      docPref,
      colores,
      seleccionados: [...seleccionados],
    };
    const s = await serializarEstado(e);
    const url = `${window.location.origin}${window.location.pathname}#d=${s}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copia este enlace:", url);
    }
    setCompartido(true);
    window.setTimeout(() => setCompartido(false), 2500);
  }, [filas, modo, advertencias, prefs, creditos, docPref, colores, seleccionados]);

  return {
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
    setColores,
    fijados,
    setFijados,
    agregando,
    setAgregando,
    compartido,
    compartir,
    borradores,
    guardarBorrador,
    eliminarBorrador,
  };
}
