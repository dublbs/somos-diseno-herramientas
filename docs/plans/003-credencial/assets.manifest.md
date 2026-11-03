# Assets de la credencial (Figma → `credencial/public/figma/`)

Archivo Figma `Yo9o3ZG2lyaEGcyxoxs89R`. Exportados como SVG con el MCP de Figma (`download_assets`) y limpiados con `npm --prefix credencial run limpiar:figma`, que quita el fondo del lienzo que traen los símbolos.

## Personajes (uno por lenguaje)
| Archivo | Nodo | Símbolo |
|---|---|---|
| `personaje-pixel.svg` | `509:1347` | Pixel / FA10 · Personaje / sticker |
| `personaje-geometrica.svg` | `647:113582` | Geométrica / FA10 · Glifo en espejo / sticker (provisorio: Geométrica no tiene personaje) |
| `personaje-organica.svg` | `660:3503` | Orgánica / FA01 · Pingüino de Humboldt / figura |

## Timbres (4 predeterminados por lenguaje; estaciones 1–4)
| Lenguaje | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Pixel | FA08 Metro (Línea 1) `509:1305` | FA07 Vinilo `509:1279` | FA09 Spray `509:1328` | FA02 Ecualizador `509:1167` |
| Geométrica | FA07 Polar `647:113573` | FA08 Túnel `647:113576` | FA01 Damero `647:113555` | FA12 Cruz escalonada `647:113588` |
| Orgánica | FA07 Sol `647:1388` | FA08 Pudú `647:1389` | FA05 Paloma `647:1391` | FA03 Helecho `647:1386` |

Archivos: `timbre-<pixel|geometrica|organica>-<1..4>.svg` (stickers con troquel).

## Patrones de fondo (uno por marco)
| Marco | Archivo | Nodo | Símbolo |
|---|---|---|---|
| PM02 Vinilo | `patron-pixel-surcos.svg` | `510:1186` | Pixel / P07 · Surcos de vinilo |
| PM05 Metro | `patron-pixel-lateral.svg` | `510:1191` | Pixel / P08 · Lateral Línea 1 |
| GM02 Estallido | `patron-geo-allqa.svg` | `647:113598` | Geométrica / P04 · Allqa cuatripartito |
| GM05 Túnel | `patron-geo-damero.svg` | `647:113596` | Geométrica / P01 · Damero |
| OM02 Estallido | `patron-org-mediosol.svg` | `647:1368` | Orgánica / P10 · Medio sol |
| OM05 Túnel | `patron-org-anillos.svg` | `647:1366` | Orgánica / P07 · Anillos |

Los marcos (M02 y M05 de cada lenguaje) ya estaban en `shared/marcos.ts`.
