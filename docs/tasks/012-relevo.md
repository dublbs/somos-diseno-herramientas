# 012 · Relevo: cómo retomar la ronda 2 si se corta

Para quien continúe (el agente de Felipe/Pipe u otro colaborador). Con este archivo, el plan
[`012`](../plans/012-ui-de-herramienta-y-ronda-2.md), la [investigación](../plans/012-ui-herramientas/investigacion.md) y la
[pedida](012-ronda-2.md) alcanza para seguir **sin la conversación original**. Evento: **19 nov 2026**.

## 1. Lo primero: ver en qué quedó cada rama
```bash
git fetch origin
for b in kit-v2 audioreactiva-tactil fotomaton-ronda-2 hora-punta-iso flyer-timbre-4 teatro-ronda-2 grabado-afiche graffiti-ronda-2 ronda-2-integracion; do
  git rev-parse -q --verify origin/amaro/$b >/dev/null \
    && echo "$b: $(git rev-list --count origin/main..origin/amaro/$b) commits · $(git log -1 --format='%cd %s' --date=format:'%d-%m %H:%M' origin/amaro/$b)" \
    || echo "$b: no existe todavía"
done
```
- Cada agente deja en su zona un **`AVANCE.md`** (qué está hecho, qué falta, en qué orden) mientras trabaja y lo borra en
  su último commit. **Si la rama tiene `AVANCE.md`, está a medias:** se retoma desde ahí.
- Si la rama no existe, se parte de cero con su encargo (§4).
- Estado al escribir esto (17 nov, 03:20 UTC): los 6 agentes de la ola 0 estaban corriendo y **ninguna rama estaba
  subida todavía**.

