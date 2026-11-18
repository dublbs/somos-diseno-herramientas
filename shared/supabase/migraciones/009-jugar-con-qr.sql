-- 009 · Jugar en una mesa escaneando un QR (plan 014). Va después de juego.sql (sesiones_mesa).
-- Idempotente: se puede correr más de una vez. SQL Editor → New query → Run.
--
-- La tablet muestra un QR con su mesa y un número de un solo uso (nonce). La persona lo escanea con su credencial:
-- emparejar_mesa() deja anotado qué credencial va a jugar ahí. La tablet pregunta cada pocos segundos con
-- leer_emparejamiento() y, cuando aparece el código, la persona queda como jugadora de esa mesa (su creación suma
-- al timbre Creación al exportar, como si hubiera escrito el código). Nada de esto da timbres por sí solo.

create table if not exists public.emparejamientos (
  mesa text not null check (mesa ~ '^[A-Z0-9]{2,12}$'),
  nonce text not null check (nonce ~ '^[a-z0-9]{8,32}$'),
  codigo text not null check (codigo ~ '^SD-[A-Z0-9]{5}$'),
  app text,
  creado timestamptz not null default now(),
  primary key (mesa, nonce)
);
alter table public.emparejamientos enable row level security;
-- Sin políticas: solo se toca a través de las funciones.

-- Celular: «quiero jugar en esta mesa». El nonce es de un solo uso: el primero que lo escanea se queda con la mesa.
create or replace function public.emparejar_mesa(p_mesa text, p_nonce text, p_codigo text, p_app text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_codigo text := upper(trim(p_codigo)); v_previo text;
begin
  if not exists (select 1 from credenciales where codigo = v_codigo) then raise exception 'credencial_no_existe'; end if;
  select codigo into v_previo from emparejamientos where mesa = upper(trim(p_mesa)) and nonce = lower(trim(p_nonce));
  if v_previo is not null and v_previo <> v_codigo then raise exception 'mesa_ocupada'; end if;
  insert into emparejamientos (mesa, nonce, codigo, app) values (upper(trim(p_mesa)), lower(trim(p_nonce)), v_codigo, p_app)
    on conflict (mesa, nonce) do nothing;
  delete from emparejamientos where creado < now() - interval '1 day';
  return jsonb_build_object('mesa', upper(trim(p_mesa)), 'codigo', v_codigo);
end;
$$;

-- Tablet: «¿alguien escaneó mi QR?». Devuelve el código de la credencial o null. Solo sirve con el nonce exacto.
create or replace function public.leer_emparejamiento(p_mesa text, p_nonce text)
returns text language sql security definer set search_path = public stable as $$
  select codigo from emparejamientos
  where mesa = upper(trim(p_mesa)) and nonce = lower(trim(p_nonce)) and creado > now() - interval '2 hours';
$$;

revoke all on function public.emparejar_mesa(text, text, text, text) from public;
revoke all on function public.leer_emparejamiento(text, text) from public;
grant execute on function public.emparejar_mesa(text, text, text, text) to anon, authenticated;
grant execute on function public.leer_emparejamiento(text, text) to anon, authenticated;
