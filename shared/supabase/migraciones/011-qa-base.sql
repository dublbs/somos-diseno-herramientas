-- 011 · Arreglos del QA de la base (docs/qa/qa-base-de-datos.md). Va después de 010.
-- Idempotente: se puede correr más de una vez. SQL Editor → New query → Run.

-- 1. Códigos de credencial sin choques y fáciles de escribir.
--    Antes: 5 caracteres hexadecimales (16^5 ≈ 1 M) sin revisar si ya existía. Con 1000 personas, 38 % de probabilidad de
--    que a alguien le falle «Crear credencial» por código repetido; y la mitad de los códigos traía 0 o 1, que las
--    tablets rechazaban. Ahora: 5 de 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' (sin 0, O, 1 ni I; 32^5 ≈ 33 M), el mismo
--    alfabeto de las tablets y del modo demo, y se reintenta hasta encontrar uno libre.
create or replace function public.codigo_credencial() returns text language plpgsql volatile set search_path = public as $$
declare v text;
begin
  loop
    v := 'SD-' || public.codigo_aleatorio(5);
    exit when not exists (select 1 from credenciales where codigo = v);
  end loop;
  return v;
end;
$$;
grant execute on function public.codigo_credencial() to anon, authenticated;
grant execute on function public.codigo_aleatorio(int) to anon, authenticated; -- la usa el default de arriba
alter table public.credenciales alter column codigo set default public.codigo_credencial();

-- 2. sellar(): el código llega con espacios o en minúsculas desde algunas pantallas (antes: «credencial_no_existe»), y
--    timbrados simultáneos de la misma persona ya no se pisan (ver «for update»).
create or replace function public.sellar(p_codigo text, p_sello smallint, p_token text, p_clave text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_meta smallint; v_pasos int; v_nuevo boolean := false;
begin
  select meta into v_meta from sellos_def where id = p_sello and upper(token) = upper(trim(p_token));
  if v_meta is null then raise exception 'token_invalido'; end if;
  -- for update: si varias tablets timbran a la misma persona a la vez, van de a una. Sin esto, cada una contaba los
  -- pasos sin ver los de las otras y nadie entregaba el timbre (QA M1: 4 pasos y sin timbre 2).
  select id into v_id from credenciales where codigo = upper(trim(p_codigo)) for update;
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

create or replace function public.encontrar_afiche(p_codigo text, p_secreto text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_afiche text; v_sello smallint; v_token text; v_repetido boolean;
begin
  select a.id, a.sello into v_afiche, v_sello from afiches a where upper(a.secreto) = upper(trim(p_secreto)) and a.activo;
  if v_afiche is null then raise exception 'afiche_invalido'; end if;
  select token into v_token from sellos_def where id = v_sello;
  select exists (select 1 from pasos p join credenciales c on c.id = p.credencial_id
                 where c.codigo = upper(trim(p_codigo)) and p.sello = v_sello and p.clave = v_afiche) into v_repetido;
  return public.sellar(p_codigo, v_sello, v_token, v_afiche) || jsonb_build_object('afiche', v_afiche, 'repetido', v_repetido, 'sello', v_sello);
end;
$$;

-- 2b. Reparación única: personas que ya juntaron la meta de pasos pero se quedaron sin el timbre por esa carrera.
insert into public.sellos (credencial_id, sello)
select p.credencial_id, p.sello from public.pasos p join public.sellos_def d on d.id = p.sello
group by p.credencial_id, p.sello, d.meta having count(*) >= d.meta
on conflict do nothing;

-- 2c. emparejar_mesa(): dos celulares que escanean el mismo QR a la vez recibían «listo» los dos, pero la tablet juega con
--     uno solo (QA M5). Ahora el que no quedó en la base recibe «mesa_ocupada».
create or replace function public.emparejar_mesa(p_mesa text, p_nonce text, p_codigo text, p_app text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_codigo text := upper(trim(p_codigo)); v_mesa text := upper(trim(p_mesa)); v_nonce text := lower(trim(p_nonce)); v_quedo text;
begin
  if not exists (select 1 from credenciales where codigo = v_codigo) then raise exception 'credencial_no_existe'; end if;
  insert into emparejamientos (mesa, nonce, codigo, app) values (v_mesa, v_nonce, v_codigo, p_app)
    on conflict (mesa, nonce) do nothing;
  select codigo into v_quedo from emparejamientos where mesa = v_mesa and nonce = v_nonce;
  if v_quedo is distinct from v_codigo then raise exception 'mesa_ocupada'; end if;
  delete from emparejamientos where creado < now() - interval '1 day';
  return jsonb_build_object('mesa', v_mesa, 'codigo', v_codigo);
end;
$$;

-- 3. canjear(): dos canjes de la misma persona a la vez (celular + PC madre) daban «duplicate key» en vez de «ya_canjeado».
create or replace function public.canjear(p_codigo text, p_pin text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_n int; v_req int; v_hash text; v_premio premio%rowtype; v_hoy int; v_dia date;
begin
  if not public.es_staff() then
    select valor into v_hash from config where clave = 'pin_staff_sha256';
    if v_hash is null then raise exception 'pin_no_configurado'; end if;
    if p_pin is null or encode(digest('somos-diseno:' || p_pin, 'sha256'), 'hex') <> v_hash then raise exception 'pin_incorrecto'; end if;
  end if;
  select id into v_id from credenciales where codigo = upper(trim(p_codigo));
  if v_id is null then raise exception 'credencial_no_existe'; end if;
  if exists (select 1 from canjes where credencial_id = v_id) then raise exception 'ya_canjeado'; end if;
  select count(*) into v_req from sellos_def;
  select count(distinct s.sello) into v_n from sellos s join sellos_def d on d.id = s.sello where s.credencial_id = v_id;
  if v_n < v_req then raise exception 'credencial_incompleta'; end if;
  select * into v_premio from premio where id = 1 for update;
  if v_premio.stock <= 0 then raise exception 'sin_stock'; end if;
  v_dia := (now() at time zone 'America/Santiago')::date;
  select count(*) into v_hoy from canjes where dia = v_dia;
  if v_premio.limite_diario > 0 and v_hoy >= v_premio.limite_diario then raise exception 'limite_diario'; end if;
  begin
    insert into canjes (credencial_id, staff_id, dia) values (v_id, auth.uid(), v_dia);
  exception when unique_violation then raise exception 'ya_canjeado';
  end;
  update premio set stock = stock - 1 where id = 1;
  update credenciales set canjeado = true where id = v_id;
  return jsonb_build_object('ok', true, 'stock', v_premio.stock - 1, 'hoy', v_hoy + 1);
end;
$$;

-- 4. suscribir_push() con un código que no existe guardaba una suscripción huérfana sin avisar.
create or replace function public.suscribir_push(p_codigo text, p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from credenciales where codigo = upper(trim(p_codigo));
  if v_id is null then raise exception 'credencial_no_existe'; end if;
  insert into suscripciones_push (credencial_id, endpoint, p256dh, auth) values (v_id, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set credencial_id = excluded.credencial_id, p256dh = excluded.p256dh, auth = excluded.auth;
end;
$$;

-- 5. Al HUB solo llegan eventos sin código (jugar sin credencial) o de credenciales que existen: un código mal escrito
--    en una tablet o una credencial recién borrada ya no aparecen en la pantalla.
drop policy if exists "publicar eventos" on public.eventos;
create policy "publicar eventos" on public.eventos for insert
  with check (codigo is null or exists (select 1 from public.credenciales c where c.codigo = eventos.codigo));
