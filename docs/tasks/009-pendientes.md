# 009 · Tareas pendientes para el 19 nov (en orden de importancia)

Fecha: 13 nov 2026 · Fuente: plan 009 (timbres finales, juego Pixel, refinamiento) y plan 010 (cacería).
Estado de partida: la versión unida (PR de integración de Amaro) ya trae la cacería, los timbres finales, el inventario
en vivo, Graffiti v2 y el Fotomatón conectado.

## Cómo usar esta lista con varios agentes
- **Una tarea = un agente = una rama `amaro/<tema>` = un PR en borrador** (reglas de `AGENTS.md`).
- **Dos agentes nunca trabajan en la misma carpeta.** La columna «Zona» dice qué archivos toca cada tarea; las que
  comparten zona van en serie.
- **`shared/` lo toca un solo agente a la vez.** Si una tarea necesita `shared/`, se anota en su PR y las demás esperan.
- **`loops/` es de Pipe:** ningún agente lo edita salvo la tarea que él asigne.
- Cada agente termina con: `npm --prefix <app> run build` en verde, prueba de pantalla en las 6 resoluciones de tablet
  (o los 3 celulares en `credencial/`), y su PR dice qué quedó probado y qué no.
- Las tareas **H** son de una persona (Supabase, impresión, prueba en equipos reales): el agente no puede hacerlas.

