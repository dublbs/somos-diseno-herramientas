# Sincronización Figma ↔ Somos Diseño

Este documento documenta la conexión con el archivo maestro de Figma para el Hub y las experiencias interactivas de **Somos Diseño 2026**.

## Archivo Maestro en Figma

* **URL del Archivo:** [Figma: SomosDiseño](https://www.figma.com/design/Yo9o3ZG2lyaEGcyxoxs89R/SomosDise%C3%B1o)
* **File Key:** `Yo9o3ZG2lyaEGcyxoxs89R`
* **Nodo de referencia / Animaciones C2:** `449:85171` (`Geométrica / C2 · Damero → zigzag → acordeón`)
* **Página de Evento / Piezas:** `0:1` (`Evento · Posts y piezas`)

---

## Capacidades MCP Activas (`figma-dev-mode-mcp-server`)

Tanto en **Antigravity** como en **Claude Code**, el servidor MCP local se conecta al puerto `3845` de Figma Desktop (con Dev Mode abierto en el archivo):

| Herramienta MCP | Propósito | Ejemplo de Parámetro |
| :--- | :--- | :--- |
| `get_metadata` | Inspeccionar árbol de capas de una sección | `{ "nodeId": "449:85171" }` |
| `get_design_context` | Obtener código React/CSS, SVG y screenshot | `{ "nodeId": "449:85171", "clientFrameworks": "react" }` |
| `get_variable_defs` | Obtener variables y tokens de color | `{ "nodeId": "449:85171" }` |
| `get_screenshot` | Obtener la captura visual de referencia | `{ "nodeId": "449:85171" }` |

---

## Estructura de Assets Locales

Los assets extraídos de Figma se ubican en:

```
Experiencias/
├── public/assets/figma/
│   ├── marcos/        # Marcos para Fotomatón (1080x1350)
│   ├── simbolos/      # Glifos y figuras de Geométrica (12x12)
│   ├── sprites/       # Sprites y patrones de Pixel
│   └── texturas/      # Recortes de papel y botánica de Orgánica
└── src/data/figma-tokens.ts # Variables de color, tipografía y grid
```

---

## Variables de Color Oficiales (Línea Azul)

```typescript
export const FIGMA_TOKENS = {
  colores: {
    Hueso: "#F4EEE3",
    Blanco: "#FFFFFF",
    Negro: "#000000",
    Azul: "#0062B8",
    Lapislázuli: "#2B4BD8",
    Celeste: "#7FC8F8",
    Amarillo: "#FFC20E",
    Verde: "#00A651",
    Rosa: "#FF8FB1",
    Morado: "#7A2E8E",
  },
  fuentes: {
    display: "'Silkscreen', 'DM Sans', sans-serif",
    cuerpo: "'DM Sans', sans-serif",
    mono: "'IBM Plex Mono', monospace",
  }
};
```
