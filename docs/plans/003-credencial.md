# Plan 003 · Credencial virtual (solo plan, sin implementar)

> Estado: **decisiones tomadas, listo para construir**. Nada de esto está implementado todavía.

## Contexto
La credencial es la pieza que va **en el celular** de cada persona y que une todo el recorrido. Hoy no hay nada para ver en móvil: el hub y las 4 experiencias están pensados para la tablet del stand y **no están publicados en ninguna URL**.

Hay dos fuentes:

1. **Figma, página `Journey` (`761:2022`)**: «Semana Vive Diseño · Credencial virtual», con el *Roadmap del recorrido* (`766:2108`) y el *Roadmap + Journey* (`767:2148`). Son 8 hitos:
   1. **Llegada** (Geométrica): la acreditación abre la credencial en el celular. Desbloquea la *credencial vacía con 4 espacios*.
   2. **Activar credencial** (Pixel): el celular se vuelve un «teléfono aparte». La credencial tiene dos diseños, documento ↔ sticker «HELLO my name is». Desbloquea la *home con las apps* (Escáner, Fotomatón, Skin, Credencial, Hub).
   3. **Explorar la sede** (Pixel): escáner propio de figuras pixel (no QR tradicional). Desbloquea *fragmentos*: común +1, rara +3, cada figura cuenta una vez.
   4. **Stands** (Geométrica): tareas por partes (llegada, tarea validada por staff, foto). Desbloquea el *badge del stand*.
   5. **Fotomatón** (Orgánica): selfie con marco. Desbloquea la *foto con marco + parte final del badge*.
   6. **Skin** (Pixel): accesorios y diseños desbloqueables; paquetes al llegar a metas. Desbloquea el *personaje propio*.
   7. **Hub · cambio de capítulo** (Orgánica): pantalla que cambia con el tiempo (Boceto → Prototipo → Lanzamiento), momento en vivo tipo Kahoot. Desbloquea *figuras raras + meta colectiva*.
   8. **Cierre** (Geométrica): credencial completa con 4 sellos (propuesta: Explorador, Creador, Conector, Testigo del tiempo). Premio físico por definir.

   Dudas abiertas en Figma: tamaño mínimo de impresión de las figuras y luz de la sede, quién atiende los stands y valida la tarea, Hub 1 y Hub 2, cuáles son los 4 sellos, qué se recibe en físico, y vincular la credencial al correo o QR de inscripción.

2. **El código anterior de la credencial**: estuvo en `credencial/` (commit `18512f4`, borrado en `78039b1`; se recupera con `git checkout 78039b1^ -- credencial`). Era React (JS) + Vite 5 + Supabase y ya resolvía buena parte de los hitos 2 y 6:
   - Generador de personajes Pixel en grilla de 24 × 24: 7 características con forma y color, regla de máximo 4 colores, contorno por fuera y animación a 12 fps (`src/pixel/`).
   - Credencial de dos caras que se gira con un toque: documento ↔ «HELLO my name is».
   - Rutas `/` (crear), `/c/SD-XXXXX` (credencial con QR y descargas) y `/sello/1..5?t=TOKEN` (sello de mesa).
   - Supabase: tablas `credenciales`, `mesas`, `sellos` y la función `sellar()`, que valida el token de cada mesa. Además, la vista `galeria` para la Pantalla Flip.
   - Modo demo sin servidor (localStorage), útil también como plan B sin wifi.

## Diferencias entre el código anterior y el Journey

| Journey (Figma) | Código anterior | Qué hacer |
|---|---|---|
| 4 espacios / 4 sellos temáticos | 5 sellos, uno por mesa | Rehacer el modelo: 4 sellos con criterios (ver decisiones) |
| Escáner de figuras pixel propio | QR impreso por mesa | MVP con QR firmado; escáner de figuras como fase 2 |
| Fragmentos (común/rara), packs, skins | Partes fijas del personaje | Fase 2: inventario de desbloqueos sobre la misma receta |
| Badge del stand por partes | — | Fase 2 |
| Foto del Fotomatón en la credencial | — | Fase 1: botón «Llevar a mi credencial» en el QR del Fotomatón |
| Home con apps en el celular | — | Fase 1: home mínima (Credencial · Escáner · Fotomatón · Hub) |
| Firebase (idea del equipo) | Supabase | **Supabase**: el Fotomatón ya lo usa; una sola base y un solo panel |

## Propuesta

### Fase 0 · Poder verlo en el celular (requisito para todo lo demás)
- Publicar el repo como sitio estático. Recomendado: **Vercel**, un solo proyecto en la raíz. El hub ya funciona servido como estático (`dist/` versionado) y el QR del Fotomatón ya usa `HashRouter`. La alternativa sin costo es GitHub Pages desde la rama `main` en la raíz.
- Resultado: una URL que abre el hub en tablet y la credencial en el celular.

