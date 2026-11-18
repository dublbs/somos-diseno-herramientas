# 013 · Correcciones del QA y de la simulación del evento (18 nov)

Fuente: [`docs/qa/simulacion-evento.md`](../qa/simulacion-evento.md) (QA general + simulación como visitante).
Reglas: `AGENTS.md`. Un commit por tarea. Antes de marcar `[x]`: `npm --prefix <app> run build` en verde y la prueba
indicada. Los `dist/` de `main` llevan la configuración pública de Supabase: **no se recompilan sin ella** (ver T-15).

## Correcciones

### T-01 · El botón «Código» de la credencial pasa a llamarse «Timbrar» (B1)
- Archivo: `credencial/src/pages/Juego.tsx` (~l. 135).
- Cambio: el botón que abre `#/escanear` dice «Timbrar» (ícono `approval`), como pide el aviso de las tablets
  (`shared/ui/Juego.tsx:41`).
- Aceptación: desde el aviso «toca Timbrar» se encuentra el botón con ese nombre.
- [x] Hecha

### T-02 · «Te faltan» no pide una creación de más (B3)
- Archivo: `credencial/src/lib/store.ts` (`textoFaltaCanje`, ~l. 279).
- Cambio: si el inventario ya tiene la meta de creaciones y falta el timbre 2, decir «timbrar tu Creación» en vez de
  «1 creación».
- Aceptación: con 4 de 4 en el inventario y sin timbre 2, la línea dice «Te faltan: timbrar tu Creación, …».
- [x] Hecha

### T-03 · El reverso de la credencial muestra el avance y dónde está el inventario (A1)
- Archivos: `credencial/src/pixel/render.ts` (`pintarAlbum`), `credencial/src/pages/Credencial.tsx`.
- Cambio: en los timbres que faltan, el álbum muestra el avance («3 de 4 hechas», «1 de 3 encontrados») en vez de solo
  cómo se gana; la línea bajo la credencial, en el reverso, dice «… · tu inventario está en Jugar».
- Aceptación: con 3 creaciones, el reverso dice «3 de 4»; sin scroll en 360×740.
- [x] Hecha

### T-04 · La creación de la credencial dice para qué sirve (A2)
- Archivo: `credencial/src/pages/Crear.tsx`.
- Cambio: una línea corta: junta 4 timbres y canjea tu bolsa.
- Aceptación: se lee antes de «Crear»; sin scroll en 390×844, 412×915 y 360×740.
- [x] Hecha

### T-05 · La tablet confirma el código y explica cómo sumar (A3, A4 en parte)
- Archivo: `shared/ui/Juego.tsx` (+ estilo en `shared/ui/somos-kit.css`).
- Cambio: al entrar con el código, un aviso de unos segundos: «Juegas con SD-XXXXX. Cuando termines, toca el botón de
  llevártela: así suma a tu credencial.» Así la persona ve el código que escribió.
- Pendiente (decisión): mostrar el nombre de la persona necesita leer la credencial en Supabase desde la tablet.
- Aceptación: aparece al entrar en cada app con el kit; no tapa herramientas; se va solo.
- [x] Hecha

### T-06 · Textos de la cacería al día (A6)
- Archivos: `credencial/src/components/Bienvenida.tsx` (l. 12), `credencial/src/pages/Juego.tsx` (texto de la cacería).
- Cambio: «Busca los afiches de la cacería por la sede y apúntales con la cámara» (sin «con un sello»; desde el PR #29
  se reconocen por su diseño).
- [x] Hecha

### T-07 · Nombres del inventario iguales a los del hub (A7)
- Archivo: `credencial/src/pages/Juego.tsx` (l. 13–16).
- Cambio: «Juego Pixel» → «Hora punta»; «Audio» → «Audioreactiva».
- Aceptación: caben en su casilla en los 3 celulares.
- Al volver a probar se cortaban en 360 px («HORA PUN…»): el nombre ahora usa hasta 2 líneas y «Audio­reactiva» lleva un
  guion opcional.
- [x] Hecha

