-- 003 · Timbres finales (plan 009). Va después de 001-afiches.sql y 002-eventos-graffiti.sql.
-- Idempotente: se puede correr más de una vez. SQL Editor → New query → Run.
--
-- 1 Inscripción · 2 Creación (4 experiencias distintas) · 3 Cacería (3 afiches) · 4 Secreto (el jefe final o su plan B).

-- 1. Nombres y metas. Los tokens no cambian.
update public.sellos_def set nombre = 'Cacería' where id = 3;
update public.sellos_def set nombre = 'Secreto' where id = 4;
-- Cada experiencia anota un paso con su nombre (p_clave = 'graffiti', 'mosaicos'…): 4 distintas otorgan el timbre.
update public.sellos_def set meta = 4 where id = 2;

-- 2. canjear(): la credencial completa son TODOS los timbres de sellos_def (hoy los 4). Antes pedía 1, 2 y 3 fijos.
--    El resto es igual a shared/supabase/juego.sql §5.
create or replace function public.canjear(p_codigo text, p_pin text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_n int; v_req int; v_hash text; v_premio premio%rowtype; v_hoy int; v_dia date;
begin
  if not public.es_staff() then
    select valor into v_hash from config where clave = 'pin_staff_sha256';
    if v_hash is null then raise exception 'pin_no_configurado'; end if;
    if p_pin is null or encode(digest('somos-diseno:' || p_pin, 'sha256'), 'hex') <> v_hash then raise exception 'pin_incorrecto'; end if;
  end if;
  select id into v_id from credenciales where codigo = upper(p_codigo);
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
  insert into canjes (credencial_id, staff_id, dia) values (v_id, auth.uid(), v_dia);
  update premio set stock = stock - 1 where id = 1;
  update credenciales set canjeado = true where id = v_id;
  return jsonb_build_object('ok', true, 'stock', v_premio.stock - 1, 'hoy', v_hoy + 1);
end;
$$;
revoke all on function public.canjear(text, text) from public;
grant execute on function public.canjear(text, text) to anon, authenticated;

-- 3. Vista del PC madre: suma cuántas experiencias distintas lleva cada persona (timbre 2).
--    Las columnas nuevas van al final (create or replace view no deja reordenar).
create or replace view public.personas as
  select c.id, c.codigo, c.nombre, c.marco, c.receta, c.creada, c.canjeado,
    coalesce((select array_agg(s.sello order by s.sello) from sellos s where s.credencial_id = c.id), '{}') as sellos,
    (select count(*)::int from pasos p where p.credencial_id = c.id and p.sello = 3) as portales,
    (select count(*)::int from suscripciones_push sp where sp.credencial_id = c.id) as avisos,
    (select count(*)::int from pasos p where p.credencial_id = c.id and p.sello = 2) as creaciones
  from credenciales c;

-- 4. encontrar_afiche() también dice a qué timbre pertenece el sello (para el plan B del Secreto, timbre 4).
create or replace function public.encontrar_afiche(p_codigo text, p_secreto text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_afiche text; v_sello smallint; v_token text; v_repetido boolean;
begin
  select a.id, a.sello into v_afiche, v_sello from afiches a where upper(a.secreto) = upper(trim(p_secreto)) and a.activo;
  if v_afiche is null then raise exception 'afiche_invalido'; end if;
  select token into v_token from sellos_def where id = v_sello;
  select exists (select 1 from pasos p join credenciales c on c.id = p.credencial_id
                 where c.codigo = upper(p_codigo) and p.sello = v_sello and p.clave = v_afiche) into v_repetido;
  return public.sellar(p_codigo, v_sello, v_token, v_afiche) || jsonb_build_object('afiche', v_afiche, 'repetido', v_repetido, 'sello', v_sello);
end;
$$;
revoke all on function public.encontrar_afiche(text, text) from public;
grant execute on function public.encontrar_afiche(text, text) to anon, authenticated;

-- 5. Plan B del Secreto (plan 009 §1), solo si el jefe final no está a tiempo. No se corre ahora:
--   insert into public.afiches (id, nombre, lenguaje, sello) values ('SECRETO', 'Secreto', 'Pixel', 4) on conflict (id) do nothing;
--   select secreto from public.afiches where id = 'SECRETO';   -- para generar su sello con sellos:afiches
