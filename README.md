# Experiencias Interactivas · Somos Diseño

Mini-juegos, estaciones y herramientas interactivas pensadas para **Tablet y Desktop** durante la Semana del Diseño (INACAP Sede Santiago Centro).

---

## 🎯 Arquitectura de Experiencias

A diferencia de la carpeta **`Evento`** (pensada como una PWA móvil para el celular del asistente con escaneo de sellos por cámara), **`Experiencias`** alberga los proyectos que corren en las estaciones fijas, tablets táctiles en mesas y computadores de trabajo:

| Carpeta | Experiencia | Plataforma | Hardware / Requisitos |
| --- | --- | --- | --- |
| [`fotomaton/`](fotomaton/) | **Fotomatón CMYK** (Mesa 3) | Tablet / Desktop | Cámara web/tablet + Detección facial IA local + QR de descarga |
| [`taller-mosaicos/`](taller-mosaicos/) | **Taller de Mosaicos** | Tablet / Desktop | Pantalla táctil o ratón, celda 12×12, exportación a Figma (SVG/PNG) |
| [`taller-de-pixeles/`](taller-de-pixeles/) | **Taller de Píxeles** | Tablet / Desktop | Cuantizador de fotos a 24×24 con Línea azul y pixel art libre |

---

## 🖥️ Hub Principal (`index.html`)

El archivo [`index.html`](index.html) en esta carpeta es el **Hub central** que unifica el acceso a las tres experiencias.
- Permite a los visitantes o anfitriones de cada mesa lanzar la experiencia correspondiente con un solo toque o clic.
- Incluye **Modo Quiosco / Pantalla Completa** (botón `⛶ Pantalla Completa`) ideal para tablets y monitores en exhibición.
- Incluye botón de retorno al Hub en cada experiencia interactiva.

---

## 🚀 Cómo Ejecutar en Local

### Opción 1: Servir la carpeta de Experiencias completa
Puedes levantar un servidor estático rápido desde esta carpeta:
```bash
npx serve .
# O con Python:
python3 -m http.server 8080
```
Y abrir `http://localhost:8080` para acceder al Hub y a cualquiera de las 3 herramientas.

### Opción 2: Modo Desarrollo individual

1. **Fotomatón CMYK**:
   ```bash
   cd fotomaton
   npm install
   npm run dev          # http://localhost:5173
   npm run dev:tablet   # HTTPS para probar en tablet por la red WiFi
   ```

2. **Taller de Mosaicos**:
   ```bash
   cd taller-mosaicos
   npm install
   npm run dev
   ```

3. **Taller de Píxeles**:
   - Es un único archivo HTML autocontenido con cero dependencias. Se abre directo en el navegador abriendo `taller-de-pixeles/index.html`.
