# HUB · Estación Somos Diseño

Pantalla para la **pantalla flip** y los **Mac** del evento. Es el corte de una estación donde conviven los tres lenguajes:

| Nivel | Lenguaje | Qué hay |
|---|---|---|
| Plaza (arriba) | Orgánica | Cielo según la hora (10:00 → 20:00), araucarias y plantas de Teatro de Papel |
| Mezanina (medio) | Geométrica | Torniquetes, piso de damero, la **pantalla de la Estación Audioreactiva** y los **cuadros con las obras de la gente** |
| Andén (abajo) | Pixel | Letrero pixel y el Metro. Cada 3er tren pasa el **vagón pintado** (easter egg de la experiencia Vagón) |

**Cada persona con credencial es un personaje.** El cuerpo es del lenguaje de su marco y la cabeza es su foto o su personaje. Llega a la plaza y cada timbre lo baja un nivel por las escaleras mecánicas (plan 014 §0):
- 1 timbre: entra caminando a la plaza;
- 2 timbres: baja a la mezanina;
- 3 timbres: baja al andén;
- 4 timbres: lleva aureola y hay confeti.

Arriba se ven las cifras y el último aviso.

## Cuadros de la mezanina
Los cuadros del muro de la mezanina muestran las obras que llegan por `shared/datos.ts`: mosaico, grabado, graffiti,
Hora punta y Fotomatón (`src/estacion/vivo.ts` las carga una vez; `escena.ts` las dibuja con `drawImage` sobre un
paspartú, enteras y sin deformarse). La cartela dice la experiencia y «hecho por <nombre>» si la obra trae el código de
una credencial («Sin firma» si no).
- Caben hasta 6 cuadros en los tramos libres del muro (no tapan la boletería, la pantalla ni la escalera).
- Una obra nueva entra al tiro en el cuadro que lleva más tiempo; si hay más obras que cuadros, cada cuadro cambia
  cada ~8 s por la que hace más tiempo que no se ve.
- Sin obras: con `?prueba=0` (producción) los cuadros quedan vacíos con «Tu obra aquí»; con personas de prueba se
  completan con los ejemplos de `src/galeria/ejemplos.ts`.
- La pantalla «EN VIVO · ESTACIÓN AUDIOREACTIVA» sigue al centro (esa experiencia no publica imágenes). El mapa «RED»
  salió: su lugar es para obras y los letreros colgantes ya orientan.

**Estado:** demo con 40 personas de prueba y eventos simulados (`src/estacion/fuente.ts`). Las obras de los cuadros de la mezanina y los grabados de los banderines son reales (llegan por `shared/datos.ts`). Falta conectar la vista `galeria` de Supabase con tiempo real.

## Parámetros de prueba
- `?hora=19`: fija la hora del cielo.
- `?rapido=6`: acelera el reloj: trenes cada 7,5 s, vagón pintado y más eventos.
- `?prueba=0`: solo lo real (como en producción), sin personas ni obras de ejemplo.

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

## Modo galería (`?galeria` o `#/galeria`)
Respaldo liviano de la pantalla Flip (plan 014 §3, R3): pasa a pantalla completa las creaciones que llegan por
`shared/datos.ts` (mosaico, grabado, graffiti, Hora punta, Fotomatón) con el nombre de la persona si trae su código.
Lo nuevo pasa adelante; sin creaciones completa con ejemplos (`src/galeria/ejemplos.ts`). `?cada=<s>` cambia el ritmo
(9 s por omisión). Solo `<img>`, grid y opacidad: pensado para el navegador de la Flip 2 (Chromium ~69).

## Hoja de cuerpos (`?cuerpos`)
Propuesta de cuerpos para los personajes: 3 opciones por lenguaje, caminando, todas con la misma cabeza (la foto o el personaje de la credencial). Está en `src/estacion/cuerpos.ts` y `src/HojaCuerpos.tsx`. La escena sigue usando los cuerpos actuales hasta que el equipo elija.
