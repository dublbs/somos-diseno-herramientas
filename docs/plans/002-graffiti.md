# Plan 002 · Graffiti y Tags (experiencia Pixel del MVP)

**Ejecuta:** Gemini/Antigravity (tareas en `docs/tasks/002-graffiti.md`). **Assets y revisión:** Claude Code.
**No tocar:** `loops/`, `index.html` (la tarjeta del hub la activa Claude al final), `shared/`, `taller-de-pixeles/`.

## Qué es
Una pared de ladrillo u hormigón en cuadrícula pixel donde la persona pinta su firma con spray de trazo grueso; la pintura **chorrea** con gravedad, y al terminar exporta una tarjeta PNG 1080×1350. Texto de la tarjeta del hub: *"Pinta tu firma o ilustración urbana con trazo grueso y goteo de pintura en estética pixel digital."* Lenguaje visual: **Pixel** (`data-visual="Pixel"`).

## Decisiones de diseño
- **Stack:** React 18.3.1 + TypeScript + Vite 8.3.5, canvas 2D y `pointer events`. **Sin librerías nuevas** (nada de Framer Motion en esta pasada). Carpeta `graffiti/`, scaffold copiado de `taller-mosaicos/`.
- **Lienzo:** cuadrícula de **60 × 60 celdas**. En la tarjeta, 18 px por celda = 1080 × 1080. El estado es un `Uint8Array(3600)` de índices de color (0 = sin pintura, se ve el muro).
- **Paleta (6):** Lapislázuli `#2B4BD8`, Rosa `#FF8FB1`, Amarillo `#FFC20E`, Verde `#00A651`, Celeste `#7FC8F8`, Negro `#000000`. Más borrador (devuelve el muro).
- **Boquilla:** 3 tamaños (radio 1, 2 y 3 celdas).
- **Spray:** al mover el dedo se interpolan los puntos (Bresenham) y en cada punto se pintan las celdas dentro del radio con probabilidad ~0,6 (más denso al centro). Cada celda cuenta cuántas veces se repinta en el trazo (`hits`).
- **Goteo:** cuando una celda llega a 5 repintadas y `Math.random() < 0,35`, nace un chorro que baja 1 celda cada ~70 ms durante 4–14 celdas pintando con el color de origen. Máximo 40 chorros a la vez. Se avanzan por tiempo (`requestAnimationFrame` con delta), no por frame.
- **Deshacer:** pila de hasta 40 copias del `Uint8Array` (3,6 kB c/u), una por trazo (al `pointerdown`). Deshacer cancela todos los chorros activos.
- **Fondos de muro:** `ladrillo` y `hormigón` (generados). Persiana y damero vienen de Figma cuando se complete la descarga (ver manifiesto). El muro se dibuja con `imageSmoothingEnabled = false`.
- **Exportar:** PNG 1080×1350 con el mismo diseño que el Fotomatón (`fotomaton/src/lib/tarjeta.ts`): arte cuadrado de 1080 arriba y franja negra de 270 px abajo con el título y el pie "Somos Diseño · Semana del Diseño 2026 / INACAP Santiago Centro".
- **Táctil:** botones de al menos 56 px, `touch-action: none` en el lienzo, sin zoom de pellizco. Respetar `prefers-reduced-motion` (los chorros se pintan de una vez, sin animar).
- **Sin internet:** íconos como SVG en línea (nada de Material Symbols por CDN); fuentes con `@import '../../shared/somos-fonts.css'` en `styles.css`.
- **Volver al hub:** `<a class="volver" href="../../">` como las demás apps.

## Assets
Manifiesto: `docs/plans/002-graffiti/assets.manifest.md`. Disponibles: `graffiti/public/figma/muros/ladrillo.svg` y `hormigon.svg` (generados). **Pendientes** (descarga desde Figma bloqueada por la red): persiana, damero, stickers y tag de ejemplo. La tarea de stickers (T-016) queda bloqueada hasta que Claude complete el manifiesto.

## Criterios de aceptación (experiencia completa)
Se entra desde el hub, se elige muro y color, se pinta, chorrea, se borra y deshace, se exporta un PNG correcto y se vuelve al hub. Probado en viewport tablet (1024×768 y 768×1024) sin caídas de fps con 40 chorros activos.
