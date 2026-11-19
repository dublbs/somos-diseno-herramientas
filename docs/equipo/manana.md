# Mañana de 8:00 a 10:00: lo que se hace antes de abrir

La actividad abre a las **10:00**. Hay dos horas en la sede, y **no se arriesga nada que pueda romper una experiencia**.
Solo entran cambios chicos, que se prueban en la tablet antes de las 9:30. Lo grande queda «Después del evento» en las
colas.

## Reglas de la mañana
- **Congelado a las 9:30.** Lo que no esté mergeado y probado a esa hora no entra; su PR queda abierto para después.
- **Un PR por persona y app**, chico. Mergean Amaro o Felipe. Después de cada merge, GitHub Pages tarda 1–2 min.
- Cada PR se prueba **en una tablet Lenovo real** con la URL publicada antes de pasar al siguiente.
- **Cualquier duda o efecto raro: no se mergea.** Es mejor la versión de hoy que funciona que una mejor sin probar.
- **Esta noche:** Amaro o Felipe le pasan a Thomas y a Basti, **por privado**, el `.env.local` de las apps que tocan
  (`index.html` no lo necesita). Sin ese archivo, el `dist/` sale sin Supabase. Nunca va al repo ni a un chat de grupo.

## Antes de las 8 (esta noche)
- [ ] Mergear #55 (este plan) y #54 (Cabina de fotos).
- [ ] Correr las migraciones 008, 009, 010 y 011 en el SQL Editor y anotarlas en el README de migraciones (E-003).
  Si no alcanza esta noche, Felipe lo hace a las 8:00.

## Quién hace qué
| Hora | Felipe | Thomas (agente) | Basti (agente) | Amaro |
|---|---|---|---|---|
| 8:00 | Migraciones 008→011 si faltan | **T-005** copy del inicio | **B-002** solo `amaro/ronda-3b`: actualizar con `main`, recompilar y abrir el PR (trae el arreglo del Chas y las obras de la Mezanina) | Prende las tablets, el HUB y el PC madre. Prueba de humo de cada experiencia |
| 8:30 | **T-008** Teatro, parte chica: escenario arriba de la biblioteca, orejas del Huemul y colores del Pez | **T-007** quitar «Multiplicar» de Mosaicos (si es central, se deja y se anota) | **B-006** tutorial con la UI antigua | Revisa y mergea el PR de ronda-3b. Prueba el Chas con parlante |
| 9:00 | Revisa y mergea los PR de Thomas y Basti | **T-012** solo quitar la pizarra de los marcos (Cabina y credencial) | **B-007** chico: aplastado sin charco, sin lágrima rosada, puerta del medio en las micros · **B-010** chico: la lata dice cuánto queda y los puntos se leen | Prueba en la tablet cada PR mergeado |
| 9:15 | — | **T-006** captura nueva de Hora punta para el inicio, después del merge de Basti · si sobra tiempo, **T-011** Grabado nítido en tamaño máximo | Si sobra tiempo: latas de spray (B-007) | — |
| **9:30** | **Congelado.** Nada más se mergea | — | — | Ronda final en las tablets: cada experiencia, un timbre, «Llévatela» y canje |

**Queda para después del evento:**
- T-004, pantalla completa: ver abajo.
- T-009, muro del vagón en Graffiti: arte nuevo.
- T-010, Audioreactiva a todo el lienzo: cambia la exportación.
- T-008, la cabeza del Guanaco.
- B-008, el andén y la escena del Inacapín.
- B-009, la caminata del Inacapín.
- B-010, los controles nuevos.
- Los scripts y los informes.

## Pantalla completa (T-004): no se toca mañana
- Convertirlo en app instalable es poco código (un `manifest`), y el `manifest` no cambia cómo se ve ni cómo funciona una
  página en el navegador.
- Lo que sí cambia es **cómo se abre en la tablet**: instalar en cada Lenovo, permisos de cámara y micrófono dentro de la
  app instalada, y el caché.
- Eso hay que probarlo con calma en una tablet, no a las 9 de la mañana.
- **Para mañana:**
  - Chrome en Android pide pantalla completa de nuevo en cada experiencia, y el staff lo resuelve en un toque.
  - Si molesta mucho, se usa la fijación de pantalla de Android (Ajustes → Seguridad → Fijar apps). No oculta la barra,
    pero evita que se salgan de Chrome.

## Prompts de mañana
**Thomas**
```text
Soy Thomas. Repo dublbs/somos-diseno-herramientas. Hoy hay dos horas antes de abrir la actividad. Haz git fetch origin y
lee AGENTS.md, docs/equipo/README.md, docs/equipo/manana.md y docs/equipo/thomas.md. Haz SOLO mis tareas de
docs/equipo/manana.md, en el orden de la tabla, con el alcance chico que dice ahí: una rama thomas/<tema> y un PR por
app, dist de producción con el .env.local que te paso, verificación en 1024×768 y 1180×820 como mínimo. Nada que no
esté en la tabla. Avísame cuando cada PR esté listo para que lo prueben en la tablet. A las 9:30 te detienes.
```
**Basti**
```text
Soy Basti. Repo dublbs/somos-diseno-herramientas. Hoy hay dos horas antes de abrir la actividad. Haz git fetch origin y
lee AGENTS.md, docs/equipo/README.md, docs/equipo/manana.md y docs/equipo/basti.md. Haz SOLO mis tareas de
docs/equipo/manana.md, en el orden de la tabla, con el alcance chico que dice ahí: una rama basti/<tema> y un PR por
tarea, dist de producción con el .env.local que te paso, las 48 pruebas del motor de Hora punta en verde. Nada que no
esté en la tabla. Avísame cuando cada PR esté listo para que lo prueben en la tablet. A las 9:30 te detienes.
```
**Felipe**
```text
Soy Felipe. Repo dublbs/somos-diseno-herramientas. Lee AGENTS.md, docs/equipo/manana.md y la tarea T-008 de
docs/equipo/thomas.md. En loops/ (Teatro de Papel, mío) haz solo la parte chica de T-008: el escenario arriba de la
biblioteca en el panel, las orejas del Huemul y colores más realistas del Pez. Rama pipe/teatro-manana, un PR, dist de
producción, verificación en 1024×768 y 1180×820. El Guanaco queda para después. Antes de las 9:30.
```
