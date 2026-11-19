-- 012 · Timbre 2 «Creación» con meta 2 (19 nov, durante el evento): basta crear en 2 experiencias distintas.
-- Idempotente: se puede correr más de una vez. SQL Editor → New query → Run.
-- Antes: meta 4 (003-timbres-finales.sql). La credencial lee la meta de la base (metas()), así que el cambio se ve
-- solo con correr esto; el código trae 2 como respaldo.

-- 1. La meta.
update public.sellos_def set meta = 2 where id = 2;

-- 2. Quienes ya crearon en 2 o más experiencias reciben el timbre ahora (si no, les llegaría recién con la próxima).
--    Mismo criterio que la reparación de 011-qa-base.sql §2b.
insert into public.sellos (credencial_id, sello)
select p.credencial_id, p.sello from public.pasos p join public.sellos_def d on d.id = p.sello
where p.sello = 2
group by p.credencial_id, p.sello, d.meta having count(*) >= d.meta
on conflict do nothing;

-- Comprobar:
--   select id, nombre, meta from public.sellos_def order by id;          -- el 2 debe decir meta = 2
--   select count(*) from public.sellos where sello = 2;                    -- personas con el timbre Creación
-- Volver atrás (no quita timbres ya entregados): update public.sellos_def set meta = 4 where id = 2;
