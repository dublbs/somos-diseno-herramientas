# Esta noche y mañana: todo el feedback F-002 y F-003 antes de abrir (10:00)

**Decisión de Amaro (19 nov):** entra **todo** el feedback de F-002 (experiencias) y F-003 (credencial y HUB). Solo
queda fuera la app instalable (T-004). Los scripts e informes (T-001, T-002, T-003, B-001, B-003, B-004) son para
después.

**Plan:**
- **Felipe empieza esta noche** con la lista completa, porque tiene más créditos.
- **Mañana a las 8:00, Thomas y Basti toman lo que Felipe no alcanzó a empezar.**
- **A las 9:30 se congela.** Lo que no esté mergeado y probado a esa hora no entra.

## Cómo se sabe qué está tomado: el título del PR
- **Todo PR empieza con el ID de la tarea**: `B-011 · Marco Metro sin limpiaparabrisas`. Si junta varias, van todas:
  `B-011 B-014 · …`.
- La tarea está **tomada** si hay un PR abierto (borrador o no) con su ID, y **hecha** si el PR está mergeado.
- El PR se abre **como borrador apenas se empieza** la tarea, no al final. Así nadie toma lo mismo.
- No hace falta editar las colas para marcar el estado: el estado vive en los PR. Mañana, para ver qué queda:
  ```bash
  git fetch origin && git log origin/main --oneline | grep -oE "[TBP]-0[0-9]{2}" | sort -u   # mergeadas
  ```
  Y en GitHub: la lista de PR abiertos.

## Esta noche
**Amaro o Felipe, antes de lanzar al agente:**
1. Mergear **#55**. Trae este plan y además junta:
   - #54 (Cabina de fotos);
   - la rama `amaro/ronda-3b` (Chas de Audioreactiva, obras de la Mezanina, «Mezanina»);
   - la pauta de la prueba en grupo.
   Es B-002 hecho, salvo `claude/escaner-afiches`, que ya está en `main`.
2. Correr las migraciones **008, 009, 010 y 011** en el SQL Editor de `somos-diseno` y anotarlas en
   `shared/supabase/migraciones/README.md` (E-003).
3. Felipe lanza su agente con el prompt de abajo.

**Felipe, orden de la lista.** Lo más visible y seguro va primero, para que si la noche no alcanza, lo hecho sea lo que
más se nota.

| # | Tareas | App | Por qué en este orden |
|---|---|---|---|
| 1 | B-015, B-011, B-012, B-014 | `credencial/`, `shared/marcos*` | Cambios chicos y visibles en el celular de todos |
| 2 | T-005, T-007 | `index.html`, `taller-mosaicos/` | El inicio lo ve todo el mundo |
| 3 | B-006, B-007, B-010 | `juego-pixel/` | Hora punta: tutorial, sprites y HUD |
| 4 | P-005, P-002, P-001, P-003, P-004 | `hub-estacion/` | HUB (cola: `felipe.md`) |
| 5 | T-008 | `loops/` | Teatro completo |
| 6 | B-013, B-016, B-017 | `credencial/` | Círculo de la foto, vista previa del flyer, deslizar para jugar |
| 7 | T-012, T-009, T-011, T-010 | `fotomaton/`, `graffiti/`, `grabado/`, `audioreactiva/` | Cabina, Graffiti, Grabado y Audioreactiva |
| 8 | B-008, B-009 | `juego-pixel/` | Andén y llegada del Inacapín, y su caminata |
| 9 | T-006 | `index.html` | Vista previa de Hora punta: va al final porque depende de 3 y 8 |

- **Multiagente:** el agente de Felipe puede usar **hasta 3 subagentes a la vez, cada uno en una app distinta**. Por
  ejemplo: credencial, Hora punta y HUB. Al terminar uno, ese subagente toma el siguiente grupo de la tabla cuya app no
  esté ocupada.
  - Nunca dos subagentes en la misma app.
  - `shared/marcos*` lo tocan B-011, B-014 y T-012: se hacen en ese orden, uno a la vez.
- **Un PR por tarea** (o por grupo chico de la misma app), con el ID en el título y la rama `pipe/<tema>`.
- **T-012:** antes de construir el marco de calle, el agente propone 2 opciones en el PR borrador y espera que Amaro
  elija. Mientras tanto, sigue con otra tarea.
- **Mergear de noche:** Felipe o Amaro mergean lo que esté listo y probado (build en verde, verificación de pantalla y
  prueba de humo local sin errores). Si queda la duda, se deja abierto para que Amaro lo pruebe en la tablet a las 8.

## Mañana
| Hora | Thomas | Basti | Amaro | Felipe |
|---|---|---|---|---|
| 8:00 | Toma las tareas de **su carril** (`thomas.md`: experiencias de tablet e inicio) que no tengan PR, en el orden de la tabla de Felipe | Toma las tareas de **su carril** (`basti.md`: credencial y Hora punta) que no tengan PR, en el mismo orden | Prende las tablets, el HUB y el PC madre. Prueba lo que se mergeó de noche | Sigue con sus PR abiertos y revisa |
| 8:00–9:30 | Un PR por tarea, con el ID en el título | Igual | Prueba cada PR en la tablet, el celular y el HUB, y mergea | Mergea con Amaro |
| 9:30 | Congelado | Congelado | Ronda final: cada experiencia, un timbre, «Llévatela» y canje | Congelado |

