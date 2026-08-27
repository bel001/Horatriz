# Horatriz — System Design

> 100% client-side. Sin DB, sin API, sin env. Todo sucede en el navegador. Diseñado para parchar el caos UPAO (NRC / ID LIGA / BLOQUE) y devolver horarios rankeados en <2s.

## 1) Contexto & Objetivos

**Problema**: pegar la oferta académica (texto/CSV/Excel/PDF/foto) y obtener combinaciones sin cruces, con control fino de créditos, docentes y bloques personales.
**Usuarios**: estudiantes UPAO con oferta impresa del portal (`NRC: / ID LIGA: / BLOQUE: / AM/PM`).
**Objetivos**:
- Parseo tolerante (confianza por fila) + corrección manual
- Agrupación correcta T/P/L por liga numérica (`T1+P1+L1 → Liga 1`)
- Generación con poda por solapamiento + límites de tiempo
- Ranking 0–100 explicable + exportación PNG/iCal
- Nuevo: **Pantalla SuperVisual** — dashboard editorial para leer el horario de un vistazo (KPIs, heatmap, stream, radar)

**No-objetivos**: backend, login, colaboración realtime, persistencia remota.

---

## 2) Arquitectura High-Level (C4 — Container)

```
[Browser]
  ┌─ Next.js 16.3 App Router (RSC shell + Client islands)
  │   ├─ app/layout.tsx (metadata + Header/Footer + theme script)
  │   ├─ app/page.tsx → HorariosApp (wizard 3 pasos)
  │   └─ app/components/pasos/* + SuperVisualView
  ├─ lib/  (dominio puro, testeable sin DOM)
  │   ├─ parser + portal + banner  → FilaParseada[]
  │   ├─ groups                    → Curso.opciones (liga → combos)
  │   ├─ generator (+ worker)      → ResultadoGeneracion (backtracking)
  │   ├─ scoring                   → score 0–100 + Metricas + advertencias
  │   ├─ estado (serializar)       → localStorage + URL #d= (base64url)
  │   └─ lectorArchivos / ocr / ical / time
  └─ Web Worker (generator.worker.ts)
```

**Principio**: `lib/` no importa nada de `app/`. Toda regla de negocio vive ahí y se testea con Vitest node.

---

## 3) Pipeline de Datos (secuencia)

```mermaid
flowchart LR
  A[Texto / Archivo / Foto] --> B(lectorArchivos / ocr)
  B --> C[parser.parseTexto]\n detecta modo: columnas | regex | portalupao | bannerupao
  C --> D[FilaParseada[] con confianza]
  D --> E[EditorFilas: corrección manual]
  E --> F[filaASesion → Sesion]
  F --> G[groups.agruparEnCursos]\n clave liga = número de T1/P1/L1
  G --> H[Curso[] + sinLiga]
  H --> I[selección + prefs + fijados]
  I --> J[generator.generarHorarios]\n backtracking + poda + timebox 2s/60 resultados
  J --> K[scoring.puntuarHorario × medir + ordenar]\n coincidenciasEspecificas → score → huecos
  K --> L[HorarioResult[] rankeado]
  L --> M[GridSemana | SuperVisualView | Comparador]
  M --> N[Export PNG / iCal + share URL]
  J -. debounce 250ms .-> J
```

**Notas clave**:
- Detección UPAO: `portal.ts` busca bloques `NRC:/ID LIGA:/BLOQUE:` y horas `AM/PM`. Si falla, cae a `parser.ts` genérico.
- Liga: `obtenerClaveLiga` extrae número (`T01→1`), soporta letras (`TA→a`) y códigos tipo `1001`. T/P/L con mismo número colapsan en una `Opcion`.
- `combosPorTipo`: si una liga trae T+P separados, genera productos cartesianos (T×P).

---

## 4) Motor de Generación (lib/generator.ts)

**Estrategia**: backtracking ordenado por cursos con menos opciones primero (menor branching). Podas:

1) `opcionConflictoInterno` (solape dentro de la opción)
2) `opcionConflicta` (vs `ocupado[Dia]`)
3) `opcionViolaRestricciones` (sinDias, horaMax, bloquesPersonales, sinTurnosLlenos)
4) `rutaExcedeHorasDiarias` (maxHorasDia)
5) filtro blando por docente preferido (hard unless 0 match)

**Ordenamiento final**: `coincidenciasEspecificas desc → score desc → minutosHuecos asc` (`@lib/generator.ts:105`).

**Límites**: `maxMs:2000, maxResultados:60` en `HorariosApp.tsx` (debounce 250ms). Señal `limite:true` si se corta por tiempo.

**Worker**: `generator.worker.ts` envuelve `generarHorarios` en `self.onmessage`. El thread principal hoy llama directo; el worker queda listo para offload sin cambiar firma.

