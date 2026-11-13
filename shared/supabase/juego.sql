-- Somos Diseño · backend del juego y PC madre (plan 007).
-- Va DESPUÉS de credencial/supabase/schema.sql y shared/supabase/eventos.sql, en el mismo proyecto.
-- Pégalo en SQL Editor > New query > Run. Se puede correr más de una vez.

create extension if not exists pgcrypto;

-- ============================================================
-- 1. Staff: cuentas de Supabase Auth (Authentication > Users) ligadas a un rol.
--    Después de crear la cuenta: insert into staff (user_id, nombre, rol) values ('<uuid>', 'Nombre', 'admin');
-- ============================================================
create table if not exists public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol text not null default 'mesa' check (rol in ('admin', 'mesa')),
  creado timestamptz not null default now()
);
alter table public.staff enable row level security;
drop policy if exists "staff se ve a si mismo" on public.staff;
create policy "staff se ve a si mismo" on public.staff for select to authenticated using (user_id = auth.uid());

create or replace function public.es_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid());
$$;
create or replace function public.es_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid() and rol = 'admin');
$$;

-- ============================================================
-- 2. Configuración del evento (PIN del staff como hash, clave pública VAPID).
--    El hash es sha256('somos-diseno:' || pin), igual que shared/juego.ts.
-- ============================================================
create table if not exists public.config (
  clave text primary key,
  valor text not null,
  actualizado timestamptz not null default now()
);
alter table public.config enable row level security;
drop policy if exists "staff lee config" on public.config;
create policy "staff lee config" on public.config for select to authenticated using (public.es_staff());
drop policy if exists "admin escribe config" on public.config;
create policy "admin escribe config" on public.config for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- ============================================================
-- 3. Pasos hacia un timbre: cada afiche o figura escaneada. sellos_def.meta dice cuántos pasos distintos otorgan el sello.
-- ============================================================
alter table public.sellos_def add column if not exists meta smallint not null default 1 check (meta between 1 and 20);
update public.sellos_def set meta = 3 where id = 3 and meta = 1; -- Portales: 3 afiches distintos

create table if not exists public.pasos (
  credencial_id uuid not null references public.credenciales(id) on delete cascade,
  sello smallint not null references public.sellos_def(id),
  clave text not null default 'unico',
  creado timestamptz not null default now(),
  primary key (credencial_id, sello, clave)
);
alter table public.pasos enable row level security;
drop policy if exists "leer pasos" on public.pasos;
create policy "leer pasos" on public.pasos for select using (true);
-- Los pasos solo se escriben con sellar().

