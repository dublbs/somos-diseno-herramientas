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

## Refinamiento (2026-10-29, ronda 4)
Redibujados con referencias, por pedido del equipo:
- **Aves:** las alas nacen del hombro, sobre la mitad delantera del lomo; antes nacían de la cadera. El ala lejana es un poco más chica. Pivotes en `HOMBROS` (script y `piezas.ts`).
- **Cóndor:** carúncula del macho, collar blanco, cuello desnudo, pico ganchudo, primarias como dedos y secundarias blancas.
- **Gaviota:** alas largas en punta con borde de fuga blanco.
- **Picaflor:** pico apenas curvo, vientre claro.
- **Carpintero:** cabeza roja con copete hacia atrás y pico gris.
- **Huemul:** dejó de parecer alce. Ahora es un ciervo robusto de patas cortas, con orejas largas de interior claro, la mancha en Y sobre el hocico, la garganta clara y astas que se bifurcan una vez.
- **Guanaco:** sigue narigón; tiene el cuello curvo, la cara gris, la cola que cae y pezuñas en vez de bolitas.
- **Concha de loco:** forma de oreja (abalón), con el ápice enrollado, costillas radiales, líneas de crecimiento y el labio claro.
- **Copihue:** campanas de 6 tépalos (se ven 3 puntas) con motas claras y cáliz verde, más las hojas coriáceas en punta en un tallo que se enrosca.
- **Alerce:** tronco columnar de corteza rojiza con vetas, sin ramas abajo y follaje en matas arriba.

Referencias:
- [Huemul (Ultimate Ungulate)](https://ultimateungulate.com/Artiodactyla/Hippocamelus_bisulcus.html) y [South Andean deer (Wikipedia)](https://en.wikipedia.org/wiki/South_Andean_deer).
- [Andean condor (Wikipedia)](https://en.wikipedia.org/wiki/Andean_condor).
- [Concholepas concholepas (Wikipedia)](https://en.wikipedia.org/wiki/Concholepas_concholepas).
- [Lapageria (Wikipedia)](https://en.wikipedia.org/wiki/Lapageria).
