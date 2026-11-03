# 006 · Credencial refinada y tres experiencias nuevas

Fecha: 3 nov 2026 · Estado: propuesta para decidir en equipo. Lo ya aplicado está en la sección 1.

## 1. Ya hecho en esta ronda
- **Tutorial de Teatro de Papel y Grabado:** el texto de los pasos salía blanco sobre tarjetas crema (modo oscuro). Ahora es oscuro (`shared/ui/somos-kit.css`).
- **Telar eliminado** del repo, el hub, los scripts y la documentación.
- **Hub:** Credencial ya no cuenta como experiencia: solo aparece en «Todos», nunca al filtrar por lenguaje.
- **Credencial:** botón **Reiniciar** junto a «Demo» (dos toques: «Reiniciar» → «¿Seguro?»; borra credencial, foto y avatar de este celular). La cámara de la selfie se abre dentro de la app (cámara frontal, con guía) y deja «Galería» como respaldo. Los nombres de los personajes ya no tapan el dibujo. El fondo del marco Estallido pasó de patrón ensuciado a un fondo casi plano. En el álbum, el nombre de la estación tiene más aire a los lados. El timbre cae más grande que su ranura y se asienta en ella. La lluvia de timbres es aleatoria (posición, tamaño, ritmo y vaivén distintos cada vez). El copy del canje le habla a la persona.

## 2. Credencial: qué sigue

### 2.1 Personajes (hoy hay 1 por lenguaje y se sienten de relleno)
Regla: sin arte inventado. Salen de Figma o de piezas que ya existen en el repo.

| Lenguaje | Hoy | Propuesta (4 por lenguaje) | De dónde sale |
|---|---|---|---|
| Orgánica | Pingüino | Pingüino, **Pudú, Cóndor, Chucao** (y Huemul como desbloqueable) | Piezas de Teatro de Papel (`loops/public/figma/organica-bocetos/`) |
| Pixel | Invasor | Invasor, **Zapatilla, Spray, Tarro de pintura** (y el pasajero de Vagón como 5.º) | Stickers que ya existen en `vagon/public/figma/stickers/`; si se quiere algo más animal o más humano, pedirlo a Figma |
| Geométrica | Glifo | Glifo, **Ojo, Escalera, Fuelle** | Módulos de Mosaicos y Audioreactiva (acordeón, escalera); falta definir en Figma |

Otras decisiones:
- El personaje no depende del marco: hoy se auto-asigna al lenguaje y eso limita. Que se pueda elegir cualquiera en cualquier marco.
- El personaje Pixel trae una sombra crema desfasada que se ve como una mancha detrás. Pedir versión sin sombra.
- Pantalla de elección: 2 columnas × 2 filas (4 por lenguaje, 12 en total) con filtro por lenguaje; el nombre va debajo, nunca encima.

### 2.2 Marcos
- **Estallido (Orgánica M02):** el círculo central recorta la foto con borde duro frente a los rayos. Pedir a Figma el anillo de la máscara, o dibujar un aro crema de 3 px. El patrón «medio sol» sobre azul ensuciaba el color (amarillo + rosa con velo azul); ya está casi plano, pero conviene un patrón propio de un solo tono.
- **Estallido (Geométrica M02):** revisar el contraste del círculo celeste con el morado.
- Criterio de contraste común: cada marco y su patrón deben pasar ≥ 4.5:1 entre texto y fondo y que el patrón nunca dibuje colores nuevos al mezclarse con la banda.

### 2.3 Timbres
Problema: hoy son stickers con borde y sombra desfasada; se ven pegados, no timbrados.
- **Molde común de sello de goma** para los tres lenguajes: círculo (Orgánica), cuadrado (Geométrica) o escalonado (Pixel); tinta de un solo color, **sin sombra**, nombre de la estación en el borde, ilustración del lenguaje dentro.
- Ya que los timbres hoy son el recurso de los stickers, definir una **segunda versión** por estación (4 estaciones × 3 lenguajes × 2 versiones = 24): la segunda para quien repite o para el premio.
- Estación 4 «Hallazgo 3D»: sigue apagada. Candidata: el **timbre propio** de la experiencia 1 (sección 3.1).
- Estampado: ya cae grande y se asienta. Siguiente paso: un golpe de pantalla (temblor corto) y la marca de tinta que queda levemente corrida.

### 2.4 Flujo y copy
Texto actual → propuesta (siempre en segunda persona, frases cortas, sin jerga del equipo):