-- sellar() con clave: anota el paso y otorga el sello al llegar a la meta.
create or replace function public.sellar(p_codigo text, p_sello smallint, p_token text, p_clave text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_meta smallint; v_pasos int; v_nuevo boolean := false;
begin
  select meta into v_meta from sellos_def where id = p_sello and upper(token) = upper(p_token);
  if v_meta is null then raise exception 'token_invalido'; end if;
  select id into v_id from credenciales where codigo = upper(p_codigo);
  if v_id is null then raise exception 'credencial_no_existe'; end if;
  insert into pasos (credencial_id, sello, clave) values (v_id, p_sello, coalesce(nullif(trim(p_clave), ''), 'unico')) on conflict do nothing;
  select count(*) into v_pasos from pasos where credencial_id = v_id and sello = p_sello;
  if v_pasos >= v_meta then
    insert into sellos (credencial_id, sello) values (v_id, p_sello) on conflict do nothing;
    get diagnostics v_pasos = row_count; -- 1 si recién se otorgó
    v_nuevo := v_pasos = 1;
    select count(*) into v_pasos from pasos where credencial_id = v_id and sello = p_sello;
  end if;
  return jsonb_build_object('pasos', v_pasos, 'meta', v_meta, 'sello_otorgado', v_pasos >= v_meta, 'nuevo', v_nuevo);
end;
$$;
revoke all on function public.sellar(text, smallint, text, text) from public;
grant execute on function public.sellar(text, smallint, text, text) to anon, authenticated;

-- La firma anterior (credencial/src/lib/store.ts) sigue funcionando: equivale a clave 'unico'.
create or replace function public.sellar(p_codigo text, p_sello smallint, p_token text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  perform public.sellar(p_codigo, p_sello, p_token, 'unico');
  return true;
end;
$$;
revoke all on function public.sellar(text, smallint, text) from public;
grant execute on function public.sellar(text, smallint, text) to anon, authenticated;

-- El staff otorga o quita timbres desde el PC madre.
drop policy if exists "staff da sellos" on public.sellos;
create policy "staff da sellos" on public.sellos for insert to authenticated with check (public.es_staff());
drop policy if exists "staff quita sellos" on public.sellos;
create policy "staff quita sellos" on public.sellos for delete to authenticated using (public.es_staff());
drop policy if exists "staff edita credenciales" on public.credenciales;
create policy "staff edita credenciales" on public.credenciales for update to authenticated using (public.es_staff()) with check (public.es_staff());
drop policy if exists "staff borra credenciales" on public.credenciales;
create policy "staff borra credenciales" on public.credenciales for delete to authenticated using (public.es_admin());

-- ============================================================
-- 4. Sesiones de mesa: qué código jugó en qué tablet (la tablet las publica al entrar en modo juego).
-- ============================================================
create table if not exists public.sesiones_mesa (
  id bigint generated always as identity primary key,
  mesa text not null,
  app text not null,
  codigo text not null check (codigo ~ '^SD-[A-Z0-9]{5}$'),
  inicio timestamptz not null default now(),
  fin timestamptz
);
create index if not exists sesiones_mesa_inicio on public.sesiones_mesa (inicio desc);
alter table public.sesiones_mesa enable row level security;
drop policy if exists "mesas abren sesion" on public.sesiones_mesa;
create policy "mesas abren sesion" on public.sesiones_mesa for insert with check (true);
drop policy if exists "staff lee sesiones" on public.sesiones_mesa;
create policy "staff lee sesiones" on public.sesiones_mesa for select to authenticated using (public.es_staff());

-- ============================================================
-- 5. Premio con stock y límite diario; canjes.
-- ============================================================
create table if not exists public.premio (
  id smallint primary key default 1 check (id = 1),
  nombre text not null default 'Kit Somos Diseño',
  stock int not null default 0 check (stock >= 0),
  limite_diario int not null default 0 check (limite_diario >= 0) -- 0 = sin límite
);
insert into public.premio (id) values (1) on conflict do nothing;
alter table public.premio enable row level security;
drop policy if exists "leer premio" on public.premio;
create policy "leer premio" on public.premio for select using (true);
drop policy if exists "admin edita premio" on public.premio;
create policy "admin edita premio" on public.premio for update to authenticated using (public.es_admin()) with check (public.es_admin());

create table if not exists public.canjes (
  credencial_id uuid primary key references public.credenciales(id) on delete cascade,
  staff_id uuid references auth.users(id) on delete set null,
  dia date not null default (now() at time zone 'America/Santiago')::date,
  creado timestamptz not null default now()
);
alter table public.canjes enable row level security;
drop policy if exists "staff lee canjes" on public.canjes;
create policy "staff lee canjes" on public.canjes for select to authenticated using (public.es_staff());
-- Los canjes solo se escriben con canjear().

-- canjear(código, pin): la credencial completa, el PIN (o la sesión del staff), el stock y el límite diario.
drop function if exists public.canjear(text);
create or replace function public.canjear(p_codigo text, p_pin text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_n int; v_hash text; v_premio premio%rowtype; v_hoy int; v_dia date;
begin
  if not public.es_staff() then
    select valor into v_hash from config where clave = 'pin_staff_sha256';
    if v_hash is null then raise exception 'pin_no_configurado'; end if;
    if p_pin is null or encode(digest('somos-diseno:' || p_pin, 'sha256'), 'hex') <> v_hash then raise exception 'pin_incorrecto'; end if;
  end if;
  select id into v_id from credenciales where codigo = upper(p_codigo);
  if v_id is null then raise exception 'credencial_no_existe'; end if;
  if exists (select 1 from canjes where credencial_id = v_id) then raise exception 'ya_canjeado'; end if;
  -- completa = todos los sellos activos (hoy 1, 2 y 3; el 4 está apagado en shared/juego.ts)
  select count(*) into v_n from sellos where credencial_id = v_id and sello in (1, 2, 3);
  if v_n < 3 then raise exception 'credencial_incompleta'; end if;
  select * into v_premio from premio where id = 1 for update;
  if v_premio.stock <= 0 then raise exception 'sin_stock'; end if;
  v_dia := (now() at time zone 'America/Santiago')::date;
  select count(*) into v_hoy from canjes where dia = v_dia;
  if v_premio.limite_diario > 0 and v_hoy >= v_premio.limite_diario then raise exception 'limite_diario'; end if;
  insert into canjes (credencial_id, staff_id, dia) values (v_id, auth.uid(), v_dia);
  update premio set stock = stock - 1 where id = 1;
  update credenciales set canjeado = true where id = v_id;
  return jsonb_build_object('ok', true, 'stock', v_premio.stock - 1, 'hoy', v_hoy + 1);
end;
$$;
revoke all on function public.canjear(text, text) from public;
grant execute on function public.canjear(text, text) to anon, authenticated;

-- ============================================================
-- 6. Notificaciones push: suscripciones de los celulares y el historial de avisos.
-- ============================================================
create table if not exists public.suscripciones_push (
  id bigint generated always as identity primary key,
  credencial_id uuid references public.credenciales(id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  creado timestamptz not null default now()
);
alter table public.suscripciones_push enable row level security;
drop policy if exists "celulares se suscriben" on public.suscripciones_push;
create policy "celulares se suscriben" on public.suscripciones_push for insert with check (true);
drop policy if exists "staff lee suscripciones" on public.suscripciones_push;
create policy "staff lee suscripciones" on public.suscripciones_push for select to authenticated using (public.es_staff());
-- Sin select para anon: nadie puede listar los endpoints. La función notificar usa la service role.

-- Suscribirse (o renovar) sin exponer la tabla: upsert por endpoint.
create or replace function public.suscribir_push(p_codigo text, p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from credenciales where codigo = upper(p_codigo);
  insert into suscripciones_push (credencial_id, endpoint, p256dh, auth) values (v_id, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set credencial_id = excluded.credencial_id, p256dh = excluded.p256dh, auth = excluded.auth;
end;
$$;
revoke all on function public.suscribir_push(text, text, text, text) from public;
grant execute on function public.suscribir_push(text, text, text, text) to anon, authenticated;

create table if not exists public.notificaciones (
  id bigint generated always as identity primary key,
  titulo text not null check (char_length(titulo) between 1 and 80),
  cuerpo text not null check (char_length(cuerpo) between 1 and 240),
  url text,
  codigo text check (codigo is null or codigo ~ '^SD-[A-Z0-9]{5}$'), -- null = todos
  enviadas int not null default 0,
  fallidas int not null default 0,
  staff_id uuid references auth.users(id) on delete set null,
  creado timestamptz not null default now()
);
alter table public.notificaciones enable row level security;
drop policy if exists "staff lee notificaciones" on public.notificaciones;
create policy "staff lee notificaciones" on public.notificaciones for select to authenticated using (public.es_staff());
drop policy if exists "staff crea notificaciones" on public.notificaciones;
create policy "staff crea notificaciones" on public.notificaciones for insert to authenticated with check (public.es_staff());

-- ============================================================
-- 7. Vista para el PC madre: cada persona con sus sellos, pasos y canje.
-- ============================================================
create or replace view public.personas as
  select c.id, c.codigo, c.nombre, c.marco, c.receta, c.creada, c.canjeado,
    coalesce((select array_agg(s.sello order by s.sello) from sellos s where s.credencial_id = c.id), '{}') as sellos,
    (select count(*)::int from pasos p where p.credencial_id = c.id and p.sello = 3) as portales,
    (select count(*)::int from suscripciones_push sp where sp.credencial_id = c.id) as avisos
  from credenciales c;

-- ============================================================
-- 8. Realtime para el panel.
-- ============================================================
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    for t in select unnest(array['eventos', 'credenciales', 'sellos', 'canjes']) loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- 9. El borrado a las 24 h (eventos.sql) arrastra pasos, canjes y suscripciones por cascade.

-- ============================================================
-- 10. Cuentas del staff desde el PC madre (sin entrar a Supabase).
--     La primera cuenta que se registra queda como admin; las demás quedan pendientes hasta que un admin las apruebe.
-- ============================================================
create or replace function public.staff_primera_cuenta() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from staff) then
    insert into staff (user_id, nombre, rol) values (new.id, coalesce(nullif(new.raw_user_meta_data->>'nombre', ''), split_part(new.email, '@', 1)), 'admin');
  end if;
  return new;
end;
$$;
drop trigger if exists staff_primera_cuenta on auth.users;
create trigger staff_primera_cuenta after insert on auth.users for each row execute function public.staff_primera_cuenta();

-- Los admins ven a todo el staff (para la lista de Configuración).
drop policy if exists "admin ve staff" on public.staff;
create policy "admin ve staff" on public.staff for select to authenticated using (public.es_admin());

-- Cuentas registradas que todavía no son staff (solo admin).
create or replace function public.cuentas_pendientes()
returns table (user_id uuid, email text, nombre text, creado timestamptz) language sql stable security definer set search_path = public as $$
  select u.id, u.email::text, coalesce(u.raw_user_meta_data->>'nombre', '')::text, u.created_at
  from auth.users u where public.es_admin() and not exists (select 1 from staff s where s.user_id = u.id)
  order by u.created_at desc;
$$;
revoke all on function public.cuentas_pendientes() from public;
grant execute on function public.cuentas_pendientes() to authenticated;

create or replace function public.aprobar_staff(p_user uuid, p_nombre text, p_rol text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'solo_admin'; end if;
  if p_rol not in ('admin', 'mesa') then raise exception 'rol_invalido'; end if;
  insert into staff (user_id, nombre, rol) values (p_user, coalesce(nullif(trim(p_nombre), ''), 'Staff'), p_rol)
  on conflict (user_id) do update set nombre = excluded.nombre, rol = excluded.rol;
end;
$$;
revoke all on function public.aprobar_staff(uuid, text, text) from public;
grant execute on function public.aprobar_staff(uuid, text, text) to authenticated;

create or replace function public.quitar_staff(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'solo_admin'; end if;
  if p_user = auth.uid() then raise exception 'no_a_si_mismo'; end if;
  delete from staff where user_id = p_user;
end;
$$;
revoke all on function public.quitar_staff(uuid) from public;
grant execute on function public.quitar_staff(uuid) to authenticated;
