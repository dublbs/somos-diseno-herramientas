# 012 · Pedida multi-agente: UI de herramienta y ronda 2

Plan: [`docs/plans/012-ui-de-herramienta-y-ronda-2.md`](../plans/012-ui-de-herramienta-y-ronda-2.md). Decisiones cerradas el
17 nov: **en ejecución**. Cada agente lee primero `AGENTS.md`, el plan 012, la investigación y la guía común de abajo.

## Reglas para todos los agentes
- Un agente = una zona = una rama `amaro/<tema>` = un PR en borrador contra `main`. Nadie mergea.
- **`shared/` lo escribe un solo agente (A0).** Los demás lo usan; si les falta algo, lo piden en su PR y esperan.
- `loops/` solo lo toca A8, y solo con el visto bueno de Pipe.
- Antes de terminar: `npm --prefix <app> run build` en verde, la medición de pantalla en las 6 tablets con cada
  herramienta activa, `dist/` recompilado solo de su app, y el PR dice qué probó y qué no.
- Si algo es ambiguo o choca con un plan, se anota en la tarea y se detiene.

## Olas (como se ejecuta)
| Ola | Agentes | Base |
|---|---|---|
| 0 | **A0** kit v2 + Mosaicos (referencia) · **A2** Audioreactiva (música y escenas) · **A5** Fotomatón (arte y efectos) · **A6** Hora punta · **A7** flyer y bienvenida | `main` |
| 1 | **A1** Grabado · **A3** Graffiti · y A2 y A5 migran su pantalla al marco v2 | rama de A0 |
| 2 | Integración: una rama unida con todos los `dist/` recompilados y un solo PR a `main` | — |

Teatro (`loops/`) lo hace A8, autorizado por Amaro el 17 nov. Mosaicos (antes A4) lo hace A0 como experiencia de referencia.

## Guía común para agentes
- **Rama:** `amaro/<tema>` desde la base indicada. Commits convencionales en español, con las líneas de atribución que
  indique quien lanza. **Empujar la rama; no abrir PR, no mergear, no tocar `main`.**
- **Zona:** solo los archivos de tu zona. `shared/ui/` es de A0; `shared/marcos*.ts` de A5; `shared/juego.ts`,
  `shared/datos.ts` y las migraciones de A7. Si necesitas algo fuera de tu zona, anótalo en tu informe final.
- **Tokens neutros (etapa 1)**, por si tu pantalla se adelanta al kit: fondo del área de lienzo `#E9E9E7`, superficie
  `#FFFFFF`, superficie 2 `#F5F5F4`, borde `#D4D4D2`, texto `#1A1A1A`, texto 2 `#6B6B69`, acento `#0062B8`, sobre
  acento `#FFFFFF`, peligro `#C62828`, radio 10 px, toque 48 px, sombra flotante `0 4px 16px rgba(0,0,0,.14)`, DM Sans.
- **Instalar:** el árbol de trabajo no trae `node_modules`: `npm ci` dentro de tu app.
- **Probar (modo demo):** `VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx vite build --outDir <tmp>/<app>/dist
  --emptyOutDir` y servir `<tmp>` con `python3 -m http.server <tu puerto>`; la app queda en `/<app>/dist/` (las apps
  redirigen a `/dist/`). Playwright y Chromium ya están instalados (`require('playwright')`). El tutorial se salta con
  `sessionStorage['sd:tutorial:<clave>']='1'`.
- **Pantalla:** sin scroll de página ni controles fuera de vista en 1024×768, 1180×820, 1280×720, 1366×768, 768×1024 y
  820×1180, con cada herramienta activa; toques ≥ 44 px (48 en lo nuevo). Scroll solo en el panel lateral. Mira tus
  capturas antes de dar algo por bueno.
- **`dist/` de producción, al final y solo de tu app:** copia `<app>/.env.local` desde el checkout principal
  (`/home/user/somos-diseno-herramientas/<app>/.env.local`; está ignorado por git, nunca se sube), corre
  `npm run build` y confirma que el bundle nombra el proyecto de Supabase (`grep -l supabase.co dist/assets/*.js`).
- **Arte:** generado aquí con el mejor acabado posible, en la paleta Línea azul, con su entrada en un manifiesto
  (`generado: true`). Referencias Pixel: `juego-pixel/public/figma/metro-lateral.svg` (el vagón de la web) y los afiches
  `credencial/public/figma/afiches/af05.webp` (Metro) y `af06.webp` (Ven a jugar, con los arcades).
- **Textos:** español de Chile, cortos, que suenen escritos por una persona.
- **Informe final:** rama y commits, qué probaste (con números), qué no, y qué decisión queda abierta.

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

## A4 · Mosaicos · zona `taller-mosaicos/` · **lo hace A0**
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
- «Tu flyer» según el plan §8: pantalla, timbre 4 y textos del álbum.
- ⚡ Bienvenida «Tu recorrido» después de crear la credencial; hoja para el staff en `docs/`.
- Migración `006-timbre-flyer.sql` (nombre del timbre y `sellar_flyer`). Sin editar las anteriores.
- Aceptación: recorrido completo en 390 × 844, 412 × 915 y 360 × 740 hasta el canje.

## A8 · Teatro de Papel · zona `loops/` · autorizado por Amaro (17 nov)
- Feedback del plan 012 §4 «Teatro de Papel»: estado de carga, textos que se salen, alas de las aves, panel derecho con
  scroll, voltear sí y duplicar/copiar/pegar no, tamaños relativos al escenario, 3 estados por animal, huemul y guanaco,
  reemplazar la flor, selector de color, optimizar.
- Leer antes el plan 008 de Pipe (`origin/pipe/plan-teatro`) y no contradecirlo sin anotarlo.

## A9 · Integración y revisión · sin zona propia
- Revisa cada PR contra el plan, corre los builds y la medición de pantalla de la auditoría, y prueba el recorrido
  completo. Anota lo que falle en el PR correspondiente. No arregla en ramas ajenas.

---

## Texto para lanzar la pedida
> Lee `AGENTS.md`, `docs/plans/012-ui-de-herramienta-y-ronda-2.md` y `docs/tasks/012-ronda-2.md`. Lanza un agente por
> cada tarea de la ola indicada, cada uno en su rama `amaro/<tema>` y con su PR en borrador contra `main`, respetando
> las zonas. Al terminar la ola, que A9 revise y me dejes un resumen por PR: qué se probó, qué no y qué decisión falta.
