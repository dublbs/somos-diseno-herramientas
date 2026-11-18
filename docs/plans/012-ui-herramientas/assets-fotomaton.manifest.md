# Fotomatón · arte generado en la ronda 2 (plan 012, D4)

El arte se generó en el repo, sin Figma, en la paleta Línea azul. Los marcos salen de `scripts/marcos-generados.py`, que
escribe `shared/marcos-generados.ts`. Ese archivo reemplaza al marco de `shared/marcos-figma.ts` que tenga el mismo id.
`marcos-figma.ts` no se edita a mano y se puede volver a generar desde Figma sin perder nada.
Para regenerar: `python3 scripts/marcos-generados.py`.

Referencias Pixel: `juego-pixel/public/figma/metro-lateral.svg`, los afiches «Metro» (Figma `1046:17722`) y
«Ven a jugar» (`1191:217482`, con los arcades), y los stickers de `graffiti/public/figma/stickers/`.

Todos los marcos generados usan la zona de foto estándar, un cuadro de 150 × 150 al centro (45..195), o un círculo de
radio 75 en el Estallido y el Vinilo. Por eso no pasan por la tabla `AJUSTES`. La excepción es OM06: conserva su
geometría de Figma y sigue usando el ajuste de rombo.

| id | Marco | generado | Reemplaza | Por qué (feedback de Amaro, 17 nov) |
|---|---|---|---|---|
| GM02 | Estallido (Geométrica) | true | GM02 de Figma `647:113590` | «El tercer círculo recorta las figuras negras»: el hueco cuadrado de Figma con el paspartú cortaba el anillo interior. Ahora hay 3 anillos de cuñas alternadas (damero polar) que terminan en círculos y nacen del filo de la foto redonda, más 4 rayos en las esquinas |
| GM06 | Diamante (Geométrica) | true | GM06 de Figma `647:113593` | «No me convence». Ahora es una gema vista desde arriba: la foto es la mesa y 16 facetas planas en claro y oscuro bajan a un octógono que llena el cuadro, con aristas hueso y destellos de 4 puntas en las esquinas negras |
| OM06 | Diamante (Orgánica) | true (parcial) | Las 4 flores de OM06 de Figma `647:1383` | «Las flores las cambiaría». Se queda el rombo escalonado de Figma. Las flores pasan a ramitas de 3 hojas de papel recortado con nervio y una semilla |
| PM02 | Vinilo (Pixel) | true | PM02 de Figma `510:1129` | «El disco ocupa todo el marco y la foto es la etiqueta». Disco negro de radio 119 con surcos y brillos, etiqueta amarilla, la foto como etiqueta redonda, brazo del tocadiscos sobre los surcos y la funda en damero detrás |
| PM04 | Ventana web (Pixel) | true | PM04 «Ventana» de Figma `510:1137` | «No se ve muy web». Ahora hay ventanas apiladas con sombra dura, botones de ventana, pestañas («TU-FOTO.PNG», «SOMOS», +), barra de dirección con candado (`somosdiseno.cl/tu-foto`), favoritos, barra de scroll, «♥ 128», botón «Descargar» y puntero. Se renombra a «Ventana web» |
| PM05 | Metro (Pixel) | true | PM05 de Figma `510:1146` | **Ronda 3 (plan 014, 18 nov): «no se parece al metro de la Línea 1».** Ahora es el frente de un tren de L1 (como los NS-93 y NS-16) con los colores del lateral de Figma `522:2179` (`juego-pixel/public/figma/metro-lateral.svg`): carrocería blanca con el techo celeste, máscara negra con el parabrisas grande (la foto) y un limpiaparabrisas, letrero de destino con el «1» en rojo y «SOMOS DISENO» en ámbar, marcos de puerta morados a los costados, la franja roja del lateral (fina + gruesa) que da la vuelta por el frente, faros blanco y rojo en las esquinas, enganche, bajos negros con bogies morados y el túnel con luces de servicio y rieles. Sin logos reales. El rojo es el de la franja del lateral de Figma (no se recolorea). _Antes (ronda 2):_ «No se nota mucho». Ahora es el tren de frente, como el afiche «El vagón como lienzo»: cuerpo amarillo con esquinas escalonadas, letrero «L1 SOMOS DISENO», la foto como parabrisas, costados con trama de puntos, focos, enganche, ruedas y riel, y un túnel de azulejos detrás. Se saca el rojo INACAP, que solo va en el logo |
| PM06 | Señal (Pixel) | true | PM06 de Figma `510:1154` | **Ronda 3 (plan 014, 18 nov): «los stickers no se ven de calle».** Se queda la señal y los stickers se rehacen como se ven pegados en la calle: slaps con el borde blanco del troquel, unos encima de otros (un slap redondo con un ojo sobre uno viejo medio arrancado), restos de papel blanco de stickers arrancados con el borde roto, un «HELLO my name is» con un tag de plumón inclinado, un sticker de crew («CREW · SOMOS 2026») sujeto con cinta, un sticker roto en la esquina de la foto y un tag de plumón con chorreo directo sobre la señal. Todo inventado, sin marcas. _Antes (ronda 2):_ «Expandida y con stickers pegados». Ahora es una señal de advertencia en rombo amarillo que se sale del cuadro, con la foto como pictograma, tornillos, la placa «ZONA DE DISENO» y 5 stickers troquelados (corazón, estrella, cara, rayo y el tag «DSGN») pegados sobre las esquinas de la foto |

