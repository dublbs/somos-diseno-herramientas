# QA de la base de datos · 19 nov 2026

Pedido: «que todos los errores en los juegos que tengan que ver con la base y los códigos queden resueltos; QA solo de
endpoints e interacciones múltiples con la base». Correcciones: [`docs/tasks/015-correcciones-base.md`](../tasks/015-correcciones-base.md).

## Cómo se probó
- **Base:** Postgres 16 local montado desde cero con la cadena completa del repo, en el orden de `docs/supabase.md`
  (`credencial/supabase/schema.sql` → `eventos.sql` → `juego.sql` → Fotomatón → migraciones 001–011). Un stub imita lo
  que trae Supabase: roles `anon` y `authenticated`, `auth.uid()`, pgcrypto en el esquema `extensions`, `cron`, `net`,
  `storage` y los privilegios por defecto (`anon` puede ejecutar las funciones nuevas). La cadena completa corre sin errores.
- **Cada llamada con el rol real:** celular y tablet como `anon`; PC madre como `authenticated` con una cuenta admin,
  una «mesa» y una sin aprobar.
- **Scripts (se pueden volver a correr):** `scripts/qa-base/correr.sh` (necesita un Postgres local; `PGHOST`/`PGPORT`).
  - `10-endpoints.sql`: 113 casos de endpoints.
  - `20-concurrencia.sh`: interacciones a la vez (procesos `psql` en paralelo, las carreras ×10).
  - `30-tablet.cjs`: Graffiti compilado en Playwright contra la base `qa` (sirviendo la raíz del repo en :8104).
- **No probado:** el Supabase real (sin acceso), Storage y las funciones Edge (`notificar`, `tarjeta`, `limpiar`) y Realtime.

## Endpoints probados (todos pasan con la 011)
| Grupo | Casos |
|---|---|
| Credencial (celular) | crear (formato del código, timbre 1 automático, nombre vacío o de 15), leer, intentos de editar/borrar/marcarse canjeado |
| Seguridad `anon` | no puede: darse timbres, escribir pasos, insertarse un canje, cambiar stock, leer el PIN, los tokens, los secretos de afiches, el staff, las suscripciones o las sesiones; no puede ocultar del HUB, recargarlo, ver el resumen, aprobar staff ni empezar de cero |
| `sellar()` | estación 1 y 2, token malo, credencial que no existe, minúsculas, **espacios**, misma experiencia dos veces, firma vieja, sello inexistente |
| Cacería | `encontrar_afiche()` válido, repetido, minúsculas, inválido, credencial inexistente; `reconocer_afiche()`; el 3.er afiche da el timbre 3 |
| Flyer | sin creación o sin afiche, credencial inexistente, otorgado, repetido |
| Canje | sin PIN, PIN malo, incompleta, completa, dos veces, minúsculas, inexistente; staff sin PIN; cuenta sin aprobar |
| Tablet | `config_mesas()`, `verificar_pin_staff()` (bien, mal, null), sesión de mesa, timbre con el token de la base |
| Jugar con QR | emparejar, leer, mesa ocupada, la misma persona dos veces (con minúsculas), código inexistente, nonce malo |
| HUB | los 9 tipos de evento, tipo desconocido, sin código, imagen > 300 KB, `anon` no borra ni edita |
| PC madre | mesa: timbres, canje, resumen, avisos, sin borrar ni cambiar stock/config; admin: stock, modo juego, cuentas, empezar de cero, borrar credencial (sale del HUB) |

## Hallazgos
| # | Qué pasaba | Gravedad | Prueba | Estado |
|---|---|---|---|---|
| B1 | **Las tablets rechazaban ~49 % de los códigos reales**: la base los genera en hexadecimal (0–9, A–F) y las tablets solo aceptaban A–Z y 2–9 | Crítica | 3 códigos en Graffiti compilado | Arreglado (también en #49) |
| B2 | **Códigos repetidos**: 16⁵ ≈ 1 M códigos sin revisar si existían. Con 1000 personas, 38 % de probabilidad de que a alguien le falle «Crear credencial» (85 % con 2000). En la prueba, un lote de 1000 falló por un choque | Alta | M7 | Arreglado (011 + reintento en el celular) |
| B3 | **4 tablets timbran a la misma persona a la vez → nadie entrega el timbre 2** (cada una cuenta sin ver a las otras). Pasaba 5 de 10 veces; con 3 afiches a la vez, 1 de 10 | Alta | M1, M1b ×10 | Arreglado (011, `for update`) + reparación de los que ya quedaron así |
| B4 | **Código mal escrito en la tablet**: con la forma correcta pero inexistente, dejaba jugar y nada sumaba (ni avisaba) | Alta | 30-tablet paso 1 | Arreglado (la tablet pregunta a la base) |
| B5 | **Dos celulares escanean el mismo QR a la vez**: a los dos les decía «listo», pero la tablet juega con uno (3 de 10) | Media | M5 ×10 | Arreglado (011) |
| B6 | **Si el timbre fallaba** (red, token): la experiencia quedaba como ganada en esa sesión (no se reintentaba) y al HUB llegaba un «timbre» falso | Media | 30-tablet pasos 4–5 | Arreglado (`otorgarCreacion`) |
| B7 | Canje simultáneo de la misma persona (celular + PC madre): la segunda respuesta era `duplicate key` en vez de «ya canjeado» | Baja | M4 | Arreglado (011) |
| B8 | `sellar()` y `canjear()` no aceptaban el código con espacios | Baja | C6e | Arreglado (011) |
| B9 | `suscribir_push()` con un código inexistente guardaba una suscripción huérfana sin error | Baja | C11b | Arreglado (011) |
| B10 | Al HUB llegaban eventos de credenciales que no existen (borradas o mal escritas) | Baja | M8, X2 | Arreglado (011, política de `eventos`) |

## Lo que ya estaba bien
- Stock con 1 premio y 2 canjes a la vez: entrega 1 (M3). Límite diario y PIN en el servidor.
- Doble toque / reintento de la misma experiencia: 1 paso (M2). Flyer pedido dos veces: se otorga una vez (M6).
- Toda la seguridad de `anon` y de las cuentas «mesa» y sin aprobar (ver tabla de endpoints).
- `empezar_de_cero()` con actividad en curso deja el PIN, el premio y el staff (M9).

## Notas (sin cambio)
- En Supabase `anon` puede *llamar* a las funciones de gestión (privilegios por defecto), pero todas revisan el rol por
  dentro (`solo_staff`, `solo_admin`). Probado.
- `anon` puede listar todas las credenciales (nombre y código): ya anotado como T-19 en `013-correcciones-qa.md`.
- Las credenciales creadas antes de la 011 conservan su código hexadecimal: las tablets los aceptan (B1).
