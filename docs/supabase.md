# Supabase · guía para activar el HUB en vivo y el modo juego

Hoy todo funciona **sin Supabase**:
- La credencial, las mesas y el HUB guardan en cada equipo (`localStorage`).
- El HUB se entera de lo que pasa en otras pestañas del mismo navegador (`BroadcastChannel`).
- El timbre 2 se entrega con el código de la estación.

Con Supabase, todos los equipos comparten los datos: el HUB ve a las personas y lo que crean en todas las mesas, y la mesa timbra la credencial directo. No hay que cambiar código: basta con crear el proyecto y compilar con dos variables de entorno.

## 1. Crear el proyecto
1. En [supabase.com](https://supabase.com), crea un proyecto (región São Paulo). Es el mismo proyecto del Fotomatón.
2. En **Project Settings → API**, copia la *Project URL* y la *anon public key*.

## 2. Crear las tablas
En **SQL Editor → New query**, pega y corre, en este orden:
1. `credencial/supabase/schema.sql`: credenciales, sellos, la función `sellar()` y los códigos de las estaciones.
2. `shared/supabase/eventos.sql`: la tabla `eventos` del HUB, el timbre de Inscripción automático, `canjear()`, los nombres de las estaciones y el borrado a las 24 h.
3. Para el Fotomatón: las migraciones de `fotomaton/supabase/` (bucket `fotomaton` y la función `tarjeta`).

Antes de correr `eventos.sql`, activa **Database → Extensions → pg_cron**, que hace el borrado programado.

Para ver los códigos de las estaciones, que van en los QR impresos y en la configuración de las mesas:
```sql
select id, nombre, token from public.sellos_def order by id;
```

## 3. Variables de entorno (nunca en el repo)
Crea un archivo `.env.local` en cada app que se compila para el evento: credencial, fotomaton, hub-estacion y las mesas. Este archivo está ignorado por git.
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
# opcional: el PIN del staff para todas las mesas y la credencial, como hash (ver abajo)
VITE_STAFF_PIN_SHA256=...
```
Después compila con `npm run build`.
- **No subas a ninguna parte un `dist/` compilado con estas variables.**
- La *anon key* es pública por diseño: la protección la dan las políticas de seguridad (RLS) de las tablas.
- Nunca uses la *service role key* en el cliente.

Para calcular el hash del PIN (reemplaza `1234` por el PIN):
```bash
node -e "crypto.subtle.digest('SHA-256', new TextEncoder().encode('somos-diseno:1234')).then(b => console.log(Buffer.from(b).toString('hex')))"
```
Si no defines `VITE_STAFF_PIN_SHA256`, cada tablet usa el PIN que el staff fija en `?staff`. Ese PIN se guarda como hash en el equipo. Sin ninguno de los dos, el PIN de demo es `0000` y la pantalla lo avisa.

## 4. Qué guarda cada tabla y quién puede hacer qué
| Tabla | Contenido | Leer | Escribir |
|---|---|---|---|
| `credenciales` | código, nombre (14 letras), receta (foto o personaje), marco, canjeado | todos | crear (insert) |
| `sellos` | credencial + estación | todos | solo con `sellar(código, estación, token)` |
| `sellos_def` | nombre y token de cada estación | nadie (sin políticas) | — |
| `eventos` | lo que llega al HUB: credencial, timbre, vagón, mosaico, grabado, audio | todos | publicar (insert); sin editar ni borrar |

## 5. Privacidad
- La foto de la credencial **queda en el celular**. Al HUB solo viaja una miniatura de 96 px de la cara, y solo si la persona marca la casilla de consentimiento; si no, aparece su personaje.
- Las creaciones viajan como miniaturas (máximo ~300 KB por evento, lo valida la tabla).
- **Borrado a las 24 h:** `pg_cron` borra cada hora los eventos y las credenciales con más de un día. El Fotomatón borra sus tarjetas con su propia regla.

## 6. Probar
1. Abre el HUB (`hub-estacion/dist/?prueba=0`) en la pantalla. El rótulo debe decir «En vivo».
2. Crea una credencial en un celular: la persona aparece en el andén con su timbre de Inscripción.
3. En una mesa, entra a `?staff` con el PIN y:
   - enciende el modo juego;
   - escribe el código de la estación 2.
4. Entra con el código de la credencial, crea algo y descárgalo. La mesa avisa que el timbre ya está en la credencial y la persona sube al mezanine.
