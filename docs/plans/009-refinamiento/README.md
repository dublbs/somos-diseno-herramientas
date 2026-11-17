# 009 · Refinamiento: auditoría de todas las experiencias y propuestas

Fecha: 13 nov 2026 · Autor: Claude Code (pedido de Amaro) · Estado: **propuestas, falta decidir** · Base: rama
`amaro/llevatela-qr` (cacería, timbres finales, Graffiti v2, Fotomatón «como el resto», Hora punta con 3 niveles,
jugar sin credencial y «Llévatela» con QR).

Dirección (plan 009 §3): **cada experiencia hace el símil de un software de diseño.** Esta auditoría dice qué tan cerca
está cada una, qué falla hoy y qué se propone, separado en **funcionalidad**, **experiencia** y **UI**.

## Método
- **Medición automática** (Playwright, modo demo) en las 6 resoluciones de tablet (1024 × 768, 1180 × 820, 1280 × 720,
  1366 × 768, 768 × 1024, 820 × 1180), **con cada herramienta activa**:
  - scroll de página;
  - controles fuera de vista;
  - paneles con scroll;
  - textos cortados;
  - toques de menos de 44 px;
  - errores de consola.
- **Revisión visual** de cada pantalla a 1180 × 820 y en vertical, y lectura del código de exportar, modo juego e
  inventario.
- **No cubre:**
  - el micrófono y la cámara reales (en la prueba son falsos);
  - Supabase real;
  - el rendimiento en las tablets reales;
  - el PC madre (pide inicio de sesión del staff).

## Resultado general
- **Ninguna experiencia tiene scroll ni controles fuera de vista**, en ninguna resolución ni con ninguna herramienta
  activa. Tampoco hay errores de consola.
- **Lo que falla se repite en varias:**
  - toques bajo 44 px;
  - la ayuda de la barra superior queda cortada;
  - el botón de exportar no se llama igual en todas;
  - estados vacíos sin guía;
  - y en Grabado, botones que se montan y cortan su texto.

| Experiencia | Software que imita | Qué tan cerca | Hallazgos graves | Ficha |
|---|---|---|---|---|
| Graffiti y Tags | Pinceles de Illustrator / Photoshop | Alta | 0 | [graffiti.md](graffiti.md) |
| Taller de Mosaicos | Muestras de patrón de Illustrator | Alta | 1 (toques de 29–36 px) | [mosaicos.md](mosaicos.md) |
| Taller de Grabado | Capas (Photoshop / Procreate) | Baja: **no tiene capas** | 2 | [grabado.md](grabado.md) |
| Estación Audioreactiva | Consola de VJ (TouchDesigner / Resolume) | Alta en la UI, a medir en la reacción | 1 (texto que se sale) | [audioreactiva.md](audioreactiva.md) |
| Fotomatón CMYK | Canales y semitono de Photoshop | Alta | 1 (disparador sin nombre) | [fotomaton.md](fotomaton.md) |
| Hora punta | — (juego) | — | 0 | [hora-punta.md](hora-punta.md) |
| Teatro de Papel | After Effects (keyframes) | Alta | ver plan 008 (Pipe) | [teatro.md](teatro.md) |
| Hub, HUB Estación, credencial y PC madre | — | — | 1 (el hub enlaza al Vagón) | [hub-y-soporte.md](hub-y-soporte.md) |

## Transversales (afectan a varias)
| # | Gravedad | Hallazgo | Dónde | Propuesta |
|---|---|---|---|---|
| X1 | **Alta** | Toques bajo 44 px (regla de `AGENTS.md`) | Mosaicos: módulos de 36 px (29 px en 768 × 1024). Graffiti: colores de 40 px en 1024 × 768. Teatro: reproducir de 32 × 48 | Agrandar a 44–48 px. En Mosaicos sobra espacio en el panel (ver ficha) |
| X2 | Media | La **ayuda de la barra superior se corta** con «…». Es la instrucción principal | Graffiti (1180 × 820), Teatro (1180 × 820 y 1280 × 720) | Ayuda corta (≤ 40 caracteres) en la barra; el resto en el panel derecho, donde Graffiti ya la repite |
| X3 | Media | El botón de exportar se llama distinto en cada una: «Llévate tu muro», «Llévatelo», «Grabar 6 s» y «PNG», «Llévate tu tarjeta», «Llévatela», «Tarjeta» y «Grabar loop» | Todas | Mismo ícono (`ios_share`), mismo lugar (arriba a la derecha) y el verbo **«Llévatelo»**. Abre «Llévatela» (plan 011) |
| X4 | Media | **Estado vacío sin guía:** papel o muro en blanco, sin decir qué hacer | Grabado, Graffiti | Pista fantasma sobre el lienzo («Toca el papel para estampar») que se va con el primer toque |
| X5 | Baja | Botones solo con ícono, sin texto | Fotomatón (barra inferior), Grabado (girar el taco) | Texto corto bajo el ícono, como en las barras de herramientas |
| X6 | Propuesta | Lo que se crea en las mesas no vuelve a la **pantalla del HUB**, salvo mosaicos y grabados | HUB Estación | Murales de Hora punta en los paneles MetroArte; muros de Graffiti en las cortinas de la boletería (ver ficha del hub) |
| X7 | Propuesta | En la mesa, sin credencial no hay cómo crear una (plan 011) | `shared/ui/Juego.tsx` | QR a la credencial en la pantalla «Escribe el código de tu credencial»: la persona la crea ahí mismo con su celular |

## Prioridad sugerida (para decidir)
1. **Antes del 17 nov (arreglos, sin decisión de diseño):**
   - X1, X2 y X3;
   - Grabado G1 (texto cortado) y G2 (tacos que casi no se ven);
   - Audioreactiva A1 (texto que se sale);
   - Fotomatón F1 (disparador sin nombre).

   Medio día de un agente, en una rama.
2. **Tareas ya planeadas** (`docs/tasks/009-pendientes.md`):
   - T3, Grabado con capas: es lo que más lo aleja del software que imita;
   - T4, Audioreactiva medida con micrófono;
   - T2, el hub sin Vagón y con Hora punta.
3. **Si hay tiempo** (propuestas que suman, para decidir una por una):
   - X4 y X7;
   - Mosaicos M4 (vista de patrón);
   - Graffiti P2 (opacidad) y P3 (tag con letras);
   - Hora punta H2 (sonido);
   - HUB X6.
