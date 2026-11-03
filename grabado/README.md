# Taller de Grabado · Orgánica (a comparar con Telar)

Estampas figuras Orgánicas sobre papel, como con un taco de madera o linóleo.
- **Tacos:** son las 8 figuras de Teatro de Papel. Hay 8 tintas, 4 papeles, 3 tamaños y giro de 90°.
- **Cada impresión sale distinta**, con su propia semilla:
  - presión despareja, poros sin tinta y vetas de madera;
  - un giro leve hecho a mano;
  - las tintas **se mezclan donde se cruzan** (multiplicar).
- Botones: deshacer, limpiar (con doble toque) y descargar la tarjeta 1080 × 1350.
- **HUB:** las estampas van a los muros de la plaza. Hoy es un resumen en `localStorage` (`sd:grabado`); falta Supabase.

Código: `src/lib/grabado.ts` (taco, textura y papel) y `src/lib/comun.ts` (igual en `telar/`).

```bash
npm --prefix grabado install && npm --prefix grabado run dev
```
