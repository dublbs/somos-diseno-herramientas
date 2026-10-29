# Telar · Orgánica (a comparar con Taller de Grabado)

Tejes una faja como la **FA02 · Faja tejida a telar** de Figma.
- **Motivos:** eliges hasta 3 figuras Orgánicas (las mismas de Teatro de Papel), que se vuelven los motivos centrales. Las partes oscuras de cada figura van con el hilo de figura y las claras con el de detalle.
- **Colores:** eliges el fondo y los dos hilos.
- **Tejido:** la faja se teje pasada por pasada, con la lanzadera amarilla, en una grilla de 36 × 72 hilos. Lleva bandas en zigzag como la k'isa y orillas de listas.
- **Exportar:** tarjeta 1080 × 1350 con la faja de pie, sus flecos y la franja negra común.
- **HUB:** la faja se cuelga en la plaza. Hoy son fajas de prueba; la última queda en `localStorage` (`sd:telar`) hasta pasarla por Supabase.

Código: `src/lib/faja.ts` (componer y tejer) y `src/lib/comun.ts`. Ese archivo es igual en `grabado/` y tiene las figuras, la paleta, la tarjeta y la descarga.

```bash
npm --prefix telar install && npm --prefix telar run dev
```
