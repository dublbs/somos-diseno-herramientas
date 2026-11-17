# 012 · UI de herramienta de diseño, ronda 2 de refinamiento y timbre final

Fecha: 17 nov 2026 · Estado: **decidido el 17 nov (§7) · en construcción** · Pedido de Amaro del 17 nov.
Investigación: [`012-ui-herramientas/investigacion.md`](012-ui-herramientas/investigacion.md) · Pedida multi-agente:
[`docs/tasks/012-ronda-2.md`](../tasks/012-ronda-2.md).

## 0. Qué cambia respecto de lo ya decidido
| Antes | Ahora | Dónde estaba |
|---|---|---|
| Kit `k-` con forma propia por lenguaje desde el inicio | **Primero una UI neutra de herramienta** (como Figma y Affinity), igual en todas; **después** se lleva a cada lenguaje con tokens | Plan 005, `AGENTS.md` |
| Barra superior, lienzo, barra derecha y barra inferior fijas; **ningún panel con scroll** | **El panel derecho tiene scroll propio**; las herramientas flotan abajo al centro; el lado izquierdo queda libre. La página sigue sin scroll | `AGENTS.md` «Regla de pantalla» |
| Audioreactiva con micrófono o música de demo | **Solo música de demo**, con estilos para elegir | Plan 005, tarea T4 |
| Timbre 4 «Secreto» = jefe final (plan B: sello del staff) | **Otra actividad lúdica con lo que ya hay** (§2). El jefe **no** da el timbre | Plan 009 §1 |
| Hora punta: 3 niveles, el 3º es La pared (Puyo) | **2 niveles + jefe**: cruce isométrico, andén y **el Inacapín Pixel**. La pared sale | Plan 009-juego-pixel |
| Grabado: tacos, 8 tintas, 4 papeles, mezclas | **Hacer un afiche por capas**: tinta con escalas, papel blanco o hueso, marcos, colocar con vista previa | Plan 009 §3, tarea T3 |

## 1. Viaje de la persona
1. **Inscripción** (celular): crea su credencial → timbre 1.
2. **Bienvenida suave** (nuevo): 3 tarjetas en la credencial, «Tu recorrido»: *crea en las tablets*, *caza afiches*,
   *cierra con tu flyer* (o la opción elegida en §2). El staff tiene el mismo guion en una hoja.
3. **Creación** (tablets, 4 experiencias) y **Cacería** (3 afiches), en el orden que quiera.
4. **Actividad final** → timbre 4.
5. **Canje** de la bolsa en el PC madre.

Sin credencial se sigue pudiendo jugar y llevarse lo creado por QR (plan 011).

## 2. Timbre 4: opciones con lo que ya existe
| # | Opción | Cómo se juega | Qué hay que construir | Riesgo |
|---|---|---|---|---|
| **A** | **Tu flyer** (recomendada) | En el celular, la credencial arma un flyer 1080 × 1350 con **lo que juntaste**: tus creaciones del inventario, tus afiches y tu personaje. Eliges 1 de 3 composiciones y lo descargas o compartes | Solo `credencial/`: pantalla «Tu flyer» y el timbre al descargarlo. Requiere al menos 1 creación y 1 afiche | Medio día. Sin staff ni tablets |
| B | **Foto de carnet** | Te sacas la foto en el **Fotomatón** con tu código y esa foto pasa a ser el retrato de tu credencial | Fotomatón ya manda `foto`; falta que la credencial la use de retrato y otorgue el timbre | Hace fila en una sola tablet; se cruza con «Creación» |
| C | **Selfie con marco** | Con la cámara del celular (la credencial ya la tiene), una selfie dentro de uno de los marcos de la campaña | `credencial/`: pantalla de cámara con marco y timbre | Fácil de hacer sin moverse: poco «recorrido» |
| D | **Saluda en la pantalla grande** | La pantalla del HUB muestra un sello de la cacería; al apuntarle, tu personaje salta y saluda en la Estación | Casi nada: es el plan B ya construido, con el sello en el HUB | Depende de la pantalla flip |
| E | **Sello del staff** | El staff muestra el sello después de un reto corto | Nada (plan B de 009) | Carga al staff |

**Recomendación: A, con D o E de respaldo** (ya funcionan). A cierra el recorrido con sentido: el flyer se hace con lo
que la persona juntó, es de diseño y no depende de staff, tablets ni pantallas.
Nombre del timbre: deja de ser «Secreto»; propuesta **«Flyer»**.

## 3. UI de herramienta (para todas)
- Anatomía y sistema atomizado: investigación §5 y §6. **Se recrean los patrones** (zonas, comportamiento, jerarquía),
  no la marca: ni íconos ni estilos de Figma o Affinity.
