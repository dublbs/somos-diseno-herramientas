# `shared/ui` · kit de interfaz

Dos kits conviven mientras las experiencias migran:

| Kit | Archivos | Estado |
|---|---|---|
| **v2 «herramienta»** (plan 012) | `Herramienta.tsx`, `Manijas.tsx`, `herramienta.css` | **El que se usa desde ahora.** UI neutra de herramienta de diseño (zonas de Figma UI3 y Affinity) |
| v1 `k-` (propuesta 005) | `Kit.tsx`, `somos-kit.css` | Lo usan las apps no migradas. No cambia de API |
| Ventanas comunes | `Tutorial.tsx` (`Tutorial`, `Quiosco`, `useTutorialVisto`), `Juego.tsx` (`PuertaJuego`), `Llevatela.tsx`, `Kit.tsx` (`Confirmar`) | Se usan igual en v1 y v2; bajo `data-ui="v2"` toman el aspecto neutro solo con CSS |

Referencia viva: **Taller de Mosaicos** (`taller-mosaicos/src/App.tsx`) ya está migrado. Muestra estática:
`docs/kit/muestra-v2.html`.

---

## 1. Migrar una app a v2 (receta)

1. **`index.html`**: `<html lang="es" data-ui="v2">` (así el tutorial y la puerta del modo juego, que se ven antes que la
   herramienta, ya salen neutros; `MarcoHerramienta` también lo pone).
2. **CSS**: en `src/styles.css` de la app, una sola línea trae todo (tokens, fuentes, íconos, kit v1 para las ventanas y v2):
   ```css
   @import '../../shared/ui/herramienta.css';
   ```
   Quita `somos-ui.css` y `somos-kit.css` si solo estaban por la pantalla vieja (sus clases `.aviso`, `.volver`, `.layout`
   no hacen falta en v2). Lo propio de la app usa los tokens `--h-*` (nunca colores fijos para la interfaz: el
   contenido del lienzo sí puede tener sus colores).
3. **Build** (igual que v1): `resolve.dedupe: ['react', 'react-dom', 'qrcode']` en `vite.config.ts` y `paths` de `react`,
   `react/jsx-runtime` y `qrcode` en `tsconfig.json` (ver `taller-mosaicos/`).
4. **Pantalla**: arma `MarcoHerramienta` repartiendo así:
   | Zona | Qué va | Componente |
   |---|---|---|
   | Barra superior | volver (automático), título, ayuda de la herramienta activa, ↶ ↷, acciones de la obra, **«Llévatelo»** | props `titulo`, `ayuda`, `historia`, `acciones`, `primario` |
   | Lienzo | el canvas, ajustado a su proporción | `children` → `LienzoAjustado` |
   | Barra flotante (abajo al centro) | **solo herramientas** (qué hago): ícono + nombre | `herramientas` → `BarraFlotante` |
   | Panel derecho (scroll propio) | arriba las propiedades de la herramienta o de lo seleccionado (cómo lo hago); abajo biblioteca, capas, paleta, formato y ajustes (con qué) | `panel` → varias `SeccionPanel` |
   | Junto al objeto | acciones del objeto tocado y sus manijas | `Manijas` + `BarritaSeleccion` |
5. **Regla de pantalla (plan 012 D6)**: la página, el lienzo y la barra flotante no tienen scroll; **solo el panel**.
   Nada frecuente queda bajo el scroll: lo más usado va arriba en el panel. Toques ≥ 48 px.
6. **Verifica** en 1024×768, 1180×820, 1280×720, 1366×768, 768×1024 y 820×1180 con cada herramienta activa.

Esqueleto mínimo:
```tsx
import { MarcoHerramienta, LienzoAjustado, BarraFlotante, SeccionPanel, useHistorial, useAviso, useGestosHistorial } from '../../shared/ui/Herramienta';
import { Llevatela } from '../../shared/ui/Llevatela';
import { Quiosco, Tutorial, useTutorialVisto } from '../../shared/ui/Tutorial';
import './styles.css'; // @import '../../shared/ui/herramienta.css';

const historial = useHistorial<Dibujo>(inicial);
const [aviso, avisar] = useAviso();
const lienzoRef = useRef<HTMLDivElement>(null);
useGestosHistorial(lienzoRef, { onDeshacer: historial.deshacer, onRehacer: historial.rehacer, alMultitoque: cancelarTrazo });

<MarcoHerramienta titulo="Graffiti y Tags" ayuda="Arrastra para pintar." historia={historial}
  acciones={<Boton icono="shuffle" texto="Sorpréndeme" onClick={…} />}
  primario={{ texto: 'Llévatelo', onClick: exportar }}
  herramientas={<BarraFlotante herramientas={HERR} activa={herr} onElegir={setHerr} />}
  panel={<><SeccionPanel titulo="Pincel">…</SeccionPanel><SeccionPanel titulo="Color">…</SeccionPanel></>}
  aviso={aviso}>
  <LienzoAjustado ref={lienzoRef} proporcion={1080 / 1350}><canvas … style={{ width: '100%', height: '100%' }} /></LienzoAjustado>
</MarcoHerramienta>
{blob && <Llevatela blob={blob} app="graffiti" titulo="Tu muro está listo" alCerrar={() => setBlob(null)} />}
<Quiosco app="graffiti" limpiar={['graffiti:estado']} />
```

