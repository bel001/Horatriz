import { generarHorarios } from "./generator";
import type { Curso, Preferencias } from "./model";
import type { GenerarOpciones } from "./generator";

self.addEventListener("message", (e: MessageEvent<{ cursos: Curso[]; prefs: Preferencias; opciones?: GenerarOpciones }>) => {
  const { cursos, prefs, opciones } = e.data;
  try {
    const res = generarHorarios(cursos, prefs, opciones);
    self.postMessage({ type: "SUCCESS", resultado: res });
  } catch (err) {
    self.postMessage({ type: "ERROR", error: String(err) });
  }
});
