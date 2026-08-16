import {
  DIA_LABEL,
  DIAS,
  type Dia,
  type FilaParseada,
  type Sesion,
  type Tipo,
} from "./model";
import { toMinutes } from "./time";
import { esFormatoPortal, parsearPortal } from "./portal";
import { esFormatoBanner, parsearBanner } from "./banner";

const ALIAS_DIAS: Record<string, Dia> = {
  LUN: "LUN",
  LUNES: "LUN",
  MAR: "MAR",
  MARTES: "MAR",
  MIE: "MIE",
  MIEH: "MIE",
  MIERCOLES: "MIE",
  "MIÉRCOLES": "MIE",
  JUE: "JUE",
  JUEVES: "JUE",
  VIE: "VIE",
  VIERNES: "VIE",
  SAB: "SAB",
  SÁB: "SAB",
  SABADO: "SAB",
  SÁBADO: "SAB",
  DOM: "DOM",
  DOMINGO: "DOM",
};

const DIA_KEYS = Object.keys(ALIAS_DIAS).sort((a, b) => b.length - a.length);
const RE_DIA = new RegExp(
  `\\b(${DIA_KEYS.join("|")})\\b`,
  "i"
);

export function normalizarTexto(texto: string): string {
  return texto
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, "  ")
    .replace(/[|¦¦¡¡¡!!!]/gu, "|")
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0)
    .join("\n");
}

function diaDesdeTexto(s: string): Dia | "" {
  const m = s.match(RE_DIA);
  if (!m) return "";
  const k = m[0].toUpperCase().replace(/^MIÉ/, "MIE").replace(/^SÁ/, "SAB");
  return ALIAS_DIAS[k] ?? "";
}

const RE_TIPO_TOKEN = /^[TPL]$/;
const RE_SECCION_TOKEN = /^[A-Z]$/;
const RE_NRC_6 = /^\d{6}$/;
const RE_NRC_CORTO = /^\d{4,6}$/;
const RE_CODIGO_TOKEN = /^[A-Z]{2,6}[-–]?\d{1,4}$/;
const RE_AULA_TOKEN = /^[A-Z]{1,4}[-–]?\d{2,3}$/i;
const RE_HORA_TOKEN = /^(\d{1,2}:\d{2})$/;
const RE_RANGO_INLINE = /^(\d{1,2}:\d{2})[-–](\d{1,2}:\d{2})$/;
const RE_SEPARADOR_HORA = /^[-–—~a]?$/i;
const RE_ETIQUETA =
  /^(NRC|N°|NO|COD|CODIGO|SEC|SECC|SECCION|SECCIÓN|TIPO|TPO|LIGA|ID|DIA|HORA|AULA|SALON|SALÓN|DOCENTE|PROF|PROFESOR|CURSO|ASIGNATURA|MATERIA|AMB|INICIO|FIN|DE|EL|LA|AL|DEL)$/i;

function horaDeToken(t: string): number | null {
  const m = t.match(RE_HORA_TOKEN);
  if (!m) return null;
  try {
    return toMinutes(m[1]);
  } catch {
    return null;
  }
}

function aliasDiaToken(t: string): Dia | "" {
  const up = t.toUpperCase();
  return (ALIAS_DIAS[up] ?? "");
}

function leerHora(tokens: string[]): {
  inicio: number | null;
  fin: number | null;
  corte: number;
} {
  for (let i = 0; i < tokens.length; i++) {
    const inline = tokens[i].match(RE_RANGO_INLINE);
    if (inline) {
      return {
        inicio: toMinutes(inline[1]),
        fin: toMinutes(inline[2]),
        corte: i,
      };
    }
    const ini = horaDeToken(tokens[i]);
    if (ini === null) continue;
    let j = i + 1;
    if (j < tokens.length && RE_SEPARADOR_HORA.test(tokens[j])) j++;
    const finT = j < tokens.length ? horaDeToken(tokens[j]) : null;
    if (finT !== null) return { inicio: ini, fin: finT, corte: j };
    return { inicio: ini, fin: null, corte: i };
  }
  return { inicio: null, fin: null, corte: -1 };
}

