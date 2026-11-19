# Equipo de cuatro: cómo se reparte el trabajo (desde el 20 nov 2026)

Cuatro personas trabajan en el repo, cada una con su agente:

- **Amaro y Felipe (Pipe) planean y coordinan.** Usan sus chats para decidir qué se hace, escriben las tareas y mergean.
- **Thomas y Basti ejecutan.** Cada uno abre su agente con el prompt de abajo, y el agente toma las tareas de su carril.

Esta carpeta es el canal entre las dos partes. Lo que no está escrito aquí, en `docs/plans/` o en un PR, no existe.

| Archivo | Para qué | Quién lo escribe |
|---|---|---|
| [`bitacora.md`](bitacora.md) | Entrada de todo: errores, feedback, hallazgos y decisiones, con un ID (`E-NNN`, `F-NNN`, `D-NNN`) | Cualquiera agrega; Amaro o Felipe la ordenan |
| [`thomas.md`](thomas.md) | Cola de tareas del carril **Experiencias** | Amaro o Felipe escriben las tareas; el agente de Thomas cambia el estado y agrega hallazgos |
| [`manana.md`](manana.md) | **Plan de la mañana de la actividad: todo F-002 (menos la app instalable), quién hace qué y prompts** | Amaro, Felipe |
| [`basti.md`](basti.md) | Cola de tareas del carril **Plataforma** (juego, datos, HUB, PC madre) | Amaro o Felipe escriben las tareas; el agente de Basti cambia el estado y agrega hallazgos |

Siguen valiendo `AGENTS.md` (reglas, stack, verificación de pantalla) y `shared/ui/README.md` (kit v2).

## El pipeline
```
1 Entrada          2 Triage (Amaro/Felipe)         3 Ejecución (Thomas/Basti)       4 Cierre (Amaro/Felipe)
feedback, error →  bitacora.md → tarea en el    →  el agente toma la primera    →  revisa el PR, prueba,
de un agente o     carril con prioridad y           «Lista», abre PR borrador,       mergea y marca «Hecha»;
de una prueba      aceptación (si cambia una        trabaja, verifica, deja el       lo que salió va de nuevo
                   decisión: primero un plan)       PR listo y anota hallazgos       a la bitácora
```
1. **Entrada.** Todo error, feedback o idea entra a `bitacora.md` con un ID. Eso incluye lo que diga Amaro en un chat y
   lo que encuentre un agente. No se arregla «de pasada» algo que no tiene tarea.
2. **Triage.** Amaro o Felipe convierten la entrada en una tarea del carril que corresponda, con el formato de abajo.
   Si toca una regla del juego, una pantalla o una decisión de `docs/plans/`, primero se escribe en un plan.
3. **Ejecución.** El agente toma **la primera tarea «Lista» de su carril** (el orden del archivo es la prioridad). Cada
   tarea va en su propia rama y su propio PR.
4. **Cierre.** Amaro o Felipe revisan el PR, prueban y mergean. Al mergear marcan la tarea «Hecha» y pasan los hallazgos
   del agente a la bitácora.

## Carriles: cada uno toca solo su zona
Los carriles están hechos para que Thomas y Basti no choquen en los mismos archivos.

| Carril | Persona | Zona (puede editar) | Pide permiso para |
|---|---|---|---|
| **Experiencias** | Thomas | `fotomaton/`, `taller-mosaicos/`, `graffiti/`, `grabado/`, `audioreactiva/`, `index.html`, `shared/ui/` salvo `Juego.tsx`, `shared/marcos*.ts`, `scripts/marcos-*.py` | `loops/` (Teatro es de Felipe: solo con una tarea que lo diga) |
| **Plataforma** | Basti | `juego-pixel/` (Hora punta), `credencial/`, `admin/`, `hub-estacion/`, `accesos/`, `shared/juego.ts`, `shared/datos.ts`, `shared/ui/Juego.tsx`, `shared/supabase/`, `scripts/qa-base/`, `docs/qa/` | Correr SQL en producción: **nunca lo hace el agente**, lo hace una persona |
| Referencias | — | `docs/equipo/referencias/` (imágenes de Amaro: metro de la web, Línea 1) | — |
| Coordinación | Amaro, Felipe | `docs/plans/`, `docs/equipo/` (salvo estado y hallazgos), `AGENTS.md`, merges | — |

- Si una tarea necesita tocar la zona del otro carril, el agente **se detiene** y lo anota como hallazgo. Amaro o
  Felipe deciden si se parte en dos tareas.
- `shared/` lo usan todas las apps. Un cambio ahí va en un PR chico y explicado, y se recompila el `dist/` de las apps
  que lo usan (ver «dist» abajo).

## Formato de tarea
```md
## T-018 · Título corto                                  ← ID: carril T (Thomas) o B (Basti) + número
- Estado: Lista | En curso (PR #n) | En revisión (PR #n) | Bloqueada (motivo) | Hecha (PR #n)
- Origen: E-004 (bitácora) · Plan: docs/plans/NNN-*.md si aplica
- Archivos: rutas exactas
- Cambio: qué hacer, concreto.
- No tocar: …
- Verificar: comandos y resoluciones
- Aceptación: criterio observable.
```
- **Lista** = tiene todo lo necesario para empezar sin preguntar. Si falta algo (un asset de Figma, una decisión, una
  clave), la tarea va como **Bloqueada** con el motivo.

