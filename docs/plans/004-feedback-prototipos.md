# Plan 004 · Feedback de los prototipos (2026-10-29)

Feedback de la revisión del hub en el celular. Están separados los arreglos **ya hechos** de lo que es **idear y proponer**; esto último se trabaja por fases y cada fase se aprueba antes de construir.

## Ya hecho (rama `claude/ecstatic-lovelace-xjgq6d`)
| Dónde | Cambio |
|---|---|
| Taller de Mosaicos | Elegir una paleta la aplica **al instante** a todo el diseño. **Invertir** también es inmediato, en cada celda (respeta paletas mezcladas). Se quitó el botón «Aplicar a todo el diseño». |
| Teatro de Papel | El loop **parte pausado**. En pausa, la pieza elegida se edita quieta en A, con el fantasma en B; con **play** se ve el loop completo, incluida esa pieza. «Caminar A → B»: el trayecto **empieza donde está la pieza** (punto A, amarillo). La pieza seleccionada se queda quieta en A y muestra un fantasma en B. **B (verde) se arrastra** hacia donde quieres que camine. Mover la pieza lleva el trayecto completo. |
| Credencial | Botón **volver** (←) a las experiencias. Al tocar la credencial, **gira con media vuelta** hacia el álbum de timbres. Después del aviso «¡Timbre!», el timbre **cae y se estampa sobre la credencial**, en su ranura. Fondo de Geométrica/Estallido y Orgánica/Estallido con el patrón más chico y más velado. |

## 1 · Transversal: pantalla previa con tutorial corto
Como la portada del Fotomatón: antes de la actividad, una pantalla con el nombre, **3 pasos ilustrados** (ícono + una frase) y el botón «Empezar».
- No se muestra de nuevo en la misma sesión. Vuelve tras 90 s sin uso (modo quiosco).
- Componente común en `shared/` (HTML + CSS del sistema de pantalla), con el `data-visual` de cada experiencia.

Textos propuestos:
| Experiencia | Paso 1 | Paso 2 | Paso 3 |
|---|---|---|---|
| Taller de Mosaicos | Elige una forma | Toca la grilla: pon, gira, refleja | Cambia la paleta, multiplica y descarga |
| Teatro de Papel | Elige un escenario | Arrastra personajes y piezas al escenario | Dales un trayecto y llévate el video |
| Graffiti y Tags | Elige muro y color | Pinta: **mientras más lento el trazo, más chorrea** | Usa stencils y descarga tu muro |
| Fotomatón | Elige lenguaje y marco | Ponte frente a la cámara: cuenta regresiva | Escanea el QR y llévate la foto |

Calidad de vida (QoL):
- **Deshacer en Mosaicos.** Hoy no hay y la paleta inmediata reemplaza todo: es la mejora más urgente de esta lista.
- Confirmación consistente en «Vaciar».
- Volver a la portada de la experiencia tras 90 s sin uso.

## 2 · Teatro de Papel
**Arrastrar a la escena.** Las piezas de la bandeja se arrastran directo al escenario (pointer events con «fantasma» bajo el dedo). Tocar sigue agregándolas al centro.

**Elenco estandarizado (decidido 2026-10-29).** Todos los escenarios tienen los mismos **7 roles**, cada uno con su variante local. Se suma un **4º escenario, Bosque**. El Mar se piensa como mar, más que como playa, así que el Pingüino calza.

| Rol | Cordillera | Mar | Desierto | Bosque (nuevo) |
|---|---|---|---|---|
| Astro (cielo) | Sol | Sol | Sol | Luna o lluvia (bosque húmedo) · por decidir |
| Ave (vuela A→B) | **Cóndor** · nuevo | **Gaviota** · nueva | **Picaflor de Arica** · nuevo | **Carpintero negro** · nuevo (alternativa: Chucao) |
| Animal (camina A→B) | **Huemul** · nuevo | Pingüino de Humboldt | **Guanaco** · nuevo | Pudú |
| Planta emblema | Araucaria | **Chagual** o **Cochayuyo** · nuevo | Quisco | **Alerce** · nuevo |
| Planta pequeña | Helecho | **Doca** · nueva | Flor del desierto (Flor propia) | **Copihue** · nuevo |
| Fruto o hallazgo | Piña de araucaria | **Concha de loco** · nueva | **Chañar** · nuevo | **Maqui** · nuevo |
| Artesanía | Faja (kisa) | Canasto de mimbre | Cántaro de greda | **Telar mapuche (witral)** · nuevo, validar con el equipo |

