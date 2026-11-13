# 009 · Juego Pixel «Hora punta» (reemplaza al Vagón)

Fecha: 13 nov 2026 · Estado: **en construcción · niveles decididos el 13 nov (falta el nivel 3)** (rama `amaro/juego-pixel`, tarea T1 de `docs/tasks/009-pendientes.md`).
Nombre de trabajo: «Hora punta» (se cambia en un solo lugar: `juego-pixel/src/App.tsx`).

## Idea
Un juego **original** en lenguaje Pixel para la tablet, **por niveles** (Amaro, 13 nov). Cada nivel toma la **mecánica**
de un juego conocido y nada más: personajes, nombres, escenarios y arte son propios.

**La historia en una línea:** los **Grises** le borraron el color a la ciudad en plena hora punta. Juntas color en la
calle, con ese color limpias el andén de Grises y con lo que rescatas armas **tu mural**: eso es lo que te llevas.

| Nivel | Mecánica | Qué juntas | Para qué te sirve |
|---|---|---|---|
| 1 · El cruce | Cruzar carriles (Crossy Road) | **Latas de pintura** de colores | Son tu munición del nivel 2: cada lata son 5 tiros de su color |
| 2 · El andén | Atrapar y empujar (Snow Bros) | **Piezas** que suelta cada Gris | Cada pieza es un trozo de tu mural, del color con que lo atrapaste |
| 3 · (por decidir) | Otro juego (§ Nivel 3) | — | — |
| Al final | — | **Tu mural** | Va a la tarjeta y al **inventario de tu credencial** |

## Nivel 1 · El cruce (Crossy Road)
- Tablero de 13 columnas que avanza hacia arriba, con un **final**: la entrada del metro a las 30 filas.
- Filas: **vereda** y **plaza** (seguras, con bancas y árboles que tapan el paso), **calle** (autos y micros de lado a
  lado) y **vías del metro** (una luz avisa y pasa el tren).
- **Latas de pintura** en el camino (Rosa, Amarillo, Celeste, Verde, Morado). Algunas quedan en medio de la calle: más
  riesgo, más pintura. Se juntan pasando encima (+1).
- Pierdes si te atropellan, si te alcanza el tren o si pasan 9 s sin avanzar (avisa a los 6 s). Lo que juntaste igual
  queda en tu mural.
- Sin Grises: el nivel 1 es solo cruzar y juntar.

## Nivel 2 · El andén (Snow Bros)
- Una sola pantalla vista **de lado**: el andén y tres pisos de vigas y escaleras. Los Grises caminan, se dan vuelta en
  los bordes, saltan y bajan por los huecos.
- Tú: caminar (◀ ▶), saltar (▲, atraviesas las vigas desde abajo), bajar de una viga (▼) y **lanzar pintura**.
- **La pintura sale de tus latas** (el color de la lata que toca). Con color, **3 golpes** encierran al Gris en una bola;
  si se te acaban las latas tiras **pintura hueso**, que necesita **5 golpes**. Juntar latas en el nivel 1 te hace más fuerte.
- Si caminas contra la bola, **rueda**: rebota en las paredes, cae por los huecos y se lleva a los Grises que encuentra
  (combo). La bola se rompe después de dos rebotes. Si no la empujas, a los 6 s el Gris se escapa.
- Cada Gris que cae suelta una **pieza** del color con que lo atrapaste. Hay que **ir a buscarla** antes de 5 s.
- Dos oleadas (3 y 4 Grises). **3 vidas**: si un Gris te toca pierdes una y vuelves al centro del andén (2 s intocable).
  Una capa de pintura se seca a los 2,5 s sin otro golpe. Después de 60 s los Grises se apuran.
- Para probarlo o mostrarlo sin cruzar primero: `?nivel=2` (parte en el andén con 3 latas).

## Nivel 3 (por decidir)
Propuesta: **La pared** (mecánica de piezas que caen y encajan): las piezas que juntaste en el andén caen sobre la pared
de la estación y las ubicas para completar filas del mural; cada fila completa suma. Así el mural deja de armarse solo y
lo compones tú. **Hasta que se decida**, el mural se arma solo con las piezas en el orden en que las juntaste.

## Puntaje
- Nivel 1: +1 por fila nueva, +1 por lata.
- Nivel 2: +2 por bola, +5 por Gris arrastrado (×2, ×3… si la bola se lleva varios), +3 por pieza.
- Una partida dura de 1,5 a 3 minutos.

