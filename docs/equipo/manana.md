# Mañana: todo el feedback F-002 y F-003 antes de abrir (10:00)

**Decisión de Amaro (19 nov):** entra **todo** el feedback de F-002 (experiencias) y F-003 (credencial y HUB). Solo queda fuera la app instalable (T-004).
Los scripts e informes (T-001, T-002, T-003, B-001, B-003, B-004) son para después: no cambian lo que ve la gente.

## Cómo cabe en dos horas
Son unas 30 tareas para tres personas. La única forma de que quepan es **separar construir de probar**:
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
El feedback F-002 y el F-003 (credencial y HUB) entran completos. Son unas 30 tareas para tres personas con sus
agentes. Por eso:
- **los agentes arrancan antes de las 8**;
- cada uno usa 2 subagentes;
- se sigue congelando a las 9:30.

| Persona | Tareas, en orden | Apps |
|---|---|---|
| **Thomas** | T-005 copy del inicio → T-007 «Multiplicar» → T-012 marco de calle → T-009 muro del vagón → T-011 Grabado → T-010 Audioreactiva → **B-008** andén y llegada del Inacapín → **B-009** caminata del Inacapín → T-006 vista previa de Hora punta (al final) | `index.html`, `taller-mosaicos/`, `fotomaton/`, `graffiti/`, `grabado/`, `audioreactiva/`, `juego-pixel/` (escena y jefe) |
| **Basti** | B-002 rescatar ramas → B-015 texto del timbre 3 → B-011 marco Metro → B-012 Invasor y glifo → B-014 Estallido → B-013 círculo de la foto → B-016 vista previa del flyer → B-017 deslizar y gamificar → B-006 tutorial de Hora punta → B-007 sprites → B-010 HUD y controles | `credencial/`, `shared/marcos*` (B-011 y B-014), `juego-pixel/` (sprites y HUD) |
| **Felipe** | Migraciones si faltan → T-008 Teatro completo → P-005 Mezanina → P-002 andén y metro → P-001 plaza y escaleras → P-003 personajes Terraria → P-004 loops «En vivo» → revisar y mergear | `loops/`, `hub-estacion/` (cola: `felipe.md`) |
| **Amaro** | Prende las tablets, el HUB y el PC madre → prueba cada PR (tablet, celular y HUB) → mergea → ronda final a las 9:30 | — |

## Paralelo dentro de cada carril
- **Thomas** (2 subagentes, cada uno en su app y su rama):
  - **A** hace las experiencias de tablet en este orden: T-005, T-007, T-012, T-009, T-011 y T-010.
  - **B** hace Hora punta: B-008 y B-009, en la rama `thomas/hora-punta-inacapin`.
  - T-006 va al final, cuando se hayan mergeado las dos ramas de Hora punta.
- **Basti** (2 subagentes):
  - El agente principal hace B-002 primero.
  - **A** hace la credencial, en este orden: B-015, B-011, B-012, B-014, B-013, B-016 y B-017. Son PRs chicos y
    separados; B-017 es el más grande y va al final.
  - **B** hace Hora punta: B-006, B-007 y B-010, en la rama `basti/hora-punta-sprites-hud`.
- **Hora punta la tocan dos personas.** B (de Thomas) toca el escenario y el jefe; B (de Basti) toca los sprites, el
  HUD y el tutorial.
  - Antes de empezar, cada uno anota en su PR borrador los archivos que va a tocar.
  - Si los dos necesitan el mismo archivo, se mergea primero la rama de Basti y la de Thomas se actualiza.
  - Las 48 pruebas del motor tienen que seguir en verde en las dos ramas.
- **Felipe** (2 subagentes): **A** Teatro; **B** HUB, en este orden: P-005, P-002, P-001, P-003 y P-004, cada una en
  su PR.
- **`shared/marcos*`** lo tocan B-011 y B-014 (Basti) y T-012 (Thomas): se mergean en ese orden y cada uno actualiza
  su rama antes de recompilar.

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

## Prompts de mañana
**Thomas**
```text
Soy Thomas. Repo dublbs/somos-diseno-herramientas. La actividad abre a las 10:00 y a las 9:30 se congela. Haz git fetch
origin y lee AGENTS.md, docs/equipo/README.md, docs/equipo/manana.md, docs/equipo/thomas.md y las tareas B-008 y B-009
de docs/equipo/basti.md. Haz mis tareas del «Reparto» de manana.md con 2 subagentes como dice «Paralelo dentro de cada
carril» (A: experiencias de tablet; B: Hora punta, B-008 y B-009): una rama thomas/<tema> y un PR por tarea, dist de
producción con el .env.local que te paso, verificación en las 6 resoluciones. En T-012 propón 2 opciones en el PR
borrador y espera mi elección. Avísame apenas cada PR esté listo para probarlo. Si algo grande no alcanza, entrega el
trozo que funciona según «Si a las 9:00 algo grande va atrasado». Nada fuera de la lista.
```
**Basti**
```text
Soy Basti. Repo dublbs/somos-diseno-herramientas. La actividad abre a las 10:00 y a las 9:30 se congela. Haz git fetch
origin y lee AGENTS.md, docs/equipo/README.md, docs/equipo/manana.md y docs/equipo/basti.md. Haz primero B-002 tú
mismo; después reparte en 2 subagentes como dice «Paralelo dentro de cada carril» (A: la credencial, B-015, B-011,
B-012, B-014, B-013, B-016 y B-017; B: Hora punta, B-006, B-007 y B-010), cada uno con una rama basti/<tema> y un PR por
tarea. Dist de producción con el .env.local que te paso. La credencial se verifica en 390×844, 412×915 y 360×740; las 48
pruebas del motor de Hora punta siguen en verde. Avísame apenas cada PR esté listo para probarlo. Si algo grande no
alcanza, entrega el trozo que funciona según «Si a las 9:00 algo grande va atrasado». Nada fuera de la lista.
```
**Felipe**
```text
Soy Felipe. Repo dublbs/somos-diseno-herramientas. La actividad abre a las 10:00 y a las 9:30 se congela. Haz git fetch
origin y lee AGENTS.md, docs/equipo/manana.md, docs/equipo/felipe.md, la tarea T-008 de docs/equipo/thomas.md y
docs/equipo/referencias/README.md. Usa 2 subagentes: A hace T-008 completa en loops/ (escenario arriba de la
biblioteca, orejas del Huemul, colores realistas del Pez, cabeza del Guanaco); B hace el HUB en el orden de felipe.md
(P-005, P-002, P-001, P-003, P-004). Para el HUB tienes permiso de crear assets nuevos (D-002): tienen que verse
terminados. Una rama pipe/<tema> y un PR por tarea, dist de producción, capturas antes y después en cada PR. Avísame
apenas cada PR esté listo para probarlo. Si algo grande no alcanza, entrega el trozo que funciona.
```
