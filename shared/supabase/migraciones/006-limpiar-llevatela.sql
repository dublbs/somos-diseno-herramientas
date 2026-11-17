-- 006 · Borrado a las 24 h de lo que se sube con «Llévatela» (plan 011): bucket y tabla `fotomaton`.
-- Va después de fotomaton/supabase/migrations/0001_fotomaton.sql y de desplegar la función `limpiar`.
-- Idempotente. Cada hora, pg_cron llama a `limpiar` (borra archivo y fila vencidos).
-- La clave que va en la llamada es la publishable del proyecto (pública por diseño, la misma de las apps), no un secreto.
create extension if not exists pg_net;
select cron.unschedule('fotomaton-limpiar') where exists (select 1 from cron.job where jobname = 'fotomaton-limpiar');
select cron.schedule('fotomaton-limpiar', '7 * * * *', $$
  select net.http_post(
    url := 'https://opvwftwvfdhhrqwpjvlx.supabase.co/functions/v1/limpiar',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_DUt81vS027WPQEPxuwypbQ_xqrKREvB"}'::jsonb,
    body := '{}'::jsonb);
$$);
-- Comprobar: select status_code, content from net._http_response order by id desc limit 1;  → 200 {"borradas":n}