- **Los PR que Felipe dejó abiertos a medias no se tocan sin preguntarle.** Si a las 8:30 no hay avance, Felipe puede
  soltar la tarea: cierra el PR y avisa.
- **Las tareas del HUB (P-001…P-005) y del Teatro (T-008)** siguen siendo de Felipe mañana. Si las suelta, las toma
  Basti (HUB) o Thomas (Teatro).

## Reglas
- Cada PR se prueba en una tablet real con la URL publicada. **Si algo se ve raro, no se mergea.** GitHub Pages tarda
  1–2 min después de cada merge.
- **`.env.local`:** Amaro o Felipe se lo pasan **por privado** a Thomas y a Basti esta noche. Sin ese archivo, el
  `dist/` sale sin Supabase. Nunca va al repo ni a un chat de grupo.
- **`dist/` al final de cada PR**, solo de la app tocada. Si hay conflicto en `dist/`, se resuelve recompilando.

## Si a las 9:00 algo grande va atrasado
Los cambios grandes ya vienen partidos en trozos que funcionan solos. Se mergea el trozo que está listo y el resto
queda para después:
- **B-008:** primero el cambio de color del escenario, después la escena de llegada y al final el andén.
- **B-010:** primero la lata con número y los puntos legibles, al final los controles nuevos.
- **B-017:** primero la barra de progreso y el indicador de deslizar, al final las animaciones.
- **P-002 y P-001:** primero el metro nuevo sin puertas visibles, después los detalles.
- **P-003:** si los cuerpos nuevos no están, quedan los de hoy.
- **T-010:** si recortar la exportación no está probado, no se mergea.
- **T-012:** si el marco nuevo no está, se quita la pizarra igual.

## Prompts
**Felipe (esta noche)**
```text
Soy Felipe. Repo dublbs/somos-diseno-herramientas. Mañana abre la actividad a las 10:00 y hoy en la noche avanzo yo
con la mayor parte. Haz git fetch origin y lee AGENTS.md, docs/equipo/README.md, docs/equipo/manana.md («Esta noche»),
docs/equipo/bitacora.md (F-002, F-003, D-002), docs/equipo/thomas.md, docs/equipo/basti.md, docs/equipo/felipe.md y
docs/equipo/referencias/README.md. Haz las tareas en el orden de la tabla «Felipe, orden de la lista», con hasta 3
subagentes a la vez, cada uno en una app distinta (nunca dos en la misma). Cada tarea: rama pipe/<tema> desde
origin/main, PR borrador apenas empieces con el ID en el título (ej. «B-011 · Marco Metro sin limpiaparabrisas»),
verificación de pantalla (6 resoluciones en tablet; 390×844, 412×915 y 360×740 en la credencial; 1920×1080 en el
HUB), capturas antes y después en el PR, dist de producción con el .env.local de la app, y el PR pasa a «listo» con
qué se probó y qué no. En T-012 propón 2 opciones y espera a Amaro mientras sigues con otra. Para el HUB tienes permiso
de crear assets nuevos (D-002). Si algo grande no alcanza, entrega el trozo que funciona según «Si a las 9:00 algo
grande va atrasado». No mergees tú: avísame qué PR está listo. Al final dame la lista de IDs: listos, a medias y sin
empezar.
```
**Thomas (mañana, 8:00)**
```text
Soy Thomas. Repo dublbs/somos-diseno-herramientas. La actividad abre a las 10:00 y a las 9:30 se congela. Haz git fetch
origin y lee AGENTS.md, docs/equipo/README.md, docs/equipo/manana.md («Mañana») y docs/equipo/thomas.md. Mira los PR
abiertos y mergeados de GitHub: una tarea está tomada si algún PR tiene su ID en el título. Toma las tareas de mi
carril (thomas.md) que nadie haya tomado, en el orden de la tabla de manana.md, con hasta 2 subagentes en apps
distintas: rama thomas/<tema>, PR borrador con el ID en el título apenas empieces, verificación en las 6
resoluciones, dist de producción con el .env.local que te paso. No toques PR abiertos de otra persona. Avísame apenas
cada PR esté listo para probarlo en la tablet. Si algo grande no alcanza, entrega el trozo que funciona. A las 9:30 te
detienes.
```
**Basti (mañana, 8:00)**
```text
Soy Basti. Repo dublbs/somos-diseno-herramientas. La actividad abre a las 10:00 y a las 9:30 se congela. Haz git fetch
origin y lee AGENTS.md, docs/equipo/README.md, docs/equipo/manana.md («Mañana») y docs/equipo/basti.md. Mira los PR
abiertos y mergeados de GitHub: una tarea está tomada si algún PR tiene su ID en el título. Toma las tareas de mi
carril (basti.md: credencial y Hora punta) que nadie haya tomado, en el orden de la tabla de manana.md, con hasta 2
subagentes en apps distintas: rama basti/<tema>, PR borrador con el ID en el título apenas empieces, verificación
(credencial en 390×844, 412×915 y 360×740; Hora punta en las 6 resoluciones y sus 48 pruebas en verde), dist de
producción con el .env.local que te paso. No toques PR abiertos de otra persona. Avísame apenas cada PR esté listo
para probarlo. Si algo grande no alcanza, entrega el trozo que funciona. A las 9:30 te detienes.
```
