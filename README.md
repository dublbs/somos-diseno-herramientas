# Experiencias Interactivas · Somos Diseño

Estaciones interactivas para **tablet (horizontal) y pantallas del stand** durante la Semana del Diseño (INACAP Sede Santiago Centro). El hub (`index.html`) lleva a cuatro experiencias; cada una es una app **React 18 + TypeScript 7 + Vite 8**.

| Carpeta | Experiencia | Lenguaje | Qué hace |
|---|---|---|---|
| [`fotomaton/`](fotomaton/) | Fotomatón CMYK | los tres | Foto con la cámara → efecto (trama CMYK, CRT o mosaico) → marco → tarjeta y QR para el celular |
| [`taller-mosaicos/`](taller-mosaicos/) | Taller de Mosaicos | Geométrica | Componer patrones en una grilla con formas, paletas y simetrías; exporta PNG |
| [`loops/`](loops/) | Teatro de Papel | Orgánica | Escena de papel recortado con piezas animadas en loop; exporta video o PNG |
| [`graffiti/`](graffiti/) | Graffiti y Tags | Pixel | Spray sobre un muro pixel con goteo, muros y stickers; exporta PNG |

`taller-de-pixeles/` está **descartado**: no aparece en el hub ni en los scripts. Estación Audioreactiva y Jardín de Papel figuran como «Próximamente».

## Correr
```bash
npm run build      # compila las 4 apps (el hub enlaza a <app>/dist/)
npm run dev:hub    # sirve la raíz en http://localhost:8080
```
Para trabajar en una experiencia: `npm --prefix <carpeta> install` y luego `npm run dev:<fotomaton|mosaicos|loops|graffiti>` (o `…:tablet` para abrirla desde la tablet por la red).

## Pantalla fija (sin scroll)
Desde 600 × 560 px todas las experiencias ocupan exactamente el alto de la pantalla: barra superior, escenario que se ajusta por alto y panel con **pestañas** y acciones fijas al pie. En vertical el panel pasa abajo; en teléfono la página hace scroll. El sistema está en [`shared/somos-ui.css`](shared/somos-ui.css) (`.app-pantalla`, `.cuerpo-pantalla`, `.escenario-fit`, `.lienzo-fit`, `.panel-app`, `.pestanas`, `.panel-pagina`, `.panel-pie`). Fuentes e íconos son locales (`shared/somos-fonts.css`, `shared/somos-icons.css`), así que todo funciona sin internet.

## Más
- Estado, diagnóstico y plan: [`docs/ESTADO_DEL_HUB.md`](docs/ESTADO_DEL_HUB.md)
- Reglas para agentes (Claude Code, Antigravity): [`AGENTS.md`](AGENTS.md)
- Figma ↔ código: [`FIGMA_SYNC.md`](FIGMA_SYNC.md)
