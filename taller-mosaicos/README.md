# Taller de mosaicos · Somos Diseño

Herramienta del equipo para crear mosaicos desde cero con el sistema Geométrica: "todo sale de la celda".

## Cómo se usa

1. **Elige una forma base** del pool y sus colores (fondo de la celda, figura y, en algunas, detalle).
2. **Ponla en la grilla.** Cada forma se puede girar en pasos de 90° y reflejar, en el pincel o directo en el lienzo con las herramientas Girar y Reflejar.
3. **Arma tu figura** combinando celdas, por ejemplo en el formato Figura 4 × 4.
4. **Multiplícala** con la herramienta Seleccionar y las operaciones del sistema: Repetir, Escalonar, Reflejar →, Reflejar ↓, Reflejar en 4 y Girar 90°.
5. **Guárdala** con «Guardar como figura»: queda en «Mis figuras» para estamparla completa en otros mosaicos.
6. **Exporta** en PNG o SVG. El SVG trae los grupos Fondo y Figura, como los componentes del archivo, y cada forma es vectorial.

## Formas base

Celda vacía, celda llena, media celda, mitad, damero, listas k'isa, greca, escalón, punta, cuarto de círculo, cuarto de anillo, medio círculo, marco, inclinado, rombo, barra con muesca, cruz escalonada y punto. Cada una indica la familia y la operación de la que sale. Están en `src/formas.js` como trazos SVG sobre una celda de 12 × 12 unidades; para sumar una forma basta con agregarla a esa lista.

## Reglas del sistema

- Grilla de celdas: 135 px en post y cuadrado (8 columnas en 1080), 120 px en el resto.
- Regla 3: el contador avisa cuando la pieza pasa de 4 colores (un fondo y tres de figura).
- Solo paleta Línea azul. El rojo INACAP queda fuera porque es exclusivo del logo.

## Desarrollo

```bash
npm install
npm run dev     # desarrollo
npm run build   # dist/index.html, un solo archivo autocontenido
```

El estado del lienzo y «Mis figuras» se guardan en el navegador (localStorage).
