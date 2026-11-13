# 009 · Juego Pixel «Hora punta» (reemplaza al Vagón)

Fecha: 13 nov 2026 · Estado: **en construcción** (rama `amaro/juego-pixel`, tarea T1 de `docs/tasks/009-pendientes.md`).
Nombre de trabajo: «Hora punta» (se cambia en un solo lugar: `juego-pixel/src/App.tsx`).

## Idea
Un juego **original** en lenguaje Pixel para la tablet. Se toman dos **mecánicas** conocidas y nada más (personajes,
nombres, escenarios y arte son propios):
- **Cruzar** (como Crossy Road): avanzas fila por fila por la ciudad esquivando autos, micros y el metro. Cada fila nueva
  suma un punto. Si te quedas quieto mucho rato, se te pasa la hora punta.
- **Atrapar y empujar** (como Snow Bros): los **Grises** (manchas que borran el color de la ciudad) te persiguen por las
  veredas y plazas. Les lanzas pintura: con 3 golpes quedan atrapados en una **bola de pintura**, y si la empujas rueda
  y se lleva a los otros Grises (combo).

Encaja con el tema: el diseño le devuelve el color a la ciudad. Usa el metro de la campaña (Línea 1 de Figma) y el
personaje Pixel de Figma.

## Reglas
- Tablero de 13 columnas que avanza hacia arriba. Filas: **vereda** y **plaza** (seguras, con bancas y árboles que
  tapan el paso), **calle** (autos y micros de lado a lado) y **vías del metro** (una luz avisa y pasa el tren).
- Pierdes si te atropellan, si te alcanza el tren, si un Gris te atrapa o si pasan 9 s sin avanzar (avisa a los 6 s).
- Puntaje: filas avanzadas + 2 por bola hecha + 5 por Gris arrastrado (×2, ×3… si la bola se lleva varios).
- La dificultad sube con la distancia: el tráfico es más rápido y aparecen más Grises.
- Una partida dura de 1 a 2 minutos.

## Controles (tablet)
- Barra inferior: flechas ◀ ▲ ▶ ▼ y **Lanzar pintura**. En el lienzo: tocar avanza; deslizar mueve hacia ese lado.
- Teclado (para probar): flechas o WASD, y espacio para lanzar.
- Barra derecha: puntaje, mejor puntaje de la sesión y cómo se juega.

## Modo juego y datos
- Al terminar una partida con al menos 5 puntos, `otorgarCreacion('juego')`: cuenta como una de las 4 experiencias del
  timbre Creación (plan 009 §1) y aparece en el inventario de la credencial (casilla «Juego Pixel»).
- Tarjeta 1080 × 1350 con la franja común: el personaje, el puntaje y las filas cruzadas.
- Sin dependencias nuevas: canvas con `requestAnimationFrame`, sprites pixel en código.

## Arte (generado aquí, acabado medio; después a Figma)
- **De Figma, reusado del repo:** personaje Pixel (FA10, `graffiti/public/figma/stickers/personaje.svg`) y el lateral de
  la Línea 1 (`vagon/public/figma/metro/linea1-lateral.svg`).
- **Generado** (`generado: true`, en `juego-pixel/src/juego/sprites.ts`): autos, micro, Grises, bola de pintura, árbol,
  banca, basurero, señal del metro y las texturas de vereda, calle, vías y plaza, con la paleta Línea azul.
- Manifiesto: `docs/plans/009-juego-pixel/assets.manifest.md`.

## Pantalla
Kit de barras fijas (`shared/ui/`): barra superior (título, pausa, reiniciar), lienzo, barra derecha (puntaje y ayuda) y
barra inferior (controles). Sin scroll en las 6 resoluciones de tablet. Tutorial de 3 pasos y quiosco a los 90 s.

## Verificación (13 nov 2026)
- [x] Motor probado aparte (Node, 17 casos): avanzar suma, atropello, auto que llega, aviso y paso del metro, árbol que
  tapa, quedarse quieto, Gris que atrapa, 3 golpes = bola (+2), bola empujada que arrastra a otro Gris (+5), bola que se
  rompe, partida al azar sin errores y filas viejas descartadas.
- [x] En el navegador (modo demo): 61 cuadros por segundo; el puntaje sube; la partida termina; con 5 puntos o más suma
  al timbre Creación (evento con `app: 'juego'`) y aparece el aviso de la mesa; con menos no suma; la tarjeta se
  descarga; «Otra vez» reinicia; sin errores de consola.
- [x] Sin scroll, todo a la vista y toques ≥ 44 px en 1024 × 768, 1180 × 820, 1280 × 720, 1366 × 768, 768 × 1024 y
  820 × 1180.
- [ ] 60 fps y controles táctiles en la tablet real.
- [ ] El hub todavía enlaza al Vagón: lo cambia la tarea T2.
