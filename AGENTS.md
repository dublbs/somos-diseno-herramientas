# AGENTS.md · Reglas para agentes (Claude Code, Gemini/Antigravity)

Fuente de verdad para cualquier agente que trabaje en este repo. `CLAUDE.md` y `GEMINI.md` (si existen) solo deben apuntar aquí.
Contexto completo del proyecto: [`docs/ESTADO_DEL_HUB.md`](docs/ESTADO_DEL_HUB.md).

## Qué es
Hub de experiencias interactivas de Somos Diseño para tablet (horizontal) y pantallas del stand. `index.html` (raíz) es el hub; cada experiencia es una app Vite independiente con su propio `package.json`.

| Carpeta | Experiencia | Lenguaje |
|---|---|---|
| `index.html` + `shared/` | Hub, layout, fuentes e íconos compartidos | — |
| `fotomaton/` | Fotomatón CMYK | los tres |
| `taller-mosaicos/` | Taller de Mosaicos | Geométrica |
| `loops/` | Teatro de Papel | Orgánica |
| `graffiti/` | Graffiti y Tags | Pixel |
| `credencial/` | Credencial (celular, mobile-first) | los tres (marcos) |
| `juego-pixel/` | Hora punta (juego en 3 niveles; reemplaza al Vagón en el hub, plan 009) | Pixel |
| `vagon/` | Vagón (fuera del hub desde el 15 nov; queda en el repo) | Pixel |
| `audioreactiva/` | Estación Audioreactiva | Geométrica |
| `grabado/` | Taller de Grabado | Orgánica |
| `hub-estacion/` | HUB «Estación» (pantalla flip y Mac) | los tres |
| `admin/` | PC madre: panel del staff (personas, canje, mesas, avisos, configuración). No va en el hub. | — |

Taller de Píxeles (descartado) vive solo en la rama `archive/taller-de-pixeles`.

## Stack (no cambiar sin pedirlo)
React 18.3.1 · **TypeScript 7.0.2** · Vite 8.3.5 · `@vitejs/plugin-react` 6.1.2 · CSS plano · canvas con `requestAnimationFrame`. Sin librerías ni dependencias nuevas sin aprobación. Nada por CDN: fuentes en `shared/somos-fonts.css`, íconos en `shared/somos-icons.css` (subconjunto de Material Symbols; ver `shared/fonts/README.md` para sumar íconos).

## Comandos
```bash
npm run build                   # compila las 5 apps (fotomaton, mosaicos, loops, graffiti, credencial)
npm run dev:hub                 # sirve la raíz en :8080 (requiere build previo: el hub enlaza a <app>/dist/)
npm --prefix <app> run dev      # desarrollo de una app
npm --prefix <app> run build    # tsc --noEmit && vite build
```
`dist/` está versionado porque el hub enlaza a él: reconstruye la app que toques antes de hacer commit.

## Regla de pantalla: la página no hace scroll; el panel lateral sí (plan 012, D6)
Las experiencias son **herramientas de diseño** con la anatomía de Figma UI3 y Affinity (plan
`docs/plans/012-ui-de-herramienta-y-ronda-2.md`). Manda sobre la propuesta 005 donde chocan.
- **Kit v2 «herramienta»** (lo que se usa desde ahora): `shared/ui/Herramienta.tsx`, `shared/ui/Manijas.tsx` y
  `shared/ui/herramienta.css` (prefijo `h-`, tokens `--h-*`, activos con `<html data-ui="v2">`). **API y receta de
  migración: [`shared/ui/README.md`](shared/ui/README.md).** Muestra: `docs/kit/muestra-v2.html`. Referencia viva:
  `taller-mosaicos/`.
  - plantilla `MarcoHerramienta` (+ `LienzoAjustado`); átomos `Boton`, `BotonIcono`, `Segmento`, `Deslizador`,
    `Interruptor`, `Muestra`; moléculas `SeccionPanel`, `FilaPropiedad`, `GrillaBiblioteca`, `SelectorColor` (Línea azul
    con escalas), `ListaCapas`; organismos `BarraFlotante`, `BarritaSeleccion`, `Manijas` (mover, girar, escalar,
    pellizcar); estado `useHistorial` (con `anular`), `useGestosHistorial` (2 dedos deshace, 3 rehace), `useAviso`.
  - Etapa 1: neutro e igual en todas. Etapa 2: cada lenguaje cambia **solo tokens** (bloque «ETAPA 2» de `herramienta.css`).
