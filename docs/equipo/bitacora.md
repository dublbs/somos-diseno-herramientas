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
| D-002 | 19 nov | — | Amaro autoriza **crear assets nuevos para el HUB** (plaza, escaleras, andén, personajes), sin que tengan que venir de Figma. Excepción a «no inventar arte» de `AGENTS.md`, solo para `hub-estacion/`. La vara: que se vea terminado, como un producto real, refinado y bonito | Chat de Amaro | P-001…P-005 |
| F-003 | 19 nov | Media | **Feedback de Amaro sobre la credencial y el HUB.** Detalle abajo, en «F-003 en detalle» | Chat de Amaro | B-011…B-017, P-001…P-005 |
| F-002 | 19 nov | Media | **Ronda de feedback de Amaro (UI), experiencia por experiencia.** Texto completo abajo, en «F-002 en detalle». | Chat de Amaro, después del evento | T-004…T-012, B-006…B-010 (todo entra mañana salvo T-004: `manana.md`) |
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

## F-002 en detalle (19 nov, Amaro)
Cada punto lleva la tarea que lo toma.

**General**
- La pantalla completa se pierde al entrar a una experiencia (y al cambiar de una a otra). → T-004
- La vista previa de Hora punta en el inicio está desactualizada. → T-006
- Quedan restos de la UI antigua: la primera vez que se entra a Hora punta, el tutorial a veces sale con la vista Pixel
  antigua. → B-006

**Inicio (copy)** → T-005
- Quitar el logo «Somos Diseño». En su lugar va «Todas las formas del diseño».
- Se mantienen «INACAP Santiago Centro · Semana del Diseño 2026» y «Experiencias interactivas».
- El texto queda: «Explora los tres lenguajes visuales del evento: Geométrico, Píxel y Orgánico. Toca una actividad para
  comenzar.»

**Taller de Mosaicos.** Está bastante bien, pero no se entiende «Multiplicar». Si no se justifica sola como algo
importante, se quita. → T-007

**Teatro de Papel** → T-008
- El escenario debería ir arriba de la biblioteca. Lo demás está bien.
- Las orejas del Huemul se ven mal puestas.
- El Pez amarillo funciona por contraste, pero los colores deberían ser medianamente realistas.
- El Guanaco se ve infantil: falta cuidado en los detalles, sobre todo en la cabeza.

**Graffiti y Tags.** Perfecto, salvo el muro del vagón de metro, que debe parecerse más al vagón de la web: una vista
más detallada de ese vagón. No tiene que ser igual. Referencia: `referencias/metro-web-pixel.png`. → T-009

**Hora punta.** Bastante bien. Lo que falta:
- Las latas de spray no parecen latas de pintura. → B-007
- Cuando aplastan al personaje, debe verse solo aplastado, sin la «piscina de pintura»: parece que salen sus interiores.
  → B-007
- Las micros no tienen la puerta del medio, por donde se baja la gente. → B-007
- El personaje parece tener una lágrima rosada, y en la mano no se nota que lleva un spray. → B-007
- El andén necesita más trabajo de escenario. El metro de fondo es una buena añadidura. → B-008
- En vez del aviso «llegó el Inacapín», una pequeña escena dentro del juego: el Inacapín llega al escenario o sale de
  algún lado y el escenario cambia de color. → B-008
- Con la segunda ronda de Grises también debería cambiar algo del escenario, como un avance. → B-008
- La caminata del Inacapín: hoy solo se mueven las rodillas. Deben moverse las piernas y los brazos, y la cara debe verse
  más enojada. → B-009
- **HUD y controles** → B-010
  - La lata de pintura no dice cuánto queda.
  - Hay un rombo rosado que no se entiende y no se lee por el contraste.
  - Los puntos se ven blancos sobre el fondo y no se alcanzan a leer.
  - Hay que repensar los controles para una tablet.

**Estación Audioreactiva.** Las animaciones deben ocupar todo el lienzo, de ancho y de alto. Al llevárselo, solo va lo del
centro. Hacerlo de papel no tiene sentido al llevárselo. → T-010

**Taller de Grabado** → T-011
- Al poner un taco, debe aparecer con una animación.
- En el tamaño máximo, el SVG del taco y todos los elementos se ven pixelados.

**Cabina de fotos.** Está bastante bien. El marco «pizarra» no se entiende y es muy simple: quitarlo o cambiarlo por
algo de la calle, que es lo que falta. → T-012

## F-003 en detalle (19 nov, Amaro)
**Credencial**
- **Marco Metro:** hay una línea que sale de la esquina inferior izquierda hacia el centro. Es el limpiaparabrisas que
  dibuja `scripts/marcos-generados.py` (líneas ~272–273, los 9 escalones negros de `sobre`) y se lee como un error. →
  B-011
- **Invasor (Pixel) y glifo (Geométrica):** todavía tienen el troquelado del sticker. Hay que quitarlo. → B-012
- **Círculo para sacar la foto:** se ve tosco y hay que pulirlo. → B-013
- **Marco Estallido:** el **patrón de fondo** (no el marco) es morado sobre morado y casi no se ve. Los demás patrones
  están bien. → B-014
- **Bienvenida, timbre 3:** el texto dice «afiches con un sello», pero no hay sello. Debe decir solo «Hay afiches
  repartidos por la sede. Encuéntralos y apúntales con «Buscar afiches»». → B-015
- **«Arma tu flyer aquí mismo»** está bien, pero falta poder **ver antes** el flyer que se va a generar. → B-016
- **Navegación de juego:**
  - Se queda «tocar para ver el álbum».
  - En vez del botón «Jugar», un **indicador visual de deslizar a la derecha** que lleve a la pantalla de jugar de forma
    natural, como en una app o un juego.
  - Hay que **gamificar** un poco la interfaz: hoy se siente extraña.
  - Se quedan el botón «Cómo se juega», la cacería, el inventario y «Tu flyer», que le gustan.
  - → B-017
- **Pregunta de Amaro:** ¿el HUB ya muestra las caras de las personas? Sí: en `main`, el HUB muestra la miniatura de la
  cara **solo si la persona dio su consentimiento** (`hub-estacion/src/estacion/vivo.ts`, `escena.ts` ~572). Si no lo
  dio, o mientras carga, muestra la inicial en color.

**HUB**
- **Plaza (Orgánica):** se ve simple y sin terminar. Hay que refinarla y, con ella, **las escaleras** (D-002). → P-001
- **Estación** y **mapa de red** están bien: «parece arte de metro hecho por alguien».
- **«En vivo»:** tener la Audioreactiva en vivo puede no ser viable. Mejor reproducir siempre **loops del Teatro y de
  la Audioreactiva**. → P-004
- **Andén (Pixel)** → P-002
  - Está vacío y con poco detalle.
  - El metro que llega no tiene el estilo nuevo (el Pixel detallado de `referencias/metro-web-pixel.png`).
  - **No deberían verse las puertas abriéndose**: se abren del lado del andén, que no se ve.
  - Revisar los stickers del plumón y de la zapatilla del andén. Amaro los nombra como parte de lo que falta: que
    queden integrados como pegados en el escenario o que se quiten.
- **Personajes:** al cuerpo le falta trabajo. Felipe propone cuerpos **al estilo Terraria**, uno inclinado a lo
  geométrico, otro a lo orgánico y otro al Pixel (D-002). → P-003
- **«Mezanine»** debe decir **«Mezanina»**. Ya está en la rama `amaro/ronda-3b` (B-002); hay que revisar que no quede
  ninguno. → P-005
- **General:** subir el detalle de todo, para que mañana se vea terminado.
