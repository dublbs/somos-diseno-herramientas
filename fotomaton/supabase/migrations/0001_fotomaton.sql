-- Registro de tarjetas. El id es el uuid del enlace del QR.
create table if not exists fotomaton (
  id uuid primary key default gen_random_uuid(),
  ruta text not null,            -- ruta en el bucket
  marco text not null,           -- ej. PM05
  tinta text not null,
  creado timestamptz default now(),
  expira timestamptz default now() + interval '24 hours'
);

alter table fotomaton enable row level security;

-- La tablet (anon) solo puede insertar. Nadie lee ni lista desde el navegador:
-- la lectura pasa por la Edge Function `tarjeta` (service role).
create policy "tablet inserta" on fotomaton for insert to anon with check (true);

-- Bucket privado, sin listado público.
insert into storage.buckets (id, name, public) values ('fotomaton', 'fotomaton', false)
on conflict (id) do nothing;

create policy "tablet sube tarjetas" on storage.objects for insert to anon
  with check (bucket_id = 'fotomaton');

-- Borrado a las 24 h: cada hora llama a la Edge Function `limpiar`.
-- Antes: create extension pg_cron; create extension pg_net; y guardar los secretos en Vault.
-- select cron.schedule('fotomaton-limpiar', '0 * * * *', $$
--   select net.http_post(
--     url := 'https://<PROYECTO>.supabase.co/functions/v1/limpiar',
--     headers := jsonb_build_object('Authorization', 'Bearer ' || '<SERVICE_ROLE_KEY>'));
-- $$);
