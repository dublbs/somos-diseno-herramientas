# Plan 004 · Feedback de los prototipos (2026-10-29)

Feedback de la revisión del hub en el celular. Están separados los arreglos **ya hechos** de lo que es **idear y proponer**; esto último se trabaja por fases y cada fase se aprueba antes de construir.

## Ya hecho (rama `claude/ecstatic-lovelace-xjgq6d`)
| Dónde | Cambio |
|---|---|
| Taller de Mosaicos | Elegir una paleta la aplica **al instante** a todo el diseño. **Invertir** también es inmediato, en cada celda (respeta paletas mezcladas). Se quitó el botón «Aplicar a todo el diseño». |
| Teatro de Papel | «Caminar A → B»: el trayecto **empieza donde está la pieza** (punto A, amarillo). La pieza seleccionada se queda quieta en A y muestra un fantasma en B. **B (verde) se arrastra** hacia donde quieres que camine. Mover la pieza lleva el trayecto completo. |
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

**Elenco estandarizado.** Todos los escenarios tienen los mismos **7 roles**, cada uno con su variante local. Así cada escenario tiene la misma cantidad de piezas y se pueden estandarizar tamaños, zonas y movimientos.

| Rol | Cordillera | Mar | Desierto |
|---|---|---|---|
| Astro (cielo) | Sol | Sol | Sol (o Luna: desierto de noche) |
| Ave (vuela A→B) | **Cóndor** · nuevo | **Gaviota** · nueva | **Picaflor de Arica** · nuevo (alternativa: Paloma) |
| Animal (camina A→B) | **Huemul** · nuevo | Pingüino de Humboldt | **Guanaco** · nuevo |
| Planta emblema | Araucaria | **Chagual** o **Cochayuyo** · nuevo | Quisco |
| Planta pequeña | Helecho | **Doca** (flor costera) · nueva | Flor del desierto (Flor propia) |
| Fruto o hallazgo | Piña de araucaria | **Concha de loco** · nueva | **Chañar** · nuevo |
| Artesanía | Faja (kisa) | Canasto de mimbre | Cántaro de greda |

- **Pertinencia de lo actual:**
  - El Pudú es del bosque valdiviano, no de la cordillera. Propuesta: guardarlo para un **4º escenario «Bosque»** (Pudú, Copihue, Chucao…).
  - El Pez puede quedar como extra del Mar (rol «agua»), pero no entra en los 7 roles.
  - La Paloma no es pertinente en Cordillera ni en Mar; queda en Desierto solo si no se hace el Picaflor.
- **Arte nuevo** (8–9 figuras): se dibuja en Figma siguiendo las reglas de la familia Orgánica (figura + módulo + sticker). Puedo proponer bocetos en Figma para que el equipo los apruebe; no los invento en el código.

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
- **Stencils de dos colores** en vez de los stickers «Cruce peatonal» (calle) y «Zapatilla»:
  - Formas: el Alien (Pixel FA10), la palabra «Diseño», el Metro y la Lata de spray.
  - Como un stencil real: capa 1 (base) y capa 2 (detalle), cada una con su color y borde pulverizado.
- **Rodillo:** herramienta que deja una estela ancha y plana, con textura de rodillo (la del patrón P12 «Trazos de rodillo»).
- **Boquilla fina:** el goteo se dispara con el tiempo que el trazo se mantiene quieto.
  - Más suave: empieza tras ~1,2 s y crece más lento.
  - Se explica en la pantalla previa: «mientras más te demoras, más se escurre la pintura».

## 6 · Estación Audioreactiva (Geométrica) y nuevas experiencias
**Estación Audioreactiva** (construir):
- El micrófono se divide en bandas de frecuencia que mueven las figuras del Taller de Mosaicos.
- El volumen escala, el tono cambia la paleta y un aplauso multiplica o simetriza.
- Exporta PNG o un loop corto.
- Sin micrófono, hay un modo demo con un ritmo generado por Web Audio (sin archivos externos).
- Necesita el sitio real, porque en claude.ai el micrófono está bloqueado.

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
- Los capítulos del evento (Boceto → Prototipo → Lanzamiento) cambian la hora del día.

**Técnica:** app aparte que lee la vista `galeria` de Supabase en tiempo real.
**Siguiente paso:** prototipo navegable con **40 personajes de prueba** para ver cómo se ve poblado.

## 8 · Actividades de los timbres (dificultad creciente)
Son 4 timbres y 5 mesas. El kit de regalo es limitado, así que la dificultad sube con cada timbre y solo se canjea con 4/4:

| Timbre | Actividad | Dificultad |
|---|---|---|
| 1 · Llegada | Escanear el afiche de entrada | Fácil: todos |
| 2 · Explorador | Escanear **3 afiches** repartidos por la sede (contador 0/3 en el álbum) | Media |
| 3 · Creador | Terminar una experiencia o la **mesa de ilustración**: la tarjeta exportada trae un QR «suma a tu credencial», o el staff entrega un código | Media-alta |
| 4 · Hallazgo | Encontrar **3 de las 5 figuras 3D** escondidas en la sede (escáner), o ganar el reto en vivo del HUB | Alta |

- **Canje del kit.** Un staff ingresa el código SD-XXXXX en una pantalla de canje que valida 4/4, marca «canjeado» (tabla `canjes`) y descuenta stock. Un kit por credencial y límite diario.
- **Técnica.** `sellos_def` suma una meta (p. ej. 3 afiches) y la tabla `pasos` registra cada afiche o figura escaneada.

## Orden recomendado
1. **QoL rápida** (1–2 días): pantallas previas con tutorial, deshacer en Mosaicos, goteo más suave, rodillo y stencils en Graffiti.
2. **Fotomatón:**
   - 15 marcos;
   - zona de foto estándar (requiere ajustes en Figma);
   - calibración «ojos».
3. **Teatro de Papel:**
   - arrastrar a la escena (código);
   - elenco estandarizado (requiere arte nuevo: primero los bocetos en Figma).
4. **Credencial:**
   - personaje desde la foto;
   - sistema de actividades y canje.
5. **HUB:** prototipo con personajes de prueba.
6. **Audioreactiva** y la nueva experiencia Orgánica y la Pixel (después de elegir cuál).

## Decisiones pendientes
- **Teatro:**
  - ¿Ave del desierto: Picaflor de Arica o Paloma?
  - ¿Planta del mar: Chagual o Cochayuyo?
  - ¿4º escenario «Bosque» para el Pudú?
- **Nuevas experiencias:** ¿Telar o Grabado? ¿Vagón o Letrero?
- **Timbres:** ¿las 4 actividades propuestas? ¿Quién valida la mesa de ilustración y el canje?
- **Personaje:** ¿foto + cuerpo por lenguaje, o solo personajes predeterminados?
