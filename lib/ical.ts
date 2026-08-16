import type { HorarioResult, Sesion } from "./model";
import { DIA_INDEX } from "./parser";
import { fmtHora } from "./time";

function formatIcsDateTime(date: Date, minutes: number): string {
  const d = new Date(date);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  d.setHours(hours, mins, 0, 0);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = "00";

  return `${year}${month}${day}T${hh}${mm}${ss}`;
}

function getProximaFechaDia(diaIndex: number): Date {
  const hoy = new Date();
  // JS getDay(): 0 = Domingo, 1 = Lunes... 6 = Sábado
  const hoyDay = hoy.getDay();
  // DIA_INDEX: LUN=0, MAR=1, MIE=2, JUE=3, VIE=4, SAB=5, DOM=6
  const jsTargetDay = diaIndex === 6 ? 0 : diaIndex + 1;

  let diff = jsTargetDay - hoyDay;
  if (diff < 0) diff += 7;

  const res = new Date(hoy);
  res.setDate(hoy.getDate() + diff);
  return res;
}

export function generarIcs(horario: HorarioResult, titulo: string = "Horario"): string {
  const lineas: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Horatriz//NONSGML v1.0//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${titulo}`,
  ];

  // Fecha fin de semestre aproximada: 16 semanas desde hoy
  const finSemestre = new Date();
  finSemestre.setDate(finSemestre.getDate() + 16 * 7);
  const untilStr = finSemestre.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  horario.sesiones.forEach((s: Sesion, index: number) => {
    const idxDia = DIA_INDEX[s.dia];
    const fechaInicioClase = getProximaFechaDia(idxDia);
    const dtStart = formatIcsDateTime(fechaInicioClase, s.inicio);
    const dtEnd = formatIcsDateTime(fechaInicioClase, s.fin);

    const uid = `horatriz-${s.nrc || s.id || index}-${dtStart}@horatriz`;
    const summary = `${s.curso || s.codigo} (${s.tipo})`;
    const description = `Curso: ${s.curso || s.codigo}\\nTipo: ${s.tipo}\\nDocente: ${s.docente || "No especificado"}\\nNRC: ${s.nrc || "N/A"}\\nSección: ${s.seccion || "N/A"}`;
    const location = s.aula || "Campus";

    lineas.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `RRULE:FREQ=WEEKLY;UNTIL=${untilStr}`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  });

  lineas.push("END:VCALENDAR");
  return lineas.join("\r\n");
}

export function descargarIcs(horario: HorarioResult, nombreArchivo: string = "horario.ics") {
  const contenido = generarIcs(horario);
  const blob = new Blob([contenido], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", nombreArchivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
