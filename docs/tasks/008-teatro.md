# Tareas 008 · Teatro de Papel

Plan: [`docs/plans/008-teatro-auditoria.md`](../plans/008-teatro-auditoria.md). Todo en `loops/` salvo donde se indica. Una rama y un PR por tarea (o por grupo chico de la misma fase); el PR borrador avisa quién la tomó. Antes de cerrar cualquier tarea: `npm --prefix loops run build` en verde y la verificación de pantalla de `AGENTS.md` en las 6 resoluciones si cambió la interfaz.

## Fase 0 · Medir

## T-000 · Recompilar el Teatro con el `shared/` nuevo (después de mergear #17–#21)
- Archivo: `loops/dist/` (solo build).
- Cambio: `npm --prefix loops ci && npm --prefix loops run build` sobre `main`, ya con la cadena de Amaro mergeada. Así el Teatro anota su paso del timbre Creación (`p_clave = 'teatro'`) y tiene «Jugar sin credencial».
- No tocar: `loops/src/`.
- Verificar: en modo juego, exportar en el Teatro con una credencial de prueba; en el PC madre, la persona suma 1 en «creaciones».
- Aceptación: el Teatro cuenta como una de las 4 experiencias.
- [ ] Hecha

## T-001 · Duración real del video y diagnóstico
- Archivo: `src/lib/grabarLoop.ts` (~40-59), `src/components/EscenarioOrganico.tsx` (`grabar`, ~332), `src/components/ModalExportar.tsx`.
- Cambio: al terminar la grabación, leer la duración real del video (cargar el blob en un `<video>` oculto; si `duration` es `Infinity`, saltar a `currentTime = 1e7` y leerla en `timeupdate`). Si difiere más de 10 % de la esperada, el modal avisa «El video salió más lento de lo esperado. Prueba con menos piezas o sin borde.» y ofrece «Grabar de nuevo». Con `?diag` en la URL, mostrar además los ms promedio por cuadro y la duración real.
- No tocar: el formato de salida (MP4 o WebM).
- Verificar: en el iPad, con `?diag`, grabar escenas de 3, 6 y 8 piezas a 12 y 24 fps, con y sin borde. Anotar los resultados en esta tarea.
- Aceptación: tabla de mediciones del iPad escrita aquí; el aviso aparece cuando la duración no calza.
- [ ] Hecha

## Fase 1 · Resultado

## T-002 · El loop siempre cierra
- Archivo: `src/lib/grabarLoop.ts` (`duracionLoop`, ~18-25), `src/escenario/dibujar.ts` (`dibujarMarco`, `dibujarCapas`).
- Cambio: hoy, si el mínimo común múltiplo pasa de 12 s, se corta en 8 s y las piezas que no calzan saltan. En vez de cortar: elegir un largo L (el MCM si es ≤ 12 s; si no, 8 s) y a cada pieza darle un número entero de ciclos dentro de L (`ciclos = max(1, round(L / dur))`, `durAjustada = L / ciclos`). Al dibujar, la pieza usa su tiempo reescalado (`ms * dur / durAjustada`). La vista previa usa el mismo L para que se vea igual que el video.
- No tocar: las duraciones definidas en `piezas.ts`.
- Verificar: Cordillera con Sol + K'isa + Huemul caminando; comparar el primer y el último cuadro del video.
- Aceptación: el primer y el último cuadro son iguales; ninguna pieza salta al reiniciar.
- [ ] Hecha

## T-003 · Grabar sin competencia ni recarga
- Archivo: `src/components/EscenarioOrganico.tsx` (`tick`, ~146; `grabar`), `src/App.tsx` (`<Quiosco>`).
- Cambio: mientras se graba, el loop de vista previa no dibuja (todo el tiempo de cuadro queda para el video) y muestra un velo «Grabando…» sobre el lienzo. El `Quiosco` recibe `activo={!grabando}` (subir el estado `grabando` a `App` o pasar un callback).
- No tocar: `shared/ui/Tutorial.tsx`.
- Verificar: con `?quiosco=20`, grabar una escena pesada que tarde más de 20 s.
- Aceptación: no recarga durante la grabación; medido con T-001, la duración real mejora o se mantiene.
- [ ] Hecha

