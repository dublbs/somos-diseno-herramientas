# Bitácora: errores, feedback y decisiones

Aquí entra todo antes de volverse tarea (ver el pipeline en [`README.md`](README.md)). Lo más nuevo va arriba.

Hay tres tipos de entrada:
- `E` = error o hallazgo técnico
- `F` = feedback de una persona
- `D` = decisión tomada

Cómo se llenan las columnas:
- **Gravedad**: Alta (rompe una experiencia o el juego), Media (se nota pero se puede usar), Baja (detalle).
- **Pasa a**: el ID de la tarea (`T-NNN` en `thomas.md`, `B-NNN` en `basti.md`), «Personas» si lo hace alguien a mano, o
  «Triage» si nadie lo ha revisado todavía.

| ID | Fecha | Gravedad | Qué | Evidencia | Pasa a |
|---|---|---|---|---|---|
| E-007 | 19 nov | Media | Lo que **no se probó** en la revisión del 19 nov. Los flujos que escriben en producción (crear credencial, subir por «Llévatela», canjear) se dejaron fuera para no ensuciar los datos del evento. Tampoco se probó en las tablets reales (permiso de cámara de la Cabina, cacería con afiche impreso, audio de Audioreactiva) | Revisión de Claude (sesión de Amaro) | Personas |
| E-006 | 19 nov | Media | `docs/tasks/008-teatro.md` tiene 20 tareas sin marcar, aunque la ronda 3 pasó el Teatro al kit v2 (#39). No se sabe cuáles siguen pendientes | `git log origin/main -- loops/` | T-001 |
| E-005 | 19 nov | Media | Hay PR abiertos y viejos que pueden estar superados por lo que ya se mergeó: **#34** (18 commits, correcciones del QA; #49 y #51 tocaron lo mismo), **#48** («Terminar y liberar la mesa») y **#38** («Agregar a inicio»). Además, #35 es de imgbot y toca imágenes de todas las apps | Lista de PR del 19 nov | B-003 |
| E-004 | 19 nov | Alta | Hay **trabajo terminado en ramas sin PR**, que se pierde si nadie lo abre: `amaro/ronda-3b` (7 commits después del #39: Chas de Audioreactiva sin saturar y obras en los cuadros de la Mezanina del HUB), `claude/escaner-afiches` (la cacería se ve activa mientras escanea; se movió el 19 nov) y `claude/pauta-prueba-grupo` (pauta de 139 pasos de la prueba en grupo) | `git log origin/main..origin/<rama>` | B-002 |
| E-003 | 19 nov | Alta | **Las migraciones 008, 009, 010 y 011 no están corridas** en `somos-diseno`. Por eso:<br>• todas las tablets y el HUB dan 404 en `config_mesas` y usan su configuración local (el PC madre no las controla);<br>• «Jugar con QR» dice «La base todavía no tiene esta función»;<br>• no funcionan «Recargar HUB», «Resumen» ni «Empezar de cero»;<br>• faltan los arreglos del QA: códigos sin 0/O/1/I, timbres simultáneos, canje doble | Revisión contra producción del 19 nov: 404 en `config_mesas`, `emparejar_mesa`, `resumen_evento` y `codigo_credencial`; `metas`, `sellar`, `sellar_flyer`, `reconocer_afiche` y `encontrar_afiche` responden | Personas (correr 008→011 en el SQL Editor y anotarlas) → B-001 |
| E-002 | 19 nov | — | Revisión de lo publicado en GitHub Pages: las 11 experiencias cargan; tablets, credencial y PC madre sin scroll de página; el único error de consola es el 404 de E-003. En Supabase responden las metas (1/4/3/1), el timbre del flyer (006), la cacería por diseño (007) y la función `tarjeta`. La tabla `fotomaton` está cerrada a lectura anónima | Playwright contra `dublbs.github.io` y llamadas REST con la clave publishable | — |
| F-001 | 19 nov | — | Amaro: «Fotomatón CMYK» pasa a llamarse **«Cabina de fotos»**. Solo cambian los textos que se ven; la carpeta, la URL `fotomaton/` y `eventos.tipo` no cambian | Chat de Amaro | PR #54 (por mergear) |
| D-001 | 19 nov | — | Desde el 20 nov, Amaro y Felipe planean y Thomas y Basti ejecutan, cada uno con su agente y en su carril (este directorio) | Chat de Amaro | — |

## Propuestas sin decidir (vienen de `docs/plans/009-refinamiento/`)
Amaro o Felipe deciden si alguna pasa a tarea.
- **Graffiti P2:** opacidad del spray con dos niveles, «Velado» y «Lleno».
- **Graffiti P3:** herramienta «Tag» que escribe con letras pixel.
- **Cabina P3:** tocar una placa C, M, Y o K la apaga y la prende, como el ojo de un canal en Photoshop.
- **Arte generado a Figma** (009 T10): Hora punta, los muros de Graffiti y los sellos de la cacería, para que el equipo
  los afine.
