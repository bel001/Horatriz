<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Horatriz

Next.js 16.3 + React 19 + TypeScript strict + Tailwind 4. 100% client-side — no DB, no API, no env vars. Bundled Next docs at `node_modules/next/dist/docs/`.

## Commands

- `npm run dev` — dev server (auto-allowed origins: `localhost`, `192.168.*`, `10.*`, `172.*` in `next.config.ts:4`)
- `npm test` — `vitest run` (single run); `npm run test:watch` — watch mode
- `npm run lint` — `eslint` (flat config, `eslint-config-next/core-web-vitals` + `typescript`)
- `npm run typecheck` — `tsc --noEmit`
- `npm run build` — `next build`
- Single test: `npx vitest run tests/parser.test.ts` or `npm test -- tests/generator.test.ts`

Verify order: `lint -> typecheck -> test -> build`.

## Architecture

- `app/page.tsx:1` -> `app/components/HorariosApp.tsx` — root client component, orchestrates 3-step wizard (`app/components/pasos/`). State lives in `lib/hooks/useEstadoHorarios.ts`.
- `lib/` is pure domain logic (no server code): `model.ts` (types), `parser.ts`/`portal.ts` (text parsing, UPAO `NRC:/ID LIGA:/BLOQUE:` format), `groups.ts` (group T/P/L by liga number -> `Curso.opciones`), `generator.ts` (backtracking with overlap pruning, respects `fijados` + `restricciones`), `scoring.ts` (0-100 weighted), `ocr.ts`, `lectorArchivos.ts` (TXT/CSV via SheetJS, PDF via `pdfjs-dist`), `estado.ts` (localStorage + URL share), `ical.ts`, `time.ts`.
- `lib/generator.worker.ts:1` — Web Worker wrapper around `generarHorarios()`; main thread debounces generation (250ms) with `maxResultados:60, maxMs:2000` in `app/components/HorariosApp.tsx`.
- `app/layout.tsx` — metadata + Geist fonts + Header/Footer. `next.config.ts` only sets `allowedDevOrigins`.
- `app/components/SuperVisualView.tsx` — dashboard derivado (score ring + KPIs + timeline/heatmap + radar). Toggle `grid|super` en `PasoCursosResultados.tsx:315`. Ver System Design en `docs/SYSTEM_DESIGN.md:1`.
- Path alias `@/*` -> `./*` (`tsconfig.json:22`, `vitest.config.ts:12`) — use `@/lib/...` and `@/app/...`.
- Styling: Tailwind 4 via `@tailwindcss/postcss` (`postcss.config.mjs`).

## Testing

- Config `vitest.config.ts:5`: `environment: "node"` by default, `include: ["tests/**/*.test.{ts,tsx}"]`, `setupFiles: ["tests/setup.ts"]` (jest-dom + cleanup).
- UI tests (`tests/ui.test.tsx:1`) opt into `// @vitest-environment jsdom` header — don't change global env to jsdom or node-only tests break.
- Fixtures: domain helpers inline in tests (e.g. `sesion()`/`horario()` factories). No external services or DB required. Coverage in `tests/` for parser, groups, generator, scoring, ocr, lectorArchivos, banner, filtros, ical, smokeExcel, ui.

## Gotchas

- State persistence keys: `horatriz-estado-v1` (fallback `hupao-estado-v1`) and `horatriz-borradores` in localStorage (`lib/estado.ts:14`); URL share uses base64url encode (`lib/estado.ts:30`). Changing shape requires bumping `v` and handling legacy fallback.
- Generator sorts candidates by `coincidenciasEspecificas` first, then `score`, then `minutosHuecos` (`lib/generator.ts:105`) — docente preferences filter is hard unless no match remains (`lib/generator.ts:142`). Time-bounded; `limite:true` signals truncation.
- Scoring weights from `DEFAULT_PREFERENCIAS` (`lib/model.ts:120`): `pesoHuecos 0.4`, `pesoDiasLibres 0.25`, `pesoMadrugada 0.15`, `pesoDocentes 0.2`.
- `lib/lectorArchivos.ts` — PDFs via `pdfjs-dist` worker fetched from CDN on first use; bitmap/scanned PDFs return no text (README suggests manual paste). Excel via `xlsx` (SheetJS).
- No CI, no `opencode.json`, no `.env` — don't add server-side assumptions.