## T-004 · Tarjeta según la dirección (depende de D1)
- Archivo: `src/lib/exportarTarjeta.ts` (todo).
- Cambio:
  - Si **D1 = común**: componer la escena en el cuadrado de 1080 y la franja negra común como `fotomaton/src/lib/tarjeta.ts` (si conviene, mover esa franja a `shared/` en un PR propio).
  - Si **D1 = propia**: dejar todo el texto en negro (sin Lapislázuli ni gris); «INACAP Santiago Centro» en negro como en la tarjeta común (el rojo solo va en el isotipo, que no está en el repo); alinear «INACAP» y la sede por la derecha; la franja amarilla del ancho exacto del marco; un solo título («Teatro de Papel · <escenario>»).
  - En ambos casos, el PNG del botón «Tarjeta» y el del video llevan el mismo título.
- No tocar: el tamaño 1080 × 1350.
- Verificar: exportar en los 4 escenarios y revisar los PNG.
- Aceptación: la tarjeta cumple las reglas de color 1 y 2 de la dirección y se ve de la misma familia que la del Fotomatón.
- [ ] Hecha

## T-005 · Modal del resultado → absorbida por T-006
El modal propio se reemplaza por «Llévatela» (plan 011), que ya resuelve los textos, no se cierra a medio subir y tiene su propio estilo. Si queda algo del modal (por ejemplo, la descarga directa en la tablet para el staff), se arregla dentro de T-006.
- [ ] Hecha

## T-006 · «Llévatelo» con QR (plan 011, después de mergear #20)
- Archivo: `loops/src/App.tsx`, `loops/src/components/EscenarioOrganico.tsx` (`exportar`, `grabar`, barra superior), `loops/src/components/ModalExportar.tsx` (se borra), `loops/vite.config.ts` y `loops/tsconfig.json` (`qrcode` en `resolve.dedupe` y `paths`, como indica `AGENTS.md`).
- Cambio:
  - **Barra superior:** «Tarjeta» y «Grabar loop» pasan a un solo «Llévatelo». Graba el video (con la tarjeta como respaldo si el navegador no graba) y abre `<Llevatela blob app="teatro" titulo="Tu loop está listo" conCredencial={…} />`.
  - **Inventario:** la página de descarga ya reconoce `?app=teatro`. Si el equipo quiere que el Teatro también mande su miniatura al inventario de la credencial, hace falta una migración nueva que sume `'teatro'` a `eventos_tipo_check` (como `002`, `004` y `005`); se decide en el PR.
- No tocar: `shared/ui/Llevatela.tsx` (es de todas las experiencias; si hace falta un cambio, va en su propio PR).
- Verificar: generar el QR en la tablet y abrirlo en un iPhone y en un Android.
- Aceptación: el celular descarga el video del loop; a las 24 h se borra (el cron `fotomaton-limpiar` ya corre cada hora).
- [ ] Hecha

## Fase 2 · Interfaz

## T-017 · Una sola tabla por pieza (antes de T-012)
- Archivo: `src/escenario/piezas.ts` (interfaz `Pieza`), `src/components/EscenarioOrganico.tsx` (`ESCALA_INICIAL` ~27, `LIMITES_ESCALA` ~35, `ES_MOVIL` ~268), `src/escenario/sorprendeme.ts` (`ESCALA`).
- Cambio: sumar a `Pieza` los campos `escala` (inicial), `limites: [min, max]` y `movil: boolean`; borrar las 4 tablas sueltas y leer de `pieza(tipo)`. Sorpréndeme usa `pieza.escala` con su variación aleatoria.
- No tocar: los valores (en esta tarea se mueven, no se cambian).
- Verificar: build; Sorpréndeme y agregar piezas se ven igual que antes.
- Aceptación: no queda ninguna tabla por tipo fuera de `piezas.ts`; una pieza nueva se define en un solo lugar.
- [ ] Hecha

