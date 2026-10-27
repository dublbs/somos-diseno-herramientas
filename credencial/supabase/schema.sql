-- Credencial Somos Diseño · esquema para Supabase
-- Pégalo completo en SQL Editor > New query > Run.

create extension if not exists pgcrypto;

-- Personajes emitidos. La receta es el JSON del generador (partes + colores).
create table if not exists public.credenciales (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null default ('SD-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 5))),
  nombre text not null check (char_length(nombre) between 1 and 14),
  receta jsonb not null,
  creada timestamptz not null default now()
);

-- Las 5 mesas. El token va en el QR impreso de cada mesa y nunca se expone al cliente.
create table if not exists public.mesas (
  id smallint primary key check (id between 1 and 5),
  nombre text not null,
  token text not null
);

create table if not exists public.sellos (
  credencial_id uuid not null references public.credenciales(id) on delete cascade,
  mesa smallint not null references public.mesas(id),
  creado timestamptz not null default now(),
  primary key (credencial_id, mesa)
);

alter table public.credenciales enable row level security;
alter table public.mesas enable row level security;
alter table public.sellos enable row level security;

-- Cualquiera puede ver credenciales y sellos (galería en la Pantalla Flip) y emitir una credencial.
drop policy if exists "leer credenciales" on public.credenciales;
create policy "leer credenciales" on public.credenciales for select using (true);
drop policy if exists "emitir credenciales" on public.credenciales;
create policy "emitir credenciales" on public.credenciales for insert with check (true);
drop policy if exists "leer sellos" on public.sellos;
create policy "leer sellos" on public.sellos for select using (true);
-- public.mesas queda sin políticas: el cliente no puede leer los tokens.
-- Los sellos solo se escriben a través de la función sellar().

create or replace function public.sellar(p_codigo text, p_mesa smallint, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from mesas where id = p_mesa and token = p_token) then
    raise exception 'token_invalido';
  end if;
  select id into v_id from credenciales where codigo = upper(p_codigo);
  if v_id is null then
    raise exception 'credencial_no_existe';
  end if;
  insert into sellos (credencial_id, mesa) values (v_id, p_mesa) on conflict do nothing;
  return true;
end;
$$;

revoke all on function public.sellar(text, smallint, text) from public;
grant execute on function public.sellar(text, smallint, text) to anon, authenticated;

-- Mesas con tokens aleatorios. Después de correrlo, copia los tokens con:
--   select id, nombre, token from public.mesas order by id;
insert into public.mesas (id, nombre, token) values
  (1, 'Pantalla Flip', encode(gen_random_bytes(6), 'hex')),
  (2, 'Gráfica e Ilustración', encode(gen_random_bytes(6), 'hex')),
  (3, 'Imagen e identidad', encode(gen_random_bytes(6), 'hex')),
  (4, 'Sonido y juego', encode(gen_random_bytes(6), 'hex')),
  (5, 'Realidad aumentada y virtual', encode(gen_random_bytes(6), 'hex'))
on conflict (id) do nothing;

-- Para la galería y las métricas: credenciales con su cantidad de sellos.
create or replace view public.galeria as
  select c.codigo, c.nombre, c.receta, c.creada, count(s.mesa)::int as sellos
  from public.credenciales c
  left join public.sellos s on s.credencial_id = c.id
  group by c.id
  order by c.creada desc;
