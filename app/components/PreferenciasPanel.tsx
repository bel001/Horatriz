"use client";

import { useState } from "react";
import type { BloquePersonal, Dia, Preferencias, Restricciones } from "@/lib/model";
import { DIAS, DIA_LABEL } from "@/lib/model";
import { fmtHora, toMinutes } from "@/lib/time";
import { Badge, Btn, Card, Checkbox, inputCls } from "./ui";

function activo(p: Preferencias, k: keyof Preferencias): boolean {
  return (p[k] as number) > 0;
}

export function PreferenciasPanel({
  prefs,
  onChange,
}: {
  prefs: Preferencias;
  onChange: (p: Preferencias) => void;
}) {
  // Estado local para agregar un nuevo bloque personal
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoDia, setNuevoDia] = useState<Dia>("LUN");
  const [nuevoInicio, setNuevoInicio] = useState("14:00");
  const [nuevoFin, setNuevoFin] = useState("18:00");

  const setPeso = (
    k: "pesoHuecos" | "pesoMadrugada" | "pesoDiasLibres" | "pesoDocentes",
    v: boolean
  ) => {
    onChange({ ...prefs, [k]: v ? 1 : 0 });
  };

  const toggleDia = (d: Dia) => {
    const has = prefs.diasLibresPreferidos.includes(d);
    const nextList = has
      ? prefs.diasLibresPreferidos.filter((x) => x !== d)
      : [...prefs.diasLibresPreferidos, d];
    onChange({
      ...prefs,
      pesoDiasLibres: nextList.length > 0 ? 1 : prefs.pesoDiasLibres,
      diasLibresPreferidos: nextList,
    });
  };

  const setRest = (patch: Partial<Restricciones>) => {
    onChange({ ...prefs, restricciones: { ...prefs.restricciones, ...patch } });
  };

  const agregarBloquePersonal = () => {
    if (!nuevoTitulo.trim()) return;
    const iniMin = toMinutes(nuevoInicio);
    const finMin = toMinutes(nuevoFin);
    if (iniMin >= finMin) return;

    const nuevo: BloquePersonal = {
      id: Date.now().toString(),
      titulo: nuevoTitulo.trim(),
      dia: nuevoDia,
      inicio: iniMin,
      fin: finMin,
    };

    const existentes = prefs.restricciones.bloquesPersonales ?? [];
    setRest({ bloquesPersonales: [...existentes, nuevo] });
    setNuevoTitulo("");
  };

  const eliminarBloquePersonal = (id: string) => {
    const existentes = prefs.restricciones.bloquesPersonales ?? [];
    setRest({ bloquesPersonales: existentes.filter((b) => b.id !== id) });
  };

  const bloquesActuales = prefs.restricciones.bloquesPersonales ?? [];

  const esManana = prefs.horaMinimaClase >= 420 && prefs.restricciones.horaMax === 840;
  const esTarde = prefs.horaMinimaClase >= 780 && prefs.restricciones.horaMax === 1080;
  const esNoche = prefs.horaMinimaClase >= 1080 && prefs.restricciones.horaMax === 1350;
  const esCualquiera = !esManana && !esTarde && !esNoche;

  const aplicarTurno = (turno: "cualquiera" | "manana" | "tarde" | "noche") => {
    if (turno === "manana") {
      onChange({
        ...prefs,
        pesoMadrugada: 1,
        horaMinimaClase: 420,
        restricciones: {
          ...prefs.restricciones,
          horaMax: 840,
        },
      });
    } else if (turno === "tarde") {
      onChange({
        ...prefs,
        pesoMadrugada: 1,
        horaMinimaClase: 780,
        restricciones: {
          ...prefs.restricciones,
          horaMax: 1080,
        },
      });
    } else if (turno === "noche") {
      onChange({
        ...prefs,
        pesoMadrugada: 1,
        horaMinimaClase: 1080,
        restricciones: {
          ...prefs.restricciones,
          horaMax: 1350,
        },
      });
    } else {
      onChange({
        ...prefs,
        pesoMadrugada: 0,
        horaMinimaClase: 480,
        restricciones: {
          ...prefs.restricciones,
          horaMax: 0,
        },
      });
    }
  };

  return (
    <div className="grid gap-4">
      {/* Selector Rápido de Turno Preferido */}
      <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          ⚡ Filtro Rápido por Turno de Estudio
        </p>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Selecciona tu turno de preferencia para filtrar y priorizar automáticamente tus clases:
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => aplicarTurno("cualquiera")}
            className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all ${
              esCualquiera
                ? "border-emerald-500 bg-emerald-600 text-white shadow-md font-extrabold"
                : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 font-bold"
            }`}
          >
            <span className="text-sm">🌐</span>
            <span className="text-xs font-black leading-tight mt-0.5">Cualquier Turno</span>
            <span className="text-[10px] opacity-80 font-normal">Sin restricción</span>
          </button>
          <button
            type="button"
            onClick={() => aplicarTurno("manana")}
            className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all ${
              esManana
                ? "border-amber-500 bg-amber-500 text-white shadow-md font-extrabold"
                : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 font-bold"
            }`}
          >
            <span className="text-sm">☀️</span>
            <span className="text-xs font-black leading-tight mt-0.5">Solo Mañana</span>
            <span className="text-[10px] opacity-80 font-normal">07:00 – 14:00</span>
          </button>
          <button
            type="button"
            onClick={() => aplicarTurno("tarde")}
            className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all ${
              esTarde
                ? "border-sky-500 bg-sky-500 text-white shadow-md font-extrabold"
                : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 font-bold"
            }`}
          >
            <span className="text-sm">⛅</span>
            <span className="text-xs font-black leading-tight mt-0.5">Solo Tarde</span>
            <span className="text-[10px] opacity-80 font-normal">13:00 – 18:00</span>
          </button>
          <button
            type="button"
            onClick={() => aplicarTurno("noche")}
            className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all ${
              esNoche
                ? "border-indigo-500 bg-indigo-600 text-white shadow-md font-extrabold"
                : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 font-bold"
            }`}
          >
            <span className="text-sm">🌙</span>
            <span className="text-xs font-black leading-tight mt-0.5">Solo Noche</span>
            <span className="text-[10px] opacity-80 font-normal">18:00 – 22:30</span>
          </button>
        </div>
      </Card>

      <Card>
        <Checkbox
          checked={activo(prefs, "pesoHuecos")}
          onChange={(v) => setPeso("pesoHuecos", v)}
          label="Evitar horas muertas (huecos)"
        />
        <p className="mt-1 text-xs text-zinc-400">
          Prioriza horarios con el menor tiempo muerto entre clases.
        </p>
      </Card>

      <Card>
        <Checkbox
          checked={activo(prefs, "pesoMadrugada")}
          onChange={(v) => setPeso("pesoMadrugada", v)}
          label="No madrugar"
        />
        <div className="mt-2 flex items-center gap-3">
          <input
            type="time"
            className={`${inputCls()} w-28 text-xs`}
            value={fmtHora(prefs.horaMinimaClase)}
            onChange={(e) =>
              onChange({ ...prefs, horaMinimaClase: toMinutes(e.target.value || "08:00") })
            }
          />
          <span className="text-xs text-zinc-400">
            sin clases antes de {fmtHora(prefs.horaMinimaClase)}
          </span>
        </div>
      </Card>

      <Card>
        <Checkbox
          checked={activo(prefs, "pesoDiasLibres")}
          onChange={(v) => setPeso("pesoDiasLibres", v)}
          label="Buscar días libres"
        />
        <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
          {DIAS.map((d) => (
            <Checkbox
              key={d}
              checked={prefs.diasLibresPreferidos.includes(d)}
              onChange={() => toggleDia(d)}
              label={DIA_LABEL[d]}
            />
          ))}
        </div>
      </Card>

      <Card>
        <Checkbox
          checked={activo(prefs, "pesoDocentes")}
          onChange={(v) => setPeso("pesoDocentes", v)}
          label="Prefiero estos docentes"
        />
        <input
          className={`${inputCls()} mt-2 text-xs`}
          placeholder="Docentes, ej. Pérez, Rojas"
          value={prefs.docentesPreferidos.join(", ")}
          onChange={(e) =>
            onChange({
              ...prefs,
              docentesPreferidos: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            })
          }
        />
      </Card>



      <Card>
        <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          Reglas estrictas (descartan horarios)
        </p>
        <div className="mt-3 space-y-3">
          <div className="pb-1 border-b border-zinc-100 dark:border-zinc-800">
            <Checkbox
              checked={Boolean(prefs.restricciones.sinTurnosLlenos)}
              onChange={(v) => setRest({ sinTurnosLlenos: v })}
              label="Descartar turnos llenos (sin vacantes)"
            />
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Días sin clases obligatorios:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {DIAS.map((d) => (
                <Checkbox
                  key={d}
                  checked={prefs.restricciones.sinDias.includes(d)}
                  onChange={(v) =>
                    setRest({
                      sinDias: v
                        ? [...prefs.restricciones.sinDias, d]
                        : prefs.restricciones.sinDias.filter((x) => x !== d),
                    })
                  }
                  label={`Sin clases ${DIA_LABEL[d]}`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                No salir después de
              </span>
              <input
                type="time"
                className={`${inputCls()} text-xs py-1.5`}
                value={
                  prefs.restricciones.horaMax
                    ? fmtHora(prefs.restricciones.horaMax)
                    : ""
                }
                onChange={(e) =>
                  setRest({ horaMax: e.target.value ? toMinutes(e.target.value) : 0 })
                }
              />
            </div>
            <div>
              <span className="mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Máx horas/día
              </span>
              <input
                type="number"
                min={0}
                max={24}
                className={`${inputCls()} text-xs py-1.5`}
                placeholder="0 = sin límite"
                value={prefs.restricciones.maxHorasDia || ""}
                onChange={(e) =>
                  setRest({ maxHorasDia: parseInt(e.target.value || "0", 10) })
                }
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Gestor de Bloques Personales */}
      <Card>
        <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          🛑 Bloques Personales Bloqueados (Trabajo, Gym, etc.)
        </p>
        <p className="mt-1 text-xs text-zinc-400 leading-normal">
          Define horas donde no puedes asistir a clases. El algoritmo descartará cualquier cruce.
        </p>

        {/* Lista de bloques actuales */}
        {bloquesActuales.length > 0 && (
          <div className="mt-3 space-y-2">
            {bloquesActuales.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold">{b.titulo}</span>
                  <span className="text-[10px] opacity-90">
                    {DIA_LABEL[b.dia]}: {fmtHora(b.inicio)} – {fmtHora(b.fin)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => eliminarBloquePersonal(b.id)}
                  className="rounded p-1 font-bold text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Formulario para agregar nuevo bloque */}
        <div className="mt-3 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
          <div>
            <span className="mb-1 block text-[11px] font-semibold text-zinc-500">Actividad</span>
            <input
              className={`${inputCls()} text-xs`}
              placeholder="Ej. Trabajo, Gym"
              value={nuevoTitulo}
              onChange={(e) => setNuevoTitulo(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="mb-1 block text-[11px] font-semibold text-zinc-500">Día</span>
              <select
                className={`${inputCls()} text-xs py-1 px-1`}
                value={nuevoDia}
                onChange={(e) => setNuevoDia(e.target.value as Dia)}
              >
                {DIAS.map((d) => (
                  <option key={d} value={d}>
                    {DIA_LABEL[d]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1 block text-[11px] font-semibold text-zinc-500">Inicio</span>
              <input
                type="time"
                className={`${inputCls()} text-xs py-1 px-1`}
                value={nuevoInicio}
                onChange={(e) => setNuevoInicio(e.target.value)}
              />
            </div>
            <div>
              <span className="mb-1 block text-[11px] font-semibold text-zinc-500">Fin</span>
              <input
                type="time"
                className={`${inputCls()} text-xs py-1 px-1`}
                value={nuevoFin}
                onChange={(e) => setNuevoFin(e.target.value)}
              />
            </div>
          </div>
          <div className="pt-1 flex justify-end">
            <Btn variant="secondary" onClick={agregarBloquePersonal} className="w-full text-xs py-1.5">
              + Agregar Bloque
            </Btn>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Créditos objetivo (opcional)
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1">
            <span className="mb-1 block text-xs text-zinc-500">Mínimo</span>
            <input
              type="number"
              min={0}
              max={40}
              className={`${inputCls()} text-xs`}
              placeholder="0 = sin mínimo"
              value={prefs.creditosMin}
              onChange={(e) =>
                onChange({ ...prefs, creditosMin: parseInt(e.target.value || "0", 10) })
              }
            />
          </div>
          <div className="flex-1">
            <span className="mb-1 block text-xs text-zinc-500">Máximo</span>
            <input
              type="number"
              min={0}
              max={60}
              className={`${inputCls()} text-xs`}
              placeholder="0 = sin máximo"
              value={prefs.creditosMax}
              onChange={(e) =>
                onChange({ ...prefs, creditosMax: parseInt(e.target.value || "0", 10) })
              }
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Si defines el rango, los horarios fuera de él quedan con menor puntaje.
        </p>
      </Card>
    </div>
  );
}