### T-08 · Recuadro amarillo desplazado sobre el timbre 1 (A8): sin cambio
- Es el aro de tinta del timbre que cae (`.timbre-cae .tinta`, `credencial/src/styles.css`): se agranda y desaparece en
  ~1 s. La captura lo tomó a mitad de la animación. No queda nada después.
- [x] Revisada

### T-09 · «Llévatelo» y «Llévatela» (A10)
- Archivo: `shared/ui/Llevatela.tsx` (l. 61–62).
- Cambio: el diálogo dice «Llévatelo al celular…», igual que el botón de todas las apps. El nombre de la función
  sigue siendo «Llévatela».
- [x] Hecha

### T-10 · Flecha «Volver» de la credencial de 40 a 44 px (QA general)
- Archivo: `credencial/src/styles.css` (`.volver-hub`).
- [x] Hecha

### T-11 · Sin cambio: el flyer cuenta lo que lleva (A5)
- «Hecho con 3 creaciones y 1 afiche» describe las piezas del flyer: se eligen en «2 · Piezas» (hasta 3 creaciones y
  1 afiche). No es un error. Decisión abierta para el equipo: si se quiere que cuente todo lo hecho.
- [x] Revisada

### T-12 · Sin cambio: el aviso «toca Timbrar» en cada tablet (B2)
- Solo aparece cuando la tablet no logró timbrar sola (sin red). En el evento real, sin red, la creación **no** llega
  al celular, así que el paso manual sí hace falta. En la simulación sobró porque todo corría en un mismo navegador.
- [x] Revisada

### T-13 · Para el equipo (no se aplica sin decisión)
- Hub (`index.html`) con scroll en las 6 tablets: ¿se acepta como portada o se compacta?
- Teatro en vertical: «Cordillera» y «Mar» se tocan → `loops/` es de Pipe: avisarle.
- HUB «Estación»: líneas blancas finas entre los carros del tren → investigar en `hub-estacion/`.
- Fotomatón: su botón dice «LLÉVATELA» y su diálogo «Llévatela al celular»; las demás apps dicen «Llévatelo». Elegir una.
- Decisiones abiertas de las ramas (Audioreactiva, Hora punta, Teatro, Fotomatón): ver la bitácora.

### T-15 · Audioreactiva: la «Foto» también suma la creación (nuevo, segunda pasada)
- Archivo: `audioreactiva/src/App.tsx` en la rama `amaro/audioreactiva-tactil` (la versión que va al evento).
- Antes: la foto llevaba al QR pero no sumaba al inventario ni al timbre 2; solo «Grabar loop» sumaba. En `main` pasa
  lo mismo, pero `main` se reemplaza al mergear la rama.
- [x] Hecha (commit `df2cb23` en `amaro/audioreactiva-tactil`, con su `dist/` ya con la configuración del evento)

### T-16 · HUB «Estación»: en vivo, sin personas de prueba por defecto (nuevo, segunda pasada)
- Archivo: `hub-estacion/src/App.tsx`.
- Antes: las 40 personas de prueba salían siempre salvo con `?prueba=0`, y el enlace del hub no lo trae: la pantalla
  del stand habría mezclado gente inventada con la real. Ahora, con Supabase, solo las reales (`?prueba=1` las fuerza).
- Comprobado con una copia apuntada a un Supabase inexistente: «En vivo», 0 personas.
- [x] Hecha

### T-17 · `dist/` de las ramas de la ronda 2 con la configuración del evento (riesgo C2)
- `amaro/hora-punta-iso` (`3402569`), `amaro/teatro-ronda-2` (`296e181`) y `amaro/audioreactiva-tactil` (`df2cb23`):
  recompilados con la URL y la clave públicas del evento. Mergearlas ya no deja a `main` en modo demo.
- [x] Hecha

### T-18 · Para el equipo: migraciones `006-timbre-flyer` y `007-afiche-por-diseno` sin registro
- `shared/supabase/migraciones/README.md` anota como corridas en `somos-diseno` de la `001` a la `006-limpiar-llevatela`,
  pero no la `006-timbre-flyer.sql` ni la `007-afiche-por-diseno.sql`. Sin ellas no hay timbre 4 (Flyer) ni cacería por
  diseño. Confirmar en la base y anotar. (En Postgres local las dos cargan bien y funcionan: ver R-04.)
