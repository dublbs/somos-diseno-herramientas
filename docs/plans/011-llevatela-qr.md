# 011 · Jugar sin credencial y «Llévatela» con QR en todas las experiencias

Fecha: 13 nov 2026 · Estado: **aprobado** (Amaro, 13 nov) · Rama `amaro/llevatela-qr`.

## Por qué
- **No tener credencial impedía jugar.** Con el modo juego encendido, la mesa pedía el código y no había otra salida
  (plan 005, bloque D). Pasa a ser opcional: la credencial suma timbres e inventario, pero no es la entrada.
- **«Descargar» guardaba la imagen en la misma tablet.** En Graffiti, Mosaicos, Grabado, Audioreactiva y Hora punta la
  persona no se llevaba nada. Solo el Fotomatón tenía QR.

## Qué cambia respecto de planes anteriores
| Antes | Ahora | Dónde estaba |
|---|---|---|
| Modo juego: la tablet **pide** el código de la credencial | La pide, pero con **«Jugar sin credencial»**: se juega igual, no suma timbres | Plan 005 bloque D |
| Exportar = descargar en la tablet | Exportar = **«Llévatela»**: aviso de 24 h → QR → el celular la descarga | Plan 005 (cada experiencia) |
| QR solo en el Fotomatón | El mismo sistema del Fotomatón para todas | `fotomaton/CLAUDE.md` |

## 1. Jugar sin credencial
- La pantalla «Escribe el código de tu credencial» suma el botón **«Jugar sin credencial»** (`shared/ui/Juego.tsx`).
- Queda anotado en la sesión de la tablet (`sd:sin-credencial`), como el código: el quiosco lo borra a los 90 s sin uso
  y la mesa vuelve a preguntar a la persona siguiente.
- Sin credencial: se juega completo y la creación se lleva por QR. No hay timbre, ni inventario, ni aviso de la mesa.
- El texto lo dice claro: «Sin credencial igual juegas y te llevas tu creación con un QR. Los timbres solo suman con
  credencial».

## 2. «Llévatela» con QR en todas
- **Un solo componente** en el kit (`shared/ui/Llevatela.tsx`) y una sola subida (`shared/llevatela.ts`), con el flujo
  del Fotomatón: ventana encima de la herramienta → vista previa y aviso («Tu creación queda disponible 24 horas para
  descargarla y después se borra») → **Generar QR** → QR grande → **Terminar**. Si falla la red: **Reintentar**.
- **Mismo servidor que el Fotomatón**, sin infraestructura nueva: bucket privado `fotomaton`, tabla `fotomaton` (la columna
  `marco` guarda la experiencia, `tinta` queda en `-`), función `tarjeta` (URL firmada de 60 s) y función `limpiar`
  (borra a las 24 h). Ruta en el bucket: `<experiencia>/<uuid>.<ext>`.
- **Página de descarga:** la del Fotomatón (`fotomaton/dist/#/f/:id`), ahora genérica: `?app=` dice de qué experiencia
  es (nombre, texto y nombre del archivo) y muestra video si es un loop de Audioreactiva.
- **Sin servidor** (o si el bucket no existe todavía) la tarjeta queda en la tablet (IndexedDB, como el Fotomatón) y el
  QR solo abre en ese equipo. La experiencia nunca se cae.
- **Privacidad:** igual que el Fotomatón. Solo sube la tarjeta final, solo cuando la persona toca «Generar QR», con un
  enlace que no se puede adivinar y se borra a las 24 h. Nada de esto depende de la credencial.
- **Dependencia:** `qrcode` (aprobada el 13 nov) en cada experiencia, como ya está en el Fotomatón. Se resuelve igual que
  React desde el kit (`resolve.dedupe` y `paths`).

| Experiencia | Qué se lleva | Botón que abre «Llévatela» |
|---|---|---|
| Graffiti | Tarjeta 1080 × 1350 de tu muro | «Llévate tu muro» |
| Taller de Mosaicos | El mosaico en PNG | «Llévatelo» (antes «Descargar») |
| Taller de Grabado | Tarjeta de tu grabado | «Llévatelo» (antes «Descargar») |
| Audioreactiva | El loop en video, o una imagen | «Grabar loop» y «Foto» |
| Hora punta | Tarjeta con tu mural | «Llévate tu tarjeta» |
| Fotomatón | Ya lo tenía (sin cambios) | «Llévatela» |
| Teatro de Papel (`loops/`, Pipe) | Se suma cuando Pipe lo indique: es usar `<Llevatela>` en su exportar | — |

## 3. Lo que sigue igual
- Con credencial: el timbre y el inventario funcionan como hoy (plan 009), además del QR.
- El HUB recibe lo mismo que antes.

## Para que funcione en el evento (H1)
Correr `fotomaton/supabase/migrations/0001_fotomaton.sql` **una vez** y desplegar las funciones `tarjeta` y `limpiar`
(`supabase functions deploy tarjeta limpiar`), con el cron de `limpiar` cada hora. Sin eso, el QR abre solo en la tablet.

## Verificación (13 nov 2026, modo demo)
- [x] En Graffiti, Mosaicos, Grabado, Audioreactiva y Hora punta (47 casos): con el modo juego encendido aparece «Jugar sin
  credencial» y entra sin código; exportar abre «Llévatela» con la vista previa; sin credencial no aparece el aviso del
  timbre; la ventana cabe entera (botones ≥ 44 px) en las 6 resoluciones de tablet; el QR se lee (jsQR) y apunta a
  `fotomaton/dist/#/f/<uuid>?app=<experiencia>`; esa página muestra la creación con el nombre de la experiencia;
  «Terminar» vuelve a la herramienta; sin errores.
- [x] Con credencial: el aviso dice que también llega al inventario y suma su paso al timbre Creación.
- [x] Las 11 apps compilan (`tsc`) con el kit nuevo.
- [ ] Con Supabase real (después de H1): el QR abre en otro celular. Sin H1, el QR abre solo en la tablet (respaldo local).
- [ ] Video de Audioreactiva por QR (el código lo soporta: sube `webm`/`mp4` y la página muestra `<video>`); probarlo en
  la tablet, porque los loops pesan más.
- [ ] Teatro de Papel (`loops/`): lo suma Pipe. Al recompilar `loops/dist` con el `shared/` nuevo, su puerta del modo
  juego también ofrece «Jugar sin credencial».
