# Simulación del evento como visitante (18 nov 2026)

Recorrido de una persona que llega **sin saber nada**: solo toca lo que ve en pantalla y lee los textos.
Objetivo: encontrar lo que falta antes del 19 nov.

## Cómo se hizo
- Integración local (sin subir) de `main` + `amaro/hora-punta-iso` + `amaro/audioreactiva-tactil` + `amaro/teatro-ronda-2`,
  con los `dist/` compilados en **modo demo** (sin Supabase).
- Un solo navegador Chromium (Playwright) hace de «red del evento»: el celular (390×844) y las tablets (1180×820) son
  pestañas del mismo navegador, así que comparten `localStorage` y `BroadcastChannel`, como el modo demo de `shared/datos.ts`.
- El staff deja las tablets en modo juego (`sd:config-mesa` con `modoJuego: true`); eso se configuró por fuera.
- Cada paso guarda una captura; las más útiles están en `docs/qa/simulacion/`.
- **El visitante no sabe que existe Supabase.** En el evento real la red y la base funcionan y él nunca ve el modo demo.
  Por eso los hallazgos se separan en: lo que ve cualquier visitante (A), lo que solo ve si se cae la red, que es lo que
  muestra el modo demo de esta simulación (B), y lo que es trabajo del equipo y el visitante no ve (C).
- Simulador: `servidor.cjs` (Playwright manejado por HTTP, una pestaña por equipo). Para la cacería, una cámara falsa
  (`--use-file-for-fake-video-capture`) que muestra los afiches AF05, AF01 y AF03 de `credencial/public/figma/afiches/`,
  5 s cada uno, sobre una pared gris. Entre medio se reinició el navegador conservando el `localStorage` del celular.

## Bitácora

### 1. Llego y creo mi credencial (celular)
- Abro la credencial (supuesto: un QR en la entrada).
- Pantalla: «Credencial», vista previa del marco, pestañas «1 · Marco» y «2 · Foto o personaje», campo de nombre y «Crear».
- ⚠️ **No dice para qué sirve la credencial ni que hay un juego con premio.** Hasta crearla no sé qué gano.
- Elijo el Pingüino, escribo «Camila» y toco «Crear» → timbre «Inscripción» (1 de 4) y mi código `SD-QL9AQ`.
- Al cerrar el timbre aparece **«Tu recorrido»** (3 tarjetas): crear en 4 tablets con el código, cazar 3 afiches,
  armar el flyer y canjear la bolsa con los 4 timbres. Se entiende bien.
- ⚠️ La tarjeta 2 dice «afiches **con un sello**… apúntales». Desde el PR #29 la cacería reconoce el afiche por su
  diseño con la cámara: revisar si el texto quedó atrasado.
- 🔸 En la credencial, un recuadro amarillo desplazado sobre el timbre 1 se sale del borde de la tarjeta.

### 2. Primera tablet: Graffiti
- La tablet muestra «Modo juego · Graffiti y Tags»: «Escribe el código de tu credencial», con la ayuda
  «está bajo tu nombre, en la credencial del celular». Opciones: Entrar, Jugar sin credencial, Staff.
- El texto explica bien qué pasa con y sin credencial.
- Escribo el código en minúsculas y sin guion (`ql9aq`): lo acepta. Con un código incompleto avisa «El código tiene la
  forma SD-XXXXX».
- ⚠️ **No confirma de quién es el código** (no dice «Hola, Camila»). Con una letra equivocada juego para otra persona
  sin enterarme. En modo demo no se puede validar; con Supabase convendría.
- Pintar se entiende solo («Pinta con el dedo. Lento, chorrea.»).
- ⚠️ **No sé cómo terminar para que cuente.** Nada en pantalla dice que juego con mi credencial ni que «Llévatelo» suma
  la creación. Lo toco porque es el único botón grande.
- Al tocar «Llévatelo» sale «Tu muro está listo» y encima «¡Creación lista!».
- ❗ **Sin Supabase, el aviso pide un paso que no existe a la vista:** «En tu credencial toca **Timbrar**, elige la
  estación 2 y escribe el código: DEMO». La credencial no muestra ningún «Timbrar»: solo Jugar, Guardar y Simular
  (está dentro de `#/escanear`). Y en modo demo el paso manual **sobra**, porque la creación ya llegó sola al
  inventario. Es el modo de respaldo si falla la red en el evento: hay que arreglar ese texto (`shared/ui/Juego.tsx:41`).

