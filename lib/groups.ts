import type { Curso, Opcion, Sesion, Tipo } from "./model";

interface GrupoCurso {
  nombre: string;
  codigo: string;
  opciones: Map<string, { liga: string; nrc: string; seccion: string; sesiones: Sesion[] }>;
}

export interface ResultadoAgrupacion {
  cursos: Curso[];
  opcionesSinLiga: number;
  sesionesIgnoradas: number;
}

function normKey(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function obtenerClaveLiga(idLiga: string, liga: string): string {
  const rawId = (idLiga || "").trim();
  const rawLiga = (liga || "").trim();
  const raw = rawId || rawLiga;
  if (!raw) return "";

  // 1. Extraer número de liga si existe (ej: T1, P1, L1 -> 1; T02, P02 -> 2; 1001 -> 1001)
  const numMatch = raw.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    if (!isNaN(num)) return `${num}`;
  }

  // 2. Si es una liga por letras (ej: TA, PA, LA -> a; LIGA A -> a)
  const letterMatch = raw.match(/([A-Za-z]+)/);
  if (letterMatch) {
    const code = letterMatch[1].toLowerCase().replace(/^(t|p|l)/, "");
    if (code) return code;
  }

  return raw.toLowerCase().replace(/\s+/g, "");
}

export function agruparEnCursos(sesiones: Sesion[]): ResultadoAgrupacion {
  const mapaCursos: GrupoCurso[] = [];
  const indexByCodigo = new Map<string, GrupoCurso>();
  const indexByNombre = new Map<string, GrupoCurso>();
  let opcionesSinLiga = 0;
  let sesionesIgnoradas = 0;

  for (const s of sesiones) {
    const codKey = s.codigo ? normKey(s.codigo) : "";
    const nomKey = s.curso ? normKey(s.curso) : "";

    if (!codKey && !nomKey) {
      sesionesIgnoradas++;
      continue;
    }

    let grupo =
      (codKey ? indexByCodigo.get(codKey) : undefined) ??
      (nomKey ? indexByNombre.get(nomKey) : undefined);

    if (!grupo) {
      grupo = {
        nombre: s.curso || s.codigo,
        codigo: s.codigo || s.curso,
        opciones: new Map(),
      };
      mapaCursos.push(grupo);
    }

    if (s.codigo && (!grupo.codigo || grupo.codigo === grupo.nombre)) {
      grupo.codigo = s.codigo;
    }
    if (s.curso && (!grupo.nombre || grupo.nombre === grupo.codigo)) {
      grupo.nombre = s.curso;
    }

    if (codKey) indexByCodigo.set(codKey, grupo);
    if (grupo.codigo) indexByCodigo.set(normKey(grupo.codigo), grupo);
    if (nomKey) indexByNombre.set(nomKey, grupo);
    if (grupo.nombre) indexByNombre.set(normKey(grupo.nombre), grupo);

    const numLiga = obtenerClaveLiga(s.idLiga, s.liga);
    const claveOpcion = numLiga
      ? `liga:${numLiga}`
      : s.nrc
        ? `nrc:${s.nrc}`
        : `spin:${s.id}`;

    let opcion = grupo.opciones.get(claveOpcion);
    if (!opcion) {
      opcion = {
        liga: s.idLiga || s.liga || "",
        nrc: s.nrc,
        seccion: s.seccion,
        sesiones: [],
      };
      grupo.opciones.set(claveOpcion, opcion);
      if (!s.idLiga && !s.liga) opcionesSinLiga++;
    }
    if (!opcion.nrc && s.nrc) opcion.nrc = s.nrc;
    if (!opcion.seccion && s.seccion) opcion.seccion = s.seccion;
    opcion.sesiones.push(s);
  }

  const cursos: Curso[] = [];
  for (const grupo of mapaCursos) {
    const opciones: Opcion[] = [];
    let n = 0;
    let creditosCurso = 0;
    for (const op of grupo.opciones.values()) {
      creditosCurso = Math.max(
        creditosCurso,
        ...op.sesiones.map((s) => s.creditos ?? 0)
      );
      for (const combo of combosPorTipo(op.sesiones)) {
        combo.sort((a, b) => a.dia.localeCompare(b.dia) || a.inicio - b.inicio);
        const docente =
          combo.find((s) => s.docente.trim())?.docente.trim() ?? "";
        const aulas = [...new Set(combo.map((s) => s.aula).filter(Boolean))];
        const nrcs = [...new Set(combo.map((s) => s.nrc).filter(Boolean))];
        const seccs = [...new Set(combo.map((s) => s.seccion).filter(Boolean))];
        const esLleno = combo.some((s) => s.esLleno);
        opciones.push({
          id: `opt-${grupo.codigo || grupo.nombre}-${n++}`.replace(/\s+/g, "-"),
          nrc: nrcs.join("/"),
          seccion: seccs.join("/"),
          liga: op.liga,
          sesiones: combo,
          docente,
          aula: aulas.join(" / "),
          esLleno,
        });
      }
    }
    opciones.sort((a, b) => a.sesiones.length - b.sesiones.length);

    const tieneNrc = opciones.some((o) => o.nrc);
    const ordenar = (): void => {
      opciones.sort(
        (a, b) => a.sesiones.length - b.sesiones.length || a.id.localeCompare(b.id)
      );
    };
    ordenar();
    void tieneNrc;

    cursos.push({
      codigo: (grupo.codigo || grupo.nombre).trim(),
      nombre: grupo.nombre || grupo.codigo,
      opciones,
      creditos: creditosCurso || undefined,
    });
  }

  cursos.sort(
    (a, b) =>
      (a.codigo || a.nombre).localeCompare(b.codigo || b.nombre, "es")
  );

  return { cursos, opcionesSinLiga, sesionesIgnoradas };
}

