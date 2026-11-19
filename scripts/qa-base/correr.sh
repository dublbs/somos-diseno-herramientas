#!/bin/bash
# QA de la base (docs/qa/qa-base-de-datos.md): monta «qa» desde cero y corre los endpoints y las interacciones a la vez.
# Necesita un Postgres 16 local (PGHOST/PGPORT). La prueba de la tablet (30-tablet.cjs) va aparte: ver la bitácora.
Q=$(cd "$(dirname "$0")" && pwd); cd $Q
./montar.sh | grep -v "^ok" ; echo "(base qa montada)"
psql -U ${PGUSER:-postgres} -d qa -f 10-endpoints.sql 2>&1 | grep -v "^$" > /tmp/qa-endpoints.txt
echo "endpoints: $(grep -c '^ok' /tmp/qa-endpoints.txt) ok · $(grep -c '^FALLA' /tmp/qa-endpoints.txt) fallas"; grep '^FALLA' /tmp/qa-endpoints.txt
./20-concurrencia.sh qa