- **Etapa 1 (esta ronda):** `shared/ui/` v2 neutro, y las experiencias migran a él.
- **Etapa 2 (siguiente):** tokens por lenguaje (Pixel, Geométrica, Orgánica).
- Regla de pantalla nueva: la **página** no tiene scroll; el **panel derecho sí**; nada frecuente queda bajo el scroll.

## 4. Feedback por experiencia (17 nov)
### Taller de Grabado → «haz un afiche por capas»
- **Capas** bien resueltas: es *la* experiencia de capas (crear, ordenar, ocultar, elegir la activa).
- **Tinta:** rosa cromática o la paleta de la campaña **con escalas** (claro a oscuro).
- **Mezclas:** rehacerlas; hoy confunden.
- **Papel:** solo **blanco** y **hueso**.
- **Tacos:** elegir mejor del conjunto Orgánica (los de `loops/public/figma/organica/` y los de Figma).
- **Marcos** de la campaña como capa del afiche.
- **Colocar:** un toque elige el lugar → se abre la **vista previa** del taco ahí → se gira y se mueve → se confirma.
- **Contraste:** el texto de «Registro corrido» no se lee.

### Estación Audioreactiva
- **Solo música de demo**, con estilos: Lo-Fi Hip Hop, Synthwave, Button Mash, It's Friday, Acoustic Ambient.
- **Más táctil y menos consola:** controles grandes para manipular con las manos, en horizontal.
- Mejorar **Túnel** y **Escalera**; estudiar por estilo qué mueven los golpes y los agudos.

### Graffiti y Tags
- **Spray y plumón:** el medio pasa a grande, el fino a medio, y se suma uno más chico. Rodillo queda.
- **Stencil:** se puede **girar**; tamaño máximo menor, relativo al lienzo.
- **Stencil del metro:** rehacerlo, parecido al de la web de las experiencias.
- **Sticker:** girar, escalar y mover.
- Borrar queda. Panel derecho con scroll.

### Taller de Mosaicos
- Está bien. **Girar y reflejar en un solo lugar:** todo al panel derecho.
- Panel derecho con scroll; herramientas flotando al medio.

### Fotomatón
- **Placas de impresión:** solo si se pueden **apagar y prender**, y solo con el efecto CMYK.
- **Efecto mosaico de triángulos:** no convence; rehacer o cambiar.
- **Barra:** abajo queda **solo el botón de capturar**. Marcos y todo lo demás, al panel derecho. Sin «reflejar» ni
  «compartir». «Inicio» pasa a **«Restablecer»**.
- **Vista previa** de marcos y paletas: rehacer. Mejorar el **personaje** de la vista previa (Orgánica y Pixel).
- **Marcos:**
  - Diamante (Geométrica): no convence; cambiar las flores.
  - Estallido: el tercer círculo recorta las figuras negras.
  - Vinilo: el disco ocupa todo el marco; la foto es la etiqueta central.
  - Ventana web: que se note que es una ventana web.
  - Metro y Señal: no se entienden; la señal, expandida y con stickers pegados.
- **Referencia Pixel:** el «momento Pixel» de la web de Somos Diseño y el afiche **A306** (sección Afiches, Figma).

### Hora punta
- **Nivel 1 isométrico**, con vista 3D como Crossy Road, en el estilo del vagón de la web y los arcades del afiche.
- **Fuera el nivel 3.** Queda cruce → andén → **jefe: el Inacapín Pixel**.
- **Controles a ambos lados**, como Minecraft Pocket Edition: moverse a la izquierda, acciones a la derecha.

### Teatro de Papel (feedback de Amaro del 17 nov; autorizado a un agente)
- **Estado de carga** al abrir: hoy se demora y no avisa.
- **Textos que se salen** de sus tarjetas.
- **Alas de las aves:** recuperar el buen movimiento que tenía la paloma (ya no está) para el cóndor.
- **Panel derecho con scroll.**
- Dejar **voltear**; quitar **duplicar** y **copiar y pegar** (rompen la experiencia).
- **Tamaños relativos al escenario:** mínimo y máximo de cada pieza calculados según el escenario (hoy el cóndor es
  gigante), para que se puedan armar escenas bonitas.
