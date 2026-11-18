# 014 · Ronda 3: UI nueva en Teatro, menú y Fotomatón; feedback del 18 nov; respaldo de la pantalla Flip

Fecha: 18 nov 2026 (evento: **19 nov**) · Pedido de Amaro del 18 nov · Estado: **decidido, en construcción**.
Sigue al plan 012 (UI de herramienta, kit v2). Pedida para agentes: [`docs/tasks/014-ronda-3.md`](../tasks/014-ronda-3.md).

## 0. Qué cambia respecto de lo decidido
| Antes | Ahora | Dónde estaba |
|---|---|---|
| El jefe se llama «Inacapín Pixel» y su diseño fue propuesto por un agente | Se llama **«Inacapín»** y se basa en el de Figma: sección «Inacapin · investigación del personaje versión 2», versión Pixel (aprobado por Amaro). Los Grises toman su estilo | Plan 009-juego-pixel §Jefe |
| Grabado ofrece los 15 marcos, por encima o por debajo del papel | **Solo los 5 de Orgánica**, y **rodean** el papel: no tapan el área de trabajo | Plan 012 §4 |
| Teatro, menú del hub y Fotomatón con el kit actual | Los tres pasan al **kit v2** | Plan 012 §3 |
| HUB: las personas aparecen en distintos pisos | **Empiezan en la plaza y bajan al andén** | Plan 005 bloque E |
| El HUB en la pantalla Flip, sin alternativa | **Plan de respaldo** (§3), por si no se puede usar el HUB en la Flip | — |
| AGENTS.md «Estado en vivo»: timbre 4 «Secreto» | Timbre 4 **«Flyer»** (plan 012 §8). Se corrige en el estado en vivo | `AGENTS.md` |

## 1. Feedback por experiencia (18 nov)
### Estación Audioreactiva
- **Túnel**: que se parezca a la referencia original, el C3 «Túnel → estallido → túnel» de Figma (`449:86016`), que ya
  vive en `shared/c3-tunel.js` (lo usan la tarjeta del hub y el HUB).
- **Bum y Chas**: un efecto visual **propio de cada escena** para cada uno (hoy se sienten iguales).
- **Arrastrar sobre la escena** (eco, apagado, brillo): gusta; que también tenga un efecto **propio de cada escena**.

### Fotomatón
- **Kit v2** (como Mosaicos y Graffiti).
- **Mosaico de triángulos**: todavía raro, «bizarro». Rehacer hasta que se vea bien, o cambiarlo por otro efecto
  Geométrico que funcione con caras.
- **Vista previa de marcos**: el personaje pasa a ser el **ícono clásico de usuario** (cabeza y hombros).
- **Señal: los stickers** no se ven «de calle». Buscar referencias de stickers reales en la calle (troquel blanco, capas
  pegadas unas sobre otras, desgaste, tags, slaps) y rehacerlos con ese look.
- **Ventana web** y **Vinilo**: aprobados.
- **Metro**: no se parece al metro de la **Línea 1** de Santiago. Rehacerlo con referencias reales (frente del tren de
  L1) y con el lateral del metro de Figma (`juego-pixel/public/figma/metro-lateral.svg`).

### Hora punta
- **Personaje nuevo** que salta, en el estilo Pixel de la web.
- **Vehículos** (micros, taxis, autos, el metro) rehechos con ese estilo Pixel.
- **Andén (mecánica de Snow Bros)**: la pantalla se ve chica → agrandar; **mejorar los Grises** (con el estilo del
  Inacapín) y el **efecto de la bola de pintura**.
- **Jefe: el Inacapín** (de Figma, ver §0). Inspirado en el primer jefe de Snow Bros y en la dificultad de los jefes de
  Cuphead: **salta por el mapa** y **se mueve todo el tiempo** (no solo al recibir golpes); aparecen **más Grises**;
  tiene que costar. Se mantiene la mecánica: se le pega con bolas de Grises y le devuelve el color.
