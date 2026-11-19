-- QA de endpoints de la base: cada llamada como el rol que la hace en el evento. Resultado en la tabla r.
\set QUIET on
\pset tuples_only on
\pset format unaligned
create temp table r (n serial, id text, rol text, esperado text, obtenido text, ok boolean);
grant all on r to public; grant all on r_n_seq to public;
create or replace function pg_temp.t(p_id text, p_sql text, p_esperado text) returns void language plpgsql as $$
declare v text;
begin
  begin execute p_sql into v; v := coalesce(v, '(null)');
  exception when others then v := 'ERROR: ' || sqlerrm; end;
  insert into r (id, rol, esperado, obtenido, ok) values (p_id, current_user, p_esperado, v, v ~ p_esperado);
end $$;
grant execute on function pg_temp.t(text, text, text) to public;

-- Preparación (postgres): PIN 4321, stock 3, staff admin y mesa, cacería por diseño encendida.
insert into config (clave, valor) values ('pin_staff_sha256', encode(extensions.digest('somos-diseno:4321', 'sha256'), 'hex')) on conflict (clave) do update set valor = excluded.valor;
update premio set stock = 3, limite_diario = 0 where id = 1;
alter table auth.users disable trigger user;
insert into auth.users (id, email) values ('aaaaaaaa-0000-0000-0000-000000000001', 'admin@x.test'), ('aaaaaaaa-0000-0000-0000-000000000002', 'mesa@x.test'), ('aaaaaaaa-0000-0000-0000-000000000003', 'nadie@x.test') on conflict do nothing;
alter table auth.users enable trigger user;
insert into staff (user_id, nombre, rol) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Admin', 'admin'), ('aaaaaaaa-0000-0000-0000-000000000002', 'Mesa', 'mesa') on conflict do nothing;
select token as tok1 from sellos_def where id = 1 \gset
select token as tok2 from sellos_def where id = 2 \gset
select token as tok3 from sellos_def where id = 3 \gset
select string_agg(id, ',' order by id) as afiches from afiches where activo \gset
select secreto as sec1 from afiches where activo order by id limit 1 \gset
select id as af1 from afiches where activo order by id limit 1 \gset
select id as af2 from afiches where activo order by id offset 1 limit 1 \gset
select id as af3 from afiches where activo order by id offset 2 limit 1 \gset
select secreto as sec2 from afiches where activo order by id offset 1 limit 1 \gset

