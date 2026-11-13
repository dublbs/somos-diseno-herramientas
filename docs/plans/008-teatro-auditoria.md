# 008 · Teatro de Papel: auditoría y plan de arreglos

Fecha: 12 nov 2026 · Estado: **plan** (tareas en [`docs/tasks/008-teatro.md`](../tasks/008-teatro.md)).

Auditoría completa de `loops/`: lectura de todo el código, prueba en las 6 resoluciones de tablet con escena vacía y llena, en los 4 escenarios, exportando la tarjeta PNG y grabando el video. Pipe lo probó en paralelo en un iPad real (12 nov) y anda bien en lo general. Varios hallazgos dependen del equipo, así que la primera tarea es **medir en el iPad** antes de cambiar el motor de grabación.

**No cambia:** el concepto (escena de papel recortado con loop y trayecto A → B), el elenco estandarizado del plan 004, el kit de barras fijas (plan 005) ni la regla de pantalla sin scroll.

## 1. Hallazgos

| # | Hallazgo | Gravedad | Dónde | Tarea |
|---|---|---|---|---|
| H1 | La grabación depende del tiempo real: si un cuadro tarda más que 1/fps, el video queda lento y entrecortado, pero el botón dice «8 s». Sin GPU, un video «de 8 s» duró 103 s. En el iPad hay que medirlo. | Crítica | `lib/grabarLoop.ts` | T-001, T-003 |
| H2 | Si el mínimo común múltiplo de las duraciones pasa de 12 s, el loop se corta en 8 s y las piezas de 3 s, 1,2 s o 1,8 s saltan al reiniciar (ej. Cordillera con Sol + K'isa). | Crítica | `duracionLoop()` | T-002 |
| H3 | El resultado se descarga en la tablet del stand: la persona no se lo lleva. | Crítica | `ModalExportar.tsx` | T-006 |
| H4 | La tarjeta rompe la dirección: texto en Lapislázuli y gris, «INACAP» escrito en rojo, distinta a la tarjeta común; «INACAP» y «SEDE…» desalineados, franja amarilla que sobresale y título repetido. | Alta | `lib/exportarTarjeta.ts` | T-004 |
| H5 | Con 8–10 piezas cada fila de la línea de tiempo mide 7–9 px: nombres encimados, rombos A/B desbordados. Pasa en las 6 resoluciones. | Alta | `styles.css` (`.lt-pistas`) | T-007, T-008 |
| H6 | El tirador de tamaño queda fuera del lienzo cuando la pieza está abajo. | Alta | `dibujarSeleccion`, `alBajar` | T-009 |
| H7 | Tocar una pieza la apila en el centro, sobre las anteriores. | Alta | `agregar()` | T-010 |
| H8 | Proporciones poco creíbles: la Piña sale más grande que la Araucaria; el Sol más grande que los cerros. | Alta | `ESCALA_INICIAL`, `LIMITES_ESCALA` | T-017, T-012 |
| H9 | El lienzo se redibuja a 1080 px ~60 veces por segundo aunque esté en pausa; el borde de papel suma 18 dibujados por pieza y cuadro. Con el borde apagado rinde ~60 % más. | Alta | `tick`, `dibujarItem` | T-013, T-014 |
| H10 | Botones solo con íconos (8 en Propiedades; en vertical también Sorpréndeme y Tarjeta). | Alta | `EscenarioOrganico.tsx` | T-011 |
| H11 | Sorpréndeme en Bosque puede poner Luna y Lluvia a la vez (~1 de cada 3). | Media | `sorprendeme.ts` | T-015 |
| H12 | Sorpréndeme deja piezas cortadas en el borde. | Media | `sorprendeme.ts` | T-015 |
| H13 | El modo quiosco no se detiene mientras graba: si grabar tarda más de 90 s, recarga y se pierde todo. | Media | `App.tsx` | T-003 |
| H14 | Modal: dice «tarjeta» aunque sea video, jerga («Formato oficial 1080 × 1350 px»), emojis, mayúsculas inglesas; se cierra al tocar afuera y se pierde el resultado. | Media | `ModalExportar.tsx` | T-005 |
| H15 | En play, escalar o mover una pieza que camina hace saltar su punto A. | Media | `alBajar`, `alMover` | T-016 |
| H16 | Escala, límites, escala de Sorpréndeme y «es móvil» repetidos en 4 tablas fuera de `piezas.ts`: una pieza nueva se olvida fácil. | Media | 3 archivos | T-017 |
| H17 | El README describe una interfaz antigua. | Baja | `loops/README.md` | T-018 |
| H18 | Decisiones del elenco pendientes desde el 29 oct (Chagual/Cochayuyo, Carpintero/Chucao, Luna/Lluvia); las piezas nuevas siguen siendo bocetos. | — | plan 004 | Decisión D5 |

No hay errores en consola ni scroll de página en ninguna de las 6 resoluciones.

## 2. Decisiones del equipo (antes de las tareas que dependen)

| # | Pregunta | Recomendación | Bloquea |
|---|---|---|---|
| D1 | ¿La tarjeta del Teatro usa la tarjeta común (franja negra, como el Fotomatón) o mantiene su diseño propio corregido? | **Común**: es la convención de `AGENTS.md` y une las experiencias. | T-004 |
| D2 | ¿Cómo se lleva la persona el resultado? | **QR como el Fotomatón**, pero generalizado para todas las mesas: un bucket y una tabla `resultados` con borrado a las 24 h. | T-006 |
| D3 | Si T-001 confirma que el iPad no alcanza: ¿se aprueba una dependencia nueva (muxer MP4, ~20 kB) para grabar cuadro a cuadro con WebCodecs, sin depender del tiempo real? | Primero los arreglos sin dependencias (T-003, T-013, T-014). Solo si el iPad sigue fallando, aprobar la dependencia. | T-019 (condicional) |
| D4 | ¿Tope de piezas por escena? | **8**. Mantiene legible la línea de tiempo (sin scroll de panel) y acota el costo de dibujo. | T-008 |
| D5 | Elenco: Chagual o Cochayuyo, Carpintero o Chucao, Luna o Lluvia. ¿Pasan las piezas de boceto a arte de Figma? | La decide el equipo con los bocetos. | Biblioteca |

## 3. Fases y orden

```
Fase 0 · Medir        T-001 ─┐
Fase 1 · Resultado    T-002 · T-003 · T-005 · T-004 (D1) · T-006 (D2)
Fase 2 · Interfaz     T-017 → T-012 · T-007 + T-008 (D4) · T-009 · T-010 · T-011
Fase 3 · Rendimiento  T-013 → T-014 → (T-019 si D3)
Fase 4 · Pulido       T-015 · T-016 · T-018
```

- **T-001 va primero**: dice si H1 pasa en el iPad y con cuántas piezas.
- **T-017 antes de T-012**: primero una sola tabla por pieza, después se ajustan las proporciones en un solo lugar.
- **Archivo caliente:** `loops/src/components/EscenarioOrganico.tsx` lo tocan 9 tareas. Que cada PR sea chico y se mergee rápido; si dos personas lo tocan a la vez, que una espere el merge de la otra (regla 3 de «Trabajo en paralelo»).
- **Reparto sugerido**:
  - Pipe, que está con el iPad y lo visual: T-001, Fase 2 y T-004.
  - El otro agente: Fase 1 técnica (T-002, T-003, T-006) y Fase 3.
  - Cada tarea se toma abriendo un PR borrador.

## 4. Verificación final del plan
- [ ] En el iPad, un video con 8 piezas a 24 fps dura lo que dice el botón (±5 %) y su primer y último cuadro son iguales.
- [ ] La persona escanea un QR y descarga el video y la tarjeta en su celular.
- [ ] La tarjeta pasa las reglas de color de la dirección (texto negro, hueso o blanco; rojo solo en el isotipo).
- [ ] Con 8 piezas, la línea de tiempo se lee en las 6 resoluciones de tablet, sin scroll de página ni de panel.
- [ ] Las 6 resoluciones pasan la verificación de pantalla de `AGENTS.md` con cada herramienta activa.
- [ ] `npm --prefix loops run build` en verde.
