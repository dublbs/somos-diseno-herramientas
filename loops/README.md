# Teatro de Papel · Somos Diseño (lenguaje Orgánica)

Arma una escena de papel recortado (Cordillera, Mar, Desierto o Bosque), suma personajes y elementos que se mueven en loop, dales un trayecto y llévate un video o una tarjeta PNG.

- **Barra superior**: Deshacer, Rehacer, Sorpréndeme, Tarjeta y Grabar loop.
- **Panel derecho** (con scroll propio si no cabe): Escenario, Biblioteca (tocar agrega la pieza donde menos se pisa; arrastrar la deja donde se suelta), la pieza elegida (animación, trayecto Quieto / De A a B, color en las piezas que lo tienen, Agrandar, Achicar, Voltear, Invertir, Al frente, Al fondo, Quitar) y Vaciar. A propósito no hay duplicar ni copiar y pegar.
- **Barra inferior**: reproducir, tiempo, FPS (8/12/24), borde de papel y la línea de tiempo (una fila por pieza; B se arrastra para elegir cuándo llega). Tope: 8 piezas por escena.
- **Carga**: al abrir se prepara primero el escenario que se ve («Preparando el teatro…» con su avance) y después los otros en segundo plano. Cada SVG se rasteriza una vez a un bitmap (`src/escenario/recursos.ts`), a la densidad justa para su tamaño máximo.
- **Tamaños**: una sola tabla por pieza (`PERFILES` en `src/escenario/piezas.ts`) con el tamaño inicial, el mínimo y el máximo en unidades del escenario (240 = alto), si camina y sus colores.
- **Medir**: `?diag` en la URL guarda en `window.teatroDiag` los cuadros dibujados y su costo (`cuadros`, `msDibujo`); en pausa no se dibuja nada si no cambia algo.
- Las piezas y fondos son SVG de Figma en `public/figma/organica/` y bocetos generados en `public/figma/organica-bocetos/` (`scripts/generar-bocetos.py`, manifiesto en `docs/plans/012-ui-herramientas/assets-teatro.manifest.md`); sus movimientos están en `src/escenario/piezas.ts` y se dibujan en canvas (`src/escenario/dibujar.ts`).

```bash
npm --prefix loops install
npm --prefix loops run dev
npm --prefix loops run build   # → loops/dist (lo enlaza el hub)
```
