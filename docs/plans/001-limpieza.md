# Plan 001 · Limpieza y verificación de lo existente

**Dueño de la ejecución:** Gemini/Antigravity (tareas en `docs/tasks/001-limpieza.md`). **Revisión:** Claude Code (A8).
**No tocar:** `loops/`, `index.html`, `shared/`, `taller-de-pixeles/`.

## Contexto
Fotomatón y Mosaicos tienen buen nivel, pero quedaron arreglos chicos que conviene cerrar antes de mostrar el MVP. Verificado en el repo el 2026-10-28:

- `fotomaton/src/components/Camara.tsx:19-25`: el `setInterval` de la cuenta regresiva y el `setTimeout` de 380 ms no se limpian al desmontar; si la persona toca "Inicio" durante la cuenta se llama a `capturar()`/`alFoto()` sobre un componente que ya no existe.
- **Bug confirmado del QR** (probado con Playwright sirviendo `fotomaton/dist` en la raíz): la página `/f/<id>` queda **en blanco**. `vite.config.ts` usa `base: './'`, así que en `/f/<id>` los assets se piden a `/f/assets/…` (el servidor responde `text/html` y el módulo JS falla). `vercel.json` solo reescribe `/f/:id`, no `/f/assets/*`. Además el enlace del QR es `${location.origin}/f/${id}` (`src/lib/publicar.ts:16,22`), que tampoco existe si el Fotomatón se sirve desde `<hub>/fotomaton/dist/`.
  **Decisión:** cambiar a `HashRouter` y construir el enlace con `location.pathname`, de modo que el QR funcione sirva donde se sirva (raíz, subcarpeta o dentro del hub) sin reglas de reescritura.
- `taller-mosaicos/src/lib/exportar.ts:39-42`: usa `window.claude.use('downloads')`, una API de entorno de artefactos que no existe en el navegador de la tablet.
- Código muerto en Mosaicos: `construirSVG` (`lib/exportar.ts:3`, sin consumidores), `COLORES` (importado y sin uso en `App.tsx:6`), `MAX_COLORES`, `usaA` y `usaB` (`data/formas.ts:40-41,65-66`).
- `taller-mosaicos/vite.config.ts` no declara `server.fs.allow: ['..']` como sí hacen Fotomatón y Loops, y su CSS importa `../../shared/somos-ui.css`.
- READMEs y `FIGMA_SYNC.md` desactualizados (ver tareas).

## Alcance
Solo lo listado. Nada de refactors ni dependencias nuevas.

## Criterios de aceptación
- `npm --prefix fotomaton run build` y `npm --prefix taller-mosaicos run build` en verde.
- Abrir `fotomaton/dist/index.html#/f/<id>` (servido en cualquier subruta) muestra la página de descarga y no queda en blanco.
- "Inicio" durante la cuenta regresiva no deja timers vivos ni dispara `alFoto`.
