#!/bin/bash
# Interacciones múltiples a la vez contra la base «qa», como anon (celulares y tablets) y authenticated (PC madre).
DB=${1:-qa}
P="psql -U ${PGUSER:-postgres} -d $DB -tAq"
anon() { $P -c "set role anon; $1" 2>&1 | grep -oE 'ERROR:.*|^\{.*|^[a-z]+$|^SD-.*|^[0-9]+$' | head -1; }
nueva() { $P -c "set role anon; insert into credenciales (nombre, receta) values ('$1', '{}') returning codigo" | head -1; }
TOK2=$($P -c "select token from sellos_def where id = 2"); TOK1=$($P -c "select token from sellos_def where id = 1")
SECS=($($P -c "select secreto from afiches where activo and sello = 3 order by id limit 3"))
$P -c "insert into config (clave, valor) values ('pin_staff_sha256', encode(extensions.digest('somos-diseno:4321', 'sha256'), 'hex')) on conflict (clave) do update set valor = excluded.valor; update premio set stock = 1, limite_diario = 0;"
completar() { local c=$1; for a in graffiti mosaicos fotomaton teatro; do anon "select public.sellar('$c', 2::smallint, '$TOK2', '$a')" >/dev/null; done
  for s in "${SECS[@]}"; do anon "select public.encontrar_afiche('$c', '$s')" >/dev/null; done; anon "select public.sellar_flyer('$c')" >/dev/null; }

echo "== M1 · 4 tablets timbran la misma credencial a la vez (4 experiencias distintas) · 10 repeticiones"
bien=0; for k in $(seq 1 10); do A=$(nueva Ana$k)
  for a in graffiti mosaicos fotomaton teatro; do anon "select public.sellar('$A', 2::smallint, '$TOK2', '$a')" > /tmp/$DB-m1-$a.txt & done; wait
  t2=$($P -c "select count(*) from sellos s join credenciales c on c.id=s.credencial_id where c.codigo='$A' and sello=2"); nv=$(cat /tmp/$DB-m1-*.txt | grep -c '"nuevo": true')
  [ "$t2" = 1 ] && [ "$nv" = 1 ] && bien=$((bien+1)); done
echo "   con el timbre 2 entregado una sola vez: $bien de 10"
echo "== M1b · 3 afiches encontrados a la vez"
bien=0; for k in $(seq 1 10); do A=$(nueva Afi$k)
  for s in "${SECS[@]}"; do anon "select public.encontrar_afiche('$A', '$s')" > /tmp/$DB-m1b-$s.txt & done; wait
  t3=$($P -c "select count(*) from sellos s join credenciales c on c.id=s.credencial_id where c.codigo='$A' and sello=3"); [ "$t3" = 1 ] && bien=$((bien+1)); done
echo "   con el timbre 3 entregado: $bien de 10"

echo "== M2 · la misma experiencia timbrada 5 veces a la vez (doble toque, reintento)"
B=$(nueva Beto)
for i in 1 2 3 4 5; do anon "select public.sellar('$B', 2::smallint, '$TOK2', 'graffiti')" > /tmp/$DB-m2-$i.txt & done; wait
echo "   pasos de graffiti: $($P -c "select count(*) from pasos p join credenciales c on c.id=p.credencial_id where c.codigo='$B' and sello=2") · errores: $(cat /tmp/$DB-m2-*.txt | grep -c ERROR)"

echo "== M3 · dos personas completas canjean a la vez con 1 premio en stock"
C=$(nueva Caro); D=$(nueva Dani); completar $C; completar $D
echo "   sellos de Caro: $($P -c "select string_agg(sello::text, ',' order by sello) from sellos s join credenciales c on c.id=s.credencial_id where c.codigo='$C'")"
anon "select public.canjear('$C', '4321')" > /tmp/$DB-m3-c.txt & anon "select public.canjear('$D', '4321')" > /tmp/$DB-m3-d.txt & wait
echo "   Caro: $(cat /tmp/$DB-m3-c.txt) · Dani: $(cat /tmp/$DB-m3-d.txt) · stock: $($P -c 'select stock from premio') · canjes: $($P -c 'select count(*) from canjes')"

echo "== M4 · la misma persona canjea dos veces a la vez (celular + PC madre)"
$P -c "update premio set stock = 5"; E=$(nueva Eli); completar $E
anon "select public.canjear('$E', '4321')" > /tmp/$DB-m4-a.txt & anon "select public.canjear('$E', '4321')" > /tmp/$DB-m4-b.txt & wait
echo "   1: $(cat /tmp/$DB-m4-a.txt) · 2: $(cat /tmp/$DB-m4-b.txt) · stock: $($P -c 'select stock from premio') (debe ser 4)"