- El Pez queda como extra del Mar (rol «agua»).
- La Paloma sale del elenco: la reemplazan Cóndor, Gaviota y Picaflor.
- **Arte nuevo:** unas 14 figuras siguiendo las reglas de la familia Orgánica (figura + módulo + sticker). Las bocetamos en código o en Figma y el equipo las aprueba.

## 3 · Taller de Mosaicos
Hecho: paleta e invertir inmediatos. Falta **deshacer** (ver sección 1).

## 4 · Fotomatón CMYK
**Marcos.** El objetivo son 15 marcos, 5 por lenguaje, iguales a Figma:
- **Pixel:** actualizar a M01 Pizarra, M02 Vinilo, M04 Ventana, M05 Metro y M06 Señal. Hoy el código tiene «Ajedrez» y «Lapislázuli», que no coinciden con Figma.
- **Orgánica:** agregar M01 Bandas, M04 Panel escalonado y M06 Diamante (hoy solo hay M02 y M05).
- **Geométrica:** ya está completa.

**Zona de foto estándar** (también afecta a la credencial). Todos los marcos comparten una ventana mínima de **140 × 140 centrada** en el cuadro de 240; la forma (círculo, cuadrado, rombo) va inscrita en ella. Hoy la zona va de 117 × 117 (Orgánica Túnel) a 180 × 100 (Pixel Metro).
- Hay que ajustar en Figma los marcos que no cumplen: Túnel (G y O), Metro, Ventana y Diamante.
- **Vinilo** se rediseña para ocupar los 240 completos.

**Efectos: la regla de «los ojos».**
- En sus niveles por defecto, cada efecto (trama CMYK, CRT, mosaico) debe dejar **reconocibles los ojos**. Si no se distinguen, el efecto es demasiado grueso.
- **Medición.** Con el detector de caras que ya usa el Fotomatón (face-api), medir el contraste local de la zona de los ojos contra la mejilla. La medición se hace sobre un set de 6 retratos de prueba variados (tono de piel, luz, lentes).
- **Ajuste.** Se calibran los valores por defecto hasta pasar la medición. Si hace falta, la celda se vuelve más fina dentro de la caja de la cara, como una «zona de detalle».

## 5 · Graffiti y Tags
- **Stencils de dos colores** en vez de los stickers «Cruce peatonal» (calle) y «Zapatilla». El stencil es una **herramienta, no un sticker**: se coloca encima del muro como una plantilla y la persona **lo pinta con el spray**; solo pasa la pintura por los huecos. Para dos colores, se pinta la capa 1, se cambia a la plantilla de la capa 2 y se pinta otra vez:
  - Formas: el Alien (Pixel FA10), la palabra «Diseño», el Metro y la Lata de spray.
  - Como un stencil real: capa 1 (base) y capa 2 (detalle), cada una con su color y borde pulverizado.
- **Rodillo:** herramienta que deja una estela ancha y plana, con textura de rodillo (la del patrón P12 «Trazos de rodillo»).
- **Boquilla fina:** el goteo se dispara con el tiempo que el trazo se mantiene quieto.
  - Más suave: empieza tras ~1,2 s y crece más lento.
  - Se explica en la pantalla previa: «mientras más te demoras, más se escurre la pintura».

## 6 · Estación Audioreactiva (Geométrica) y nuevas experiencias
**Estación Audioreactiva** (construir). Usa los **movimientos de Geométrica · Motion de Figma**, que casi no hemos ocupado; no las figuras del Taller de Mosaicos.
- Movimientos: M1 Celda que crece, M2 Damero que se inclina, M3 Túnel que se abre, M4 Acordeón que corre, M5 Acordeón, M6 Damero que se curva.
- Experimentos: C4 Greca en caleidoscopio, C5 Caleidoscopio de rombos, C6 Las celdas giran, C7 Franjas → muescas → escalera, C8 K'isa: el color corre, C10 Puntos → cruces → tejido.

