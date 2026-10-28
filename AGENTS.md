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

Taller de Píxeles (descartado) vive solo en la rama `archive/taller-de-pixeles`.

## Stack (no cambiar sin pedirlo)
React 18.3.1 · **TypeScript 7.0.2** · Vite 8.3.5 · `@vitejs/plugin-react` 6.1.2 · CSS plano · canvas con `requestAnimationFrame`. Sin librerías ni dependencias nuevas sin aprobación. Nada por CDN: fuentes en `shared/somos-fonts.css`, íconos en `shared/somos-icons.css` (subconjunto de Material Symbols; ver `shared/fonts/README.md` para sumar íconos).

## Comandos
```bash
npm run build                   # compila las 4 apps (fotomaton, mosaicos, loops, graffiti)
npm run dev:hub                 # sirve la raíz en :8080 (requiere build previo: el hub enlaza a <app>/dist/)
npm --prefix <app> run dev      # desarrollo de una app
npm --prefix <app> run build    # tsc --noEmit && vite build
```
`dist/` está versionado porque el hub enlaza a él: reconstruye la app que toques antes de hacer commit.

## Regla de pantalla: todo cabe sin scroll
Toda experiencia usa el sistema de `shared/somos-ui.css` (desde 600 × 560 px no hay scroll de página; en teléfono sí):
```html
<div class="app-pantalla">
  <header class="barra-superior">… <a class="volver" href="../../">…</a> <div class="barra-info"><h1/></div></header>
  <main class="cuerpo-pantalla">
    <section class="escenario-fit"><div class="lienzo-fit" style="--ratio:1">canvas</div></section>
    <aside class="panel-app">
      <div class="pestanas" role="tablist">…</div>
      <div class="panel-pagina" role="tabpanel">…</div>
      <div class="panel-pie">acciones principales</div>
    </aside>
  </main>
</div>
```
- El lienzo se mide por alto (`.lienzo-fit` con container queries); no uses `vh` fijos ni `max-height` calculados a mano.
- Si los controles no caben, se reparten en **pestañas**; nunca scroll interno en el panel.
- En vertical el panel va abajo (alto con `--alto-panel` en `.app-pantalla`).
- Verificación: ninguna resolución de tablet (1024×768, 1180×820, 1280×720, 1366×768, 768×1024, 820×1180) puede tener scroll de página, controles fuera de vista ni panel con scroll.

## Propiedad de archivos
| Zona | Dueño |
|---|---|
| `index.html`, `shared/`, `docs/`, `AGENTS.md`, assets de Figma | Claude Code |
| `fotomaton/`, `taller-mosaicos/`, `graffiti/` | Claude Code; Antigravity solo mediante tareas escritas en `docs/tasks/` |
| `loops/` | La persona del equipo que lo trabaja; los agentes lo editan **solo cuando se pide** |

## Reglas de trabajo
- Un commit por tarea, mensajes convencionales: `tipo(app): descripción` (`feat`, `fix`, `docs`, `refactor`, `chore`).
- Antes de terminar: `npm --prefix <app> run build` verde.
- Si algo bloquea o la tarea es ambigua, escribir el bloqueo en la tarea y detenerse. No improvisar arquitectura.
- No inventar arte: los assets vienen de Figma (Claude Code tiene el MCP) o se generan con un script, y quedan en `<app>/public/figma/` con un manifiesto (ej. `docs/plans/002-graffiti/assets.manifest.md`).
- No commitear `.env`, claves de Supabase ni `node_modules`. No reescribir historia.
- Respetar `prefers-reduced-motion` y objetivos táctiles de al menos 44–48 px.

## Flujo con dos herramientas (opcional)
Hoy Claude Code ejecuta de punta a punta. Si se reparte trabajo con Antigravity:
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
