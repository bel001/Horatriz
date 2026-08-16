import type { Dia, FilaParseada, Tipo } from "./model";

/**
 * Detecta si el texto proviene del formato Banner / Self-Service / "Examinar clases".
 */
export function esFormatoBanner(texto: string): boolean {
  const norm = texto.toUpperCase();
  const marcas = [
    /\b(EXAMINAR\s+CLASES|RESULTADOS\s+DE\s+LA\s+BÚSQUEDA|DESCRIPCIÓN\s+DE\s+MATERIA|SECCIONES\s+LIGADAS|HORAS\s+DE\s+REUNIÓN)\b/i,
    /\bTIPO:\s*CLASS\b/i,
    /\b\d+\s+DE\s+\d+\s+LUGARES\s+DISPONIBLES\b/i,
    /\bCOMPLETO:\s*\d+\s+DE\s+\d+\s+LUGARES\b/i,
    /\b(TEORÍA|LABORATORIO|PRÁCTICA)\b/i,
  ];

  let n = 0;
  for (const re of marcas) {
    if (re.test(norm)) n++;
  }
  return n >= 2 || /\bEXAMINAR\s+CLASES\b/i.test(norm);
}

function diaCompletoBanner(s: string): Dia | "" {
  const up = s.trim().toUpperCase();
  if (/\bLUNES\b/i.test(up)) return "LUN";
  if (/\bMARTES\b/i.test(up)) return "MAR";
  if (/\bMIÉRCOLES\b|\bMIERCOLES\b/i.test(up)) return "MIE";
  if (/\bJUEVES\b/i.test(up)) return "JUE";
  if (/\bVIERNES\b/i.test(up)) return "VIE";
  if (/\bSÁBADO\b|\bSABADO\b/i.test(up)) return "SAB";
  if (/\bDOMINGO\b/i.test(up)) return "DOM";
  return "";
}

function diaAbreviadoBanner(s: string): Dia | "" {
  const up = s.trim().toUpperCase();
  if (/\bLUN\b/i.test(up)) return "LUN";
  if (/\bMAR\b/i.test(up)) return "MAR";
  if (/\bMIÉ\b|\bMIE\b/i.test(up)) return "MIE";
  if (/\bJUE\b/i.test(up)) return "JUE";
  if (/\bVIE\b/i.test(up)) return "VIE";
  if (/\bSÁB\b|\bSAB\b/i.test(up)) return "SAB";
  if (/\bDOM\b/i.test(up)) return "DOM";
  return "";
}

function normalizarAulaBanner(edificio: string, salon: string): string {
  const ed = edificio.trim();
  const sal = salon.trim();
  if ((!ed || ed.toUpperCase() === "NINGUNO") && (!sal || sal.toUpperCase() === "NINGUNO")) {
    return "Ninguno";
  }
  if (sal && sal.toUpperCase() !== "NINGUNO") {
    return sal;
  }
  return ed || "Ninguno";
}

function normalizarDocenteBanner(docenteRaw: string): string {
  return docenteRaw
    .replace(/\s*\([^)]*\)/g, "") // Remueve "(Principal)", etc.
    .replace(/\s+/g, " ")
    .trim();
}

function tipoDeHorarioBanner(str: string): Tipo {
  const up = str.toUpperCase();
  if (up.includes("LAB")) return "L";
  if (up.includes("PRÁC") || up.includes("PRAC")) return "P";
  return "T"; // Teoría por defecto
}

interface BannerBloque {
  titulo: string;
  materia: string;
  numCurso: string;
  seccion: string;
  horas: number;
  nrc: string;
  instructor: string;
  dia: Dia | "";
  inicio: number | null;
  fin: number | null;
  aula: string;
  esLleno: boolean;
  esVirtual: boolean;
  tipo: Tipo;
}

/**
 * Parsea el texto en formato Banner UPAO / "Examinar Clases".
 */
