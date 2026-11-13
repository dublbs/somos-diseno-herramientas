# 007 · Backend del juego y PC madre

Fecha: 10 nov 2026 · Estado: **en construcción** (rama `claude/backend-y-pc-madre`).

Cierra la parte técnica que los planes 003 y 004 dejaron planeada y sin código: validación por staff, pasos hacia un timbre (portales), canje con stock, notificaciones a los celulares y un panel para el PC del evento («PC madre»).

**No reabre decisiones.** Siguen vigentes: Supabase (no Firebase), la cara HELLO fuera del MVP, sin capítulos en el HUB, Kahoot solo planificado. Si el equipo quiere sumar algo (meta colectiva, jefe final, premio distinto), se escribe primero aquí o en un plan nuevo.

## 1. Qué construye

| Pieza | Dónde | Qué hace |
|---|---|---|
| Esquema del juego | `shared/supabase/juego.sql` | Tablas `staff`, `pasos`, `sesiones_mesa`, `premio`, `canjes`, `suscripciones_push`, `notificaciones`, `config`; `sellar()` con meta; `canjear()` con PIN en el servidor y stock; políticas de staff; Realtime. |
| Notificaciones | `supabase/functions/notificar/` | Edge Function: recibe título, cuerpo, enlace y destino (todos o un código), manda Web Push a las suscripciones guardadas y borra las vencidas. Solo la puede llamar el staff. |
| Credencial | `credencial/public/sw.js`, `credencial/src/lib/push.ts` | Service worker, instalación como app y botón «Avisos» que pide permiso y guarda la suscripción. |
| PC madre | `admin/` | App Vite (React 18 + TS 7) para el PC del evento: login de staff, personas y timbres, sesiones de mesa, canje con stock, avisos, configuración. |

## 2. Modelo de datos (sobre `credencial/supabase/schema.sql` y `shared/supabase/eventos.sql`)

```
staff             user_id → auth.users · nombre · rol ('admin' | 'mesa')
config            clave (pk) · valor            → 'pin_staff_sha256', 'vapid_public'
sellos_def        + meta int (1)                → cuántos pasos otorgan el timbre (Portales: 3)
pasos             credencial_id · sello · clave · creado   (único por credencial+sello+clave)
sesiones_mesa     id · mesa · app · codigo · inicio · fin
premio            id=1 · nombre · stock · limite_diario
canjes            credencial_id (pk) · staff_id · dia · creado
suscripciones_push id · credencial_id · endpoint (único) · p256dh · auth · creado
notificaciones    id · titulo · cuerpo · url · codigo (null = todos) · enviadas · creado · staff_id
```

- **`sellar(p_codigo, p_sello, p_token, p_clave)`**: valida el token, anota el paso (`p_clave` identifica el afiche o la figura; sin clave, `'unico'`) y, si los pasos distintos llegan a la `meta`, inserta el sello. Devuelve `{pasos, meta, sello_otorgado}`. La firma anterior de 3 argumentos sigue existiendo y equivale a clave `'unico'`.
- **`canjear(p_codigo, p_pin)`**: valida la credencial completa, el PIN contra `config.pin_staff_sha256` (mismo hash `somos-diseno:<pin>` que usa `shared/juego.ts`), el stock y el límite diario; inserta en `canjes`, marca `canjeado` y descuenta. El staff con sesión (admin) puede canjear sin PIN.
- **Staff**: `es_staff()` = `auth.uid()` está en `staff`. Solo el staff puede editar credenciales, insertar y borrar sellos, leer sesiones y suscripciones, escribir `premio`, `config` y `notificaciones`.
- **Realtime** en `eventos`, `credenciales`, `sellos` y `canjes`, para el panel. El HUB sigue con polling (`shared/datos.ts`); cambiarlo a Realtime es otra tarea.
- **Privacidad**: las suscripciones push se borran con la credencial (cascade) y con el borrado a las 24 h. Las notificaciones no llevan datos personales.

## 3. Flujos

- **Portal (timbre 3)**: el QR de cada afiche abre `#/sello/3?t=<token>&k=<afiche>`; la credencial llama `sellar(..., k)`; al tercer afiche distinto cae el timbre. Hoy la pantalla de portal con cámara no existe (plan 004, sigue pendiente): el QR timbra directo.
- **Canje**: en el celular, el staff escribe su PIN (como hoy) pero lo valida el servidor; o en el PC madre, el staff busca el código y canjea con su sesión. Ambos descuentan stock.
- **Avisos**: en el PC madre se escribe el aviso y se elige «todos» o un código; la función `notificar` lo manda. En iPhone solo llega si la credencial se agregó a la pantalla de inicio.
- **Mesas**: la tablet, al entrar un código en modo juego, publica una fila en `sesiones_mesa` (opcional; sin Supabase no pasa nada).

## 4. Variables y secretos (nunca en el repo)

| Dónde | Variable |
|---|---|
| `credencial/.env.local`, `admin/.env.local` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY` |
| Secretos de la Edge Function | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:`) |

Las claves VAPID se generan una vez: `npx web-push generate-vapid-keys`.

## 5. Pendiente fuera del código
- Crear el proyecto de Supabase, correr los tres SQL en orden y `supabase functions deploy notificar`.
- Crear las cuentas del staff (Authentication → Users) e insertarlas en `staff`.
- Vercel.

## 6. Verificación
- [ ] `npm --prefix admin run build` y `npm --prefix credencial run build` en verde.
- [ ] Modo demo: la credencial sigue funcionando sin variables (el botón «Avisos» se oculta).
- [ ] Con Supabase: login de staff, editar un nombre, dar y quitar un timbre, canjear con stock, mandar un aviso a un celular Android y a un iPhone instalado.
