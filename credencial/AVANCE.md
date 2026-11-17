# Avance A7 · timbre 4 «Tu flyer» (borrar al terminar)
- [x] `shared/supabase/migraciones/006-timbre-flyer.sql`: probada en Postgres 16 local (12 casos, corre 2 veces).
- [x] `shared/juego.ts`: estación 4 «Flyer» / «Arma tu flyer»; textos «Secreto» y «Portales» en credencial/admin.
- [x] `credencial/src/lib/store.ts`: `sellarFlyer()` (RPC o demo) y `faltaFlyer()`.
- [x] `credencial/src/flyer/componer.ts`: composición 1080×1350 por lenguaje con semilla (Mezclar).
- [x] `credencial/src/pages/Flyer.tsx` (#/flyer, 3 pasos) + tarjeta «Tu flyer» y línea de lo que falta en Juego.
- [x] Bienvenida «Tu recorrido» (3 tarjetas, una vez por credencial, «¿Cómo se juega?» en Juego).
- [ ] `docs/staff/guion-del-recorrido.md` y H1 en `docs/tasks/009-pendientes.md`.
- [ ] Playwright en 390×844, 412×915, 360×740; PNG por lenguaje; `dist/` de producción.
- Siguiente: probar con Playwright (puerto 4207, modo demo) y afinar la composición mirando los PNG.
