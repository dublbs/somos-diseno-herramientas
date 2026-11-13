# 008 · Cacería de afiches y vista Juego en la credencial

Fecha: 13 nov 2026 · Estado: **en construcción** (rama `amaro/caceria-afiches`) · Decide: Amaro (el inventario, acordado con Pipe).

La credencial es el vehículo del juego: con ella la persona busca los afiches, junta lo que crea en las mesas y canjea el premio. Este plan agrega una **vista Juego** dentro de la credencial y cambia cómo se gana el timbre 3.

## 0. Qué cambia respecto de planes anteriores
| Antes | Ahora | Dónde estaba |
|---|---|---|
| Timbre 3 «Portales AR»: al escanear el afiche se abre un portal con el mundo animado y hay que atrapar una figura | **Se simplifica: escanear el afiche y listo.** Sin portal ni figura que atrapar. 3 afiches distintos = timbre 3. | Plan 004 §8, plan 007 §3 |
| El QR del afiche era `#/sello/3?t=<token>&k=<afiche>`: con el token de la estación cualquiera podía inventar `k` | Cada afiche tiene **su propio código secreto**: `#/afiche/<SECRETO>`. El token de la estación 3 deja de imprimirse. | Plan 007 §3 |
| En iPhone el QR se leía con la cámara del sistema (abre Safari, que no ve la credencial instalada en la pantalla de inicio) | La cámara vive **dentro de la credencial** y lee el QR con `BarcodeDetector` o, si no existe (iPhone), con **jsQR** (aprobado, solo en `credencial/`). | Plan 003 |
| La credencial: frente ↔ álbum con un toque | Además, **vista Juego** al deslizar (ver §1). | Plan 003 |
| El timbre 2 «Creación» se gana con una creación en una mesa | **Sigue igual.** Se suma el **inventario**: cada experiencia donde creaste algo queda guardada como recurso. | Plan 005 bloque D |

Fuera de este plan: la **pelea con el jefe final** (otro plan y otro PR) y el timbre 4.

## 1. Vista Juego
- Se llega **deslizando el dedo hacia la derecha** sobre la credencial; se vuelve deslizando hacia la izquierda. La vista Juego entra desde la izquierda. (Si se prefiere al revés, es un solo signo en `credencial/src/lib/deslizar.ts`.)
- Alternativa sin gesto (accesibilidad y para quien no lo descubra): el botón **Jugar** de la credencial y **Mi credencial** en la vista Juego.
- Solo existe con una credencial creada. Ruta `#/juego`. Sin scroll en 390 × 844, 412 × 915 y 360 × 740, como el resto de la credencial. Con «reducir movimiento» no hay deslizamiento animado.
- Contenido:
  1. **Cacería de afiches**: «n de 3», las 3 ranuras con los afiches encontrados (nombre del marco y lenguaje) y el botón **Buscar afiches** (abre la cámara). Si encontraste más de 3, se cuenta «+n».
  2. **Inventario de creación**: una casilla por experiencia que entrega el timbre 2 (Vagón, Graffiti, Mosaicos, Audioreactiva, Teatro, Grabado, Fotomatón), con su ícono. Se llena al crear algo en esa mesa con tu código. Debajo, si el timbre 2 ya está.
  3. **Código**: lleva a «Timbrar» (`#/escanear`) para los códigos de las mesas. «Timbrar» usa el mismo lector y también reconoce afiches.

## 2. Cacería de afiches (timbre 3)
- **Afiches:** los 15 de la sede, uno por marco (plan 004: 5 por lenguaje). El `id` del afiche es el id del marco (`GM01`…`PM06`); de ahí salen su nombre y su lenguaje en la credencial.
- **QR:** `…/credencial/dist/#/afiche/<SECRETO>`. Bajo el QR va el mismo `SECRETO` (6 letras o números) para escribirlo si la cámara no lee.
- **Cámara (`#/afiches`):** se queda abierta mientras buscas. Al leer un afiche nuevo avisa «¡Afiche encontrado! 2 de 3» sin salir; al tercero lleva a la credencial con la ceremonia del timbre. Un afiche repetido avisa «Ya tenías este afiche». Un QR de mesa (`#/sello/…`) se atiende como siempre.
- **Si alguien abre el enlace con la cámara del sistema** (`#/afiche/<SECRETO>` fuera de la app), funciona igual si ese navegador tiene la credencial.
- **Lector:** `BarcodeDetector` donde exista (Android/Chrome); si no, `jsqr@1.4.0` cargado solo cuando hace falta (import dinámico, no pesa en la primera carga).