-- ============ CELULAR (anon) ============
set role anon;
-- C1 crear credencial (store.crear: insert y select codigo)
insert into credenciales (nombre, receta, marco) values ('Camila', '{"retrato":"personaje","id":"pixel"}', 'PM05') returning codigo as cam \gset
insert into credenciales (nombre, receta, marco) values ('Tomás', '{"retrato":"personaje","id":"geometrica"}', 'GM02') returning codigo as tom \gset
select pg_temp.t('C1 código nuevo con el formato de la base', format($$select %L ~ '^SD-[A-Z0-9]{5}$'$$, :'cam'), '^true$');
select pg_temp.t('C1b timbre 1 automático al crear', format($$select string_agg(sello::text, ',') from sellos s join credenciales c on c.id = s.credencial_id where c.codigo = %L$$, :'cam'), '^1$');
select pg_temp.t('C2 nombre de 15 letras se rechaza', $$insert into credenciales (nombre, receta) values ('ABCDEFGHIJKLMNO', '{}') returning codigo$$, 'ERROR');
select pg_temp.t('C2b nombre vacío se rechaza', $$insert into credenciales (nombre, receta) values ('', '{}') returning codigo$$, 'ERROR');
select pg_temp.t('C3 obtener() lee su credencial con timbres', format($$select json_build_object('n', nombre, 's', (select array_agg(sello) from sellos where credencial_id = c.id))::text from credenciales c where codigo = %L$$, :'cam'), 'Camila');
select pg_temp.t('C4 anon NO puede cambiar el nombre de otro', format($$with u as (update credenciales set nombre = 'X' where codigo = %L returning 1) select count(*) from u$$, :'tom'), '^0$');
select pg_temp.t('C4b anon NO puede marcarse canjeado', format($$with u as (update credenciales set canjeado = true where codigo = %L returning 1) select count(*) from u$$, :'cam'), '^0$');
select pg_temp.t('C4c anon NO puede borrar credenciales', format($$with u as (delete from credenciales where codigo = %L returning 1) select count(*) from u$$, :'tom'), '^0$');
select pg_temp.t('C5 anon NO puede darse timbres directo (sellos)', format($$insert into sellos (credencial_id, sello) select id, 4 from credenciales where codigo = %L returning sello$$, :'cam'), 'ERROR');
select pg_temp.t('C5b anon NO puede escribir pasos directo', format($$insert into pasos (credencial_id, sello, clave) select id, 2, 'x' from credenciales where codigo = %L returning sello$$, :'cam'), 'ERROR');
select pg_temp.t('C5c anon NO puede insertarse un canje', format($$insert into canjes (credencial_id, dia) select id, current_date from credenciales where codigo = %L returning dia$$, :'cam'), 'ERROR');
select pg_temp.t('C5d anon NO puede subir el stock', $$with u as (update premio set stock = 999 returning 1) select count(*) from u$$, '^0$');
select pg_temp.t('C5e anon NO lee el hash del PIN (config)', $$select count(*) from config where clave = 'pin_staff_sha256'$$, '^0$');
select pg_temp.t('C5f anon NO lee los tokens de los sellos', $$select token from sellos_def where id = 2$$, 'ERROR|\(null\)');
select pg_temp.t('C5g anon NO lee los secretos de los afiches', $$select secreto from afiches limit 1$$, 'ERROR|\(null\)');
select pg_temp.t('C5h anon NO lee la lista del staff', $$select count(*) from staff$$, '^0$|ERROR');
select pg_temp.t('C5i anon NO escribe config (modo juego)', $$insert into config (clave, valor) values ('mesas_modo_juego', 'no') returning clave$$, 'ERROR');
select pg_temp.t('C5j anon NO lee suscripciones push', $$select count(*) from suscripciones_push$$, '^0$|ERROR');

-- C6 sellar (estaciones y cacería por QR)
select pg_temp.t('C6 sellar estación 1 con token', format($$select public.sellar(%L, 1::smallint, %L, 'unico')::text$$, :'cam', :'tok1'), '"pasos": 1');
select pg_temp.t('C6b token inválido', format($$select public.sellar(%L, 2::smallint, 'NOPE', 'x')::text$$, :'cam'), 'token_invalido');
select pg_temp.t('C6c credencial que no existe', format($$select public.sellar('SD-ZZZZZ', 2::smallint, %L, 'graffiti')::text$$, :'tok2'), 'credencial_no_existe');
select pg_temp.t('C6d código en minúsculas', format($$select public.sellar(lower(%L), 2::smallint, %L, 'graffiti')::text$$, :'cam', :'tok2'), '"pasos": 1');
select pg_temp.t('C6e código con espacios', format($$select public.sellar(' ' || %L || ' ', 2::smallint, %L, 'mosaicos')::text$$, :'cam', :'tok2'), '"pasos": 2');
select pg_temp.t('C6f misma experiencia dos veces no suma', format($$select public.sellar(%L, 2::smallint, %L, 'graffiti')::text$$, :'cam', :'tok2'), '"pasos": 2');
select pg_temp.t('C6g firma vieja (sin clave) responde', format($$select public.sellar(%L, 2::smallint, %L)::text$$, :'tom', :'tok2'), 'true');
select pg_temp.t('C6h sello inexistente (9)', format($$select public.sellar(%L, 9::smallint, %L, 'x')::text$$, :'cam', :'tok2'), 'token_invalido|ERROR');

