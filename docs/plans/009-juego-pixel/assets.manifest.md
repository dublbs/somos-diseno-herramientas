# Assets · 009 Juego Pixel «Hora punta»

Arte del juego (plan `docs/plans/009-juego-pixel.md`). Acabado medio, para llevar a Figma después y afinarlo o reemplazarlo.

## De Figma (reusados del repo)
| Archivo | Origen | Uso |
|---|---|---|
| `juego-pixel/public/figma/personaje.svg` | Figma FA10 · Personaje Pixel (copia de `graffiti/public/figma/stickers/personaje.svg`, manifiesto 002) | El jugador |
| `juego-pixel/public/figma/metro-lateral.svg` | Figma `522:2179` Línea 1 · lateral (copia de `vagon/public/figma/metro/linea1-lateral.svg`, manifiesto 005/metro) | El metro que cruza las vías (3 carros seguidos) |

## Generados (`generado: true`)
Sprites pixel definidos en código, en `juego-pixel/src/juego/sprites.ts`, con la paleta Línea azul (`#000000` `#F4EEE3` `#0062B8` `#2B4BD8` `#7FC8F8` `#FFC20E` `#00A651` `#FF8FB1` `#7A2E8E`) más grises y maderas.

| Sprite | Tamaño (px) | Colores | Uso |
|---|---|---|---|
| `AUTO` | 16 × 8 (2 celdas) | carrocería de la paleta (amarillo, verde, lapislázuli, rosa, morado), ventanas celeste | Tráfico de la calle |
| `MICRO` | 24 × 8 (3 celdas) | hueso, franja azul, ventanas celeste | Tráfico de la calle |
| `GRIS` | 8 × 8 | grises `#8F8F8A` `#6B6B66`, ojos | Los perseguidores |
| `BOLA` | 8 × 8 | el color de la pintura que lo atrapó | Grises atrapados |
| `ARBOL` | 8 × 8 | verdes, madera | Obstáculo de la plaza |
| `BANCA` | 8 × 8 | maderas | Obstáculo de la vereda |
| `BASURERO` | 8 × 8 | verdes | Obstáculo de la vereda |
| `SENAL` | 8 × 8 | amarillo que parpadea | Aviso del metro |
| Texturas | por celda | vereda `#CFC6B8`, plaza `#5DAA6E`, calle `#3D3A36`, vías `#77726A` | Suelo de cada fila (`juego-pixel/src/juego/dibujo.ts`) |
