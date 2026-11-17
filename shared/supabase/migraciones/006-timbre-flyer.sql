-- 006 · Timbre 4 «Flyer» (plan 012 §8). Va después de 005-eventos-juego.sql.
-- Idempotente: se puede correr más de una vez. SQL Editor → New query → Run.
--
-- El timbre 4 deja de ser «Secreto» (el jefe final): se gana armando tu flyer en la credencial, con lo que juntaste.
-- 1 Inscripción · 2 Creación (4 experiencias) · 3 Cacería (3 afiches) · 4 Flyer (armar y guardar tu flyer).
-- canjear() no cambia: sigue pidiendo todos los timbres de sellos_def (los 4).

-- 1. Nombre del timbre. El token no cambia.
update public.sellos_def set nombre = 'Flyer' where id = 4;

-- 2. sellar_flyer(): la credencial la llama al guardar el flyer. No lleva token: lo que valida es lo que la persona
--    ya juntó. Otorga el timbre 4 solo si esa credencial existe y tiene:
--      · al menos 1 paso de Creación (pasos del sello 2: una experiencia hecha en una tablet), y
--      · al menos 1 afiche encontrado (pasos del sello 3 con el id del afiche; el paso 'unico' de la firma vieja no cuenta).
--    Deja el paso 'flyer' en `pasos` y el timbre en `sellos`, igual que sellar(). Se puede llamar las veces que sea.
--    Devuelve siempre un json (no lanza errores):
--      ok       · la credencial tiene el timbre 4 después de esta llamada
--      otorgado · esta llamada lo otorgó recién (false si ya lo tenía o si falta algo)
--      falta    · lo que falta: 'credencial' (no existe), 'creacion', 'afiche'. Vacío si ok.
create or replace function public.sellar_flyer(p_codigo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_falta text[] := '{}'; v_filas int;
begin
  select id into v_id from credenciales where codigo = upper(trim(p_codigo));
  if v_id is null then
    return jsonb_build_object('ok', false, 'otorgado', false, 'falta', jsonb_build_array('credencial'), 'sello', 4);
  end if;
  -- Si ya lo tiene (por el flyer o por el sello de respaldo del staff), no hay nada que revisar.
  if exists (select 1 from sellos where credencial_id = v_id and sello = 4) then
    return jsonb_build_object('ok', true, 'otorgado', false, 'falta', '[]'::jsonb, 'sello', 4);
  end if;
  if not exists (select 1 from pasos where credencial_id = v_id and sello = 2) then
    v_falta := array_append(v_falta, 'creacion');
  end if;
  if not exists (select 1 from pasos where credencial_id = v_id and sello = 3 and clave <> 'unico') then
    v_falta := array_append(v_falta, 'afiche');
  end if;
  if array_length(v_falta, 1) > 0 then
    return jsonb_build_object('ok', false, 'otorgado', false, 'falta', to_jsonb(v_falta), 'sello', 4);
  end if;
  insert into pasos (credencial_id, sello, clave) values (v_id, 4, 'flyer') on conflict do nothing;
  insert into sellos (credencial_id, sello) values (v_id, 4) on conflict do nothing;
  get diagnostics v_filas = row_count; -- 1 si recién se otorgó (0 si otra llamada simultánea ganó)
  return jsonb_build_object('ok', true, 'otorgado', v_filas = 1, 'falta', '[]'::jsonb, 'sello', 4);
end;
$$;
revoke all on function public.sellar_flyer(text) from public;
grant execute on function public.sellar_flyer(text) to anon, authenticated;

-- 3. Respaldo (plan 012, D2 · opción E): el sello del staff para el timbre 4, por si alguien no puede hacer el flyer
--    (celular sin batería, sin datos). Es un sello de la cacería asignado al timbre 4: lo lee el mismo escáner de la
--    credencial y lo valida encontrar_afiche() (migraciones 001 y 003). Se crea con un secreto aleatorio, que el
--    celular no puede leer. Si ya existía con el nombre viejo, solo se renombra.
insert into public.afiches (id, nombre, lenguaje, sello) values ('SECRETO', 'Flyer', 'Pixel', 4) on conflict (id) do nothing;
update public.afiches set nombre = 'Flyer' where sello = 4 and nombre = 'Secreto';
-- Para generar el sello que lleva el staff (el secreto nunca va al repo; ver credencial/scripts/sellos-afiches.mjs):
--   select id || ':' || secreto || ':' || lenguaje from public.afiches where sello = 4 and activo;
-- Para apagarlo: update public.afiches set activo = false where sello = 4;
