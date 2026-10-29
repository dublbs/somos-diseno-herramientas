-- Somos Diseño · capa de datos del HUB (shared/datos.ts) y modo juego (shared/juego.ts).
-- Va DESPUÉS de credencial/supabase/schema.sql, en el mismo proyecto. Pégalo en SQL Editor > New query > Run.
-- Guía completa: docs/supabase.md.

-- 1. Eventos que las experiencias mandan al HUB: credenciales (nombre, lenguaje, personaje y, solo con consentimiento,
--    una miniatura de 96 px de la cara), timbres, vagones, mosaicos, grabados y escenas de audio.
create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('credencial', 'timbre', 'vagon', 'grabado', 'mosaico', 'audio')),
  codigo text check (codigo is null or codigo ~ '^SD-[A-Z0-9]{5}$'),
  datos jsonb not null,
  creado timestamptz not null default now(),
  -- las miniaturas viajan dentro del evento: se limita el tamaño para que nadie suba imágenes grandes
  constraint eventos_tamano check (pg_column_size(datos) < 300000)
);
create index if not exists eventos_tipo_creado on public.eventos (tipo, creado desc);
create index if not exists eventos_creado on public.eventos (creado);

alter table public.eventos enable row level security;
drop policy if exists "leer eventos" on public.eventos;
create policy "leer eventos" on public.eventos for select using (true);
drop policy if exists "publicar eventos" on public.eventos;
create policy "publicar eventos" on public.eventos for insert with check (true);
-- Sin políticas de update ni delete: lo publicado no se cambia desde los equipos.

-- 2. Timbre 1 (Inscripción) al crear la credencial.
create or replace function public.timbre_inscripcion() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into sellos (credencial_id, sello) values (new.id, 1) on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists credencial_inscripcion on public.credenciales;
create trigger credencial_inscripcion after insert on public.credenciales for each row execute function public.timbre_inscripcion();

-- 3. Canje del premio (la credencial lo pide después de que el staff valida su PIN en el celular).
alter table public.credenciales add column if not exists canjeado boolean not null default false;
create or replace function public.canjear(p_codigo text) returns boolean language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_n int;
begin
  select id into v_id from credenciales where codigo = upper(p_codigo);
  if v_id is null then raise exception 'credencial_no_existe'; end if;
  -- completa = los timbres activos 1, 2 y 3 (el 4 · Hallazgo 3D está apagado)
  select count(*) into v_n from sellos where credencial_id = v_id and sello in (1, 2, 3);
  if v_n < 3 then raise exception 'credencial_incompleta'; end if;
  update credenciales set canjeado = true where id = v_id;
  return true;
end;
$$;
revoke all on function public.canjear(text) from public;
grant execute on function public.canjear(text) to anon, authenticated;

-- 4. Nombres de las estaciones (los tokens no cambian).
update public.sellos_def set nombre = 'Inscripción' where id = 1;
update public.sellos_def set nombre = 'Creación' where id = 2;
update public.sellos_def set nombre = 'Portales' where id = 3;
update public.sellos_def set nombre = 'Hallazgo 3D' where id = 4;

-- 5. Borrado a las 24 h (privacidad): eventos (con las miniaturas de caras) y credenciales del día.
--    Requiere la extensión pg_cron: Database > Extensions > pg_cron > Enable.
create extension if not exists pg_cron;
select cron.unschedule('somos-borrar-24h') where exists (select 1 from cron.job where jobname = 'somos-borrar-24h');
select cron.schedule('somos-borrar-24h', '17 * * * *', $$
  delete from public.eventos where creado < now() - interval '24 hours';
  delete from public.credenciales where creada < now() - interval '24 hours';
$$);
