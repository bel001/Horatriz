import type { Dia, FilaParseada, Tipo } from "./model";

const RE_CURSO = /\(\s*([A-Za-z0-9]+-\d+)\s*\)/g;
const RE_NRC = /NRC\s*:/gi;
const RE_DIA = /(LUN|MAR|MIE|JUE|VIE|SAB|DOM)/gi;
const RE_HORA =
  /(\d{1,2}:\d{2}\s*(?:[AP]\.?\s*M\.?)?)\s*[-–—~]\s*(\d{1,2}:\d{2}\s*(?:[AP]\.?\s*M\.?)?)/i;
const RE_ID_DOCENTE = /\d{6,9}/;
const ETIQUETAS = [
  "ID LIGA",
  "LIGA",
  "NRC",
  "SECC",
  "CRED",
  "CAPA",
  "REGI",
  "HT",
  "PP",
  "H",
  "BLOQUE",
];
const RE_ETIQUETA = new RegExp(`(${ETIQUETAS.join("|")})\\s*:`, "gi");

export function esFormatoPortal(texto: string): boolean {
  const norm = texto.toUpperCase();
  const marcas = [
    /\b(ID\s*LIGA|LIGA)\s*:/i,
    /\b(BLOQUE|NRC|SECC|CRED|CAPA|REGI)\s*:/i,
    /\(\s*[A-Za-z0-9]{2,8}-\d{2,4}\s*\)/i,
    /\b(PABE|AULA|DIA|HORA|ID\s*DOCENTE|DOCENTE)\b/i,
  ];
  let n = 0;
  for (const re of marcas) {
    if (re.test(norm)) n++;
  }
  return n >= 2;
}

export function canonLiga(id: string, liga: string): string {
  return [id, liga]
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean)
    .sort()
    .join("|");
}

export function tipoDeLiga(id: string, liga: string): Tipo | "" {
  const m = `${id} ${liga}`.toUpperCase().match(/[TPL]/);
  return m ? (m[0] as Tipo) : "T";
}

function minutosDeHora(s: string): number | null {
  const t = s.trim();
  const conAMPM = t.match(/^(\d{1,2}):(\d{2})\s*([AP])\.?\s*M\.?$/i);
  if (conAMPM) {
    let h = parseInt(conAMPM[1], 10);
    const min = parseInt(conAMPM[2], 10);
    const ap = conAMPM[3].toUpperCase();
    if (ap === "P" && h !== 12) h += 12;
    if (ap === "A" && h === 12) h = 0;
    return h * 60 + min;
  }
  const simple = t.match(/^(\d{1,2}):(\d{2})$/);
  if (simple) return parseInt(simple[1], 10) * 60 + parseInt(simple[2], 10);
  return null;
}

function diaDeTexto(s: string): Dia | "" {
  const up = s.toUpperCase().trim();
  if (/^(?:LUN|LUNES)$/.test(up)) return "LUN";
  if (/^(?:MAR|MARTES)$/.test(up)) return "MAR";
  if (/^(?:MIE|MIE,|MIÉRCOLES|MIERCOLES)$/.test(up)) return "MIE";
  if (/^(?:JUE|JUEVES)$/.test(up)) return "JUE";
  if (/^(?:VIE|VIERNES)$/.test(up)) return "VIE";
  if (/^(?:SAB|SÁB|SABADO|SÁBADO)$/.test(up)) return "SAB";
  if (/^(?:DOM|DOMINGO)$/.test(up)) return "DOM";
  return "";
}

function parsearCampos(bloque: string): Record<string, string> {
  const campos: Array<{ key: string; inicio: number; fin: number }> = [];
  let m: RegExpExecArray | null;
  RE_ETIQUETA.lastIndex = 0;
  while ((m = RE_ETIQUETA.exec(bloque))) {
    campos.push({ key: m[1].toUpperCase(), inicio: m.index, fin: m.index + m[0].length });
  }
  const res: Record<string, string> = {};
  campos.forEach((c, i) => {
    const fin = i + 1 < campos.length ? campos[i + 1].inicio : bloque.length;
    res[c.key] = bloque.slice(c.fin, fin).trim();
  });
  return res;
}

interface BaseFila {
  codigo: string;
  nombre: string;
  nrc: string;
  seccion: string;
  par: string;
  tipo: Tipo | "";
  creditos?: number;
  esLleno?: boolean;
}