export function analizarLinea(
  linea: string,
  contador = { id: 1 }
): FilaParseada {
  const tokens = linea.trim().split(/\s+/);
  let confianza = 0.3;

  let dia: Dia | "" = "";
  const diaIdx = tokens.findIndex((t) => aliasDiaToken(t));
  if (diaIdx >= 0) {
    dia = aliasDiaToken(tokens[diaIdx]);
    confianza += 0.1;
  }

  const { inicio, fin, corte } = leerHora(tokens);
  if (inicio !== null && fin !== null) confianza += 0.2;

  const antes = corte >= 0 ? tokens.slice(0, corte) : tokens.slice();
  const despues = corte >= 0 ? tokens.slice(corte + 1) : [];

  let aula = "";
  let docente = "";
  if (inicio !== null) {
    const resto = [...despues];
    const aulaIdx = resto.findIndex((t) => RE_AULA_TOKEN.test(t));
    if (aulaIdx >= 0) {
      aula = resto[aulaIdx];
      confianza += 0.05;
      resto.splice(aulaIdx, 1);
    }
    docente = resto.join(" ");
  }

  const trabajo = antes.filter((t) => !RE_ETIQUETA.test(t) && !aliasDiaToken(t));

  let tipo: Tipo | "" = "T";
  let seccion = "";
  const tipoIdx = trabajo.findIndex((t) => RE_TIPO_TOKEN.test(t));
  if (tipoIdx >= 0) {
    tipo = trabajo[tipoIdx] as Tipo;
    trabajo.splice(tipoIdx, 1);
    confianza += 0.05;
    if (tipoIdx > 0 && RE_SECCION_TOKEN.test(trabajo[tipoIdx - 1])) {
      seccion = trabajo[tipoIdx - 1];
      trabajo.splice(tipoIdx - 1, 1);
    }
  }

  let nrc = "";
  let idx = trabajo.findIndex((t) => RE_NRC_6.test(t));
  if (idx < 0) idx = trabajo.findIndex((t) => RE_NRC_CORTO.test(t));
  if (idx >= 0) {
    nrc = trabajo[idx];
    trabajo.splice(idx, 1);
  }

  let codigo = "";
  idx = trabajo.findIndex((t) => RE_CODIGO_TOKEN.test(t));
  if (idx >= 0) {
    codigo = trabajo[idx];
    confianza += 0.03;
    trabajo.splice(idx, 1);
  }

  if (!seccion) {
    idx = trabajo.findIndex((t) => RE_SECCION_TOKEN.test(t));
    if (idx >= 0) {
      seccion = trabajo[idx];
      trabajo.splice(idx, 1);
    }
  }

  let liga = "";
  let idLiga = "";
  idx = trabajo.findIndex((t) => RE_NRC_CORTO.test(t));
  if (idx >= 0) {
    idLiga = trabajo[idx];
    trabajo.splice(idx, 1);
    confianza += 0.03;
  }
  idx = trabajo.findIndex((t) => /^\d{1,3}$/.test(t));
  if (idx >= 0) {
    liga = trabajo[idx];
    trabajo.splice(idx, 1);
  }

  let curso = trabajo.join(" ").trim();
  if (!docente && curso) {
    const palabras = curso.split(" ");
    const ultimas = palabras.slice(-2);
    if (
      ultimas.length === 2 &&
      ultimas.every((p) => /^[A-ZÁÉÍÓÚÑ]/.test(p) && p.length > 2)
    ) {
      docente = ultimas.join(" ");
      curso = palabras.slice(0, -2).join(" ");
      confianza += 0.04;
    }
  }

  return {
    id: `fila-${contador.id++}`,
    curso,
    codigo,
    nrc,
    seccion,
    tipo,
    liga,
    idLiga,
    dia,
    inicio,
    fin,
    aula,
    docente,
    confianza: Math.min(1, confianza),
    ignorada: false,
  };
}

