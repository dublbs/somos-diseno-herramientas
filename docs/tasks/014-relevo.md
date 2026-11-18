# 014 · Relevo de la ronda 3 (18 nov): cómo seguir sin la conversación original

Para el agente de Felipe (Pipe) u otro colaborador. Evento: **19 nov**. Plan: [`docs/plans/014-ronda-3.md`](../plans/014-ronda-3.md)
(feedback por experiencia, respaldo de la Flip). Guía común de agentes: `docs/tasks/012-ronda-2.md` («Guía común»).
Si estos archivos no están en tu rama: `git show origin/amaro/plan-014-ronda-3:<ruta>`.

## 1. Ver en qué quedó cada rama
```bash
git fetch origin
for b in audioreactiva-r3 hora-punta-r3 fotomaton-r3 menu-y-grabado-r3 hub-r3 teatro-r3 graffiti-r3 ronda-3; do
  git rev-parse -q --verify origin/amaro/$b >/dev/null \
    && echo "$b: $(git rev-list --count origin/main..origin/amaro/$b) commits · $(git log -1 --format='%cr · %s' origin/amaro/$b)" \
    && git ls-tree -r --name-only origin/amaro/$b | grep AVANCE.md \
    || echo "$b: no existe"
done
```
**Si la rama tiene `AVANCE.md`, está a medias**: retómala desde su «Falta». Si no tiene, está terminada.