## Reglas para los agentes de Thomas y Basti
1. **Una tarea, una rama, un PR.** La rama es `thomas/<tema>` o `basti/<tema>`, creada desde `origin/main`. Apenas
   empiezas, abres el PR como **borrador** con una línea de qué vas a tocar, y en la cola cambias la tarea a
   «En curso (PR #n)». Nada directo a `main`. El agente nunca mergea.
2. **Antes de empezar**, revisa los PR abiertos: si alguien ya toca esos archivos, toma la siguiente tarea y anota el
   cruce como hallazgo.
3. **Multiagente, con orden.** Puedes repartir trabajo en subagentes, máximo 2 a la vez, cada uno en su propio worktree
   y en una app distinta. Cada subagente trabaja en su propia rama y abre su PR. Tú los coordinas: antes de pasar un
   PR a revisión, revisas su diff, corres el build y haces la verificación de pantalla. Más de 3 agentes a la vez agota
   el límite de uso en minutos.
4. **Empuja seguido.** Cada trozo que compile se empuja, para no perder trabajo si el agente se corta. Si la tarea queda
   a medias, deja `AVANCE.md` en la carpeta de la app con «Hecho» y «Falta», y bórralo al terminar.
5. **Verificación** (de `AGENTS.md`): pruebas en 1024×768, 1180×820, 1280×720, 1366×768, 768×1024 y 820×1180, con cada
   herramienta activa. Tiene que haber cero scroll de página y toques de al menos 48 px, y la consola no puede mostrar
   errores. Mira tus capturas. La credencial se prueba en 390×844, 412×915 y 360×740.
6. **`dist/` al final.** Recompila solo la app que tocaste, justo antes de pasar el PR a «listo para revisión», con el
   `.env.local` de esa app (pídeselo a Amaro o Felipe, nunca se sube). Revisa con
   `grep -l supabase.co <app>/dist/assets/*.js` que el bundle apunte al Supabase real. Si hay conflictos en `dist/`, se
   resuelven recompilando.
7. **La base está en producción.** Un cambio de SQL va en un archivo nuevo `shared/supabase/migraciones/NNN-tema.sql`,
   idempotente. Antes de pedir revisión, pruébalo con `scripts/qa-base/correr.sh` (Postgres local). Lo corre una
   persona, que lo anota en el README de migraciones.
8. **Hallazgos.** Todo lo que encuentres fuera de tu tarea (un error, algo raro, una idea) va a la sección «Hallazgos»
   al final de tu cola, con fecha. No lo arregles sin tarea.
9. **Cerrar con estado.** El PR termina con tres listas: qué quedó probado, qué no y qué falta. Después cambias la tarea
   a «En revisión (PR #n)» y sigues con la siguiente «Lista».
10. **Si algo bloquea** (una decisión, un asset, una clave, una tarea ambigua): marca la tarea «Bloqueada (motivo)»,
    anota el motivo en la tarea y pasa a la siguiente. No improvises arquitectura.

## Prompts para empezar (copiar y pegar)
**Thomas**
```text
Soy Thomas. Trabajas en el repo dublbs/somos-diseno-herramientas, en el carril «Experiencias».
Haz git fetch origin y lee, en este orden: AGENTS.md, docs/equipo/README.md, docs/equipo/thomas.md y
shared/ui/README.md. Toma la primera tarea con estado «Lista» de docs/equipo/thomas.md y síguela con las reglas de
docs/equipo/README.md: rama thomas/<tema> desde origin/main, PR borrador apenas empieces, verificación en las 6
resoluciones, dist solo de la app tocada y al final, nunca mergear. Puedes usar hasta 2 subagentes en apps distintas.
Cuando termines una tarea, sigue con la siguiente «Lista». Al final dame un resumen: PRs abiertos, qué probaste,
qué no, y los hallazgos que anotaste.
```
**Basti**
```text
Soy Basti. Trabajas en el repo dublbs/somos-diseno-herramientas, en el carril «Plataforma» (Hora punta, credencial,
PC madre, HUB, juego y Supabase). Haz git fetch origin y lee, en este orden: AGENTS.md, docs/equipo/README.md,
docs/equipo/basti.md y shared/supabase/migraciones/README.md. Toma la primera tarea con estado «Lista» de
docs/equipo/basti.md y síguela con las reglas de docs/equipo/README.md: rama basti/<tema> desde origin/main, PR
borrador apenas empieces, SQL solo en migraciones nuevas e idempotentes (nunca lo corras en producción), dist solo de
la app tocada y al final, nunca mergear. Puedes usar hasta 2 subagentes en apps distintas. Cuando termines una tarea,
sigue con la siguiente «Lista». Al final dame un resumen: PRs abiertos, qué probaste, qué no, y los hallazgos que
anotaste.
```
**Amaro o Felipe (para planear en su chat)**
```text
Coordino el trabajo de Thomas y Basti. Lee AGENTS.md, docs/equipo/README.md, docs/equipo/bitacora.md, thomas.md,
basti.md y los PR abiertos. Ayúdame a: (1) pasar las entradas nuevas de la bitácora a tareas con aceptación en el
carril que corresponda, (2) ordenar las colas por prioridad, (3) revisar los PR «En revisión». No escribas código de
las apps: solo planes, tareas y revisión.
```
