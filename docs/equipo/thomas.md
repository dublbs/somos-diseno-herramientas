# Cola de Thomas · carril Experiencias

Zona: `fotomaton/` (Cabina de fotos), `taller-mosaicos/`, `graffiti/`, `grabado/`, `audioreactiva/`,
`index.html`, `shared/ui/` (salvo `Juego.tsx`), `shared/marcos*.ts`. Reglas y pipeline: [`README.md`](README.md).

**El orden de este archivo es la prioridad.** Se toma la primera tarea en estado «Lista».

## T-004 · La pantalla completa no se pierde al entrar a una experiencia
- Estado: Después del evento (no entra en la ventana de 8 a 10, ver `manana.md`)
- Origen: F-002
- Contexto: el navegador **siempre** sale de pantalla completa al cambiar de página, porque cada experiencia es otra
  página (`<app>/dist/`). Eso no se arregla con JavaScript.
- Cambio (opción recomendada: app instalada):
  1. Crea un `manifest.webmanifest` en la raíz con `"display": "fullscreen"`, `"scope": "./"`, `"start_url": "./"`,
     orientación horizontal y los íconos que ya hay en `shared/`. Enlázalo desde `index.html` y desde el `index.html` de
     cada experiencia de tablet: solo una línea `<link rel="manifest" href="../../manifest.webmanifest">`, sin tocar su
     lógica. Esa línea entra en la zona de Thomas porque no cambia nada de la app.
  2. Instalada con «Agregar a la pantalla de inicio», la tablet abre el hub sin barra del navegador, y todo lo que está
     dentro del `scope` sigue a pantalla completa al navegar.
  3. Escribe la guía para el staff en `docs/equipo/tablets.md`: cómo instalarla en cada tablet y, como respaldo, cómo
     fijar la pantalla en Android.
  - Si la opción recomendada no alcanza, la alternativa es un «marco» que cargue cada experiencia en un `iframe` dentro
    del hub. Cambia la arquitectura: **no la construyas**. Anótala como hallazgo para que Amaro o Felipe decidan.
- Verificar: Chrome con DevTools (Application → Manifest sin errores) y, de ser posible, en una tablet Android real.
- Aceptación: instalada en la tablet, entrar y salir de 3 experiencias seguidas no muestra la barra del navegador.

## T-005 · Copy del inicio
- Estado: Lista
- Origen: F-002
- Archivo: `index.html`, líneas ~86–99 (marca y encabezado) y el `<title>`.
- Cambio:
  - Quita el logo y el nombre «Somos Diseño» de la marca. En su lugar va «Todas las formas del diseño».
  - Se mantiene la línea «INACAP Santiago Centro · Semana del Diseño 2026».
  - `h1`: «Experiencias interactivas».
  - Párrafo: «Explora los tres lenguajes visuales del evento: Geométrico, Píxel y Orgánico. Toca una actividad para
    comenzar.»
  - Revisa que el pie y el `<title>` no repitan el logo.
- Aceptación: el inicio no muestra el logo «Somos Diseño» y el texto es exactamente el de arriba. Sin scroll en las 6
  resoluciones.

## T-006 · Vista previa de Hora punta en el inicio
- Estado: Lista
- Origen: F-002
- Archivo: la miniatura de Hora punta que usa `index.html`. Busca qué imagen usa la tarjeta.
- Cambio:
  - Saca una captura del juego **actual** (`juego-pixel/dist/`, nivel 1 con el personaje Pinta y micros en pantalla)
    con Playwright, a la proporción de las otras tarjetas.
  - Guárdala donde están las otras miniaturas y conserva el nombre, para no tocar `juego-pixel/`.
  - Si B-007 cambia mucho los sprites, se repite al final.
- Aceptación: la tarjeta muestra el juego tal como se ve hoy.

## T-007 · Mosaicos: «Multiplicar» se explica o se quita
- Estado: Lista
- Origen: F-002 (Amaro: «si no se justifica por sí sola, es innecesario»)
- Archivos: `taller-mosaicos/src/components/Panel.tsx`, `App.tsx`, `styles.css`.
- Cambio:
  - Mira qué hace «Multiplicar». Si es una variante de algo que ya hace otra herramienta, **quítalo**, junto con su
    código, su ayuda y su paso en el tutorial si lo tiene.
  - Si es lo único que hace algo central, deja el control y pon una vista previa que lo explique. Antes de construir, anota
    por qué en el PR.
