# Fotomatón CMYK · Somos Diseño 2026

Vite + React + TypeScript. El prototipo de referencia sigue en `prototipo/fotomaton-cmyk.html`.

## Correr

```bash
npm install
npm run dev          # http://localhost:5173 (la cámara funciona en localhost)
npm run dev:tablet   # HTTPS con certificado local (vite-plugin-mkcert) para probar en la tablet por la red
```

## Supabase (para «Llévatela» y `/f/:id`)

1. Crear el proyecto y correr `supabase/migrations/0001_fotomaton.sql` (tabla, RLS, bucket privado).
2. Desplegar las funciones: `supabase functions deploy tarjeta` y `supabase functions deploy limpiar`.
3. Programar el borrado a las 24 h: descomentar el bloque `cron.schedule` al final de la migración
   (necesita `pg_cron` y `pg_net`) con la URL del proyecto.
4. Copiar `.env.example` a `.env.local` y llenar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

La tablet (anon) solo puede insertar. La lectura de `/f/:id` pasa por la función `tarjeta`, que valida el
uuid y la expiración y devuelve una URL firmada de 60 s; el bucket no se puede listar.

Sin las variables, «Llévatela» funciona en **modo de prueba**: la tarjeta queda en IndexedDB del navegador
(24 h) y el QR abre `/f/:id` solo en ese mismo dispositivo (`src/lib/almacenLocal.ts`).

Con el CLI (proyecto `wdrjtjokbqketcxkhaxo`): `npx supabase login`, `npx supabase link --project-ref wdrjtjokbqketcxkhaxo`,
`npx supabase db push` y `npx supabase functions deploy tarjeta limpiar`. El MCP de `.mcp.json` apunta al stack local
(`supabase start`, requiere Docker).

## Plan gratis de Supabase

Alcanza para el evento: 1 GB de storage, 5 GB de egress al mes, 50 MB por archivo, 2 proyectos activos.
Una tarjeta pesa ~0,6–0,8 MB, y como se borra a las 24 h caben ~1.300 vivas a la vez. Con ~1,5 MB de egress por
persona (ver + compartir) salen ~3.000 descargas al mes. Ojo: el proyecto se **pausa tras 1 semana sin actividad**;
entrar al panel o usarlo el día antes del evento lo despierta.

## Deploy

Vercel con las mismas dos variables de entorno. `vercel.json` ya reescribe `/f/:id` hacia `index.html`.

## Pendiente

- Exportar los 15 marcos desde Figma (hoy son los 12 del prototipo) y reemplazar `src/data/marcos.ts`.
- Envío en tiempo real a la Pantalla Flip (la tabla `fotomaton` ya sirve de base para un canal realtime).
