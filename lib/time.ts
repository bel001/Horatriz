export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m) || h > 23 || m > 59) {
    throw new Error(`Hora inválida: ${hhmm}`);
  }
  return h * 60 + m;
}

export function fmtHora(minutos: number, formato12h = false): string {
  const h24 = Math.floor(minutos / 60);
  const m = minutos % 60;
  const mStr = String(m).padStart(2, "0");
  if (!formato12h) {
    return `${String(h24).padStart(2, "0")}:${mStr}`;
  }
  const ampm = h24 >= 12 ? "pm" : "am";
  const h12 = h24 % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

export function fmtDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function minutosACadena(min: number | null): string {
  return min === null ? "" : fmtHora(min);
}

export function duracionEnMinutos(a: number, b: number): number {
  return Math.max(0, b - a);
}

export function solapan(aIni: number, aFin: number, bIni: number, bFin: number): boolean {
  return aIni < bFin && bIni < aFin;
}