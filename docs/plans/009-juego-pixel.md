# 009 · Juego Pixel «Hora punta» (reemplaza al Vagón)

Fecha: 13 nov 2026 · Estado: **ronda 2 (17 nov): cruce isométrico, andén y jefe** (rama `amaro/hora-punta-iso`). Antes: 3 niveles decididos el 13 nov (rama `amaro/juego-pixel`, tarea T1 de `docs/tasks/009-pendientes.md`).
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
| ~~3 · La pared~~ | ~~Puyo Puyo~~ | — | Fuera desde el 17 nov: la reemplaza el jefe (ver «Ronda 2») |
| Al final | — | **Tu mural** | Va a la tarjeta, al QR y al **inventario de tu credencial** |

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
- Para probarlo o mostrarlo sin cruzar primero: `?nivel=2` (parte en el andén con 3 latas) y `?nivel=3` (desde la ronda 2
  abre el jefe con 3 latas y 4 piezas).

## Ronda 2 (17 nov): cruce isométrico, sin La pared y con jefe
Pedido de Amaro (plan 012 §4 «Hora punta»): el nivel 1 más isométrico, como Crossy Road y en el estilo del vagón de la
web y de los arcades del afiche; **fuera el nivel 3**; después del andén, un **jefe: el Inacapín Pixel**; y **controles a
ambos lados** como Minecraft Pocket Edition. Solo se toman mecánicas: personajes, nombres y arte son propios.

| Nivel | Mecánica | Qué juntas | Para qué te sirve |
|---|---|---|---|
| 1 · El cruce (isométrico) | Cruzar carriles (Crossy Road) | Latas de pintura | Munición del andén (5 tiros por lata) |
| 2 · El andén | Atrapar y empujar (Snow Bros) | Piezas del mural | Tu mural de 4 × 3 |
| Jefe · El Inacapín Pixel | Atrapar y empujar, contra un jefe | Su color | Un **trofeo** en tu mural si lo vences |

### Nivel 1 en vista isométrica (solo cambia el dibujo; el motor `cruce.ts` se conserva)
- Proyección 3/4 con volumen: las filas son **bandas inclinadas**; veredas, plazas y la estación son losas un poco más
  altas que la calle y las vías (se ve su canto).
- Autos y micros son **cajas con techo, frente y lateral** (3 tonos del mismo color, contorno negro), con cabina,
  ventanas celeste, ruedas y focos. El metro es un **tren de 3 carros** con volumen: el costado es el lateral de la Línea 1
  de Figma (`metro-lateral.svg`) y la trompa es amarilla, como el afiche del Metro.
- Árboles (dos cubos de copa sobre un tronco), bancas y basureros con altura y sombra. Las latas flotan y giran.
- El personaje tiene sombra y **salta en arco** de una celda a otra. La entrada del metro es un pórtico azul con su
  letrero «METRO» y la escalera que baja.
- Se dibuja de atrás hacia adelante; la cámara sigue suave al personaje y deja ver unas 9 filas hacia adelante.

### Fuera La pared
`pared.ts` y `dibujoPared.ts` se borran. `?nivel=2` parte en el andén y **`?nivel=3` abre el jefe** (con 3 latas y
4 piezas de prueba). El mural vuelve a ser la **cuadrícula de 4 × 3** con tus piezas y latas, más un **trofeo** en la
primera casilla si venciste al jefe.

### Jefe · El Inacapín Pixel (diseño propuesto, a validar)
- **Quién es:** no hay un Inacapín en el repo ni en el archivo de Figma de la campaña (se buscó «Inacapino» el 17 nov).
  Es un personaje pixel **original** de 16 × 16 (se ve de unos 3 × 3 celdas), de la familia del personaje Pixel
  (antenas, ojos cuadrados, cuerpo de bloque): un gigante de la hora punta que se quedó **gris**. **Sin el logo ni los
  colores de INACAP.** Cada parte de su cuerpo (antenas, cabeza, cara, brazos, panza, pies) recupera un color de la
  paleta cuando le pegas.
- **Cuándo:** al limpiar el andén aparece la tarjeta «¡Llegó el Inacapín Pixel!» y se entra a la pelea.
- **Arena:** el mismo andén (16 × 12 celdas) con el piso y tres vigas. El Inacapín ocupa una esquina del piso.
- **Cómo se le pega:** el Inacapín **lanza Grises**. Los atrapas con pintura (aquí bastan **2 golpes** y la pintura no se
  acaba: sale de tus colores, en orden) y **empujas la bola contra él**. Cada bola que lo toca es **un golpe** y le
  devuelve un color (barra «Color recuperado»). Tirarle pintura directo no le hace nada.
