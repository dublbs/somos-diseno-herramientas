# Somos Diseño · Hub de Experiencias — Estado, diagnóstico y plan

> Actualizado: 2026-10-28 · Rama: `claude/ecstatic-lovelace-xjgq6d`

## Estado actual (lo hizo Claude Code, sin pasar por Antigravity)

**Las 4 experiencias están arriba y caben en pantalla sin scroll.** Verificado con Playwright en 1024×768, 1180×820, 1280×720, 1366×768, 1920×1080, 768×1024 y 820×1180, en cada pestaña de cada panel: 0 scroll de página, 0 controles fuera de vista o recortados y ningún panel con scroll interno.

| Área | Qué quedó |
|---|---|
| Sistema de layout (`shared/somos-ui.css`) | `.app-pantalla` (100dvh, barra + cuerpo), `.cuerpo-pantalla` (2 columnas en horizontal, 2 filas en vertical), `.escenario-fit` + `.lienzo-fit` (el lienzo se mide por alto con container queries y respeta la proporción `--ratio`), `.panel-app` con `.pestanas`, `.panel-pagina` y `.panel-pie` (acciones fijas). Bajo 600×560 (teléfono) la página hace scroll. |
| Fuentes e íconos | Todo local: `shared/somos-fonts.css` (Bricolage, DM Sans, Silkscreen, IBM Plex Mono) y `shared/somos-icons.css` (subconjunto de Material Symbols, 6 KB). Ninguna app pide nada a Google. |
| Fotomatón | Barra común; panel «Lenguaje y marco» / «Efecto y paleta» (juntos en horizontal amplio, en pestañas en vertical o alto chico); marcos en grilla; portada que cabe por alto. **QR arreglado** (`HashRouter` + enlace con la ruta real: `…/fotomaton/dist/#/f/<id>` abre la descarga, probado de punta a punta). Timers de la cuenta regresiva limpiados al salir. |
| Taller de Mosaicos | Simplificado en 3 pestañas: **Dibujar** (herramientas + 18 formas sin nombres, Girar/Reflejar en la misma fila; Multiplicar reemplaza la grilla por las operaciones), **Color** (8 paletas + Invertir + Aplicar a todo), **Formato** (6 formatos como botones + grilla). Pie: Descargar, Sorpréndeme, Limpiar. Lienzo por alto con la proporción del formato. Sin `window.claude` ni código muerto; `fs.allow`. |
| Teatro de Papel | Pestañas **Escena** (escenario + bandeja) y **Pieza** (se abre sola al tocar una figura). Línea de tiempo en una fila bajo el lienzo. Pie: video, PNG, vaciar. Modal accesible (Esc), nombre de archivo correcto, aviso si falla el PNG, sin «Día Orgánica · Mesa 4». Animación y render intactos. |
| Graffiti y Tags (nuevo) | Muro 60×60, spray interpolado, **goteo** animado (máx. 40 chorros; con «reducir movimiento» se pinta de una vez), borrador, deshacer (40), vaciar con doble toque; 4 muros, 8 stickers + tag de Figma (sin fondos de marcos), 8 colores; tarjeta 1080×1350. Tarjeta activa en el hub. |
| Hub | Miniatura de Teatro de Papel con el arte real; miniaturas canvas para Graffiti, Audioreactiva y Jardín; Píxeles retirado; `fullscreenchange`; reduced-motion sin bucle. Navegación hub → app → volver probada en las 4. |
| Stack | React 18.3.1 + **TypeScript 7.0.2 en las 4 apps** + Vite 8.3.5. |
| Credencial (nuevo, celular) | `credencial/`: personaje Pixel creado en el celular, dentro de un **marco** del sistema (`shared/marcos.ts`, compartido con el Fotomatón), y 4 sellos genéricos que se ganan escaneando QR o escribiendo su código. MVP: 6 marcos (M02 y M05 por lenguaje) que tematizan toda la UI, foto (Fotomatón sin efectos) o uno de 3 personajes, y 4 timbres de Figma por lenguaje con su álbum y su momento de timbrado. Mobile-first, sin scroll en teléfonos. Modo demo o Supabase. Ver [`plans/003-credencial.md`](plans/003-credencial.md). |
| Taller de Píxeles | Archivado: la carpeta se borró de `main` y el código vive en la rama `archive/taller-de-pixeles`. |