Se eligen 4 «escenas» y en cada una el sonido maneja el movimiento:
| Escena | Movimiento base | Qué hace el sonido |
|---|---|---|
| Túnel | M3 Túnel que se abre | El volumen abre el túnel; los graves lo hacen latir |
| Acordeón | M4 y M5 | Los graves comprimen el acordeón; el ritmo hace correr las listas |
| Caleidoscopio | C4 y C5 | El tono gira el caleidoscopio; un aplauso cambia la simetría (4, 6, 8) |
| Tejido | C10 + C8 + C6 | Los agudos pasan de puntos a cruces a tejido; el tono hace «correr el color» (C8); los golpes giran las celdas (C6) |
- C7 (franjas → muescas → escalera) puede ser una 5ª escena o la transición entre escenas.
- Se exporta un loop corto o un PNG.
- Sin micrófono, hay un modo demo con un ritmo generado por Web Audio.
- Necesita el sitio real (en claude.ai el micrófono está bloqueado).
- **Paso previo:** traer de Figma los cuadros clave de M1–M6 y C4–C10 para replicar el movimiento con exactitud.

**Jardín de Papel → se depreca.**

**Orgánica: elegir una**
- **Telar** *(recomendada)*: tejes una faja eligiendo figuras orgánicas (pudú, helecho, sol) que se convierten en el patrón de la urdimbre (como la FA02 «Faja tejida a telar»). Se ve tejerse en vivo y exporta la faja como tarjeta.
- **Taller de grabado:** estampar en papel con «tacos» de figuras orgánicas, con textura de tinta y registro imperfecto. Conecta con la idea del timbre.

**Pixel / cultura urbana: elegir una**
- **Vagón** *(recomendada)*: intervienes el lateral de un vagón de Metro (FA08) con tags, stencils y stickers. Cuando terminas, **tu vagón pasa por la pantalla del HUB**.
- **Letrero popular:** diseñar un letrero de feria o almacén con tipografía pixel y colores populares.

## 7 · Credencial y HUB (pantalla flip)
**Personaje a partir de la foto, estilo Mii.**
- **Construcción.** El cuerpo se elige por lenguaje (Pixel, Geométrico, Orgánico; 1–2 poses cada uno) y la **cabeza es la foto**, recortada con el detector de caras del Fotomatón.
- **Rapidez.** Sacarse la foto ya crea el personaje; solo se elige el cuerpo. Nadie se queda pegado editando.
- **Alternativa.** Un set de personajes predeterminados para quien no quiera foto.
- **Privacidad.** La foto se verá en una pantalla pública: hay que pedir consentimiento explícito, con la opción «usar personaje», y borrar las fotos después del evento.

**HUB «Estación Somos Diseño»** (propuesta). Un corte de una estación donde conviven los tres lenguajes en tres niveles:
- **Pixel (abajo):** el andén y el Metro. Las personas llegan en tren cuando crean su credencial.
- **Geométrica (medio):** mezanine, escaleras y torniquetes con figuras de la grilla.
- **Orgánica (arriba):** la plaza en la superficie, con árboles, cielo y aves.

**Los timbres se ven en el HUB:**
- Cada timbre sube al personaje un nivel: llega en tren → cruza el mezanine → sale a la plaza.
- Con 4/4, celebración en la plaza.
- ~~Los capítulos cambian la hora del día~~: descartado. El HUB puede seguir la hora real (10:00 → 20:00: mañana, tarde, atardecer).

**Técnica:** app aparte que lee la vista `galeria` de Supabase en tiempo real.
**Siguiente paso:** prototipo navegable con **40 personajes de prueba** para ver cómo se ve poblado.

## 8 · Actividades de los timbres (decidido 2026-10-29)
El evento dura de **10:00 a 20:00**: toda actividad tiene que poder hacerse en cualquier momento del día. Por eso **se descartan los cambios de capítulo** y el reto tipo Kahoot queda solo planificado.

| Timbre | Actividad | Dificultad |
|---|---|---|
| 1 · Inscripción | Crear la credencial (certifica que te inscribiste) | Fácil: todos |
| 2 · Creador | Crear algo en una experiencia que **alimenta el HUB** (ver abajo), en modo juego | Media |
| 3 · Portales | Encontrar **3 portales**: los afiches de la sede son los marcos (experiencia AR) | Media-alta |
| 4 · Hallazgo | Encontrar las figuras 3D impresas en el HUB · **en revisión**, no convence aún | Alta |

**Experiencias que alimentan el HUB** (una por lenguaje):
- **Pixel → Vagón:** lo que la gente pinta en el vagón pasa por el andén del HUB, como easter egg.
- **Geométrica → Estación Audioreactiva:** lo que la gente hace sonar mueve la pantalla del mezanine.
- **Orgánica → Telar o Grabado:** se construyen las dos para compararlas. Las fajas o las estampas se cuelgan en la plaza del HUB.

