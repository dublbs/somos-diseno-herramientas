# Sincronización Figma ↔ Somos Diseño

## Archivo maestro
- **Archivo:** [SomosDiseño](https://www.figma.com/design/Yo9o3ZG2lyaEGcyxoxs89R/SomosDise%C3%B1o) · file key `Yo9o3ZG2lyaEGcyxoxs89R`
- **Páginas útiles:**
  - `Visual · Pixel` (`294:54606`): sección `Pixel · Sistema` (`664:273890`) con stickers, patrones, herramientas y la tipografía Tag (Graffiti).
  - `Visual · Orgánica` (`318:54606`): piezas y movimientos de Teatro de Papel.
  - `Visual · Geométrica (pauta)` (`324:54606`): formas y pauta del Taller de Mosaicos.
  - `Evento · Posts y piezas` (`0:1`) y nodo `449:85171` (Geométrica / C2 · Damero → zigzag → acordeón).

## Quién usa Figma
**Claude Code** tiene el MCP de Figma (`get_metadata`, `get_design_context`, `download_assets`, `get_variable_defs`, `get_screenshot`). Trae o genera los assets y los deja en el repo; Antigravity (u otro agente sin Figma) trabaja con los archivos ya descargados y nunca inventa arte. En el entorno cloud de Claude, `www.figma.com` debe estar en *Allowed domains* para poder descargar los SVG.

## Dónde quedan los assets
Cada experiencia guarda los suyos en `<app>/public/figma/<grupo>/` (Vite los copia a `<app>/dist/figma/`):

| App | Carpeta | Contenido |
|---|---|---|
| Fotomatón | `fotomaton/public/figma/persona/` | Siluetas demo por lenguaje (los marcos están en `src/data/marcos.ts`) |
| Teatro de Papel | `loops/public/figma/organica/` | ~94 SVG: fondos (cordillera, mar, desierto) y piezas por capas |
| Graffiti | `graffiti/public/figma/{muros,stickers,tag,herramientas}/` | Ver [`docs/plans/002-graffiti/assets.manifest.md`](docs/plans/002-graffiti/assets.manifest.md) |

Los SVG exportados de un nodo dentro de una sección traen los fondos de los marcos padres; `graffiti/scripts/limpiar-fondos.py` muestra cómo quitarlos.

## Paleta oficial (Línea azul)
Hueso `#F4EEE3` · Blanco `#FFFFFF` · Negro `#000000` · Azul `#0062B8` · Lapislázuli `#2B4BD8` · Celeste `#7FC8F8` · Amarillo `#FFC20E` · Verde `#00A651` · Rosa `#FF8FB1` · Morado `#7A2E8E`.

Tipografías: Bricolage Grotesque (títulos), DM Sans (texto), Silkscreen (Pixel), IBM Plex Mono (tarjeta de Teatro de Papel). Todas autoalojadas en `shared/fonts/`.
