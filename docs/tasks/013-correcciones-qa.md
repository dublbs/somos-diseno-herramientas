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
- [ ] Hecha

### T-02 · «Te faltan» no pide una creación de más (B3)
- Archivo: `credencial/src/lib/store.ts` (`textoFaltaCanje`, ~l. 279).
- Cambio: si el inventario ya tiene la meta de creaciones y falta el timbre 2, decir «timbrar tu Creación» en vez de
  «1 creación».
- Aceptación: con 4 de 4 en el inventario y sin timbre 2, la línea dice «Te faltan: timbrar tu Creación, …».
- [ ] Hecha

### T-03 · El reverso de la credencial muestra el avance y dónde está el inventario (A1)
- Archivos: `credencial/src/pixel/render.ts` (`pintarAlbum`), `credencial/src/pages/Credencial.tsx`.
- Cambio: en los timbres que faltan, el álbum muestra el avance («3 de 4 hechas», «1 de 3 encontrados») en vez de solo
  cómo se gana; la línea bajo la credencial, en el reverso, dice «… · tu inventario está en Jugar».
- Aceptación: con 3 creaciones, el reverso dice «3 de 4»; sin scroll en 360×740.
- [ ] Hecha

### T-04 · La creación de la credencial dice para qué sirve (A2)
- Archivo: `credencial/src/pages/Crear.tsx`.
- Cambio: una línea corta: junta 4 timbres y canjea tu bolsa.
- Aceptación: se lee antes de «Crear»; sin scroll en 390×844, 412×915 y 360×740.
- [ ] Hecha

### T-05 · La tablet confirma el código y explica cómo sumar (A3, A4 en parte)
- Archivo: `shared/ui/Juego.tsx` (+ estilo en `shared/ui/somos-kit.css`).
- Cambio: al entrar con el código, un aviso de unos segundos: «Juegas con SD-XXXXX. Cuando termines, toca el botón de
  llevártela: así suma a tu credencial.» Así la persona ve el código que escribió.
- Pendiente (decisión): mostrar el nombre de la persona necesita leer la credencial en Supabase desde la tablet.
- Aceptación: aparece al entrar en cada app con el kit; no tapa herramientas; se va solo.
- [ ] Hecha

### T-06 · Textos de la cacería al día (A6)
- Archivos: `credencial/src/components/Bienvenida.tsx` (l. 12), `credencial/src/pages/Juego.tsx` (texto de la cacería).
- Cambio: «Busca los afiches de la cacería por la sede y apúntales con la cámara» (sin «con un sello»; desde el PR #29
  se reconocen por su diseño).
- [ ] Hecha

### T-07 · Nombres del inventario iguales a los del hub (A7)
- Archivo: `credencial/src/pages/Juego.tsx` (l. 13–16).
- Cambio: «Juego Pixel» → «Hora punta»; «Audio» → «Audioreactiva».
- Aceptación: caben en su casilla en los 3 celulares.
- [ ] Hecha

### T-08 · Recuadro amarillo desplazado sobre el timbre 1 (A8)
- Archivo: `credencial/` (investigar: foco del botón que gira la credencial o el timbre que cae).
- Aceptación: después de cerrar el timbre no queda ningún recuadro fuera de la tarjeta.
- [ ] Hecha

### T-09 · «Llévatelo» y «Llévatela» (A10)
- Archivo: `shared/ui/Llevatela.tsx` (l. 61–62).
- Cambio: el diálogo dice «Llévatelo al celular…», igual que el botón de todas las apps. El nombre de la función
  sigue siendo «Llévatela».
- [ ] Hecha

### T-10 · Flecha «Volver» de la credencial de 40 a 44 px (QA general)
- Archivo: `credencial/src/styles.css` (`.volver-hub`).
- [ ] Hecha

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
- Decisiones abiertas de las ramas (Audioreactiva, Hora punta, Teatro, Fotomatón): ver la bitácora.

### T-14 · Recompilar los `dist/` que cambian, con la configuración del evento
- Cambian: `credencial` (T-01–T-08, T-10) y todas las apps que usan `shared/ui/Juego.tsx` o `Llevatela.tsx` (T-05, T-09).
- Los `.env.local` no están en el repo. La URL y la clave anónima de Supabase son públicas (van en cada `dist/`):
  se pueden recuperar del `dist/` actual de cada app, comprobando que el `dist/` nuevo traiga exactamente los mismos
  valores. Si alguna app usa otra variable que no se pueda recuperar, su `dist/` no se toca y se anota.
- [ ] Hecha

## Volver a comprobar (lo que no se pudo en la simulación)
| # | Qué | Cómo |
|---|---|---|
| R-01 | Audioreactiva, Teatro y Fotomatón en modo juego (código → crear → llevarse → inventario) | Simulador, modo demo |
| R-02 | El staff pone una tablet en modo juego desde «Staff» con el PIN | Simulador, modo demo |
| R-03 | Varias personas a la vez (códigos distintos, sin mezclarse) | Simulador, modo demo |
| R-04 | Reglas del servidor: Creación con meta 4, Cacería 3, Flyer con ≥ 1 creación y ≥ 1 afiche, canje con PIN, stock y sin doble entrega, código que no existe | Postgres 16 local con `juego.sql` y las migraciones |
| R-05 | HUB «Estación» sin personas de prueba cuando hay Supabase | Leer `hub-estacion/` |
| R-06 | PC madre (`admin/`) | Necesita Supabase Auth: anotar qué queda sin probar |
| R-07 | Tablets, celulares y Safari reales; afiches impresos; sonido de Audioreactiva | Solo personas (prueba general) |