echo "== M5 · dos celulares escanean el mismo QR de mesa a la vez · 10 repeticiones"
bien=0; for k in $(seq 1 10); do F=$(nueva Fer$k); G=$(nueva Gab$k); N="qrqrqr${k}zz"
  anon "select public.emparejar_mesa('MESA1', '$N', '$F', 'graffiti')" > /tmp/$DB-m5-f.txt & anon "select public.emparejar_mesa('MESA1', '$N', '$G', 'graffiti')" > /tmp/$DB-m5-g.txt & wait
  ok=$(cat /tmp/$DB-m5-f.txt $DB-m5-g.txt | grep -c '"codigo"'); oc=$(cat /tmp/$DB-m5-f.txt $DB-m5-g.txt | grep -c mesa_ocupada)
  ve=$(anon "select public.leer_emparejamiento('MESA1', '$N')"); dijo=$(cat /tmp/$DB-m5-f.txt $DB-m5-g.txt | grep -o 'SD-[A-Z0-9]*')
  [ "$ok" = 1 ] && [ "$oc" = 1 ] && [ "$ve" = "$dijo" ] && bien=$((bien+1)); done
echo "   uno entra (y es el que ve la tablet) y el otro recibe mesa_ocupada: $bien de 10"

echo "== M6 · flyer pedido dos veces a la vez"
H=$(nueva Hugo); for a in graffiti; do anon "select public.sellar('$H', 2::smallint, '$TOK2', '$a')" >/dev/null; done; anon "select public.encontrar_afiche('$H', '${SECS[0]}')" >/dev/null
anon "select public.sellar_flyer('$H')" > /tmp/$DB-m6-a.txt & anon "select public.sellar_flyer('$H')" > /tmp/$DB-m6-b.txt & wait
echo "   otorgado=true en: $(cat /tmp/$DB-m6-*.txt | grep -c '"otorgado": true') respuesta(s) (debe ser 1) · errores: $(cat /tmp/$DB-m6-*.txt | grep -c ERROR)"

echo "== M7 · 1000 credenciales: ¿choques de código? (el código lo genera la base)"
$P -c "set role anon; insert into credenciales (nombre, receta) select 'P' || i, '{}' from generate_series(1, 1000) i" 2>&1 | head -2
echo "   credenciales: $($P -c 'select count(*) from credenciales') · con 0 o 1 en el código: $($P -c "select count(*) from credenciales where codigo ~ '[01]'")"
echo "   prob. de al menos un choque con N personas (16^5 códigos): 500 → $(python3 -c 'import math;print(round(1-math.exp(-500*499/2/16**5),3))') · 1000 → $(python3 -c 'import math;print(round(1-math.exp(-1000*999/2/16**5),3))') · 2000 → $(python3 -c 'import math;print(round(1-math.exp(-2000*1999/2/16**5),3))')"
echo "   un choque forzado (mismo código que ya existe):"; $P -c "set role anon; insert into credenciales (codigo, nombre, receta) values ('$A', 'Choque', '{}')" 2>&1 | grep -o 'ERROR.*' | cut -c1-110

echo "== M8 · borrar una credencial mientras su tablet sigue timbrando"
I=$(nueva Iris); $P -c "set role authenticated; select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false); delete from credenciales where codigo='$I'" >/dev/null
echo "   timbrar después de borrar: $(anon "select public.sellar('$I', 2::smallint, '$TOK2', 'graffiti')") · evento al HUB con ese código: $(anon "insert into eventos (tipo, codigo, datos) values ('timbre', '$I', '{\"sello\":2}') returning tipo")"

echo "== M9 · empezar de cero con actividad en curso"
$P -c "set role authenticated; select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false); select public.empezar_de_cero('BORRAR TODO')" 2>&1 | grep -oE '\{.*|ERROR.*'
J=$(nueva Juan); echo "   después: credencial nueva $J, timbre 1: $($P -c "select count(*) from sellos s join credenciales c on c.id=s.credencial_id where c.codigo='$J'") · premio intacto: $($P -c 'select stock from premio') · PIN intacto: $($P -c "select count(*) from config where clave='pin_staff_sha256'")"
rm -f /tmp/$DB-m*.txt
