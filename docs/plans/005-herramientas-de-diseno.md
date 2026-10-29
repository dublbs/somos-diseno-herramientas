# 005 · Las experiencias como herramientas de diseño

Estado: **propuesta para revisar** (2026-10-29). Base para el diseño de la UI general.
Versión visual con esquemas: https://claude.ai/artifact/RGYu7i5M8Eg5YD4W8CgYhQ (privada; se comparte desde su menú).

## Idea
Cada experiencia es una **herramienta de diseño simplificada**:
- se parece a una herramienta profesional (Illustrator, After Effects, Aseprite…);
- enseña un concepto real de un área del diseño.

La interfaz se acerca a la de esas herramientas, y eso la hace más fácil de usar:
- lienzo grande;
- **barras fijas**, siempre visibles y nunca colapsables;
- cada herramienta con su ícono y su nombre.

## Reglas comunes
1. **Barras fijas** por experiencia: inferior (herramientas), lateral derecha (biblioteca o propiedades), línea de tiempo (cuando hay tiempo). Nada se colapsa ni se esconde detrás de pestañas.
2. **Una herramienta activa a la vez**, resaltada. Lo que depende de ella aparece en un lugar fijo de la barra de propiedades (no en ventanas emergentes).
3. Herramientas con **ícono + nombre**, de al menos 48 px.
4. Barra superior delgada con: volver, nombre de la experiencia, deshacer / rehacer y la acción final (Descargar / Llevártelo).
5. Sin scroll en las resoluciones de tablet. En vertical, la barra derecha pasa a ir sobre la inferior.
6. La primera vez, una guía de 3 pasos señala las barras (se puede saltar).
7. Cada experiencia deja algo que **alimenta el HUB**.

## Experiencia por experiencia

| Experiencia | Área del diseño · referencia | Concepto que se lleva | Barras |
|---|---|---|---|
| Graffiti y Tags | Ilustración y lettering · pinceles de Illustrator, Photoshop, Procreate | pincel, máscara (stencil), opacidad, goteo | **Inferior**: Spray, Rodillo, Plumón (tag), Stencil, Borrador + paleta fija. **Derecha (delgada)**: grosor, goteo, stencil o sticker elegido, muro |
| Teatro de Papel | Animación · After Effects | capas, keyframes A→B, línea de tiempo, loop | **Derecha**: biblioteca de piezas (arriba) y propiedades de la seleccionada (abajo). **Inferior**: línea de tiempo con una fila por pieza, sus keyframes, play y FPS |
| Taller de Mosaicos | Sistemas y patrones · «Pattern» de Illustrator, componentes de Figma | módulo → repetición → simetría | **Inferior**: Poner, Girar, Reflejar, Borrar, Multiplicar. **Derecha**: biblioteca de módulos, paleta, formato |
| Grabado | Grabado y risografía · modos de fusión | color sustractivo, sobreimpresión, registro | **Inferior**: los tacos como «pinceles», tamaño y giro. **Derecha**: tarros de tinta, papel y la muestra de **mezclas** (qué color sale al cruzar dos tintas) |
| Fotomatón | Fotografía y preprensa · Photoshop, separación CMYK | trama halftone, separación de color, marco | **Inferior**: carrete de marcos (como una cámara) y disparar. **Derecha**: trama (tamaño) y paleta con las **4 placas C, M, Y, K** a la vista |
| Audioreactiva | Motion graphics y VJ · TouchDesigner, Resolume | parámetro ↔ señal | **Derecha**: consola de escenas (como clips) y mapeo (volumen → …, graves → …). **Inferior**: medidores en vivo (12 bandas) y Grabar |
| Vagón (nueva) | Pixel art e identidad del transporte · Aseprite | grilla, módulo, librea | **Derecha**: biblioteca (modelos, frentes, carros, stickers). **Inferior**: Armar, Lápiz, Balde, Sticker, Tag, Borrar + paleta |
| Credencial (celular) | Identidad y sistema · plantillas | plantilla, marco, sistema | **Inferior fija**: pasos Marco · Foto · Nombre · Crear |
| Telar | Textil (en proceso) | trama, motivo a dos tonos | queda en pausa: hoy se confunde con Pixel |

## Cómo alimenta cada lenguaje al HUB «Estación»
- **Pixel → andén:** los vagones que diseña la gente pasan por la vía (easter egg).
- **Geométrica → mezanine:** paneles al estilo MetroArte muestran los **mosaicos** de la gente (o cuadros de la Audioreactiva). Cambian como los avisos del metro, con un barrido de arriba hacia abajo dentro del marco, y llevan un tag pequeño con quién lo hizo.
- **Orgánica → plaza:** **banderines** hechos con los grabados, colgados de un cordel. Son pocos, porque la plaza reúne también a las personas de todos los niveles.

## Vagón: tres conceptos de metro
- **A · Diseña tu vagón** (se construye ahora)
  - Eliges el modelo (L1, L4, NS‑74, AS‑2014, AS‑22: frentes y laterales de Figma), armas de 1 a 3 carros y eliges la librea.
  - Pintas en la grilla pixel, pones stickers y tu tag.
  - Sale por la vía y pasa por el HUB.
- **B · Señalética de tu estación**
  - Nombras tu estación con la tipografía pixel y diseñas su **pictograma** en una grilla de 16 × 16 (las estaciones del metro de Santiago tenían pictogramas).
  - Área: diseño de información y señalética.
  - En el HUB, aparece en el letrero del andén.
- **C · Traza tu línea**
  - Dibujas una línea en una grilla, solo con ángulos de 90° y 45°, y ubicas tus estaciones, como en los mapas de transporte.
  - Área: infografía y diagramación.
  - En el HUB, se suma al mapa de la red del mezanine.

## Estado (ronda 5)
Kit de interfaz por lenguaje en `shared/ui/` (muestra: `docs/kit/muestra.html`). Todas las herramientas pasaron a barras fijas:

| Experiencia | Barras | Funciones nuevas |
|---|---|---|
| Vagón | inferior: herramientas y paleta · derecha: modelo, carros, opciones | (piloto) |
| Graffiti y Tags | inferior: Spray, Rodillo, Plumón, Stencil, Sticker, Borrar y paleta · derecha: muro y opciones | stencil de 2 capas (Alien, «Diseño», Lata, Metro), rodillo con vetas P12, plumón, goteo tras 1,2 s quieto, rehacer |
| Taller de Mosaicos | inferior: Poner, Girar, Reflejar, Borrar, Multiplicar y el pincel · derecha: módulos, paleta, formato | deshacer y rehacer (un trazo = un paso) |
| Teatro de Papel | derecha: escenario, biblioteca, propiedades · inferior: línea de tiempo | keyframe B arrastrable por pieza, piezas que se arrastran al escenario, rehacer |
| Grabado | inferior: tacos, tamaño, giro · derecha: tinta, papel, mezclas | muestra de mezclas, registro corrido (riso), rehacer |
| Fotomatón | inferior: lenguaje, carrete de marcos, disparo · derecha: efecto, paleta, placas | placas de impresión C, M, Y, K |
| Audioreactiva | derecha: escenas y consola · inferior: espectro, medidores, fuente, sensibilidad | canales que se silencian, escena Escalera (C7) |

**Pendiente con bloqueo:** la calibración de la regla de «los ojos» del Fotomatón (plan 004) necesita los 6 retratos de prueba (tono de piel, luz, lentes) con permiso de las personas. No se pueden inventar: cuando el equipo los suba a una carpeta local (no al repo), se mide con face-api y se ajustan los valores por defecto de cada efecto.
