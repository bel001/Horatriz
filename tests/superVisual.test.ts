import { describe, expect, it } from "vitest";
import { HORARIO_RANGO, metaDeScore, tierDeScore } from "@/lib/model";
import { buildRadarValues } from "@/app/components/SuperVisual/RadarView";
import type { Preferencias } from "@/lib/model";
import type { MetricasHorario } from "@/lib/scoring";
import { solapan } from "@/lib/time";

function mkPrefs(over: Partial<Preferencias> = {}): Preferencias {
  return {
    pesoHuecos: 0.4,
    pesoDiasLibres: 0.25,
    diasLibresPreferidos: ["VIE", "SAB"],
    pesoMadrugada: 0.15,
    horaMinimaClase: 8 * 60,
    pesoDocentes: 0.2,
    docentesPreferidos: [],
    creditosMin: 0,
    creditosMax: 0,
    restricciones: { sinDias: [], horaMax: 0, maxHorasDia: 0, bloquesPersonales: [], sinTurnosLlenos: false },
    docentesPorCurso: {},
    perfilAcademico: null,
    ...over,
  };
}

function mkMetricas(over: Partial<MetricasHorario> = {}): MetricasHorario {
  return {
    score: 80,
    minutosClase: 600,
    minutosHuecos: 30,
    minutosMadrugada: 0,
    diasConClase: ["LUN", "MAR", "MIE"],
    diasLibresLogrados: 2,
    coincidenciasDocente: 1,
    coincidenciasEspecificas: 1,
    totalSesiones: 6,
    totalCreditos: 12,
    docentesRepetidos: [],
    ...over,
  };
}

describe("score tier unificado", () => {
  it("tierDeScore respeta umbrales 85/65/45", () => {
    expect(tierDeScore(90)).toBe("elite");
    expect(tierDeScore(85)).toBe("elite");
    expect(tierDeScore(84)).toBe("solido");
    expect(tierDeScore(65)).toBe("solido");
    expect(tierDeScore(64)).toBe("ajustable");
    expect(tierDeScore(45)).toBe("ajustable");
    expect(tierDeScore(44)).toBe("base");
  });
  it("metaDeScore devuelve badgeColor consistente", () => {
    expect(metaDeScore(90).badgeColor).toBe("emerald");
    expect(metaDeScore(70).badgeColor).toBe("sky");
    expect(metaDeScore(50).badgeColor).toBe("amber");
    expect(metaDeScore(20).badgeColor).toBe("rose");
  });
});

describe("buildRadarValues", () => {
  it("vDoc = 0.55 neutral cuando no hay preferencia docente", () => {
    const m = mkMetricas({ coincidenciasEspecificas: 0 });
    const prefs = mkPrefs({ docentesPorCurso: {} });
    const [, , vDoc] = buildRadarValues(m, prefs, 0);
    expect(vDoc).toBeCloseTo(0.55, 2);
  });
  it("vDoc ratio cuando sí hay esperados", () => {
    const m = mkMetricas({ coincidenciasEspecificas: 1 });
    const prefs = mkPrefs({ docentesPorCurso: { C1: { T: "Pérez" } } });
    const [, , vDoc] = buildRadarValues(m, prefs, 2);
    expect(vDoc).toBeCloseTo(0.5, 2);
  });
  it("sin huecos → vHue 1, con muchos huecos baja", () => {
    const sin = mkMetricas({ minutosHuecos: 0, minutosClase: 300 });
    const con = mkMetricas({ minutosHuecos: 120, minutosClase: 300 });
    const prefs = mkPrefs();
    const [vSin] = buildRadarValues(sin, prefs, 0);
    const [vCon] = buildRadarValues(con, prefs, 0);
    expect(vSin).toBe(1);
    expect(vCon).toBeLessThan(0.8);
  });
});

describe("HORARIO_RANGO unificado", () => {
  it("span 6-22 = 960m", () => {
    expect(HORARIO_RANGO.min).toBe(360);
    expect(HORARIO_RANGO.max).toBe(1320);
    expect(HORARIO_RANGO.span).toBe(960);
  });
});

describe("heatmap solape exacto", () => {
  it("solapan detecta bucket [h*60,(h+1)*60) correctamente", () => {
    // clase 7:55-8:05 debe solapar ambos buckets 7 y 8
    expect(solapan(7 * 60 + 55, 8 * 60 + 5, 7 * 60, 8 * 60)).toBe(true);
    expect(solapan(7 * 60 + 55, 8 * 60 + 5, 8 * 60, 9 * 60)).toBe(true);
    expect(solapan(7 * 60, 7 * 60 + 50, 8 * 60, 9 * 60)).toBe(false);
  });
});

describe("clamp timeline width", () => {
  it("left + w no debe exceder 100%", () => {
    const caso = { inicio: 21 * 60 + 30, fin: 22 * 60 }; // 21:30-22:00 en borde
    const left = ((caso.inicio - HORARIO_RANGO.min) / HORARIO_RANGO.span) * 100; // ~96.875
    const rawW = ((caso.fin - caso.inicio) / HORARIO_RANGO.span) * 100; // ~3.125
    const clamped = Math.min(100 - left, Math.max(6, rawW));
    expect(left + clamped).toBeLessThanOrEqual(100.01);
    expect(clamped).toBeGreaterThanOrEqual(3);
  });
});