**Sigue pendiente (decisión tuya o fuera del código):**
0. Publicar en **Vercel** (lo conectas tú; `vercel.json` ya evita el build) y correr `credencial/supabase/schema.sql` para la credencial real.
1. Fotomatón con Supabase real: activar el `cron.schedule` de limpieza (24 h) en la migración y probar el QR con un celular en la red del evento.
2. 15 marcos del Fotomatón (hoy 12) y envío a «Pantalla Flip».
3. Probar todo en la tablet física (táctil real, rendimiento del goteo y de los videos de Teatro de Papel).
4. Post-MVP: workspaces + `packages/shared`, sacar `dist/` de git, lint/CI, Framer Motion acotado.

> Las secciones de abajo son el **diagnóstico original** (antes de estos cambios). Se conservan como contexto; varias cosas que describen ya están resueltas (ver tabla de arriba).

## 1. Resumen en 60 segundos

- El hub es una **portada táctil para tablet/quiosco** (`index.html`, HTML plano, 472 líneas) con tarjetas hacia apps Vite independientes.
- Las apps comparten stack: **React 18.3.1 + TypeScript + Vite 8.3.5**, CSS plano y canvas. Sin librerías de animación, tests, linter ni CI.
- **Arriba hoy:** Fotomatón CMYK, Taller de Mosaicos, Teatro de Papel. **Pausado y descartado:** Taller de Píxeles. **Maquetas sin código:** Graffiti y Tags, Estación Audioreactiva, Jardín de Papel.
- **Objetivo MVP:** hub pulido + Fotomatón, Mosaicos, Teatro de Papel y **Graffiti** funcionando de punta a punta en la tablet.
- Lo más urgente no es agregar funciones: es (1) la miniatura fea de Teatro de Papel, (2) construir Graffiti, (3) verificar el QR del Fotomatón fuera de un despliegue en raíz, (4) definir cómo se despliega todo junto.
- **Framer Motion:** sí, pero acotado y post-MVP (ver 5).

## 2. El hub (`index.html`)

| Ítem | Detalle |
|---|---|
| Uso | Quiosco/tablet. Filtro por lenguaje visual (Todos / Pixel / Geométrica / Orgánica) |
| Efecto del filtro | Oculta tarjetas **y** cambia `data-visual` en `<html>` (acento, forma y tipografía de toda la página) |
| Reset | Tras 90 s sin actividad vuelve a "Todos" y sube al inicio (solo en el hub) |
| Miniaturas | `<canvas>` dibujados a mano en JS, throttle a 30 fps (`index.html:233-409`) |
| Enlaces | Relativos a `<app>/dist/` → requieren build (por eso `dist/` está versionado) |
| Estilos | `shared/somos-tokens.css` + `shared/somos-ui.css` |

Tarjetas: Fotomatón (`:89`), Mosaicos (`:104`), Píxeles (`:119`, "Próximamente"), Teatro de Papel (`:136`), Graffiti (`:151`), Audioreactiva (`:169`), Jardín (`:187`); las tres últimas con `.miniatura-placeholder` (solo un texto).

### 2.1 Por qué la miniatura de Teatro de Papel se ve fea (diagnóstico)
(Verificado en `origin/main`: el hub no cambió con tu merge, la miniatura sigue igual.)
`index.html:356-393` dibuja con **primitivas del canvas**: fondo rosa plano, sol con triángulos, cerros en zigzag y un "pudú" hecho con una elipse y un círculo. Las otras miniaturas muestran el lenguaje real de su experiencia (puntos halftone, piezas de mosaico reales con los mismos paths SVG, sprite pixel). Teatro de Papel es la única que **no usa el arte real** de la experiencia (los ~94 SVG de `loops/public/figma/organica/`), así que se ve genérica y desentona.

### 2.2 Mejora propuesta (parte del MVP)
- Cargar con `Image` los SVG reales desde `loops/dist/figma/organica/…` y componerlos en el canvas **replicando los movimientos reales de `piezas.ts`**: `fondo/cielo` + `cordon-lejano` (±10 px) + `cordon-cercano` (±16 px) + `suelo` en ciclo de 4 s; `sol/sol` girando (vuelta cada 8 s) y respirando; `araucaria/araucaria` mecida ±2,5°; pudú que bota (grupo `y` 0↔−3) y paloma con aleteo simple. Borde de papel recortado con sombra sutil como en la experiencia.
- El marco de las piezas es 240×240; la tarjeta es 400×250, así que se escala con *cover* centrado y se recorta.
- Mantener el estilo stop-motion (cuantizar el tiempo a ~12 fps) para que coincida con la experiencia.
- Fallback si las imágenes no cargan: la versión actual (no romper el hub).
- Precargar antes del primer frame y respetar `prefers-reduced-motion` (un solo fotograma estático).
- **No** modifica nada dentro de `loops/`; solo lee sus assets ya publicados. Si Loops cambia nombres de archivos, hay que actualizar rutas (dejar las rutas en un único objeto `ASSETS_LOOPS`).
- Aprovechar para dar a Graffiti, Audioreactiva y Jardín una miniatura canvas real en vez de `.miniatura-placeholder` (Graffiti primero).

