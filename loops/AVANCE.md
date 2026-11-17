# Avance A8 · Teatro ronda 2 (archivo temporal: se borra en el último commit)

Rama `amaro/teatro-ronda-2` (desde `main` + merge de `origin/amaro/juego-pixel`). Pedido: feedback de Amaro del 17 nov.

## Hecho
- Lectura de planes 012 y 008, y de todo `loops/src/`.
- Medición base (antes): ver «Números» abajo.

## Falta, en este orden
1. Motor: rasterizar cada SVG una vez a bitmap (caché), carga diferida por escenario, dibujar solo si cambia el cuadro.
2. Pantalla de carga «Preparando el teatro…» con avance real.
3. Una sola tabla por pieza (escala inicial, mínimo, máximo, móvil, color) relativa al escenario.
4. UI: panel derecho con scroll propio, quitar duplicar, textos que no se salgan, selector de color.
5. Arte (scripts/generar-bocetos.py): huemul amable con cabeza y cola separadas, guanaco mejorado, 3 estados por animal, aleteo de la paloma en las aves, reemplazo de la flor.
6. Manifiesto `docs/plans/012-ui-herramientas/assets-teatro.manifest.md`, README, verificación Playwright en 6 resoluciones, `dist/`.

## Números
- Antes: (pendiente de anotar)
