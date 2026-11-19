# 016 · Correcciones del QA del PC madre (19 nov)

Bitácora: [`docs/qa/qa-pc-madre.md`](../qa/qa-pc-madre.md).

## T-01 · Activar los avisos push (Q1)
- Requiere una persona: generar las claves con `npx web-push generate-vapid-keys`; cargar `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` como secretos de la función `notificar` en Supabase; agregar `VITE_VAPID_PUBLIC_KEY` a `credencial/.env.local`, recompilar la credencial y publicar.
- Hecho mientras tanto: con 0 suscritos, la vista Avisos advierte que el aviso no llegaría a nadie.
- [ ] Pendiente: activar las claves (decisión del equipo)

## T-02 · Personas sin el tope de 300 (Q2)
- Archivos: `admin/src/lib/api.ts` (`personas`), `admin/src/App.tsx` (cabecera de Personas).
- Cambio: el total de la cabecera sale de `resumen_evento()` (o de un `count`), y la tabla avisa «mostrando las 300 más recientes: usa la búsqueda».
- [x] Hecha (rama `claude/cierre`)

## T-03 · Mensaje claro si falla un aviso (Q3)
- Archivo: `admin/src/lib/api.ts` (`enviarAviso`).
- Cambio: traducir el error de la función a «No se pudo enviar el aviso. Revisa que la función notificar y sus claves estén configuradas».
- [x] Hecha (rama `claude/cierre`)

## T-04 · Personas en 1024 px (Q4)
- Archivo: `admin/src/styles.css`.
- Cambio: envolver la tabla en un contenedor con `overflow-x: auto` para que el scroll quede en la tabla y no en la página.
- [x] Hecha (rama `claude/cierre`)

## T-05 · Botón QR de las tablets a 48 px
- Archivo: `shared/ui/QrEncargado.tsx`. Lo señalaron los subagentes de Grabado, Graffiti, Audioreactiva, Teatro y Hora punta.
- [x] Hecha (rama `claude/cierre`)
