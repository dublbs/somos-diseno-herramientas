# Avance A2 · Audioreactiva táctil (se borra en el último commit)

## Hecho
- Rama desde `amaro/kit-v2`. Fuera el micrófono (`oido.ts` borrado).
- `src/audio/estilos.ts`: 5 estilos originales (Lo-Fi Hip Hop, Synthwave, Button Mash, It's Friday, Acoustic Ambient), 8 compases, 4 pistas.
- `src/audio/motor.ts`: secuenciador con lookahead, síntesis, eco, sala, filtro del dedo, compresor y limitador, analizador + eventos exactos.
- `src/escenas/escenas.ts`: Túnel nuevo, Escalera nueva, Acordeón/Caleidoscopio/Tejido con eventos; compositor (giro, zoom, eco visual, color, estallidos).
- `src/App.tsx`: marco v2, panel (música, pistas, tempo, escena), barra flotante de escenas, pads Bum/Chas, arrastre multitáctil, foto y loop con audio.

- Medido con Playwright (relevo 2): niveles por estilo (−16,5 a −18,6 dBFS RMS, picos ≤ −3,4 dBFS, 0 muestras
  saturadas) y movimiento escena × estilo. Tejido era la más quieta: se agrandó y respira (commit 857c6d7).
- Pantalla en las 6 tablets con cada escena, antes y después de sonar: sin scroll de página, nada fuera, toques ≥ 48 px.
  «Llévatela» (foto) cabe en las 6; el loop sale en webm VP9 + Opus (con audio).

## Falta
- Aporte de cada pista por escena × estilo (corriendo) y la tabla en docs/plans/009-refinamiento/audioreactiva.md.
- dist de producción (sin .env.local en este entorno: sale en modo demo).