- [ ] Confirmada por el equipo

### T-19 · Para el equipo: cualquiera puede leer los nombres y códigos de todas las credenciales
- La política «leer credenciales» de `credenciales` es `true` para `anon`: con la clave pública se listan nombres y
  códigos. No da premios (el canje exige el PIN del staff en persona), pero es un tema de privacidad (se borran a las
  24 h). Decidir si se restringe a leer por código.
- [ ] Decidida por el equipo

### T-14 · Recompilar los `dist/` que cambian, con la configuración del evento
- Cambian: `credencial` (T-01–T-08, T-10) y todas las apps que usan `shared/ui/Juego.tsx` o `Llevatela.tsx` (T-05, T-09).
- Hecho: credencial, audioreactiva, fotomaton, grabado, graffiti, juego-pixel, taller-mosaicos y hub-estacion. Cada
  bundle nuevo trae la misma URL y la misma clave que el anterior (comprobado). `loops/` (de Pipe) y `vagon/` (fuera
  del hub) no se recompilaron en `main`; `loops/` ya va recompilado en su rama.
- Ojo al integrar: los `dist/` de audioreactiva y juego-pixel de esta rama son las versiones de `main`; al mergear las
  ramas de la ronda 2 hay que recompilar esas dos (y loops) con el `shared/` de aquí.
- Los `.env.local` no están en el repo. La URL y la clave anónima de Supabase son públicas (van en cada `dist/`):
  se pueden recuperar del `dist/` actual de cada app, comprobando que el `dist/` nuevo traiga exactamente los mismos
  valores. Si alguna app usa otra variable que no se pueda recuperar, su `dist/` no se toca y se anota.
- [x] Hecha

## Volver a comprobar (lo que no se pudo en la simulación)
| # | Qué | Resultado |
|---|---|---|
| R-01 | Audioreactiva, Teatro y Fotomatón en modo juego | ✅ Teatro («Tarjeta») y Fotomatón («Llévatela») suman. Audioreactiva: el loop sí, la foto no → T-15 (corregido). |
| R-02 | El staff activa el modo juego desde «Staff» | ✅ PIN equivocado: «PIN incorrecto»; correcto: interruptor «Modo juego», vuelve y pide el código. |
| R-03 | Varias personas | ✅ Tras 8 s sin uso (`?quiosco=8`) la tablet vuelve a pedir el código: la siguiente persona no hereda el anterior. Tomás y Ana en la misma tablet: cada creación queda con su código. |
| R-04 | Reglas del servidor (Postgres 16 local, esquema + migraciones 001–007, como `anon`) | ✅ Inscripción automática; Creación cae con 4 apps distintas y no cuenta repetidas; código inexistente → `credencial_no_existe`; token equivocado → `token_invalido`; Cacería con 3 afiches (por diseño o secreto), repetido no suma; flyer exige afiche y no se repite; canje: PIN malo → `pin_incorrecto`, incompleta → `credencial_incompleta`, segundo → `ya_canjeado`, sin stock → `sin_stock`. Desde `anon` no se leen tokens, secretos ni PIN, ni se da timbres, ni toca stock. Hallazgos: T-18 y T-19. |
| R-05 | HUB sin personas de prueba en vivo | ❌ → T-16 (corregido) |
| R-06 | PC madre (`admin/`) | ⏳ No se pudo: necesita Supabase Auth (cuentas del staff). Queda para la prueba general. |
| R-07 | Tablets, celulares, Safari, afiches impresos, sonido | ⏳ Solo personas (prueba general del 18). |
| R-08 | Barrido de pantalla después de las correcciones | ✅ 6 tablets × cada herramienta y 3 celulares: sin scroll, sin controles fuera, toques ≥ 44 px (la credencial ya cumple). Solo el hub sigue con scroll (T-13). |
| R-09 | Recorrido completo con las correcciones (Tomás, 360×740) | ✅ Crear → 4 creaciones → «Te faltan: timbrar tu Creación» → Timbrar → Cacería por cámara → flyer → 4 de 4 → canje. |
