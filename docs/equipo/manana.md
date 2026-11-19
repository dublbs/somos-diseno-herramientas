# Mañana: todo el feedback F-002 antes de abrir (10:00)

**Decisión de Amaro (19 nov):** entra **todo** el feedback de F-002. Solo queda fuera la app instalable (T-004).
Los scripts e informes (T-001, T-002, T-003, B-001, B-003, B-004) son para después: no cambian lo que ve la gente.

## Cómo cabe en dos horas
Son 16 tareas para tres personas. La única forma de que quepan es **separar construir de probar**:
- **Construir:** los agentes trabajan en paralelo, con subagentes (ver «Paralelo dentro de cada carril»). **Conviene
  lanzarlos antes de llegar a la sede**, desde la casa a las 7:00 o esta noche, porque un agente necesita de 20 a
  60 min por tarea.
- **Probar y mergear (8:00–9:30):** las personas prueban cada PR en una tablet Lenovo y lo mergean si funciona.
- **Congelado a las 9:30.** Lo que no esté mergeado y probado a esa hora no entra mañana; su PR queda abierto y entra
  después. Así ningún cambio sin probar llega a la actividad.

## Reglas de la mañana
- Un PR por tarea. Mergean Amaro o Felipe. GitHub Pages tarda 1–2 min después de cada merge.
- Cada PR se prueba en una tablet real con la URL publicada. **Si algo se ve raro, no se mergea.**
- Orden de merge: primero lo que ve todo el mundo (inicio, Hora punta), después el resto.
- **Esta noche:** Amaro o Felipe pasan **por privado** a Thomas y a Basti el `.env.local` de las apps que tocan. Sin
  ese archivo, el `dist/` sale sin Supabase. Nunca va al repo ni a un chat de grupo.

## Esta noche
- [ ] Mergear #55 (este plan) y #54 (Cabina de fotos).
- [ ] Correr las migraciones 008, 009, 010 y 011 en el SQL Editor y anotarlas en el README de migraciones (E-003).
- [ ] Pasar los `.env.local`.

## Reparto
| Persona | Tareas, en orden | Apps |
|---|---|---|
| **Thomas** | T-005 copy del inicio → T-007 «Multiplicar» → T-012 marco de calle → T-009 muro del vagón → T-010 Audioreactiva a todo el lienzo → T-006 vista previa de Hora punta (al final, cuando Basti haya mergeado sus sprites) | `index.html`, `taller-mosaicos/`, `fotomaton/` + `shared/marcos*`, `graffiti/`, `audioreactiva/` |
| **Basti** | B-002 rescatar ramas → B-006 tutorial → B-007 sprites → B-010 HUD y controles → B-008 andén y llegada del Inacapín → B-009 caminata del Inacapín | `juego-pixel/`, `hub-estacion/`, `credencial/` |
| **Felipe** | Migraciones si faltan → T-008 Teatro completo (escenario arriba, Huemul, Pez, Guanaco) → T-011 Grabado (animación del taco y nitidez) → revisar y mergear | `loops/`, `grabado/` |
| **Amaro** | Prende las tablets, el HUB y el PC madre → prueba cada PR en la tablet → mergea → ronda final a las 9:30 | — |

## Paralelo dentro de cada carril
- **Thomas:** las 5 apps son distintas, así que puede tener **2 subagentes a la vez**, cada uno en su app y en su rama.
  - Primero va T-005 junto con T-007.
  - Después, T-012 junto con T-009.
  - Al final, T-010, y T-006 cuando Basti haya mergeado.
  - El agente principal revisa cada PR antes de avisar.
- **Basti:** casi todo es `juego-pixel/`. Para no pisarse:
  - **Subagente A**: B-006, B-007 y B-010 (tutorial, sprites y HUD), en la rama `basti/hora-punta-sprites-hud`.
  - **Subagente B**: B-008 y B-009 (escenario, llegada y caminata del Inacapín), en la rama `basti/hora-punta-inacapin`.
  - Antes de empezar, cada uno anota en su PR borrador los archivos que va a tocar. Si los dos necesitan el mismo
    archivo, B espera a que se mergee A y actualiza su rama.
  - B-002 lo hace el agente principal primero, porque es rápido.
  - Las 48 pruebas del motor tienen que seguir en verde en las dos ramas.
- **Felipe:** Teatro y Grabado son apps distintas; puede tener un subagente en cada una.

## Si a las 9:00 algo grande va atrasado
Los cambios grandes ya vienen partidos en trozos que funcionan solos. Se mergea el trozo que está listo y el resto queda
para después:
- **B-008:** primero el cambio de color del escenario, después la escena de llegada y al final los detalles del andén.
- **B-010:** primero la lata con número y los puntos legibles, al final los controles nuevos.
- **T-010:** si recortar la exportación no está probado, no se mergea.
- **T-012:** si el marco nuevo no está, se quita la pizarra igual.

## Prompts de mañana
**Thomas**
```text
Soy Thomas. Repo dublbs/somos-diseno-herramientas. La actividad abre a las 10:00 y a las 9:30 se congela. Haz git fetch
origin y lee AGENTS.md, docs/equipo/README.md, docs/equipo/manana.md y docs/equipo/thomas.md. Haz mis tareas de
docs/equipo/manana.md en el orden del reparto, con hasta 2 subagentes en apps distintas: una rama thomas/<tema> y un PR
por tarea, dist de producción con el .env.local que te paso, verificación en las 6 resoluciones. En T-012, propón 2
opciones en el PR borrador y espera mi elección. Avísame apenas cada PR esté listo para probarlo en la tablet. Si una
tarea grande no alcanza, entrega el trozo que funciona según «Si a las 9:00 algo grande va atrasado». Nada fuera de la
lista.
```
**Basti**
```text
Soy Basti. Repo dublbs/somos-diseno-herramientas. La actividad abre a las 10:00 y a las 9:30 se congela. Haz git fetch
origin y lee AGENTS.md, docs/equipo/README.md, docs/equipo/manana.md y docs/equipo/basti.md. Haz primero B-002 tú
mismo y después reparte Hora punta en 2 subagentes como dice «Paralelo dentro de cada carril» (A: B-006, B-007, B-010;
B: B-008, B-009), cada uno en su rama basti/<tema> con su PR. Dist de producción con el .env.local que te paso. Las
48 pruebas del motor siguen en verde. Avísame apenas cada PR esté listo para probarlo en la tablet. Si algo grande no
alcanza, entrega el trozo que funciona según «Si a las 9:00 algo grande va atrasado». Nada fuera de la lista.
```
**Felipe**
```text
Soy Felipe. Repo dublbs/somos-diseno-herramientas. La actividad abre a las 10:00 y a las 9:30 se congela. Lee AGENTS.md,
docs/equipo/manana.md y las tareas T-008 y T-011 de docs/equipo/thomas.md. Haz T-008 completa en loops/ (escenario
arriba de la biblioteca, orejas del Huemul, colores realistas del Pez, cabeza del Guanaco) y T-011 en grabado/
(animación del taco y nitidez en tamaño máximo), con un subagente por app: ramas pipe/teatro-f002 y pipe/grabado-f002,
un PR cada una, dist de producción, verificación en las 6 resoluciones, capturas antes y después en el PR.
```
