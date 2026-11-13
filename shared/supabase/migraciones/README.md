# Migraciones de la base (proyecto `somos-diseno`)

La base ya está en uso. Los tres archivos base (`credencial/supabase/schema.sql`, `shared/supabase/eventos.sql`, `shared/supabase/juego.sql`) se corrieron en ese orden. Desde ahora, **cada cambio va en un archivo nuevo aquí**:

- Nombre: `NNN-tema.sql` (ej. `001-retos-por-mesa.sql`), número correlativo.
- Idempotente: `create table if not exists`, `create or replace function`, `drop policy if exists` antes de `create policy`, `add column if not exists`.
- Se corre a mano en Supabase → SQL Editor → New query → Run.
- Quien lo corre lo anota abajo y en el PR.

| Archivo | Qué hace | Corrido en somos-diseno |
|---|---|---|
| — | — | — |