-- C7 cacería: encontrar_afiche / reconocer_afiche
select pg_temp.t('C7 encontrar afiche válido', format($$select public.encontrar_afiche(%L, %L)::text$$, :'cam', :'sec1'), '"repetido": false');
select pg_temp.t('C7b mismo afiche otra vez: repetido', format($$select public.encontrar_afiche(%L, %L)::text$$, :'cam', :'sec1'), '"repetido": true');
select pg_temp.t('C7c secreto en minúsculas', format($$select public.encontrar_afiche(%L, lower(%L))::text$$, :'cam', :'sec2'), '"pasos": 2');
select pg_temp.t('C7d secreto inválido', format($$select public.encontrar_afiche(%L, 'NADA')::text$$, :'cam'), 'afiche_invalido');
select pg_temp.t('C7e afiche para credencial inexistente', format($$select public.encontrar_afiche('SD-ZZZZZ', %L)::text$$, :'sec1'), 'credencial_no_existe');
select pg_temp.t('C7f reconocer_afiche por id (cámara)', format($$select public.reconocer_afiche(%L, %L)::text$$, :'cam', :'af3'), '"sello_otorgado": true');
select pg_temp.t('C7g reconocer id inexistente', format($$select public.reconocer_afiche(%L, 'AF99')::text$$, :'cam'), 'afiche_invalido');
select pg_temp.t('C7h tercer afiche da el timbre 3', format($$select string_agg(sello::text, ',' order by sello) from sellos s join credenciales c on c.id = s.credencial_id where c.codigo = %L$$, :'cam'), '^1,3$');

-- C8 flyer (timbre 4)
select pg_temp.t('C8 flyer sin creaciones (Tomás tiene 1 paso con clave unico)', format($$select public.sellar_flyer(%L)::text$$, :'tom'), 'afiche');
select pg_temp.t('C8b flyer de credencial inexistente', $$select public.sellar_flyer('SD-ZZZZZ')::text$$, 'credencial');
select pg_temp.t('C8c flyer de Camila (tiene creación y afiche)', format($$select public.sellar_flyer(%L)::text$$, :'cam'), '"otorgado": true');
select pg_temp.t('C8d flyer otra vez: no se duplica', format($$select public.sellar_flyer(%L)::text$$, :'cam'), '"otorgado": false');

-- C9 metas y progreso
select pg_temp.t('C9 metas()', $$select json_agg(m)::text from public.metas() m$$, '"meta"');
select pg_temp.t('C9b pasos de la persona (inventario)', format($$select count(*) from pasos p join credenciales c on c.id = p.credencial_id where c.codigo = %L$$, :'cam'), '^[0-9]+$');

-- C10 canje desde el celular con PIN
select pg_temp.t('C10 canje sin PIN', format($$select public.canjear(%L)::text$$, :'cam'), 'pin_incorrecto');
select pg_temp.t('C10b canje PIN incorrecto', format($$select public.canjear(%L, '0000')::text$$, :'cam'), 'pin_incorrecto');
select pg_temp.t('C10c canje incompleto (falta 2)', format($$select public.canjear(%L, '4321')::text$$, :'cam'), 'credencial_incompleta');
select pg_temp.t('C10d sellar 2 dos experiencias más (4 de 4)', format($$select (public.sellar(%L, 2::smallint, %L, 'fotomaton') || public.sellar(%L, 2::smallint, %L, 'teatro'))::text$$, :'cam', :'tok2', :'cam', :'tok2'), '"sello_otorgado": true');
select pg_temp.t('C10e canje completo con PIN', format($$select public.canjear(%L, '4321')::text$$, :'cam'), '"ok": true');
select pg_temp.t('C10f canje dos veces', format($$select public.canjear(%L, '4321')::text$$, :'cam'), 'ya_canjeado');
select pg_temp.t('C10g canje de credencial inexistente', $$select public.canjear('SD-ZZZZZ', '4321')::text$$, 'credencial_no_existe');
select pg_temp.t('C10h canje en minúsculas', format($$select public.canjear(lower(%L), '4321')::text$$, :'cam'), 'ya_canjeado');

-- C11 avisos push
select pg_temp.t('C11 suscribir push', format($$select public.suscribir_push(%L, 'https://push.test/1', 'k', 'a')::text$$, :'cam'), '');
select pg_temp.t('C11b suscribir con código inexistente', $$select public.suscribir_push('SD-ZZZZZ', 'https://push.test/2', 'k', 'a')::text$$, 'credencial_no_existe');

