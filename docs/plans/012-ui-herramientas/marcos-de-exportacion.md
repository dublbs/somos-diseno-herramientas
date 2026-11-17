# Marcos de exportación: inventario para llevar a Figma

Fecha: 17 nov 2026 · Pedido de Amaro: «hay que trabajar el marco de exportación en todo; por lo menos dejarlos listados
para llevarlos a Figma». Este es el listado de lo que **hoy** dibuja cada experiencia al exportar. No se rediseña aquí.

## La franja común (la usan 4 experiencias)
Tarjeta de **1080 × 1350**: el trabajo va en el cuadro superior de 1080 × 1080 y abajo una **franja negra de 270**.
| Elemento | Posición (px) | Estilo |
|---|---|---|
| Título, 2 líneas | x 56 · y 1172 y 1244 | Bricolage Grotesque 800, 66 px, Hueso `#F4EEE3` |
| «Somos Diseño · Semana del Diseño 2026» | derecha, x 1024 · y 1164 | DM Sans 500, 26 px, `#BDB6AA` |
| Lenguaje (y marco, en el Fotomatón) | derecha, x 1024 · y 1204 | DM Sans 500, 26 px, `#BDB6AA` |
| «INACAP Santiago Centro» | derecha, x 1024 · y 1244 | DM Sans 700, 26 px, Hueso |

## Por experiencia
| Experiencia | Qué exporta | Marco actual | Código | Pendiente de diseño |
|---|---|---|---|---|
| Fotomatón | PNG 1080 × 1350 | Marco de la campaña con la foto + franja común. Título: «Todas las formas / del diseño» | `fotomaton/src/lib/tarjeta.ts` | El título no nombra la experiencia |
| Graffiti | PNG 1080 × 1350 | Cielo hueso, la pared 1080 × 540, vereda gris + franja común. Título: «Graffiti / y tags» | `graffiti/src/lib/exportar.ts` | La pared ocupa solo la mitad del cuadro |
| Grabado | PNG 1080 × 1350 | El papel en 1080 × 1080 + franja común. Título: «Mi grabado / de taller» | `grabado/src/lib/comun.ts` (`tarjeta`) | Pasa a ser un afiche (plan 012): rediseñar |
| Hora punta | PNG 1080 × 1350 | Franjas de calle de fondo, letrero «MI MURAL», el mural, el personaje, caja de puntaje + franja común. Título: «Hora / punta» | `juego-pixel/src/juego/tarjeta.ts` | Cambia con el jefe (plan 012) |
| Teatro de Papel | PNG y video 1080 × 1350 | **Marco propio, distinto a la franja común:** borde interior a 36 px, encabezado «SOMOS DISEÑO · SEMANA DEL DISEÑO 2026» (DM Sans 800, 28 px) y «TEATRO DE PAPEL · …» (IBM Plex Mono), la escena al centro, pie con el nombre del modo (42 px) e «INACAP» | `loops/src/lib/exportarTarjeta.ts` | Unificar con la franja común o definir su variante |
| Mosaicos | PNG del tamaño del formato (1:1, 4:5, 9:16, 16:9…) | **Sin marco:** solo el mosaico sobre hueso | `taller-mosaicos/src/App.tsx` (`exportarPNG`) | No tiene marca ni franja |
| Audioreactiva | PNG de un cuadro y video del loop (6 s) | **Sin marco:** el lienzo tal cual | `audioreactiva/src/App.tsx` | No tiene marca ni franja |
| Credencial | PNG de la credencial | Silueta según el lenguaje (Orgánica redondeada, Geométrica recta, Pixel escalonada) | `credencial/src/pixel/render.ts` | — |
| Tu flyer (nuevo, plan 012 §8) | PNG 1080 × 1350 | 3 composiciones (una por lenguaje) + franja común | `credencial/` (en construcción) | Nace en esta ronda |

## Para trabajar en Figma (propuesta de orden)
1. **Una franja común en 3 versiones** (Pixel, Geométrica, Orgánica), como componente con variantes: título, lenguaje, sede.
2. **Variante para video** (Teatro y Audioreactiva): la misma franja, pensada para que el movimiento no la tape.
3. **Mosaicos y Audioreactiva:** hoy salen sin marca; decidir si llevan la franja o un sello chico en una esquina.
4. **Formatos:** todo es 4:5 (1080 × 1350). Decidir si hace falta 9:16 para historias.