- **Pantalla:** barra superior delgada (volver, título, ↶ ↷, «Llévatelo»), lienzo, **barra de herramientas flotante
  abajo al centro** (solo herramientas) y **un panel derecho** con propiedades arriba y biblioteca, capas o ajustes abajo.
  - **Solo el panel lateral tiene scroll** (`overflow-y:auto`, `overscroll-behavior:contain`). La página, el lienzo y la
    barra de herramientas no. Lo frecuente va arriba en el panel, nunca bajo el scroll.
  - En vertical el panel pasa abajo con alto fijo y su propio scroll. El lado izquierdo queda libre para el lienzo.
- Ventanas comunes (iguales en v1 y v2): `shared/ui/Tutorial.tsx` (`Tutorial`, una vez por sesión con
  `useTutorialVisto`; `Quiosco`, a los 90 s sin uso avisa 10 s antes y vuelve al inicio; `?quiosco=<s>` para probar),
  `shared/ui/Juego.tsx` (`PuertaJuego`), `shared/ui/Llevatela.tsx` («Llévatela», plan 011: vista previa → QR de 24 h; la
  app suma `qrcode` a `resolve.dedupe` y a `paths`) y `Confirmar`.
- **Kit v1** (`shared/ui/Kit.tsx` + `somos-kit.css`, componentes `k-` con forma por `data-visual`): lo siguen usando las
  apps no migradas y no cambia de API. Muestra: `docs/kit/muestra.html`. Las dos muestras salen de
  `python3 scripts/kit-muestra.py`.
- Para importar el kit (v1 o v2), la app agrega `resolve.dedupe: ['react', 'react-dom', 'qrcode']` en `vite.config.ts`
  y `paths` de `react`, `react/jsx-runtime` y `qrcode` en `tsconfig.json` (ver `taller-mosaicos/`).
- **Excepción: `credencial/`** es para el celular de cada persona. Su layout propio (`.movil`, 100dvh) cabe sin scroll en 390×844, 412×915 y 360×740.
- **Verificación:** en 1024×768, 1180×820, 1280×720, 1366×768, 768×1024 y 820×1180, con cada herramienta activa: sin
  scroll de página, sin controles fuera de vista (los del panel, alcanzables con su scroll), la barra flotante sin tapar
  el lienzo ni salirse, y toques ≥ 48 px.

