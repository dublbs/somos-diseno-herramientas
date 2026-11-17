# 012 · Pedida multi-agente: UI de herramienta y ronda 2

Plan: [`docs/plans/012-ui-de-herramienta-y-ronda-2.md`](../plans/012-ui-de-herramienta-y-ronda-2.md). **No se lanza hasta
cerrar sus decisiones (§7).** Cada agente lee primero `AGENTS.md`, el plan 012 y la investigación.

## Reglas para todos los agentes
- Un agente = una zona = una rama `amaro/<tema>` = un PR en borrador contra `main`. Nadie mergea.
- **`shared/` lo escribe un solo agente (A0).** Los demás lo usan; si les falta algo, lo piden en su PR y esperan.
- `loops/` solo lo toca A8, y solo con el visto bueno de Pipe.
- Antes de terminar: `npm --prefix <app> run build` en verde, la medición de pantalla en las 6 tablets con cada
  herramienta activa, `dist/` recompilado solo de su app, y el PR dice qué probó y qué no.
- Si algo es ambiguo o choca con un plan, se anota en la tarea y se detiene.

## Olas
| Ola | Agentes | Empieza cuando |
|---|---|---|
| 0 | A0 (kit v2) · A7 (timbre 4) | Decisiones cerradas |
| 1 | A1 a A6, en paralelo | A0 mergeado (o su rama como base) |
| 2 | A9 (integración y revisión) · A8 (Teatro, si Pipe aprueba) | PR de la ola 1 abiertos |

Si se elige la versión corta para el 19 (plan §6), la ola 0 es solo A7 y la ola 1 corre **sin** A0, con las tareas
marcadas ⚡ sobre el kit actual.

---

## A0 · Kit v2: UI neutra de herramienta · zona `shared/ui/`, `docs/kit/`, `AGENTS.md`
- Tokens, átomos, moléculas, organismos y la plantilla `MarcoHerramienta` (investigación §5 y §6), en archivos nuevos
  junto al kit actual, que no se borra.
- Incluye: barra de herramientas flotante, panel derecho con scroll propio, panel de capas, barrita de la selección,
  **manijas de transformación** (mover, girar, escalar; las usan A1, A3 y A5), selector de color con escalas, gestos de
  2 y 3 dedos para deshacer y rehacer.
- Muestra en `docs/kit/muestra.html` y la regla de pantalla nueva en `AGENTS.md`.
- Aceptación: una experiencia de ejemplo (Mosaicos) armada con el marco nuevo cabe en las 6 tablets; toques ≥ 48 px.

## A1 · Grabado: afiche por capas · zona `grabado/`
- Capas (crear, ordenar, ocultar, activa) como eje de la pantalla.
- Colocar con vista previa: toque → vista previa → girar y mover con las manijas → confirmar.
- Tinta con escalas; mezclas rehechas; ⚡ papel blanco y hueso; ⚡ contraste de «Registro corrido».
- Tacos: nueva selección de Orgánica (inventario de `loops/public/figma/organica/` y Figma, con manifiesto).
- Marcos de la campaña (`shared/marcos.ts`, solo lectura) como capa.
- Aceptación: una persona arma un afiche de 3 capas sin ayuda; exporta por «Llévatela».

## A2 · Audioreactiva: táctil y solo demo · zona `audioreactiva/`
- ⚡ Quitar el micrófono. Selector de 5 estilos de música (según D3).
- Controles grandes para manipular con las manos en vez de la consola.
- Rehacer Túnel y Escalera; tabla por estilo de qué mueve cada banda (golpes, agudos), medida con las pistas reales.
- Aceptación: con cada estilo, todas las escenas se mueven visiblemente; nada pide permiso de micrófono.

## A3 · Graffiti · zona `graffiti/`
- ⚡ Tamaños: spray y plumón suman uno más chico (el medio pasa a grande y el fino a medio).
- ⚡ Stencil: girar; tamaño máximo relativo al lienzo. Stencil del metro nuevo (referencia: la web de las experiencias).
- ⚡ Sticker: girar, escalar y mover.
- Migrar al marco v2 (panel derecho con scroll, herramientas flotantes).

## A4 · Mosaicos · zona `taller-mosaicos/`
- ⚡ Girar y reflejar en un solo lugar: el panel derecho. ⚡ Módulos de 48 px.
- Migrar al marco v2.

## A5 · Fotomatón · zona `fotomaton/`, `shared/marcos*.ts` (único que los escribe)
- ⚡ Barra inferior solo con capturar; marcos y ajustes al panel derecho; sin reflejar ni compartir; «Restablecer».
- Placas C, M, Y, K que se apagan y prenden, visibles solo con el efecto CMYK.
- Efecto mosaico de triángulos: rehacer o reemplazar (proponer 2 opciones con captura).
- Vista previa de marcos y paletas; personaje de la vista previa (Orgánica y Pixel).
- Marcos: Diamante, Estallido (recorte), Vinilo, Ventana web, Metro, Señal (según D4). Referencia Pixel: afiche A306.

## A6 · Hora punta · zona `juego-pixel/`
- Nivel 1 en vista isométrica (dibujo nuevo; el motor del cruce se conserva).
- Sacar el nivel 3; jefe Inacapín Pixel después del andén (arte según el plan 009-juego-pixel; el mural vuelve a la
  cuadrícula de piezas y latas).
- ⚡ Controles a ambos lados: moverse a la izquierda, acciones a la derecha.
- Actualizar `docs/plans/009-juego-pixel.md` antes de construir.

## A7 · Timbre 4 y bienvenida · zona `credencial/`, `shared/juego.ts` (coordinar con A0), migración `006`
- ⚡ Opción elegida en D2 (por defecto «Tu flyer»): pantalla, timbre 4 y textos del álbum.
- ⚡ Bienvenida «Tu recorrido» después de crear la credencial; hoja para el staff en `docs/`.
- Migración `006-timbre-final.sql` (nombre del timbre y cómo se otorga). Sin editar las anteriores.
- Aceptación: recorrido completo en 390 × 844, 412 × 915 y 360 × 740 hasta el canje.

## A8 · Teatro: optimizar recursos · zona `loops/` · **solo con el visto bueno de Pipe**
- Medir peso y tiempo de carga; optimizar SVG y carga diferida. Sin cambiar el comportamiento.

## A9 · Integración y revisión · sin zona propia
- Revisa cada PR contra el plan, corre los builds y la medición de pantalla de la auditoría, y prueba el recorrido
  completo. Anota lo que falle en el PR correspondiente. No arregla en ramas ajenas.

---

## Texto para lanzar la pedida
> Lee `AGENTS.md`, `docs/plans/012-ui-de-herramienta-y-ronda-2.md` y `docs/tasks/012-ronda-2.md`. Lanza un agente por
> cada tarea de la ola indicada, cada uno en su rama `amaro/<tema>` y con su PR en borrador contra `main`, respetando
> las zonas. Al terminar la ola, que A9 revise y me dejes un resumen por PR: qué se probó, qué no y qué decisión falta.
