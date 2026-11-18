-- 008 · Las herramientas del staff en el PC madre (plan 015). Va después de juego.sql.
-- Idempotente: se puede correr más de una vez. SQL Editor → New query → Run.
--
-- Las tablets ya no se configuran una por una en ?staff: leen de aquí el modo juego, el código de la estación 2
-- (desde sellos_def) y las órdenes de reinicio. El PC madre escribe las claves en `config` (solo admin, como el PIN).

-- Modo juego en todas las mesas (el evento se juega con credencial).
insert into public.config (clave, valor) values ('mesas_modo_juego', 'si') on conflict (clave) do nothing;

-- Lo que una tablet necesita saber. p_mesa: las 4 letras de la tablet (para su reinicio propio).
create or replace function public.config_mesas(p_mesa text default null)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'modo_juego', coalesce((select valor from config where clave = 'mesas_modo_juego'), 'si') = 'si',
    'token2', (select token from sellos_def where id = 2),
    'reinicio', (select valor from config where clave = 'mesas_reinicio'),
    'reinicio_mesa', case when p_mesa is null then null
                          else (select valor from config where clave = 'mesas_reinicio:' || upper(p_mesa)) end,
    'hay_pin', exists (select 1 from config where clave = 'pin_staff_sha256')
  );
$$;
revoke all on function public.config_mesas(text) from public;
grant execute on function public.config_mesas(text) to anon, authenticated;

-- El PIN del canje (PC madre → Configuración) también abre ?staff en las tablets.
create or replace function public.verificar_pin_staff(p_pin text)
returns boolean language sql stable security definer set search_path = public, extensions as $$
  select coalesce(
    (select valor = encode(digest('somos-diseno:' || coalesce(p_pin, ''), 'sha256'), 'hex')
       from config where clave = 'pin_staff_sha256'),
    false);
$$;
revoke all on function public.verificar_pin_staff(text) from public;
grant execute on function public.verificar_pin_staff(text) to anon, authenticated;