---

## 5) Scoring (lib/scoring.ts)

Pesos desde `DEFAULT_PREFERENCIAS` (`@lib/model.ts:120`):
`huecos 0.4 / diasLibres 0.25 / madrugada 0.15 / docentes 0.2`

`metricasHorario` calcula: minutosClase, minutosHuecos (>10m), minutosMadrugada, diasConClase, diasLibresLogrados, coincidenciasDocente, docentesRepetidos.

`puntuarHorario`: normaliza cada métrica a 0–1, hace media ponderada → 0–100, luego bonifica por docente específico (+45) y perfil académico (compacto/equilibrado/finde), penaliza por créditos fuera de rango.

`calcularAdvertencias`: 8 checks (turno lleno, días libres violados, madrugada, horaMax, huecos, maxHorasDia, bloques, docente fallido) → se muestra como banner ámbar en UI.

---

## 6) Estado & Persistencia (lib/estado.ts + hooks/useEstadoHorarios.ts)

- **Keys**: `horatriz-estado-v1` (fallback `hupao-estado-v1`) y `horatriz-borradores` en localStorage.
- **Esquema**: `EstadoPersistido { v:1, paso, filas, modo, prefs, creditos, docPref, colores, seleccionados }`.
- **Hidratación**: al montar lee `location.hash#d=` (base64url de JSON) → si existe, ignora localStorage. `serializarEstado/deserializarEstado` usan `Uint8Array ↔ base64url` sin deps.
- **Guardado**: debounce 400ms en `useEffect`.
- **Sharing**: `compartir()` serializa `paso:2` + clipboard; el receptor re-hidrata igual que local.
- **Borradores**: array `horatriz-borradores`, ítem `{ id, nombre, fecha, horario: HorarioResult }` (máx. sin límite, LIFO).

**Migración**: bump `v` + fallback key permite renombrar sin perder datos.

---

## 7) Render — Capas Visuales

| Capa | Componente | Rol |
|------|------------|-----|
| Wizard shell | `HorariosApp` + `ui.stepper` | Orquesta `paso` + `resultado` reactivo |
| Paso 0 | `PasoTexto` + `SubirArchivo` + `OcrUpload` | Input multimodal |
| Paso 1 | `PasoRevisar` + `EditorFilas` | Tabla editable + confianza |
| Paso 2 | `PasoCursosResultados` | Sidebar (cursos+preferencias) + main (ranked list + grid) |
| Grid clásico | `GridSemana` | Calendario 6–22h, columnas LUN–SAB(+DOM), huecos ambar, tags T1/P1 |
| **SuperVisual** | `SuperVisualView` | Dashboard derivado (ver §8) |
| Comparador | `ComparadorHorarios` | Overlay 2–3 horarios lado a lado |

**Estilo**: Tailwind 4 (`@tailwindcss/postcss`), `globals.css` con gradientes radiales sutiles, `ThemeToggle` + script inline en `layout.tsx` para evitar FOUC. Paleta por curso (`PALETA_CURSOS` 8 colores) hasheada por `codigo`.

**Interacciones**: debounce generación, `toPng` (html-to-image) para export, `descargarIcs` compone `BEGIN:VCALENDAR`.

---

## 8) Pantalla SuperVisual — Spec

**Objetivo editorial**: que el estudiante entienda en 5s si el horario “respira” o “ahoga”. Complementa a `GridSemana`, no lo reemplaza.

### 8.1 Principios
- **Derivado puro**: `props: HorarioResult | null` → cero estado nuevo, cero fetch.
- **Cero deps extra**: SVG manual + Tailwind + `lib/time`, `lib/scoring` ya existentes.
- **Responsive “magazine”**: 1 col móvil → 12 col desktop; cada sección es `Card` translúcida con blur.
- **Accesible**: tab order lógico, `aria-label` en radar, contraste WCAG AA, motion reduce-safe.

### 8.2 Layout (12-col grid)

```
┌──────────────────────────────────────────────┐
│ HERO: score ring + badges + acciones (PNG/iCal) │
├──────────────┬───────────────────────────────┤
│ KPIs (4)     │ Radar 4 ejes + mini-leyenda  │
├──────────────┴───────────────────────────────┤
│ TABS: [ Timeline │ Heatmap ]                 │
│  Timeline: lanes por día (horizontal Gantt)  │
│  Heatmap: 7×16 celdas (opacidad = carga)     │
├──────────────────────────────────────────────┤
│ ADN: fila de dots por curso + densidad/semana │
│ Sesiones: lista agrupada por día (glass)     │
└──────────────────────────────────────────────┘
```