export function parsearBanner(texto: string): {
  filas: FilaParseada[];
  advertencias: string[];
} {
  const filas: FilaParseada[] = [];
  const advertencias: string[] = [];
  const contador = { id: 1 };

  const lineas = texto.split("\n").map((l) => l.trim()).filter(Boolean);
  const bloques: BannerBloque[] = [];

  // Expresión regular para detectar la cabecera principal de cada curso/sección en Banner
  // Campos: Título \t Materia \t Número \t Sección \t Horas \t NRC \t Periodo \t [Instructor opcional]
  const reCabecera =
    /^(.+?)(?:\t+|\s{2,})([^\t\n]+?)(?:\t+|\s{2,})(\d{1,4})(?:\t+|\s{2,})([A-Z0-9]+)(?:\t+|\s{2,})(\d{1,2})(?:\t+|\s{2,})(\d{4,6})(?:\t+|\s{2,})([^\t\n]+?)(?:(?:\t+|\s{2,})(.*))?$/i;

  let i = 0;
  while (i < lineas.length) {
    const m = lineas[i].match(reCabecera);
    if (m) {
      const titulo = m[1].trim();
      const materia = m[2].trim();
      const numCurso = m[3].trim();
      const seccion = m[4].trim();
      const horas = parseInt(m[5], 10) || 0;
      const nrc = m[6].trim();
      const instructorRaw = (m[8] || "").trim();
      const instructor = normalizarDocenteBanner(instructorRaw);

      // Consumir líneas siguientes del bloque hasta encontrar la siguiente cabecera
      let dia: Dia | "" = "";
      let inicio: number | null = null;
      let fin: number | null = null;
      let edificio = "";
      let salon = "";
      let esLleno = false;
      let esVirtual = false;
      let tipo: Tipo = "T";

      let j = i + 1;
      while (j < lineas.length && !reCabecera.test(lineas[j])) {
        const ln = lineas[j];

        // Detección de modalidad virtual / no presencial
        if (/\b(NO\s+PRESENCIAL|VIRTUAL|EN\s+LINEA|EN\s+LÍNEA)\b/i.test(ln)) {
          esVirtual = true;
        }

        // Detección de día completo (ej. "Lunes", "Viernes", "Miércoles")
        const dc = diaCompletoBanner(ln);
        if (dc) dia = dc;
        else if (!dia) {
          const da = diaAbreviadoBanner(ln);
          if (da) dia = da;
        }

        // Detección de rango de hora (ej. "18:00 - 19:45" o "07:00 - 08:45")
        if (inicio === null) {
          const hm = ln.match(/(\d{1,2}:\d{2})\s*[-–—~]\s*(\d{1,2}:\d{2})/);
          if (hm) {
            const [h1, m1] = hm[1].split(":").map(Number);
            const [h2, m2] = hm[2].split(":").map(Number);
            inicio = h1 * 60 + m1;
            fin = h2 * 60 + m2;
          }
        }

        // Detección de Edificio y Salón (ej. "Tipo: Class Edificio: PABELLÓN G Salón: G702")
        const mEd = ln.match(/Edificio:\s*([^\s]+(?:\s+[^\s]+)*?)\s*Salón:\s*([^\s]+)/i);
        if (mEd) {
          edificio = mEd[1];
          salon = mEd[2];
        }

        // Detección de lugares / estado (ej. "50 de 50 lugares disponibles" o "COMPLETO: 0 de 0 lugares disponibles")
        const mVac = ln.match(/(\d+)\s+de\s+(\d+)\s+lugares\s+disponibles/i);
        if (mVac) {
          const disponibles = parseInt(mVac[1], 10);
          if (disponibles === 0) esLleno = true;
        }
        if (/\b(CERRADO|LLENO|SIN VACANTES|0 VACANTES|COMPLETO)\b/i.test(ln)) {
          esLleno = true;
        }

        // Detección de Tipo de Horario (ej. "TEORÍA", "PRÁCTICA", "LABORATORIO")
        if (/\b(TEORÍA|LABORATORIO|PRÁCTICA|TEORIA|PRACTICA)\b/i.test(ln)) {
          tipo = tipoDeHorarioBanner(ln);
        }

        j++;
      }

      const aulaNorm = normalizarAulaBanner(edificio, salon);
      if (aulaNorm.toUpperCase() === "NINGUNO") {
        esVirtual = true;
      }

      bloques.push({
        titulo,
        materia,
        numCurso,
        seccion,
        horas,
        nrc,
        instructor,
        dia,
        inicio,
        fin,
        aula: aulaNorm,
        esLleno,
        esVirtual,
        tipo,
      });

      i = j;
    } else {
      i++;
    }
  }

  // Convertir bloques a FilaParseada
  for (const b of bloques) {
    const seccionBase = b.seccion.length > 2 ? b.seccion.slice(0, -1) : b.seccion;
    const idLiga = b.instructor ? `${seccionBase}_${b.instructor}` : seccionBase;

    filas.push({
      id: `fila-${contador.id++}`,
      curso: b.titulo,
      codigo: b.numCurso || b.titulo,
      nrc: b.nrc,
      seccion: b.seccion,
      tipo: b.tipo,
      liga: "",
      idLiga,
      dia: b.dia,
      inicio: b.inicio,
      fin: b.fin,
      aula: b.aula,
      docente: b.instructor,
      confianza: b.dia && b.inicio !== null ? 0.95 : 0.6,
      ignorada: false,
      creditos: b.horas,
      esLleno: b.esLleno,
      esVirtual: b.esVirtual,
    });
  }

  if (filas.length === 0) {
    advertencias.push("Se detectó el formato de búsqueda de clases, pero no se extrajeron horarios válidos.");
  }

  return { filas, advertencias };
}
