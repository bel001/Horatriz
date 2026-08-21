import { useMemo, useRef, useState } from "react";
import type {
  Curso,
  HorarioResult,
  Preferencias,
  ResultadoGeneracion,
  Tipo,
} from "@/lib/model";
import { SIN_RESTRICCIONES, TIPO_LABEL } from "@/lib/model";
import { fmtDuracion } from "@/lib/time";
import type { GrupoProf } from "@/lib/groups";
import { gruposDeCurso, profesDeGrupoCompatibles, todosLosProfesDeTipo } from "@/lib/groups";
import { toPng } from "html-to-image";
import { descargarIcs } from "@/lib/ical";
import { Badge, Btn, Card, Checkbox, Paso, inputCls } from "../ui";
import { PreferenciasPanel } from "../PreferenciasPanel";
import { GridSemana, dotDeCurso } from "../GridSemana";
import { ComparadorHorarios } from "../ComparadorHorarios";
import type { BorradorGuardado } from "@/lib/hooks/useEstadoHorarios";

export function PasoCursosResultados({
  cursos,
  seleccionados,
  setSeleccionados,
  creditos,
  setCreditos,
  docPref,
  setDocPref,
  fijados,
  setFijados,
  colores,
  prefs,
  setPrefs,
  onEliminarCurso,
  sinLiga,
  compartido,
  onCompartir,
  resultado,
  borradores,
  onGuardarBorrador,
  onEliminarBorrador,
  onVolver,
  onAgregarMas,
}: {
  cursos: Curso[];
  seleccionados: Set<string>;
  setSeleccionados: React.Dispatch<React.SetStateAction<Set<string>>>;
  creditos: Record<string, number>;
  setCreditos: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  docPref: Record<string, Partial<Record<Tipo, string>>>;
  setDocPref: React.Dispatch<React.SetStateAction<Record<string, Partial<Record<Tipo, string>>>>>;
  fijados: Record<string, string>;
  setFijados: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  colores: Record<string, string>;
  prefs: Preferencias;
  setPrefs: (p: Preferencias) => void;
  onEliminarCurso: (codigo: string) => void;
  sinLiga: number;
  compartido: boolean;
  onCompartir: () => void;
  resultado: ResultadoGeneracion | null;
  borradores: BorradorGuardado[];
  onGuardarBorrador: (nombre: string, horario: HorarioResult) => void;
  onEliminarBorrador: (id: string) => void;
  onVolver: () => void;
  onAgregarMas?: () => void;
}) {
  const [idxSeleccionado, setIdxSeleccionado] = useState<number>(0);
  const [tabSidebar, setTabSidebar] = useState<"cursos" | "preferencias">("cursos");
  const [tabMovilPrincipal, setTabMovilPrincipal] = useState<"horario" | "config">("horario");
  const [mostrandoComparador, setMostrandoComparador] = useState(false);
  const [maximizado, setMaximizado] = useState(false);
  const [nombreBorrador, setNombreBorrador] = useState("");
  const [guardadoExitosa, setGuardadoExitosa] = useState(false);
  const [busquedaCurso, setBusquedaCurso] = useState("");
  const [borradorVer, setBorradorVer] = useState<BorradorGuardado | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const modalGridRef = useRef<HTMLDivElement>(null);
  const [configAbiertas, setConfigAbiertas] = useState<Set<string>>(new Set());
  const [resultadoVistoRef, setResultadoVistoRef] = useState<ResultadoGeneracion | null>(null);
  const hayResultadoNuevo = tabMovilPrincipal === "config" && resultado !== null && resultado !== resultadoVistoRef;

  const cursosFiltrados = useMemo(() => {
    const q = busquedaCurso.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const base = q
      ? cursos.filter((c) => {
          const nombreNorm = c.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const codigoNorm = c.codigo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return nombreNorm.includes(q) || codigoNorm.includes(q);
        })
      : cursos;

    return [...base].sort((a, b) => {
      const aSel = seleccionados.has(a.codigo);
      const bSel = seleccionados.has(b.codigo);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return (a.nombre || a.codigo).localeCompare(b.nombre || b.codigo, "es");
    });
  }, [cursos, busquedaCurso, seleccionados]);

  const gruposPorCurso = useMemo(() => {
    const map: Record<string, GrupoProf[]> = {};
    for (const c of cursos) {
      map[c.codigo] = gruposDeCurso(c);
    }
    return map;
  }, [cursos]);

  const toggleSeleccion = (codigo: string) => {
    setSeleccionados((prev) => {
      const n = new Set(prev);
      if (n.has(codigo)) n.delete(codigo);
      else n.add(codigo);
      return n;
    });
  };

  const seleccionarTodos = (val: boolean) => {
    setSeleccionados(val ? new Set(cursos.map((c) => c.codigo)) : new Set());
  };

  const totalCreditos = cursos
    .filter((c) => seleccionados.has(c.codigo))
    .reduce((sum, c) => sum + (creditos[c.codigo] ?? c.creditos ?? 0), 0);

  const profesoresNoCoincidentes = useMemo(() => {
    if (!resultado || resultado.horarios.length === 0) return [];
    const porCurso = prefs.docentesPorCurso ?? {};
    const noEncontrados: { curso: string; tipo: Tipo; docente: string }[] = [];

    const todasSesionesGeneradas = resultado.horarios.flatMap((h) => h.sesiones);

    for (const [cod, mapaT] of Object.entries(porCurso)) {
      const cursoObj = cursos.find((c) => c.codigo === cod);
      const nombreCurso = cursoObj?.nombre || cod;

      for (const [tipoKey, profNombre] of Object.entries(mapaT)) {
        if (profNombre && profNombre.trim()) {
          const tipo = tipoKey as Tipo;
          const existeEnResultado = todasSesionesGeneradas.some(
            (s) =>
              (s.codigo === cod || s.curso === cod) &&
              s.tipo === tipo &&
              s.docente.toLowerCase().trim().includes(profNombre.toLowerCase().trim())
          );
          if (!existeEnResultado) {
            noEncontrados.push({
              curso: nombreCurso,
              tipo,
              docente: profNombre,
            });
          }
        }
      }
    }

    return noEncontrados;
  }, [resultado, prefs.docentesPorCurso, cursos]);

  const handleDocenteChange = (codigo: string, tipo: Tipo, docenteNombre: string) => {
    const nextDocPref = {
      ...docPref,
      [codigo]: {
        ...(docPref[codigo] ?? {}),
        [tipo]: docenteNombre,
      },
    };
    setDocPref(nextDocPref);
    setPrefs({
      ...prefs,
      pesoDocentes: 1,
      docentesPorCurso: nextDocPref,
    });
    setIdxSeleccionado(0);
  };

  const horariosFiltrados = resultado?.horarios ?? [];

  const horarioActual = horariosFiltrados[idxSeleccionado] ?? horariosFiltrados[0];

  const exportarPng = async () => {
    if (!gridRef.current) return;
    try {
      const dataUrl = await toPng(gridRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `horario_${horarioActual?.score ?? 100}pts.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert("Error al exportar imagen PNG.");
    }
  };

  const exportarIcs = () => {
    if (horarioActual) {
      descargarIcs(horarioActual, `horario_${horarioActual.score}pts.ics`);
    }
  };

  const handleGuardar = () => {
    if (horarioActual) {
      const nombre = nombreBorrador.trim() || `Horario ${new Date().toLocaleDateString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`;
      onGuardarBorrador(nombre, horarioActual);
      setNombreBorrador("");
      setGuardadoExitosa(true);
      setTimeout(() => setGuardadoExitosa(false), 2500);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Paso
        n={3}
        titulo="Generador de Horarios"
        descripcion="Ajusta cursos y reglas, visualiza horarios optimizados."
      />

      {/* Bar de Acciones Superior */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-2.5 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Badge color="emerald">
            {seleccionados.size}/{cursos.length} cursos
          </Badge>
          <Badge color="sky">
            {totalCreditos > 0 ? `${totalCreditos} crd.` : "0 crd."}
          </Badge>
          {resultado && (
            <Badge color="zinc">
              {horariosFiltrados.length} horarios
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Btn
            variant={maximizado ? "primary" : "secondary"}
            onClick={() => setMaximizado(!maximizado)}
            title="Alternar vista ampliada"
            className="text-[11px] py-1 px-2 hidden sm:inline-flex"
          >
            {maximizado ? "↙️ Normal" : "↔️ Ampliar"}
          </Btn>
          <Btn variant="secondary" onClick={onCompartir} className="text-[11px] py-1 px-2">
            {compartido ? "✅ Copiado" : "🔗"}<span className="hidden sm:inline ml-1">Compartir</span>
          </Btn>
          <Btn
            variant="secondary"
            onClick={() => setMostrandoComparador(true)}
            disabled={!resultado || resultado.horarios.length < 2}
            className="text-[11px] py-1 px-2"
          >
            🔀<span className="hidden sm:inline ml-1">Comparar</span>
          </Btn>
          <Btn variant="secondary" onClick={onVolver} className="text-[11px] py-1 px-2">
            ← <span className="hidden sm:inline">Volver</span>
          </Btn>
        </div>
      </div>


      {/* Selector Principal de Vista en Celulares (Parrilla de Horarios vs Configuración de Cursos) */}
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-zinc-200/80 p-1.5 dark:bg-zinc-800/80 lg:hidden shadow-xs">
        <button
          type="button"
          onClick={() => {
            setTabMovilPrincipal("horario");
            setResultadoVistoRef(resultado);
          }}
          className={`relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all ${
            tabMovilPrincipal === "horario"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          }`}
        >
          {hayResultadoNuevo && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
          )}
          <span>📅</span> Ver Horario
          {resultado && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-mono">
              {horariosFiltrados.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTabMovilPrincipal("config")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all ${
            tabMovilPrincipal === "config"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          }`}
        >
          <span>📚</span> Cursos & Filtros
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-mono">
            {seleccionados.size}
          </span>
        </button>
      </div>

      {/* Grid Principal de 2 Columnas: Lateral Filtros/Cursos + Principal Resultados */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* COLUMNA IZQUIERDA (Sidebar - Cursos, Bloques y Preferencias) */}
        {!maximizado && (
          <div className={`space-y-4 lg:col-span-4 ${tabMovilPrincipal === "config" ? "block" : "hidden lg:block"}`}>
            {/* Pestañas del Sidebar */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setTabSidebar("cursos")}
                className={`border-b-2 px-4 py-2 text-xs font-black transition-colors ${
                  tabSidebar === "cursos"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                    : "border-transparent text-zinc-700 hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-white"
                }`}
              >
                📚 Cursos ({cursos.length})
              </button>
              <button
                type="button"
                onClick={() => setTabSidebar("preferencias")}
                className={`border-b-2 px-4 py-2 text-xs font-black transition-colors ${
                  tabSidebar === "preferencias"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                    : "border-transparent text-zinc-700 hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-white"
                }`}
              >
                ⚙️ Preferencias & Bloques
              </button>
            </div>

            {tabSidebar === "cursos" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                    Selecciona y configura tus asignaturas:
                  </span>
                  <button
                    type="button"
                    onClick={() => seleccionarTodos(seleccionados.size < cursos.length)}
                    className="font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    {seleccionados.size < cursos.length ? "Marcar todos" : "Desmarcar"}
                  </button>
                </div>

                {/* Buscador de Cursos */}
                <div className="relative">
                  <input
                    type="text"
                    value={busquedaCurso}
                    onChange={(e) => setBusquedaCurso(e.target.value)}
                    placeholder="🔍 Buscar curso por nombre o código..."
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pl-9 pr-8 text-xs outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-emerald-900/40"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-60">
                    🔍
                  </span>
                  {busquedaCurso && (
                    <button
                      type="button"
                      onClick={() => setBusquedaCurso("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      title="Limpiar búsqueda"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filtro Rápido por Turno Preferido */}
                <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-[11px] no-scrollbar">
                  <span className="font-bold text-zinc-400 shrink-0 text-[10px]">Turno:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPrefs({
                        ...prefs,
                        pesoMadrugada: 0,
                        horaMinimaClase: 480,
                        restricciones: { ...prefs.restricciones, horaMax: 0 },
                      })
                    }
                    className={`rounded-lg px-2 py-0.5 font-semibold transition-all shrink-0 text-[11px] ${
                      prefs.horaMinimaClase < 420 || (prefs.horaMinimaClase === 480 && prefs.restricciones.horaMax === 0)
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    🌐 Todos
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPrefs({
                        ...prefs,
                        pesoMadrugada: 1,
                        horaMinimaClase: 420,
                        restricciones: { ...prefs.restricciones, horaMax: 840 },
                      })
                    }
                    className={`rounded-lg px-2 py-0.5 font-semibold transition-all shrink-0 text-[11px] ${
                      prefs.horaMinimaClase >= 420 && prefs.restricciones.horaMax === 840
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    ☀️ Mañana
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPrefs({
                        ...prefs,
                        pesoMadrugada: 1,
                        horaMinimaClase: 780,
                        restricciones: { ...prefs.restricciones, horaMax: 1080 },
                      })
                    }
                    className={`rounded-lg px-2 py-0.5 font-semibold transition-all shrink-0 text-[11px] ${
                      prefs.horaMinimaClase >= 780 && prefs.restricciones.horaMax === 1080
                        ? "bg-sky-500 text-white shadow-xs"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    ⛅ Tarde
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPrefs({
                        ...prefs,
                        pesoMadrugada: 1,
                        horaMinimaClase: 1080,
                        restricciones: { ...prefs.restricciones, horaMax: 1350 },
                      })
                    }
                    className={`rounded-lg px-2 py-0.5 font-semibold transition-all shrink-0 text-[11px] ${
                      prefs.horaMinimaClase >= 1080 && prefs.restricciones.horaMax === 1350
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    🌙 Noche
                  </button>
                </div>

                {busquedaCurso.trim() && (
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Mostrando <span className="font-bold text-emerald-600 dark:text-emerald-400">{cursosFiltrados.length}</span> de {cursos.length} cursos
                  </div>
                )}

                {cursosFiltrados.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    No se encontraron cursos que coincidan con &quot;<span className="font-semibold text-zinc-800 dark:text-zinc-200">{busquedaCurso}</span>&quot;.
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setBusquedaCurso("")}
                        className="font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        Limpiar búsqueda
                      </button>
                    </div>
                  </div>
                ) : (
                  cursosFiltrados.map((curso) => {
                  const sel = seleccionados.has(curso.codigo);
                  const grupos = gruposDeCurso(curso);
                  const tiposPresentes: Tipo[] = [];
                  for (const t of ["T", "P", "L"] as const) {
                    if (grupos.some((g) => (g.profs[t]?.length ?? 0) > 0)) tiposPresentes.push(t);
                  }

                  return (
                    <Card
                      key={curso.codigo}
                      className={`transition-all ${
                        sel
                          ? "border-emerald-200 bg-white dark:border-emerald-900/60 dark:bg-zinc-900"
                          : "opacity-60 bg-zinc-50 dark:bg-zinc-950"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            checked={sel}
                            onChange={() => toggleSeleccion(curso.codigo)}
                            label=""
                          />
                          <span
                            className={`h-3 w-3 shrink-0 rounded-full ${dotDeCurso(curso.codigo, colores)}`}
                          />
                          <div>
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-50">
                              {curso.nombre || curso.codigo}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                              <Badge color="zinc">{curso.codigo}</Badge>
                              <span>{curso.opciones.length} opciones</span>
                              <Badge color={(creditos[curso.codigo] ?? curso.creditos ?? 0) > 0 ? "sky" : "zinc"}>
                                {(creditos[curso.codigo] ?? curso.creditos ?? 0) > 0
                                  ? `${creditos[curso.codigo] ?? curso.creditos} crd.`
                                  : "Sin crd. (opcional)"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span className="text-[10px] font-medium">Crd:</span>
                            <input
                              type="number"
                              min={0}
                              max={15}
                              className="w-11 rounded-lg border border-zinc-200 bg-white px-1 py-0.5 text-center font-bold dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 text-xs focus:border-emerald-500 focus:outline-none"
                              value={creditos[curso.codigo] ?? curso.creditos ?? 0}
                              onChange={(e) =>
                                setCreditos((prev) => ({
                                  ...prev,
                                  [curso.codigo]: parseInt(e.target.value || "0", 10),
                                }))
                              }
                              title="Créditos de la asignatura (opcional)"
                            />
                          </div>
                          <button
                            type="button"
                            title="Eliminar curso"
                            onClick={() => onEliminarCurso(curso.codigo)}
                            className="rounded p-1 text-zinc-400 hover:text-rose-600"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Preferencias de docente y fijar opción — Acordeón */}
                      {sel && (tiposPresentes.length > 0 || curso.opciones.length > 1) && (
                        <div className="mt-3 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                          <button
                            type="button"
                            onClick={() => setConfigAbiertas((prev) => {
                              const n = new Set(prev);
                              if (n.has(curso.codigo)) n.delete(curso.codigo);
                              else n.add(curso.codigo);
                              return n;
                            })}
                            className="flex w-full items-center justify-between rounded-lg px-1.5 py-1 text-[11px] font-bold text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 transition-colors"
                          >
                            <span>⚙️ Configuración avanzada</span>
                            <span className="text-zinc-400 text-[10px]">{configAbiertas.has(curso.codigo) ? "▾" : "▸"}</span>
                          </button>
                          {configAbiertas.has(curso.codigo) && (
                            <div className="mt-2 space-y-2 animate-fade-in">
                              {tiposPresentes.length > 0 && (
                                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                                  {tiposPresentes.map((tipo) => {
                                    const profes = todosLosProfesDeTipo(curso, tipo);
                                    const profVal = docPref[curso.codigo]?.[tipo] ?? "";
                                    return (
                                      <div key={tipo}>
                                        <span className="mb-0.5 block text-[10px] font-semibold text-zinc-500">
                                          Docente {TIPO_LABEL[tipo]}:
                                        </span>
                                        <select
                                          className={`${inputCls()} py-0.5 text-[11px]`}
                                          value={profVal}
                                          onChange={(e) => handleDocenteChange(curso.codigo, tipo, e.target.value)}
                                        >
                                          <option value="">Cualquiera</option>
                                          {profes.map((p) => (
                                            <option key={p} value={p}>
                                              {p}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {curso.opciones.length > 1 && (
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
                                    📌 Fijar opción:
                                  </span>
                                  <select
                                    className={`${inputCls()} py-1 text-xs font-semibold`}
                                    value={fijados[curso.codigo] ?? ""}
                                    onChange={(e) =>
                                      setFijados((prev) => ({
                                        ...prev,
                                        [curso.codigo]: e.target.value,
                                      }))
                                    }
                                  >
                                    <option value="">Explorar todas las opciones</option>
                                    {curso.opciones.map((o) => {
                                      const textSecc = o.seccion ? `Secc. ${o.seccion}` : "";
                                      const textNrc = o.nrc ? `NRC: ${o.nrc}` : "";
                                      const esVirt = o.sesiones.some((s) => s.esVirtual || !s.aula || s.aula.toUpperCase() === "NINGUNO");
                                      const textMod = esVirt ? "💻 Virtual" : o.aula && o.aula.toUpperCase() !== "NINGUNO" ? `📍 Aula ${o.aula}` : "";
                                      const labelDetalle = [textSecc, textNrc, textMod].filter(Boolean).join(" · ");
                                      return (
                                        <option key={o.id} value={o.id}>
                                          {labelDetalle || `Opción ${o.id}`} ({o.sesiones.length} ses.)
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                }))}
                {/* Botón para Agregar Más Cursos */}
                {onAgregarMas && (
                  <Btn
                    variant="secondary"
                    className="w-full justify-center py-2.5 font-extrabold border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-400 text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm"
                    onClick={onAgregarMas}
                  >
                    ➕ Agregar más cursos
                  </Btn>
                )}
              </div>
            )}

            {tabSidebar === "preferencias" && (
              <PreferenciasPanel
                prefs={prefs}
                onChange={setPrefs}
                onAplicarPerfil={() => {
                  setIdxSeleccionado(0);
                  setTabMovilPrincipal("horario");
                  setResultadoVistoRef(null);
                }}
              />
            )}
          </div>
        )}

        {/* COLUMNA DERECHA (Panel Principal - Opciones Rankeadas + Grid Semanal) */}
        <div className={`space-y-4 min-w-0 max-w-full ${maximizado ? "lg:col-span-12" : "lg:col-span-8"} ${tabMovilPrincipal === "horario" ? "block" : "hidden lg:block"}`}>
          {/* Banner de Aviso: Docente Solicitado No Disponible en las Opciones Generadas */}
          {profesoresNoCoincidentes.length > 0 && (
            <div className="rounded-2xl border-2 border-amber-400/80 bg-amber-50 p-4 dark:border-amber-700/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 space-y-2 shadow-sm animate-fade-in">
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0">⚠️</span>
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wide text-amber-900 dark:text-amber-100">
                    Aviso de Docente Preferido No Disponible en el Horario
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                    No fue posible incluir al docente solicitado en las combinaciones generadas debido a cruces de horario o vacantes agotadas:
                  </p>
                  <ul className="mt-1.5 list-disc list-inside text-xs font-bold space-y-0.5 text-amber-800 dark:text-amber-300">
                    {profesoresNoCoincidentes.map((p, i) => (
                      <li key={i}>
                        <strong>{p.curso} ({TIPO_LABEL[p.tipo]}):</strong> {p.docente}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Banner de Fuerza Mayor (Restricciones Flexibilizadas) */}
          {resultado && resultado.flexibilizado && (
            <div className="rounded-2xl border-2 border-amber-400/80 bg-amber-50 p-4 dark:border-amber-700/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 space-y-2 shadow-sm">
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0">⚠️</span>
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wide text-amber-900 dark:text-amber-100">
                    Aviso de Fuerza Mayor: Restricciones Flexibilizadas
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    Para poder ofrecer combinaciones con <strong>todos tus cursos seleccionados completos</strong>, se flexibilizaron automáticamente las siguientes reglas strictly:
                  </p>
                  <ul className="mt-1.5 list-disc list-inside text-xs font-bold space-y-0.5 text-amber-800 dark:text-amber-300">
                    {resultado.restriccionesRelajadas?.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Filtros Rápidos + Carrusel de Opciones Generadas */}
          {resultado && resultado.horarios.length > 0 ? (
            <Card className="space-y-4">
              {/* Encabezado con Botones de Exportar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  🎯 Combinaciones ({resultado.horarios.length})
                </span>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Btn variant="secondary" onClick={exportarIcs} title="Descargar archivo .ics" className="text-[11px] py-1 px-2 sm:text-sm sm:py-2.5 sm:px-5">
                    📅 iCal
                  </Btn>
                  <Btn variant="primary" onClick={exportarPng} title="Exportar horario como imagen PNG" className="text-[11px] py-1 px-2 sm:text-sm sm:py-2.5 sm:px-5">
                    🖼️ PNG
                  </Btn>
                </div>
              </div>

              {/* Selector de Opción Móvil (Stepper Prev/Next) */}
              <div className="flex items-center justify-between rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800/60 sm:hidden">
                <button
                  type="button"
                  disabled={idxSeleccionado === 0}
                  onClick={() => setIdxSeleccionado((prev) => Math.max(0, prev - 1))}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-xs disabled:opacity-40 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  ◀ Ant.
                </button>
                <div className="text-center">
                  <div className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                    Opción #{idxSeleccionado + 1} de {horariosFiltrados.length}
                  </div>
                  <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                    {horarioActual?.score}% Coincidencia
                  </div>
                </div>
                <button
                  type="button"
                  disabled={idxSeleccionado === horariosFiltrados.length - 1}
                  onClick={() => setIdxSeleccionado((prev) => Math.min(horariosFiltrados.length - 1, prev + 1))}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-xs disabled:opacity-40 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  Sig. ▶
                </button>
              </div>

              {/* Selector de opciones rankeadas (#1, #2, #3...) */}
              <div className="flex w-full min-w-0 max-w-full items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {horariosFiltrados.map((item, idx) => {
                  const activo = idx === idxSeleccionado;
                  const tieneAdv = (item.advertencias?.length ?? 0) > 0;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setIdxSeleccionado(idx)}
                      className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all border ${
                        activo
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
                          : "bg-zinc-200 text-zinc-900 border-zinc-300 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700"
                      }`}
                    >
                      <span>
                        {tieneAdv ? "⚠️ " : ""}Opción #{idx + 1}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                          activo
                            ? "bg-black/30 text-white"
                            : "bg-white text-zinc-900 border border-zinc-300 dark:bg-zinc-950 dark:text-emerald-400 dark:border-zinc-700"
                        }`}
                      >
                        {item.score}%
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Detalle de la Opción Seleccionada */}
              {horarioActual && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/40">
                    <div>
                      <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                        Horario Opción #{idxSeleccionado + 1} ({horarioActual.score}% match)
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {horarioActual.totalCreditos} créditos totales · {horarioActual.diasConClase.length} días de clase · {fmtDuracion(horarioActual.totalMinutos)} lectivas
                      </p>
                    </div>
                    <Badge color={horarioActual.score >= 80 ? "emerald" : horarioActual.score >= 50 ? "amber" : "rose"}>
                      {horarioActual.minutosHuecos > 0 ? `⏳ Huecos: ${fmtDuracion(horarioActual.minutosHuecos)}` : "✨ Sin huecos"}
                    </Badge>
                  </div>

                  {/* Advertencias / Observaciones de Preferencias en el Horario Actual */}
                  {horarioActual.advertencias && horarioActual.advertencias.length > 0 && (
                    <div className="rounded-xl border border-amber-300/80 bg-amber-50/90 p-3 dark:border-amber-900/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 space-y-1 text-xs">
                      <div className="font-extrabold flex items-center gap-1.5 text-amber-900 dark:text-amber-100">
                        <span>⚠️</span> Observaciones sobre tus preferencias:
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                        {horarioActual.advertencias.map((adv, i) => (
                          <li key={i}>{adv}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Guardar Borrador */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      className={`${inputCls()} text-xs py-1.5 flex-1`}
                      placeholder="Nombre (ej. Plan A)"
                      value={nombreBorrador}
                      onChange={(e) => setNombreBorrador(e.target.value)}
                    />
                    <Btn variant="secondary" onClick={handleGuardar} className="text-xs py-1.5 shrink-0">
                      {guardadoExitosa ? "¡Guardado! 💾" : "💾 Guardar"}
                    </Btn>
                  </div>

                  {/* Grid Semanal con toda la información visible */}
                  <div ref={gridRef} className="p-1 sm:p-2 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
                    <GridSemana
                      sesiones={horarioActual.sesiones}
                      colores={colores}
                      gruposPorCurso={gruposPorCurso}
                      mostrarHuecos={true}
                    />
                  </div>
                </div>
              )}
            </Card>
          ) : seleccionados.size > 0 ? (
            <Card className="p-6 text-center space-y-4 border-2 border-amber-300 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/30 shadow-md">
              <span className="text-4xl">⚠️</span>
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                  No hay horarios disponibles que cumplan el 100% de tus preferencias
                </h3>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Tus asignaturas seleccionadas colisionan entre sí o tus reglas de preferencia activas (turno, días libres o docentes fijados) están descartando todas las opciones posibles.
                </p>
              </div>

              {/* Sugerencias de solución rápida */}
              <div className="rounded-xl bg-white p-4 dark:bg-zinc-900 text-left text-xs space-y-2 border border-amber-200 dark:border-zinc-800 max-w-lg mx-auto shadow-xs">
                <p className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <span>💡</span> Razones más comunes:
                </p>
                <ul className="list-disc list-inside space-y-1 text-zinc-700 dark:text-zinc-300">
                  {prefs.restricciones.sinDias.length > 0 && (
                    <li>Tienes marcados días prohibidos ({prefs.restricciones.sinDias.join(", ")}).</li>
                  )}
                  {prefs.restricciones.horaMax > 0 && (
                    <li>Tienes una hora máxima de salida configurada.</li>
                  )}
                  {Object.keys(fijados).length > 0 && (
                    <li>Tienes opciones fijadas (📌) para algún curso que entra en cruce.</li>
                  )}
                  <li>Los grupos de tus cursos seleccionados se cruzan en el mismo horario.</li>
                </ul>
              </div>

              {/* Botones de Acción */}
              <div className="pt-1 flex flex-wrap justify-center gap-2">
                <Btn
                  variant="primary"
                  onClick={() => {
                    setPrefs({
                      ...prefs,
                      pesoMadrugada: 0,
                      pesoHuecos: 0,
                      pesoDiasLibres: 0,
                      diasLibresPreferidos: [],
                      horaMinimaClase: 0,
                      restricciones: { ...SIN_RESTRICCIONES },
                    });
                    setFijados({});
                  }}
                  className="py-2.5 px-5 font-black text-xs shadow-md"
                >
                  🔄 Restablecer todas las preferencias
                </Btn>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-zinc-400 space-y-2">
              <span className="text-3xl">🧩</span>
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300">
                Selecciona cursos a la izquierda para generar tu horario
              </h3>
              <p className="text-xs">
                Marca al menos 1 asignatura para ver las combinaciones optimizadas.
              </p>
            </Card>
          )}

          {/* Sección de Borradores Guardados */}
          {borradores.length > 0 && (
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  <span>💾</span> Tus Horarios Guardados ({borradores.length})
                </h3>
                <span className="text-[10.5px] text-zinc-400">Haz clic en un horario para abrirlo</span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {borradores.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setBorradorVer(b)}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-all hover:border-emerald-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {b.nombre}
                        </h4>
                        <Badge color={b.horario.score >= 80 ? "emerald" : "amber"}>
                          {b.horario.score}%
                        </Badge>
                      </div>
                      <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400">
                        📅 {b.fecha} · 🎓 {b.horario.totalCreditos} crd. · {b.horario.sesiones.length} clases
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBorradorVer(b);
                        }}
                        className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                      >
                        👁️ Abrir
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEliminarBorrador(b.id);
                        }}
                        className="rounded p-1 text-zinc-400 hover:text-rose-600"
                        title="Eliminar borrador"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal para Visualizar y Exportar Borrador Guardado */}
      {borradorVer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-xs animate-fade-in overflow-hidden">
          <div className="relative flex max-h-[92vh] w-full max-w-[98vw] xl:max-w-7xl flex-col overflow-hidden rounded-2xl bg-white p-3 sm:p-6 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            {/* Encabezado del Modal */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">💾</span>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50">
                    {borradorVer.nombre}
                  </h2>
                  <Badge color={borradorVer.horario.score >= 80 ? "emerald" : "amber"}>
                    {borradorVer.horario.score}% Coincidencia
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Guardado el {borradorVer.fecha} · {borradorVer.horario.totalCreditos} créditos totales · {borradorVer.horario.diasConClase.length} días de clase
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Btn
                  variant="secondary"
                  onClick={() =>
                    descargarIcs(
                      borradorVer.horario,
                      `horario_guardado_${borradorVer.nombre.toLowerCase().replace(/\s+/g, "_")}.ics`
                    )
                  }
                >
                  📅 iCal (.ics)
                </Btn>
                <Btn
                  variant="primary"
                  onClick={async () => {
                    if (modalGridRef.current) {
                      try {
                        const dataUrl = await toPng(modalGridRef.current, { cacheBust: true, pixelRatio: 2 });
                        const link = document.createElement("a");
                        link.download = `horario_${borradorVer.nombre.toLowerCase().replace(/\s+/g, "_")}.png`;
                        link.href = dataUrl;
                        link.click();
                      } catch {
                        alert("Error al exportar imagen PNG.");
                      }
                    }
                  }}
                >
                  🖼️ Exportar PNG
                </Btn>
                <button
                  type="button"
                  onClick={() => setBorradorVer(null)}
                  className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                  title="Cerrar modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Grid del Borrador con 1 sola barra de desplazamiento vertical */}
            <div className="flex-1 min-h-0 overflow-y-auto py-3">
              <div ref={modalGridRef} className="p-2 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
                <GridSemana
                  sesiones={borradorVer.horario.sesiones}
                  colores={colores}
                  gruposPorCurso={gruposPorCurso}
                  mostrarHuecos={true}
                />
              </div>
            </div>

            {/* Botón de cierre inferior */}
            <div className="shrink-0 flex items-center justify-end pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <Btn variant="secondary" onClick={() => setBorradorVer(null)}>
                Cerrar Vista de Borrador
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal Comparador */}
      {mostrandoComparador && resultado && (
        <ComparadorHorarios
          horarios={resultado.horarios}
          colores={colores}
          onCerrar={() => setMostrandoComparador(false)}
        />
      )}
    </div>
  );
}
