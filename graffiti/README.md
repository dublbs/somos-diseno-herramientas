# Graffiti y Tags · Somos Diseño (lenguaje Pixel)

Una pared en cuadrícula pixel (60 × 60 celdas) donde pintas tu firma con spray. Si insistes sobre la misma zona, la pintura **chorrea**. Puedes cambiar de muro, pegar stickers y llevarte una tarjeta PNG de 1080 × 1350.

## Correr
```bash
npm --prefix graffiti install
npm --prefix graffiti run dev        # desarrollo
npm --prefix graffiti run build      # tsc + vite → graffiti/dist (lo enlaza el hub)
```

## Cómo funciona
- `src/data/config.ts`: cuadrícula, paleta (8 colores Línea azul), boquillas (radio 1–3), muros, stickers y límites.
- `src/lib/pintura.ts`: el dibujo es un `Uint8Array(3600)` (0 = muro, n = color n) más una lista de stickers.
  - **Spray** (`rociar`): pinta las celdas dentro del radio con probabilidad mayor al centro; el trazo se interpola con Bresenham (`linea`).
  - **Goteo** (`gotear`): cuando una celda se repinta 5 veces en el mismo trazo, con 35 % de probabilidad nace un chorro de 4–14 celdas que baja una celda cada 70 ms. Máximo 40 chorros. Con «reducir movimiento» se pinta de una vez.
  - **Deshacer**: hasta 40 copias (una por trazo o sticker).
- `src/lib/dibujar.ts`: dibuja muro + pintura + stickers sin suavizado (pantalla y tarjeta usan la misma función).
- `src/lib/exportar.ts`: tarjeta 1080 × 1350 con la franja negra común (como el Fotomatón).
- Layout: `shared/somos-ui.css` (pantalla fija sin scroll; pestañas Pintar · Muro · Stickers; acciones al pie).

## Assets
`public/figma/` — ver `docs/plans/002-graffiti/assets.manifest.md`. Los muros de ladrillo y hormigón se generan con `scripts/generar-muros.py`; el resto viene de Figma. `scripts/limpiar-fondos.py` quita los fondos de los marcos padres que trae la exportación de Figma.