## Personaje de muestra (miniaturas y placas antes de la foto)

| Archivo | generado | Reemplaza | Por qué |
|---|---|---|---|
| `fotomaton/src/lib/demo.ts` (canvas, 360 × 360) | true | `fotomaton/public/figma/persona/*.svg` (los íconos de persona de Figma; los archivos quedan en el repo, ya no se usan) | **Ronda 3 (plan 014): el ícono clásico de usuario** (cabeza redonda y hombros, plano, en azul) en el estilo de cada lenguaje. Pixel: grilla de 24 × 24 con contorno negro de un escalón y brillo celeste sobre fondo amarillo. Geométrica: círculo y semicírculo perfectos, sin contorno, con cuartos de círculo en dos esquinas. Orgánica: papel recortado con pulso de tijera, sombra y grano sobre una mancha verde. _Antes (ronda 2):_ «mejorar el personaje de la preview». Ahora es un retrato de busto por lenguaje. Pixel: grilla de 24 × 24 con contorno negro de un escalón. Geométrica: círculos, semicírculos y triángulos planos. Orgánica: papel recortado con sombra y grano. Las luces y sombras quedan claras para que la trama, el CRT y el mosaico se lean en una miniatura |

## Efecto Geométrica

**Ronda 3 (plan 014): «Semitono de triángulos».** Es código (`mosaico` en `fotomaton/src/lib/trama.ts`), no un asset.
Una grilla regular de triángulos equiláteros alternados; cada celda lleva el tono claro de fondo y un triángulo del tono
oscuro que crece con la sombra (semitono de imprenta hecho con triángulos). Los tonos salen de la paleta por bandas de
luz: las tintas de luz parecida (rosa, celeste y amarillo en Línea azul) forman una banda y dentro de ella se elige la
de color más parecido a la foto. Niveles automáticos (percentiles 2 y 98). Con la tinta CMYK, cada triángulo va con su
color real en pocos niveles. Se eligió entre 4 ensayos con 3 caras (grilla de tono plano, semitono, truchet de cuartos
de círculo y cuadros partidos por la diagonal): es el que mejor deja reconocer la cara en todas las paletas y tamaños.
_Antes (ronda 2):_ triángulos que se partían en 4 donde había detalle; con caras se veía «bizarro».
