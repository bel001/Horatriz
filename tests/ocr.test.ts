import { describe, expect, it } from "vitest";
import { limpiarTextoOcr } from "@/lib/ocr";

describe("limpiarTextoOcr", () => {
  it("normaliza comillas y guiones", () => {
    expect(limpiarTextoOcr("07:00–09:00 · “A-301” · ’DOC’")).toBe(
      "07:00-09:00 · \"A-301\" · 'DOC'"
    );
  });

  it("reemplaza pipes y caracteres de tabla por espacios", () => {
    const out = limpiarTextoOcr("CEMP-112│80123│LUN");
    expect(out).toBe("CEMP-112 80123 LUN");
  });

  it("colapsa espacios múltiples y recorta", () => {
    expect(limpiarTextoOcr("  a    b   c  ")).toBe("a b c");
  });
});