- Aceptación: no queda un control cuyo efecto no se entienda al tocarlo. El build está en verde y la pasada de pantalla,
  limpia.

## T-008 · Teatro: escenario arriba y piezas con mejor dibujo
- Estado: Lista solo para Felipe mañana (`manana.md`); el Guanaco, después del evento
  Felipe escriba «ok» aquí.
- Archivos: `loops/src/` (panel y piezas Huemul, Pez y Guanaco).
- Cambio:
  - En el panel derecho, la sección del escenario va **arriba de la biblioteca**.
  - Huemul: reposiciona las orejas.
  - Pez: colores medianamente realistas, por ejemplo plateado, azul o verde de un pez de Chile, sin perder contraste con
    el escenario.
  - Guanaco: menos infantil, sobre todo la cabeza (proporción, orejas, hocico). Si las piezas vienen de Figma, ajústalas
    allá o en su script, nunca a mano.
- Aceptación: capturas antes y después de las 3 piezas en el PR, y el panel con el escenario arriba en las 6
  resoluciones.

## T-009 · Graffiti: el muro del vagón como el metro de la web
- Estado: Después del evento (no entra en la ventana de 8 a 10, ver `manana.md`)
- Origen: F-002
- Referencias:
  - `docs/equipo/referencias/metro-web-pixel.png`: el metro Pixel de la web. Manda esta.
  - `linea1-foto-a.webp` y `linea1-foto-b.webp`: fotos del tren de Línea 1, para los detalles.
- Archivos: `graffiti/` (el muro «vagón» y su asset en `graffiti/public/figma/` o el script que lo genera).
- Cambio: el muro es una **vista de cerca** de ese vagón:
  - cuerpo hueso con franja roja y línea morada;
  - ventanas moradas con brillo celeste y puertas dobles con su marco negro;
  - los bogies abajo;
  - el mismo pixel y los mismos colores de la web.
  - No tiene que ser idéntico. Si el asset viene de Figma, toma el componente de la web desde ahí. Actualiza el manifiesto
    de assets.
- Aceptación: puesto junto a la referencia, se reconoce el mismo tren. Los demás muros no cambian.

## T-010 · Audioreactiva a todo el lienzo
- Estado: Después del evento (no entra en la ventana de 8 a 10, ver `manana.md`)
- Origen: F-002
- Archivos: `audioreactiva/src/`.
- Cambio:
  - Las animaciones ocupan **todo el ancho y alto del lienzo**, no un cuadro centrado.
  - «Llévatelo» exporta solo el **recorte central**, en la proporción de la tarjeta (1080 × 1350 con la franja negra
    común).
  - No hagas versión de papel.
  - Revisa los 5 estilos y los efectos Bum y Chas en horizontal y en vertical.
- Aceptación: en las 6 resoluciones la animación llena el lienzo sin deformarse, y la tarjeta exportada sale bien
  encuadrada.

## T-011 · Grabado: el taco aparece animado y nada se pixela
- Estado: Mañana solo si sobra tiempo (`manana.md`)
- Origen: F-002
- Archivos: `grabado/src/`.
- Cambio:
  - Al poner un taco, aparece con una animación corta, como si se apoyara sobre el papel (escala y sombra en unos
    250 ms). Con `prefers-reduced-motion`, aparece sin animación.
  - En el tamaño máximo, los tacos y todos los elementos se ven pixelados. Busca dónde se rasterizan: un SVG pasado a
    canvas a su tamaño natural, `drawImage` desde un bitmap chico o `devicePixelRatio` sin aplicar. Rasteriza al tamaño
    final por `devicePixelRatio`.
- Aceptación: en 1366×768, el elemento a tamaño máximo se ve nítido (captura con `deviceScaleFactor` 2) y la animación se
  ve al poner un taco.

## T-012 · Cabina: cambiar el marco «pizarra» por uno de calle
- Estado: Mañana: solo quitar la pizarra de la lista de marcos (`manana.md`). El marco de calle nuevo, después del evento: antes de construirlo, propón 2 opciones en el PR borrador y espera que Amaro elija
- Origen: F-002
- Archivos: `shared/marcos.ts` (`PM01`, «pizarra», línea ~56), el asset del marco y `scripts/marcos-*.py` si se
  genera. Lo usan la Cabina y la credencial.
