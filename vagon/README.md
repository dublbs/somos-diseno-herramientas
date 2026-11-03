# Vagón (Pixel)

Diseña tu carro de metro pixel a pixel. Es la actividad Pixel que alimenta el HUB «Estación»: al tocar **Salir a la vía**, el carro queda guardado (`localStorage` `sd:vagon`) y pasa por la vía de la estación como el vagón pintado.

- **Base:** el lateral del metro de Figma (Pixel · FA08, Línea 1 y Línea 4), rasterizado a 24 × 24. Cada celda de Figma es un pixel y el carro mide dos módulos (48 × 24). Assets en `public/figma/` (manifiesto en `docs/plans/005-herramientas-de-diseno/metro.manifest.md`); los stickers son los de Graffiti.
- **Herramientas** (barra inferior fija):
  - Lápiz y Borrar, con grosor de 1, 2 o 3 px;
  - Balde, que rellena la zona del mismo color;
  - Sticker;
  - Tag, con la tipografía pixel de `shared/pixelfont.ts`.

  La paleta Línea azul va siempre a la vista.
- **Biblioteca** (barra derecha fija): el modelo, la cantidad de carros y las opciones de la herramienta activa.
- Es el piloto de la propuesta de barras fijas (`docs/plans/005-herramientas-de-diseno.md`): no tiene pestañas y nada hace scroll.
- La tarjeta exportada mide 1080 × 1350 y lleva la franja negra común.

```bash
npm --prefix vagon run dev
npm --prefix vagon run build
```