-- ============ TABLET (anon) ============
select pg_temp.t('T1 config_mesas con mesa', $$select public.config_mesas('KQXT')::text$$, '"token2"');
select pg_temp.t('T1b config_mesas da el token de la estación 2', format($$select public.config_mesas()->>'token2' = %L$$, :'tok2'), '^true$');
select pg_temp.t('T2 verificar PIN correcto', $$select public.verificar_pin_staff('4321')::text$$, '^true$');
select pg_temp.t('T2b verificar PIN incorrecto', $$select public.verificar_pin_staff('1111')::text$$, '^false$');
select pg_temp.t('T2c verificar PIN null', $$select public.verificar_pin_staff(null)::text$$, '^false$');
select pg_temp.t('T3 sesión de mesa (return=minimal)', format($$with i as (insert into sesiones_mesa (mesa, app, codigo) values ('KQXT', 'graffiti', %L)) select 'ok'$$, :'tom'), '^ok$');
select pg_temp.t('T3b sesión con código mal formado', $$with i as (insert into sesiones_mesa (mesa, app, codigo) values ('KQXT', 'graffiti', 'SD-1')) select 'ok'$$, 'check constraint');
select pg_temp.t('T3c anon NO lee las sesiones', $$select count(*) from sesiones_mesa$$, '^0$|ERROR');
select pg_temp.t('T4 creación en la tablet (sellar 2 con token de config_mesas)', format($$select public.sellar(%L, 2::smallint, (public.config_mesas()->>'token2'), 'graffiti')::text$$, :'tom'), '"pasos"');
select pg_temp.t('T5 emparejar mesa (celular)', format($$select public.emparejar_mesa('KQXT', 'abcdefgh23', %L, 'graffiti')::text$$, :'tom'), '"codigo"');
select pg_temp.t('T5b la tablet lee el emparejamiento', $$select public.leer_emparejamiento('KQXT', 'abcdefgh23')$$, '^SD-');
select pg_temp.t('T5c otra persona con el mismo QR: mesa ocupada', format($$select public.emparejar_mesa('KQXT', 'abcdefgh23', %L, 'graffiti')::text$$, :'cam'), 'mesa_ocupada');
select pg_temp.t('T5d la misma persona dos veces: ok', format($$select public.emparejar_mesa('kqxt', 'ABCDEFGH23', lower(%L), 'graffiti')::text$$, :'tom'), '"codigo"');
select pg_temp.t('T5e emparejar con código inexistente', $$select public.emparejar_mesa('KQXT', 'zzzzzzzz22', 'SD-ZZZZZ', 'graffiti')::text$$, 'credencial_no_existe');
select pg_temp.t('T5f nonce corto (formato malo) da error claro', format($$select public.emparejar_mesa('KQXT', 'abc', %L, 'graffiti')::text$$, :'tom'), 'ERROR');
select pg_temp.t('T5g nonce desconocido: null', $$select public.leer_emparejamiento('KQXT', 'nadanada99')$$, '\(null\)');
select pg_temp.t('T5h anon NO lee la tabla de emparejamientos', $$select count(*) from emparejamientos$$, '^0$|ERROR');

