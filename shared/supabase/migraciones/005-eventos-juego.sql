-- 005 · «Hora punta» (juego Pixel) manda tu mural al inventario de la credencial (plan docs/plans/009-juego-pixel.md).
-- Va después de 004-eventos-foto.sql. Idempotente: se puede correr más de una vez. SQL Editor → New query → Run.
--
-- `eventos.tipo` suma 'juego'. El juego publica la miniatura del mural (160 px, sin fotos ni datos de la persona) solo
-- con el código de quien juega y solo si la partida suma al timbre Creación (5 puntos o más). Como todo `eventos`, se
-- borra a las 24 h (shared/supabase/eventos.sql). Las filas que ya existen siguen cumpliendo la regla nueva.
alter table public.eventos drop constraint if exists eventos_tipo_check;
alter table public.eventos add constraint eventos_tipo_check
  check (tipo in ('credencial', 'timbre', 'vagon', 'grabado', 'mosaico', 'audio', 'graffiti', 'foto', 'juego'));
