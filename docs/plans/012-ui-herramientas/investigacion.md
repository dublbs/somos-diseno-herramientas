# 012 · Investigación: la interfaz de las herramientas de diseño (Figma y Affinity)

Fecha: 17 nov 2026 · Autor: Claude Code (pedido de Amaro) · Sirve de base al plan [`012`](../012-ui-de-herramienta-y-ronda-2.md).

**Cómo leerla.** «Fuente» = lo dice una fuente citada al final. «Conocimiento» = lo sé del uso de la herramienta, sin
fuente abierta en esta sesión: verificar con una captura antes de copiar un detalle fino. No se revisaron las apps en
vivo (desde aquí no se pueden abrir).

## 1. Figma (UI3, 2024–2025)
| Zona | Qué hace | Origen |
|---|---|---|
| **Barra de herramientas flotante, abajo al centro** | Pasó de arriba a abajo en UI3 para liberar lienzo. Pocas herramientas, agrupadas, con la activa destacada. Hubo quejas: ocupa alto y se pierde sobre fondos oscuros | Fuente |
| **Panel izquierdo: Archivo** | Páginas y **Capas** juntas; pestaña **Assets** (biblioteca de componentes). Ojo y candado **solo al pasar el mouse** | Fuente |
| **Panel derecho: Propiedades** | Cambia según lo seleccionado. Secciones apiladas (posición, apariencia, relleno, trazo, efectos), con una fila de acciones de la selección arriba. Tiene scroll propio | Fuente |
| **Minimizar UI** | Esconde los dos paneles y deja el lienzo; al seleccionar algo, las propiedades vuelven solas | Fuente |
| **Paneles** | En la beta flotaban; la versión final volvió a paneles fijos a los lados, redimensionables | Fuente (con reportes cruzados) |
| **Figma Draw** | Lápiz y pincel con una **barra secundaria** para color, tamaño y estilo del trazo | Fuente |
| Controles | Campos numéricos que se arrastran para cambiar el valor, muestras de color cuadradas, segmentados con íconos, secciones con «+» para agregar | Conocimiento |
| Estética | Cromo neutro (blanco o gris oscuro), un solo color de acento (azul) para lo activo y lo seleccionado, texto de 11–12 px, íconos de línea | Conocimiento |

## 2. Affinity (Designer 2 para iPad y la app unificada de 2025)
| Zona | Qué hace | Origen |
|---|---|---|
| **Barra de contexto, abajo** | Muestra las opciones **de la herramienta activa** (ancho, opacidad, modo). Cambia entera al cambiar de herramienta | Fuente |
| **Herramientas** | Columna a un lado; el set cambia con el «persona» o estudio | Fuente (posición: conocimiento, a la izquierda) |
| **Estudios** (Capas, Color, Trazo, Pinceles…) | Columna de íconos al lado derecho; cada uno abre un panel que se despliega encima del lienzo y se cierra solo | Conocimiento (confirmado solo en Publisher) |
| **Gestos** | Tocar con **dos dedos = deshacer**, con **tres = rehacer**; dos dedos arrastran el lienzo | Fuente |
| **Solo gestos con el dedo** | Opción para que el dedo no dibuje y solo el lápiz use las herramientas | Fuente |
| **App unificada (oct 2025)** | Un solo programa con tres estudios (**Vector, Pixel, Layout**) que se cambian con un selector arriba a la izquierda; paneles reordenables y espacios de trabajo guardables | Fuente |
| Capas | Filas grandes con miniatura, casilla de visibilidad siempre visible, arrastrar para reordenar, opacidad y modo de fusión arriba del panel | Conocimiento |

## 3. Lo que tienen en común (y lo que tomamos)
1. **El lienzo manda.** Todo lo demás es cromo delgado y neutro alrededor. Hoy nuestras barras compiten con el lienzo.
2. **Tres zonas con un rol fijo:** *herramientas* (qué hago), *propiedades* (cómo lo hago, según la herramienta o la
   selección) y *capas o biblioteca* (con qué). Hoy mezclamos las tres en dos barras.
3. **Las opciones de la herramienta activa van juntas y cambian con ella** (barra de contexto de Affinity, barra
   secundaria de Figma Draw). Es lo que Amaro pide para pinceles, stencil y sticker.
4. **Lo seleccionado se edita ahí mismo:** al tocar un objeto aparecen sus manijas (mover, girar, escalar) y una
   barrita flotante con sus acciones. Es el patrón para el taco de Grabado, el stencil y el sticker.
5. **El panel de propiedades tiene scroll propio.** Ninguna herramienta profesional hace caber todo sin scroll.
6. **Un solo acento** para activo y seleccionado; el color lo pone el contenido.

## 4. Adaptación a tablet con el dedo (lo que NO se copia tal cual)
| En Figma o Affinity | En nuestras tablets |
|---|---|
| Controles de 24–28 px, texto de 11 px | Mínimo 44–48 px y texto de 14 px o más |
| Ojo y candado al pasar el mouse | Siempre visibles (no hay mouse) |
| Campos numéricos que se arrastran | Deslizador o segmentado con 3–4 pasos nombrados |
| Atajos de teclado y clic derecho | Barrita flotante de la selección y gestos de 2 y 3 dedos |
| Muchos paneles y pestañas | Máximo 2 paneles; lo secundario, en secciones que se pliegan |
| Uso sentado, una mano en el mouse | De pie, a dos manos, en horizontal: lo frecuente abajo y a los lados, al alcance de los pulgares |
| Sin límite de tiempo | Quiosco: 90 s sin uso y se reinicia |

