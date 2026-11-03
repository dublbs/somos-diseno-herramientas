# Estación Audioreactiva · Geométrica

El sonido deforma la red de celdas de Geométrica. Usa los movimientos de **Geométrica · Motion** de Figma (sección `664:273897`): «una sola red de celdas que se deforma: se inclina, se curva, se desplaza, gira o se refleja», a 25 cuadros por segundo.

| Escena | Movimientos de Figma | Qué hace el sonido |
|---|---|---|
| Túnel | M3 Túnel que se abre · C3 Túnel → estallido | El volumen lo abre; los graves lo redondean (estallido) y lo hacen latir; el tono lo gira |
| Acordeón | M5 Acordeón · M4 Acordeón que corre | Cada lista es una banda del sonido (de graves a agudos); cada golpe hace correr las listas |
| Caleidoscopio | C5 Caleidoscopio de rombos · C4 | El tono lo gira, el volumen lo acerca; cada golpe cambia la simetría: 4, 6 u 8 gajos |
| Tejido | C10 Puntos → cruces → tejido · C8 · C6 | Los agudos pasan de puntos a cruces y luego a tejido; el tono hace correr el color; cada golpe gira las celdas |

- **Sonido** (`src/audio/oido.ts`, solo Web Audio):
  - Escucha el micrófono, o una música de demo sintetizada (bombo, caja, platillo y bajo) para cuando no hay micrófono.
  - Lo resume en volumen, graves, medios, agudos, tono (centroide espectral), golpes y 12 bandas.
- **Portada:** antes de pedir el micrófono, explica la estación en 3 pasos.
- **Exportar:** se graba un loop de 6 s (MP4 o WebM según el navegador) o se descarga un PNG.
- **HUB:** la última escena queda en `localStorage` (`sd:audioreactiva`) para la pantalla del mezanine. Falta pasarla por Supabase.
- **Después:** reaccionar a notas musicales (afinación), no solo a energía y tono.

```bash
npm --prefix audioreactiva install
npm --prefix audioreactiva run dev
npm --prefix audioreactiva run build
```
El micrófono necesita el sitio publicado (https). En la vista previa de claude.ai está bloqueado: ahí se usa la música de demo.
