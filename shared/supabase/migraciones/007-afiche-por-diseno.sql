-- 007 · Cacería: reconocer el afiche por su diseño (plan 013). Va después de 001-afiches.sql.
-- Idempotente: se puede correr más de una vez. SQL Editor → New query → Run.
--
-- La credencial reconoce el afiche con la cámara comparando su imagen con las miniaturas de los 6 afiches, así que
-- sabe CUÁL afiche es, no su secreto. reconocer_afiche() recibe el id público y timbra igual que encontrar_afiche().
-- Ojo: con esto basta conocer el id (AF01…AF06) para sumar el afiche sin estar frente a él. Para un premio de bajo
-- riesgo se acepta; se puede apagar en cualquier momento y queda el QR del plan 010:
--   update public.config set valor = 'no' where clave = 'cacería_por_diseño';
insert into public.config (clave, valor) values ('cacería_por_diseño', 'si') on conflict (clave) do nothing;

create or replace function public.reconocer_afiche(p_codigo text, p_afiche text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_secreto text;
begin
  if coalesce((select valor from config where clave = 'cacería_por_diseño'), 'no') <> 'si' then
    raise exception 'por_diseno_apagado';
  end if;
  select secreto into v_secreto from afiches where id = upper(trim(p_afiche)) and activo;
  if v_secreto is null then raise exception 'afiche_invalido'; end if;
  return public.encontrar_afiche(p_codigo, v_secreto);
end;
$$;
revoke all on function public.reconocer_afiche(text, text) from public;
grant execute on function public.reconocer_afiche(text, text) to anon, authenticated;
