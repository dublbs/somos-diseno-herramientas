-- 001 · Cacería de afiches (plan 008). Va después de schema.sql, eventos.sql y juego.sql.
-- Idempotente: se puede correr más de una vez. SQL Editor → New query → Run.
--
-- Cada afiche tiene su propio código secreto (va en su QR y escrito bajo él). Así nadie puede inventar afiches
-- con el token de la estación 3. En `pasos` queda el id público del afiche (el del marco: PM02), nunca el secreto.

-- 1. Afiches. Sin políticas: el celular no puede leer los secretos (igual que sellos_def.token).
create or replace function public.codigo_aleatorio(n int) returns text language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, n);
$$;
revoke all on function public.codigo_aleatorio(int) from public;

create table if not exists public.afiches (
  id text primary key,
  nombre text not null,
  lenguaje text not null check (lenguaje in ('Pixel', 'Geométrica', 'Orgánica')),
  sello smallint not null default 3 references public.sellos_def(id),
  secreto text not null unique default public.codigo_aleatorio(6),
  activo boolean not null default true,
  creado timestamptz not null default now()
);
alter table public.afiches enable row level security;

-- Los 15 afiches de la sede: uno por marco (plan 004, 5 por lenguaje), con el nombre del marco en Figma (shared/marcos-figma.ts).
-- Para sumar o apagar uno: insert, o update … set activo = false.
insert into public.afiches (id, nombre, lenguaje) values
  ('GM01', 'Bandas de damero', 'Geométrica'),
  ('GM02', 'Estallido', 'Geométrica'),
  ('GM04', 'Panel escalonado', 'Geométrica'),
  ('GM05', 'Túnel', 'Geométrica'),
  ('GM06', 'Diamante', 'Geométrica'),
  ('OM01', 'Bandas', 'Orgánica'),
  ('OM02', 'Estallido', 'Orgánica'),
  ('OM04', 'Panel escalonado', 'Orgánica'),
  ('OM05', 'Túnel', 'Orgánica'),
  ('OM06', 'Diamante', 'Orgánica'),
  ('PM01', 'Pizarra', 'Pixel'),
  ('PM02', 'Vinilo', 'Pixel'),
  ('PM04', 'Ventana', 'Pixel'),
  ('PM05', 'Metro', 'Pixel'),
  ('PM06', 'Señal', 'Pixel')
on conflict (id) do nothing;

-- 2. encontrar_afiche(): el celular manda el secreto que leyó; se anota el paso con el id del afiche.
--    Devuelve lo de sellar() más `afiche` (id) y `repetido` (si esa credencial ya lo tenía).
create or replace function public.encontrar_afiche(p_codigo text, p_secreto text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_afiche text; v_sello smallint; v_token text; v_repetido boolean;
begin
  select a.id, a.sello into v_afiche, v_sello from afiches a where upper(a.secreto) = upper(trim(p_secreto)) and a.activo;
  if v_afiche is null then raise exception 'afiche_invalido'; end if;
  select token into v_token from sellos_def where id = v_sello;
  select exists (select 1 from pasos p join credenciales c on c.id = p.credencial_id
                 where c.codigo = upper(p_codigo) and p.sello = v_sello and p.clave = v_afiche) into v_repetido;
  return public.sellar(p_codigo, v_sello, v_token, v_afiche) || jsonb_build_object('afiche', v_afiche, 'repetido', v_repetido);
end;
$$;
revoke all on function public.encontrar_afiche(text, text) from public;
grant execute on function public.encontrar_afiche(text, text) to anon, authenticated;

-- 3. metas(): cuántos pasos pide cada estación (sin el token), para mostrar «n de 3» en la credencial.
create or replace function public.metas()
returns table (id smallint, meta smallint) language sql stable security definer set search_path = public as $$
  select id, meta from sellos_def order by id;
$$;
revoke all on function public.metas() from public;
grant execute on function public.metas() to anon, authenticated;

-- 4. Para imprimir (no se guarda en el repo):
--   select id, nombre, secreto from public.afiches order by id;

-- 5. OPCIONAL: si ya se imprimió el QR genérico de la estación 3 (#/sello/3?t=…), con su token se podían
--    inventar afiches. Rotarlo lo invalida. No es idempotente: correr solo una vez, a mano.
-- update public.sellos_def set token = public.codigo_aleatorio(4) where id = 3;