function detectarEncabezado(lineas: string[]): number {
  const claves = ["NRC", "SECC", "LIGA", "DIA", "HORA", "AULA", "DOCENTE", "CURSO", "COD"];
  for (let i = 0; i < Math.min(lineas.length, 8); i++) {
    const up = lineas[i].toUpperCase();
    const hits = claves.filter((c) => up.includes(c)).length;
    if (hits >= 3) return i;
  }
  return -1;
}

const CAMPOS_ENCABEZADO: Array<{ clave: string; claves: string[] }> = [
  { clave: "NRC", claves: ["NRC"] },
  { clave: "SECC", claves: ["SECC"] },
  { clave: "TIPO", claves: ["TIPO", "TPO"] },
  { clave: "DIA", claves: ["DIA"] },
  { clave: "HORA", claves: ["HORA"] },
  { clave: "AULA", claves: ["AULA", "SALON", "LOCAL", "AMB"] },
  { clave: "DOCENTE", claves: ["DOCENTE", "DOC", "PROF"] },
  { clave: "CURSO", claves: ["CURSO", "ASIGNATURA", "MATERIA"] },
  { clave: "COD", claves: ["COD"] },
];

function arriba(texto: string): string {
  return texto.toUpperCase();
}

function parsearRangoCelda(celda: string): { inicio: number | null; fin: number | null } {
  const m = celda.match(/(\d{1,2}:\d{2})\s*(?:-|–|—|~|\ba\b)\s*(\d{1,2}:\d{2})/i);
  if (m) {
    try {
      return { inicio: toMinutes(m[1]), fin: toMinutes(m[2]) };
    } catch {
      return { inicio: null, fin: null };
    }
  }
  const p = celda.match(/(\d{1,2}:\d{2})/);
  if (p) {
    try {
      return { inicio: toMinutes(p[1]), fin: null };
    } catch {
      return { inicio: null, fin: null };
    }
  }
  return { inicio: null, fin: null };
}

export function parsearColumnas(lineas: string[], cabeceraIdx: number, contador: { id: number }): FilaParseada[] {
  const cabecera = lineas[cabeceraIdx];
  const cols = cabecera.split(/\s{2,}/).map((c) => c.trim());
  const mapeo: Record<string, { col: number }> = {};
  for (const campo of CAMPOS_ENCABEZADO) {
    const idx = cols.findIndex((c) => {
      const up = arriba(c);
      return campo.claves.some((k) => up.includes(k));
    });
    if (idx >= 0) mapeo[campo.clave] = { col: idx };
  }

  let idLigaCol = -1;
  let ligaCol = -1;
  cols.forEach((c, i) => {
    const up = arriba(c);
    if (up.includes("ID") && up.includes("LIGA") && idLigaCol < 0) idLigaCol = i;
  });
  cols.forEach((c, i) => {
    const up = arriba(c);
    if (i !== idLigaCol && up.includes("LIGA") && ligaCol < 0) ligaCol = i;
  });

  const filas: FilaParseada[] = [];
  for (let i = cabeceraIdx + 1; i < lineas.length; i++) {
    const celdas = lineas[i].split(/\s{2,}/).map((c) => c.trim());
    const get = (clave: string): string => {
      const m = mapeo[clave];
      return m && celdas[m.col] !== undefined ? celdas[m.col] : "";
    };

    const hora = get("HORA");
    const { inicio, fin } = parsearRangoCelda(hora);

    let tipo: Tipo | "" = "";
    const t = arriba(get("TIPO"));
    if (t === "T" || t === "P" || t === "L") tipo = t as Tipo;

    let dia: Dia | "" = "";
    const d = diaDesdeTexto(arriba(get("DIA")));
    if (d) dia = d;

    let nrc = nrcO(get("NRC"));
    if (!nrc && idLigaCol >= 0 && celdas[idLigaCol]) nrc = nrcO(celdas[idLigaCol]);

    let idLiga = "";
    if (idLigaCol >= 0) idLiga = nrcO(celdas[idLigaCol]) || celdas[idLigaCol] || "";
    let liga = "";
    if (ligaCol >= 0) liga = celdas[ligaCol] || "";

    if (!(nrc || (dia && inicio !== null))) continue;

    filas.push({
      id: `fila-${contador.id++}`,
      curso: get("CURSO"),
      codigo: get("COD"),
      nrc,
      seccion: get("SECC"),
      tipo,
      liga,
      idLiga,
      dia,
      inicio,
      fin,
      aula: get("AULA"),
      docente: get("DOCENTE"),
      confianza: mapeo["HORA"] && mapeo["DIA"] && (mapeo["NRC"] || idLigaCol >= 0) ? 0.9 : 0.6,
      ignorada: false,
    });
  }
  return filas;
}

