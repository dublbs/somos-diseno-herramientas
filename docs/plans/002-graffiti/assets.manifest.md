# Manifiesto de assets · Graffiti y Tags

Estado: **parcial**. El host `www.figma.com` está bloqueado por la política de red del entorno cloud (los metadatos del archivo sí se leen por el MCP, pero la descarga de los SVG devuelve 403). Lo que existe en Figma **no se reemplazó con versiones inventadas**: queda pendiente de descarga. Solo se generaron los muros, que no existen en el archivo.

Archivo maestro: `Yo9o3ZG2lyaEGcyxoxs89R` · página `Visual · Pixel` (`294:54606`) · sección `Pixel · Sistema` (`664:273890`).

## Disponibles (generados, `generado: true`)

| Archivo | Tamaño | Uso | Origen |
|---|---|---|---|
| `graffiti/public/figma/muros/ladrillo.svg` | 480×600 (cuadrícula 60×75, 4:5) | Fondo de muro elegible | `graffiti/scripts/generar-muros.py` |
| `graffiti/public/figma/muros/hormigon.svg` | 480×600 (cuadrícula 60×75, 4:5) | Fondo de muro elegible | `graffiti/scripts/generar-muros.py` |

Paleta de los muros: neutros cálidos/grises (`#B5A68A`…`#E8DFCC`, `#B9B9B3`…`#7C7C77`); no usan la paleta Línea azul para que los colores del spray resalten.

## Pendientes de descarga desde Figma (existen en el archivo)

| Destino | Nodo Figma | Qué es | Uso en la app |
|---|---|---|---|
| `muros/persiana.svg` | `510:1177` | P05 · Persiana (cortina metálica) | Tercer fondo de muro |
| `muros/damero-spray.svg` | `510:1182` | P06 · Damero inclinado (spray) | Fondo opcional |
| `muros/chorreos.svg` | `510:1196` | P10 · Chorreos de pintura | Referencia visual del goteo |
| `muros/trazos-rodillo.svg` | `510:1200` | P12 · Trazos de rodillo | Fondo opcional |
| `muros/damero.svg` | `510:1162` | P01 · Damero | Fondo opcional |
| `stickers/spray.svg` | `510:1266` | FA09 · Spray (sticker) | Stencil/sticker y ícono de herramienta |
| `stickers/rodillo.svg` | `510:1278` | FA11 · Rodillo (sticker) | Sticker |
| `stickers/tarro-pintura.svg` | `510:1222` | Urbano · Tarro de pintura | Sticker |
| `stickers/senal-rodillo.svg` | `510:1228` | Urbano · Señal rodillo | Sticker |
| `stickers/plumon.svg` | `510:1234` | Urbano · Plumón | Sticker |
| `stickers/zapatilla.svg` | `510:1242` | Urbano · Zapatilla | Sticker |
| `stickers/cruce-peatonal.svg` | `510:1285` | Urbano · Cruce peatonal | Sticker |
| `stickers/personaje.svg` | `510:1273` | FA10 · Personaje | Sticker |
| `tag/tag-ejemplo.svg` | `712:2085` | Tipografía · Tag (handstyle con halo de spray y chorreos) | Referencia de tag / plantilla |
| `herramientas/cuentagotas.svg` | `317:82517` | Herramienta · Cuentagotas | Ícono del selector de color |

Cada nodo se exporta con `download_assets` (`defaultFormat: svg`). Los demás stickers de la hoja `510:1209` (Ajedrez, Ecualizador, Vinilo, Metro, marcas) están disponibles si se quieren más.

## Cómo completarlo
1. Permitir el host `www.figma.com` en *Network access* del entorno cloud (Allowed domains).
2. Pedirle a Claude Code: "completa los assets de Graffiti". Descarga los 15 nodos de arriba a `graffiti/public/figma/…` y actualiza esta tabla.
3. Hasta entonces, Antigravity solo debe usar los dos muros generados; las tareas que dependen de stickers (B15) quedan bloqueadas.