### 3. Miro mi celular: ¿dónde está mi inventario?
- La creación de Graffiti **llegó sola**: «Jugar» → «Inventario de creación 1 de 4 · Graffiti: lo creaste».
- ❗ **El inventario no se encuentra.** Lo natural es buscarlo en el reverso de la credencial («toca para ver el álbum»),
  pero ahí está el álbum de timbres y el de Creación solo dice «Crea en 4 experiencias», **sin avance**, aunque ya
  llevo 3. El avance real («3 de 4») solo aparece en «Jugar».
  Propuesta: mostrar el avance en el reverso («3 de 4», «1 de 3 afiches») con un enlace «Ver mi inventario», o llevar el
  inventario al reverso.
- 🔸 Nombres distintos: el inventario dice «Juego Pixel» y «Audio»; el hub dice «Hora punta» y «Estación Audioreactiva».

### 4. Segunda tablet: Taller de Mosaicos
- Mismo ingreso con código. «Sorpréndeme» arma un mosaico al tiro.
- «Llévatelo» → «Generar QR»: «Sin conexión al servidor: este QR solo abre en esta tablet». Correcto en demo.
- El mismo aviso «toca Timbrar… DEMO» aparece de nuevo.

### 5. Tercera tablet: Hora punta
- Ingreso con código y tutorial de 3 pasos claro (cruce, andén, jefe).
- Juego como un novato: solo aprieto «Avanzar». Me atropellan en la fila 8 con 1 lata: «Se te pasó la hora punta».
- Igual cuenta como creación: llega «¡Creación lista!» y mi mural al inventario (3 de 4). Bien: perder no deja a nadie
  sin su paso.

### 6. Cuarta tablet: Taller de Grabado
- Toco el papel → el taco aparece ahí con manijas y ✓ / ✕. «Llévatelo» queda apagado hasta estampar. Muy claro.
- Me lo llevo: el celular avisa «¡Llegó tu Grabado al inventario!» → **Inventario 4 de 4**.
- ❗ **Pero el timbre Creación no cae** (sigo en 1 de 4 timbres) y la misma pantalla dice **«Te faltan: 1 creación»**,
  al lado de «4 de 4». En modo demo el timbre 2 solo llega con el paso manual; además el texto de «Te faltan» pide
  siempre al menos 1 creación mientras no esté el timbre (`credencial/src/lib/store.ts:279`). Con Supabase lo otorga la
  tablet al tiro, pero si falla la red en el evento, la persona ve «4 de 4» y «te falta 1».
- Busco el «Timbrar» que pedía la tablet: está detrás del botón **«Código»** de la vista Juego (`#/escanear`), con la
  estación 2 ya elegida. Escribo `DEMO` → «¡Timbre Creación! 2 de 4».
  Propuesta: que la tablet diga «toca **Código**» (o que el botón se llame «Timbrar»), y en modo sin red que la
  credencial otorgue el timbre 2 sola al llegar a 4 de 4 en el inventario.

### 7. Cacería de afiches
- «Jugar» → «Buscar afiches» abre la cámara con un marco y «Encuadra el afiche completo, de frente».
- Con una cámara falsa que muestra los afiches Metro, Tejido y Sol (los `.webp` de la credencial sobre una pared gris),
  los reconoce por su diseño en ~10 s: «¡Afiche encontrado! 2 de 3» → **«¡Timbre Cacería!» 3 de 4**.
  (Falta probarlo con los afiches impresos, la luz de la sede y celulares reales.)

### 8. Tu flyer (timbre 4)
- La tarjeta «Tu flyer» ahora dice «Ármalo con lo que juntaste y gana el timbre 4 · Abrir».
- El flyer sale armado al tiro, con mi pingüino, mi nombre y mis piezas. Se ve muy bien.
- 🔸 El sello dice **«Hecho con 3 creaciones y 1 afiche»**, pero hice 4 creaciones y encontré 3 afiches. Muestra 4 piezas
  (Hora punta, el afiche Sol, Mosaicos y Grabado); **falta el Graffiti**. Que el texto cuente lo que hice, no lo que cabe.
- «Guardar mi flyer» → **«¡Credencial completa! 4 de 4»** y «Ya puedes canjear tu bolsa».

### 9. Canje
- Botón «Canjear» → pantalla «Canje del premio» con mi código y nombre: «Pídele al equipo que escriba su PIN».
- Como staff escribo el PIN de demo `0000` → **«¡Canjeado!»**. Si vuelvo a entrar, sigue «¡Canjeado!» (no deja un
  segundo canje).
- 🔸 En demo, el botón ↻ «Reiniciar la demo» permite crear otra credencial y canjear de nuevo. En el evento lo frenan
  Supabase (`canjear()` con PIN en el servidor y stock): **no usar el modo demo para el canje real**.

