# Credencial · Somos Diseño (en el celular)

Cada persona arma su personaje Pixel en su propio celular, lo pone dentro de uno de los **marcos** del sistema (los mismos del Fotomatón, `shared/marcos.ts`) y recibe una credencial con **4 sellos**. Los sellos se ganan escaneando los QR impresos repartidos por la sede.

## Pantallas (rutas con `#`, funcionan en cualquier carpeta)
- `#/crear` — arma el personaje (cabeza, ojos, boca, mejillas, pelo, ropa, accesorio; máximo 4 colores contando el Negro del contorno) y elige lenguaje y marco.
- `#/c/SD-XXXXX` — la credencial: frente con la forma y los colores del marco, reverso «HELLO my name is» (se gira con un toque). Guardar como PNG.
- `#/sello/1..4?t=TOKEN` — lo abre el QR impreso de cada sello y timbra la credencial guardada en ese celular.
- `#/escanear` — lector de QR con la cámara (`BarcodeDetector`). Si el navegador no lo soporta (iPhone), se usa la cámara del teléfono: el QR es un enlace que abre la app.

Todo cabe en la pantalla del teléfono, sin scroll (probado en 390 × 844, 412 × 915 y 360 × 740).

## Datos
- **Modo demo** (sin variables): todo queda en el celular (`localStorage`) y aparece «Simular» para probar los sellos; cualquier QR de sello timbra.
- **Supabase**: corre `supabase/schema.sql` en el mismo proyecto del Fotomatón y define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Los sellos se validan con `sellar()` y los tokens de `sellos_def`.
- Para dar nombre o regla a los sellos, edita las filas de `sellos_def` (el código no cambia).

## QR de los sellos
```bash
SITIO_URL=https://tu-sitio.vercel.app SELLO_TOKENS=t1,t2,t3,t4 npm --prefix credencial run qr:sellos
```
Deja `credencial/qr/sello-1.svg` … `sello-4.svg`. Si un token se filtra, cámbialo en `sellos_def` y vuelve a generar ese QR.

## Código
- `src/pixel/`: generador de personajes 24 × 24 (`parts.ts`, `generator.ts`), paleta Línea azul, alfabeto pixel 5 × 7 y el render de la credencial (`render.ts`).
- `src/lib/store.ts`: Supabase o modo demo.
- `src/pages/`: Crear, Credencial, Sello, Escanear.

```bash
npm --prefix credencial install
npm --prefix credencial run dev
npm --prefix credencial run dev:movil   # ábrela desde el celular en la misma red
npm --prefix credencial run build   # → credencial/dist (lo enlaza el hub)
```