## Lo que te llevas
- **Tu mural:** una pared color hueso de 4 × 3 casillas con tus piezas (formas pixel: corazón, estrella, rayo y gota),
  cada una del color con que atrapaste a su Gris. Sin piezas, el mural muestra tus latas.
- **Tarjeta** 1080 × 1350 con la franja común: el mural, el personaje y el puntaje.
- **Inventario de la credencial:** con una persona jugando y al menos 5 puntos, la partida cuenta como una de las 4
  experiencias del timbre Creación (`otorgarCreacion('juego')`) y la miniatura del mural llega a su inventario (evento
  `juego`, migración `005-eventos-juego.sql`, se borra a las 24 h como todo `eventos`).

## Controles (tablet)
- Barra inferior: flechas ◀ ▲ ▶ ▼ y **Lanzar pintura** (en el nivel 1 está apagado: no hay Grises).
  - Nivel 1: cada toque es un paso. En el lienzo: tocar avanza; deslizar mueve hacia ese lado.
  - Nivel 2: ◀ ▶ se mantienen apretados para caminar; ▲ salta; ▼ baja. Tocar el lienzo salta.
- Teclado (para probar): flechas o WASD, y espacio para lanzar.
- Barra derecha: nivel, puntaje, tus latas, tus piezas y cómo se juega en ese nivel.

## Datos
- Sin dependencias nuevas: canvas con `requestAnimationFrame`, sprites pixel en código.
- `shared/datos.ts` suma el tipo `juego: { png }`. La credencial lo muestra en la casilla «Juego Pixel».

## Arte (generado aquí, acabado medio; después a Figma)
- **De Figma, reusado del repo:** personaje Pixel (FA10, `graffiti/public/figma/stickers/personaje.svg`) y el lateral de
  la Línea 1 (`vagon/public/figma/metro/linea1-lateral.svg`).
- **Generado** (`generado: true`, en `juego-pixel/src/juego/sprites.ts`): autos, micro, Grises (de frente y de lado),
  bola de pintura, árbol, banca, basurero, señal del metro, lata de pintura, las 4 piezas del mural (corazón, estrella,
  rayo, gota) y las texturas de vereda, calle, vías, plaza, entrada del metro, pared del andén, vigas y mural, con la
  paleta Línea azul.
- Manifiesto: `docs/plans/009-juego-pixel/assets.manifest.md`.

## Pantalla
Kit de barras fijas (`shared/ui/`): barra superior (título, pausa, reiniciar), lienzo, barra derecha (puntaje y ayuda) y
barra inferior (controles). Sin scroll en las 6 resoluciones de tablet. Tutorial de 3 pasos y quiosco a los 90 s.

## Verificación (13 nov 2026, versión por niveles)
- [x] Motores probados aparte (Node, 34 casos). Nivel 1: avanzar suma, la lata se junta (+1) y desaparece, a las 30 filas
  llega al metro, ya no corre el reloj, atropello, quedarse quieto, hay latas en tableros al azar y de la meta en
  adelante todo es estación. Nivel 2: 5 tiros por lata, oleadas de 3 y 4, los Grises se apoyan en las vigas, saltar sube
  y bajar baja, la pared frena, 3 golpes de color = bola (+2) y gastan munición, sin latas hacen falta 5, la bola rueda,
  se lleva a otro Gris (+5) y suelta su pieza del color de la bola, se rompe al rebotar, la pieza se junta (+3) o se
  borra a los 5 s, las vidas, la bola que se escapa a los 6 s, andén limpio y 60 partidas al azar sin errores.
- [x] En el navegador (modo demo, 26 casos): tutorial con los niveles; 61 cuadros por segundo; en el nivel 1 «Lanzar»
  está apagado; el nivel 1 termina y muestra tu mural; `?nivel=2` parte en el andén; el botón dice el color que toca;
  3 latas = 15 tiros; un bot que juega al azar hace entre 9 y 39 puntos y limpia de 1 a 5 Grises; con 5 puntos o más
  suma al timbre Creación y **el mural llega al momento a la casilla «Juego Pixel» de la credencial**; la tarjeta se
  descarga; «Otra vez» vuelve al nivel 1; sin errores de consola.
- [x] Sin scroll, todo a la vista y toques ≥ 44 px en las 6 resoluciones de tablet, en el cruce y en el andén.
- [ ] Correr `shared/supabase/migraciones/005-eventos-juego.sql` (sin ella, el timbre suma igual pero el mural no llega).
- [ ] 60 fps y controles táctiles en la tablet real (mantener ◀ ▶ apretados en el andén).
- [ ] Nivel 3: por decidir.
- [ ] El hub todavía enlaza al Vagón: lo cambia la tarea T2.