### Fase 1 · MVP de la credencial (recuperar y portar)
1. Recuperar `credencial/` desde `78039b1^` y portarla al stack actual:
   - React 18 + **TypeScript 7** + Vite 8;
   - `HashRouter` (`#/c/:codigo`, `#/sello/:id`), igual que el Fotomatón;
   - fuentes e íconos de `shared/`.
2. **Layout móvil propio**: la credencial ocupa la pantalla del teléfono en vertical y se gira con un toque, sin scroll. El sistema de tablet de `shared/somos-ui.css` solo se usa en la pantalla «Crear» cuando se arma en la tablet.
3. **Hitos 1 y 2**:
   - Crear el personaje con el generador existente.
   - Emitir la credencial con **4 espacios vacíos**.
   - Pasarla al celular con un QR, y ofrecer «Agregar a pantalla de inicio» (PWA mínima con `manifest` e ícono).
4. **Home móvil**: Credencial · Sellos · Escanear · Hub. Escanear abre la cámara y lee QR con `BarcodeDetector`, y cae a un lector JS liviano si el navegador no lo soporta.
5. **Sellos**: 4 sellos que se ganan escaneando QR firmados. Se reusa `sellar()`, con la tabla `mesas` reemplazada por `sellos_def`.
6. **Integración con las experiencias**: la tarjeta exportada de Fotomatón, Mosaicos, Teatro y Graffiti muestra un QR «Suma a tu credencial» que otorga el sello *Creador*. En el caso del Fotomatón, además deja la foto en la credencial.
7. Hub: activar la tarjeta «Credencial» y sumar una galería para la Pantalla Flip, que lee la vista `galeria`.

### Fase 2 · Lo lúdico (si hay tiempo)
- **Escáner de figuras pixel**: cada figura impresa es un sprite de 8 × 8 con un borde fijo que lo hace legible como código («el sprite mismo es el código»). Se reconoce con cámara y canvas, sin librerías.
  - Riesgo: luz de la sede y tamaño mínimo de impresión.
  - Hay que probarlo impreso antes de comprometerlo.
- Fragmentos (común +1, rara +3), packs al llegar a metas, skins y accesorios que se suman a la receta del personaje.
- Badge de stand por partes (llegada, tarea validada por staff, foto).
- Hub por capítulos y momento en vivo.

### Fuera de alcance por ahora
Vincular con el correo de inscripción, premio físico, Hub 1 y Hub 2.

## Decisiones tomadas (2026-10-28)
1. **Sellos**: por ahora son 4 sellos genéricos (Sello 1 a Sello 4), sin nombre ni regla temática. Los criterios (Explorador, Creador, etc.) se definen después y solo cambian los datos, no el código.
2. **Escáner**: QR firmado en el MVP; las figuras pixel quedan para la fase 2 (no se decidió lo contrario).
3. **Publicación**: **Vercel**, un solo proyecto en la raíz del repo.
4. **Base de datos**: **Supabase**, el mismo proyecto del Fotomatón (Firebase descartado).
5. **El personaje se crea en el celular** de cada persona. Por eso toda la credencial (crear, ver y sellar) es mobile-first, y la tablet no participa en la creación.

### Ajustes al plan por estas decisiones
- La Fase 1 deja de usar el layout de tablet: la pantalla «Crear» también se diseña para teléfono vertical. El generador se compacta en pestañas (Cara · Pelo · Ropa · Accesorio · Colores), con el personaje siempre visible arriba.
- Los sellos se modelan como `sellos_def(id 1..4, nombre, token)`. El QR de cada sello es `…/credencial/dist/#/sello/<n>?t=<token>` y la función `sellar()` valida el token. Para cambiar nombres o reglas solo se editan filas.
- Se quita el paso «pasar la credencial al celular con un QR»: ya nace en el celular. Se guarda en el dispositivo y en Supabase, y se puede recuperar con el código `SD-XXXXX`.
- **Vercel (Fase 0)**: importar el repo `dublbs/somos-diseno-herramientas` en Vercel con framework «Other», sin build command y con output directory `.` (los `dist/` ya están versionados). Agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` solo si se recompila allá. Esto lo tienes que hacer tú: Claude Code no tiene acceso a tu cuenta de Vercel.

## Verificación (cuando se implemente)
- Fit test en teléfonos (390 × 844, 412 × 915, 360 × 740): la credencial y la home sin scroll y con botones de 48 px o más.
- Flujo completo en modo demo y con Supabase: crear → QR → abrir en el celular → escanear un sello → ver 1/4 → completar 4/4.
- Escáner probado con una figura impresa bajo la luz de la sede (fase 2).