## 2. Estado (18 nov, 17:00 UTC)
Lo terminado se va sumando a la rama **`amaro/ronda-3`** (PR #37): para integrar algo nuevo, únelo ahí.

| Rama | Estado | Qué falta |
|---|---|---|
| `amaro/audioreactiva-r3` | **Terminada, en el PR #37** | Túnel = C3, Bum/Chas/dedo propios por escena, `dist/` del evento. Falta probar con dedo y parlante |
| `amaro/hora-punta-r3` | A medias (agente trabajando) | Inacapín de Figma, jefe que salta y se mueve (Snow Bros + Cuphead), Grises al estilo Inacapín, bola de pintura, andén más grande, personaje y vehículos Pixel. Ver su `AVANCE.md` |
| `amaro/fotomaton-r3` | A medias (agente trabajando) | Kit v2, triángulos, ícono de usuario en previews, Señal con stickers de calle, Metro de L1. **Prioridad: permiso de cámara en la tablet, cámara en retrato, rendimiento** (plan 014 §1) |
| `amaro/menu-y-grabado-r3` | **Terminada, en el PR #37** | Menú con el kit v2 y miniatura del cruce isométrico; Grabado con solo marcos Orgánica alrededor del papel (`VENTANA_MARCO = 210` en `grabado/src/lib/afiche.ts` para el ancho) |
| `amaro/hub-r3` | En curso desde las 17:00 UTC (agente de Amaro); si tiene `AVANCE.md`, retomar | Encargo B5 abajo |
| `amaro/teatro-r3` | **Sin empezar** | Encargo B6 abajo |
| `amaro/graffiti-r3` | **Sin empezar** | Encargo B7 abajo |

Referencias de Amaro (fotos del tren de Línea 1 y el metro Pixel de la web): estaban en la sesión de Amaro y **no están
en el repo**. El metro Pixel de la web se parece a `juego-pixel/public/figma/metro-lateral.svg`. Si las necesitas, pídeselas.

## 3. Prioridad para el 19 (si no alcanza, lo de abajo queda fuera)
1. Fotomatón: **cámara en la tablet** (sin esto no funciona la experiencia).
2. Integrar lo terminado en `main` (§5).
3. Hora punta, menú + Grabado.
4. HUB: **respaldo de la Flip** (galería, R3).
5. Graffiti (stickers), Teatro en kit v2.

**Máximo 2–3 agentes a la vez** (más agotan el límite de uso en minutos).

## 4. Encargos
**Preámbulo para todos:**
> Trabajas en el repo `dublbs/somos-diseno-herramientas`. `git fetch origin`. Si tu rama ya existe en `origin`,
> `git checkout -B <RAMA> origin/<RAMA>` y lee su `AVANCE.md`; si no, créala desde `origin/main`. Lee `AGENTS.md`,
> `shared/ui/README.md` (kit v2), el plan `docs/plans/014-ronda-3.md` (tu experiencia en §1) y la «Guía común para
> agentes» de `docs/tasks/012-ronda-2.md` (si no están en tu rama: `git show origin/amaro/plan-014-ronda-3:<ruta>`).
> Empuja seguido (cada trozo que compile) con `AVANCE.md` en tu zona; bórralo al terminar. Verifica en 1024×768,
> 1180×820, 1280×720, 1366×768, 768×1024 y 820×1180: sin scroll de página, panel con scroll propio, toques ≥ 48 px, sin
> errores; mira tus capturas. Termina con `tsc` y build en verde y el `dist/` de producción con el `.env.local` de la
> app (pídeselo a Amaro o Pipe; nunca se sube). No abras PR ni mergees; informe final con qué probaste y qué no.

| RAMA | Zona | Encargo |
|---|---|---|
| `amaro/hora-punta-r3` | `juego-pixel/` | Continuar según su `AVANCE.md` y el plan 014 §1 «Hora punta». El Inacapín está en Figma (archivo `Yo9o3ZG2lyaEGcyxoxs89R`, sección «Inacapin · investigación del personaje versión 2», versión Pixel) |
| `amaro/fotomaton-r3` | `fotomaton/`, `shared/marcos-generados.ts`, `scripts/marcos-generados.py` | Continuar según su `AVANCE.md`. **Primero la cámara en la tablet**: `getUserMedia` dentro del toque de «Abrir la cámara», restricciones tolerantes (`facingMode` ideal, reintento sin restricciones), mensajes claros para NotAllowed/NotFound/NotReadable con «Reintentar» y «Subir una foto»; **retrato 3:4 por defecto**; vista en vivo fluida con CPU limitada |
| `amaro/menu-y-grabado-r3` | `index.html`, `grabado/` | Continuar según su `AVANCE.md`: menú con tokens y componentes del kit v2 (sin anatomía de lienzo), miniatura de Hora punta con el juego actual; Grabado solo con marcos Orgánica alrededor del papel |
| **B5** `amaro/hub-r3` | `hub-estacion/` | (1) **Modo galería** liviano (`?galeria` o `#/galeria`): a pantalla completa pasa las creaciones que llegan (`recientes`/`escuchar` de `shared/datos.ts`: mosaico, grabado, graffiti, juego, foto) con el nombre de la persona si lo hay, sin animación pesada; es el respaldo R3 de la Flip. (2) En el HUB, las personas **aparecen en la plaza y bajan** por las escaleras al andén. (3) Refinar lo que se vea mal en 1920×1080 y 3840×2160. Probar sin Supabase (modo demo) |
| **B6** `amaro/teatro-r3` | `loops/` (autorizado por Amaro) | Pasar Teatro de Papel al **kit v2** (`MarcoHerramienta`: escenario como lienzo, biblioteca y propiedades en el panel derecho con scroll, línea de tiempo abajo sin tapar el escenario) sin perder nada de la ronda 2 (estado de carga, tamaños por escenario, estados, color, sin duplicar, exportación y loop) |
| **B7** `amaro/graffiti-r3` | `graffiti/` | En el modo Sticker, **tocar un sticker ya pegado lo selecciona** con las manijas del kit para moverlo, girarlo, escalarlo o **eliminarlo** (botón en la `BarritaSeleccion`). Hoy solo se quitan con deshacer: guardar los stickers como objetos (no pintados en el muro) hasta exportar |

## 5. Integrar y publicar
1. Rama `amaro/ronda-3` desde `main`; unir las ramas **terminadas** (sin `AVANCE.md`).
2. `npx tsc --noEmit` en las 11 apps; si `shared/` cambió, recompilar `dist/` de las apps que lo usan.
3. Prueba de humo: servir la raíz del repo y abrir cada `<app>/dist/` y el hub; sin errores de consola.
4. Un PR a `main` con lo probado y lo no probado. El merge lo aprieta Amaro o Pipe (GitHub Pages publica en 1–2 min).

## 6. Pantalla Flip (plan 014 §3)
Si el HUB no corre en la Flip: **R1** computador por HDMI con el HUB en pantalla completa en Chrome; **R3** modo galería
(B5); **R4** video en loop desde pendrive (grabar 3–5 min del HUB y de las experiencias con el grabador de pantalla).

## 7. Antes de abrir el evento (personas)
- Migración `006` del flyer corrida (`select nombre from sellos_def where id = 4;` → «Flyer»).
- Fotomatón: `fotomaton/supabase/migrations/0001_fotomaton.sql` y funciones `tarjeta` y `limpiar` (QR fuera de la tablet).
- Escuchar los 5 estilos de Audioreactiva; validar el Inacapín; probar cámara del Fotomatón y cacería en los equipos reales.
