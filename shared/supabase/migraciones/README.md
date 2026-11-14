# Migraciones de la base (proyecto `somos-diseno`)

La base ya está en uso. Los tres archivos base (`credencial/supabase/schema.sql`, `shared/supabase/eventos.sql`, `shared/supabase/juego.sql`) se corrieron en ese orden. Desde ahora, **cada cambio va en un archivo nuevo aquí**:

- Nombre: `NNN-tema.sql` (ej. `001-retos-por-mesa.sql`), número correlativo.
- Idempotente: `create table if not exists`, `create or replace function`, `drop policy if exists` antes de `create policy`, `add column if not exists`.
- Se corre a mano en Supabase → SQL Editor → New query → Run.
- Quien lo corre lo anota abajo y en el PR.

| Archivo | Qué hace | Corrido en somos-diseno |
|---|---|---|
| `001-afiches.sql` | Cacería de afiches: tabla `afiches` con secretos, `encontrar_afiche()`, `metas()` (plan 010) | 14/11, Claude (sesión de Pipe) |
| `002-eventos-graffiti.sql` | `eventos.tipo` suma `graffiti` | 14/11, Claude (sesión de Pipe) |
| `003-timbres-finales.sql` | Timbres: Inscripción · Creación (meta 4) · Cacería (meta 3) · Secreto; `canjear()` pide los 4 (plan 009) | 14/11, Claude (sesión de Pipe) |
| `004-eventos-foto.sql` | `eventos.tipo` suma `foto` | 14/11, Claude (sesión de Pipe) |
| `005-eventos-juego.sql` | `eventos.tipo` suma `juego` (Hora punta) | 14/11, Claude (sesión de Pipe) |
| `fotomaton/supabase/migrations/0001_fotomaton.sql` | Tabla y bucket privado `fotomaton` (lo usa «Llévatela» en todas las experiencias, plan 011). **Una sola vez.** | 14/11, Claude (sesión de Pipe) |
| `006-limpiar-llevatela.sql` | Cron cada hora que llama a la función `limpiar` (borrado a 24 h de «Llévatela») | 14/11, Claude (sesión de Pipe) · probado: 200 |

Funciones desplegadas en `somos-diseno`: `notificar` (plan 007), `tarjeta` y `limpiar` (Fotomatón / «Llévatela»), todas el 12–14/11.
