import type { Curso, Dia, Horario, Opcion, Preferencias, ResultadoGeneracion, Restricciones } from "./model";
import { DIA_INDEX } from "./parser";
import { puntuarHorario, calcularAdvertencias } from "./scoring";
import type { MetricasHorario } from "./scoring";

export interface GenerarOpciones {
  maxResultados?: number;
  maxMs?: number;
  onProgreso?: (hecho: number, considerados: number) => void;
  fijados?: Record<string, string>;
}

interface Ocupado {
  [dia: number]: { inicio: number; fin: number }[];
}

function filasOcupado(o: Ocupado, dia: Dia): { inicio: number; fin: number }[] {
  return (o[DIA_INDEX[dia]] ??= []);
}

function opcionConflicta(opcion: Opcion, ocupado: Ocupado): boolean {
  for (const s of opcion.sesiones) {
    const filas = filasOcupado(ocupado, s.dia);
    for (const f of filas) {
      if (f.inicio < s.fin && s.inicio < f.fin) return true;
    }
  }
  return false;
}

function opcionConflictoInterno(opcion: Opcion): boolean {
  const porDia = new Map<Dia, { inicio: number; fin: number }[]>();
  for (const s of opcion.sesiones) {
    const arr = porDia.get(s.dia) ?? [];
    arr.push({ inicio: s.inicio, fin: s.fin });
    porDia.set(s.dia, arr);
  }
  for (const arr of porDia.values()) {
    arr.sort((a, b) => a.inicio - b.inicio);
    for (let i = 1; i < arr.length; i++) {
      if (arr[i - 1].fin > arr[i].inicio) return true;
    }
  }
  return false;
}

function opcionViolaRestricciones(opcion: Opcion, rest: Restricciones): boolean {
  if (rest.sinTurnosLlenos && (opcion.esLleno || opcion.sesiones.some((s) => s.esLleno))) {
    return true;
  }
  const prohibeDia = rest.sinDias.length > 0;
  const topeHora = rest.horaMax > 0;
  const bloques = rest.bloquesPersonales ?? [];
  for (const s of opcion.sesiones) {
    if (prohibeDia && rest.sinDias.includes(s.dia)) return true;
    if (topeHora && s.fin > rest.horaMax) return true;
    for (const b of bloques) {
      if (b.dia === s.dia && b.inicio < s.fin && s.inicio < b.fin) return true;
    }
  }
  return false;
}

function rutaExcedeHorasDiarias(rest: Restricciones, ruta: Horario[]): boolean {
  if (rest.maxHorasDia <= 0) return false;
  const porDia = new Map<Dia, number>();
  for (const h of ruta) {
    for (const s of h.opcion.sesiones) {
      porDia.set(s.dia, (porDia.get(s.dia) ?? 0) + (s.fin - s.inicio));
    }
  }
  const tope = rest.maxHorasDia * 60;
  for (const m of porDia.values()) {
    if (m > tope) return true;
  }
  return false;
}