---

## 2. Tokens (`herramienta.css`, activos bajo `[data-ui="v2"]`)

| Token | Valor | Uso |
|---|---|---|
| `--h-lienzo-fondo` | `#E9E9E7` | área alrededor del lienzo |
| `--h-superficie` / `--h-superficie-2` | `#FFFFFF` / `#F5F5F4` | barras y panel / campos y segmentados |
| `--h-borde` | `#D4D4D2` | bordes y divisores (`--h-trazo` = 1px) |
| `--h-texto` / `--h-texto-2` | `#1A1A1A` / `#6B6B69` | texto / etiquetas y ayudas |
| `--h-acento` / `--h-sobre-acento` / `--h-acento-suave` | `#0062B8` / `#FFF` / `#E5EEF7` | lo activo y lo seleccionado (un solo acento) |
| `--h-peligro` | `#C62828` | borrar |
| `--h-radio` / `--h-radio-chico` | 10 / 6 px | |
| `--h-toque` | 48 px | alto mínimo de todo lo tocable |
| `--h-sombra-flotante` / `--h-sombra-chica` | `0 4px 16px rgba(0,0,0,.14)` / `0 1px 2px …` | barras flotantes / elevación leve |
| `--h-fuente` / `--h-fuente-titulo` | DM Sans | |
| `--h-e1…--h-e5` | 4 · 8 · 12 · 16 · 24 px | espacio |
| `--h-panel-ancho` / `--h-panel-alto` | 300 px / 42 % | panel en horizontal / alto del panel en vertical |
| `--h-mov` | .15 s (0 con `prefers-reduced-motion`) | transiciones |

**Etapa 2** (lenguajes): se sobrescriben **solo tokens** en el bloque «ETAPA 2» de `herramienta.css`, por
`html[data-ui="v2"][data-visual="Pixel"|"Geométrica"|"Orgánica"]`. Por eso ningún componente ni app debe usar colores,
radios o sombras fijos para la interfaz.

---

## 3. Piezas y API (todo se importa desde `shared/ui/Herramienta`)

### Plantilla
- **`MarcoHerramienta`** `{ titulo, ayuda?, volver?='../../', historia?, acciones?, primario?: {texto, icono?='ios_share', onClick, disabled?}, herramientas?, panel?, anchoPanel?=300, altoPanelVertical?='42%', aviso?, sobreEscenario?, children }`.
  `historia` acepta directamente lo que devuelve `useHistorial` (`deshacer`, `rehacer`, `puedeDeshacer`, `puedeRehacer`).
  En vertical el panel pasa abajo con `altoPanelVertical` y sus secciones se acomodan en 2 columnas.
- **`LienzoAjustado`** `{ proporcion, className?, style?, ref? }`: caja `position:relative` con la proporción ancho/alto
  que cabe entera en el escenario. El canvas va dentro con `width:100%;height:100%`; encima, `Manijas`.
- **`useAviso(ms?=2600)`** → `[texto, avisar]`; pasa `texto` a `aviso` del marco.

### Átomos
- **`Boton`** `{ texto, icono?, variante?: 'normal'|'primario'|'fantasma'|'peligro', onClick, disabled?, activo?, ancho?, etiqueta? }`.
  `activo` = botón de encendido (`aria-pressed`). En la barra superior, bajo 900 px los no primarios quedan solo con ícono.
- **`BotonIcono`** `{ icono, etiqueta, variante?, onClick, disabled?, activo? }` (`etiqueta` obligatoria: es el `aria-label`).
- **`Segmento<T>`** `{ opciones: {valor, texto?, icono?, etiqueta?, disabled?}[], valor, onCambiar, etiqueta }` (radiogroup).
- **`Deslizador`** `{ etiqueta, min, max, paso?, valor, onCambiar, onSoltar?, formato?: v => string, extremos?: [a, b] }`.
  `onSoltar` sirve para guardar en el historial solo al soltar.
- **`Interruptor`** `{ texto, activo, onCambiar }` (switch).
- **`Muestra`** `{ color, nombre, activa?, onClick, tam? }`; para un grupo: `<div className="h-muestras" role="radiogroup" aria-label="Color">`.
- **`Icono`** `{ nombre, tam? }`: Material Symbols del subconjunto (`shared/fonts/README.md`; ahí se suman íconos).

### Moléculas
- **`SeccionPanel`** `{ titulo, plegable?, abierta?=true, acciones?, ayuda?, children }`. Lo frecuente, sin plegar.
- **`FilaPropiedad`** `{ etiqueta, apilada?, children }`: etiqueta a la izquierda y control a la derecha (o encima).
- **`GrillaBiblioteca<T>`** `{ elementos: {id, nombre, contenido, mostrarNombre?}[], elegido, onElegir, etiqueta, tam?=56 (mín. 48), columnas? }`.
- **`SelectorColor`** `{ valor (hex), onCambiar: (hex, {color, paso}) => void, colores?=LINEA_AZUL, pasos?=5, etiqueta? }`:
  primero el color de la paleta Línea azul y debajo su escala de claro a oscuro. También exporta `LINEA_AZUL` y
  `escala(hex, pasos)` (string[] de claro a oscuro; el color base queda al medio, o en un extremo si es casi negro o casi blanco).
