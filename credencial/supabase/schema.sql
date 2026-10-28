-- Credencial Somos Diseño · esquema para Supabase (mismo proyecto que el Fotomatón).
-- Pégalo completo en SQL Editor > New query > Run.

create extension if not exists pgcrypto;

-- Credenciales emitidas desde el celular. receta = personaje del generador; marco = id de shared/marcos.ts.
create table if not exists public.credenciales (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null default ('SD-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 5))),
  nombre text not null check (char_length(nombre) between 1 and 14),
  receta jsonb not null,
  marco text not null default 'PM05',
  creada timestamptz not null default now()
);

-- Los 4 sellos. Por ahora son genéricos: para darles nombre o regla basta editar estas filas.
-- El token va en el QR impreso de cada sello y nunca se expone al cliente.
create table if not exists public.sellos_def (
  id smallint primary key check (id between 1 and 4),
  nombre text not null,
  token text not null
);

create table if not exists public.sellos (
  credencial_id uuid not null references public.credenciales(id) on delete cascade,
  sello smallint not null references public.sellos_def(id),
  creado timestamptz not null default now(),
  primary key (credencial_id, sello)
);

alter table public.credenciales enable row level security;
alter table public.sellos_def enable row level security;
alter table public.sellos enable row level security;

drop policy if exists "leer credenciales" on public.credenciales;
create policy "leer credenciales" on public.credenciales for select using (true);
drop policy if exists "emitir credenciales" on public.credenciales;
create policy "emitir credenciales" on public.credenciales for insert with check (true);
drop policy if exists "leer sellos" on public.sellos;
create policy "leer sellos" on public.sellos for select using (true);
-- public.sellos_def queda sin políticas: el cliente no puede leer los tokens.
-- Los sellos solo se escriben a través de sellar().

create or replace function public.sellar(p_codigo text, p_sello smallint, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from sellos_def where id = p_sello and upper(token) = upper(p_token)) then
    raise exception 'token_invalido';
  end if;
  select id into v_id from credenciales where codigo = upper(p_codigo);
  if v_id is null then
    raise exception 'credencial_no_existe';
  end if;
  insert into sellos (credencial_id, sello) values (v_id, p_sello) on conflict do nothing;
  return true;
end;
$$;

revoke all on function public.sellar(text, smallint, text) from public;
grant execute on function public.sellar(text, smallint, text) to anon, authenticated;

-- Sellos con códigos aleatorios de 4 caracteres (van en el QR y se pueden escribir a mano).
-- Después de correrlo, copia los códigos con:
--   select id, nombre, token from public.sellos_def order by id;
insert into public.sellos_def (id, nombre, token) values
  (1, 'Sello 1', (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 4))),
  (2, 'Sello 2', (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 4))),
  (3, 'Sello 3', (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 4))),
  (4, 'Sello 4', (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 4)))
on conflict (id) do nothing;

-- Para la Pantalla Flip y las métricas: credenciales con su cantidad de sellos.
create or replace view public.galeria as
  select c.codigo, c.nombre, c.receta, c.marco, c.creada, count(s.sello)::int as sellos
  from public.credenciales c
  left join public.sellos s on s.credencial_id = c.id
  group by c.id;
