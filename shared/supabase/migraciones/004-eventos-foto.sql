-- 004 · El Fotomatón manda su tarjeta al inventario de la credencial (plan 009: «como el resto de las experiencias»).
-- Va después de 003-timbres-finales.sql. Idempotente: se puede correr más de una vez. SQL Editor → New query → Run.
--
-- `eventos.tipo` suma 'foto'. El Fotomatón publica la miniatura (160 px) solo con el código de la persona y solo después
-- de que acepta el aviso de las 24 horas y toca «Generar QR» (fotomaton/CLAUDE.md, privacidad). Como todo `eventos`, se
-- borra a las 24 h (shared/supabase/eventos.sql). Las filas que ya existen siguen cumpliendo la regla nueva.
alter table public.eventos drop constraint if exists eventos_tipo_check;
alter table public.eventos add constraint eventos_tipo_check
  check (tipo in ('credencial', 'timbre', 'vagon', 'grabado', 'mosaico', 'audio', 'graffiti', 'foto'));
