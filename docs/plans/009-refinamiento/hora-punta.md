# Hora punta · el juego Pixel

Estado: 3 niveles (cruce con latas, andén con piezas, pared con la mecánica de Puyo) y tu mural a la tarjeta, al QR y al
inventario. Plan `docs/plans/009-juego-pixel.md`.
Medido: sin scroll ni controles fuera en las 6 resoluciones, en los 3 niveles; 61 cuadros por segundo en el navegador de
prueba; 54 casos de motor y 3 pruebas de navegador en verde.

## Hallazgos
| # | Gravedad | Qué |
|---|---|---|
| H1 | Pendiente | Tablet real: rendimiento y mantener ◀ ▶ apretados en el andén |
| H2 | Media | Sin sonido: es lo que más le falta para sentirse juego |
| H3 | Baja | Una partida completa dura 3 a 4 minutos: en hora punta del evento puede ser largo para una mesa con fila |

## Propuestas
- P1 · **Sonido** corto y apagado por defecto (interruptor «Sonido»): paso, lata, golpe, bola, borrar grupo. Generado con
  Web Audio, sin archivos ni dependencias.
- P2 · **Modo fila** para el staff (`?rapido`): niveles más cortos (20 filas, 1 oleada, 60 s de pared) cuando hay fila.
- P3 · El mural de cada partida aparece en un panel MetroArte del HUB (ver hub-y-soporte.md).
