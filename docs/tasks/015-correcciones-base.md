# 015 · Correcciones del QA de la base (19 nov)

Bitácora: [`docs/qa/qa-base-de-datos.md`](../qa/qa-base-de-datos.md). Volver a probar: `scripts/qa-base/correr.sh`.

## T-01 · Códigos con 0 y 1 en las tablets (B1)
- Archivo: `shared/juego.ts` (`CODIGO`).
- Cambio: `/^SD-[A-Z0-9]{5}$/`, igual que el check de la base. Es el mismo cambio que #49.
- Aceptación: `SD-10A0F` entra en Graffiti.
- [x] Hecha

## T-02 · Códigos sin choques y fáciles de escribir (B2)
- Archivos: `shared/supabase/migraciones/011-qa-base.sql` (`codigo_credencial()` como default), `credencial/src/lib/store.ts` (`crear` reintenta con 23505).
- Cambio: 5 de `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (32⁵ ≈ 33 M) y se busca uno libre.
- Aceptación: 1000 credenciales seguidas sin error; ninguna con 0, O, 1 ni I.
- [x] Hecha

## T-03 · Timbrados simultáneos (B3)
- Archivo: `011-qa-base.sql` (`sellar()` con `for update` sobre la credencial) + reparación única de quien ya tiene la meta sin timbre.
- Aceptación: M1 y M1b 10 de 10.
- [x] Hecha

## T-04 · La tablet revisa que el código exista (B4)
- Archivos: `shared/juego.ts` (`existeCredencial`), `shared/ui/Juego.tsx` (`Desbloqueo`: «Revisando…» y «No encontramos la credencial…»). Sin red, deja pasar.
- [x] Hecha

## T-05 · Mismo QR de mesa escaneado a la vez (B5)
- Archivo: `011-qa-base.sql` (`emparejar_mesa()` comprueba quién quedó después de insertar).
- Aceptación: M5 10 de 10.
- [x] Hecha

## T-06 · Timbre que falla no queda como ganado (B6)
- Archivo: `shared/juego.ts` (`otorgarCreacion`, `marcarGanado`).
- Cambio: con Supabase, el evento «timbre» va al HUB solo si `sellar()` respondió; si no, la experiencia se puede volver a intentar.
- [x] Hecha

## T-07 · Errores claros (B7, B8, B9, B10)
- Archivo: `011-qa-base.sql`: `canjear()` (trim y `ya_canjeado` en carrera), `suscribir_push()` (`credencial_no_existe`), política «publicar eventos» (solo códigos que existen).
- Archivo: `credencial/src/lib/store.ts` (`suscribirPush` traduce el error).
- [x] Hecha

## T-08 · Correr la 011 en `somos-diseno` (personas)
- Después de la 008, la 009 y la 010. Anotarla en `shared/supabase/migraciones/README.md`.
- El PC madre (Resumen → Estado de la base) avisa si falta.
- [ ] Pendiente

## Sin comprobar
- Contra el Supabase real (sin acceso). Storage, funciones Edge y Realtime.
- El reintento de `crear` con 23505 (no se pudo forzar el choque simultáneo desde el celular).
