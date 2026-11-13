# 009 · Timbres finales, juego Pixel y ronda de refinamiento

Fecha: 13 nov 2026 · Estado: **propuesta con decisiones pendientes** (§6) · Decide: Amaro. Lo que toca `shared/juego.ts` y las mesas se acuerda con Pipe.

El juego de la credencial queda con sus 4 timbres definitivos, el Vagón se reemplaza por un juego Pixel y, **antes del jefe final**, se hace una ronda de refinamiento de todas las experiencias. Según la nota de Figma del 10 nov, el juego es el **19 nov**: este plan ordena el trabajo para esa fecha.

## 0. Qué cambia respecto de planes anteriores
| Antes | Ahora | Dónde estaba |
|---|---|---|
| Timbre 2 «Creación»: **una** creación en una mesa | **Al menos 4** creaciones en las mesas (§1) | Plan 005 bloque D, plan 008 §2b |
| Timbre 3 «Portales» | Se llama **«Cacería»**: encuentra 3 afiches en la sede (mecánica del plan 008, sin cambios) | Plan 004 §8, plan 008 |
| Timbre 4 «Hallazgo 3D», apagado | **«Secreto»**: la pelea con el jefe final (Inacapino). Si la producción no llega, se reemplaza **ese mismo día** por una actividad simple (plan B, §1) | Plan 004 §8, plan 005 |
| Pixel → **Vagón** (pintas un carro que pasa por el andén del HUB) | **Juego Pixel** original que mezcla mecánicas de Snow Bros y Crossy Road (§2). El Vagón sale del hub | Plan 004 §8, plan 005 |
| Canje: credencial completa = timbres 1, 2 y 3 | Completa = **1, 2, 3 y 4** | `canjear()` en `shared/supabase/juego.sql` |
| Orden: jefe final después del plan 008 | **Primero** la ronda de refinamiento (§3), después el jefe | — |

## 1. Los 4 timbres
| # | Nombre | En el álbum («cómo») | Regla | Cómo se otorga |
|---|---|---|---|---|
| 1 | Inscripción | Al crear tu credencial | Crear la credencial | Igual que hoy (trigger en `credenciales`) |
| 2 | Creación | Crea 4 cosas en las mesas | **4 creaciones** (ver D1) | Cada mesa anota un **paso** al exportar; `sellos_def.meta = 4` |
| 3 | Cacería | Encuentra 3 afiches | 3 afiches distintos | Sello de la cacería (plan 008) |
| 4 | Secreto | ??? (se revela al ganarlo) | Vencer al jefe final | Lo define el plan del jefe. Plan B abajo |

**Timbre 2 con meta 4 (técnico).** Hoy cada mesa timbra con la firma vieja de `sellar()` (paso `'unico'`), una vez por sesión. Pasa a:
- `shared/datos.ts` → `sellarRemoto(codigo, 2, token, clave)` manda `p_clave`.
- `shared/juego.ts` → `otorgarCreacion(app)` manda la clave según D1: `app` (4 experiencias distintas) o `app + hora` (4 creaciones cualquiera).
- Migración `003-timbres-finales.sql`: `sellos_def.meta = 4` para el 2, nombres «Cacería» y «Secreto», y `canjear()` pide los 4 sellos.
- **Hay que recompilar todas las mesas** (Fotomatón, Mosaicos, Graffiti, Audioreactiva, Grabado, el juego Pixel y Teatro). Teatro es de Pipe: se coordina con su PR.
- La vista Juego de la credencial muestra «n de 4» en el inventario.
- Sin Supabase (plan B sin red), la mesa sigue mostrando el código de la estación 2 para escribirlo a mano: cuenta como **un** paso.

**Plan B del Secreto (listo para usar sin código nuevo).** Si el jefe no está a tiempo, el timbre 4 se gana con un **sello secreto**: un solo sello de la cacería (mismo sistema del plan 008) asignado al timbre 4. Puede llevarlo Inacapino disfrazado, un staff o aparecer en la pantalla del HUB a cierta hora. La tabla `afiches` ya tiene la columna `sello`: basta con `insert into afiches (id, nombre, lenguaje, sello) values ('SECRETO', 'Secreto', 'Pixel', 4);` y generar su sello.

