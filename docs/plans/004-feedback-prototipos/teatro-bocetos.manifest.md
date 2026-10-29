# Manifiesto de bocetos · Teatro de Papel (elenco nuevo y Bosque)

Estado: **bocetos para revisión, no vienen de Figma.** Se **generaron** con `loops/scripts/generar-bocetos.py` (`generado: true`) para probar el elenco en los escenarios mientras el equipo dibuja las piezas finales. Viven en `loops/public/figma/organica-bocetos/<pieza>/<capa>.svg`, separados de `organica/` (arte de Figma).

Cómo están hechos: formas planas de la paleta Línea azul con borde de papel recortado a mano (contorno levemente irregular) y el mismo filtro de grano que los SVG Orgánica de Figma. Cada archivo mide 240 × 240, como las piezas de Figma. Para regenerarlos: `python3 loops/scripts/generar-bocetos.py`.

**Para reemplazar un boceto:** exportar la pieza de Figma con las mismas capas y medidas a `organica/<pieza>/` y cambiar `B('…')` por `A('…')` en `loops/src/escenario/piezas.ts` (ahí también están los pivotes de hombro y cadera).

## Animales (capas que se mueven)
| Pieza | Capas | Animación | Escenario |
|---|---|---|---|
| `condor` | `ala-inferior` `cuerpo` `ala-superior` | aletea en el hombro; variante «Planea» | Cordillera (cielo) |
| `gaviota` | ídem | aletea; variante «Planea» | Mar (cielo) |
| `picaflor` | ídem | aleteo rápido (400 ms) | Desierto (cielo) |
| `carpintero` | ídem | aletea | Bosque (cielo) |
| `chucao` | `cola` `cuerpo` | salta y levanta la cola | Bosque (suelo) |
| `huemul` | `pata1–4` `cuerpo` | camina (patas en la cadera) | Cordillera (suelo) |
| `guanaco` | `pata1–4` `cuerpo` | camina | Desierto (suelo) |

## Plantas, objetos y astros (una capa que se mece)
| Pieza | Escenario | Nota |
|---|---|---|
| `chagual` | Mar | para comparar con el cochayuyo |
| `cochayuyo` | Mar (agua) | para comparar con el chagual |
| `doca` | Mar | |
| `concha` | Mar | concha de loco |
| `chanar` | Desierto | |
| `alerce` | Bosque | |
| `copihue` | Bosque (cielo, colgando) | se mece desde su pivote |
| `maqui` | Bosque | |
| `telar` | Bosque | telar mapuche (witral) |
| `luna` | Bosque (cielo) | astro en vez del sol |
| `lluvia` (`gotas-a` `gotas-b` `nube`) | Bosque (cielo) | astro; las gotas caen y se alternan |

## Fondo Bosque (`bosque/`)
| Capa | Movimiento |
|---|---|
| `cielo` | quieto, cielo húmedo con nubes |
| `cerro-lejano` | se mece ±6 |
| `bosque-cercano` | se mece ±9 |
| `suelo` | quieto, musgo |

Pendiente del equipo: aprobar las formas o reemplazarlas por arte de Figma, y elegir chagual o cochayuyo, carpintero o chucao, luna o lluvia (por ahora están ambos para comparar). La Paloma salió del elenco, pero sigue en la biblioteca de piezas.