- **6 golpes, 3 fases** (cada 2 golpes cambia de esquina y se apura):
  1. Lanza un Gris cada ~4 s (2 a la vez como máximo) y a veces una **mancha** que rueda por el piso: la saltas.
  2. Además, **gotas grises** caen del techo en 2 columnas.
  3. Gotas en 3 columnas, manchas más seguido y Grises más rápidos.
- **Avisos:** todo ataque avisa antes: el Inacapín se agacha y brilla (mancha), las columnas de gotas se marcan en el piso
  1 s antes y el Gris sale de su boca.
- **Vidas:** 3. Si un Gris, una mancha, una gota o el Inacapín te tocan, pierdes una y quedas 2 s intocable.
  **Perder no borra lo juntado:** el mural se queda con tus piezas y latas.
- **Al ganar:** el Inacapín celebra a todo color y la pantalla dice «¡Le devolviste el color!». El mural suma el trofeo.
- **Duración:** una persona que juega por primera vez lo vence en 60 a 90 s (medido con bots en las pruebas).
- **Puntaje:** +2 por bola, +5 por Gris arrastrado, **+10 por golpe** al Inacapín y **+30 al vencerlo**.

## Puntaje
- Nivel 1: +1 por fila nueva, +1 por lata.
- Nivel 2: +2 por bola, +5 por Gris arrastrado (×2, ×3… si la bola se lleva varios), +3 por pieza.
- Jefe: +2 por bola, +5 por Gris arrastrado, +10 por golpe y +30 al vencerlo.
- Una partida completa dura de 3 a 4 minutos.

## Lo que te llevas
- **Tu mural:** una pared color hueso de 4 × 3 casillas con tus piezas (formas pixel: corazón, estrella, rayo y gota),
  cada una del color con que atrapaste a su Gris, y después tus latas. Si venciste al Inacapín, la primera casilla es un
  **trofeo**.
- **Tarjeta** 1080 × 1350 con la franja común: el mural, el personaje y el puntaje.
- **Inventario de la credencial:** con una persona jugando y al menos 5 puntos, la partida cuenta como una de las 4
  experiencias del timbre Creación (`otorgarCreacion('juego')`) y la miniatura del mural llega a su inventario (evento
  `juego`, migración `005-eventos-juego.sql`, se borra a las 24 h como todo `eventos`).

## Controles (tablet) · a ambos lados, como en los juegos de celular
- Juego a pantalla casi completa: una barra superior delgada (volver, título y nivel, puntaje, pausa y otra vez) y el
  lienzo. Puntaje, latas, vidas, piezas y la barra «Color recuperado» van como HUD sobre el lienzo.
- **Abajo a la izquierda, la cruceta** (◀ ▲ ▼ ▶); **abajo a la derecha, las acciones**: en el cruce un botón grande
  **Avanzar**; en el andén y el jefe **Saltar** y **Lanzar** (con el color que toca). Semitransparentes, de 64 px o más y
  multitáctiles: se puede mantener ◀ o ▶ y tocar Lanzar al mismo tiempo.
  - Nivel 1: cada toque es un paso. En el lienzo: tocar avanza; deslizar mueve hacia ese lado.
  - Andén y jefe: ◀ ▶ se mantienen para caminar; ▲ o Saltar salta; ▼ baja de la viga. Tocar el lienzo salta.
- «Cómo se juega» está en la pausa y en una tarjeta breve al empezar cada nivel.
- Teclado (para probar): flechas o WASD, y espacio para lanzar.

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
Desde la ronda 2: barra superior delgada con los tokens neutros de la guía común (plan 012) y el lienzo a pantalla casi
completa, con el HUD y los controles encima. Sin scroll en las 6 resoluciones de tablet. Tutorial de 3 pasos y quiosco a
los 90 s.

## Verificación ronda 2 (17 nov)
- [ ] Pendiente: se completa al terminar la rama `amaro/hora-punta-iso`.

## Verificación (13 nov 2026, versión por niveles; La pared salió el 17 nov)
- [x] ~~Nivel 3~~ (Node, 20 casos): tus colores (3 a 4), el par aparece al centro, se mueve, la pared lo frena, gira y se
  corre en el borde, soltar lo deja caer solo a él, 4 iguales se borran y pintan la pared (+2 c/u), el Gris de al lado se
  borra con el grupo (+3), cadena ×2, caen Grises a los 15 s, termina a los 90 s o si se llena, 50 partidas al azar sin
  errores. En el navegador: `?nivel=3`, ▲ gira, «Soltar», la partida termina, la pared pintada sale en la tarjeta (un
  bot que reparte las piezas pintó 49 casillas con cadena ×3) y sin scroll en las 6 resoluciones de tablet.
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
- [ ] El hub todavía enlaza al Vagón: lo cambia la tarea T2.
