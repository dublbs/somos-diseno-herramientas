# Teatro de Papel · Somos Diseño (lenguaje Orgánica)

Arma una escena de papel recortado (Cordillera, Mar o Desierto), suma personajes y elementos que se mueven en loop, ajústalos y llévate un video o una tarjeta PNG.

- **Pestaña Escena**: escenario, bandeja de piezas y Sorpréndeme.
- **Pestaña de la pieza** (se abre sola al tocar una figura): trayecto A → B para seres móviles, variantes de animación, tamaño, voltear, capas, duplicar y quitar.
- **Pie fijo**: Generar loop (video), Tarjeta PNG y Vaciar. Bajo el lienzo: reproducir/pausar, línea de tiempo, FPS (8/12/24), borde de papel y deshacer.
- Las piezas y fondos son SVG de Figma en `public/figma/organica/`; sus movimientos están en `src/escenario/piezas.ts` y se dibujan en canvas (`src/escenario/dibujar.ts`).

```bash
npm --prefix loops install
npm --prefix loops run dev
npm --prefix loops run build   # → loops/dist (lo enlaza el hub)
```
