#!/bin/bash
# Base «qa» desde cero en un Postgres local, con la cadena completa del repo en el orden de docs/supabase.md y
# shared/supabase/migraciones/README.md. Conexión: PGHOST / PGPORT / PGUSER (por defecto el socket local y postgres).
R=$(cd "$(dirname "$0")/../.." && pwd); Q=$(cd "$(dirname "$0")" && pwd)
P="psql -v ON_ERROR_STOP=1 -q -U ${PGUSER:-postgres}"
$P -d postgres -c "drop database if exists qa" -c "create database qa" >/dev/null 2>&1
$P -d qa -f $Q/00-stub.sql >/dev/null 2>&1 || { echo "falló 00-stub.sql"; exit 1; }
T=$(mktemp)
for f in credencial/supabase/schema.sql shared/supabase/eventos.sql shared/supabase/juego.sql fotomaton/supabase/migrations/0001_fotomaton.sql \
         $(cd $R && ls shared/supabase/migraciones/0*.sql); do
  # pg_cron, pg_net y pgcrypto ya «existen» en el stub (como en Supabase).
  sed 's/^create extension if not exists pg_cron;//; s/^create extension if not exists pg_net;//; s/^create extension if not exists pgcrypto;//' $R/$f > $T
  if $P -d qa -f $T > $T.log 2>&1; then echo "ok    $f"; else echo "FALLA $f"; grep -m3 ERROR $T.log; fi
done
rm -f $T $T.log