### 2.3 Otros pulidos del hub para el MVP
- Botón de pantalla completa: escuchar `fullscreenchange` (hoy el texto queda desactualizado al salir con Esc, `index.html:462,465`).
- `prefers-reduced-motion`: hoy solo apaga transiciones, no el bucle `rAF` de miniaturas.
- Quitar el texto "Auto-reset 90s" del footer si no se explica, o aplicar el timeout también dentro de las experiencias (ver 7).
- Duplicados internos (`HEX`, paths de formas, `index.html:217-229`): aceptables en MVP; moverlos a `shared` después.
- Fuentes de Google por CDN: autoalojar para tablet sin internet.
- Estado "Próximamente": definir un único diseño de tarjeta bloqueada, coherente en las tres maquetas.

## 3. Las experiencias

### 3.1 Fotomatón CMYK — `fotomaton/` (~1.170 líneas) · buen nivel
- **Qué hace:** foto con la cámara (o subida) → efecto según lenguaje (trama CMYK / CRT / mosaico triangular) → marco → tarjeta 1080×1350 → QR para el celular.
- **Flujo:** `Portada → Cámara (3-2-1) → Revelando → Editor → QR`, más `/f/:id` para descargar en el celular.
- **Stack extra:** `@vladmandic/face-api` (modelo local), Supabase (tabla + Storage privado + 2 Edge Functions), `qrcode`, `react-router-dom`, TypeScript 7.
- **Datos:** sin Supabase configurado usa modo prueba (IndexedDB, 24 h). La foto original nunca se sube.
- **Contenido:** 12 marcos de 15 planificados, 6 tintas.
- **Pendiente declarado:** 15 marcos; envío en tiempo real a "Pantalla Flip".
- **Riesgos a verificar antes de usarlo en vivo:**
  1. `Camara.tsx:19-25`: `setInterval` de la cuenta regresiva sin limpiar al desmontar.
  2. **QR (bug confirmado con Playwright):** `/f/<id>` queda en blanco: con `base: './'` los assets se piden a `/f/assets/…` y el servidor responde HTML (`vercel.json` solo reescribe `/f/:id`). Además el enlace `${location.origin}/f/${id}` no existe si la app se sirve desde `<hub>/fotomaton/dist/`. Solución decidida: `HashRouter` + enlace con `location.pathname` (tarea T-002 del plan 001).
  3. El cron `pg_cron` de borrado a 24 h está comentado en la migración.
  4. Sin `prefers-reduced-motion`; canvas sin `aria-label`.