## 2. Juego Pixel (reemplaza al Vagón)
- **Qué es:** un juego **original** en lenguaje Pixel que combina dos mecánicas:
  - avanzar por carriles con saltos cortos esquivando el tráfico, en un recorrido sin fin (Crossy Road);
  - atrapar a los que te persiguen en una bola y empujarla para despejar el camino (Snow Bros).

  Solo se toman las mecánicas: personajes, nombres, escenarios y arte son propios. El arte sale de Figma (lenguaje Pixel); se pueden reusar los personajes y stickers del Vagón y la estación de Metro (D4).
- **Dónde:** carpeta nueva (nombre en D4) con el kit de `shared/ui/` (barras fijas, sin scroll, tutorial de 3 pasos, quiosco a los 90 s). El Vagón se archiva en una rama `archive/vagon`, como el Taller de Píxeles.
- **Controles en la tablet:** tocar para avanzar, deslizar para moverse de carril y un botón para lanzar.
- **En el modo juego:** al terminar entrega una tarjeta 1080 × 1350 (personaje y puntaje) y cuenta como creación (D2).
- **HUB:** el andén muestra hoy el último vagón. Se reemplaza por lo que mande el juego (D3).
- **Alcance:** MVP en 2 a 3 días. Primero se juega con figuras simples para ajustar el ritmo; el arte va después.

## 3. Ronda de refinamiento (antes del jefe)
| Experiencia | Quién | Estado |
|---|---|---|
| Teatro de Papel | Pipe | Ya auditado: PR #12 (plan y 19 tareas) |
| Fotomatón, Mosaicos, Graffiti, Audioreactiva, Grabado | Amaro | Por auditar |
| Credencial y vista Juego | Amaro | PR #11 y #13 |
| HUB Estación y PC madre | Amaro | Por auditar. El HUB cambia por el juego Pixel (§2) |

Método: el mismo de la auditoría del Teatro. Por cada experiencia, probar las 6 resoluciones de tablet con cada herramienta activa, exportar, revisar el modo juego y anotar hallazgos con gravedad. Un plan de tareas por experiencia (o uno común) en `docs/plans/009-refinamiento/`. Antes de auditar se juntan las notas que el equipo ya tenga (D6).

## 4. Orden de trabajo (evento: 19 nov)
1. **13 nov:** este plan y las decisiones de §6.
2. **14 nov:** timbres finales: migración 003, textos de la credencial y las mesas mandan su clave. Correr 001, 002 y 003 en `somos-diseno`.
3. **14 nov, en paralelo:** imprimir los afiches con su sello (dependen de correr la 001). Es lo más urgente fuera del código.
4. **14 y 15 nov:** juego Pixel MVP.
5. **15 a 17 nov:** auditoría y arreglos de refinamiento.
6. **17 nov, corte:** si el jefe no está jugable, se activa el plan B del Secreto.
7. **18 nov:** prueba general en las tablets y celulares reales.

## 5. Archivos (cuando se construya)
| Archivo | Cambio |
|---|---|
| `shared/supabase/migraciones/003-timbres-finales.sql` | meta 4 del timbre 2, nombres, `canjear()` con los 4 sellos |
| `shared/juego.ts`, `shared/datos.ts` | nombres y textos de `ESTACIONES`, la 4 activa, `otorgarCreacion` con clave |
| `credencial/` | «n de 4» en el inventario; Secreto en el álbum |
| `<juego-pixel>/` (nuevo), `index.html`, `hub-estacion/` | el juego, su tarjeta en el hub y su lugar en el HUB |
| `vagon/` | se archiva |
| `AGENTS.md`, `README.md` | tabla de experiencias |

## 6. Decisiones pendientes
- **D1 · «4 creaciones»:** ¿4 experiencias **distintas** o 4 creaciones **cualquiera** (pueden ser en la misma mesa)? Recomendación: distintas, porque obliga a recorrer el espacio y no se puede repetir la misma mesa.
- **D2 · ¿El juego Pixel cuenta como creación?** Recomendación: sí, si al terminar entrega su tarjeta como las demás mesas.
- **D3 · ¿Qué manda el juego al HUB en lugar del vagón?** Recomendación: el personaje de la persona cruza el andén con su puntaje.
- **D4 · Nombre, tema y arte del juego:** ¿se reusan los personajes y stickers del Vagón y la estación de Metro? Hay que pedir el arte en Figma.
- **D5 · Plan B del Secreto:** confirmar el sello secreto y quién lo muestra (Inacapino, staff o el HUB).
- **D6 · Refinamiento:** ¿hay una lista de notas del equipo, o se audita cada experiencia desde cero?
- **D7 · Numeración:** el plan 008 está duplicado (cacería en el PR #11, Teatro en el PR #12). Uno de los dos pasa a otro número.