## 5. Anatomía propuesta («marco de herramienta» v2)
```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Experiencias   Nombre            ↶ ↷              [ Llévatelo ]   │  barra superior (delgada)
├──────────────────────────────────────────────────┬───────────────────┤
│                                                  │ PROPIEDADES       │
│                                                  │ (de la herramienta│
│                    LIENZO                        │  o de la selección)│
│                                                  │ ───────────────── │
│        ┌─ barrita de la selección ─┐             │ CAPAS / BIBLIOTECA│
│        │  mover · girar · borrar   │             │  (scroll propio)  │
│        └───────────────────────────┘             │                   │
│                                                  │                   │
│          ┌──────────────────────────┐            │                   │
│          │ ▢  ▢  ▢  ▢  ▢   herram. │ flotante   │                   │
│          └──────────────────────────┘            │                   │
└──────────────────────────────────────────────────┴───────────────────┘
```
- **Barra de herramientas flotante**, abajo al centro del lienzo (Figma UI3): solo herramientas, ícono y nombre.
- **Panel derecho único**, con scroll propio: arriba las *propiedades* de la herramienta activa o de lo seleccionado;
  abajo *capas* o *biblioteca*, según la experiencia. Libera el lado izquierdo (pedido de Amaro).
- **Barrita de la selección**, flotando junto al objeto tocado: mover, girar, tamaño, traer adelante, borrar.
- **Gestos:** 2 dedos deshace, 3 rehace (Affinity). Botones ↶ ↷ siguen arriba.
- En vertical, el panel derecho pasa abajo como hoja que se desliza.

## 6. Sistema de diseño atomizado (dos etapas)
- **Etapa 1 · UI neutra de herramienta.** Cromo gris claro, un acento, tipografía del sistema de la campaña (DM Sans),
  íconos de línea (los Material Symbols que ya tenemos). Igual en todas las experiencias. Es lo que se construye ahora.
- **Etapa 2 · Lenguajes.** El mismo sistema toma la forma de Pixel, Geométrica u Orgánica **solo cambiando tokens**
  (`data-visual`), no componentes.

| Nivel | Qué contiene |
|---|---|
| **Tokens** | color (superficie, borde, texto, acento, peligro), espacio (4 · 8 · 12 · 16 · 24), radio, borde, sombra, tipografía, tamaño de toque (48), movimiento |
| **Átomos** | Botón, BotónÍcono, Muestra de color, Deslizador, Interruptor, Segmento, Etiqueta, Divisor, Miniatura |
| **Moléculas** | Fila de propiedad (etiqueta + control), Selector de color (paleta con escalas), Fila de capa (ojo · miniatura · nombre · agarre), Grilla de biblioteca, Paso a paso |
| **Organismos** | Barra de herramientas flotante, Panel de propiedades, Panel de capas, Barrita de la selección, Manijas de transformación, «Llévatela», Tutorial, Puerta del modo juego |
| **Plantilla** | `MarcoHerramienta` (la anatomía del §5), con sus variantes horizontal y vertical |

Vive en `shared/ui/` con su muestra en `docs/kit/muestra.html`. El kit actual (`k-`) queda hasta que cada experiencia migre.

## Fuentes
- [Figma: Navigating UI3](https://help.figma.com/hc/articles/23954856027159) · [Our approach to designing UI3](https://www.figma.com/blog/our-approach-to-designing-ui3/) · [Making the move to UI3](https://www.figma.com/blog/making-the-move-to-ui3-a-guide-to-figmas-next-chapter/)
- [Figma UI3: adapting to the new interface](https://contra.com/p/2RFNOYLR-figma-ui3-unlocked-adapting-to-the-new-interface-like-a-seasoned-pro) · [Figma design breakdown (2026)](https://www.925studios.co/blog/figma-design-breakdown) · [Foro: fixed panels are back](https://forum.figma.com/suggest-a-feature-11/launched-fixed-panels-are-back-23789/index2.html)
- [Figma Draw (ayuda)](https://help.figma.com/hc/id/articles/31440438150935)
- [Affinity Designer 2 iPad: interfaz](https://affinity.help/designer2ipad/en-US.lproj/pages/Workspace/interface.html) · [preferencias y gestos](https://affinity.help/designeripad/en-US.lproj/pages/Workspace/preferences.html) · [9to5Mac: tips de Affinity Designer iPad](https://9to5mac.com/2018/07/12/affinity-designer-for-ipad-tips-tricks-video/) · [PC Pro: reseña](https://www.pressreader.com/uk/pc-pro/20181001/282583083834212)
- [MacRumors: Affinity unificada (oct 2025)](https://www.macrumors.com/2025/10/31/canva-relaunches-affinity-free-app/) · [Engadget](https://www.engadget.com/apps/affinity-resurfaces-as-an-all-in-one-illustration-photo-editing-and-layout-app-204833289.html) · [CG Channel](https://www.cgchannel.com/?p=171450)
- Música de FigJam: no encontré la lista oficial de estilos ([anuncio del temporizador con música](https://forum.figma.com/suggest-a-feature-11/launched-figjam-timer-with-background-music-11874)); se usa la que leyó Amaro.
