# Avance A8 · Teatro ronda 2 (archivo temporal: se borra en el último commit)

Rama `amaro/teatro-ronda-2` (desde `main` + merge de `origin/amaro/juego-pixel`). Pedido: feedback de Amaro del 17 nov.

## Hecho
- Motor del wip compilado, probado y corregido: caché de bitmaps (ImageBitmap) a la densidad justa por pieza, carga por
  escenario con «Preparando el teatro…», dibujo solo si cambia el cuadro, borde de papel por capa (sin lienzos grandes
  por cuadro) y sombra difuminada a 1/4.
- Tabla única por pieza (tamaño, mín., máx., móvil, colores); Sorpréndeme y «agregar» la usan (un solo astro, piezas enteras).
- UI: panel derecho con scroll propio, escenarios 2 × 2, nombres en dos líneas, línea de tiempo que crece con 8 piezas,
  play de 48 px, sin duplicar/copiar/pegar, selector de color (pez y huemul).
- Arte: huemul amable, guanaco con 3 animaciones, aleteo de la paloma en las aves, ≥ 3 estados por animal, añañuca en vez
  de la flor. Manifiesto en `docs/plans/012-ui-herramientas/assets-teatro.manifest.md`. README al día.

## Falta
- Medición final antes/después, verificación de pantalla en las 6 tablets y `dist/` (modo demo: no hay `.env.local`).
