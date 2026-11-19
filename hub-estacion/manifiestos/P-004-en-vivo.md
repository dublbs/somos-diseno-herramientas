# Manifiesto de arte · P-004 («En vivo»: loops del Teatro y de la Audioreactiva)

Arte nuevo del HUB autorizado por D-002 (`docs/equipo/bitacora.md`). No hay videos ni imágenes nuevas: los loops se
dibujan por código en `hub-estacion/src/estacion/envivo.ts`, con un pulso simulado a 120 bpm (sin micrófono ni red).

| Loop | Lenguaje | Cómo |
|---|---|---|
| Túnel C3 | Audioreactiva | El mismo `shared/c3-tunel.js` que usan la Audioreactiva y el inicio |
| Red de celdas que late | Audioreactiva | Celdas que se inflan con el bombo; el hi-hat las enciende y la melodía pone el color |
| Caleidoscopio | Audioreactiva | Triángulos reflejados que giran y cambian de color con la melodía |
| Bosque | Teatro de Papel | Telones, bambalina, cerros de papel en parallax, araucarias y helecho que se mecen, sol y un pájaro de papel |
| Desierto de noche | Teatro de Papel | Luna, estrellas, dunas, quiscos y la flor que se abre, y una estrella fugaz |

Las piezas del Teatro reusan los SVG de `public/figma/plaza/` (araucaria, helecho, quisco, flor y sol), con el borde de
papel recortado hecho por código. Cada loop dura 12 s y entra con un barrido. La rotación no se detiene nunca.
