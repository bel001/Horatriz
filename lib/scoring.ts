import type { Dia, Horario, Preferencias, Sesion } from "./model";
import { DIA_LABEL } from "./model";
import { DIA_INDEX } from "./parser";
import { fmtDuracion, fmtHora } from "./time";

export interface MetricasHorario {
  score: number;
  minutosClase: number;
  minutosHuecos: number;
  minutosMadrugada: number;
  diasConClase: Dia[];
  diasLibresLogrados: number;
  coincidenciasDocente: number;
  totalSesiones: number;
  totalCreditos: number;
  docentesRepetidos: { docente: string; cursos: string[]; dias: Dia[] }[];
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function metricasHorario(cuadro: Horario[], prefs: Preferencias): MetricasHorario {
  const sesiones: Sesion[] = [];
  for (const c of cuadro) sesiones.push(...c.opcion.sesiones);
  sesiones.sort((a, b) => DIA_INDEX[a.dia] - DIA_INDEX[b.dia] || a.inicio - b.inicio);

  const porDia = new Map<Dia, Sesion[]>();
  for (const s of sesiones) {
    const arr = porDia.get(s.dia) ?? [];
    arr.push(s);
    porDia.set(s.dia, arr);
  }
  for (const arr of porDia.values()) arr.sort((a, b) => a.inicio - b.inicio);

  let minutosClase = 0;
  let minutosHuecos = 0;
  let minutosMadrugada = 0;
  const diasConClase: Dia[] = [];
  let totalCreditos = 0;

  for (const c of cuadro) totalCreditos += c.curso.creditos ?? 0;

  for (const [dia, arr] of porDia) {
    diasConClase.push(dia);
    for (let i = 0; i < arr.length; i++) {
      const s = arr[i];
      minutosClase += s.fin - s.inicio;
      if (s.inicio < prefs.horaMinimaClase) {
        minutosMadrugada += prefs.horaMinimaClase - s.inicio;
      }
      if (i > 0) {
        const hueco = s.inicio - arr[i - 1].fin;
        if (hueco > 10) minutosHuecos += hueco;
      }
    }
  }
  diasConClase.sort((a, b) => DIA_INDEX[a] - DIA_INDEX[b]);

  let diasLibresLogrados = 0;
  if (prefs.diasLibresPreferidos.length > 0) {
    const conClase = new Set(diasConClase);
    diasLibresLogrados = prefs.diasLibresPreferidos.filter((d) => !conClase.has(d)).length;
  }

  const preferidosDoc = prefs.docentesPreferidos.map((d) => d.toLowerCase().trim());
  const porCurso = prefs.docentesPorCurso ?? {};
  let coincidenciasDocente = 0;
  for (const s of sesiones) {
    const docNorm = s.docente.toLowerCase().trim();
    if (preferidosDoc.some((p) => p && docNorm.includes(p))) coincidenciasDocente++;
    const esperado = porCurso[s.codigo]?.[s.tipo];
    if (esperado && docNorm.includes(esperado.toLowerCase().trim())) coincidenciasDocente++;
  }

  const docentesRepetidos: { docente: string; cursos: string[]; dias: Dia[] }[] = [];
  {
    const porDocente = new Map<string, { cursos: Set<string>; dias: Set<Dia> }>();
    for (const s of sesiones) {
      if (!s.docente.trim()) continue;
      let e = porDocente.get(s.docente);
      if (!e) {
        e = { cursos: new Set(), dias: new Set() };
        porDocente.set(s.docente, e);
      }
      e.cursos.add(s.curso);
      e.dias.add(s.dia);
    }
    for (const [docente, e] of porDocente) {
      if (e.cursos.size >= 2) {
        docentesRepetidos.push({ docente, cursos: [...e.cursos], dias: [...e.dias] });
      }
    }
  }

  return {
    score: 0,
    minutosClase,
    minutosHuecos,
    minutosMadrugada,
    diasConClase,
    diasLibresLogrados,
    coincidenciasDocente,
    totalSesiones: sesiones.length,
    totalCreditos,
    docentesRepetidos,
  };
}

export function puntuarHorario(cuadro: Horario[], prefs: Preferencias): { score: number; metricas: MetricasHorario } {
  const m = metricasHorario(cuadro, prefs);

  const totalOcupado = m.minutosClase + m.minutosHuecos;
  const h = totalOcupado > 0 ? clamp(m.minutosHuecos / totalOcupado, 0, 1) : 0;

  const mMad = m.minutosClase > 0 ? clamp(m.minutosMadrugada / m.minutosClase, 0, 1) : 0;

  const f =
    prefs.diasLibresPreferidos.length > 0
      ? m.diasLibresLogrados / prefs.diasLibresPreferidos.length
      : 1;

  const p =
    m.totalSesiones > 0 ? clamp(m.coincidenciasDocente / m.totalSesiones, 0, 1) : 1;

  const pesos: number[] = [];
  const valores: number[] = [];
  const agregar = (w: number, v: number): void => {
    if (w > 0) {
      pesos.push(w);
      valores.push(v);
    }
  };
  agregar(prefs.pesoHuecos, 1 - h);
  agregar(prefs.pesoMadrugada, 1 - mMad);
  agregar(prefs.pesoDiasLibres, f);
  agregar(prefs.pesoDocentes, p);

  const pesoTotal = pesos.reduce((a, b) => a + b, 0);
  let score = 50;
  if (pesoTotal > 0) {
    const suma = pesos.reduce((acc, w, i) => acc + w * valores[i], 0);
    score = 100 * (suma / pesoTotal);
  } else {
    score = 100 * (1 - h);
  }

  const sesiones = cuadro.flatMap((h) => h.opcion.sesiones);
  const porCursoDoc = prefs.docentesPorCurso ?? {};
  let totalEsperadosDoc = 0;
  let coincidenciasEspecificas = 0;
  for (const [cod, mapaT] of Object.entries(porCursoDoc)) {
    for (const [tipo, prof] of Object.entries(mapaT)) {
      if (prof && prof.trim()) {
        totalEsperadosDoc++;
        const match = sesiones.some(
          (s: Sesion) =>
            (s.codigo === cod || s.curso === cod) &&
            s.tipo === tipo &&
            s.docente.toLowerCase().trim().includes(prof.toLowerCase().trim())
        );
        if (match) coincidenciasEspecificas++;
      }
    }
  }

  if (totalEsperadosDoc > 0) {
    const ratioDocentes = coincidenciasEspecificas / totalEsperadosDoc;
    score += ratioDocentes * 45;
  }

  if (prefs.perfilAcademico === "compacto") {
    if (m.diasConClase.length <= 3) {
      score += 40;
    } else if (m.diasConClase.length === 4) {
      score += 15;
    } else {
      score -= 25;
    }
  } else if (prefs.perfilAcademico === "equilibrado") {
    if (m.diasConClase.length === 4) {
      score += 35;
    } else if (m.diasConClase.length === 3) {
      score += 20;
    }
  } else if (prefs.perfilAcademico === "finde") {
    if (m.diasConClase.includes("SAB")) {
      score += 45;
    } else {
      score -= 20;
    }
  }

  if (prefs.creditosMax > 0 && m.totalCreditos > prefs.creditosMax) {
    score *= 0.6;
  } else if (prefs.creditosMin > 0 && m.totalCreditos < prefs.creditosMin) {
    const deficit = prefs.creditosMin - m.totalCreditos;
    score *= Math.max(0.3, 1 - deficit * 0.15);
  }

  return { score: Math.round(clamp(score, 0, 100)), metricas: m };
}

export function calcularAdvertencias(cuadro: Horario[], prefs: Preferencias): string[] {
  const advertencias: string[] = [];
  const sesiones = cuadro.flatMap((h) => h.opcion.sesiones);
  if (sesiones.length === 0) return advertencias;

  // 1. Turnos o vacantes llenas
  const tieneLlenos = sesiones.some((s) => s.esLleno);
  if (tieneLlenos) {
    advertencias.push("Incluye turnos o vacantes agotadas/llenas");
  }

  // 2. Días solicitados libres
  if (prefs.diasLibresPreferidos.length > 0) {
    const diasConClase = new Set(sesiones.map((s) => s.dia));
    const diasViolados = prefs.diasLibresPreferidos.filter((d) => diasConClase.has(d));
    if (diasViolados.length > 0) {
      const nombresDias = diasViolados.map((d) => DIA_LABEL[d]).join(", ");
      advertencias.push(`Tiene clases en días marcados para descansar: ${nombresDias}`);
    }
  }

  // 3. Madrugar / Hora mínima de clase
  if (prefs.horaMinimaClase > 0) {
    const minHora = Math.min(...sesiones.map((s) => s.inicio));
    if (minHora < prefs.horaMinimaClase) {
      advertencias.push(`Tiene clases a las ${fmtHora(minHora, false)} (antes de tu hora ideal ${fmtHora(prefs.horaMinimaClase, false)})`);
    }
  }

  // 4. Hora tope máxima
  if (prefs.restricciones.horaMax > 0) {
    const maxHora = Math.max(...sesiones.map((s) => s.fin));
    if (maxHora > prefs.restricciones.horaMax) {
      advertencias.push(`Supera la hora límite de salida (termina a las ${fmtHora(maxHora, false)})`);
    }
  }

  // 5. Horas muertas (huecos)
  const metricas = metricasHorario(cuadro, prefs);
  if (metricas.minutosHuecos > 10) {
    advertencias.push(`Contiene ${fmtDuracion(metricas.minutosHuecos)} de tiempo muerto (huecos) entre clases`);
  }

  // 6. Max horas por día
  if (prefs.restricciones.maxHorasDia > 0) {
    const porDia = new Map<Dia, number>();
    for (const s of sesiones) {
      porDia.set(s.dia, (porDia.get(s.dia) ?? 0) + (s.fin - s.inicio));
    }
    const tope = prefs.restricciones.maxHorasDia * 60;
    const diasExcedidos = [...porDia.entries()].filter(([, m]) => m > tope);
    if (diasExcedidos.length > 0) {
      const listaStr = diasExcedidos.map(([d, m]) => `${DIA_LABEL[d]} (${fmtDuracion(m)})`).join(", ");
      advertencias.push(`Excede tu límite de ${prefs.restricciones.maxHorasDia}h por día en: ${listaStr}`);
    }
  }

  // 7. Bloques personales
  const bloques = prefs.restricciones.bloquesPersonales ?? [];
  if (bloques.length > 0) {
    const violados = new Set<string>();
    for (const s of sesiones) {
      for (const b of bloques) {
        if (b.dia === s.dia && b.inicio < s.fin && s.inicio < b.fin) {
          violados.add(b.titulo || "Bloque personal");
        }
      }
    }
    if (violados.size > 0) {
      advertencias.push(`Se cruza con tu bloque reservado: ${[...violados].join(", ")}`);
    }
  }

  // 8. Docentes específicos por curso
  const porCurso = prefs.docentesPorCurso ?? {};
  const docentesFallados: string[] = [];
  for (const h of cuadro) {
    const docEsperadoMap = porCurso[h.curso.codigo];
    if (docEsperadoMap) {
      for (const s of h.opcion.sesiones) {
        const esp = docEsperadoMap[s.tipo];
        if (esp && !s.docente.toLowerCase().includes(esp.toLowerCase().trim())) {
          docentesFallados.push(`${h.curso.nombre} (${s.tipo})`);
        }
      }
    }
  }
  if (docentesFallados.length > 0) {
    advertencias.push(`No coincide con el docente preferido en: ${[...new Set(docentesFallados)].join(", ")}`);
  }

  return advertencias;
}