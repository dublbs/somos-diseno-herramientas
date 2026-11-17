# Avance A2 · Audioreactiva táctil (se borra en el último commit)

## Hecho
- Rama desde `amaro/kit-v2`. Fuera el micrófono (`oido.ts` borrado).
- `src/audio/estilos.ts`: 5 estilos originales (Lo-Fi Hip Hop, Synthwave, Button Mash, It's Friday, Acoustic Ambient), 8 compases, 4 pistas.
- `src/audio/motor.ts`: secuenciador con lookahead, síntesis, eco, sala, filtro del dedo, compresor y limitador, analizador + eventos exactos.
- `src/escenas/escenas.ts`: Túnel nuevo, Escalera nueva, Acordeón/Caleidoscopio/Tejido con eventos; compositor (giro, zoom, eco visual, color, estallidos).
- `src/App.tsx`: marco v2, panel (música, pistas, tempo, escena), barra flotante de escenas, pads Bum/Chas, arrastre multitáctil, foto y loop con audio.

## Falta
- Medir con Playwright (niveles por estilo, movimiento por escena × estilo) y ajustar.
- Pantalla en 6 resoluciones, capturas, tabla en docs/plans/009-refinamiento/audioreactiva.md.
- dist de producción.
