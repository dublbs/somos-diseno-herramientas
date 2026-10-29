# Fotomatón CMYK · Somos Diseño 2026

Experiencia oficial de la Mesa 3 (Imagen e identidad) en la Semana del Diseño 2026, INACAP Sede Santiago Centro.
La persona se saca una foto en una tablet, la foto se vuelve trama CMYK, la enmarca con uno de los marcos de los tres
lenguajes de la campaña (Geométrica, Orgánica, Pixel) y se la lleva al celular escaneando un QR.

El prototipo funcional está en `prototipo/fotomaton-cmyk.html` (un solo archivo, React + htm sin build).
Es la referencia de comportamiento y de look: hay que portarlo, no rediseñarlo.

## Stack

- Vite + React + TypeScript (pasar los `html\`` de htm a JSX casi 1:1)
- Supabase: Storage para la imagen final + tabla para el registro y el QR
- Vercel para el deploy (HTTPS, necesario para la cámara en la tablet)
- `@vladmandic/face-api` (TinyFaceDetector) para detectar la cara, corriendo en el dispositivo
- `qrcode` para generar el QR en la tablet

## Estructura sugerida

```
src/
  data/marcos.ts        ← MARCOS del prototipo (luego, SVG exportados de Figma)
  data/tintas.ts        ← TINTAS del prototipo
  lib/trama.ts          ← trama(), celdaRelativa(), componer(), dibujarEncuadre()
  lib/cara.ts           ← cargarCara(), detectarCara(), suavizar()
  lib/tarjeta.ts        ← exportarTarjeta() 1080×1350
  lib/publicar.ts       ← subida a Supabase + URL para el QR
  hooks/useCamara.ts    ← getUserMedia, loop de vista previa, detección cada ~220 ms
  hooks/useRetardo.ts
  components/           ← Portada, Camara, Editor, Selector, Ajustes, Carga, PasoQR
  pages/f/[id]          ← página de descarga que abre el celular
```

## Flujo

1. Portada → Abrir la cámara / Subir una foto
2. Cámara en vivo con la trama y el marco ya aplicados, cuenta 3-2-1, flash
3. «Revelando tu trama…» (mínimo 1,8 s, mientras se afina la detección de cara)
4. Editor: lenguaje, marco, trama, tinta
5. **Nuevo — Llévatela:** se genera la tarjeta, se sube y aparece un QR grande. El celular abre `/f/:id`,
   ve la imagen y la descarga o comparte. Botón «Terminar» vuelve a la portada y limpia todo.

## Reglas que ya están decididas (no cambiar sin preguntar)

- La trama se mide contra la cara: `celdaRelativa()` usa Panel escalonado (cara ≈ 100 u) como referencia,
  así todos los marcos llevan la misma cantidad de trama. Slider de 1 a 4, punto medio y default 2,5.
  En pantalla, la celda nunca baja de 3 px de dispositivo (rendimiento en tablet).
- Ángulos de trama: Y 0°, C 15°, K 45°, M 75°. Duotonos: tinta A = sombras, tinta B = medios.
- Orden de capas por marco: fondo → figura → foto en trama recortada a su zona.
- La UI cambia según el lenguaje (atributo `data-visual` en `<html>`): Geométrica esquinas rectas + azul,
  Orgánica redondeada + verde, Pixel esquinas rectas + sombra dura + Silkscreen + morado.
- Sin etiquetas encima de la foto. El estado de la cara va en texto bajo la foto.
- Cambiar de marco o lenguaje tiene una transición de 1,5 s; el disparador y guardar se bloquean mientras dura.
- Paleta oficial: Línea azul. El rojo INACAP (#E2001A) solo para el logo; el logo siempre va en rojo.
- Los textos deben sonar escritos por una persona, en español de Chile, sin tono de IA.

## Privacidad (importante, es un evento público)

- La foto original nunca sale del dispositivo. Solo se sube la tarjeta final, y solo cuando la persona toca «Llévatela».
- Las tarjetas se borran solas a las 24 h (cron de Supabase o Edge Function programada).
- El enlace del QR usa un id aleatorio no adivinable (uuid), sin listado público del bucket.
- Antes de subir, una línea clara: «Tu foto queda disponible 24 horas para descargarla y después se borra».

## Supabase

```sql
create table fotomaton (
  id uuid primary key default gen_random_uuid(),
  ruta text not null,            -- ruta en el bucket
  marco text not null,           -- ej. PM05
  tinta text not null,
  creado timestamptz default now(),
  expira timestamptz default now() + interval '24 hours'
);
```
Bucket `fotomaton` privado. La página `/f/:id` pide una URL firmada corta. Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
Dejar preparado (sin hacer todavía) el envío en tiempo real a la Pantalla Flip.

## Cámara

- `getUserMedia` solo funciona en HTTPS o `localhost`. Para probar en la tablet en la red local: `vite --host` con
  certificado (`vite-plugin-mkcert`) o un preview de Vercel.
- Selfie espejada; botón para cambiar a la cámara trasera.
- Si no hay permiso, ofrecer «Subir una foto» (en el celular abre la cámara con `capture="user"`).

## Marcos (Figma «Figraphic», fileKey `Yo9o3ZG2lyaEGcyxoxs89R`)

En el prototipo hay 12 de 15 como paths. Para la versión oficial, exportar los 15 como SVG desde los componentes
(capas `Fondo`, `Figura` y la zona de foto `Foto · fondo` / `Foto`; ocultar la silueta de muestra y los efectos):

- Geométrica: M01 `647:113589`, M02 `647:113590`, M04 `647:113591`, M05 `647:113592`, M06 `647:113593`
- Orgánica: M01 `647:1379`, M02 `647:1380`, M04 `647:1381`, M05 `647:1382`, M06 `647:1383`
- Pixel: M01 `510:1121`, M02 `510:1129`, M04 `510:1137`, M05 `510:1146`, M06 `510:1154`

Los 15 están importados (2026-10-29): `python3 scripts/marcos-desde-figma.py <carpeta con los SVG>` genera
`shared/marcos-figma.ts`. Lo que en Figma va sobre la foto (contornos Pixel, enredaderas, franjas) queda en `encima`.
`shared/marcos.ts` ajusta cada marco a la zona de foto estándar de 150 × 150 al centro (tabla `AJUSTES`).
Ojo: en Orgánica y en Pixel la zona de foto no siempre es una capa propia (casos especiales en el script).
Cuidar las llamadas al MCP de Figma: el plan es de estudiante.

## Primer encargo para Claude Code

1. Crear el proyecto Vite + React + TS y portar el prototipo módulo por módulo, sin cambiar el comportamiento.
2. Verificar cámara y detección de cara en `localhost` y en la tablet por HTTPS.
3. Agregar el paso «Llévatela» con Supabase + QR y la página `/f/:id`.
4. Deploy en Vercel.