El HUB vive en la pantalla flip y también en los **Mac** del evento.

**Portales AR (timbre 3):**
- Los 15 afiches son los 15 marcos (5 por lenguaje), cada uno con un QR.
- Al escanearlo, la credencial abre la cámara con el marco encima. Por la ventana del marco se ve el **mundo animado de ese lenguaje** (un portal); alrededor, la cámara real. No necesita seguimiento: funciona con `getUserMedia` en el sitio publicado.
- **Actividad:** dentro de cada portal vive una figura de su mundo (p. ej. la Paloma en un portal Orgánico, el Alien en uno Pixel). Se atrapa tocándola cuando cruza la ventana y queda en el álbum.
- **3 portales distintos = timbre 3.** Coleccionar los 15 es un extra (sin timbre) para quien quiera seguir.

**Modo juego en las tablets** (para el timbre «Creador»):
- La persona entrega su código SD-XXXXX en la mesa: lo escribe en la tablet o escanea su credencial.
- Eso **desbloquea el juego para esa sesión**: la experiencia muestra el reto (p. ej. «haz un mosaico con 3 formas distintas») y, al exportar, entrega el timbre.
- Quien no juega usa la experiencia normal, sin reto.
- **Volver al estado base:** un encargado lo hace con un gesto oculto (mantener presionado el logo 3 s + PIN). Cierra la sesión, borra el trabajo y vuelve a la portada. También hay un cierre automático tras 90 s sin uso.

**Interacciones desde el celular:**
- Los portales AR (timbre 3).
- ~~Escanear el QR del cambio de capítulo~~: descartado (no hay capítulos).
- **Reto en vivo** tipo Kahoot en el HUB: planificado, no se construye por ahora.

**Canje del kit:**
- Un staff ingresa el código en una pantalla de canje que valida 4/4.
- La pantalla marca «canjeado» (tabla `canjes`) y descuenta stock.
- Un kit por credencial, con límite diario.

**Técnica:**
- `sellos_def` suma una meta (p. ej. 3 afiches) y la tabla `pasos` registra cada afiche o figura escaneada.
- Una sesión de juego por tablet (`sesiones_mesa`) liga el código a la mesa.

## 9 · ¿Los HUB hay que construirlos en Figma?
No es necesario partir en Figma. Propuesta:
1. **Construirlo aquí en código**, con los personajes de prueba, la animación y los datos falsos. Así se ve poblado, en movimiento y a escala de pantalla real.
2. **Llevarlo a Figma** con el MCP de Figma: capturo las pantallas del prototipo como capas editables en el archivo de la campaña, para que el equipo afine composición y arte. Lo que se decida en Figma vuelve al código.

**Límite:** la captura es una buena base editable, pero no un archivo «limpio» con componentes; si se quiere así, se reconstruye a mano o con el skill de Figma a partir de la captura.

## Orden de trabajo (decidido 2026-10-29)
1. **HUB «Estación Somos Diseño»**: prototipo en código (`hub-estacion/`), adaptable a la pantalla flip (orientación por confirmar) y a los Mac.
2. **Estación Audioreactiva:** 4 escenas con los movimientos de Geométrica · Motion; reaccionar a notas viene después.
3. **Telar y Grabado:** las dos, para compararlas.
4. **Teatro de Papel:** las piezas nuevas en boceto y el escenario Bosque, con las dos opciones donde hay duda (Chagual y Cochayuyo, Carpintero negro y Chucao, Luna y Lluvia).

Después: tutoriales, deshacer en Mosaicos, Graffiti (stencils, rodillo, goteo), Fotomatón (marcos, zona estándar, «ojos»), Vagón, portales AR y credencial (personaje desde la foto, modo juego, canje).

## Decisiones pendientes
- **Teatro:** elegir después de ver los bocetos: Chagual o Cochayuyo, Carpintero negro o Chucao, Luna o Lluvia. (El Telar mapuche está aprobado.)
- **Orgánica:** ¿Telar o Grabado? Se comparan con los dos construidos. (Pixel: Vagón, decidido.)
- **Pantalla flip:** orientación y resolución.
- **Timbres:**
  - Timbre 4 (figuras 3D en el HUB): ¿se mantiene?
  - ¿Qué reto tiene cada experiencia en modo juego?
  - ¿Quién tiene el PIN para devolver la tablet al estado base y validar el canje?
- **Personaje:** ¿foto + cuerpo por lenguaje, o solo personajes predeterminados?