## Datos compartidos
- `shared/datos.ts`: lo que las experiencias mandan al HUB (`publicar`) y lo que el HUB escucha (`escuchar`, `recientes`). Local (localStorage + BroadcastChannel) o Supabase por REST si existen `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (en `.env.local`, nunca en el repo). Guía: `docs/supabase.md`.
- `shared/juego.ts` y `shared/ui/Juego.tsx`: estaciones de timbres, modo juego en las mesas y PIN del staff (hash local o `VITE_STAFF_PIN_SHA256`).
- `shared/supabase/juego.sql` (plan 007): staff con Supabase Auth, `pasos` con meta por estación (Portales = 3 afiches), `canjear()` con PIN en el servidor y stock, suscripciones push. `shared/supabase/functions/notificar/` manda los avisos. `admin/` es el panel: **excepción a la regla de pantalla** (es una herramienta de escritorio con scroll).

## Propiedad de archivos
| Zona | Dueño |
|---|---|
| `index.html`, `shared/` (incluye `shared/marcos.ts`, que usan Fotomatón y Credencial), `docs/`, `AGENTS.md`, assets de Figma, `admin/` | Claude Code |
| `fotomaton/`, `taller-mosaicos/`, `graffiti/`, `credencial/` | Claude Code; Antigravity solo mediante tareas escritas en `docs/tasks/` |
| `loops/` | La persona del equipo que lo trabaja; los agentes lo editan **solo cuando se pide** |

## Reglas de trabajo
- Un commit por tarea, mensajes convencionales: `tipo(app): descripción` (`feat`, `fix`, `docs`, `refactor`, `chore`).
- Antes de terminar: `npm --prefix <app> run build` verde.
- Si algo bloquea o la tarea es ambigua, escribir el bloqueo en la tarea y detenerse. No improvisar arquitectura.
- **Después de cada QA, revisión o simulación:** dejar la bitácora en `docs/qa/` y un documento de tareas
  `docs/tasks/NNN-correcciones-*.md` con **todas** las correcciones (también las que no se aplican, con su motivo) y
  la lista de lo que quedó sin comprobar. Después se aplican desde ese documento, marcando cada tarea.
- No inventar arte: los assets vienen de Figma (Claude Code tiene el MCP) o se generan con un script, y quedan en `<app>/public/figma/` con un manifiesto (ej. `docs/plans/002-graffiti/assets.manifest.md`).
- No commitear `.env`, claves de Supabase ni `node_modules`. No reescribir historia.
- Respetar `prefers-reduced-motion` y objetivos táctiles de al menos 48 px (44 solo en lo que aún no migra a v2).

## Trabajo en paralelo (Pipe, Amaro y sus agentes)
Desde nov 2026 dos personas iteran la plataforma, cada una con su propio agente de IA, sobre este mismo repo. Estas reglas valen para cualquier agente y mandan sobre «Propiedad de archivos» cuando choquen.

1. **El repo es la fuente de la verdad.** Lo conversado en un chat no existe hasta que está escrito aquí. Si un cambio toca una regla del juego, una pantalla o una decisión de `docs/plans/`, primero se escribe en un plan (nuevo o el existente) y después se construye. Las decisiones vigentes no se reabren por iniciativa del agente: si el humano pide algo que choca con un plan, el agente lo dice antes de tocar código.
2. **Una rama y un PR por cambio. Nada directo a `main`.** Rama `<persona>/<tema>` (ej. `amaro/portales-camara`, `pipe/hub-realtime`). El otro humano revisa y mergea; el merge lo aprieta una persona, no un agente.
3. **Avisar qué se toma.** Al empezar algo, abrir el PR como borrador (draft) con una línea de qué se va a tocar. Ese PR es el aviso: antes de empezar, revisar los PR abiertos para no tomar lo mismo.
4. **Archivos compartidos con cuidado.** `shared/`, `AGENTS.md`, `docs/plans/`, `shared/supabase/` y `credencial/src/lib/store.ts` los usan todas las apps. Cambios ahí: chicos, en su propio PR y explicados en la descripción.
5. **La base de datos ya está en producción** (proyecto `somos-diseno`, ver abajo). No editar lo que ya se corrió para cambiar su comportamiento: un cambio nuevo va en un archivo nuevo `shared/supabase/migraciones/NNN-tema.sql`, idempotente (`if not exists`, `create or replace`, `drop … if exists`). Quien lo corre en el SQL Editor lo anota en el PR («corrido en somos-diseno el dd/mm»).
6. **`dist/` al final.** Se recompila solo la app tocada y justo antes de pedir el merge (`npm --prefix <app> run build`), para no chocar en archivos generados. Si hay conflicto en `dist/`, se resuelve recompilando, nunca a mano.
7. **Secretos fuera.** Ni claves privadas, ni tokens de los sellos, ni contraseñas en el repo, en PRs ni en mensajes de commit. La clave publishable de Supabase sí puede ir en `.env.local` (y termina en `dist/`, es pública por diseño).
8. **Cerrar con estado.** Cada PR termina diciendo qué quedó probado, qué no y qué falta. Si cambia el estado general, se actualiza la sección «Estado en vivo».

## Estado en vivo (actualizar al mergear)
- **Evento:** 19 nov 2026. Prueba general: 18 nov (`docs/tasks/009-pendientes.md`, H5).
- **Sitio**: GitHub Pages publica `main` (los `dist/` versionados): `https://dublbs.github.io/somos-diseno-herramientas/`. Tarda 1–2 min después de cada merge.
  - Credencial (celular): `…/credencial/dist/` · PC madre (staff): `…/admin/dist/` · HUB: `…/hub-estacion/dist/`