- **Tarjeta del hub**: la miniatura debe mostrar el juego como es ahora.

### Fotomatón en la tablet (18 nov, tarde)
- **En la tablet no se pudo dar permiso a la cámara.** Revisar por qué (permiso pedido sin un toque de la persona,
  restricciones de `getUserMedia`, el error que se muestra) y que la cámara siempre se pueda abrir o, si no, explicar
  qué hacer y ofrecer «Subir una foto».
- **Cámara en modo retrato por defecto** (vista vertical, 3:4).
- Optimizar el Fotomatón en la tablet (rendimiento de la vista en vivo).

### Graffiti (18 nov, tarde)
- En el modo Sticker, tocar un sticker ya pegado lo **selecciona para moverlo o eliminarlo** (hoy solo se quitan con
  deshacer).

### Taller de Grabado
- Solo **marcos de Orgánica**, y **alrededor** del papel, no encima.

### Teatro de Papel y menú del hub
- **Kit v2** en Teatro (`loops/`, autorizado por Amaro) y en el menú inicial (`index.html`).

### HUB «Estación»
- Las personas **empiezan en la plaza y bajan al andén**. Refinar el HUB. Pensar **otras cosas que mostrar** en la
  pantalla Flip, con el poco tiempo que queda.

## 2. Referencias que faltan (Amaro las puede mandar)
Los agentes parten con lo que hay en el repo; si llegan referencias, se usan:
- **Estilo Pixel de la web** («momento Pixel» de somosdiseno): capturas de los vehículos, el vagón y los personajes.
- **Metro Línea 1**: foto del frente y del lateral del tren de L1.
- **Stickers de calle**: fotos propias del equipo, si las tienen.
- **Pantalla Flip**: marca y modelo, para saber qué navegador trae y qué entradas tiene.

## 3. Pantalla Flip: plan de respaldo
Se prueba hoy (18 nov) si el HUB corre en la Flip. Si no:
| # | Respaldo | Qué hace falta | Qué se ve |
|---|---|---|---|
| R1 | **Un computador conectado a la Flip por HDMI** (un Mac o un notebook), con el HUB en pantalla completa en Chrome | Cable HDMI (o USB-C a HDMI) y el computador | El HUB en vivo, igual que lo planeado |
| R2 | **El navegador propio de la Flip** con la URL del HUB | Wi-Fi en la Flip | El HUB en vivo, si su navegador soporta canvas y WebGL básico |
| R3 | **Modo galería** (nuevo, liviano): una página que pasa las creaciones que llegan (mosaicos, grabados, graffitis, murales, flyers) a pantalla completa, sin animación pesada | Cualquier navegador | Las creaciones del día, en vivo |
| R4 | **Video en loop** desde un pendrive (grabación de 3–5 min del HUB y de las experiencias) | Pendrive y el reproductor de la Flip | Un video, sin datos en vivo |
| R5 | **Otra pantalla** (TV o proyector del stand) con R1 | La pantalla | Igual que R1 |

**Recomendación:** R1, con R3 como alternativa liviana si el HUB anda lento, y R4 como último recurso sin red.
Se construye **R3** (`hub-estacion/`, ruta `#/galeria` o `?galeria`) y se graba **R4** al final del día.

## 4. Orden (por lo que más se ve el 19)
1. Hora punta (jefe, Grises, vehículos, personaje). 2. Fotomatón (kit v2, triángulos, marcos). 3. Audioreactiva (Túnel
y efectos). 4. Grabado (marcos) y menú del hub (kit v2 y tarjeta de Hora punta). 5. Respaldo de la Flip (R3) y HUB.
6. Teatro en kit v2.

## 5. Decisiones abiertas
- **Kit v2 en el menú del hub**: el menú no es una herramienta; toma los **tokens y componentes** del kit v2 (botones,
  tarjetas, segmentado), sin la anatomía de lienzo y panel.
- **Lo que no llegue estable el 19 queda fuera** (cada parte va en su rama y PR).
