# Assets · 009 Juego Pixel «Hora punta»

Arte del juego (plan `docs/plans/009-juego-pixel.md`). Acabado medio, para llevar a Figma después y afinarlo o reemplazarlo.

## De Figma (reusados del repo)
| Archivo | Origen | Uso |
|---|---|---|
| `juego-pixel/public/figma/personaje.svg` | Figma FA10 · Personaje Pixel (copia de `graffiti/public/figma/stickers/personaje.svg`, manifiesto 002) | El jugador |
| `juego-pixel/public/figma/metro-lateral.svg` | Figma `522:2179` Línea 1 · lateral (copia de `vagon/public/figma/metro/linea1-lateral.svg`, manifiesto 005/metro) | El metro que cruza las vías (3 carros seguidos) y el metro detenido al fondo del andén |

## Generados (`generado: true`)
Sprites pixel definidos en código, en `juego-pixel/src/juego/sprites.ts`, con la paleta Línea azul (`#000000` `#F4EEE3` `#0062B8` `#2B4BD8` `#7FC8F8` `#FFC20E` `#00A651` `#FF8FB1` `#7A2E8E`) más grises y maderas.

| Sprite | Tamaño (px) | Colores | Uso |
|---|---|---|---|
| `AUTO` | 16 × 8 (2 celdas) | carrocería de la paleta (amarillo, verde, lapislázuli, rosa, morado), ventanas celeste | Tráfico de la calle |
| `MICRO` | 24 × 8 (3 celdas) | hueso, franja azul, ventanas celeste | Tráfico de la calle |
| `GRIS` | 8 × 8 | grises `#8F8F8A` `#6B6B66`, ojos | (sin uso desde los niveles; queda para el jefe) |
| `GRIS_LADO` | 8 × 8 | grises, ojos mirando de lado | Los Grises del andén (nivel 2) |
| `LATA` | 8 × 8 | el color de la pintura, tapa gris claro | Latas del nivel 1, munición, mural |
| `PIEZAS` (corazón, estrella, rayo, gota) | 7 × 7 | el color con que se atrapó al Gris | Piezas del nivel 2 y del mural |
| `BOLA` | 8 × 8 | el color de la pintura que lo atrapó | Grises atrapados |
| `ARBOL` | 8 × 8 | verdes, madera | Obstáculo de la plaza |
| `BANCA` | 8 × 8 | maderas | Obstáculo de la vereda |
| `BASURERO` | 8 × 8 | verdes | Obstáculo de la vereda |
| `SENAL` | 8 × 8 | amarillo que parpadea | Aviso del metro |
| Texturas del cruce | por celda | vereda `#CFC6B8`, plaza `#5DAA6E`, calle `#3D3A36`, vías `#77726A`, entrada del metro azul con borde amarillo y letrero «METRO» | Suelo de cada fila (`juego-pixel/src/juego/dibujoCruce.ts`) |
| Andén | 16 × 12 celdas | pared de azulejos hueso, franja azul, letrero «ANDÉN», vigas lapislázuli con remaches celeste, andén gris con borde amarillo | Nivel 2 (`juego-pixel/src/juego/dibujoAnden.ts`) |
| Mural | 4 × 3 casillas | pared de ladrillo hueso, azulejos negros con las piezas y latas | Pantalla final, tarjeta e inventario (`juego-pixel/src/juego/mural.ts`) |
