# 018 · Efectos de sonido (23 nov 2026)

Pedido de Amaro:
- sumar efectos de sonido a **Hora punta** y **Graffiti**;
- analizar si conviene ponerlos en todas las experiencias.

## Decisiones
- **D1 · Sintetizados, sin archivos.** Los sonidos se generan en el navegador con Web Audio, en
  `shared/sonido.ts`.
  - No se agregan archivos de audio, dependencias ni nada por CDN.
  - Cumple «no inventar arte»: el sonido sale de un script.
  - No pesa y funciona sin internet.
- **D2 · Cortos y bajos.** En el stand hay varias tablets juntas, así que cada efecto dura menos de medio segundo y el
  volumen general es bajo (60 %).
  - El mismo sonido no se repite más de una vez cada 40 ms.
  - El único sonido largo es el del spray de Graffiti, que suena mientras el dedo está abajo.
- **D3 · Botón para silenciar en cada tablet.** Va en la barra superior (`BotonSonido`, ícono `volume_up` /
  `volume_off`).
  - La elección queda guardada en el equipo (`localStorage`, clave `sd:sonido`), así el staff puede dejar mudas las
    tablets que quiera.
  - `?sonido=0` en la URL las deja mudas desde el arranque.
- **D4 · Respetar al navegador.** El audio se enciende con el primer toque, como exige Chrome.
  - Se pausa con la pestaña oculta.
  - Si Web Audio falla, el juego sigue sin sonido y sin errores.
- **D5 · El motor no cambia.** En Hora punta el sonido lee los eventos que el motor ya publica para los efectos
  visuales. Las reglas y las 52 pruebas no se tocan.

## Análisis por experiencia
| Experiencia | ¿Sonido? | Por qué | Qué sonaría |
|---|---|---|---|
| **Hora punta** | **Sí (hecho)** | Es un juego: el sonido confirma cada acción y avisa del peligro sin mirar | Pasos, lata, bocina y choque, metro, lanzar pintura, golpe, bola, rebote, daño, Inacapín (llegada, golpe al caer, embestida), victoria y derrota |
| **Graffiti y Tags** | **Sí (hecho)** | Lo físico del spray es la gracia: el siseo hace creíble la lata | Siseo del spray mientras pinta, rodillo, plumón, sticker que se pega, borrar, stencil, vaciar el muro |
| **Cabina de fotos** | **Sí, alta prioridad** | La cuenta regresiva y el obturador son lo que la gente espera de una cabina, y avisan que hay que posar | Bip de la cuenta, obturador, revelado |
| **Taller de Grabado** | Sí, media | Acompaña la animación nueva del taco (T-011): golpe sordo de madera y papel | Taco que se apoya, entintado, impresión |
| **Taller de Mosaicos** | Sí, baja | Un «clac» de cerámica al poner o girar una pieza da textura, pero se repite mucho: tiene que ser muy suave | Clac al poner, giro, multiplicar |
| **Teatro de Papel** | Opcional (decide Felipe) | Papel al sacar una pieza. El video exportado no lleva audio: el sonido solo vive en la tablet | Papel, «tic» al cambiar escenario |
| **Estación Audioreactiva** | **No** | Ya es una experiencia de sonido: cualquier efecto de interfaz chocaría con la música | — |
| **Credencial (celular)** | **No sonido; sí vibración** | Es el celular de la persona en público: un sonido inesperado molesta. Una vibración corta (`navigator.vibrate`) al ganar un timbre da la misma alegría | Vibración al ganar timbre y al encontrar afiche |
| **HUB (Flip)** | **No** | Suena todo el día junto al staff y cansa; además compite con las tablets | — |
| **PC madre** | **No** | Herramienta de trabajo del staff | — |

**Recomendación:**
- Hacer **Cabina**, **Grabado** y la **vibración de la credencial**.
- **Mosaicos** y **Teatro**, solo si sobra tiempo y con volumen más bajo.
- No poner sonido en Audioreactiva, HUB ni PC madre.

## Tareas
- [x] S-1 · `shared/sonido.ts` (motor y efectos) y `BotonSonido` en `shared/ui/`.
- [x] S-2 · Hora punta: efectos por evento del motor y por cambio de estado (paso, lata, fin, llegada, victoria).
- [x] S-3 · Graffiti: siseo continuo del spray y efectos de cada herramienta.
- [x] S-4 · Cabina:
  - bip en cada número de la cuenta, obturador y revelado;
  - clic al prender o apagar una placa;
  - «Llévatela» lista.
- [x] S-5 · Grabado: el taco se apoya, la prensa al estampar, entintar al cambiar de tinta y «Llévatelo».
- [x] S-6 · Credencial: **ya vibraba** (`Timbrado`, `BarraTimbres`, `Afiches`, `Juego`, `Flyer`). No hizo falta cambiar
  nada.
- [x] S-7 · Mosaicos:
  - «clac» muy suave al poner;
  - giro al girar o reflejar, y borrar;
  - Multiplicar, Sorpréndeme y «Llévatelo».
- [x] S-7 · Teatro (Amaro lo pidió el 23 nov; Felipe lo revisa en el PR):
  - papel al sumar una pieza y quitar al sacarla;
  - telón al cambiar de escenario y en Sorpréndeme;
  - el video o la tarjeta listos.
  - El video exportado sigue sin audio.

Todas las experiencias con sonido llevan `BotonSonido` en la barra superior. Audioreactiva, HUB y PC madre quedan sin
efectos (ver el análisis).
