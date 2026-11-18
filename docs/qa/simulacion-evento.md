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

## Resumen: lo que falta, por prioridad

| # | Qué | Dónde | Prioridad |
|---|---|---|---|
| 1 | Correr las migraciones `001`–`007` + Fotomatón, desplegar funciones y compilar los `dist/` con `.env.local`. Sin eso no hay timbres entre equipos, ni QR entre celulares, ni panel del staff. | Personas (H1) | ❗ Bloquea |
| 2 | El aviso de la tablet pide «toca Timbrar», pero el botón se llama «Código». | `shared/ui/Juego.tsx:41`, `credencial/src/pages/Juego.tsx` | ❗ |
| 3 | Sin red: inventario «4 de 4» y «Te faltan: 1 creación» a la vez; el timbre 2 no cae solo. | `credencial/src/lib/store.ts:279` | ❗ (respaldo) |
| 4 | El inventario no se encuentra; el reverso no muestra avance de cada timbre. | `credencial/` (álbum) | ⚠️ |
| 5 | La credencial no dice para qué sirve ni que hay premio antes de crearla. | `credencial/` (portada) | ⚠️ |
| 6 | En la tablet no se ve que juego con credencial ni que «Llévatelo» suma la creación. | `shared/ui/Juego.tsx` o barra de cada app | ⚠️ |
| 7 | La tablet no confirma de quién es el código (un error de tipeo suma a otra persona). | `shared/ui/Juego.tsx` + Supabase | ⚠️ |
| 8 | El flyer dice «3 creaciones y 1 afiche» cuando fueron 4 y 3; falta el Graffiti. | `credencial/src/pages/Flyer.tsx` | 🔸 |
| 9 | «Tu recorrido» dice «afiches con un sello», pero ahora se reconocen por su diseño. | `credencial/src/components/Bienvenida.tsx` | 🔸 |
| 10 | Nombres distintos: «Juego Pixel» / «Audio» en el inventario; «Hora punta» / «Audioreactiva» en el hub. | `credencial/` | 🔸 |
| 11 | Recuadro amarillo desplazado sobre el timbre 1 de la credencial. | `credencial/` | 🔸 |

**Lo que funcionó bien:** crear la credencial, «Tu recorrido», el ingreso con código (acepta minúsculas y avisa si está
incompleto), las 4 experiencias, que perder en Hora punta igual cuente, la llegada al inventario en tiempo real, el
reconocimiento de afiches por cámara, el flyer, el canje sin doble entrega y el HUB mostrando a la persona.

**No simulado:** Audioreactiva, Teatro y Fotomatón en modo juego; el lado del staff en el PC madre; varias personas a la
vez; tablets y celulares reales; Supabase. Las capturas de esta bitácora están en `docs/qa/simulacion/`.