- **Decisiones vigentes (planes 009–011, Amaro, 13 nov; el equipo se alinea a ellas):**
  - **Timbres:** 1 Inscripción · 2 Creación (4 experiencias distintas) · 3 Cacería (3 afiches) · 4 Secreto (jefe final o plan B). El canje pide los 4.
  - **Hora punta reemplaza al Vagón.**
  - **La credencial es opcional para jugar** («Jugar sin credencial»).
  - **«Llévatela» con QR** en todas las experiencias.
- **Supabase**: proyecto `somos-diseno`, ref `opvwftwvfdhhrqwpjvlx`, org de dublbs, plan Free. Qué está corrido y cuándo: `shared/supabase/migraciones/README.md`. Funciones: `notificar`, `tarjeta`, `limpiar`. Crons: `somos-borrar-24h` y `fotomaton-limpiar`.
- **Staff**: cada persona crea su cuenta en el PC madre («Crear cuenta»); la primera fue admin y las demás las aprueba un admin en Configuración. Hoy: Pipe (admin) y Amaro (admin).
- **Pendiente (personas):**
  - sellos de los afiches impresos y probados (H2);
  - plan B del Secreto (H3);
  - PIN del canje y stock del premio en el PC madre (hoy stock 1, límite 1, sin PIN);
  - secretos VAPID si se quieren avisos push.
- **Pendiente (código):** `docs/tasks/009-pendientes.md` (Amaro) y `docs/tasks/008-teatro.md` (Teatro, Pipe).
- **Secretos de sellos y afiches**: están en `sellos_def` y `afiches` (no en el repo). Se consultan en el SQL Editor.

## Flujo con dos herramientas (opcional, anterior)
Antes de nov 2026 Claude Code ejecutaba de punta a punta. Si se reparte trabajo con Antigravity:
1. **Claude Code**: idea → plan (`docs/plans/NNN-*.md`) → tareas atómicas (`docs/tasks/NNN-*.md`) con assets resueltos.
2. **Antigravity**: ejecuta las tareas en orden, un commit por tarea.
3. **Claude Code**: revisa el diff, corre builds y la verificación de pantalla, reabre lo que falle.

Plantilla de tarea:
```md
## T-000 · Título corto
- Archivo: ruta/exacta.ts (líneas ~a-b)
- Cambio: qué hacer, concreto.
- No tocar: …
- Verificar: `comando`
- Aceptación: criterio observable.
- [ ] Hecha
```

## Convenciones de diseño
- Lenguajes visuales: Pixel, Geométrica, Orgánica. El `data-visual` de `<html>` cambia acento, forma y tipografía.
- Paleta oficial «Línea azul»: Hueso `#F4EEE3`, Negro `#000000`, Azul `#0062B8`, Lapislázuli `#2B4BD8`, Celeste `#7FC8F8`, Amarillo `#FFC20E`, Verde `#00A651`, Rosa `#FF8FB1`, Morado `#7A2E8E`.
- Enlace «volver» al hub: `href="../../"` (las apps se sirven como `<hub>/<app>/dist/`).
- Tarjetas exportadas: 1080 × 1350 con la franja negra común (ver `fotomaton/src/lib/tarjeta.ts`).
