# Tareas 001 · Limpieza (para Gemini/Antigravity)

Contexto y reglas: `AGENTS.md` y `docs/plans/001-limpieza.md`. Un commit por tarea (`fix(fotomaton): …`). Corre el build indicado antes de marcar `[x]`. Si algo no calza con lo descrito, escribe el bloqueo bajo la tarea y detente.

## T-001 · Limpiar los timers de la cuenta regresiva
- Archivo: `fotomaton/src/components/Camara.tsx` (líneas ~16-26, función `disparar`)
- Cambio: guarda el id del `setInterval` y el del `setTimeout` (los de `disparar`) en `useRef`, y límpialos en el `return` de un `useEffect(() => () => {…}, [])` que se ejecute al desmontar. Al terminar la cuenta, limpia también el ref del intervalo.
- No tocar: `hooks/useCamara.ts`, estilos, la firma de las props.
- Verificar: `npm --prefix fotomaton run build`
- Aceptación: tocar "Inicio" durante la cuenta no llama a `capturar()` ni a `alFoto`.
- [ ] Hecha

## T-002 · Cambiar a HashRouter y arreglar el enlace del QR
- Archivos: `fotomaton/src/main.tsx`, `fotomaton/src/lib/publicar.ts` (líneas ~16 y ~22), `fotomaton/vercel.json`
- Cambio:
  1. En `main.tsx` reemplaza `BrowserRouter` por `HashRouter` (mismo paquete `react-router-dom`, mismas rutas `/f/:id` y `*`).
  2. En `publicar.ts` el enlace pasa a `` `${location.origin}${location.pathname}#/f/${id}` `` (en las dos ramas: con y sin Supabase). Extrae una constante/función local `enlaceTarjeta(id)` para no duplicarlo.
  3. En `vercel.json` elimina la regla de reescritura `/f/:id` (ya no hace falta); déjalo como `{}`.
- No tocar: `pages/Descarga.tsx`, `almacenLocal.ts`, Supabase.
- Verificar: `npm --prefix fotomaton run build`; luego `npx serve fotomaton/dist -l 8101` y abre `http://localhost:8101/#/f/<cualquier-uuid>`: debe mostrar la pantalla de descarga ("no encontrada/expiró", no una página en blanco) y sin errores de consola.
- Aceptación: el QR de una tarjeta hecha en modo prueba abre la descarga también cuando la app se sirve desde `/fotomaton/dist/`.
- [ ] Hecha

## T-003 · Quitar la API `window.claude` de la exportación
- Archivo: `taller-mosaicos/src/lib/exportar.ts` (función `guardarArchivo`, líneas ~37-52)
- Cambio: elimina el bloque `try/catch` que usa `window.claude.use('downloads')`. Deja solo la descarga con `<a download>` (`URL.createObjectURL`). Mantén la firma `Promise<'guardado' | 'cancelado' | 'ocupado'>` para no romper a los llamadores (devuelve siempre `'guardado'`).
- No tocar: quién llama a `guardarArchivo`.
- Verificar: `npm --prefix taller-mosaicos run build`
- Aceptación: "Exportar PNG" descarga el archivo.
- [ ] Hecha

## T-004 · Borrar `construirSVG`
- Archivo: `taller-mosaicos/src/lib/exportar.ts` (líneas 1-35)
- Cambio: elimina la función `construirSVG` y los imports que queden sin uso (`Formato`, `Celda`, `forma`, `HEX`, `U`). Antes comprueba con `grep -rn construirSVG taller-mosaicos/src` que nadie la usa.
- Verificar: `npm --prefix taller-mosaicos run build`
- [ ] Hecha

## T-005 · Borrar constantes sin uso de Mosaicos
- Archivos: `taller-mosaicos/src/data/formas.ts` (líneas ~40-41 y ~65-66), `taller-mosaicos/src/App.tsx` (línea ~6)
- Cambio: elimina `usaA`, `usaB`, `COLORES`, `MAX_COLORES` y el `COLORES` importado en `App.tsx`. Comprueba con `grep` que no hay otros usos. **No** toques `celdasDelPincel` ni `normalizarFormato`: sí se usan.
- Verificar: `npm --prefix taller-mosaicos run build`
- [ ] Hecha

## T-006 · `server.fs.allow` en Mosaicos
- Archivo: `taller-mosaicos/vite.config.ts`
- Cambio: agrega `server: { fs: { allow: ['..'] } }` como en `fotomaton/vite.config.ts`.
- Verificar: `npm --prefix taller-mosaicos run dev` y abrir la app: los estilos de `shared/` cargan.
- [ ] Hecha

## T-007 · README raíz real
- Archivo: `README.md`
- Cambio: reescríbelo según el repo actual. Debe decir: qué es el hub; las experiencias (Fotomatón, Taller de Mosaicos, Teatro de Papel, Graffiti y Tags en construcción); que Taller de Píxeles se descartó; que **todas son apps React + Vite** (no HTML sueltos); cómo correr (`npm run build` y luego `npm run dev:hub`, porque el hub enlaza a `<app>/dist/`; `npm run dev:<app>` para desarrollar). Enlaza a `docs/ESTADO_DEL_HUB.md` y `AGENTS.md`.
- No tocar: nada fuera de `README.md`.
- Verificar: cada comando y ruta que escribas existe (`package.json`, carpetas).
- [ ] Hecha

## T-008 · README de Mosaicos real
- Archivo: `taller-mosaicos/README.md`
- Cambio: describe solo lo que existe en `src/` (formatos, formas, paletas, herramientas Poner/Girar/Reflejar/Borrar/Multiplicar, Sorpréndeme, exportar PNG, `localStorage`). Quita lo que ya no existe: "Mis figuras", exportación SVG, regla de 4 colores, `src/formas.js` (hoy `src/data/formas.ts`) y "un solo archivo autocontenido".
- Verificar: contrasta cada afirmación con `taller-mosaicos/src/**`.
- [ ] Hecha

## T-009 · `FIGMA_SYNC.md` real
- Archivo: `FIGMA_SYNC.md`
- Cambio: deja solo lo verificable: archivo maestro `Yo9o3ZG2lyaEGcyxoxs89R`, páginas `Visual · Pixel` (`294:54606`), `Visual · Orgánica` (`318:54606`), `Visual · Geométrica (pauta)` (`324:54606`), y cómo se exportan los SVG a `<app>/public/figma/<grupo>/`. Elimina `src/data/figma-tokens.ts` y la estructura `public/assets/figma/…`, que no existen. Aclara que el MCP de Figma lo usa Claude Code; Antigravity recibe los assets ya descargados.
- Verificar: las rutas citadas existen.
- [ ] Hecha

## T-010 · Unificar TypeScript *(en espera de decisión)*
- **No ejecutar hasta que la persona responsable elija versión.** Fotomatón usa `^7.0.2`; Loops y Mosaicos `^5.6.3`.
- [ ] Hecha