- **`ListaCapas`** `{ capas: {id, nombre, visible, miniatura?}[], activa, onActivar, onVisible(id, v), onMover(id, 'adelante'|'atras'), onAgregar?, onBorrar?(id), maximo?=8, minimo?=1 }`.
  `capas` va en **orden de dibujo** (0 = fondo) y se muestra al revés (arriba la de adelante). Ojo siempre visible;
  «+ Capa» y «Borrar» (la activa) al pie.

### Organismos
- **`BarraFlotante<T>`** `{ herramientas: {id, nombre, icono, disabled?}[], activa, onElegir, etiqueta?, extra? }`:
  toolbar + radiogroup (flechas ← → cambian). `extra` va tras un divisor (algo muy frecuente y corto; mejor nada).
- **`BarritaSeleccion`** `{ acciones: {icono, etiqueta, onClick, disabled?, peligro?}[], onConfirmar?, onCancelar?, ancla?: {x, y, abajo?} }`.
  Sin `ancla` se dibuja en línea (para pasarla a `Manijas`); con `ancla` (px dentro del contenedor posicionado) flota
  sobre ese punto sin salirse. ✕ y ✓ van al final.
- **`Manijas`** (de `Manijas.tsx`, reexportado) — objeto puesto sobre un canvas:
  ```tsx
  const [t, setT] = useState<Transformacion>({ x: 540, y: 675, escala: 1, giro: 0 }); // centro en px del canvas
  <LienzoAjustado proporcion={1080 / 1350}>
    <canvas width={1080} height={1350} … />
    {colocando && <Manijas valor={t} ancho={taco.w} alto={taco.h} lienzo={{ ancho: 1080, alto: 1350 }}
      limites={{ min: 0.1, max: 0.6 }}
      onCambiar={(n, final) => { setT(n); if (final) guardar(n); }}
      barrita={<BarritaSeleccion acciones={[{ icono: 'content_copy', etiqueta: 'Duplicar', onClick: duplicar }]}
        onCancelar={cancelar} onConfirmar={estampar} />} />}
  </LienzoAjustado>
  ```
  Arrastrar el cuerpo mueve, la manija de arriba gira (imán a 0/90/180/270 con `iman`, 5° por defecto), las esquinas
  escalan; con dos dedos sobre el objeto se pellizca y gira (el segundo dedo puede caer fuera). `limites` es el lado
  mayor del objeto como fracción del lado menor del lienzo (por defecto 0,08–0,9). Props `mover`, `girar`, `escalar`
  desactivan cada cosa. Teclado: flechas, `[` `]`, `+` `−`. `onCambiar(t, final)`: con `final=true` (al soltar) se guarda en el historial.
  La app dibuja el objeto en su canvas con `t` (`ctx.translate(t.x, t.y); ctx.rotate(t.giro * Math.PI / 180); ctx.scale(t.escala, t.escala)`).

### Estado y gestos
- **`useHistorial<T>(inicial, limite?=40)`** → `{ estado, cambiar(nuevo | fn, guardar?=true), deshacer, rehacer, anular, reiniciar(v), puedeDeshacer, puedeRehacer }`.
  Un trazo = un paso: primera celda con `guardar=true`, las siguientes con `false`. `anular()` descarta el último paso
  sin dejarlo para rehacer.
- **`useGestosHistorial(ref, { onDeshacer, onRehacer, alMultitoque?, activo? })`** → `{ hayVariosDedos() }`: tocar con
  **2 dedos deshace, con 3 rehace** (toque corto, sin arrastrar, solo táctil). Al caer el segundo dedo llama
  `alMultitoque`: ahí descarta el trazo que alcanzó a empezar el primero (`historial.anular()` si ese trazo ya guardó un
  paso). En el `pointerdown` del canvas ignora los dedos extra (`if (!e.isPrimary) return;`). Lo que esté dentro de
  `[data-h-sin-gestos]` (manijas, barritas) no cuenta.

### Ventanas comunes (sin cambios de API)
`Tutorial`, `Quiosco`, `Confirmar` (de `Kit.tsx`), `PuertaJuego`, `Llevatela`: se usan igual. Con `data-ui="v2"` toman
superficie blanca, borde gris, radio 10 y DM Sans. `Confirmar` lleva clases `k-`: en un panel v2 prefiere un `Boton`
con `variante="peligro"` que pida un segundo toque, o `Confirmar` tal cual (se ve neutro).

---

## 4. Accesibilidad
Toques ≥ 48 px (`--h-toque`), foco visible (2 px de acento), `role="toolbar"`/`radiogroup`/`switch` en lo que
corresponde, `aria-label` en todo lo que es solo ícono, `prefers-reduced-motion` (sin transiciones). Textos en español
de Chile, cortos.