## T-012 · Proporciones creíbles
- Archivo: `src/escenario/piezas.ts` (campos de T-017).
- Cambio: definir la escala por rol del elenco (astro, ave, animal, planta emblema, planta chica, fruto o hallazgo, artesanía) para que en cada escenario el fruto sea menor que su planta, el animal menor que la planta emblema y el astro no supere a los cerros. Ajustar los límites para que la persona pueda agrandar sin romper la escena.
- No tocar: el arte.
- Verificar: una captura por escenario con el elenco completo a escala inicial, revisada con el equipo.
- Aceptación: la Piña es menor que la Araucaria y el Sol no tapa los cerros; aprobado en la revisión visual.
- [ ] Hecha

## T-008 · Tope de piezas (depende de D4)
- Archivo: `src/components/EscenarioOrganico.tsx` (`agregar`, `duplicar`, `sorprender`, bandeja).
- Cambio: constante `MAX_PIEZAS = 8` (o lo que decida D4). Al llegar al tope, la bandeja y «Duplicar» quedan deshabilitados y la ayuda dice «Llegaste a 8 piezas: quita una para sumar otra». Sorpréndeme nunca pasa del tope.
- Verificar: llenar la escena por toque, arrastre, duplicar y Sorpréndeme.
- Aceptación: nunca hay más piezas que el tope.
- [ ] Hecha

## T-007 · Línea de tiempo legible
- Archivo: `src/styles.css` (`.lt-pistas` ~47, `.lt-fila`, `.lt-key`), `src/components/LineaDeTiempo.tsx`.
- Cambio: filas de al menos 22 px; con el tope de T-008, la barra inferior crece lo justo para 8 filas y el lienzo se achica (sin scroll de panel). Los rombos A/B caben en su fila. Si en alguna resolución no caben 8 filas legibles, las piezas quietas comparten una fila resumida («+3 quietas») y las que caminan conservan la suya.
- No tocar: la lógica de keyframes.
- Verificar: 8 piezas (4 caminando) en las 6 resoluciones.
- Aceptación: cada fila mide ≥ 22 px; los nombres no se encima; sin scroll de página ni de panel.
- [ ] Hecha

## T-009 · Tirador siempre alcanzable
- Archivo: `src/escenario/dibujar.ts` (`dibujarSeleccion`, ~265), `src/components/EscenarioOrganico.tsx` (`alBajar`, ~180).
- Cambio: la posición del tirador se limita al lienzo (`[ASA, 240 − ASA]` en x e y); la prueba de toque usa la misma posición limitada (una función compartida `posTirador(item)`).
- Verificar: pieza grande pegada al borde inferior y al derecho; tirar del tirador.
- Aceptación: el tirador siempre se ve completo y se puede arrastrar.
- [ ] Hecha

## T-010 · Agregar sin apilar
- Archivo: `src/components/EscenarioOrganico.tsx` (`agregar`, ~235).
- Cambio: al tocar una pieza de la bandeja, buscar dentro de su zona (cielo, agua o suelo, alturas de `sorprendeme.ts`) la posición x con menos superposición con las cajas existentes, probando columnas cada 30 unidades. Arrastrar sigue dejando la pieza donde se suelta.
- Verificar: tocar 5 piezas seguidas en una escena vacía.
- Aceptación: no quedan dos piezas con más de un 50 % de superposición.
- [ ] Hecha

## T-011 · Botones con texto
- Archivo: `src/components/EscenarioOrganico.tsx` (bloque `.transformar`, `BarraSuperior`), `src/styles.css`.
- Cambio:
  - **Play (H19):** el botón «Reproducir el loop» de la línea de tiempo llega a 44 × 44 como mínimo.
  - **Ayuda (H20):** la ayuda de la barra superior no se corta en 1180 × 820 ni en 1280 × 720 (más corta, o en la barra derecha).
  - **Propiedades:** etiqueta corta bajo cada ícono: Agrandar, Achicar, Voltear, Invertir, Al frente, Al fondo, Duplicar, Quitar.
  - **Vertical:** «Sorpréndeme» y «Tarjeta» conservan su texto, si cabe sin desbordar; si no cabe, el texto va bajo el ícono.
