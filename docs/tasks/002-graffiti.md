# Tareas 002 · Graffiti y Tags (para Gemini/Antigravity)

Contexto y reglas: `AGENTS.md` y `docs/plans/002-graffiti.md`. Un commit por tarea (`feat(graffiti): …`). Corre `npm --prefix graffiti run build` antes de marcar `[x]`. Si una tarea no calza con lo descrito, anota el bloqueo debajo y detente. **No instales dependencias** salvo las que ya usa `taller-mosaicos`.

## T-010 · Scaffold de `graffiti/`
- Archivos a crear: `graffiti/package.json`, `graffiti/tsconfig.json`, `graffiti/vite.config.ts`, `graffiti/index.html`, `graffiti/.gitignore`, `graffiti/src/main.tsx`, `graffiti/src/App.tsx`, `graffiti/src/styles.css`. Archivos a editar: `package.json` (raíz).
- Cambio:
  - Copia `package.json`, `tsconfig.json` y `vite.config.ts` de `taller-mosaicos/` cambiando `name` a `graffiti` y `typescript` a `^7.0.2` (decisión del equipo: TypeScript 7 en todas las apps). En `vite.config.ts` conserva `base: './'` y agrega `server: { fs: { allow: ['..'] } }`.
  - `index.html`: título "Graffiti y Tags · Somos Diseño", `<html lang="es">`, **sin** `<link>` a Google Fonts (las fuentes salen de `shared/`).
  - `styles.css`: primera línea `@import '../../shared/somos-ui.css';` y luego `@import '../../shared/somos-fonts.css';`.
  - `App.tsx`: `useEffect` que fija `document.documentElement.dataset.visual = 'Pixel'`; encabezado con `<a className="volver" href="../../">` y el título; un `<main>` vacío por ahora.
  - Raíz `package.json`: agrega `dev:graffiti`, `dev:graffiti:tablet`, `build:graffiti` (mismo patrón que `mosaicos`) y añade `npm run build:graffiti` al final del script `build`.
- No tocar: `index.html` de la raíz, otras apps, `shared/`.
- Verificar: `npm --prefix graffiti install && npm --prefix graffiti run build`; `graffiti/dist/index.html` existe.
- [ ] Hecha

## T-011 · Lienzo con muro y cuadrícula
- Archivos: `graffiti/src/components/Lienzo.tsx` (nuevo), `graffiti/src/data/config.ts` (nuevo: `COLS = 60`, `FILAS = 60`, `PALETA`, `MUROS`), `graffiti/src/App.tsx`.
- Cambio: un `<canvas>` cuadrado que ocupa el ancho disponible (`ResizeObserver`, DPR máximo 2). Dibuja el muro elegido (`public/figma/muros/ladrillo.svg` o `hormigon.svg`, rutas con `import.meta.env.BASE_URL`) con `imageSmoothingEnabled = false` y encima el estado de pintura (`Uint8Array(COLS*FILAS)`, color = `PALETA[i-1]`, 0 = vacío) como `fillRect` por celda. Selector de muro con cuatro botones (`role="radiogroup"`). Cuadrícula tenue opcional (botón on/off, apagada por defecto).
- No tocar: el estado compartido aún no existe; mantén el estado en `App.tsx` con `useState`/`useRef`.
- Verificar: build; ver ambos muros en viewport 1024×768 y 768×1024.
- [ ] Hecha

## T-012 · Spray, paleta y boquilla
- Archivos: `graffiti/src/lib/spray.ts` (nuevo, función pura `pintarPunto(estado, cx, cy, radio, color, hits)`), `graffiti/src/components/Panel.tsx` (nuevo), `graffiti/src/components/Lienzo.tsx`.
- Cambio: `pointerdown`/`pointermove`/`pointerup` con `setPointerCapture`; convierte coordenadas de pantalla a celda; interpola entre el punto anterior y el actual con Bresenham; en cada punto llama a `pintarPunto`, que pinta las celdas dentro del `radio` con probabilidad ~0,6 (mayor cerca del centro) y suma 1 a `hits[celda]`. Panel: 6 botones de color (`aria-pressed`, mínimo 56×56 px) y 3 tamaños de boquilla (radio 1, 2, 3).
- No tocar: `config.ts` salvo para leer la paleta.
- Verificar: build; pintar con mouse y con el emulador táctil de DevTools.
- [ ] Hecha