- Cambio:
  - Reemplaza la pizarra por un marco de calle del lenguaje que corresponda, por ejemplo cartel de micro, letrero de
    calle, afiche pegado o cinta de obra.
  - El arte viene de Figma o de un script, no inventado a mano.
  - Recompila los `dist/` de `fotomaton` y `credencial`. Recompilar el `dist/` de la credencial está permitido aunque sea del carril de Basti, porque no cambia su código. Avísale en el PR.
- Aceptación: el marco nuevo funciona en la Cabina y en la credencial, y la pizarra ya no aparece.

## T-002 · Script de verificación de pantalla para todas las experiencias
- Estado: Después del evento (no entra en la ventana de 8 a 10, ver `manana.md`)
- Origen: regla de pantalla de `AGENTS.md`. Hoy cada agente la hace a mano y de forma distinta.
- Archivos: nuevo `scripts/qa-pantalla/verificar.mjs` y `scripts/qa-pantalla/README.md`. No toca las apps.
- Cambio:
  - Usa Playwright con el Chromium preinstalado, cámara y micrófono falsos (`--use-fake-device-for-media-stream`,
    `--use-fake-ui-for-media-stream`). Sirve la raíz del repo con un servidor estático.
  - Abre `<app>/dist/` de las 7 experiencias de tablet y el hub `index.html` en 1024×768, 1180×820, 1280×720,
    1366×768, 768×1024 y 820×1180.
  - Mide por cada combinación:
    - scroll de página (`scrollHeight > innerHeight` o `scrollWidth > innerWidth` en `documentElement`);
    - controles fuera de la pantalla, sin contar los que están dentro del panel lateral con scroll;
    - botones de menos de 48 px;
    - errores de consola.
  - Guarda una captura por combinación en una carpeta ignorada por git y escribe un informe en Markdown.
  - Opción `--app <carpeta>` para medir una sola app y `--url <base>` para medir lo publicado en GitHub Pages.
- No tocar: el código de las apps. Las fallas que encuentre son hallazgos, no arreglos.
- Verificar: `node scripts/qa-pantalla/verificar.mjs --app taller-mosaicos` corre de punta a punta. Mosaicos es la
  referencia del kit v2 y debería salir limpio.
- Aceptación:
  - un solo comando deja `docs/qa/pantalla-<fecha>.md` con una tabla app × resolución y la lista de fallas;
  - el README explica cómo correrlo.

## T-003 · Pasada de pantalla después del evento y hallazgos
- Estado: Después del evento (no entra en la ventana de 8 a 10, ver `manana.md`)
- Origen: E-007
- Archivos: `docs/qa/pantalla-<fecha>.md` y la sección «Hallazgos» de este archivo.
- Cambio:
  - Corre T-002 contra `main` (local) y contra GitHub Pages.
  - Cada falla, con app, resolución y captura, va a «Hallazgos». No se arregla en esta tarea.
- Aceptación: el informe existe y Amaro o Felipe pueden pasar cada falla a una tarea.

## T-001 · Qué falta del Teatro: auditoría de solo lectura
- Estado: Después del evento (no entra en la ventana de 8 a 10, ver `manana.md`)
- Origen: E-006
- Archivos: lectura de `loops/` y `docs/tasks/008-teatro.md`. Escribe solo `docs/qa/teatro-estado.md`.
- Cambio:
  - Revisa cada tarea T-000 a T-019 de `docs/tasks/008-teatro.md` contra el código actual de `loops/`, que el PR #39
    pasó al kit v2.
  - Clasifica cada una como «Hecha» (con commit o archivo como evidencia), «Parcial» (qué falta), «Pendiente» u
    «Obsoleta» (el kit v2 la reemplazó).
  - Abre `loops/dist/` en las 6 resoluciones y anota lo que se vea roto.
- No tocar: nada en `loops/`. Es de Felipe; esta tarea solo mira.
- Aceptación: `docs/qa/teatro-estado.md` con una fila por tarea y su evidencia. Con eso, Felipe decide qué se hace.

## Hallazgos
<!-- El agente agrega aquí lo que encuentre fuera de su tarea: «- dd/mm · app · qué · evidencia». Amaro o Felipe lo
pasan a la bitácora. -->
