# PC madre · Somos Diseño

Panel del staff para el PC del evento (plan 007). No aparece en el hub: se abre en `<sitio>/admin/dist/`.

- **Personas**: todas las credenciales con sus timbres (se dan o quitan con un toque), portales escaneados, si reciben avisos y el estado del canje. Buscar por código o nombre; cambiar el nombre; borrar (solo admin). Se refresca en vivo (Realtime) y cada 10 s.
- **Canje**: buscar un código y entregar el premio; stock y límite diario (solo admin los cambia).
- **Mesas**: qué credencial entró en modo juego en cada tablet.
- **Avisos**: mandar una notificación a todos los celulares suscritos o a una credencial; historial.
- **Configuración**: PIN del canje (se guarda como hash en `config`) y cómo crear cuentas del staff.

Necesita `admin/.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, y los SQL corridos en orden (`docs/supabase.md`). Sin eso muestra las instrucciones.

```bash
npm --prefix admin install
npm --prefix admin run dev
npm --prefix admin run build   # → admin/dist
```

Roles: `admin` edita todo; `mesa` da timbres, canjea y manda avisos, pero no cambia el premio ni el PIN. Lo decide la base (`shared/supabase/juego.sql`), no la interfaz.
