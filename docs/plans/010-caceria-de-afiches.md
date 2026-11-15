# 010 · Cacería de afiches y vista Juego en la credencial

Fecha: 13 nov 2026 · Estado: **en construcción** (rama `amaro/caceria-afiches`) · Decide: Amaro (el inventario, acordado con Pipe).

> Se escribió como plan 008; pasó a 010 porque el 008 es la auditoría del Teatro (PR #12). El plan 009 renombra el timbre 3 a «Cacería» y fija los 4 timbres finales.

La credencial es el vehículo del juego: con ella la persona busca los afiches, junta lo que crea en las mesas y canjea el premio. Este plan agrega una **vista Juego** dentro de la credencial y cambia cómo se gana el timbre 3.

## 0. Qué cambia respecto de planes anteriores
| Antes | Ahora | Dónde estaba |
|---|---|---|
| Timbre 3 «Portales AR»: 15 afiches (uno por marco); al escanear se abre un portal y hay que atrapar una figura | **Se simplifica: leer el sello del afiche y listo.** Sin portal ni figura. Los afiches son los 6 de Figma; 3 distintos = timbre 3. | Plan 004 §8, plan 007 §3 |
| El QR del afiche era `#/sello/3?t=<token>&k=<afiche>`: con el token de la estación cualquiera podía inventar `k` | Cada afiche tiene **su propio código secreto**, dentro del **sello de la cacería** que es parte del arte (`SDA:<SECRETO>`, §2). El QR de la estación 3 no se imprime. | Plan 007 §3 |
| En iPhone el QR se leía con la cámara del sistema (abre Safari, que no ve la credencial instalada en la pantalla de inicio) | La cámara vive **dentro de la credencial** y lee el QR con `BarcodeDetector` o, si no existe (iPhone), con **jsQR** (aprobado, solo en `credencial/`). | Plan 003 |
| La credencial: frente ↔ álbum con un toque | Además, **vista Juego** al deslizar (ver §1). | Plan 003 |
| El timbre 2 «Creación» se gana con una creación en una mesa | **Sigue igual.** Se suma el **inventario**: lo que creas en cada mesa llega al momento (§2b). | Plan 005 bloque D |

Fuera de este plan: la **pelea con el jefe final** (otro plan y otro PR) y el timbre 4.

## 1. Vista Juego
- Se llega **deslizando el dedo hacia la derecha** sobre la credencial; se vuelve deslizando hacia la izquierda. La vista Juego entra desde la izquierda. (Si se prefiere al revés, es un solo signo en `credencial/src/lib/deslizar.ts`.)
- Alternativa sin gesto (accesibilidad y para quien no lo descubra): el botón **Jugar** de la credencial y **Mi credencial** en la vista Juego.
- Solo existe con una credencial creada. Ruta `#/juego`. Sin scroll en 390 × 844, 412 × 915 y 360 × 740, como el resto de la credencial. Con «reducir movimiento» no hay deslizamiento animado.
- Contenido:
  1. **Cacería de afiches**: «n de 3», las 3 ranuras con la miniatura de los afiches encontrados y el botón **Buscar afiches** (abre la cámara). Si encontraste más de 3, se cuenta «+n».
  2. **Inventario de creación**: una casilla por experiencia que entrega el timbre 2 (Vagón, Graffiti, Mosaicos, Audioreactiva, Teatro, Grabado, Fotomatón), con su ícono. Se llena al crear algo en esa mesa con tu código. Debajo, si el timbre 2 ya está.
  3. **Código**: lleva a «Timbrar» (`#/escanear`) para los códigos de las mesas. «Timbrar» usa el mismo lector y también reconoce afiches.

## 2. Cacería de afiches (timbre 3)
**Decidido el 13 nov (Amaro): opción C, «el diseño es el código».** Cada afiche lleva el **sello de la cacería**: una marca dibujada con el lenguaje del afiche que la cámara de la credencial lee. No es un QR impreso aparte; es parte del arte.

- **Afiches:** los 6 tentativos de Figma, página «Evento · Imprenta», sección `afiches` (`1044:12794`). Ver el manifiesto `docs/plans/010-caceria/assets.manifest.md`. Hay que encontrar **3 distintos**; el resto es colección.

  | id | Afiche | Lenguaje | Nodo |
  |---|---|---|---|
  | `AF01` | Tejido | Geométrica | `1046:12810` |
  | `AF02` | Ven a ver | Geométrica | `1191:222770` |
  | `AF03` | Sol | Orgánica | `1046:16048` |
  | `AF04` | Ven a crear | Orgánica | `1191:222479` |
  | `AF05` | Metro | Pixel | `1046:17722` |
  | `AF06` | Ven a jugar | Pixel | `1191:217482` |

  Son tentativos: si cambian, se cambia la siembra de la migración antes de correrla (o con `insert`/`update activo` después).
- **Qué codifica el sello:** el texto `SDA:<SECRETO>` (6 letras o números, guardado solo en la base). La cámara lo lee y la base lo valida, así que no se pueden inventar afiches. Bajo el sello va el mismo `SECRETO` escrito, para quien no pueda usar la cámara.
- **Cómo se lee:** por dentro el sello es una matriz QR versión 1 con corrección alta (21 × 21 módulos, aguanta ~30 % de daño), así que lo lee el mismo lector ya aprobado: `BarcodeDetector` donde exista y `jsqr@1.4.0` en iPhone. Se eligió así porque el evento es el 19 nov: un detector propio de marcas sería más libre en lo visual pero mucho más riesgoso.
- **Reglas de diseño del sello** (probadas con jsQR: de frente, a 90 px, inclinado 25°, girado 30°, desenfocado y con poca luz):
  1. La matriz la genera el script `npm --prefix credencial run sellos:afiches` a partir del secreto: **no se redibuja a mano** (cada punto es dato).
  2. Las 3 esquinas guardan su proporción: anillo de 7 × 7 módulos y centro de 3 × 3. Se pueden redondear, pero el centro no puede ser un rombo ni un círculo chico (con rombo no se lee nunca).
  3. **Los módulos vecinos se tocan.** Cada lenguaje tiene su forma: Pixel, cuadrado lleno; Geométrica, octágono (cuadrado con esquinas cortadas); Orgánica, punto de semitono que se toca con sus vecinos. Rombos chicos, puntos chicos o una retícula con aire no se leen al inclinar el afiche.
  4. Tinta oscura sobre fondo claro y liso, con un margen de 3 módulos sin dibujo alrededor. No invertir (claro sobre oscuro).
  5. Tamaño impreso: al menos 10 cm de lado, a la altura de los ojos.
  6. Alrededor, libre: el marco del «sello de la cacería», el número «n / 6» y el texto del afiche (la nota de Figma del 10 nov pide una marca común a los afiches del juego).
- **Límite conocido:** igual que un QR común, no se lee muy inclinado (40°) ni inclinado y girado a la vez. La pantalla de la cámara pide «ponte de frente al sello».
- **Cámara (`#/afiches`):** se queda abierta mientras buscas. Un afiche nuevo avisa «¡Afiche encontrado! 2 de 3» sin salir; al tercero, ceremonia del timbre. Un repetido avisa «Ya tenías este afiche». Un QR de mesa (`#/sello/…`) se atiende como siempre. El enlace `#/afiche/<SECRETO>` sigue funcionando.
- **El QR genérico de la estación 3 nunca se imprimió:** no hace falta rotar su token (se quita ese bloque de la migración).

## 2b. Inventario de creación: al instante
**Decidido el 13 nov (Amaro, acordado con Pipe):** lo que la persona crea en una mesa con su código llega a su inventario **al momento**, sin recargar.
- La credencial escucha la tabla `eventos` con **Supabase Realtime** (ya publicada en `juego.sql`), filtrando por su código. Cada creación aparece en su casilla con una animación de «¡Nuevo!». En modo demo escucha los eventos locales del mismo navegador.
- **Con miniatura** (las mesas ya mandan la imagen con el código): Vagón, Mosaicos y Grabado. Audioreactiva muestra el nombre de la escena.
- **Graffiti:** la credencial ya reconoce el tipo `graffiti`; la miniatura llega cuando se mergee el PR `amaro/inventario-graffiti` (migración `002-eventos-graffiti.sql` y la mesa que publica su imagen). Hasta entonces, solo la casilla.
- **Fotomatón:** manda su tarjeta (migración `004-eventos-foto.sql`), solo con el código y después de que la persona acepta el aviso de las 24 h (plan 009, D8).
- **Solo la casilla, sin miniatura:** Teatro (`loops/`), si su responsable lo pide (Pipe tiene abierto el plan del Teatro).
- La regla del timbre 2 no cambia: una creación basta.

## 3. Datos
**Migración `shared/supabase/migraciones/001-afiches.sql`** (nueva, idempotente; no edita lo ya corrido):
```
afiches   id text pk (AF01…) · nombre · lenguaje · sello (3) · secreto (6, único, aleatorio) · activo
```
- `afiches` sin políticas: el celular no puede leer los secretos (igual que `sellos_def.token`).
- `encontrar_afiche(p_codigo, p_secreto)`: busca el afiche activo por su secreto y llama a `sellar(codigo, sello, token, id_del_afiche)`. En `pasos` queda el **id** público (`AF05`), nunca el secreto. Devuelve lo mismo que `sellar()` más `afiche` y `repetido`.
- `metas()`: id y meta de cada estación (sin el token), para que la credencial muestre «n de 3».
- Siembra los 6 afiches con secretos aleatorios. Para generar los sellos: `select string_agg(id || ':' || secreto || ':' || lenguaje, ',' order by id) from afiches where activo;` (los secretos nunca van al repo).

**Inventario:** se lee de `eventos` con el código de la persona (`timbre` con `datos.app`, `vagon`, `mosaico`, `grabado`, `audio`) y se escucha en vivo (§2b).

**Modo demo** (sin Supabase): el secreto de cada afiche es su id (`AF05`, sello `SDA:AF05`) y los pasos quedan en el celular. Meta de demo: 3 afiches.

## 4. Archivos
| Archivo | Cambio |
|---|---|
| `shared/supabase/migraciones/001-afiches.sql` | nuevo (§3) |
| `credencial/package.json` | `jsqr` |
| `credencial/src/lib/lector.ts` | lector de QR: `BarcodeDetector` → jsQR |
| `credencial/src/lib/deslizar.ts` | gesto horizontal (umbral, sin robar el toque que gira la credencial) |
| `credencial/src/lib/store.ts` | `encontrarAfiche`, `progresoJuego` (afiches, metas, inventario), `escucharCreaciones` (Realtime), pasos en modo demo |
| `credencial/src/pages/Juego.tsx`, `Afiches.tsx`, `Afiche.tsx` | vista Juego, cámara de la cacería y enlace directo |
| `credencial/src/pages/Credencial.tsx`, `Escanear.tsx`, `App.tsx`, `styles.css` | rutas, gesto, botón Jugar, lector común, código de afiche a mano |
| `credencial/scripts/sellos-afiches.mjs` | sellos de la cacería en el estilo de cada lenguaje (`AFICHES=AF01:SECRETO:Geométrica,…`) |
| `credencial/src/lib/afiches.ts`, `credencial/public/figma/afiches/` | catálogo de los 6 afiches con su miniatura de Figma |

## 5. Pendiente fuera del código
- Correr `001-afiches.sql` en `somos-diseno` y anotarlo en el PR y en `shared/supabase/migraciones/README.md`.
- Con los secretos, generar los sellos (`npm --prefix credencial run sellos:afiches`) y ponerlos en los 6 afiches en Figma siguiendo las reglas de §2.
- Imprimir uno de prueba y leerlo con un iPhone y un Android con la luz de la sede **antes** de imprimir todos (plan 003).
- Definir dónde va cada afiche (plano de la sede).

## 6. Verificación (13 nov 2026)
- [x] `npm --prefix credencial run build` en verde.
- [x] Migración probada en Postgres 16 local sobre los tres SQL base, corrida dos veces: afiche válido suma paso, repetido no suma (`repetido: true`), secreto falso o afiche apagado dan `afiche_invalido`, al tercero se otorga el timbre 3, `pasos` guarda el id y nunca el secreto.
- [x] Sin scroll, controles a la vista y toques ≥ 44 px en 390 × 844, 412 × 915 y 360 × 740: credencial, Juego, cámara de la cacería y Timbrar (estación 2 y 3).
- [x] Modo demo con Playwright: deslizar a Juego → la cámara (falsa, con el QR de un afiche) lo lee con **jsQR** → códigos a mano (nuevo, repetido, falso) → al tercero, ceremonia del timbre 3 → enlace `#/afiche/PM02` suma el cuarto («3 de 3 +1») → el inventario muestra solo los recursos de esta credencial.
- [x] Deslizar no gira la credencial, tocar sigue girándola y deslizar hacia el lado contrario no navega.
- [ ] Con Supabase real (`somos-diseno`): falta correr la migración y probarlo en un iPhone y un Android con un afiche impreso.

Arreglo encontrado al verificar: en modo demo, a 360 px la barra superior («Reiniciar» + «Demo») ensanchaba toda la pantalla (también en `main`). Ahora la columna no crece y «Reiniciar» queda solo con su ícono en pantallas angostas.