function nrcO(v: string): string {
  const m = v.match(/\d{4,6}/);
  return m ? m[0] : "";
}

export interface ParseResult {
  filas: FilaParseada[];
  modo: "columnas" | "regex" | "portalupao" | "bannerupao";
  advertencias: string[];
}

export function parseTexto(texto: string): ParseResult {
  const norm = normalizarTexto(texto);
  const lineas = norm.split("\n");
  const contador = { id: 1 };
  const advertencias: string[] = [];

  if (lineas.length === 0) {
    return { filas: [], modo: "regex", advertencias: ["No se encontró texto."] };
  }

  if (esFormatoBanner(norm)) {
    const banner = parsearBanner(norm);
    if (banner.filas.length > 0) {
      return { ...banner, modo: "bannerupao" };
    }
  }

  if (esFormatoPortal(norm)) {
    const portal = parsearPortal(norm);
    return { ...portal, modo: "portalupao" };
  }

  const cabeceraIdx = detectarEncabezado(lineas);
  if (cabeceraIdx >= 0) {
    const filas = parsearColumnas(lineas, cabeceraIdx, contador);
    if (filas.length > 0) {
      return { filas, modo: "columnas", advertencias };
    }
  }

  const filas = lineas.map((l) => analizarLinea(l, contador));
  const sinHora = filas.filter((f) => f.inicio === null).length;
  const sinDia = filas.filter((f) => !f.dia).length;
  if (sinHora > 0) advertencias.push(`${sinHora} línea(s) sin hora detectada.`);
  if (sinDia > 0) advertencias.push(`${sinDia} línea(s) sin día detectado.`);
  filas.forEach((f) => {
    if (f.tipo === "P") f.tipo = "P" as Tipo;
  });

  return { filas, modo: "regex", advertencias };
}

export function filaASesion(f: FilaParseada): Sesion | null {
  if (f.ignorada || !f.dia || f.inicio === null || f.fin === null) return null;
  return {
    id: f.id,
    curso: f.curso || f.codigo || "Sin curso",
    codigo: f.codigo,
    nrc: f.nrc,
    seccion: f.seccion,
    tipo: (f.tipo || "T") as Tipo,
    liga: f.liga,
    idLiga: f.idLiga,
    dia: f.dia,
    inicio: f.inicio,
    fin: f.fin,
    aula: f.aula,
    docente: f.docente,
    creditos: f.creditos,
    esLleno: f.esLleno,
    esVirtual:
      f.esVirtual ??
      (!f.aula ||
        f.aula.toUpperCase() === "NINGUNO" ||
        /\b(NO\s+PRESENCIAL|VIRTUAL|EN\s+LINEA|EN\s+LÍNEA)\b/i.test(f.aula)),
  };
}

export function etiquetaDia(d: Dia): string {
  return DIA_LABEL[d];
}

export const DIA_INDEX: Record<Dia, number> = {
  LUN: 0,
  MAR: 1,
  MIE: 2,
  JUE: 3,
  VIE: 4,
  SAB: 5,
  DOM: 6,
};

export function filtrarDiaValido(s: string): Dia | "" {
  const up = s.toUpperCase();
  return (DIAS as readonly string[]).includes(up) ? (up as Dia) : "";
}