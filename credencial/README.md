# Credencial Somos Diseño

Generador de personajes Pixel y credencial coleccionable con sellos para el patio de Somos Diseño (INACAP Sede Santiago Centro).

En la mesa 3, cada persona arma un personaje con partes de los tres lenguajes, recibe una credencial con su retrato animado y junta sellos recorriendo las 5 mesas. La misma receta del personaje sirve para la galería de la Pantalla Flip, el quilt del Oculus, stickers impresos y piezas de campaña.

## Qué incluye

- **Generador** (`src/pixel/`): partes en grilla de 24 × 24, combinación con las reglas del sistema Pixel (Línea azul, máximo 4 colores, contorno solo por fuera) y animación cuadro a cuadro a 12 fps (base, parpadeo, habla).
- **Credencial de dos caras** que se gira con un toque (cuadro a cuadro, en 7 pasos): por delante el documento con 5 casillas de sello; por detrás el sticker «HELLO my name is» de la propuesta Lo urbano, con las 5 mesas como estaciones de una ruta. Ambas usan el alfabeto pixel 5 × 7. Para sumar otro diseño, agrégalo a `DISENOS` en `src/pixel/render.js`.
- **Rutas**
  - `/` arma tu personaje y emite la credencial.
  - `/c/SD-XXXXX` la credencial, con QR para llevársela al celular y descargas (credencial PNG, módulo 240 px, hoja de sprites, receta JSON).
  - `/sello/1..5?t=TOKEN` la página que abre el QR impreso de cada mesa; timbra la credencial guardada en ese celular.
- **Supabase** (`supabase/schema.sql`): tablas, permisos y la función `sellar()` que valida el token de cada mesa.
- **Modo demo**: sin variables de Supabase todo se guarda en el dispositivo y los sellos se simulan con un botón. Sirve también como plan B sin wifi.

## Correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:5173. Sin `.env.local` arranca en modo demo.

## Conectar Supabase

1. Crea un proyecto en Supabase.
2. En SQL Editor, pega y ejecuta `supabase/schema.sql`.
3. Copia los tokens de las mesas: `select id, nombre, token from public.mesas order by id;`
4. Copia `.env.example` como `.env.local` y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Settings → API).

## Publicar en Vercel

1. Sube la carpeta a un repositorio de GitHub e impórtalo en Vercel (framework: Vite).
2. Agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Environment Variables.
3. `vercel.json` ya redirige todas las rutas a la app.

## QR de las mesas

```bash
SITIO_URL=https://tu-sitio.vercel.app MESA_TOKENS=t1,t2,t3,t4,t5 npm run qr:mesas
```

Deja `qr/mesa-1.svg` … `qr/mesa-5.svg`, listos para la señalética. Si un token se filtra, cámbialo en la tabla `mesas` y vuelve a generar ese QR.

## Flujo del día

1. Mesa 3: la persona arma su personaje en la tablet y emite la credencial.
2. Escanea el QR de su credencial con el celular: queda guardada como "su" credencial.
3. En cada mesa escanea el QR impreso y recibe el sello.
4. Con 5 de 5 retira su sticker. La vista `galeria` de Supabase alimenta la Pantalla Flip y las métricas.

## Personalización

Siete características, cada una con su forma y su color: cabeza (piel), ojos, boca, mejillas, pelo o gorro, ropa y accesorio. Pelo y ropa tienen además un color de detalle (pompón, rayas, corbata, cordones). El selector impide pasar de 4 colores por personaje contando el Negro del contorno, que es la regla del sistema Pixel: los colores que ya no caben aparecen con borde punteado y, si se tocan, explican por qué.

## Reemplazar las partes por las de Figma

Las partes de `src/pixel/parts.js` son provisionales. Cada parte es una lista de tramos `[fila, xDesde, xHasta, zona]` en la grilla de 24 × 24. La zona dice con qué color se pinta:

| Zona | Color |
| --- | --- |
| `s` | piel (color de la cabeza) |
| `p` | color propio de la característica |
| `d` | color de detalle de la característica (pelo y ropa) |
| `h` | color del pelo (por ejemplo, un bigote) |
| `k` | Negro |

El contorno exterior lo agrega el generador, así que las partes no lo dibujan. Para sumar una parte basta con agregarla a su lista con un `id` nuevo; si es un accesorio, indica su `lenguaje` (Geométrica, Orgánica o Pixel). Las recetas guardadas con la versión anterior se convierten solas al formato nuevo.

## Pendiente

- Dibujar en Figma la biblioteca definitiva de partes y exportarla a este formato (es la función que tendría el plugin).
- Vista de galería para la Pantalla Flip leyendo `galeria`.
- Hojas de sprites de cuerpo entero (caminar, saludar) para los demás juegos.