## 2. Estado de `main` y PR abiertos (17 nov)
| PR | Qué es | Qué hacer |
|---|---|---|
| [#25](https://github.com/dublbs/somos-diseno-herramientas/pull/25) | Lleva a `main` lo que faltó: jugar sin credencial, «Llévatela» con QR y la auditoría (los #20 y #21 no llegaron) | **Mergear primero.** Sin conflictos. Todas las ramas de la ronda ya lo traen unido |
| [#24](https://github.com/dublbs/somos-diseno-herramientas/pull/24) | Plan 012, investigación, pedida y este relevo (solo docs) | Mergear cuando se quiera |
| #15, #16 | Ya entraron con el #17 | Cerrar |
| #12, #10 | De Pipe (Teatro y docs) | Son suyos |

## 3. Orden de trabajo
| Ola | Rama | Agente | Base | Depende de |
|---|---|---|---|---|
| 0 | `amaro/kit-v2` | A0 · kit v2 + Mosaicos | `main` + `origin/amaro/juego-pixel` | — |
| 0 | `amaro/audioreactiva-tactil` | A2 · música y escenas | ídem | — |
| 0 | `amaro/fotomaton-ronda-2` | A5 · marcos y efectos | ídem | — |
| 0 | `amaro/hora-punta-iso` | A6 · isométrico y jefe | ídem | — |
| 0 | `amaro/flyer-timbre-4` | A7 · flyer, timbre 4, bienvenida | ídem | — |
| 0 | `amaro/teatro-ronda-2` | A8 · Teatro | ídem | — |
| 1 | `amaro/grabado-afiche` | A1 · Grabado por capas | `amaro/kit-v2` | A0 terminado |
| 1 | `amaro/graffiti-ronda-2` | A3 · Graffiti | `amaro/kit-v2` | A0 terminado |
| 1 | (mismas ramas de A2 y A5) | pasar su pantalla al marco v2 | unir `amaro/kit-v2` | A0 terminado |
| 2 | `amaro/ronda-2-integracion` | Integración | `main` | todo lo anterior |

**Si el tiempo no alcanza**, prioridad para el 19: **A7** (sin él no hay timbre 4) → **#25** → arreglos acotados de A3 y A5
(marcados ⚡ en la pedida) → A2 → A0 y A1 → A6 → A8. Cada rama es independiente: lo que no esté estable **no se integra**.

## 4. Encargos (texto para lanzar a cada agente)
**Preámbulo común** (va antes de cada encargo):
> Trabajas en el repo `dublbs/somos-diseno-herramientas`. `git fetch origin`. Lee `AGENTS.md`,
> `docs/plans/012-ui-de-herramienta-y-ronda-2.md`, `docs/plans/012-ui-herramientas/investigacion.md` y
> `docs/tasks/012-ronda-2.md` (si no están en tu rama: `git show origin/amaro/plan-012-ui-herramientas:<ruta>`). El plan 012
> manda sobre `AGENTS.md` donde chocan (el panel lateral puede tener scroll; la página y el lienzo no). Sigue la «Guía
> común para agentes» de la pedida. Tu rama parte de `origin/main` con `origin/amaro/juego-pixel` unida (si el #25 ya
> está en `main`, basta `main`). Si tu rama ya existe en `origin`, continúa desde ella y lee su `AVANCE.md`. Empuja seguido
> (cada trozo que compile) y mantén `AVANCE.md` en tu zona; bórralo en el último commit. No abras PR ni mergees. No
> toques archivos fuera de tu zona. Mira tus capturas antes de dar algo por bueno. Informe final: commits, qué probaste
> con números, qué no, decisiones abiertas.

### A0 · Kit v2 + Mosaicos · `amaro/kit-v2` · zona `shared/ui/`, `docs/kit/`, `AGENTS.md`, `taller-mosaicos/`
- Kit **nuevo junto al actual** (el actual no cambia de API; todas las apps deben seguir compilando). Recrea los patrones
  de Figma UI3 y Affinity, no su marca.
- Tokens `--h-*` bajo `html[data-ui="v2"]` con los valores neutros de la guía común; listo para que la etapa 2 cambie
  solo tokens por `data-visual`.
- Plantilla `MarcoHerramienta`: barra superior delgada, lienzo, **barra de herramientas flotante** abajo al centro,
  **panel derecho (~300 px) con scroll propio**; en vertical el panel pasa abajo con alto fijo.
- Piezas: Botón, BotónÍcono, Segmento, Deslizador, Interruptor, Muestra, **selector de color con escalas**, SecciónPanel,
  FilaPropiedad, GrillaBiblioteca (≥ 48 px), **ListaCapas** (ojo siempre visible, miniatura, subir/bajar, activa, + capa,
  borrar), BarritaSelección (✓ ✕, girar, traer adelante, borrar) y **manijas de transformación** genéricas sobre un
  canvas (mover, girar, escalar, también con dos dedos; límites relativos al lienzo). Gestos: 2 dedos deshace, 3 rehace.
- Diálogos existentes (`Tutorial`, `Quiosco`, `Confirmar`, `PuertaJuego`, `Llevatela`): misma API; aspecto neutro por CSS
  si se puede.
- Íconos que falten: sumar al subconjunto (`shared/fonts/README.md`) o, si la red lo bloquea, SVG en línea propios.
- **`shared/ui/README.md`** con la API y cómo migra una app (lo leen A1, A2, A3 y A5). Muestra en `docs/kit/` y regla de
  pantalla nueva en `AGENTS.md`.
- **Mosaicos migrado** como referencia: herramientas en la barra flotante; girar y reflejar del módulo **solo en el panel
  derecho**; módulos ≥ 48 px; sin perder funciones.
- Verificar: `tsc` en las 11 apps; Mosaicos en las 6 tablets con cada herramienta; `dist/` solo de Mosaicos.

### A1 · Grabado: «haz un afiche por capas» · `amaro/grabado-afiche` (base `amaro/kit-v2`) · zona `grabado/`
- Leer `shared/ui/README.md` y migrar al marco v2. Leer `docs/plans/009-refinamiento/grabado.md`.
- **Capas** como eje (panel de capas del kit): crear, ordenar, ocultar, activa, borrar; máximo 5. Cada estampa vive en
  una capa; el orden de las capas es el orden en que se ven. Deshacer y rehacer cubren todo.
- **Colocar con vista previa:** un toque en el papel elige el lugar → aparece el taco en vista previa ahí, con las
  manijas del kit → se gira, mueve y cambia de tamaño → ✓ estampa, ✕ cancela. Sin estampar al primer toque.
- **Tinta con escalas:** la paleta Línea azul, cada color con 3–5 pasos de claro a oscuro (selector del kit).
- **Mezclas:** fuera el panel «Mezclas con…». La mezcla se ve sola donde dos tintas se cruzan (multiplicar), con un
  interruptor por capa «Se mezcla / Tapa» y una línea que lo explique.
- **Papel:** solo **blanco** y **hueso**. **Marcos de la campaña** (`shared/marcos.ts`, solo lectura) como capa de marco
  opcional del afiche.
- **Tacos:** nueva selección de la familia Orgánica entre `loops/public/figma/organica/` y lo ya copiado en
  `grabado/public/figma/organica/` (12–16 piezas que se lean bien como taco: animales, plantas, objetos), con manifiesto.
  Miniaturas grandes y nítidas (hoy Araucaria y Sol casi no se ven).
- **Arreglos:** texto de «Registro corrido» sin contraste; botones de tamaño que cortan su texto; papel vacío con pista.
- Tutorial de 3 pasos nuevo (taco y lugar → gira y confirma → ordena tus capas). Exporta por «Llévatela»; modo juego,
  inventario (`publicar('grabado')`) y quiosco siguen igual.
- Verificar: 6 tablets con cada herramienta; flujo colocar → ajustar → confirmar; 3 capas reordenadas y ocultas cambian
  el resultado exportado; `dist/` solo de Grabado.

### A2 · Audioreactiva · `amaro/audioreactiva-tactil` · zona `audioreactiva/`
- **Sin micrófono** (nada de `getUserMedia`).
- **5 estilos de música generados con Web Audio**, sin archivos ni dependencias: Lo-Fi Hip Hop, Synthwave, Button Mash
  (chiptune), It's Friday (funk/disco), Acoustic Ambient. Secuenciador en bucle con pistas separadas (batería, bajo,
  acordes, melodía), reloj de `AudioContext`, limitador, volumen parejo. Composiciones originales.
- La reacción usa el analizador **y** los eventos exactos del secuenciador (bombo, caja, notas).
- **Táctil en vez de consola:** 5 botones de estilo; pads grandes para prender y apagar pistas (cambia sonido e imagen);
  pad XY o arrastre sobre la escena (filtro/eco + giro/zoom/color); tempo; pads de golpe.
- **Escenas:** rehacer Túnel, mejorar Escalera, revisar las otras 3. Tabla escena × estilo con medición en
  `docs/plans/009-refinamiento/audioreactiva.md`.
- Foto y loop por «Llévatela»; si se puede, el video con audio. Después de A0: pasar la pantalla al marco v2.
- Verificar: 6 tablets; con cada estilo suena (energía > 0 sin saturar) y cada escena se mueve; `dist/` solo de la app.
  **Nadie la ha escuchado:** una persona debe oír los 5 estilos antes del evento.

### A3 · Graffiti · `amaro/graffiti-ronda-2` (base `amaro/kit-v2`) · zona `graffiti/`
- Leer `shared/ui/README.md` y migrar al marco v2 (herramientas flotantes; opciones del pincel, muros y colores en el
  panel derecho con scroll). Leer `docs/plans/009-refinamiento/graffiti.md`. Borrar `components/ModalExportar.tsx` si
  quedó sin uso.
- **Tamaños:** spray y plumón pasan a 4 pasos: uno nuevo más chico, el actual «fino» se llama «medio», el actual «medio»
  se llama «grande», y el «grueso» actual queda como el mayor. El rodillo no cambia.
- **Stencil:** se **gira** (manijas del kit); tamaño máximo menor, relativo al lienzo (que nunca tape más de ~60 % del
  alto). **Stencil del metro nuevo**, a partir de `juego-pixel/public/figma/metro-lateral.svg` (el vagón de la web).
- **Sticker:** al ponerlo queda seleccionado con manijas: mover, girar y escalar; ✓ lo pega.
- Colores ≥ 48 px; ayuda corta en la barra superior. Borrar queda igual.
- Verificar: 6 tablets con cada herramienta; girar y escalar stencil y sticker; los 4 tamaños dejan marcas distintas;
  «Llévatela», modo juego e inventario; `dist/` solo de Graffiti.

### A5 · Fotomatón · `amaro/fotomaton-ronda-2` · zona `fotomaton/`, `shared/marcos*.ts`, generadores en `scripts/`
- **Placas C, M, Y, K** que se apagan y prenden, visibles solo con el efecto CMYK.
- **Efecto de triángulos:** rehacer o reemplazar por otro Geométrico que se vea bien con caras.
- **Marcos (arte generado aquí, acabado final, con manifiesto):** Diamante (rediseñar, cambiar flores), Estallido (el
  tercer círculo recorta las figuras negras), Vinilo (el disco ocupa todo; la foto es la etiqueta), Ventana web (que se
  note: pestañas, botones, barra de dirección, cursor), Metro y Señal (expandida y con stickers). Referencia Pixel:
  `juego-pixel/public/figma/metro-lateral.svg`, `credencial/public/figma/afiches/af05.webp` y `af06.webp`.
  Sin editar a mano `shared/marcos-figma.ts`: datos nuevos en `shared/marcos-generados.ts` con prioridad.
- **Vista previa** de marcos y paletas más clara; mejor figura de muestra en Orgánica y Pixel.
- **Barra:** abajo solo el disparador («Foto»); todo lo demás al panel derecho con scroll; sin reflejar ni compartir;
  «Inicio» → «Restablecer». Después de A0: pasar la pantalla al marco v2.
- `credencial` usa los mismos marcos: debe compilar (`tsc`); su `dist/` se recompila en la integración.
- Verificar: cámara falsa de Playwright, 6 tablets, cada marco exportado y mirado; `dist/` solo de Fotomatón.

### A6 · Hora punta · `amaro/hora-punta-iso` · zona `juego-pixel/`, `docs/plans/009-juego-pixel.md` y su manifiesto
- Actualizar primero el plan 009-juego-pixel.
- **Nivel 1 isométrico** (vista 3/4 con volumen; el motor `cruce.ts` se conserva, cambia el dibujo), en el estilo Pixel
  de la campaña y con acabado final.
- **Fuera el nivel 3** (`pared.ts`, `dibujoPared.ts`). El mural vuelve a la cuadrícula de piezas y latas, más un trofeo.
- **Jefe: el Inacapín Pixel**, después del andén: está gris; se le hacen rodar bolas de pintura y cada golpe le devuelve
  un color (5–6 golpes, 2–3 fases); se gana en 60–90 s. Buscarlo en Figma (máx. 3 llamadas); si no aparece, personaje
  propio **sin el logo de INACAP**, marcado «a validar por el equipo».
- **Controles a ambos lados:** cruceta abajo a la izquierda, acciones abajo a la derecha, ≥ 64 px, multitáctil. Juego a
  pantalla casi completa con HUD.
- Verificar: pruebas de motor en Node, partida completa en Playwright, 6 tablets, ≥ 55 cuadros por segundo; `dist/`.

### A7 · «Tu flyer», timbre 4 y bienvenida · `amaro/flyer-timbre-4` · zona `credencial/`, `shared/juego.ts`, migración 006, `docs/staff/`
- Especificación: plan 012 **§8**. Tarjeta «Tu flyer» en la vista Juego (bloqueada dice qué falta; se abre con ≥ 1
  creación y ≥ 1 afiche) → `#/flyer`: lenguaje → tus piezas con **«Mezclar»** → una de 6 frases → PNG 1080 × 1350 con la
  franja común → «Guardar mi flyer» otorga el timbre 4 una vez.
- `shared/supabase/migraciones/006-timbre-flyer.sql` (idempotente; no editar las anteriores): el timbre 4 se llama
  «Flyer»; `sellar_flyer(p_codigo)` lo otorga solo con ≥ 1 paso de Creación y ≥ 1 afiche. Probar en Postgres local.
- `shared/juego.ts`: estación 4 «Flyer» / «Arma tu flyer». El sello del staff (respaldo E) sigue funcionando.
- **Bienvenida «Tu recorrido»** (3 tarjetas, una vez, se puede volver a ver) y línea «Te faltan: …» en la vista Juego.
- `docs/staff/guion-del-recorrido.md` (una página). Sumar la 006 a la tarea H1 de `docs/tasks/009-pendientes.md`.
- Verificar: 390×844, 412×915 y 360×740, recorrido completo; mirar un flyer por lenguaje; `dist/` solo de credencial.

### A8 · Teatro de Papel · `amaro/teatro-ronda-2` · zona `loops/` (autorizado por Amaro el 17 nov)
- Leer antes el plan 008 de Pipe (`git show origin/pipe/plan-teatro:docs/plans/008-teatro-auditoria.md` y
  `docs/tasks/008-teatro.md`); no contradecirlo sin anotarlo.
- Feedback del plan 012 §4: **estado de carga** y optimización medida; textos que se salen; **aleteo de la paloma** para
  el cóndor; **panel derecho con scroll**; voltear sí, duplicar y copiar/pegar no; **tamaños relativos al escenario**;
  **≥ 3 estados por animal** (pudú es el patrón); huemul refinado (se ve enojado); guanaco mejorado con 3 animaciones;
  reemplazar la flor; **selector de color** (pez). Arte derivado de los SVG existentes, con manifiesto.
- No romper línea de tiempo, exportación ni modo juego. Usa el kit actual (no el v2).
- Verificar: 6 tablets, una escena armada por escenario, tiempos de carga antes y después; `dist/` solo de loops.

## 5. Integración (ola 2)
1. Rama `amaro/ronda-2-integracion` desde `main` (con el #25 adentro). Unir, en este orden: `kit-v2`, `grabado-afiche`,
   `graffiti-ronda-2`, `audioreactiva-tactil`, `fotomaton-ronda-2`, `hora-punta-iso`, `flyer-timbre-4`, `teatro-ronda-2`.
   Los conflictos esperables son solo de `dist/` (se resuelven recompilando) y de `shared/juego.ts` o `AGENTS.md`.
2. `npx tsc --noEmit` en las 11 apps.
3. **Recompilar `dist/` de todas** las que cambiaron, **incluida `credencial`** (por los marcos de A5), con el
   `.env.local` de cada app (configuración pública de Supabase; ignorado por git).
4. Medición de pantalla en las 6 tablets con cada herramienta (base: el guion de la auditoría, descrito en
   `docs/plans/009-refinamiento/README.md`) y la credencial en 3 celulares.
5. Recorrido completo en modo demo: credencial → bienvenida → 4 creaciones → 3 afiches → flyer → 4 timbres.
6. Un solo PR a `main`, con lo probado y lo no probado. El merge lo hace Amaro o Pipe.

## 6. Lo que solo puede hacer una persona (bloquea el evento)
- **Supabase:** correr las migraciones `001` a `006` en orden; `fotomaton/supabase/migrations/0001_fotomaton.sql` una sola
  vez y desplegar las funciones `tarjeta` y `limpiar`. Sin esto no sellan los afiches ni el flyer, y el QR solo abre en
  la tablet.
- **Respaldo del timbre 4:** `insert into afiches (id, nombre, lenguaje, sello) values ('SECRETO', 'Flyer', 'Pixel', 4);`,
  sacar su secreto y generar el sello (`npm --prefix credencial run sellos:afiches`). Imprimirlo para el staff.
- **Afiches de la cacería** impresos con su sello y probados con un iPhone y un Android.
- **Escuchar** los 5 estilos de música, **validar** el Inacapín y **probar en las tablets reales**.
