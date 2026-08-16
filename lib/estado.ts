import type { FilaParseada, Preferencias, Tipo } from "./model";

export interface EstadoPersistido {
  v: 1;
  paso: number;
  filas: FilaParseada[];
  modo: "columnas" | "regex" | "portalupao" | "bannerupao";
  advertencias: string[];
  prefs: Preferencias;
  creditos: Record<string, number>;
  docPref: Record<string, Partial<Record<Tipo, string>>>;
  colores?: Record<string, string>;
  seleccionados: string[];
}

const CLAVE = "horatriz-estado-v1";
const CLAVE_LEGACY = "hupao-estado-v1";

export function guardarEstado(e: EstadoPersistido): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(e));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function cargarEstado(): EstadoPersistido | null {
  try {
    const raw = localStorage.getItem(CLAVE) || localStorage.getItem(CLAVE_LEGACY);
    if (!raw) return null;
    const e = JSON.parse(raw) as EstadoPersistido;
    if (e?.v !== 1 || !Array.isArray(e.filas)) return null;
    return e;
  } catch {
    return null;
  }
}

export function borrarEstado(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* noop */
  }
}

const b64a = (bytes: Uint8Array): string => {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const a64b = (s: string): Uint8Array => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

export async function serializarEstado(e: EstadoPersistido): Promise<string> {
  const texto = JSON.stringify(e);
  if (typeof CompressionStream === "undefined") {
    return "r1:" + b64a(new TextEncoder().encode(texto));
  }
  const stream = new Blob([texto]).stream().pipeThrough(new CompressionStream("deflate"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  return "z1:" + b64a(bytes);
}

export async function deserializarEstado(encoded: string): Promise<EstadoPersistido | null> {
  try {
    let texto: string;
    if (encoded.startsWith("z1:") && typeof DecompressionStream !== "undefined") {
      const bytes = a64b(encoded.slice(3));
      const copia = new Uint8Array(bytes);
      const stream = new Blob([copia])
        .stream()
        .pipeThrough(new DecompressionStream("deflate"));
      texto = await new Response(stream).text();
    } else if (encoded.startsWith("r1:")) {
      texto = new TextDecoder().decode(a64b(encoded.slice(3)));
    } else {
      return null;
    }
    const e = JSON.parse(texto) as EstadoPersistido;
    if (e?.v !== 1 || !Array.isArray(e.filas)) return null;
    return e;
  } catch {
    return null;
  }
}