function parsearFilaPortal(
  linea: string,
  base: BaseFila,
  contador: { id: number }
): FilaParseada | null {
  const hm = linea.match(RE_HORA);
  if (!hm) return null;
  const inicio = minutosDeHora(hm[1]);
  const fin = minutosDeHora(hm[2]);
  if (inicio === null || fin === null) return null;

  const antes = linea.slice(0, hm.index);
  const dias = [...antes.matchAll(RE_DIA)];
  const ultimoDia = dias[dias.length - 1];
  const day = ultimoDia?.[1] ?? "";
  const dia = diaDeTexto(day);
  if (!dia) return null;

  const previo = antes.slice(0, ultimoDia?.index ?? antes.length);
  const corte = previo.lastIndexOf("DOCENTE");
  const trasCabecera = corte >= 0 ? previo.slice(corte + 7) : previo;
  const aula = trasCabecera
    .split(/\s+/)
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  const despues = linea.slice((hm.index ?? 0) + hm[0].length);
  const docente = despues
    .replace(RE_ID_DOCENTE, "")
    .replace(/\bCERRADO\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    id: `fila-${contador.id++}`,
    curso: base.nombre || base.codigo,
    codigo: base.codigo,
    nrc: base.nrc,
    seccion: base.seccion,
    tipo: base.tipo,
    liga: "",
    idLiga: base.par,
    dia,
    inicio,
    fin,
    aula,
    docente,
    confianza: 0.8,
    ignorada: false,
    creditos: base.creditos,
    esLleno: base.esLleno,
  };
}

export function parsearPortal(texto: string): {
  filas: FilaParseada[];
  advertencias: string[];
} {
  const filas: FilaParseada[] = [];
  const advertencias: string[] = [];
  const contador = { id: 1 };

  const inicios: number[] = [];
  let m: RegExpExecArray | null;
  RE_CURSO.lastIndex = 0;
  while ((m = RE_CURSO.exec(texto))) inicios.push(m.index);

  let cursosConFilas = 0;
  for (let i = 0; i < inicios.length; i++) {
    const finSeg = i + 1 < inicios.length ? inicios[i + 1] : texto.length;
    const segmento = texto.slice(inicios[i], finSeg);
    const salto = segmento.indexOf("\n");
    const cabecera = salto >= 0 ? segmento.slice(0, salto) : segmento;
    const hm = cabecera.match(/\(\s*([A-Za-z0-9]+-\d+)\s*\)/);
    if (!hm) continue;
    const codigo = hm[1].toUpperCase();
    const restoCab = (cabecera.slice((hm.index ?? 0) + hm[0].length) || "")
      .replace(/\(\s*[A-Za-z0-9]+\s*\)/g, "")
      .replace(/[-–]\s*$/, "")
      .trim();
    const nombre = restoCab.trim() || codigo;

    const cuerpo = salto >= 0 ? segmento.slice(salto + 1) : "";
    const nrcInicios: number[] = [];
    RE_NRC.lastIndex = 0;
    while ((m = RE_NRC.exec(cuerpo))) nrcInicios.push(m.index);

    let filasDelCurso = 0;
    for (let j = 0; j < nrcInicios.length; j++) {
      const finBloque = j + 1 < nrcInicios.length ? nrcInicios[j + 1] : cuerpo.length;
      const bloque = cuerpo.slice(nrcInicios[j], finBloque);
      const campos = parsearCampos(bloque);
      const nrc = (campos.NRC || "").trim();
      const seccion = (campos.SECC || "").trim();
      const idLiga = (campos["ID LIGA"] || "").trim();
      const liga = (campos.LIGA || "").trim();
      const par = canonLiga(idLiga, liga) || nrc;
      const tipo = tipoDeLiga(idLiga, liga);
      const credNum = parseInt(campos.CRED || "", 10);
      const capaNum = parseInt(campos.CAPA || "", 10);
      const regiNum = parseInt(campos.REGI || "", 10);
      const esLlenoPorCapacidad =
        !Number.isNaN(capaNum) && !Number.isNaN(regiNum) && regiNum >= capaNum && capaNum > 0;
      const esCerradoText = /\b(CERRADO|LLENO|SIN VACANTES|OCUPADO|0 VACANTES)\b/i.test(bloque);
      const esLleno = esCerradoText || esLlenoPorCapacidad;

      const base: BaseFila = {
        codigo,
        nombre,
        nrc,
        seccion,
        par,
        tipo,
        creditos: Number.isNaN(credNum) ? undefined : credNum,
        esLleno,
      };

      for (const linea of (campos.BLOQUE || "").split("\n")) {
        const f = parsearFilaPortal(linea, base, contador);
        if (f) {
          filas.push(f);
          filasDelCurso++;
        }
      }
    }
    if (filasDelCurso > 0) cursosConFilas++;
  }

  if (cursosConFilas === 0) {
    advertencias.push("Se detectó el formato de portal universitario, pero no se encontraron horarios.");
  }
  return { filas, advertencias };
}