| Dónde | Hoy | Propuesta |
|---|---|---|
| Escanear (sin cámara) | «Apunta la cámara de tu teléfono al QR del timbre, o elige la estación y escribe el código que está bajo el QR.» | «Escanea el QR del timbre con la cámara. ¿No funciona? Elige la estación y escribe las 4 letras que están bajo el QR.» |
| Escanear (buscando) | «Apunta al QR del timbre» | «Apunta al QR de la mesa» |
| Estación 2 | «Crea algo en una mesa y mándalo al HUB» | «Crea algo en una mesa y envíalo a la pantalla» |
| Estación 3 | «Escanea los afiches de los portales AR» | «Encuentra y escanea un portal AR» |
| Estación 4 | «Muy pronto» | «Pronto: un hallazgo en 3D» |
| Mensaje al crear | «Credencial lista: ya tienes el timbre de Inscripción.» | «¡Listo! Tu credencial ya tiene su primer timbre.» |
| Progreso | «2 de 3 timbres · toca para ver el álbum» | «Llevas 2 de 3 timbres. Toca la credencial para ver tu álbum.» |
| Canje | «Muestra esta pantalla al equipo… el staff escribe su PIN…» | Ya aplicado: «Muestra esta pantalla al equipo de Somos Diseño. Pídele que escriba su PIN para entregarte tu premio.» |

Otros puntos:
- Aviso de «Demo» y botón Reiniciar solo existen sin Supabase. En el evento real no deben verse.
- Las tablets de las mesas deben mostrar el QR **y** el código corto con letra grande (el iPhone no tiene el lector nativo en el navegador).
- Pensar un caso de «credencial perdida»: recuperarla con su código SD-XXXXX en otro celular.

## 3. Tres experiencias nuevas (una por lenguaje)
Todas siguen el kit (`shared/ui/`), barras fijas, sin scroll, tutorial de 3 pasos, quiosco a los 90 s y exportan 1080 × 1350 con la franja común. Cada una publica al HUB con `shared/datos.ts`.

### 3.1 Taller de Timbres · Pixel
- **Qué:** diseñas en una grilla de 16 × 16 el timbre que se estampa en tu credencial. Paleta oficial, simetría opcional (espejo), rellenar, deshacer. Se previsualiza estampado: tinta, giro y borde corrido.
- **Por qué:** cierra el círculo con la Credencial. Da la estación 4 sin depender de un hallazgo 3D, y cada persona se lleva un timbre único en vez de un sticker común.
- **Mesa → celular:** al enviar, otorga el timbre y lo guarda en el álbum; el HUB lo muestra en la «pared de timbres».
- **Alcance:** cercano a Graffiti (comparte lienzo pixel y paleta); ~1 semana.

### 3.2 Cartel de Estación · Geométrica
- **Qué:** compones un afiche tipográfico sobre una grilla: eliges una palabra (ej. el nombre de tu estación), una familia de módulos (Polar, Túnel, Damero) y la letra se deforma con ellos. Paleta fija, 3 formatos.
- **Por qué:** Geométrica tiene dos herramientas «de textura» (Mosaicos, Audioreactiva) y ninguna de **tipografía**. Es lo más cercano a lo que la gente de diseño reconoce y lo que más se lleva a casa.
- **Alcance:** reutiliza `shared/c3-tunel.js` y los módulos de Mosaicos; ~1–1.5 semanas.

### 3.3 Recortes (kirigami de papel) · Orgánica
- **Qué:** doblas un papel (2, 4 u 8 pliegues) y recortas formas con el dedo; al abrir, la simetría revela el diseño. Colores de papel de la paleta, grano de papel.
- **Por qué:** es la versión táctil y rápida (2 minutos) de lo que Orgánica ya promete con «papel recortado»; contrasta con Teatro (animación) y Grabado (estampado).
- **HUB:** cada recorte se cuelga como banderín en la Plaza de la Estación (antes lo hacían las fajas del Telar).
- **Alcance:** simetría radial en canvas, sin dependencias nuevas; ~1 semana.

### Orden sugerido
1. Taller de Timbres (desbloquea la estación 4 y la pared del HUB).
2. Recortes (el más rápido de convertir en atracción visible).
3. Cartel de Estación (necesita decidir módulos y tipografía en Figma).

## 4. Decisiones que necesito del equipo
1. ¿Se aprueban los 4 personajes por lenguaje de la tabla 2.1 y su origen?
2. ¿Timbres con molde único de sello de goma (2.3)?
3. ¿Taller de Timbres reemplaza el «Hallazgo 3D» como estación 4?
4. ¿Cuál de las tres experiencias va primero?
