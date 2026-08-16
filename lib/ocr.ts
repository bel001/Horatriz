export function limpiarTextoOcr(texto: string): string {
  return texto
    .replace(/[\u2018\u2019\u201A\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014\u2015\u2212]/g, "-")
    .replace(/[|¦¡]/g, " ")
    .replace(
      /[─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬╔╦╠═▐▌▀▄█]/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

export const OCR_DESCARGA_MENSAJES: Record<string, string> = {
  "loading tesseract core": "Cargando motor OCR…",
  "initializing tesseract": "Inicializando OCR…",
  "loading language traineddata": "Descargando modelo de español…",
  "initializing api": "Preparando reconocimiento…",
  "recognizing text": "Reconociendo texto…",
};