export function opcionDocumento(opcion: Opcion): { tipos: string[]; nombresNrc: string[] } {
  const tipos = [...new Set(opcion.sesiones.map((s) => s.tipo))];
  const nrcs = [...new Set(opcion.sesiones.map((s) => s.nrc))];
  return { tipos, nombresNrc: nrcs };
}

export function nrcsDeOpcion(opcion: Opcion): Partial<Record<Tipo, string>> {
  const m: Partial<Record<Tipo, string>> = {};
  for (const s of opcion.sesiones) {
    if (s.nrc && !m[s.tipo]) m[s.tipo] = s.nrc;
  }
  return m;
}

export interface GrupoProf {
  clave: string;
  profs: Partial<Record<Tipo, string[]>>;
}

export function gruposDeCurso(curso: Curso): GrupoProf[] {
  const mapa = new Map<string, Partial<Record<Tipo, string[]>>>();
  const orden: string[] = [];
  for (const op of curso.opciones) {
    const clave =
      (op.liga ||
        op.sesiones[0]?.idLiga ||
        op.sesiones[0]?.nrc ||
        "").trim() || "G";
    let g = mapa.get(clave);
    if (!g) {
      g = {};
      mapa.set(clave, g);
      orden.push(clave);
    }
    for (const s of op.sesiones) {
      const d = s.docente.trim();
      if (!d) continue;
      const arr = (g[s.tipo] ??= []);
      if (!arr.includes(d)) arr.push(d);
    }
  }
  return orden.map((clave) => ({ clave, profs: mapa.get(clave)! }));
}

export function profesDeGrupoCompatibles(
  grupos: GrupoProf[],
  pref: Partial<Record<Tipo, string>>,
  tipo: Tipo
): string[] {
  const comp = grupos.filter((g) =>
    (["T", "P", "L"] as Tipo[]).every(
      (ot) => ot === tipo || !pref[ot] || g.profs[ot]?.includes(pref[ot]!)
    )
  );
  return [...new Set(comp.flatMap((g) => g.profs[tipo] ?? []))];
}

export function numeroDeGrupo(grupos: GrupoProf[], s: Sesion): number {
  const clave = (s.idLiga || s.liga || s.nrc || "").trim() || "G";
  const i = grupos.findIndex((g) => g.clave === clave);
  return i === -1 ? grupos.length + 1 : i + 1;
}

export function combosPorTipo(sesiones: Sesion[]): Sesion[][] {
  const porTipo = new Map<string, Sesion[]>();
  for (const s of sesiones) {
    const t = s.tipo || "";
    const arr = porTipo.get(t) ?? [];
    arr.push(s);
    porTipo.set(t, arr);
  }
  if (porTipo.size <= 1 || porTipo.has("")) return [sesiones];
  const combos: Sesion[][] = [[]];
  for (const arr of porTipo.values()) {
    const sig: Sesion[][] = [];
    for (const s of arr) {
      for (const pre of combos) sig.push([...pre, s]);
    }
    combos.length = 0;
    combos.push(...sig);
  }
  return combos;
}