## T-013 · Goteo
- Archivos: `graffiti/src/lib/goteo.ts` (nuevo), `graffiti/src/components/Lienzo.tsx`.
- Cambio: en `pintarPunto`, cuando `hits[celda]` llega a 5 y `Math.random() < 0.35` y hay menos de 40 chorros, crea `{ x, y, color, largo: 4 + floor(random*11), acumulado: 0 }`. En un bucle `requestAnimationFrame` (solo mientras haya chorros) suma `delta` ms; cada 70 ms cada chorro pinta la celda inmediatamente inferior con su color y avanza; al llegar a su `largo` o al borde inferior se elimina. Con `prefers-reduced-motion` el chorro se pinta completo de una vez. `hits` se reinicia en cada `pointerdown`.
- No tocar: la interpolación de T-012.
- Verificar: build; pintar encima de la misma zona genera chorros; con 40 chorros activos el FPS se mantiene fluido (Performance de DevTools, sin tareas largas > 50 ms).
- [ ] Hecha

## T-014 · Borrador, deshacer y vaciar
- Archivos: `graffiti/src/components/Panel.tsx`, `graffiti/src/components/Lienzo.tsx`.
- Cambio: botón "Borrador" (pone 0 en las celdas del radio, con la misma boquilla), "Deshacer" (pila de hasta 40 copias del `Uint8Array`, una al `pointerdown` de cada trazo; al deshacer se cancelan todos los chorros activos) y "Vaciar" (con confirmación de dos toques, 3 s, como el "Limpiar" de Mosaicos). "Deshacer" se deshabilita con la pila vacía.
- Verificar: build; pintar, deshacer y vaciar sin dejar chorros fantasma.
- [ ] Hecha

## T-015 · Exportar la tarjeta PNG
- Archivos: `graffiti/src/lib/exportar.ts` (nuevo), `graffiti/src/components/ModalExportar.tsx` (nuevo), `graffiti/src/App.tsx`.
- Cambio: crea un canvas de 1080×1350; dibuja el muro (suavizado apagado) y las celdas a 18 px en los primeros 1080×1080; debajo, la franja negra de 270 px copiando el diseño de `fotomaton/src/lib/tarjeta.ts` (título "Graffiti y Tags" a la izquierda; a la derecha "Somos Diseño · Semana del Diseño 2026", "Pixel · Graffiti y Tags" e "INACAP Santiago Centro"). Espera las fuentes con `document.fonts.load` antes de dibujar. El modal muestra la vista previa y botones "Guardar imagen" (`<a download>` con `URL.createObjectURL`, nombre `graffiti-somos-diseno.png`) y "Seguir pintando"; ciérralo con Esc y usa `role="dialog"` y `aria-modal="true"`.
- No tocar: el estado de pintura (solo se lee).
- Verificar: build; descargar el PNG y abrirlo: arte nítido (sin suavizado) y franja con el texto legible.
- [ ] Hecha

## T-016 · Stickers y stencils
- Assets listos: `graffiti/public/figma/stickers/*.svg` (8 stickers de 240×240) y `tag/tag-ejemplo.svg` (ver manifiesto). **No inventes ni dibujes stickers.**
- Archivos: `graffiti/src/data/config.ts` (lista `STICKERS` con id, nombre y ruta), `graffiti/src/components/Panel.tsx`, `graffiti/src/components/Lienzo.tsx`.
- Cambio: herramienta "Sticker" con una grilla de miniaturas (botones de 56 px mínimo). Con un sticker elegido, tocar el lienzo lo estampa centrado en la celda tocada con tamaño 24×24 celdas (1 toque = 1 estampa, no arrastra). El estampado se guarda **como imagen sobre una capa aparte** (`stickers[]` con `{id, x, y}`) y se dibuja encima de la pintura con `imageSmoothingEnabled = false`; entra a la pila de deshacer (la pila guarda pintura + lista de stickers). El borrador no afecta stickers; "Vaciar" sí los quita. Incluye los stickers en la exportación de T-015.
- Verificar: `npm --prefix graffiti run build`; estampar 3 stickers, deshacer uno, exportar el PNG: aparecen.
- [ ] Hecha

## T-017 · README de `graffiti/` y checklist
- Archivo: `graffiti/README.md` (nuevo)
- Cambio: qué es, cómo correrlo, estructura de carpetas, reglas del spray/goteo (valores de `docs/plans/002-graffiti.md`) y el checklist de calidad de `docs/ESTADO_DEL_HUB.md` §10 aplicado a Graffiti con cada ítem marcado según lo que verificaste.
- Verificar: todo comando y ruta citados existen.
- [ ] Hecha

## Al terminar
Avisa a Claude Code: él activa la tarjeta de Graffiti en el hub (`index.html`, enlace `graffiti/dist/`) y revisa el resultado.
