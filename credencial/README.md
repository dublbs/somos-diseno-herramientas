# Credencial · Somos Diseño (en el celular)

Cada persona arma su credencial en su propio celular: elige uno de los **6 marcos del MVP** (M02 y M05 de cada lenguaje), pone adentro **su foto o un personaje**, y consigue **4 timbres** escaneando los QR repartidos por la sede.

**La interfaz completa toma el tema del marco elegido.** Usa el `data-visual` del lenguaje (forma, tipografía y sombras) y, del marco, el color de la banda, un patrón de Figma de fondo y el acento. Los temas están en `src/temas.ts`:

| Marco | Banda | Patrón | Personaje del lenguaje | Timbres |
|---|---|---|---|---|
| Pixel M02 Vinilo / M05 Metro | Morado / Negro | Surcos de vinilo / Lateral Línea 1 | Invasor (FA10) | Metro, Vinilo, Spray, Ecualizador |
| Geométrica M02 Estallido / M05 Túnel | Morado / Negro | Allqa / Damero | Glifo (FA10, provisorio) | Polar, Túnel, Damero, Cruz escalonada |
| Orgánica M02 Estallido / M05 Túnel | Azul / Rosa | Medio sol / Anillos | Pingüino (FA01) | Sol, Pudú, Paloma, Helecho |

Los assets vienen de Figma: ver [`docs/plans/003-credencial/assets.manifest.md`](../docs/plans/003-credencial/assets.manifest.md).

## Pantallas (rutas con `#`, funcionan en cualquier carpeta)
- `#/crear` — 1 · Marco (6, en filas por lenguaje) · 2 · Foto o personaje (3 predeterminados, uno por lenguaje; la foto es el Fotomatón sin efectos con la cámara nativa) · nombre.
- `#/c/SD-XXXXX` — la credencial: frente con el marco y los 4 timbres; con un toque se gira al **álbum de timbres** (conseguidos a color, los que faltan como silueta). Guardar como PNG.
- `#/sello/1..4?t=CODIGO` — lo abre el QR impreso de cada estación y timbra la credencial de ese celular.
- `#/escanear` — «Timbrar»: lector de QR con la cámara (`BarcodeDetector`) o la estación + el **código de 4 caracteres** impreso bajo el QR (iPhone, claude.ai).
- `#/foto` — cambiar la foto (si la credencial usa foto). La foto queda solo en el celular.

Al conseguir un timbre aparece **el momento del timbre**: el sticker cae y se timbra sobre el patrón del tema (en Pixel, cuadro a cuadro), con vibración si el teléfono la tiene. Con los 4, llueven los timbres. Respeta «reducir movimiento».

Todo cabe en la pantalla del teléfono, sin scroll (probado en 360 × 740, 390 × 844 y 412 × 915, en los 6 temas).

## Datos
- **Modo demo** (sin variables): todo queda en el celular (`localStorage`) y aparece «Simular» para probar los sellos; cualquier QR de sello timbra.
- **Supabase**: corre `supabase/schema.sql` en el mismo proyecto del Fotomatón y define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Los sellos se validan con `sellar()` y los tokens de `sellos_def`.
- Para dar nombre o regla a los sellos, edita las filas de `sellos_def` (el código no cambia).

## QR de los sellos
```bash
SITIO_URL=https://tu-sitio.vercel.app SELLO_TOKENS=K7QF,M2XA,P9RT,Z4HB npm --prefix credencial run qr:sellos
```
Los códigos son los `token` de `sellos_def` (4 caracteres). Deja `credencial/qr/sello-1.svg` … `sello-4.svg`, con «SELLO N · CÓDIGO» bajo cada QR. Si un token se filtra, cámbialo en `sellos_def` y vuelve a generar ese QR.

## Verla en el celular
- **Vercel** (sitio real): importa `dublbs/somos-diseno-herramientas` en Vercel. `vercel.json` en la raíz ya evita el build (los `dist/` están versionados). Elige como rama de producción `claude/ecstatic-lovelace-xjgq6d` (o haz merge a `main`). La credencial queda en `https://<proyecto>.vercel.app/credencial/dist/`.
- **Vista previa en claude.ai** (sin hosting): `npm run build && npm run artifact` arma `artifact/index.html`, una sola página con todo adentro, para publicarla como Artifact. Ahí las rutas viven en la app (el visor no acepta `#/rutas`), los sellos se ponen con el código o «Simular» y las imágenes se guardan con el permiso de descargas de claude.ai.

## Código
- `src/temas.ts`: los 6 temas, los 3 personajes y los timbres de cada lenguaje.
- `src/pixel/`: paleta Línea azul, alfabeto pixel 5 × 7 y el render de la credencial (`render.ts`: marco con retrato, timbres, álbum y la silueta de la tarjeta según el lenguaje).
- `src/lib/imagenes.ts`: carga y rasteriza una vez los SVG de Figma.
- `src/components/Timbrado.tsx`: el momento del timbre.
- `src/lib/store.ts`: Supabase o modo demo; la foto en `localStorage`.
- `src/lib/foto.ts` (selfie a 720 px) y `src/lib/descargar.ts` (claude.ai → compartir → enlace).
- `src/pages/`: Crear, Credencial, Sello, Escanear, Foto.
- `scripts/`: `qr-sellos.mjs` (QR imprimibles), `artifact.mjs` (vista previa en claude.ai), `limpiar-figma.mjs` (quita el fondo de las exportaciones de Figma).

```bash
npm --prefix credencial install
npm --prefix credencial run dev
npm --prefix credencial run dev:movil   # ábrela desde el celular en la misma red
npm --prefix credencial run build   # → credencial/dist (lo enlaza el hub)
```
