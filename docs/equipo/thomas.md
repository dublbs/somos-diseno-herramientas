# Cola de Thomas · carril Experiencias

Zona: `fotomaton/` (Cabina de fotos), `taller-mosaicos/`, `graffiti/`, `grabado/`, `audioreactiva/`, `juego-pixel/`,
`index.html`, `shared/ui/` (salvo `Juego.tsx`), `shared/marcos*.ts`. Reglas y pipeline: [`README.md`](README.md).

**El orden de este archivo es la prioridad.** Se toma la primera tarea en estado «Lista».

## T-002 · Script de verificación de pantalla para todas las experiencias
- Estado: Lista
- Origen: regla de pantalla de `AGENTS.md`. Hoy cada agente la hace a mano y de forma distinta.
- Archivos: nuevo `scripts/qa-pantalla/verificar.mjs` y `scripts/qa-pantalla/README.md`. No toca las apps.
- Cambio:
  - Usa Playwright con el Chromium preinstalado, cámara y micrófono falsos (`--use-fake-device-for-media-stream`,
    `--use-fake-ui-for-media-stream`). Sirve la raíz del repo con un servidor estático.
  - Abre `<app>/dist/` de las 7 experiencias de tablet y el hub `index.html` en 1024×768, 1180×820, 1280×720,
    1366×768, 768×1024 y 820×1180.
  - Mide por cada combinación:
    - scroll de página (`scrollHeight > innerHeight` o `scrollWidth > innerWidth` en `documentElement`);
    - controles fuera de la pantalla, sin contar los que están dentro del panel lateral con scroll;
    - botones de menos de 48 px;
    - errores de consola.
  - Guarda una captura por combinación en una carpeta ignorada por git y escribe un informe en Markdown.
  - Opción `--app <carpeta>` para medir una sola app y `--url <base>` para medir lo publicado en GitHub Pages.
- No tocar: el código de las apps. Las fallas que encuentre son hallazgos, no arreglos.
- Verificar: `node scripts/qa-pantalla/verificar.mjs --app taller-mosaicos` corre de punta a punta. Mosaicos es la
  referencia del kit v2 y debería salir limpio.
- Aceptación:
  - un solo comando deja `docs/qa/pantalla-<fecha>.md` con una tabla app × resolución y la lista de fallas;
  - el README explica cómo correrlo.

## T-003 · Pasada de pantalla después del evento y hallazgos
- Estado: Bloqueada (depende de T-002)
- Origen: E-007
- Archivos: `docs/qa/pantalla-<fecha>.md` y la sección «Hallazgos» de este archivo.
- Cambio:
  - Corre T-002 contra `main` (local) y contra GitHub Pages.
  - Cada falla, con app, resolución y captura, va a «Hallazgos». No se arregla en esta tarea.
- Aceptación: el informe existe y Amaro o Felipe pueden pasar cada falla a una tarea.

## T-001 · Qué falta del Teatro: auditoría de solo lectura
- Estado: Lista
- Origen: E-006
- Archivos: lectura de `loops/` y `docs/tasks/008-teatro.md`. Escribe solo `docs/qa/teatro-estado.md`.
- Cambio:
  - Revisa cada tarea T-000 a T-019 de `docs/tasks/008-teatro.md` contra el código actual de `loops/`, que el PR #39
    pasó al kit v2.
  - Clasifica cada una como «Hecha» (con commit o archivo como evidencia), «Parcial» (qué falta), «Pendiente» u
    «Obsoleta» (el kit v2 la reemplazó).
  - Abre `loops/dist/` en las 6 resoluciones y anota lo que se vea roto.
- No tocar: nada en `loops/`. Es de Felipe; esta tarea solo mira.
- Aceptación: `docs/qa/teatro-estado.md` con una fila por tarea y su evidencia. Con eso, Felipe decide qué se hace.

## Hallazgos
<!-- El agente agrega aquí lo que encuentre fuera de su tarea: «- dd/mm · app · qué · evidencia». Amaro o Felipe lo
pasan a la bitácora. -->
