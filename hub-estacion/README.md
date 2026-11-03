# HUB · Estación Somos Diseño

Pantalla para la **pantalla flip** y los **Mac** del evento. Es el corte de una estación donde conviven los tres lenguajes:

| Nivel | Lenguaje | Qué hay |
|---|---|---|
| Plaza (arriba) | Orgánica | Cielo según la hora (10:00 → 20:00), araucarias y plantas de Teatro de Papel, **fajas del Telar** colgadas |
| Mezanine (medio) | Geométrica | Torniquetes, piso de damero y la **pantalla de la Estación Audioreactiva** |
| Andén (abajo) | Pixel | Letrero pixel y el Metro. Cada 3er tren pasa el **vagón pintado** (easter egg de la experiencia Vagón) |

**Cada persona con credencial es un personaje.** El cuerpo es del lenguaje de su marco y la cabeza es su foto o su personaje. Cada timbre lo sube un nivel:
- 1 timbre: llega en tren al andén;
- 2 timbres: sube al mezanine;
- 3 timbres: sale a la plaza;
- 4 timbres: lleva aureola y hay confeti.

Arriba se ven las cifras y el último aviso.

**Estado:** demo con 40 personas de prueba y eventos simulados (`src/estacion/fuente.ts`). Lo que la gente crea (vagón, fajas, pantalla audioreactiva) también es de prueba hasta que existan esas experiencias. Falta conectar la vista `galeria` de Supabase con tiempo real.

## Parámetros de prueba
- `?hora=19`: fija la hora del cielo.
- `?rapido=6`: acelera el reloj: trenes cada 7,5 s, vagón pintado y más eventos.

## Correr
```bash
npm --prefix hub-estacion install
npm --prefix hub-estacion run dev
npm --prefix hub-estacion run build   # → hub-estacion/dist (enlazado desde el pie del hub)
```

Assets reutilizados (copiados a `public/figma/`):
- los personajes de la credencial;
- araucaria, sol, helecho, flor y quisco de Teatro de Papel;
- stickers y tag de Graffiti.

## Hoja de cuerpos (`?cuerpos`)
Propuesta de cuerpos para los personajes: 3 opciones por lenguaje, caminando, todas con la misma cabeza (la foto o el personaje de la credencial). Está en `src/estacion/cuerpos.ts` y `src/HojaCuerpos.tsx`. La escena sigue usando los cuerpos actuales hasta que el equipo elija.
