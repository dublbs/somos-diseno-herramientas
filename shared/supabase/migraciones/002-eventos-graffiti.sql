-- 002 · Graffiti publica su creación (plan 008 §2b, inventario de creación). Va después de 001-afiches.sql.
-- Idempotente: se puede correr más de una vez. SQL Editor → New query → Run.
--
-- `eventos.tipo` (shared/supabase/eventos.sql) solo aceptaba credencial, timbre, vagon, grabado, mosaico y audio.
-- Se suma 'graffiti': la mesa manda la miniatura de lo que pintó la persona, con su código, y le llega al inventario
-- de la credencial al momento. Las filas que ya existen siguen cumpliendo la regla nueva.
alter table public.eventos drop constraint if exists eventos_tipo_check;
alter table public.eventos add constraint eventos_tipo_check
  check (tipo in ('credencial', 'timbre', 'vagon', 'grabado', 'mosaico', 'audio', 'graffiti'));