- Verificar: las 6 resoluciones con una pieza elegida que camine (aparece «Invertir»).
- Aceptación: todos los botones tienen texto visible; nada se desborda; objetivos ≥ 44 px.
- [ ] Hecha

## Fase 3 · Rendimiento

## T-013 · Dibujar solo cuando hace falta
- Archivo: `src/components/EscenarioOrganico.tsx` (`tick`, ~146).
- Cambio:
  - **En pausa:** se redibuja solo cuando algo cambia (bandera `sucio` que marcan los cambios de items, selección, borde, escenario, tiempo manual y gestos).
  - **En play:** se dibuja solo cuando cambia el cuadro según los fps elegidos, no en cada `requestAnimationFrame`.
- No tocar: lo que se ve.
- Verificar: Performance de Chrome o Safari Web Inspector en el iPad, 8 piezas, en pausa y en play a 12 fps.
- Aceptación: en pausa, 0 dibujados por segundo sin interacción; en play, a lo más los fps elegidos.
- [ ] Hecha

## T-014 · Borde de papel más barato
- Archivo: `src/escenario/dibujar.ts` (`dibujarItem`, ~190).
- Cambio:
  - Reservar los canvas auxiliares una sola vez al tamaño máximo, en vez de redimensionarlos en cada pieza y cada cuadro.
  - Probar 8 pasadas del contorno en vez de 16; si se nota, usar 12.
  - Dibujar la sombra con la silueta ya reducida.
- No tocar: el aspecto del borde (comparar capturas antes y después).
- Verificar: T-001 en el iPad con 8 piezas y borde a 24 fps.
- Aceptación: el borde se ve igual en la comparación lado a lado; el costo por cuadro baja de forma medible (anotar las cifras).
- [ ] Hecha

## T-019 · Grabación cuadro a cuadro (solo si D3 lo aprueba)
- Archivo: `src/lib/grabarLoop.ts`, `package.json` (dependencia nueva).
- Cambio: codificar con `VideoEncoder` (WebCodecs), con marcas de tiempo exactas por cuadro (`n × 1e6 / fps` µs), y empaquetar MP4 con el muxer aprobado. Si el navegador no tiene WebCodecs, se mantiene el camino actual de `MediaRecorder`.
- Verificar: T-001 en el iPad.
- Aceptación: la duración real es igual a la esperada, haya las piezas que haya.
- [ ] Hecha

## Fase 4 · Pulido

## T-015 · Sorpréndeme ordenado
- Archivo: `src/escenario/sorprendeme.ts` (~20-45).
- Cambio:
  - Un solo astro por escena: si ya se eligió Luna o Lluvia, el otro sale de la lista de cielo.
  - La x de cada pieza se limita para que su caja quepa dentro del escenario (usar `pieza(tipo).caja` y la escala).
- Verificar: 30 Sorpréndeme seguidos en Bosque y en Cordillera.
- Aceptación: nunca Luna y Lluvia juntas; ninguna pieza cortada por el borde.
- [ ] Hecha

## T-016 · Editar en play sin saltos
- Archivo: `src/components/EscenarioOrganico.tsx` (`alBajar` ~165, `alMover` ~205).
- Cambio: tocar el lienzo mientras corre el loop lo pausa (como el plan 004: «en pausa se edita»), y desde ahí el gesto sigue igual que en pausa. Así escalar y mover usan siempre el punto A.
- Verificar: con el loop corriendo, tocar y escalar una pieza que camina.
- Aceptación: la pieza no salta; el loop queda en pausa y el botón muestra ▶.
- [ ] Hecha

## T-018 · README al día
- Archivo: `loops/README.md`.
- Cambio: describir la interfaz actual: barra superior (Deshacer, Rehacer, Sorpréndeme, Tarjeta, Grabar loop), barra derecha (Escenario, Biblioteca, Propiedades, Vaciar) y barra inferior (línea de tiempo, FPS, Borde). Agregar también el tope de piezas, «Llévatelo» y cómo medir con `?diag`.
- Aceptación: el README coincide con lo que se ve.
- [ ] Hecha
