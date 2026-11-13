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
| `vagon/` | Vagón (diseña tu carro de metro) | Pixel |
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

## Regla de pantalla: todo cabe sin scroll
Las experiencias son **herramientas de diseño con barras fijas** (propuesta `docs/plans/005-herramientas-de-diseno.md`) y usan el **kit** de `shared/ui/`:
- `shared/ui/somos-kit.css` (componentes `k-`, con forma propia por lenguaje según `data-visual`) y `shared/ui/Kit.tsx`:
  - estructura: `PantallaHerramienta`, `BarraSuperior`, `Seccion`;
  - herramientas: `BarraHerramientas`, `Paleta`;
  - controles: `Segmentado`, `Deslizador`, `Interruptor`, `BotonAccion`, `Confirmar`;
  - estado: `useHistorial` (deshacer y rehacer).
  - `shared/ui/Tutorial.tsx`: `Tutorial` (pantalla previa con 3 pasos, una vez por sesión con `useTutorialVisto`) y `Quiosco` (a los 90 s sin uso avisa 10 s antes y vuelve al inicio borrando lo guardado; `?quiosco=<s>` para probar).
- Muestra del kit: `docs/kit/muestra.html` (se genera con `python3 scripts/kit-muestra.py`).
- Para importar el kit, la app agrega `resolve.dedupe: ['react', 'react-dom']` en `vite.config.ts` y `paths` de `react` en `tsconfig.json` (ver `vagon/`).
- **Pantalla:** barra superior, lienzo, barra derecha y barra inferior, todas fijas.
  - Nada se colapsa ni se esconde en pestañas, y no hay scroll de página ni de panel.
  - En vertical, la barra derecha pasa sobre la inferior.
  - Las barras que lleva cada experiencia están en la tabla de la propuesta 005.
- Ya usan el kit: Vagón, Graffiti, Mosaicos, Teatro, Grabado, Fotomatón (cámara y edición) y Audioreactiva. Las portadas siguen con `shared/somos-ui.css`, con la misma regla de no scroll.
- **Excepción: `credencial/`** es para el celular de cada persona. Su layout propio (`.movil`, 100dvh) cabe sin scroll en 390×844, 412×915 y 360×740.
- **Verificación:** ninguna resolución de tablet (1024×768, 1180×820, 1280×720, 1366×768, 768×1024, 820×1180) puede tener scroll de página, controles fuera de vista ni panel con scroll. Hay que probar con cada herramienta activa.

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
- No inventar arte: los assets vienen de Figma (Claude Code tiene el MCP) o se generan con un script, y quedan en `<app>/public/figma/` con un manifiesto (ej. `docs/plans/002-graffiti/assets.manifest.md`).
- No commitear `.env`, claves de Supabase ni `node_modules`. No reescribir historia.
- Respetar `prefers-reduced-motion` y objetivos táctiles de al menos 44–48 px.

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
- **Sitio**: GitHub Pages publica `main` (los `dist/` versionados): `https://dublbs.github.io/somos-diseno-herramientas/`. Tarda 1–2 min después de cada merge.
  - Credencial (celular): `…/credencial/dist/` · PC madre (staff): `…/admin/dist/` · HUB: `…/hub-estacion/dist/`
- **Supabase**: proyecto `somos-diseno`, ref `opvwftwvfdhhrqwpjvlx`, org de dublbs, plan Free. Corridos: `credencial/supabase/schema.sql`, `shared/supabase/eventos.sql`, `shared/supabase/juego.sql` (incluida la sección 10, cuentas del staff). Función `notificar` desplegada.
- **Staff**: cada persona crea su cuenta en el PC madre («Crear cuenta»); la primera fue admin y las demás las aprueba un admin en Configuración. Hoy: Pipe (admin) y Amaro (admin).
- **Pendiente**: secretos VAPID en la función (los avisos push no se envían hasta entonces) y `VITE_VAPID_PUBLIC_KEY` en `credencial/.env.local`; PIN del canje y stock del premio (se configuran en el PC madre); Portales con cámara y marco (plan 004); retos por mesa; arte del prompt 006; HUB con Realtime.
- **Tokens de los sellos**: están en la tabla `sellos_def` (no en el repo). Se consultan en el SQL Editor: `select id, nombre, meta, token from sellos_def order by id;`

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