-- ============ HUB y eventos (anon) ============
select pg_temp.t('H1 publicar evento de cada tipo', format($$select count(*) from (select 1 from (values ('credencial'),('timbre'),('vagon'),('grabado'),('mosaico'),('audio'),('graffiti'),('foto'),('juego')) t(tipo), lateral (select 1) x) s$$), '^9$');
select pg_temp.t('H1b insertar los 9 tipos', format($$with i as (insert into eventos (tipo, codigo, datos) select tipo, %L, '{"png":"data:image/png;base64,AAAA"}' from unnest(array['credencial','timbre','vagon','grabado','mosaico','audio','graffiti','foto','juego']) tipo returning 1) select count(*) from i$$, :'tom'), '^9$');
select pg_temp.t('H1c tipo desconocido (teatro) se rechaza', $$insert into eventos (tipo, datos) values ('teatro', '{}') returning id$$, 'ERROR');
select pg_temp.t('H1d evento sin credencial (jugar sin credencial)', $$insert into eventos (tipo, codigo, datos) values ('mosaico', null, '{"png":"x"}') returning tipo$$, 'mosaico');
select pg_temp.t('H1e evento de credencial existente (código de la base)', format($$with i as (insert into eventos (tipo, codigo, datos) values ('timbre', %L, '{"sello":2}')) select 'ok'$$, :'tom'), '^ok$');
select pg_temp.t('H1f imagen de ~400 KB se rechaza', $$insert into eventos (tipo, datos) values ('mosaico', jsonb_build_object('png', (select string_agg(md5(i::text), '') from generate_series(1, 13000) i))) returning tipo$$, 'ERROR');
select pg_temp.t('H2 HUB lee recientes', $$select count(*) > 0 from (select * from eventos where tipo = 'credencial' order by creado desc limit 60) e$$, '^true$');
select pg_temp.t('H3 anon NO borra eventos', $$with d as (delete from eventos returning 1) select count(*) from d$$, '^0$');
select pg_temp.t('H3b anon NO edita eventos', $$with u as (update eventos set datos = '{}' returning 1) select count(*) from u$$, '^0$');
select pg_temp.t('H4 anon NO puede ocultar_evento', $$select public.ocultar_evento(1)::text$$, 'solo_staff');
select pg_temp.t('H4b anon NO puede recargar_hub', $$select public.recargar_hub()::text$$, 'solo_staff');
select pg_temp.t('H4c anon NO puede empezar_de_cero', $$select public.empezar_de_cero('BORRAR TODO')::text$$, 'solo_admin');
select pg_temp.t('H4d anon NO ve el resumen', $$select public.resumen_evento()::text$$, 'solo_staff');
select pg_temp.t('H4e anon NO puede aprobar staff', $$select public.aprobar_staff('aaaaaaaa-0000-0000-0000-000000000003', 'X', 'admin')::text$$, 'ERROR|solo|admin');
select pg_temp.t('H4f anon NO ve cuentas pendientes', $$select count(*) from public.cuentas_pendientes()$$, 'ERROR|^0$');
select pg_temp.t('H4g anon NO llama marcar_recarga_hub', $$select public.marcar_recarga_hub()::text$$, 'ERROR');
select pg_temp.t('H5 «Llévatela»: anon sube fila fotomaton', $$select count(*) >= 0 from fotomaton$$, 'true|ERROR');