### 8.3 Cálculos derivados (useMemo)
- `metrica = metricasHorario(cuadro, prefs)` si viene `horario.cuadro`, sino re-deriva.
- `scoreRing`: `strokeDasharray = score/100 * circunferencia`.
- **Timeline**: `left% = (inicio-360)/960`, `width% = (fin-inicio)/960` (rango 6–22).
- **Heatmap**: matrix `Dia × hora (7–22)` → `fillOpacity 0/0.25/1` según nº sesiones que caen en ese bucket.
- **Radar**: 4 vértices normalizados `1 - h, diasLibresRatio, docenteRatio, 1 - madrugadaRatio`. Centro (50,50), r=36.

### 8.4 Estados
- **Con datos**: hero + KPIs + tabs + ADN.
- **Vacío** (`seleccionados.size===0`): placeholder ilustrado + CTA “Selecciona cursos”.
- **Sin Huecos**: badge “✨ Sin huecos” + confetti CSS sutil.

### 8.5 Toggle
`PasoCursosResultados` expone `vista` (`useState<'grid'|'super'>` default `super`) con switch segmentado `role="tablist"` + `aria-selected` junto a export. Persistido en `localStorage:horatriz_vista_preferida` (lectura en `useEffect` para evitar hydration mismatch) + `prefers-reduced-motion` respeta `motion-safe`. El `ScoreRing` usa `useId()` para `gradScore-${id}` evitando colisión de `<linearGradient>` cuando hay múltiples instancias (main + modal borrador).

---

## 9) Seguridad, Privacidad, Perf & Notificación de Límites

- **Privacidad**: todo queda en `localStorage`/`hash`. No se sube a servidor (salvo `pdfjs-dist` worker desde CDN la primera vez).
- **Perf**: generación O(∏ opciones) con poda agresiva; `maxMs:2000` garantiza UI responsive. Render usa `useMemo` + `ResizeObserver` en `GridSemana` y `SuperVisual` memoiza `lanes/heatmap/radar`.
- **Truncamiento**: `ResultadoGeneracion.limite:true` (cuando `Date.now()-t0 > maxMs`) se notifica con banner sky `⏱️ Tiempo límite alcanzado — se muestran N de M combinaciones en Xms` en `PasoCursosResultados.tsx`. El usuario debe filtrar/fijar para explorar más.
- **PDFs bitmap**: `lectorArchivos` retorna vacío → UI sugiere “pegar texto”.
- **Build**: `typecheck → lint → test (Vitest node + jsdom solo ui, + tests/superVisual.test.ts) → build`. Alias `@/* → ./*`.

---

## 10) Mapa de Archivos (relevante)

```
app/page.tsx → app/components/HorariosApp.tsx
app/components/
  Header.tsx  Footer.tsx  ThemeToggle.tsx  ui.tsx
  GridSemana.tsx  ComparadorHorarios.tsx  PreferenciasPanel.tsx
  pasos/PasoTexto|Revisar|CursosResultados|Resultados.tsx
  SuperVisualView.tsx
  SuperVisual/{ScoreRing,RadarView,KpiGrid,TimelineView,HeatmapView}.tsx
lib/
  model.ts (SCORE_META/HORARIO_RANGO)  time.ts solapan()  parser.ts  portal.ts  groups.ts
  generator.ts + generator.worker.ts  scoring.ts
  estado.ts  lectorArchivos.ts  ocr.ts  ical.ts  banner.ts  filtros.ts
tests/*.test.ts (incl. superVisual.test.ts)  + vitest.config.ts (env node)
docs/SYSTEM_DESIGN.md
```

---

## 11) Trade-offs & Futuro

| Decisión | Trade-off | Mitigación |
|----------|-----------|------------|
| 100% client | sin sync multi-device | share URL compensa; futuro: export JSON |
| Backtracking en main thread | puede bloquear UI si >2000ms | worker ya cableado; activar con `new Worker()` |
| Pesos fijos scoring | subjetivo | sliders + perfiles + advertencias explicables |
| Tailwind 4 + no chart lib | menos gráficas out-of-box | SVG artesanal (ScoreRing/Radar) ligero, sin bundle extra, `motion-safe` |
| SuperVisual split vs monolito | monolito 560 líneas difícil testear | split en `SuperVisual/{ScoreRing,Radar,KpiGrid,Timeline,Heatmap}.tsx` + tests |

**Next**: worker por defecto, tests visuales con Playwright `instant()` si se activa Cache Components, “Modo foco” (fullscreen SuperVisual).

---

## 12) Cómo probar la SuperVisual

```bash
npm run dev          # abrir http://localhost:3000
# 1) pegar oferta (texto con T1/P1) → Revisar → Generar
# 2) en paso “Cursos y Horario”, cambiar a ✨ SuperVisual
# 3) probar Heatmap ↔ Timeline, exportar PNG, comparar
npm run typecheck && npm test && npm run build
```