- **Todos los animales con al menos 3 estados** (hoy el huemul no tiene, como sí el pudú).
- **Huemul:** refinarlo; se ve enojado. **Guanaco:** mejorarlo y darle sus 3 animaciones.
- **Flor:** descartarla y reemplazarla por otra pieza.
- **Selector de color** para algunas piezas (el pez no se distingue del mar).
- Bosque, Mar y Cordillera están bien. La exportación del loop ya mejoró.
- **Optimizar** los recursos y la experiencia en general. Se coordina con el plan 008 de Pipe (PR #12).

### Marcos de exportación (todas)
- Hay que trabajar el marco de exportación (la tarjeta 1080 × 1350) de todas las experiencias. Por ahora, **listarlos**
  para llevarlos a Figma: [`012-ui-herramientas/marcos-de-exportacion.md`](012-ui-herramientas/marcos-de-exportacion.md).

## 5. Reglas que no cambian
Stack y dependencias, `loops/` solo cuando se pide, arte de Figma o generado con manifiesto, toques ≥ 44–48 px,
`prefers-reduced-motion`, migraciones nuevas sin editar las corridas, nada de claves en el repo.

## 6. Tamaño y fecha
Es **mucho más que lo que cabe antes del 19 nov** (hoy es 17). Estimación con agentes en paralelo:

| Bloque | Trabajo | Para el 19 |
|---|---|---|
| Timbre 4 (opción A) y bienvenida | ½ día | **Sí** |
| Arreglos acotados: tamaños de Graffiti, girar stencil y sticker, Mosaicos a la derecha, barra del Fotomatón, papel y contraste de Grabado, Audioreactiva solo demo | 1 día | **Sí** |
| Kit v2 neutro y migración de 6 experiencias | 2–3 días | No sin riesgo: cambia todas las pantallas a la vez |
| Grabado como afiche por capas | 2 días | No |
| Hora punta isométrico + jefe | 2–3 días | No |
| Marcos y efectos del Fotomatón (necesita arte) | 2 días + arte | No |
| Música por estilos y escenas nuevas | 1–2 días | Parcial |

## 7. Decisiones (Amaro, 17 nov)
- **D1 · Fecha:** el evento es el **19 nov**. Se hace **todo**; cada bloque va en su PR para poder dejar fuera lo que no
  llegue estable.
- **D2 · Timbre 4:** **A, «Tu flyer»**, con **E (sello del staff)** de respaldo. Detalle en §8.
- **D3 · Música:** los 5 estilos **se generan aquí** con Web Audio (sin archivos ni dependencias).
- **D4 · Arte:** se genera aquí, **con el mejor acabado posible** (manifiesto con `generado: true`).
- **D5 · Teatro:** autorizado a un agente (Amaro, 17 nov), con su feedback de §4. Se coordina con el plan 008 de Pipe.
- **D6 · Regla de pantalla:** scroll **solo en las barras laterales** (el panel derecho; en vertical, ese mismo panel
  abajo). La página, el lienzo y la barra de herramientas no tienen scroll.

## 8. Timbre 4 · «Tu flyer» (opción A, ampliada)
**Idea:** el cierre del recorrido es diseñar. Con lo que juntaste en las tablets y en la cacería armas tu flyer de la
Semana del Diseño en el celular, y te lo llevas. Mientras más juntaste, más piezas tienes para jugar.

- **Dónde:** en la credencial, vista Juego: tarjeta **«Tu flyer»** bajo el inventario. Ruta `#/flyer`.
- **Cuándo se abre:** con **al menos 1 creación y 1 afiche**. Antes, la tarjeta dice qué falta («Te falta crear algo en
  una tablet»). No exige tener completos los timbres 2 y 3: el canje ya los pide.
- **Cómo se juega (3 pasos, todo con toques, sin escribir):**
  1. **Lenguaje:** Pixel, Geométrica u Orgánica. Cambia la composición, la tipografía y las formas.
  2. **Tus piezas:** eliges hasta 3 creaciones de tu inventario y 1 afiche encontrado; tu personaje va siempre.
     Botón **«Mezclar»**: reordena posiciones, tamaños, giros y colores. Se puede tocar las veces que quieras.
  3. **Tu frase:** una de 6 frases de la campaña («Somos Diseño», «Yo diseño», «Hecho a mano», «Ven a crear», «Línea
     azul», «Diseño en la calle»). Sin texto libre (es un evento público). Tu nombre va en la franja.
- **Resultado:** tarjeta 1080 × 1350 con la franja negra común. **«Guardar mi flyer»** lo descarga o comparte y **otorga
  el timbre 4**. Se puede rehacer; el timbre se da una vez.
- **Servidor:** migración `006-timbre-flyer.sql`: el timbre 4 pasa a llamarse **«Flyer»** y la función
  `sellar_flyer(p_codigo)` lo otorga solo si esa credencial tiene al menos 1 paso de Creación y 1 afiche. Sin Supabase
  (demo), se otorga en el equipo.
- **Respaldo E:** el **sello del staff** ya funciona (plan 009, D5): `insert into afiches (id, nombre, lenguaje, sello)
  values ('SECRETO', 'Flyer', 'Pixel', 4);` y se genera su sello. Sirve si alguien no puede hacer el flyer (celular sin
  batería, sin datos) o si falla la red.
- **Bienvenida «Tu recorrido»:** al crear la credencial, 3 tarjetas: *1 · Crea en las tablets*, *2 · Caza 3 afiches*,
  *3 · Arma tu flyer y canjea tu bolsa*. Se puede volver a ver desde la vista Juego. Hoja para el staff:
  `docs/staff/guion-del-recorrido.md`.