### 3.2 Taller de Mosaicos — `taller-mosaicos/` (~1.800 líneas) · buen nivel
- **Qué hace:** componer patrones en grilla 12×12; 6 formatos, 18 formas, 8 paletas; herramientas Poner/Girar/Reflejar/Borrar/**Multiplicar**; "Sorpréndeme"; exporta PNG; guarda en `localStorage`.
- **Ruido a limpiar (no bloqueante):** `lib/exportar.ts:39-42` usa `window.claude.use('downloads')` (API de artefactos, no de navegador; cae al `<a download>`); código muerto (`construirSVG`, `COLORES`, `MAX_COLORES`, `usaA/usaB`); README describe funciones que ya no existen; `vite.config.ts` sin `server.fs.allow` como sus hermanas (puede fallar `dev` al importar `../shared`).

### 3.3 Teatro de Papel (Estación de Loops) — `loops/` · **estado en `main` tras tu merge; fuera de alcance de edición**
Revisado en `origin/main` (`009fd19`). Lo que cambió respecto al primer relevamiento:
- **Nuevo en la UI:** línea de tiempo con slider y controles de reproducción, **trayectos de desplazamiento** para seres móviles (pudú, pingüino, paloma, pez; invertir/quitar), controles ovalados eliminados, layout `viewport-fit` y resolución 1080p. `EscenarioOrganico.tsx` pasó a 632 líneas, `styles.css` a 570 y `dibujar.ts` a 289.
- **Nuevo en render:** **supersampling 4×** para vectores nítidos al escalar (`dibujar.ts:76`, `mult = max(4, ceil(960/max(w,h)))`), arreglo de clipping en araucaria y recursos, animación para K'isa, nuevo asset `fondo/suelo.svg` ("suelo andino").
- **Datos que conviene conocer para la miniatura del hub:** el fondo de Cordillera son 4 capas de 240×240 (`fondo/cielo`, `cordon-lejano`, `cordon-cercano`, `suelo`) con ciclo de 4 s: el cordón lejano oscila −10 px y el cercano +16 px (`piezas.ts:313-322`). El sol es `sol/sol.svg` (una vuelta cada 8 s, respira 1→1,05); el pudú tiene capas `cola, pata1-4, cuerpo, cabeza`; la paloma `cola, ala-superior, ala-inferior, cuerpo, cabeza, pico, ojo`. Hay ~94 SVG en `loops/public/figma/organica/` (y copia en `loops/dist/figma/organica/`).
- **Sigue igual (lo ves tú, no se toca desde este plan):** `App.tsx:9` conserva el comentario "Geométrica y Pixel vuelven"; el texto fijo `'Día Orgánica · Mesa 4'` sigue en `App.tsx:17` y `EscenarioOrganico.tsx:293-303`; `loops/` sigue sin README propio; el video se sigue grabando en tiempo real. No verifiqué si el modal de exportación ganó semántica de diálogo/Esc.
- El enlace "volver" sigue siendo `href="../../"` (solo funciona servido como `<hub>/loops/dist/`).
- **Este plan no propone cambios en `loops/`.** La única intervención es la miniatura del hub (2.1–2.2), que *lee* sus assets.

### 3.4 Taller de Píxeles — `taller-de-pixeles/` · **descartado**
- Decisión de producto: no convence. Se archiva (rama/tag `archive/taller-de-pixeles`), se retira su tarjeta y su script de la raíz. Su cupo Pixel lo ocupa Graffiti.
- Rescatable por si hace falta: `muestreo.ts`, Bayer y paletas PICO-8/Game Boy.

### 3.5 Graffiti y Tags — `graffiti/` · **a construir en el MVP** (Pixel)
Texto de la tarjeta hoy: *"Pinta tu firma o ilustración urbana con trazo grueso y goteo de pintura en estética pixel digital."* Alcance mínimo propuesto (a confirmar contigo):
- Lienzo cuadrado de 60×60 celdas tipo muro, con fondo elegible (ladrillo y hormigón generados; persiana y damero desde Figma) como assets.
- Spray de trazo grueso sobre grilla pixel; 4–6 colores (Línea azul + neón); tamaño de boquilla; **goteo** que chorrea con gravedad (animado en canvas); borrador; deshacer.
- Stencils/tags y stickers pixel opcionales (assets).
- Exportar tarjeta PNG 1080×1350: arte cuadrado de 1080 (18 px por celda) + franja negra de 270 px igual a la del Fotomatón.
- Mismo stack (React + TS + Vite, canvas + pointer events, `shared/`), sin librerías nuevas. Scaffold copiando `loops/` o `taller-mosaicos/`.
- Assets: los trae o genera Claude (sección 8); Antigravity no inventa arte.
- Criterio de listo: se entra desde el hub, se pinta, se deshace, se exporta PNG, se vuelve al hub; probado en la tablet.

### 3.6 Maquetas posteriores
Estación Audioreactiva (Geométrica, Web Audio) y Jardín de Papel (Orgánica): se mantienen como tarjetas "Próximamente" bien diseñadas; no se construyen en este MVP. La credencial se retomó como app de celular (plan 003).

## 4. Qué está proyectado

| Ítem | Fuente | Estado |
|---|---|---|
| Hub pulido + miniaturas reales | esta revisión | MVP |
| Graffiti y Tags | `index.html:151` | MVP, construir |
| Taller de Píxeles | decisión del equipo | Descartado, archivar |
| 15 marcos del Fotomatón (hoy 12) | `fotomaton/README.md` | Pendiente |
| Envío realtime "Pantalla Flip" | `fotomaton/README.md` | Después del MVP |
| Audioreactiva, Jardín | `index.html:169-187` | Después |
| Sync Figma ↔ código (`figma-tokens.ts`) | `FIGMA_SYNC.md` | Propuesto, no existe |

## 5. Diagnóstico del stack

**Lo bueno:** las apps ya son homogéneas (React 18.3.1, Vite 8.3.5, plugin-react 6.1.2, mismos scripts).

**Inconsistencias:** TypeScript **7.0.2** en Fotomatón vs **5.9.3** en el resto; el hub es el único que no es React/Vite; sin ESLint/Prettier/tests/CI; fuentes por CDN.

**¿Mismo stack para todo? Sí.** Para el MVP el hub puede seguir en HTML plano (es estático, funciona y es fácil de editar por cualquier agente). Migrarlo a React solo si se quiere Framer Motion en él.

### Framer Motion
- **Sí, acotado y post-MVP.** Hoy la animación de interfaz es CSS a mano. Útil para: transiciones entre pasos (`AnimatePresence`), modales, paneles, `MotionConfig reducedMotion="user"`.
- **No** para canvas (Graffiti, Mosaicos, miniaturas): ahí manda `requestAnimationFrame`.
- Paquete actual: `motion` (`motion/react`); `framer-motion` sigue funcionando; compatible con React 18. Con `LazyMotion` baja a ~5–6 KB gz. Verificar versión al instalar.
- Candidatos: Fotomatón (pasos) y Graffiti (paneles/herramientas). Alternativa barata: View Transitions / `@starting-style`.
- En Graffiti, **no** instalarlo en la primera pasada; se agrega después si hace falta.

## 6. ¿La estructura es la ideal? No, pero para el MVP se corrige solo lo barato

Problemas: 4 (pronto 5) proyectos npm sueltos sin workspaces; `dist/` versionado (100 archivos, hashes en cada commit) porque el hub enlaza a `dist/`; `shared/` solo CSS y paleta Línea azul copiada en 6 lugares; despliegue sin definir (solo `vercel.json` del Fotomatón); READMEs y `FIGMA_SYNC.md` desactualizados; sin lint/tests/CI.

### Estructura objetivo (post-MVP, incremental)
```
/
├── package.json            # npm workspaces: ["apps/*", "packages/*"]
├── AGENTS.md               # reglas compartidas Claude Code + Antigravity
├── docs/ { ESTADO_DEL_HUB.md, plans/, tasks/ }
├── apps/ { hub, fotomaton, mosaicos, graffiti, loops }
└── packages/shared/        # @somos/shared: css, paleta.ts, prng.ts, descargar.ts, ui/
```
Decisiones: workspaces de npm (sin turbo/pnpm); `dist/` fuera de git con `build:all` + un solo deploy; fuentes autoalojadas; QR del Fotomatón con `VITE_PUBLIC_URL` o `import.meta.env.BASE_URL`.

### Qué sí se hace ahora (barato, durante el MVP)
- `AGENTS.md` + carpetas `docs/plans` y `docs/tasks`.
- Unificar versión de TypeScript.
- Actualizar README raíz (agregar Graffiti, sacar Píxeles/Loops desactualizados, explicar `build:all` antes de servir) y `FIGMA_SYNC.md` según lo real.
- `graffiti/` nace ya con la estructura estándar (misma `vite.config.ts`, `@import ../../shared/somos-ui.css`, `fs.allow`).
- **No** mover carpetas a `apps/` ni borrar `dist/` mientras Loops se edite en paralelo (evita conflictos de merge); hacerlo cuando Loops esté estable.

## 7. Plan de trabajo del MVP

Principio: **hub + 4 experiencias estables > más experiencias.** Orden por impacto/riesgo. Sin fechas de evento asumidas.

### Bloque H — Hub (rápido, alto impacto visual)
1. Nueva miniatura de Teatro de Papel con arte real (2.2).
2. Miniatura real para Graffiti (placeholder → canvas) y tarjeta bloqueada coherente para las maquetas.
3. Quitar tarjeta/script de Píxeles (archivar).
4. `fullscreenchange`, `prefers-reduced-motion`, fuentes locales.
5. Revisar el hub en la tablet objetivo (vertical y horizontal) y el reset de inactividad.

### Bloque G — Graffiti (prioridad)
1. **Claude Code:** trae assets de Figma (archivo `Yo9o3ZG2lyaEGcyxoxs89R`) o los genera → `graffiti/public/figma/…` + manifiesto.
2. **Claude Code:** `docs/plans/002-graffiti.md` + `docs/tasks/002-graffiti.md`.
3. **Antigravity:** implementa tareas atómicas (scaffold, lienzo, spray, goteo, paleta, deshacer, exportar, tarjeta en hub).
4. **Claude Code:** revisión y pulido del "feel" (spray, goteo, rendimiento táctil).

### Bloque F — Verificación de lo existente
- Probar QR del Fotomatón en tablet+celular reales con Supabase y corregir URL/base.
- Activar el cron de limpieza (compromiso de privacidad) o documentar borrado manual.
- Arreglar fuga de `setInterval` en `Camara.tsx`.
- Probar el hub completo servido con `npm run build` + `npx serve`.
- Mosaicos: sacar `window.claude`, agregar `fs.allow`, borrar código muerto (opcional).

### Bloque D — Documentación y flujo
- `AGENTS.md`, README raíz, `FIGMA_SYNC.md` reales.

### Después del MVP
Workspaces + `packages/shared`, sacar `dist/` de git, lint/CI, Framer Motion, 15 marcos y Pantalla Flip, Audioreactiva/Jardín, segundo Pixel (ideas: *Sprite Studio* 16×16 animado, *Tarjeta Arcade* con QR, *Pixelador* con el efecto CRT del Fotomatón).

## 8. Flujo de trabajo: Claude Code + Google Antigravity

| | **Claude Code** | **Antigravity** |
|---|---|---|
| Fortaleza | Entiende ideas sueltas, explora el repo, decide arquitectura, **Figma MCP** (diseño, tokens, assets), revisión | Ejecuta bien con **plan y tareas cerradas**, trabajo mecánico y verificación en navegador |
| Rol | Arquitecto / diseño → plan → revisión | Ejecutor / implementación |
| Entrada | Tus ideas en lenguaje natural | Plan + tareas atómicas + `AGENTS.md` |
| Salida | `docs/plans/*.md`, `docs/tasks/*.md`, assets | Commits chicos, uno por tarea |

### Regla de assets (parte de todo plan que va a Antigravity)
Antigravity no tiene Figma conectado ni debe inventar arte. Antes de entregar un plan, **Claude Code**:
1. Identifica los assets que necesita la tarea (SVG, imágenes, iconos, fondos, tokens).
2. Los **trae de Figma** (`get_design_context`, `download_assets`, variables) a `<app>/public/figma/<grupo>/`.
3. Si no existen, los **genera** (SVG a mano o con script, como `loops/scripts/generar-fondos.py`) y los marca `generado: true`.
4. Incluye en el plan un **manifiesto de assets**: nombre, ruta, dimensiones, HEX, uso. Las tareas citan esas rutas exactas.
5. Si el MCP de Figma no conecta (en esta sesión devolvió 403 del proxy), lo declara y entrega assets provisorios generados.

### Ciclo
1. **Idea → plan (Claude).** Explicas libremente; Claude lee repo y Figma, resuelve assets, escribe `docs/plans/NNN-*.md` (contexto, decisión, archivos, assets, aceptación).
2. **Plan → tareas (Claude).** `docs/tasks/NNN-*.md`: tareas atómicas (≤1 archivo o ≤30 min) con ruta, cambio, verificación, "no tocar".
3. **Ejecución (Antigravity).** Marca `[x]` y hace un commit por tarea.
4. **Revisión (Claude).** Lee el diff, corre build, reabre tareas fallidas.

### Plantilla de tarea
```md
## T-007 · Limpiar fuga de intervalo en Cámara
- Archivo: fotomaton/src/components/Camara.tsx (líneas ~19-25)
- Cambio: guardar el id del setInterval en un ref y limpiarlo en el return del useEffect.
- No tocar: useCamara.ts, estilos.
- Verificar: `npm --prefix fotomaton run build` sin errores.
- Aceptación: pulsar "Inicio" durante la cuenta no dispara onFoto.
- [ ] Hecha
```

### Reglas para no pisarse
- Un solo `AGENTS.md` en la raíz (stack, comandos, convenciones, "no tocar sin preguntar"); `CLAUDE.md`/`GEMINI.md` solo apuntan a él. *Verifica qué archivo de reglas lee tu versión de Antigravity.*
- Ramas por herramienta/tarea (`claude/…`, `ag/…`); nunca dos agentes en la misma carpeta.
- **`loops/` es zona del trabajo paralelo:** ningún agente lo edita sin que lo pidas.
- Commits pequeños y convencionales; `git pull` al iniciar, build verde al terminar.
- Antigravity no cambia arquitectura ni dependencias.

## 8b. Instrucciones accionables: dos sets

**Regla de propiedad de archivos (evita conflictos):**
| Zona | Dueño |
|---|---|
| `index.html` (hub), `shared/`, `docs/`, `AGENTS.md`, assets de Figma | **Claude Code** |
| `graffiti/src/**`, `fotomaton/src/**`, `taller-mosaicos/src/**`, READMEs de apps, configs de build de apps | **Gemini/Antigravity** (solo mediante tareas escritas) |
| `loops/**` | **Tú** (nadie más, salvo que lo pidas) |
| `taller-de-pixeles/` | Archivar (Claude, con tu OK) |

**Paso 0 (Claude, aquí):** `git merge origin/main` en `claude/ecstatic-lovelace-xjgq6d`, `npm ci` por app necesaria, y `npm run build` de Fotomatón/Mosaicos/Loops para confirmar un punto de partida verde y comprobar que `loops/dist/` sirve las rutas de assets.

### SET A — Claude Code (se ejecuta en esta sesión)
| # | Tarea | Archivos | Verificación |
|---|---|---|---|
| A1 | Guardar `docs/ESTADO_DEL_HUB.md`, crear `AGENTS.md` (stack, comandos, propiedad de archivos, "no tocar loops/ ni index.html"), `docs/plans/`, `docs/tasks/` | `docs/*`, `AGENTS.md` | Revisión visual del `.md` |
| A2 | **Miniatura de Teatro de Papel con arte real** (2.2): objeto `ASSETS_LOOPS`, precarga, composición canvas, fallback a la versión actual, `prefers-reduced-motion` | `index.html` (solo la función de `cv-loops`) | Servir raíz con `npx serve`, captura Playwright de las 4 miniaturas, comparar con la actual |
| A3 | Hub: miniatura canvas para **Graffiti**, tarjeta bloqueada coherente (Audioreactiva/Jardín), **quitar Píxeles** (con rama `archive/taller-de-pixeles` creada antes, con tu OK) y su script de la raíz | `index.html`, `package.json` | Captura Playwright; ningún enlace roto |
| A4 | Hub: `fullscreenchange`, `prefers-reduced-motion` en el bucle `rAF`, revisar texto "Auto-reset 90s", fuentes autoalojadas (si hay red para descargarlas) | `index.html`, `shared/` | Prueba en viewport tablet (1024×768 y 768×1024) con Playwright |
| A5 | **Assets de Graffiti:** intentar Figma MCP (archivo `Yo9o3ZG2lyaEGcyxoxs89R`; hoy dio 403 de proxy → si sigue fallando, avisarte y generar). Generar SVG propios si faltan: 3 fondos de muro, 4–6 stencils/tags, stickers pixel, iconos de herramientas. Escribir `assets.manifest.md` | `graffiti/public/figma/**`, `docs/plans/002-graffiti/assets.manifest.md` | Abrir cada SVG en navegador; manifiesto coincide con archivos |
| A6 | Verificar el **QR del Fotomatón**: simular despliegue en subruta vs raíz, decidir `VITE_PUBLIC_URL`/`BASE_URL`, documentar la decisión | `fotomaton/` (solo si tú lo autorizas), `docs/` | Prueba con Playwright de `/f/<id>` en modo prueba (IndexedDB) |
| A7 | Escribir `docs/plans/001-limpieza.md` y `002-graffiti.md` + `docs/tasks/001-*.md`, `002-*.md` (Set B) con rutas, valores y manifiesto ya resueltos | `docs/**` | Cada tarea cita archivo, cambio, verificación, "no tocar" |
| A8 | **Revisión final:** leer los diffs de Gemini, correr `build:all`, capturas de todas las experiencias, checklist de la sección 10 | — | Checklist 10 completo |

### SET B — Gemini / Antigravity (se pega este set como instrucciones)
Contexto a entregarle: `AGENTS.md`, `docs/plans/00X`, `docs/tasks/00X` y el manifiesto de assets. **Reglas duras:** no editar `index.html`, `loops/`, `shared/` ni dependencias; un commit por tarea con mensaje `tipo(app): …`; correr el build indicado antes de marcar `[x]`; si algo bloquea, escribir el bloqueo en la tarea y detenerse.

**Plan 001 — Limpieza (independiente de Graffiti, puede ir en paralelo):**
| # | Tarea | Archivo(s) | Verificación |
|---|---|---|---|
| B1 | Limpiar el `setInterval` de la cuenta regresiva al desmontar | `fotomaton/src/components/Camara.tsx:19-25` | `npm --prefix fotomaton run build`; "Inicio" durante la cuenta no dispara `onFoto` |
| B2 | Quitar `window.claude.use('downloads')` y dejar solo `<a download>` | `taller-mosaicos/src/lib/exportar.ts:39-42` | build de mosaicos; exportar PNG descarga |
| B3 | Borrar código muerto: `construirSVG`, `COLORES`, `MAX_COLORES`, `usaA/usaB` y el import sin uso | `taller-mosaicos/src/**` | `tsc --noEmit` sin errores |
| B4 | Agregar `server.fs.allow: ['..']` | `taller-mosaicos/vite.config.ts` | `npm --prefix taller-mosaicos run dev` carga estilos de `shared/` |
| B5 | Reescribir READMEs reales (raíz con Graffiti y `build:all`; mosaicos sin funciones inexistentes) | `README.md`, `taller-mosaicos/README.md` | Cada afirmación se contrasta con el código |
| B6 | Corregir `FIGMA_SYNC.md` a la estructura real (sin `figma-tokens.ts` inexistente) | `FIGMA_SYNC.md` | Rutas citadas existen |
| B7 | *(Condicional a tu decisión)* Unificar TypeScript en una sola versión | `*/package.json` | build de las 4 apps |

**Plan 002 — Graffiti (depende de A5 y A7):**
| # | Tarea | Resultado | Verificación |
|---|---|---|---|
| B10 | Scaffold `graffiti/` copiando configs de `taller-mosaicos/` (`package.json`, `tsconfig`, `vite.config.ts` con `base:'./'` y `fs.allow`), `index.html` con `data-visual="Pixel"`, importando `shared/somos-ui.css`; scripts `dev:graffiti`/`build:graffiti` en la raíz | App vacía que compila | `npm --prefix graffiti run build` |
| B11 | Lienzo cuadrado 60×60 con fondo de muro (assets del manifiesto), grilla pixel y pointer events táctiles | Se ve el muro y la cuadrícula | Prueba manual en viewport tablet |
| B12 | Spray: trazo grueso por celdas, paleta de 4–6 colores, tamaño de boquilla | Se pinta con el dedo/mouse | Prueba manual |
| B13 | **Goteo:** en trazos densos nacen gotas que bajan con gravedad y se detienen; animado con `rAF`, limitado a N gotas | Chorreos visibles sin caer de fps | Prueba manual en tablet; sin saltos |
| B14 | Borrador y deshacer (pila ≥ 30) | Funcionan y no corrompen el lienzo | Prueba manual |
| B15 | Stencils/stickers del manifiesto como herramienta de estampado | Se estampan y se pueden deshacer | Prueba manual |
| B16 | Exportar tarjeta PNG 1080×1350 con pie común y botón "volver" (`href="../../"` como las demás) | Descarga PNG correcto | Abrir el PNG |
| B17 | `graffiti/README.md` y checklist de la sección 10 aplicado a Graffiti | Documentado | — |

**Después de B17, vuelve Claude (A3 final):** activar la tarjeta de Graffiti en el hub (`href="graffiti/dist/"`) y mostrar su miniatura; luego A8.

### Orden recomendado
1. Paso 0 → A1 → (A2 ∥ A3 ∥ A4) en Claude, **mientras** Gemini hace Plan 001 completo.
2. A5 → A7 → Gemini inicia Plan 002.
3. A6 en cualquier momento (no bloquea).
4. A8 al terminar cada plan.

## 9. Decisiones abiertas
1. Alcance exacto de Graffiti (herramientas, stencils, exportación).
2. Despliegue: un dominio con todo vs. Fotomatón aparte (condiciona el QR).
3. ~~¿TypeScript 5.9 o 7?~~ **Decidido: 7.0.2 en todas las apps** (pendiente: `taller-mosaicos` y, cuando su responsable lo decida, `loops`).
4. ~~¿Se retoma `credencial/`?~~ **Sí, en el celular (plan 003).** ¿Qué Pixel entra después de Graffiti?
5. Quién administra Supabase y sus claves.

## 9b. Sugerencias opcionales (NO forman parte del plan)

**Fotomatón**
- Sonido de obturador y botón "repetir foto" antes del editor.
- Previsualizar los 3 lenguajes en miniatura con la foto real.
- Modo evento con sesión que se autolimpia a los 60 s.

**Taller de Mosaicos**
- Deshacer/rehacer y plantillas de inicio.
- Vista de patrón embaldosado (tile preview).
- Compartir por QR como el Fotomatón; "Multiplicar" operable con teclado.

**Transversales**
- Sello común en las tarjetas exportadas (pie, QR al hub, fecha) desde `shared`.
- Analítica local mínima de uso por experiencia.
- Atajo oculto de mantención en el hub (limpiar datos, versión, reset).
- Capturas automáticas con Playwright de cada experiencia.

## 10. Checklist de calidad antes de mostrar el MVP
- [ ] `npm run build` raíz verde
- [ ] Hub → cada experiencia → "volver" funciona en el despliegue real
- [ ] Miniaturas del hub consistentes entre sí (sobre todo Teatro de Papel)
- [ ] Probado en la tablet objetivo, vertical y horizontal
- [ ] Sin internet: fuentes y modelo de cara cargan
- [ ] QR del Fotomatón probado con un celular real
- [ ] Graffiti: pintar, deshacer, exportar, volver
- [ ] README de cada app coincide con el código
