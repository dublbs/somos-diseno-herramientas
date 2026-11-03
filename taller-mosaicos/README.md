# Taller de Mosaicos · Somos Diseño (lenguaje Geométrica)

Componer símbolos y patrones sobre una grilla de celdas y descargarlos como imagen.

## Qué tiene
- **Pestaña Dibujar**: herramientas Poner, Girar, Reflejar, Borrar y Multiplicar; 18 formas sobre una celda de 12 × 12; Girar/Reflejar la forma elegida (tecla R para girar). Con Multiplicar se elige un área en el lienzo y se aplica Repetir, Escalonar, Reflejar →/↓, Simetría 4, Girar 90° o Borrar área.
- **Pestaña Color**: 8 paletas Línea azul, Invertir fondo/figura y «Aplicar a todo el diseño».
- **Pestaña Formato**: Cuadrado 1:1, Flyer 4:5, Historia 9:16, Horizontal 16:9, Módulo 4 × 4 y 2 × 2; grilla on/off.
- **Pie fijo**: Descargar imagen (PNG), Sorpréndeme (mosaico simétrico al azar) y Limpiar (doble toque).
- El diseño se guarda en `localStorage` (`geo:estado`).

## Archivos
- `src/App.tsx`: estado y operaciones de edición.
- `src/components/Lienzo.tsx`: canvas, selección, teclado y vista previa.
- `src/components/Panel.tsx`: pestañas y controles.
- `src/data/formas.ts`: formas, paletas (`HEX`) y formatos.
- `src/lib/exportar.ts`, `src/lib/almacen.ts`.

## Correr
```bash
npm --prefix taller-mosaicos install
npm --prefix taller-mosaicos run dev
npm --prefix taller-mosaicos run build   # → taller-mosaicos/dist (lo enlaza el hub)
```
