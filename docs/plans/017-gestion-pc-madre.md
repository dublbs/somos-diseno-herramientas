# 017 · Gestión desde el PC madre

Pedido del 18 nov: «en el PC madre necesito muchas funciones de gestión todavía» (y «hazlo tú»). Este plan elige las que
hacen falta para el día del evento, a partir de lo que pasó en la prueba general:

- Se borraron todas las personas en el PC madre y **en el HUB seguían apareciendo**: el HUB lee la tabla `eventos`
  (credenciales, timbres, dibujos), y borrar una credencial no tocaba `eventos`.
- Al escanear el QR de una tablet salió «La base todavía no tiene esta función»: faltaba correr la migración 009. Nadie
  tenía cómo ver desde el PC madre qué migraciones faltan.
- No había forma de quitar del HUB algo inapropiado (un graffiti, una foto, un nombre) sin entrar a Supabase.

## Qué se agrega
| Vista | Qué hace | Quién |
|---|---|---|
| **Resumen** (nueva, la primera) | Números del evento en vivo: credenciales, timbres por estación, completas, premios entregados y stock, tablets activas (últimos 15 min) y actividad de la última hora. **Estado de la base**: qué migraciones faltan (006–010), con el archivo a correr. | staff |
| **Personas** | Borrar una credencial también la saca del HUB. **Ficha** de cada persona: experiencias hechas, afiches encontrados y lo que publicó en el HUB. **Exportar CSV**. | staff (borrar: admin) |
| **Pantalla HUB** (nueva) | Lo último que llegó al HUB (credenciales, dibujos, fotos), con **Quitar del HUB**. Botón **Recargar el HUB**. | staff |
| **Configuración** | **Empezar de cero**: borra credenciales, timbres, canjes, eventos del HUB, sesiones de mesa y avisos (después de la prueba general). Pide escribir `BORRAR TODO`. | admin |

## Base de datos: `migraciones/010-gestion-pc-madre.sql`
- Trigger `credencial_sale_del_hub`: al borrar una credencial se borran sus `eventos` y se pide recargar el HUB. Al
  correrla, limpia una vez los eventos de credenciales que ya no existen (lo que quedó de la prueba general).
- `ocultar_evento(id)` (staff), `recargar_hub()` (staff), `resumen_evento()` (staff), `empezar_de_cero(frase)` (admin,
  frase `BORRAR TODO`). Todas `security definer` y comprueban el rol adentro.
- `config_mesas()` suma `hub_reinicio`. El HUB la pregunta cada 30 s y se recarga cuando cambia. Sin la migración, el HUB
  sigue igual (sin recarga remota).

## No entra (a propósito)
- Editar o borrar fotos del bucket `fotomaton` («Llévatela»): ya se borran solas a las 24 h.
- Cambiar los tokens de los sellos o los secretos de los afiches desde el PC madre: siguen en el SQL Editor (regla 7).

## Pasos para el equipo
1. Correr `008-config-mesas.sql`, `009-jugar-con-qr.sql` y `010-gestion-pc-madre.sql` en el SQL Editor y anotarlas en
   `shared/supabase/migraciones/README.md`. El Resumen del PC madre muestra cuáles faltan.
2. Antes de abrir el 19: Configuración → **Empezar de cero** (borra lo de la prueba general).
