# Horatriz

Genera horarios universitarios optimizados a partir de tu oferta académica.
Todo el procesamiento (parseo, agrupación por LIGA, generación y scoring) ocurre **100% en el navegador**: no hay base de datos ni API, por lo que tu información nunca sale del dispositivo.

## Cómo usarlo

1. Copia el texto de tu oferta de cursos y pégalo en la app, súbelo como **foto** (OCR en el navegador) o como **archivo** (TXT, CSV, XLSX, XLS o PDF). El formato de impresión en texto del portal académico (con `NRC:`, `ID LIGA:`, `BLOQUE:` y horas `AM/PM`) se detecta automáticamente agrupando Teoría + Práctica/Laboratorio por el par de ligas que comparten.
2. Revisa el parseo automático y corrige las filas marcadas en ámbar.
3. Marca los cursos que quieres cursar y ajusta tus preferencias. Cada curso permite: asignar **créditos**, elegir **profesor preferido** y **fijar (📌)** la opción de horario que no debe moverse. También puedes **eliminar** un curso o **agregar más** sin perder lo configurado. Ajusta pesos (huecos, no madrugar, días libres, docentes, sedes) y el rango de **créditos objetivo**.
4. Genera y elige entre los horarios rankeados de 0 a 100%, cada uno con sus horas de clase, huecos y créditos totales.

## Estructura

```
lib/
  model.ts      # tipos del dominio (Sesion, Opcion, Curso, Preferencias)
  parser.ts     # parseo de texto (columnas + texto libre + formato portal UPAO) y normalización
  portal.ts     # lector del formato "impresión en texto" del portal UPAO (NRC/ID LIGA/BLOQUE)
  groups.ts     # agrupación de T/P/L por ID LIGA → opciones válidas (y combos de alternativas)
  generator.ts  # backtracking con poda por solapamiento, opciones fijadas y límites
  scoring.ts    # puntuación 0-100 con pesos configurables y rango de créditos objetivo
  ocr.ts        # limpieza de texto reconocido por OCR
  lectorArchivos.ts # lectura de TXT/CSV/Excel (SheetJS) y PDF (pdf.js)
app/
  components/   # wizard, grid semanal, editor de filas, preferencias, OCR, archivo
tests/          # Vitest para parser, grupos, generador, scoring, OCR y archivos
```

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm test             # tests
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run build        # build de producción
```

## Despliegue en Vercel

1. Sube este repositorio a GitHub.
2. En [vercel.com/new](https://vercel.com/new) importa el proyecto (framework: Next.js).
3. No requiere variables de entorno ni base de datos. Despliega y listo.

### Nota sobre PDFs

Los PDFs que son mapas de bits (escaneos) no contienen texto extraíble; para esos usa la pestaña **📷 Subir foto**. PDF.js también necesita descargar un worker (~1 MB) desde unpkg la primera vez que se usa un PDF.