## Grupos que pueden ir en paralelo
| Grupo | Tareas | Zona |
|---|---|---|
| A · Juego Pixel | ~~T1~~ (PR #18) → T2 | `index.html` y `hub-estacion/` |
| B · Grabado | T3 | `grabado/` |
| C · Audioreactiva | T4 | `audioreactiva/` |
| D · Auditoría Fotomatón y Mosaicos | T5 | `fotomaton/`, `taller-mosaicos/` |
| E · PC madre y HUB | T6 (después de T2) | `admin/`, `hub-estacion/` |
| Personas | H1 a H5 | Supabase, Figma, imprenta, equipos |

---

## P0 · Bloquean el evento (personas)

### H1 · Correr las migraciones en `somos-diseno` · **hoy**
- En el SQL Editor, **en este orden**: `shared/supabase/migraciones/001-afiches.sql`, `002-eventos-graffiti.sql`,
  `003-timbres-finales.sql`, `004-eventos-foto.sql` y `005-eventos-juego.sql` (el mural de «Hora punta» al inventario). Cada una se puede correr dos veces sin daño.
- Anotar en `shared/supabase/migraciones/README.md` (PR #10) quién y cuándo.
- Fotomatón **y el QR de todas las experiencias** (plan 011; para que el QR abra en otros celulares): correr `fotomaton/supabase/migrations/0001_fotomaton.sql` **una
  sola vez** (crea políticas sin `drop … if exists`: una segunda corrida da error, sin daño) y desplegar las funciones
  `tarjeta` y `limpiar` (`supabase functions deploy`). Sin esto el Fotomatón igual funciona: la tarjeta queda en la tablet.
- Aceptación: `select id, nombre, meta from sellos_def order by id;` muestra Inscripción 1, Creación 4, Cacería 3, Secreto 1.

### H2 · Sellos de los afiches e impresión · **14 nov**
- Sacar los secretos: `select string_agg(id || ':' || secreto || ':' || lenguaje, ',' order by id) from afiches where activo;`
- Generar los sellos (puede hacerlo un agente con esa línea): `AFICHES=… npm --prefix credencial run sellos:afiches`.
- Ponerlos en los 6 afiches en Figma con las reglas del plan 010 §2 (no redibujar la matriz, módulos que se tocan,
  ≥ 10 cm, tinta oscura sobre fondo claro).
- **Imprimir uno de prueba y leerlo** con un iPhone y un Android, con la luz de la sede, antes de imprimir los 6.

### H3 · Plan B del Secreto · **decidir el 17 nov**
- Si el jefe final no está jugable el 17, el timbre 4 se gana con el **sello secreto que muestra el staff**.
- `insert into afiches (id, nombre, lenguaje, sello) values ('SECRETO', 'Secreto', 'Pixel', 4);`, sacar su secreto y
  generar su sello (como H2). Imprimirlo en tarjetas para el staff.

### H4 · Configurar el PC madre · **antes del 18**
- PIN del canje y stock del premio (Configuración). Cuentas del staff aprobadas. Secretos VAPID si se quieren avisos.

### H5 · Prueba general · **18 nov**
- Cada tablet con su experiencia y el modo juego encendido; 3 celulares (iPhone y Android) haciendo el recorrido completo:
  crear credencial → 4 experiencias → 3 afiches → Secreto (o plan B) → canje en el PC madre.

---

## P1 · Código (agentes)

### T1 · Juego Pixel MVP (reemplaza al Vagón) · Grupo A · ✅ **hecha** (PR #18, «Hora punta»; falta probar en la tablet real)
- **13 nov, por niveles:** nivel 1 (cruce, juntas latas), nivel 2 (andén, juntas piezas), nivel 3 (la pared, mecánica
  de Puyo: pintas tu mural) y tu mural al inventario. Falta correr la migración `005` y probar en la tablet.
- Zona: carpeta nueva `juego-pixel/` (nombre definitivo a elegir), con el stack y el kit de siempre (`shared/ui/`).
- Qué: juego **original** en lenguaje Pixel que combina avanzar por carriles esquivando el tráfico en un recorrido sin
  fin y atrapar a los perseguidores en una bola que se empuja para despejar el camino. Solo las mecánicas: personajes,
  nombres y arte propios. Plan 009 §2.
- Subtareas, en orden:
  1. Scaffold copiando la estructura de `graffiti/` (Vite, `PuertaJuego`, `Tutorial` de 3 pasos, `Quiosco` a 90 s,
     `resolve.dedupe`, `paths`), script `build` y entrada en `package.json` raíz.
  2. Mecánica de carriles con figuras simples (ritmo, colisiones, puntaje). Controles táctiles: tocar avanza, deslizar
     cambia de carril, botón para lanzar.
  3. Mecánica de atrapar y empujar.
  4. Arte **generado aquí con acabado medio** (personaje, perseguidores, vehículos, calles, vías de metro), en
     `juego-pixel/public/figma/` con manifiesto `generado: true`. Se pueden reusar los stickers y el metro del Vagón.
  5. Fin de partida: tarjeta 1080 × 1350 con la franja común (personaje y puntaje), `otorgarCreacion('juego')` y
     `publicar` al inventario (sumar el tipo en `shared/datos.ts` y una migración `004` si manda imagen).
- Aceptación: se juega de punta a punta en 1180 × 820 y 768 × 1024 sin scroll, 60 fps en la tablet, la tarjeta se
  descarga y, en modo juego, suma «n de 4».

### T2 · El Vagón sale del hub · Grupo A (después de T1) · **15 nov**
- Zona: `index.html`, `hub-estacion/src/estacion/vivo.ts`, `README.md`, `AGENTS.md`.
- La tarjeta del Vagón del hub pasa a ser la del juego Pixel. El Vagón se archiva en la rama `archive/vagon`.
- HUB: los trenes siguen llegando y partiendo **sin rayados** (no dibujar el PNG de los eventos `vagon`).
- Aceptación: el hub no enlaza al Vagón; el HUB anima trenes limpios.

### T3 · Grabado con capas · Grupo B · **15 y 16 nov**
- Zona: `grabado/`.
- Capas (como un software de diseño): crear, subir, bajar, ocultar y elegir la capa activa; el orden de las capas es la
  prioridad con que se ven. Papel **color hueso** (máximo 2 opciones). Revisar las combinaciones de tinta (plan 009 §3).
- Antes, auditar la experiencia (6 resoluciones, cada herramienta, exportar, modo juego) y anotar hallazgos en
  `docs/plans/009-refinamiento/grabado.md`.
- Aceptación: una persona entiende las capas sin explicación (tutorial de 3 pasos lo enseña); sin scroll; exporta.

### T4 · Audioreactiva que reacciona de verdad · Grupo C · **15 y 16 nov**
- Zona: `audioreactiva/`.
- Medir cada escena con micrófono (voz, aplausos, música) y ajustar sensibilidad, suavizado y qué banda mueve qué.
  Las escenas que casi no responden se corrigen o se quitan.
- Hallazgos en `docs/plans/009-refinamiento/audioreactiva.md`.
- Aceptación: con música ambiente en la sala, todas las escenas se mueven visiblemente con el ritmo.

### T5 · Auditoría y arreglos de Fotomatón y Mosaicos · Grupo D · **16 nov**
- Zona: `fotomaton/`, `taller-mosaicos/`.
- Auditoría como la del Teatro (PR #12): 6 resoluciones, cada herramienta, exportar, modo juego, inventario. Arreglar lo
  grave; lo demás queda anotado en `docs/plans/009-refinamiento/`.
- Fotomatón: ya funciona como el resto (tutorial del kit, «Llévatela» encima, tarjeta al inventario; PR del 13 nov).
  Falta confirmar con Supabase real el paso de Creación y que, sin el bucket, la tarjeta queda en la tablet.

### T6 · Auditoría del PC madre y del HUB · Grupo E (después de T2) · **16 y 17 nov**
- Zona: `admin/`, `hub-estacion/`.
- PC madre: Creación n/4 y Cacería n/3 con datos reales; canje con los 4 timbres; plan B del Secreto visible.
- HUB: rendimiento en la pantalla flip y los Mac; Realtime en vez de polling si alcanza.

### T7 · Teatro con el código compartido nuevo · Pipe · **cuando Pipe lo indique**
- Zona: `loops/` (solo Pipe o el agente que él asigne).
- Recompilar `loops/dist` con el `shared/` nuevo: el Teatro suma su paso con su nombre. Tareas de su auditoría (PR #12).

### T8 · Graffiti en la tablet real · **16 nov**
- Probar spray continuo y goteo con la pared grande en la tablet; decidir con el equipo si el rodillo se queda.

---

## P2 · Después del refinamiento

### T9 · Jefe final (Inacapino) · **solo si hay tiempo antes del 17**
- Plan propio (`docs/plans/011-jefe-final.md`) antes de construir: versión de Inacapino, cuándo se desbloquea, cómo se
  esquiva con el dedo (referencias de la nota de Figma del 10 nov), y que otorgue el timbre 4.
- Si el 17 no está jugable, H3.

### T10 · Llevar a Figma el arte generado
- Juego Pixel, muros nuevos de Graffiti y sellos de la cacería: llevarlos al archivo de la campaña para que el equipo
  los afine o reemplace.
