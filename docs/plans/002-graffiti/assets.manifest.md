# Manifiesto de assets · Graffiti y Tags

Estado: **completo**. Los SVG de Figma se descargaron el 2026-10-28 (archivo `Yo9o3ZG2lyaEGcyxoxs89R`, página `Visual · Pixel` `294:54606`, sección `Pixel · Sistema` `664:273890`). Los dos muros de ladrillo y hormigón no existen en Figma y se **generaron** (`generado: true`).

Todos los SVG son pixel art con `shape-rendering` nítido: dibujarlos en canvas con `imageSmoothingEnabled = false`. Colores de la paleta Línea azul salvo los muros generados (neutros) y los contornos `#171717`/`#1E1E1E`.

## Muros (fondos)
| Archivo | Tamaño | Colores | Origen | Uso |
|---|---|---|---|---|
| `muros/ladrillo.svg` | 480×480 | beiges `#B5A68A`…`#E8DFCC` | generado (`graffiti/scripts/generar-muros.py`) | Muro por defecto |
| `muros/hormigon.svg` | 480×480 | grises `#7C7C77`…`#C4C4BE` | generado (mismo script) | Muro |
| `muros/persiana.svg` | 240×240 | `#0062B8` `#7FC8F8` | Figma `510:1177` P05 · Persiana | Muro |
| `muros/damero.svg` | 240×240 | `#0062B8` `#7FC8F8` | Figma `510:1162` P01 · Damero | Muro |
| `muros/damero-spray.svg` | 240×240 | `#0062B8` `#FFC20E` | Figma `510:1182` P06 · Damero inclinado (spray) | Muro |
| `muros/trazos-rodillo.svg` | 240×240 | `#00A651` `#FFC20E` `#F4EEE3` | Figma `510:1200` P12 · Trazos de rodillo | Muro |
| `muros/chorreos.svg` | 240×240 | `#0062B8` `#7FC8F8` `#FF8FB1` | Figma `510:1196` P10 · Chorreos de pintura | Muro (referencia del goteo) |

Recomendación de UI: ofrecer 4 muros (ladrillo, hormigón, persiana, damero) y dejar los otros tres como extras si sobra tiempo. Los de 240×240 se escalan a 1080×1080 (×4,5) con suavizado apagado.

## Stickers (stencils para estampar), todos 240×240, con troquel blanco
| Archivo | Colores | Figma |
|---|---|---|
| `stickers/spray.svg` | `#0062B8` `#2B4BD8` `#7FC8F8` `#FF8FB1` | `510:1266` FA09 · Spray |
| `stickers/rodillo.svg` | `#00A651` `#FFC20E` `#FF8FB1` `#7FC8F8` | `510:1278` FA11 · Rodillo |
| `stickers/tarro-pintura.svg` | `#0062B8` `#2B4BD8` `#FF8FB1` `#7FC8F8` | `510:1222` Urbano · Tarro de pintura |
| `stickers/senal-rodillo.svg` | `#FFC20E` `#FF8FB1` `#7FC8F8` | `510:1228` Urbano · Señal rodillo |
| `stickers/plumon.svg` | `#0062B8` `#FF8FB1` `#7FC8F8` | `510:1234` Urbano · Plumón |
| `stickers/zapatilla.svg` | `#0062B8` `#FF8FB1` `#7FC8F8` | `510:1242` Urbano · Zapatilla |
| `stickers/cruce-peatonal.svg` | `#2B4BD8` `#00A651` `#FFC20E` `#7FC8F8` | `510:1285` Urbano · Cruce peatonal |
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
