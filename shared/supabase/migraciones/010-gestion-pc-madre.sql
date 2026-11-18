-- 010 · Gestión desde el PC madre (plan 017). Va después de eventos.sql y juego.sql.
-- Idempotente: se puede correr más de una vez. SQL Editor → New query → Run.

-- Pedir que el HUB se recargue (lo lee config_mesas(), más abajo). Uso interno de las funciones de este archivo.
create or replace function public.marcar_recarga_hub() returns void language sql security definer set search_path = public as $$
  insert into config (clave, valor) values ('hub_reinicio', now()::text)
  on conflict (clave) do update set valor = excluded.valor;
$$;
revoke all on function public.marcar_recarga_hub() from public, anon, authenticated;

-- 1. Borrar una credencial también la saca del HUB (sus eventos: credencial, timbres, dibujos, fotos).
create or replace function public.credencial_sale_del_hub() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from eventos where codigo = old.codigo;
  perform marcar_recarga_hub();
  return old;
end;
$$;
drop trigger if exists credencial_sale_del_hub on public.credenciales;
create trigger credencial_sale_del_hub after delete on public.credenciales
  for each row execute function public.credencial_sale_del_hub();

-- Una vez: lo que quedó en el HUB de credenciales ya borradas (prueba general).
delete from public.eventos e
  where e.codigo is not null and not exists (select 1 from public.credenciales c where c.codigo = e.codigo);

-- 2. Recargar el HUB y quitar del HUB un evento (un dibujo, una foto, un nombre).
create or replace function public.recargar_hub() returns void language plpgsql security definer set search_path = public as $$
begin
  if not es_staff() then raise exception 'solo_staff'; end if;
  perform marcar_recarga_hub();
end;
$$;
revoke all on function public.recargar_hub() from public;
grant execute on function public.recargar_hub() to authenticated;

create or replace function public.ocultar_evento(p_id bigint) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not es_staff() then raise exception 'solo_staff'; end if;
  delete from eventos where id = p_id;
  if not found then return false; end if;
  perform marcar_recarga_hub();
  return true;
end;
$$;
revoke all on function public.ocultar_evento(bigint) from public;
grant execute on function public.ocultar_evento(bigint) to authenticated;

-- 3. Números del evento para el Resumen.
create or replace function public.resumen_evento() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not es_staff() then raise exception 'solo_staff'; end if;
  return jsonb_build_object(
    'credenciales', (select count(*) from credenciales),
    'por_sello', (select coalesce(jsonb_object_agg(sello, n), '{}') from (select sello, count(*) n from sellos group by sello) s),
    'completas', (select count(*) from (select credencial_id from sellos where sello between 1 and 4
                                        group by credencial_id having count(distinct sello) = 4) c),
    'canjes', (select count(*) from canjes),
    'stock', (select stock from premio limit 1),
    'mesas_activas', (select count(distinct mesa) from sesiones_mesa where inicio > now() - interval '15 minutes'),
    'ultima_hora', (select coalesce(jsonb_object_agg(tipo, n), '{}') from
                     (select tipo, count(*) n from eventos where creado > now() - interval '1 hour' group by tipo) e),
    'avisos_suscritos', (select count(*) from suscripciones_push)
  );
end;
$$;
revoke all on function public.resumen_evento() from public;
grant execute on function public.resumen_evento() to authenticated;

-- 4. Empezar de cero (después de la prueba general). Solo admin y con la frase exacta.
--    Deja: staff, config (PIN, modo juego), premio (stock), sellos_def y afiches.
create or replace function public.empezar_de_cero(p_frase text) returns jsonb language plpgsql security definer set search_path = public as $$
declare n_cred int; n_ev int;
begin
  if not es_admin() then raise exception 'solo_admin'; end if;
  if p_frase is distinct from 'BORRAR TODO' then raise exception 'frase_incorrecta'; end if;
  select count(*) into n_cred from credenciales;
  delete from credenciales where true;          -- arrastra sellos, pasos, canjes y suscripciones (cascade)
  select count(*) into n_ev from eventos;
  delete from eventos where true;
  delete from sesiones_mesa where true;
  delete from notificaciones where true;
  if to_regclass('public.emparejamientos') is not null then execute 'delete from public.emparejamientos'; end if;
  insert into config (clave, valor) values ('mesas_reinicio', now()::text)
    on conflict (clave) do update set valor = excluded.valor;
  perform marcar_recarga_hub();
  return jsonb_build_object('credenciales', n_cred, 'eventos', n_ev);
end;
$$;
revoke all on function public.empezar_de_cero(text) from public;
grant execute on function public.empezar_de_cero(text) to authenticated;

-- 5. config_mesas() (migración 008) suma hub_reinicio: el HUB la pregunta cada 30 s y se recarga cuando cambia.
create or replace function public.config_mesas(p_mesa text default null)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'modo_juego', coalesce((select valor from config where clave = 'mesas_modo_juego'), 'si') = 'si',
    'token2', (select token from sellos_def where id = 2),
    'reinicio', (select valor from config where clave = 'mesas_reinicio'),
    'reinicio_mesa', case when p_mesa is null then null
                          else (select valor from config where clave = 'mesas_reinicio:' || upper(p_mesa)) end,
    'hay_pin', exists (select 1 from config where clave = 'pin_staff_sha256'),
    'hub_reinicio', (select valor from config where clave = 'hub_reinicio')
  );
$$;
revoke all on function public.config_mesas(text) from public;
grant execute on function public.config_mesas(text) to anon, authenticated;
