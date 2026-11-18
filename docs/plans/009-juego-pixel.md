# 009 · Juego Pixel «Hora punta» (reemplaza al Vagón)

Fecha: 13 nov 2026 · Estado: **ronda 3 (18 nov): el Inacapín de Figma salta por el mapa, Grises y pintura nuevos, personaje «Pinta» y vehículos Pixel** (rama `amaro/hora-punta-r3`). Ronda 2 (17–18 nov): cruce isométrico, andén y jefe (rama `amaro/hora-punta-iso`). Antes: 3 niveles decididos el 13 nov.
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
- Al llegar, la cámara muestra el pórtico y el personaje baja la escalera; al chocar queda aplastado en una mancha rosa
  mientras el tránsito sigue. La tarjeta aparece 1,2 s después.

### Fuera La pared
`pared.ts` y `dibujoPared.ts` se borran. `?nivel=2` parte en el andén y **`?nivel=3` abre el jefe** (con 3 latas y
4 piezas de prueba). El mural vuelve a ser la **cuadrícula de 4 × 3** con tus piezas y latas, más un **trofeo** en la
primera casilla si venciste al jefe.

### Jefe · El Inacapín Pixel (ronda 2, reemplazado por la ronda 3)
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
- **Vidas:** 3. Si un Gris, una mancha o una gota te tocan, pierdes una y quedas 2 s intocable. Si chocas con el
  Inacapín **te empuja de un salto** sin quitarte vidas (18 nov: con bots, chocarlo al empujar la bola era la segunda
  causa de derrota).
  **Perder no borra lo juntado:** el mural se queda con tus piezas y latas.
- **Al ganar:** el Inacapín celebra a todo color y la pantalla dice «¡Le devolviste el color!». El mural suma el trofeo.
- **Duración:** la meta era 60 a 90 s. Medido con bots (`npm --prefix juego-pixel run pruebas`): un bot atento gana
  siempre en ~31 s; uno que reacciona en 0,35 s y se distrae el 25 % del tiempo gana 70 de 100, en 32 a 44 s (mediana
  34 s). **Queda abierto:** si se quiere llegar a 60 s, subir a 8 golpes o espaciar los Grises (ver «Verificación ronda 2»).
- **Puntaje:** +2 por bola, +5 por Gris arrastrado, **+10 por golpe** al Inacapín y **+30 al vencerlo**.

## Ronda 3 (18 nov): el Inacapín de Figma, Grises nuevos, personaje que salta y vehículos Pixel
Pedido de Amaro del 18 nov (plan 014 §0 y §1 «Hora punta»). **Manda sobre la ronda 2 donde choquen.** Solo se toman
mecánicas (primer jefe de Snow Bros, jefes de Cuphead); personajes y arte son de la campaña.

| Antes (ronda 2) | Ahora (ronda 3) |
|---|---|
| «El Inacapín Pixel», personaje propuesto por un agente, gris por partes | **«Inacapín»**, el de Figma: «Pixel / Mascota · Inacapino» (`1002:29670`, sección «Inacapino · lenguaje pixel» `1002:29669`, página «Visual · Pixel»). Libro rojo INACAP con la franja de la «i», guante y zapatillas, grilla 20 × 20. Aprobado por Amaro: usa el **rojo INACAP** `#E2001A` (excepción como la del metro L1) |
| Quieto en una esquina; cambia de esquina cada 2 golpes | **Salta por el mapa y se mueve todo el tiempo** (camina, salta entre el piso y las vigas, embiste) |
| 6 golpes, 3 fases | **9 golpes, 3 fases** (cada 3 golpes) |
| Grises de 8 × 8 sin familia | Grises de la **familia del Inacapín** (libro-caja con contorno, ojos cuadrados, piernas y zapatillas), en gris «borrado» |
| Arena de ~43 px por celda en 1180 × 820 | La arena usa **todo el alto** (~63 px por celda): el doble de área |
| Personaje FA10 (`personaje.svg`) | **Personaje nuevo, «Pinta»**, con animación de caminar, saltar, lanzar y golpe |
| Autos y micros como cajas | **Micro, taxi, autos y metro** rehechos en Pixel con volumen |

- **Nombre:** no se encontró en Figma una sección «Inacapin · investigación del personaje versión 2» con ese nombre exacto
  (se revisaron las páginas Dirección creativa, Recursos y sistema, Visual · Pixel, Archivo, Campaña, Journey y Web ·
  Design system). La versión Pixel aprobada que sí existe es la de arriba; si Amaro apunta a otro nodo, se cambia el sprite
  (`INACAPIN` en `sprites.ts`, grilla de 20 × 20) y nada más.

### Jefe · El Inacapín (inspirado en el primer jefe de Snow Bros y en la dificultad de Cuphead)
- **Tamaño:** 3,4 celdas de alto (unos 215 px en 1180 × 820). Su caja de golpe es el libro (2,4 × 3,4 celdas).
- **Siempre se mueve.** Entre ataques **camina** por su piso o viga hacia ti y se da vuelta en los bordes. Después elige:
  1. **Salto:** se agacha (aviso de 0,5 s; su sombra marca dónde cae), salta a otra viga o al piso cerca de ti. Si te cae
     encima, pierdes una vida. Desde la fase 2, al caer al piso **levanta una onda** que corre por el piso hacia ambos
     lados: se salta.
  2. **Escupe Grises:** abre el libro (aviso de 0,6 s) y lanza 1 Gris (fase 1) o 2 (fases 2 y 3) hacia ti.
  3. **Embestida** (desde la fase 2, solo en el piso): se agacha y parpadea con una flecha (aviso de 1 s; 0,8 s en la
     fase 3) y cruza el piso hasta la pared. Se esquiva subiendo a una viga. Al chocar la pared queda **mareado 1,2 s**:
     el mejor momento para pegarle.
