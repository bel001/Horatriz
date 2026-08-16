export type TipoArchivo = "txt" | "csv" | "excel" | "pdf";

export type Celda = string | number | boolean | null | undefined;

export interface ItemTextoPdf {
  str: string;
  x: number;
  y: number;
  width: number;
}

export function aTextoColumnas(filas: Celda[][]): string {
  const noVacias = filas.filter((f) =>
    f.some((c) => String(c ?? "").trim() !== "")
  );
  return noVacias
    .map((fila) =>
      fila
        .map((c) => String(c ?? "").replace(/[\r\n]+/g, " ").trim())
        .join("\t")
    )
    .join("\n");
}

export function reconstruirLineasPdf(items: ItemTextoPdf[]): string {
  const orden = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lineas: ItemTextoPdf[][] = [];
  for (const it of orden) {
    const ultima = lineas[lineas.length - 1];
    if (ultima && Math.abs(ultima[0].y - it.y) < 3) ultima.push(it);
    else lineas.push([it]);
  }
  return lineas
    .map((ln) => {
      ln.sort((a, b) => a.x - b.x);
      let texto = ln[0].str;
      let prevFin = ln[0].x + ln[0].width;
      for (let i = 1; i < ln.length; i++) {
        const charW = Math.max(1, ln[i].width / Math.max(1, ln[i].str.length));
        const hueco = ln[i].x - prevFin;
        texto += (hueco > charW * 2.2 ? "\t" : " ") + ln[i].str;
        prevFin = ln[i].x + ln[i].width;
      }
      return texto;
    })
    .join("\n");
}

export function detectarTipoArchivo(nombre: string): TipoArchivo {
  const ext = nombre.toLowerCase().split(".").pop() ?? "";
  if (ext === "txt") return "txt";
  if (ext === "csv") return "csv";
  if (ext === "xlsx" || ext === "xls") return "excel";
  if (ext === "pdf") return "pdf";
  throw new Error(
    `Formato no soportado (.${ext}). Usa TXT, CSV, XLSX, XLS o PDF.`
  );
}

export async function leerArchivoComoTexto(file: File): Promise<string> {
  const tipo = detectarTipoArchivo(file.name);
  const buffer = await file.arrayBuffer();

  if (tipo === "txt") {
    return new TextDecoder("utf-8").decode(buffer);
  }

  if (tipo === "csv" || tipo === "excel") {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "array" });
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    if (!hoja) throw new Error("El archivo no contiene hojas de cálculo.");
    const filas = XLSX.utils.sheet_to_json<Celda[]>(hoja, { header: 1 });
    return aTextoColumnas(filas);
  }

  const pdfjs = await import("pdfjs-dist");
  const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const lineas: string[] = [];
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const contenido = await page.getTextContent();
      const items: ItemTextoPdf[] = [];
      for (const it of contenido.items as Array<{
        str?: string;
        transform?: number[];
        width?: number;
      }>) {
        const str = it.str?.trim();
        if (str && it.transform) {
          items.push({
            str,
            x: it.transform[4],
            y: it.transform[5],
            width: it.width ?? 0,
          });
        }
      }
      lineas.push(reconstruirLineasPdf(items));
    }
  } finally {
    void doc.destroy();
  }
  const resultadoPdf = lineas.join("\n").trim();
  if (!resultadoPdf || resultadoPdf.length < 10) {
    throw new Error(
      "PDF_ESCANADO: El PDF es una imagen escaneada sin texto seleccionable. Usa la pestaña '📷 Subir foto' para procesarlo mediante OCR."
    );
  }
  return resultadoPdf;
}