export function generarHorarios(
  cursos: Curso[],
  prefs: Preferencias,
  opciones?: GenerarOpciones
): ResultadoGeneracion {
  const t0 = Date.now();
  const maxResultados = opciones?.maxResultados ?? 100;
  const maxMs = opciones?.maxMs ?? 3000;
  const onProgreso = opciones?.onProgreso;
  const fijados = opciones?.fijados;

  const ordenados = [...cursos]
    .filter((c) => c.opciones.length > 0)
    .sort((a, b) => a.opciones.length - b.opciones.length);

  const optimos: Array<{ horario: Horario[]; score: number; m: MetricasHorario }> = [];
  const ocupado: Ocupado = {};
  const ruta: Horario[] = [];
  let considerados = 0;
  let podados = 0;
  let limite = false;
  let ultimoReporte = 0;

  const pushMejor = (): void => {
    const cuadro = ruta.map((h) => h);
    const { score, metricas } = puntuarHorario(cuadro, prefs);
    optimos.push({ horario: cuadro, score, m: metricas });
    optimos.sort((a, b) => b.score - a.score || b.m.minutosHuecos - a.m.minutosHuecos);
    if (optimos.length > maxResultados) optimos.length = maxResultados;
    if (onProgreso) {
      const ahora = Date.now();
      if (ahora - ultimoReporte > 60) {
        ultimoReporte = ahora;
        onProgreso(optimos.length, considerados);
      }
    }
  };

  const paso = (idx: number): boolean => {
    if (Date.now() - t0 > maxMs) {
      limite = true;
      return false;
    }
    if (idx === ordenados.length) {
      considerados++;
      pushMejor();
      return true;
    }
    const curso = ordenados[idx];
    let opcionesCurso = curso.opciones.filter((o) => !opcionConflictoInterno(o));
    const pin = fijados?.[curso.codigo];
    if (pin) {
      const fijas = opcionesCurso.filter((o) => o.id === pin);
      if (fijas.length > 0) opcionesCurso = fijas;
    }
    for (const opcion of opcionesCurso) {
      if (opcionConflicta(opcion, ocupado)) {
        podados++;
        continue;
      }
      if (opcionViolaRestricciones(opcion, prefs.restricciones)) {
        podados++;
        continue;
      }
      const antes: Record<number, number> = {};
      for (const s of opcion.sesiones) {
        const idxDia = DIA_INDEX[s.dia];
        antes[idxDia] = (ocupado[idxDia] ?? []).length;
        (ocupado[idxDia] ??= []).push({ inicio: s.inicio, fin: s.fin });
      }
      ruta.push({ curso, opcion });
      if (rutaExcedeHorasDiarias(prefs.restricciones, ruta)) {
        podados++;
        ruta.pop();
        for (const s of opcion.sesiones) {
          const idxDia = DIA_INDEX[s.dia];
          (ocupado[idxDia] ?? []).length = antes[idxDia];
        }
        continue;
      }
      const continua = paso(idx + 1);
      ruta.pop();
      for (const s of opcion.sesiones) {
        const idxDia = DIA_INDEX[s.dia];
        (ocupado[idxDia] ?? []).length = antes[idxDia];
      }
      if (!continua) return false;
    }
    return true;
  };

  let flexibilizado = false;
  const restriccionesRelajadas: string[] = [];

  paso(0);

  // Si con las restricciones estrictas no se encontró NINGÚN horario, pero hay restricciones activadas,
  // realizamos una búsqueda de fuerza mayor flexibilizando las reglas estrictas para asegurar que se muestren los cursos completos.
  const tieneRestriccionesActivas =
    prefs.restricciones.sinTurnosLlenos ||
    prefs.restricciones.sinDias.length > 0 ||
    prefs.restricciones.horaMax > 0 ||
    prefs.restricciones.maxHorasDia > 0 ||
    (prefs.restricciones.bloquesPersonales?.length ?? 0) > 0;

  if (optimos.length === 0 && tieneRestriccionesActivas) {
    flexibilizado = true;
    if (prefs.restricciones.sinTurnosLlenos) restriccionesRelajadas.push("Se permitieron turnos o vacantes llenas");
    if (prefs.restricciones.sinDias.length > 0) restriccionesRelajadas.push("Se asignaron clases en días marcados como libres");
    if (prefs.restricciones.horaMax > 0) restriccionesRelajadas.push("Se excedió la hora tope de salida");
    if (prefs.restricciones.maxHorasDia > 0) restriccionesRelajadas.push("Se excedió el límite de horas por día");
    if ((prefs.restricciones.bloquesPersonales?.length ?? 0) > 0) restriccionesRelajadas.push("Se permitieron cruces con bloques personales");

    const pasoRelajado = (idx: number): boolean => {
      if (Date.now() - t0 > maxMs) return false;
      if (idx === ordenados.length) {
        considerados++;
        const cuadro = ruta.map((h) => h);
        const { score, metricas } = puntuarHorario(cuadro, prefs);
        optimos.push({ horario: cuadro, score, m: metricas });
        optimos.sort((a, b) => b.score - a.score || b.m.minutosHuecos - a.m.minutosHuecos);
        if (optimos.length > maxResultados) optimos.length = maxResultados;
        return true;
      }
      const curso = ordenados[idx];
      let opcionesCurso = curso.opciones.filter((o) => !opcionConflictoInterno(o));
      const pin = fijados?.[curso.codigo];
      if (pin) {
        const fijas = opcionesCurso.filter((o) => o.id === pin);
        if (fijas.length > 0) opcionesCurso = fijas;
      }
      for (const opcion of opcionesCurso) {
        if (opcionConflicta(opcion, ocupado)) continue;
        const antes: Record<number, number> = {};
        for (const s of opcion.sesiones) {
          const idxDia = DIA_INDEX[s.dia];
          antes[idxDia] = (ocupado[idxDia] ?? []).length;
          (ocupado[idxDia] ??= []).push({ inicio: s.inicio, fin: s.fin });
        }
        ruta.push({ curso, opcion });
        const continua = pasoRelajado(idx + 1);
        ruta.pop();
        for (const s of opcion.sesiones) {
          const idxDia = DIA_INDEX[s.dia];
          (ocupado[idxDia] ?? []).length = antes[idxDia];
        }
        if (!continua) return false;
      }
      return true;
    };

    pasoRelajado(0);
  }

  const horarios = optimos.map((o) => {
    const sesiones = o.horario.flatMap((h) => h.opcion.sesiones);
    const diasConClase = o.m.diasConClase;
    const advertencias = calcularAdvertencias(o.horario, prefs);
    return {
      cuadro: o.horario,
      score: o.score,
      totalMinutos: o.m.minutosClase,
      minutosHuecos: o.m.minutosHuecos,
      diasConClase,
      sesiones,
      totalCreditos: o.horario.reduce((a, h) => a + (h.curso.creditos ?? 0), 0),
      docentesRepetidos: o.m.docentesRepetidos,
      nombre: o.horario.map((h) => `${h.curso.nombre} (${h.opcion.seccion || h.opcion.nrc})`).join(", "),
      advertencias,
    };
  });

  return {
    horarios,
    considerados,
    podados,
    limite,
    tiempoMs: Date.now() - t0,
    flexibilizado,
    restriccionesRelajadas,
  };
}