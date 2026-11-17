# Manifiesto de assets · Taller de Grabado (plan 012, tarea A1)

Los tacos del afiche por capas. **No hay arte nuevo**: son copias exactas de las piezas Orgánica que ya usa Teatro de
Papel (`loops/public/figma/`), con las mismas capas y posiciones (`loops/src/escenario/piezas.ts`). Viven en
`grabado/public/figma/organica/` (arte de Figma) y `grabado/public/figma/organica-bocetos/` (bocetos generados con
`loops/scripts/generar-bocetos.py`, manifiesto `docs/plans/004-feedback-prototipos/teatro-bocetos.manifest.md`).
Salieron los SVG planos que tenía Grabado (`grabado/public/figma/organica/*.svg`): eran las mismas 8 figuras.

Cómo se vuelven taco (en código, `grabado/src/lib/tacos.ts`, `generado: true` solo para el «mapa de tinta»): las capas
se componen en el marco de 240, se recorta lo visible y lo oscuro o de color recibe tinta mientras lo claro (hueso,
blanco) queda tallado, como en un taco de linóleo. El Pez talla también su celeste (`corte: 0.62`) para que se vean
las escamas.

| Taco | Origen | Archivos (`grabado/public/figma/…`) | Figma |
|---|---|---|---|
| Helecho | Figma | `organica/helecho/helecho.svg` | 660:4006 |
| Araucaria | Figma | `organica/araucaria/araucaria.svg` | 620:932 |
| Quisco | Figma | `organica/quisco/quisco.svg` | 660:13012 |
| Copihue | boceto | `organica-bocetos/copihue/copihue.svg` | — (`generado: true`) |
| Chañar | boceto | `organica-bocetos/chanar/chanar.svg` | — (`generado: true`) |
| Flor | Figma | `organica/flor/flor-propia.svg` | 660:14079 |
| Pingüino | Figma | `organica/pinguino/pinguino.svg` | 660:3503 |
| Pez | Figma (8 capas) | `organica/pez/{cola,aleta-dorsal,aleta-ventral,cuerpo,escamas1,escamas2,ojo,pupila}.svg` | 613:4419 |
| Pudú | Figma (7 capas) | `organica/pudu/{cola,pata1–4,cuerpo,cabeza}.svg` | 613:3802 |
| Huemul | boceto (5 capas) | `organica-bocetos/huemul/{pata1–4,cuerpo}.svg` | — (`generado: true`) |
| Cóndor | boceto (3 capas) | `organica-bocetos/condor/{ala-inferior,cuerpo,ala-superior}.svg` | — (`generado: true`) |
| Picaflor | boceto (3 capas) | `organica-bocetos/picaflor/{ala-inferior,cuerpo,ala-superior}.svg` | — (`generado: true`) |
| Sol | Figma | `organica/sol/sol.svg` | 620:864 |
| Luna | boceto | `organica-bocetos/luna/luna.svg` | — (`generado: true`) |
| Cántaro | Figma | `organica/cantaro/cantaro.svg` | 660:12182 |
| Canasto | Figma | `organica/canasto/canasto.svg` | 660:11130 |

Quedaron fuera (se revisaron en una hoja de contacto): Paloma, Gaviota y Lluvia (casi todo blanco o celeste: el taco
saldría vacío), Piña (sin las escamas es una mancha negra), K'isa (sus franjas aparecen animadas), Chucao, Guanaco,
Carpintero, Chagual, Cochayuyo, Doca, Concha, Alerce, Maqui y Telar (se repiten con los elegidos o se leen poco como
silueta). Si el equipo reemplaza un boceto por arte de Figma en Teatro, se copia el mismo archivo aquí.

**Marcos:** los 15 marcos de la campaña salen de `shared/marcos.ts` (solo lectura; Orgánica primero). Lo blanco o
hueso del marco toma el color del papel. No se copiaron archivos.
