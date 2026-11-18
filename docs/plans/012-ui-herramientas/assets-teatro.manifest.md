# Manifiesto de arte · Teatro de Papel, ronda 2 (A8)

Arte **generado** (`generado: true`) con `loops/scripts/generar-bocetos.py`, derivado de los bocetos del plan 004
([`teatro-bocetos.manifest.md`](../004-feedback-prototipos/teatro-bocetos.manifest.md)): mismas formas planas de la paleta
Línea azul, borde recortado a mano y el filtro de grano de los SVG Orgánica de Figma. Cada archivo mide 240 × 240.
Viven en `loops/public/figma/organica-bocetos/<pieza>/<capa>.svg`. Regenerar: `python3 loops/scripts/generar-bocetos.py`
(es determinista: las piezas que no cambiaron salen idénticas).

Feedback de Amaro (17 nov, plan 012 §4) que resuelve cada cambio entre paréntesis.

## Piezas nuevas o rehechas
| Pieza | Capas | Estados (animaciones) | Cambio | generado |
|---|---|---|---|---|
| `huemul` | `cola` `pata1–4` `cuerpo` `cabeza` | Camina · Pasta · Mira | Sin la raya en Y sobre el ojo (le hacía ceño): ojo redondo con brillo, hocico oscuro redondeado, orejas relajadas hacia atrás. Cuello y cabeza en una capa que gira en la base del cuello; la cola, aparte. («se ve enojado», «3 estados») | true |
| `guanaco` | `cola` `pata1–4` `cuerpo` `cabeza` | Camina · Trota · Mira | Pecho claro, sombra en el cuello, cara gris con ojo amable y labio partido, orejas con interior claro. Cuello y cabeza en una capa. («mejorarlo y darle sus 3 animaciones») | true |
| `ananuca` | `ananuca` | se mece | **Reemplaza a la Flor** en el Desierto: añañuca del desierto florido, tres flores en embudo rojo rosado con garganta amarilla sobre hojas angostas. («descartar la flor») | true |

## Cambios solo de movimiento (sin arte nuevo)
| Pieza | Estados | Cambio |
|---|---|---|
| `condor`, `gaviota`, `picaflor`, `carpintero` | Aletea/Zumba · Planea/Liba · Remonta/Revolotea/Dardo | Aletean con el movimiento de la paloma de Figma (M3): alas que casi no giran y se pliegan en el hombro (escala vertical 1 → 0,24), cuerpo que sube cuando el ala baja y se balancea apenas. El cóndor antes giraba las alas ±20° («recuperar el aleteo de la paloma»). |
| `chucao` | Salta · Canta · Mira | Dos estados nuevos con sus capas actuales. |
| `huemul` | — | Color elegible (Café, Morado, Rosa, Lapislázuli); parte en café porque el morado se perdía en los cerros de la Cordillera. |
| `pez` | — | Color elegible (ya estaba en el wip): Amarillo, Rosa, Verde, Hueso, Negro. |

## Retirado
| Archivo | Motivo |
|---|---|
| `loops/public/figma/organica/flor/flor-propia.svg` | La Flor se descarta (feedback de Amaro). Sale de la biblioteca y del `dist/`. |

## Pendiente para Figma
Siguen siendo bocetos: cuando el equipo dibuje las piezas finales, exportarlas con las **mismas capas** (`cola`, `pata1–4`,
`cuerpo`, `cabeza` en los cuadrúpedos; `ala-inferior`, `cuerpo`, `ala-superior` en las aves) y pivotes
(`loops/src/escenario/piezas.ts`: `HOMBROS`, `caderas`, `cuello`, `cola`), y cambiar `B('…')` por `A('…')`.
