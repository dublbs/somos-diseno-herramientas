# Herramientas Somos Diseño

Herramientas del equipo de Somos Diseño (INACAP Sede Santiago Centro) para producir piezas con los lenguajes Pixel y Geométrica, siempre con la paleta Línea azul.

| Carpeta | Herramienta | Qué hace |
| --- | --- | --- |
| [`taller-de-pixeles/`](taller-de-pixeles/) | Taller de Píxeles | Convierte una foto en un boceto de módulo Pixel (24 × 24, Línea azul, máximo 4 colores, contorno exterior) o en pixel art libre de 32 × 32 y 64 × 64. Exporta SVG con grupos Fondo y Figura, y PNG. |
| [`credencial/`](credencial/) | Credencial Somos Diseño | Generador de personajes Pixel y credencial de dos caras con sellos por mesa. React + Supabase, lista para Vercel. |
| [`taller-mosaicos/`](taller-mosaicos/) | Taller de mosaicos | Crea mosaicos desde cero con las formas base de Geométrica sobre la celda y las operaciones del sistema (repetir, reflejar, escalonar, girar). Exporta PNG y SVG. |

## Ver en línea

La carpeta `docs/` es el sitio: una portada que lleva a las tres herramientas, agrupadas en **Taller** (para quienes diseñan) y **Patio** (para quienes visitan), más cada herramienta compilada en un solo archivo HTML.

- **GitHub Pages:** Settings → Pages → Deploy from a branch → `main` / `/docs`.
- **Vercel o Netlify:** sin comando de build y con `docs` como carpeta de salida.

Si se despliega desde la raíz, `index.html` redirige a `docs/`.

La credencial que queda en Pages corre en modo demo (todo se guarda en el dispositivo). La versión del evento, con sellos reales por QR, se publica aparte con Supabase y Vercel: ver [`credencial/README.md`](credencial/README.md).

## Desarrollo

Cada proyecto se instala y corre por separado:

```bash
cd credencial        # o taller-mosaicos
npm install
npm run dev
```

El Taller de Píxeles es un único archivo HTML sin dependencias: se abre directo en el navegador.

## Actualizar `docs/`

```bash
cd credencial && npm run build:demo && cp demo/index.html ../docs/credencial/index.html
cd ../taller-mosaicos && npm run build && cp dist/index.html ../docs/taller-mosaicos/index.html
cp ../taller-de-pixeles/index.html ../docs/taller-de-pixeles/index.html
```