- **Más Grises:** como máximo 2 / 3 / 4 vivos por fase, y desde la fase 2 también **caen Grises del techo** (se marca
  dónde 0,8 s antes). Desde la fase 2 caen **gotas grises** en 2 columnas (3 en la fase 3), marcadas 1 s antes.
- **Cómo se le pega:** igual que antes. Atrapas Grises con **2 golpes** de tu pintura (no se acaba) y **empujas la bola**:
  cada bola que lo toca (camine, salte o embista) es un golpe, le **devuelve el rojo desde los pies hacia arriba** y lo
  hace saltar lejos (0,9 s sin recibir otro). La pintura directa no le hace nada.
- **Fases:** cada 3 golpes ruge «¡Fase 2!» / «¡Fase 3!» (1,2 s quieto) y desde ahí camina, salta y ataca más rápido.
- **Tocarlo** mientras camina te empuja sin quitarte vidas; si te cae encima o te embiste, sí.
- **Vidas:** 3, como en el andén. Perder no borra lo juntado.
- **Meta de dificultad:** quien juega por primera vez lo gana en 2 o 3 intentos y la pelea dura 90 a 120 s. Se mide con
  bots en `npm --prefix juego-pixel run pruebas` (ver «Verificación ronda 3»).
- **Puntaje:** +2 por bola, +5 por Gris arrastrado, **+10 por golpe**, **+30 al vencerlo**. El mural suma el trofeo.

### Grises y pintura (andén y jefe)
- Sprite de 12 × 12 de la familia del Inacapín, en grises con un tramado «borrado». Animados: caminan (piernas
  alternadas), saltan (piernas recogidas) y tiritan cuando reciben pintura.
- **La pintura los cubre por capas** desde los pies, con un borde que chorrea; cada golpe salpica gotas del color.
- **La bola**: redonda, del color de la pintura, con brillo y los ojos del Gris asomando. Al rodar **gira** y deja un
  **rastro** de gotas que se seca; cuando se rompe o golpea al Inacapín **estalla en color**.

### Pantalla del andén y del jefe
- La arena toma **todo el alto** del lienzo; el HUD va encima (arriba a la izquierda, sobre la pared) y los controles a
  los lados, semitransparentes, encima de los bordes de la arena. En vertical la arena va arriba y los controles debajo.
- Controles más compactos en el andén y el jefe: ◀ ▶ grandes abajo y ▲ ▼ arriba (izquierda); Saltar y Lanzar (derecha).

### Personaje «Pinta» (nuevo, `generado: true`)
- Pixel de 16 × 16 en la paleta Línea azul: gorro celeste, polerón azul, pantalón negro, zapatillas hueso y la lata de
  spray en la mano. Cuadros: quieto, caminar (2), saltar, lanzar y golpe. Se usa en los 3 niveles y en la tarjeta.

### Vehículos del cruce (Pixel con volumen, `generado: true`)
- **Micro** (bus de Santiago): blanco hueso con franja azul y lapislázuli, ventanas en fila, puertas, letrero de recorrido
  y número en el frente.
- **Taxi** (nuevo tipo en el motor, 1 de cada 4 autos): negro con techo amarillo y el letrero «TAXI».
- **Autos:** sedán con capó, cabina, maletero, parabrisas, llantas con tapa y focos; colores de la paleta.
- **Metro:** 3 carros con el lateral de Figma y la trompa amarilla con tramado, como el afiche del Metro.
- Todo con contorno negro, colores planos y tramado de 2 tonos para las sombras.

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

## Verificación ronda 2 (18 nov, rama `amaro/hora-punta-iso`, modo demo)
- [x] **Motor en Node** (`npm --prefix juego-pixel run pruebas`, 41 casos): cruce 14 (avanzar, lata, choques, aviso del
  metro, quedarse quieto, meta, estación, latas en 50 tableros; un bot que mira el tránsito llega en 237 de 300 tableros,
  mediana 11,8 s), andén 11 (100 partidas al azar sin errores) y jefe 16 (colores, 2 golpes, pintura directa, golpe con
  bola, fases y esquinas, mancha, gotas, empujón, derrota, victoria +30; 300 peleas con bots sin errores).
- [x] **Partida completa en Playwright** (1180 × 820, teclado y toques reales): el cruce llega al metro al primer intento
  (19 s), el andén (2 piezas, multitáctil: mantener ▶ camina 2,2 celdas y Lanzar responde a la vez; al levantar el dedo se
  suelta), el jefe se vence en 28 s con 6 golpes, «¡Le devolviste el color!», el mural trae el trofeo y «Llévatela» abre.
  Sin errores de consola.
- [x] **Cuadros por segundo** (Chromium sin GPU): 60 en el cruce, el andén y el jefe; con la CPU 4× más lenta el andén y el
  jefe siguen en 59–60 y el cruce baja a ~38 (a 2× sigue en 60).
- [x] **Pantalla** en 1024 × 768, 1180 × 820, 1280 × 720, 1366 × 768, 768 × 1024 y 820 × 1180, en 10 estados (entrada del
  cruce, cruce, pausa, «Llegaste» con 12 latas, andén, «Llegó el Inacapín», jefe, fin, Llévatela y entrada del jefe): sin
  scroll, nada fuera de vista, ningún panel con scroll ni tarjeta recortada, toques ≥ 44 px y controles ≥ 64 px.
- [ ] En la tablet real: 60 fps del cruce isométrico y los controles táctiles a ambos lados.
- [ ] El Inacapín Pixel lo valida el equipo (personaje propio, sin el logo de INACAP).
- [ ] `dist/` compilado aquí sin `.env.local` (modo demo): recompilar con el `.env.local` antes de publicar.

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