## 3. Datos
**Migración `shared/supabase/migraciones/001-afiches.sql`** (nueva, idempotente; no edita lo ya corrido):
```
afiches   id text pk (= id del marco) · nombre · lenguaje · sello (3) · secreto (6, único, aleatorio) · activo
```
- `afiches` sin políticas: el celular no puede leer los secretos (igual que `sellos_def.token`).
- `encontrar_afiche(p_codigo, p_secreto)`: busca el afiche activo por su secreto y llama a `sellar(codigo, sello, token, id_del_afiche)`. En `pasos` queda el **id** público (`PM02`), nunca el secreto. Devuelve lo mismo que `sellar()` más `afiche`.
- `metas()`: id y meta de cada estación (sin el token), para que la credencial muestre «n de 3».
- Siembra los 15 afiches con secretos aleatorios. Para imprimir: `select id, nombre, secreto from afiches order by id;` (los secretos nunca van al repo).
- **Opcional, comentado:** rotar el token de la estación 3 si ya se imprimió su QR genérico (con él se podían inventar afiches).

**Inventario:** se lee de `eventos` (tipo `timbre`, `datos.app`, `codigo`), que las mesas ya publican al otorgar el timbre 2 (`shared/juego.ts`, `otorgarCreacion`). No cambia nada en las tablets ni en `shared/`. En modo demo se lee de los eventos locales del mismo navegador.
- Si el equipo decide que el timbre 2 pida **varios** recursos (p. ej. 3 mesas distintas), eso se hace con `pasos`: las mesas mandan `p_clave = app` y se sube `sellos_def.meta` del sello 2. Es otro PR (toca `shared/` y obliga a recompilar las apps de las mesas).

**Modo demo** (sin Supabase): el código del afiche es su id (`#/afiche/PM02`) y los pasos quedan en el celular. Meta de demo: 3 afiches.

## 4. Archivos
| Archivo | Cambio |
|---|---|
| `shared/supabase/migraciones/001-afiches.sql` | nuevo (§3) |
| `credencial/package.json` | `jsqr` |
| `credencial/src/lib/lector.ts` | lector de QR: `BarcodeDetector` → jsQR |
| `credencial/src/lib/deslizar.ts` | gesto horizontal (umbral, sin robar el toque que gira la credencial) |
| `credencial/src/lib/store.ts` | `encontrarAfiche`, `progresoJuego` (afiches, metas, inventario), pasos en modo demo |
| `credencial/src/pages/Juego.tsx`, `Afiches.tsx`, `Afiche.tsx` | vista Juego, cámara de la cacería y enlace directo |
| `credencial/src/pages/Credencial.tsx`, `Escanear.tsx`, `App.tsx`, `styles.css` | rutas, gesto, botón Jugar, lector común, código de afiche a mano |
| `credencial/scripts/qr-afiches.mjs` | QR imprimibles de los afiches (`AFICHES=PM01:SECRETO,…`) |

## 5. Pendiente fuera del código
- Correr `001-afiches.sql` en `somos-diseno` y anotarlo en el PR y en `shared/supabase/migraciones/README.md`.
- Sacar los secretos, generar los QR (`npm --prefix credencial run qr:afiches`) e imprimir los 15 afiches.
- Probar la lectura de un afiche impreso con la luz de la sede, en un iPhone y en un Android.
- Copy de la estación 3 en `shared/juego.ts` («Escanea los afiches de los portales AR» → «Encuentra 3 afiches en la sede»): va en un PR chico de `shared/`.

## 6. Verificación (13 nov 2026)
- [x] `npm --prefix credencial run build` en verde.
- [x] Migración probada en Postgres 16 local sobre los tres SQL base, corrida dos veces: afiche válido suma paso, repetido no suma (`repetido: true`), secreto falso o afiche apagado dan `afiche_invalido`, al tercero se otorga el timbre 3, `pasos` guarda el id y nunca el secreto.
- [x] Sin scroll, controles a la vista y toques ≥ 44 px en 390 × 844, 412 × 915 y 360 × 740: credencial, Juego, cámara de la cacería y Timbrar (estación 2 y 3).
- [x] Modo demo con Playwright: deslizar a Juego → la cámara (falsa, con el QR de un afiche) lo lee con **jsQR** → códigos a mano (nuevo, repetido, falso) → al tercero, ceremonia del timbre 3 → enlace `#/afiche/PM02` suma el cuarto («3 de 3 +1») → el inventario muestra solo los recursos de esta credencial.
- [x] Deslizar no gira la credencial, tocar sigue girándola y deslizar hacia el lado contrario no navega.
- [ ] Con Supabase real (`somos-diseno`): falta correr la migración y probarlo en un iPhone y un Android con un afiche impreso.

Arreglo encontrado al verificar: en modo demo, a 360 px la barra superior («Reiniciar» + «Demo») ensanchaba toda la pantalla (también en `main`). Ahora la columna no crece y «Reiniciar» queda solo con su ícono en pantallas angostas.