### 10. Pantallas del stand
- HUB «Estación» (1920×1080): «**CAMILA llegó a la estación**», personas 41, completas 4 (40 son de prueba). Funciona.
- PC madre (`admin/`): «Este panel necesita el proyecto de Supabase del evento». Sin Supabase no hay panel: no se pudo
  simular el lado del staff (cuentas, mesas, stock, avisos).

## Resumen de hallazgos

### A · Lo que ve cualquier visitante (con red y sin red)
| # | Qué | Dónde | Prioridad |
|---|---|---|---|
| A1 | **El inventario no se encuentra.** Lo natural es buscarlo en el reverso de la credencial («toca para ver el álbum»), pero ahí está el álbum de timbres, sin avance: Creación dice «Crea en 4 experiencias» aunque ya llevo 3. El avance real solo está en «Jugar». Propuesta: avance por timbre en el reverso («3 de 4», «1 de 3 afiches») y enlace «Ver mi inventario», o el inventario en el reverso. | `credencial/` (álbum y vista Juego) | ⚠️ |
| A2 | Antes de crear la credencial nada dice para qué sirve ni que hay un juego con premio (la bolsa). Se entiende recién en «Tu recorrido». | `credencial/` (pantalla de creación) | ⚠️ |
| A3 | En la tablet no se ve que juego con mi credencial (ni mi código) ni que «Llévatelo» es lo que suma la creación. | `shared/ui/Juego.tsx` o barra superior de cada app | ⚠️ |
| A4 | La tablet no confirma de quién es el código (no dice «Hola, Camila»): con una letra equivocada sumo a otra persona sin enterarme. Por verificar qué pasa con Supabase si el código no existe. | `shared/ui/Juego.tsx` | ⚠️ |
| A5 | El flyer dice «Hecho con 3 creaciones y 1 afiche» cuando fueron 4 creaciones y 3 afiches; muestra 4 piezas y falta el Graffiti. Que el texto cuente lo hecho, no lo que cabe. | `credencial/src/pages/Flyer.tsx` | 🔸 |
| A6 | «Tu recorrido» (tarjeta 2) dice «afiches con un sello… apúntales», pero desde el PR #29 se reconocen por su diseño. | `credencial/src/components/Bienvenida.tsx` | 🔸 |
| A7 | Nombres distintos: el inventario dice «Juego Pixel» y «Audio»; el hub, «Hora punta» y «Estación Audioreactiva». | `credencial/` (inventario) | 🔸 |
| A8 | Recuadro amarillo desplazado sobre el timbre 1 del frente de la credencial; se sale del borde de la tarjeta. | `credencial/` | 🔸 |
| A9 | «Tu recorrido» aparece un momento después de cerrar el timbre de Inscripción, no junto con él. Funciona, solo anotarlo. | `credencial/src/pages/Credencial.tsx:140` | — |
| A10 | El botón de exportar dice «Llévatelo» y el diálogo «Llévatela al celular»; el hub y los planes dicen «Llévatela». | apps con el kit | 🔸 |

### B · Solo si se cae la red (lo que mostró el modo demo)
Es el respaldo del evento: si la tablet no logra timbrar sola, la persona timbra a mano. Hoy ese camino confunde.
| # | Qué | Dónde | Prioridad |
|---|---|---|---|
| B1 | La tablet dice «En tu credencial toca **Timbrar**, elige la estación 2 y escribe el código», pero en la credencial ese botón se llama **«Código»** (vista Juego → `#/escanear`). | `shared/ui/Juego.tsx:41`, `credencial/src/pages/Juego.tsx` | ❗ |
| B2 | El aviso aparece en cada experiencia aunque la creación ya llegó sola al inventario: pide un paso que en ese caso sobra. | `shared/ui/Juego.tsx` | ⚠️ |
| B3 | Con 4 creaciones, el inventario dice «4 de 4» y al lado «Te faltan: 1 creación»; el timbre Creación no cae hasta timbrar a mano. Propuesta: que la credencial otorgue el timbre 2 sola al llegar a 4 de 4 sin red, o que el texto diga «Timbra con el código de la estación 2». | `credencial/src/lib/store.ts:279` | ❗ |
| B4 | El QR de «Llévatela» avisa «Sin conexión al servidor: este QR solo abre en esta tablet». Correcto y honesto. | `shared/ui/Llevatela.tsx` | — |
| B5 | En demo, el botón ↻ «Reiniciar la demo» deja crear otra credencial y canjear de nuevo. Con Supabase lo frenan `canjear()`, el PIN en el servidor y el stock. | `credencial/` | — |

