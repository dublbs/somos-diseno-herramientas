# AGENTS.md · Reglas para agentes (Claude Code, Gemini/Antigravity)

Fuente de verdad para cualquier agente que trabaje en este repo. `CLAUDE.md` y `GEMINI.md` (si existen) solo deben apuntar aquí.
Contexto completo del proyecto: [`docs/ESTADO_DEL_HUB.md`](docs/ESTADO_DEL_HUB.md).

## Qué es
Hub de experiencias interactivas de Somos Diseño para tablet/quiosco. `index.html` (raíz) es el hub; cada experiencia es una app Vite independiente con su propio `package.json`.

| Carpeta | Experiencia | Lenguaje |
|---|---|---|
| `index.html` + `shared/` | Hub y estilos compartidos | — |
| `fotomaton/` | Fotomatón CMYK | los tres |
| `taller-mosaicos/` | Taller de Mosaicos | Geométrica |
| `loops/` | Teatro de Papel | Orgánica |
| `graffiti/` | Graffiti y Tags (en construcción) | Pixel |
| `taller-de-pixeles/` | **Descartado**, pendiente de archivar | Pixel |

## Stack (no cambiar sin pedirlo)
React 18.3.1 · TypeScript · Vite 8.3.5 · `@vitejs/plugin-react` 6.1.2 · CSS plano (`shared/somos-ui.css`) · canvas con `requestAnimationFrame`. Sin librerías nuevas ni dependencias nuevas sin aprobación.

## Comandos
```bash
npm run build            # compila fotomaton, mosaicos, pixeles y loops
npm run dev:hub          # sirve la raíz en :8080 (requiere build previo: el hub enlaza a <app>/dist/)
npm --prefix <app> run dev      # desarrollo de una app
npm --prefix <app> run build    # tsc --noEmit && vite build
```

## Propiedad de archivos (evita conflictos)
| Zona | Dueño |
|---|---|
| `index.html`, `shared/`, `docs/`, `AGENTS.md`, assets de Figma | Claude Code |
| `graffiti/src/**`, `fotomaton/src/**`, `taller-mosaicos/src/**`, READMEs y configs de build de las apps | Gemini/Antigravity, **solo mediante tareas escritas** en `docs/tasks/` |
| `loops/**` | La persona del equipo que lo trabaja en paralelo. **Ningún agente lo edita sin que se pida expresamente.** |
| `taller-de-pixeles/` | No tocar (se archivará) |

## Reglas de trabajo
- Un commit por tarea, mensajes convencionales: `tipo(app): descripción` (`feat`, `fix`, `docs`, `refactor`).
- Antes de marcar una tarea `[x]`, correr la verificación que indica (normalmente `npm --prefix <app> run build`).
- Si algo bloquea o la tarea es ambigua, escribir el bloqueo en la propia tarea y detenerse. No improvisar arquitectura.
- No inventar arte: los assets vienen de Figma o los genera Claude Code y están en `<app>/public/figma/` con un manifiesto en el plan.
- No commitear `.env`, claves de Supabase ni `node_modules`. No reescribir historia.
- `git pull` antes de empezar; build verde al terminar.
- Respetar `prefers-reduced-motion` y mantener objetivos táctiles de al menos 56 px (la audiencia usa tablet).

## Flujo
1. **Claude Code**: idea → plan (`docs/plans/NNN-*.md`) → tareas atómicas (`docs/tasks/NNN-*.md`) con assets resueltos.
2. **Gemini/Antigravity**: ejecuta tareas en orden, un commit por tarea.
3. **Claude Code**: revisa el diff, corre builds, reabre tareas fallidas.

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
- Paleta oficial "Línea azul": Hueso `#F4EEE3`, Negro `#000000`, Azul `#0062B8`, Lapislázuli `#2B4BD8`, Celeste `#7FC8F8`, Amarillo `#FFC20E`, Verde `#00A651`, Rosa `#FF8FB1`, Morado `#7A2E8E`.
- Enlace "volver" al hub: `href="../../"` (las apps se sirven como `<hub>/<app>/dist/`).
- Tarjetas exportadas: 1080×1350 con pie común.