-- ============ PC MADRE (authenticated) ============
reset role; set role authenticated; select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000002', false) \g /dev/null
select pg_temp.t('P1 mesa: es_staff', $$select public.es_staff()::text$$, '^true$');
select pg_temp.t('P1b mesa: no es admin', $$select public.es_admin()::text$$, '^false$');
select pg_temp.t('P2 mesa: ve personas', $$select count(*) from personas$$, '^[1-9]');
select pg_temp.t('P3 mesa: da un timbre', format($$insert into sellos (credencial_id, sello) select id, 3 from credenciales where codigo = %L returning sello$$, :'tom'), '^3$');
select pg_temp.t('P3b mesa: quita un timbre', format($$with d as (delete from sellos where sello = 3 and credencial_id = (select id from credenciales where codigo = %L) returning 1) select count(*) from d$$, :'tom'), '^1$');
select pg_temp.t('P4 mesa: canjea sin PIN (Tomás incompleto)', format($$select public.canjear(%L)::text$$, :'tom'), 'credencial_incompleta');
select pg_temp.t('P5 mesa: NO borra credenciales', format($$with d as (delete from credenciales where codigo = %L returning 1) select count(*) from d$$, :'tom'), '^0$');
select pg_temp.t('P5b mesa: NO cambia el stock', $$with u as (update premio set stock = 50 returning 1) select count(*) from u$$, '^0$');
select pg_temp.t('P5c mesa: NO cambia config', $$insert into config (clave, valor) values ('mesas_modo_juego', 'no') on conflict (clave) do update set valor = 'no' returning clave$$, 'ERROR');
select pg_temp.t('P6 mesa: resumen', $$select public.resumen_evento()->>'credenciales'$$, '^[0-9]+$');
select pg_temp.t('P6b mesa: NO empieza de cero', $$select public.empezar_de_cero('BORRAR TODO')::text$$, 'solo_admin');
select pg_temp.t('P6c mesa: lee sesiones', $$select count(*) from sesiones_mesa$$, '^[1-9]');
select pg_temp.t('P6d mesa: manda aviso (notificaciones)', $$insert into notificaciones (titulo, cuerpo) values ('Hola', 'Prueba') returning titulo$$, 'Hola');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000003', false) \g /dev/null
select pg_temp.t('P7 cuenta sin aprobar: no es staff', $$select public.es_staff()::text$$, '^false$');
select pg_temp.t('P7b cuenta sin aprobar: NO da timbres', format($$insert into sellos (credencial_id, sello) select id, 3 from credenciales where codigo = %L returning sello$$, :'tom'), 'ERROR');
select pg_temp.t('P7c cuenta sin aprobar: canje sin PIN falla', format($$select public.canjear(%L)::text$$, :'tom'), 'pin_incorrecto');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false) \g /dev/null
select pg_temp.t('P8 admin: cambia el stock', $$with u as (update premio set stock = 3 returning 1) select count(*) from u$$, '^1$');
select pg_temp.t('P8b admin: guarda el modo juego', $$insert into config (clave, valor) values ('mesas_modo_juego', 'si') on conflict (clave) do update set valor = excluded.valor returning valor$$, 'si');
select pg_temp.t('P8c admin: ve cuentas pendientes', $$select count(*) from public.cuentas_pendientes()$$, '^[0-9]+$');
select pg_temp.t('P8d admin: aprueba una cuenta', $$select public.aprobar_staff('aaaaaaaa-0000-0000-0000-000000000003', 'Nueva', 'mesa')::text$$, '');
select pg_temp.t('P8e admin: no puede quitarse a sí mismo', $$select public.quitar_staff('aaaaaaaa-0000-0000-0000-000000000001')::text$$, 'ERROR');
select pg_temp.t('P8f admin: quita la cuenta nueva', $$select public.quitar_staff('aaaaaaaa-0000-0000-0000-000000000003')::text$$, '');
select pg_temp.t('P9 admin: empezar de cero con frase mala', $$select public.empezar_de_cero('borrar')::text$$, 'frase_incorrecta');
select pg_temp.t('P10 admin: borra credencial y sale del HUB', format($$with d as (delete from credenciales where codigo = %L returning codigo) select count(*) from d$$, :'tom'), '^1$');
select pg_temp.t('P10b sin eventos de la borrada', format($$select count(*) from eventos where codigo = %L$$, :'tom'), '^0$');

-- ============ 011 ============
set role anon;
select pg_temp.t('X1 código nuevo sin 0, O, 1 ni I', $$select string_agg(codigo, ',') from (select codigo from credenciales order by creada desc limit 3) c where codigo !~ '^SD-[A-HJ-NP-Z2-9]{5}$'$$, '\(null\)');
select pg_temp.t('X2 evento de credencial inexistente no llega al HUB', $$insert into eventos (tipo, codigo, datos) values ('timbre', 'SD-ZZZZ9', '{"sello":2}') returning tipo$$, 'ERROR');
select pg_temp.t('X2b evento sin código sigue llegando', $$with i as (insert into eventos (tipo, codigo, datos) values ('mosaico', null, '{"png":"x"}')) select 'ok'$$, '^ok$');
select pg_temp.t('X2c evento de credencial existente llega', format($$with i as (insert into eventos (tipo, codigo, datos) values ('timbre', %L, '{"sello":2}')) select 'ok'$$, :'cam'), '^ok$');
reset role;
select format('%s|%s|%s|%s|%s', case when ok then 'ok' else 'FALLA' end, id, rol, esperado, left(obtenido, 140)) from r order by n;