### C · Para el equipo (el visitante no lo ve)
| # | Qué | Prioridad |
|---|---|---|
| C1 | Supabase del evento: migraciones `001`–`007` en orden, `fotomaton/supabase/migrations/0001_fotomaton.sql` una vez, funciones `tarjeta`, `limpiar` y `notificar`. Sin eso no hay timbres entre equipos, QR entre celulares ni PC madre (tarea H1). | ❗ Bloquea |
| C2 | Los `dist/` de `juego-pixel`, `audioreactiva` y `loops` de las ramas de la ronda 2 están en modo demo. Si se mergean así, Teatro **pierde** la conexión que hoy tiene en `main`. Recompilar con cada `.env.local` antes de mergear. | ❗ |
| C3 | PC madre (`admin/`): sin Supabase solo dice «Este panel necesita el proyecto de Supabase». No se pudo simular el lado del staff: cuentas, mesas, stock, avisos ni canje desde el panel. | ⚠️ |
| C4 | PIN real del staff (en demo es `0000`) y stock del premio (tarea H4). | ❗ |
| C5 | El HUB «Estación» muestra «con personas de prueba» (40 inventadas). Confirmar que con Supabase salen solo las reales. | ⚠️ |
| C6 | Las tablets se dejan en modo juego desde «Staff» con el PIN; en la simulación se hizo por fuera. Probar ese paso en la prueba general. | ⚠️ |

## QA general del 18 nov (integración `main` + las 3 ramas, antes de la simulación)
- Las 3 ramas (`amaro/hora-punta-iso`, `amaro/audioreactiva-tactil`, `amaro/teatro-ronda-2`) se unen a `main` sin
  conflictos. Las 11 apps pasan `tsc` y `vite build`. Pruebas de motor de Hora punta: 41 de 41.
- Pantalla en 1024×768, 1180×820, 1280×720, 1366×768, 768×1024 y 820×1180: sin scroll de página, sin controles fuera
  de vista y con toques ≥ 44 px en todas las apps. Mosaicos, Graffiti, Audioreactiva y Grabado, con cada herramienta
  activa (7–18 estados por resolución). Fotomatón, Teatro y Hora punta: al entrar, revisados por captura.
- Credencial en 390×844, 412×915 y 360×740: sin scroll.
- Sin errores de consola ni archivos rotos en ninguna app, tampoco en el HUB «Estación», el PC madre y el Vagón.
- Detalles:
  - El **hub** (`index.html`) tiene scroll en las 6 tablets: la mitad de los «Entrar» queda bajo el borde. Viene de
    `main` (el archivo no cambió). Decidir si se acepta como portada o se compacta.
  - La flecha «Volver a las experiencias» de la credencial mide 40×40 (la regla pide ≥ 44). Viene de `main`.
  - Teatro en vertical (768×1024): los botones «Cordillera» y «Mar» se tocan.
  - HUB «Estación»: líneas blancas finas entre los carros del tren.
- No probado: recorrido de modo juego de Audioreactiva, Teatro y Fotomatón; tablets, celulares y Safari reales.

## Decisiones abiertas que dejaron las ramas
- **Audioreactiva:** nadie ha escuchado los 5 estilos (Lo-Fi, Synthwave, Button Mash, It's Friday, Ambient). Medidos:
  RMS entre −16,5 y −18,6 dBFS, sin saturar. Apagar el bajo o los acordes cambia la forma pero casi no la cantidad de
  movimiento; cambiarlo afecta todas las escenas.
- **Hora punta:** el jefe dura 31–44 s (el plan pedía 60–90); un jugador distraído gana 70 de 100; el Inacapín ahora
  empuja en vez de quitar vidas (validar); el personaje del Inacapín lo debe validar el equipo (no se buscó en Figma).
  En CPU lenta el cruce baja a ~37 cuadros por segundo: probar en la tablet.
- **Teatro:** sigue con el modal antiguo de exportar (pasar a «Llévatela», plan 008 T-006); el guanaco no pasta (cuello
  de una pieza); el huemul parte café en vez de morado (confirmar); el arte nuevo son bocetos generados; elecciones del
  elenco pendientes (Chagual o Cochayuyo, Carpintero o Chucao, Luna o Lluvia); la paloma no aparece en ningún escenario.
- **Fotomatón:** falta pasarlo al kit v2 (`Camara.tsx` y `Editor.tsx`).

## Cierre
**Lo que funcionó bien:** crear la credencial, «Tu recorrido», el ingreso con código (acepta minúsculas y avisa si está
incompleto), las 4 experiencias, que perder en Hora punta igual cuente, la llegada al inventario en tiempo real, el
reconocimiento de afiches por cámara, el flyer, el canje sin doble entrega y el HUB mostrando a la persona.

**No simulado:** Audioreactiva, Teatro y Fotomatón en modo juego; el lado del staff en el PC madre; varias personas a la
vez; tablets y celulares reales; Supabase. Las capturas de esta bitácora están en `docs/qa/simulacion/`.
