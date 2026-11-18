# Assets · 009 Juego Pixel «Hora punta»

Arte del juego (plan `docs/plans/009-juego-pixel.md`). Acabado medio, para llevar a Figma después y afinarlo o reemplazarlo.
Desde la ronda 2 (17 nov): el cruce se dibuja en 3/4 con volúmenes, sale La pared y entra el Inacapín Pixel (ver abajo).

## De Figma (reusados del repo)
| Archivo | Origen | Uso |
|---|---|---|
| `juego-pixel/public/figma/personaje.svg` | Figma FA10 · Personaje Pixel (copia de `graffiti/public/figma/stickers/personaje.svg`, manifiesto 002) | El jugador |
| `juego-pixel/public/figma/metro-lateral.svg` | Figma `522:2179` Línea 1 · lateral (copia de `vagon/public/figma/metro/linea1-lateral.svg`, manifiesto 005/metro) | El metro que cruza las vías (3 carros seguidos) y el metro detenido al fondo del andén |

## Generados (`generado: true`)
Sprites pixel definidos en código, en `juego-pixel/src/juego/sprites.ts`, con la paleta Línea azul (`#000000` `#F4EEE3` `#0062B8` `#2B4BD8` `#7FC8F8` `#FFC20E` `#00A651` `#FF8FB1` `#7A2E8E`) más grises y maderas.

| Sprite | Tamaño (px) | Colores | Uso |
|---|---|---|---|
| `GRIS_LADO` | 8 × 8 | grises, ojos mirando de lado | Los Grises del andén (nivel 2) |
| `LATA` | 8 × 8 | el color de la pintura, tapa gris claro | Latas del nivel 1, munición, mural |
| `PIEZAS` (corazón, estrella, rayo, gota) | 7 × 7 | el color con que se atrapó al Gris | Piezas del nivel 2 y del mural |
| `BOLA` | 8 × 8 | el color de la pintura que lo atrapó | Grises atrapados |
| Andén | 16 × 12 celdas | pared de azulejos hueso, franja azul, letrero «ANDÉN», vigas lapislázuli con remaches celeste, andén gris con borde amarillo | Nivel 2 (`juego-pixel/src/juego/dibujoAnden.ts`) |
| `TROFEO` | 8 × 8 | amarillo y negro | Primera casilla del mural si venciste al Inacapín |
| `INACAPIN` | 16 × 16 | gris por partes (antenas, cabeza, cara, brazos, panza, pies) que recuperan rosa, amarillo, celeste, verde, morado y azul | El jefe; personaje propio **sin el logo ni los colores de INACAP**, **a validar por el equipo** (`dibujoJefe.ts`) |
| Mural | 4 × 3 casillas | pared de ladrillo hueso, azulejos negros con el trofeo, las piezas y las latas | Pantalla final, tarjeta e inventario (`juego-pixel/src/juego/mural.ts`) |

### Cruce isométrico (ronda 2, `generado: true`, dibujado con cajas en `juego-pixel/src/juego/dibujoCruce.ts`)
Cajas de 3 tonos del mismo color (techo, frente 80 %, costado 60 %) con contorno negro; cada pieza se dibuja una vez y
después se estampa.

| Pieza | Volumen | Colores | Uso |
|---|---|---|---|
| Auto | 2 × 0,7 celdas, cabina y ruedas | carrocería amarillo, verde, lapislázuli, rosa o morado; ventanas celeste; focos hueso y rosa | Tráfico de la calle |
| Micro | 3 × 0,8 celdas | hueso, franja negra de ventanas celeste, franja azul | Tráfico de la calle |
| Metro | 3 carros de 3,3 celdas | costado = `metro-lateral.svg`; trompa amarilla con parabrisas negro | Las vías |
| Árbol, banca, basurero, señal | 1 celda | verdes y madera; banca madera; basurero verde; señal negra con luz amarilla | Obstáculos y aviso del metro |
| Pórtico del metro | 6 celdas | pilares azul, viga lapislázuli, letrero hueso «METRO», escalera gris | Meta del cruce |
| Suelo | bandas inclinadas | vereda `#D9D0C1`, plaza `#5DAA6E`, calle `#3D3A36` con líneas hueso y solera amarilla, vías `#77726A` con durmientes, estación `#0062B8` con borde amarillo | Filas |
