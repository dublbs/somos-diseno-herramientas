# Estación Audioreactiva · consola de VJ (TouchDesigner / Resolume)

Estado: 5 escenas (Túnel, Acordeón, Caleidoscopio, Tejido, Escalera), consola con 6 canales (Volumen, Graves, Medios,
Agudos, Tono, Golpe) que se silencian, medidores, sensibilidad, micrófono o música de demo, foto y loop de 6 s con
«Llévatela» (video por QR).
Medido: sin scroll ni controles fuera en las 6 resoluciones. La UI ya parece una consola de VJ: es la mejor lograda en
el símil.

## Hallazgos
| # | Gravedad | Qué | Dónde |
|---|---|---|---|
| A1 | Media | «CALEIDOSCOPIO» se sale de su tarjeta en 1180 × 820 | Panel «Escena» |
| A2 | Media | Los códigos de las escenas («C3 · M3», «C10 · C8 · C6») no le dicen nada a la persona | Panel «Escena» y barra superior |
| A3 | Media | Los canales que una escena no usa muestran «—» y se ven apagados: parece que no funcionan | Consola |
| A4 | Pendiente | El feedback dice que algunas escenas casi no reaccionan. No se puede medir con micrófono falso (tarea T4) | Todas las escenas |

## Propuestas
**Funcionalidad (T4)**
- P1 · Medir cada escena con voz, aplausos y música a 1 m de la tablet; ajustar sensibilidad, suavizado y qué banda
  mueve qué. Una escena que con música ambiente no se mueve, se corrige o sale.
- P2 · **Umbral visible** en cada medidor (una marca): cuando la barra la pasa, el canal «dispara». Es lo que hacen las
  consolas de VJ y explica por qué a veces no pasa nada.

**Experiencia**
- P3 · En vez de códigos, una línea por escena con lo que hace: «Túnel: los graves laten, el volumen acelera» (A2).
- P4 · Canales sin uso en la escena, ocultos o con «no se usa en esta escena» (A3).

**UI**
- P5 · Nombres de escena que quepan (A1): letra más chica o la tarjeta en 2 líneas.
