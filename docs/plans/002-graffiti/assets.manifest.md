# Manifiesto de assets · Graffiti y Tags

Estado: **completo**. Los SVG de Figma se descargaron el 2026-10-28 (archivo `Yo9o3ZG2lyaEGcyxoxs89R`, página `Visual · Pixel` `294:54606`, sección `Pixel · Sistema` `664:273890`). Los dos muros de ladrillo y hormigón no existen en Figma y se **generaron** (`generado: true`).

Todos los SVG son pixel art con `shape-rendering` nítido: dibujarlos en canvas con `imageSmoothingEnabled = false`. Colores de la paleta Línea azul salvo los muros generados (neutros) y los contornos `#171717`/`#1E1E1E`.

## Muros (fondos)
Plan 009 §3 (13 nov 2026): la pared pasa a ser **horizontal 2:1** (160 × 80 celdas) y quedan 4 muros: ladrillo, hormigón, cortina metálica y vagón de metro. Se generan con `python3 graffiti/scripts/generar-muros.py`.

| Archivo | Tamaño | Colores | Origen | Uso |
|---|---|---|---|---|
| `muros/ladrillo.svg` | 960×480 (160×80 celdas) | beiges `#B5A68A`…`#E8DFCC` | generado (`graffiti/scripts/generar-muros.py`) | Muro por defecto |
| `muros/hormigon.svg` | 960×480 (160×80 celdas) | grises `#7C7C77`…`#C4C4BE` | generado (mismo script) | Muro |
| `muros/cortina.svg` | 1080×540 | `#8FCCF7` `#F4EEE3` `#0063BF` `#000000` | Figma `906:8320` «Láminas» de la cortina metálica (libreta Pixel, portada «cortina completa»), recortada a 2:1 por el script | Muro |
| `muros/vagon.svg` | 960×480 | los de la Línea 1 | Figma `522:2179` Línea 1 · lateral (`vagon/public/figma/metro/linea1-lateral.svg`) repetido dos veces por el script | Muro |
| `muros/persiana.svg` | 240×240 | `#0062B8` `#7FC8F8` | Figma `510:1177` P05 · Persiana | Ya no se ofrece (plan 009) |
| `muros/damero.svg` | 240×240 | `#0062B8` `#7FC8F8` | Figma `510:1162` P01 · Damero | Ya no se ofrece (plan 009) |
| `muros/damero-spray.svg` | 240×240 | `#0062B8` `#FFC20E` | Figma `510:1182` P06 · Damero inclinado (spray) | Sin usar |
| `muros/trazos-rodillo.svg` | 240×240 | `#00A651` `#FFC20E` `#F4EEE3` | Figma `510:1200` P12 · Trazos de rodillo | Referencia de la textura del rodillo |
| `muros/chorreos.svg` | 240×240 | `#0062B8` `#7FC8F8` `#FF8FB1` | Figma `510:1196` P10 · Chorreos de pintura | Referencia del goteo |

## Stickers (stencils para estampar), todos 240×240, con troquel blanco
| Archivo | Colores | Figma |
|---|---|---|
| `stickers/spray.svg` | `#0062B8` `#2B4BD8` `#7FC8F8` `#FF8FB1` | `510:1266` FA09 · Spray |
| `stickers/rodillo.svg` | `#00A651` `#FFC20E` `#FF8FB1` `#7FC8F8` | `510:1278` FA11 · Rodillo |
| `stickers/tarro-pintura.svg` | `#0062B8` `#2B4BD8` `#FF8FB1` `#7FC8F8` | `510:1222` Urbano · Tarro de pintura |
| `stickers/senal-rodillo.svg` | `#FFC20E` `#FF8FB1` `#7FC8F8` | `510:1228` Urbano · Señal rodillo |
| `stickers/plumon.svg` | `#0062B8` `#FF8FB1` `#7FC8F8` | `510:1234` Urbano · Plumón |
| `stickers/personaje.svg` | `#00A651` `#7FC8F8` | `510:1273` FA10 · Personaje |

## Otros
| Archivo | Tamaño | Figma | Uso |
|---|---|---|---|
| `tag/tag-ejemplo.svg` | 580×420 | `712:2085` Tipografía · Tag (handstyle con halo de spray y chorreos), texto "DISEÑO" en `#7A2E8E` | Plantilla/ejemplo de tag para estampar o como referencia visual |
| `herramientas/cuentagotas.svg` | 240×240 | `317:82517` Herramienta · Cuentagotas | Ícono del selector de color (opcional) |

## Notas para Antigravity
- No dibujes ni modifiques estos SVG. Si necesitas otra pieza, anótalo en la tarea y Claude Code la trae de Figma.
- Los stickers traen contorno y fondo propios: se estampan tal cual (rasterizados a la cuadrícula o dibujados directo sobre el canvas de exportación).
- Más piezas disponibles en Figma si hacen falta: hoja `510:1209` (Ajedrez, Ecualizador, Vinilo, Metro, marcas FoF/Figma/INACAP).

«Zapatilla» y «Cruce peatonal» salieron en la ronda 5: en su lugar está el stencil como herramienta (plan 004).

## Stencils (herramienta, 2 capas) · ronda 5
Generados por `graffiti/scripts/generar-stencils.py` desde los SVG pixel de Figma, en `graffiti/src/data/stencils.ts` (máscaras) y `stencils/<id>.svg` (vista previa: capa 1 lapislázuli, capa 2 amarillo). Capa 1 = silueta; capa 2 = contorno y colores de detalle.

| Archivo | Grilla | Origen | Capa 2 |
|---|---|---|---|
| `stencils/alien.svg` | 22×22 | Figma `510:1273` FA10 · Personaje | contorno y ojos (hueso) |
| `stencils/diseno.svg` | 37×9 | `shared/pixelfont.ts`, «DISEÑO» | la letra (capa 1 es la letra engrosada) |
| `stencils/lata.svg` | 22×23 | Figma `510:1266` FA09 · Spray | contorno y la nube (rosa) |
| `stencils/metro.svg` | 20×22 | Figma FA08 · Metro / Línea 1 · frente | contorno, ventanas (negro) y luces (amarillo) |

La textura del **rodillo** sale del patrón P12 «Trazos de rodillo» (`510:1200`, `muros/trazos-rodillo.svg`): el hueso es la veta que queda sin pintar (`TEXTURA_RODILLO`, 24×24).
