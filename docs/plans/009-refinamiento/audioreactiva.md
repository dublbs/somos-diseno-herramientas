# Estación Audioreactiva · consola de VJ (TouchDesigner / Resolume)

Estado: 5 escenas (Túnel, Acordeón, Caleidoscopio, Tejido, Escalera), consola con 6 canales (Volumen, Graves, Medios,
Agudos, Tono, Golpe) que se silencian, medidores, sensibilidad, micrófono o música de demo, foto y loop de 6 s con
«Llévatela» (video por QR).
Medido: sin scroll ni controles fuera en las 6 resoluciones. La UI ya parece una consola de VJ: es la mejor lograda en
el símil.

## Hallazgos
| # | Gravedad | Qué | Dónde |
|---|---|---|---|
| A1 | Media | «CALEIDOSCOPIO» se sale de su tarjeta en 1180 × 820 (ronda 2: resuelto, la escena va en la barra flotante) | Panel «Escena» |
| A2 | Media | Los códigos de las escenas («C3 · M3», «C10 · C8 · C6») no le dicen nada a la persona | Panel «Escena» y barra superior |
| A3 | Media | Los canales que una escena no usa muestran «—» y se ven apagados: parece que no funcionan | Consola |
| A4 | Pendiente | El feedback dice que algunas escenas casi no reaccionan. No se puede medir con micrófono falso (tarea T4) | Todas las escenas |

## Propuestas
**Funcionalidad (T4)**
- P1 · Medir cada escena con voz, aplausos y música a 1 m de la tablet; ajustar sensibilidad, suavizado y qué banda
  mueve qué. Una escena que con música ambiente no se mueve, se corrige o sale.
- P2 · **Umbral visible** en cada medidor (una marca): cuando la barra la pasa, el canal «dispara». Es lo que hacen las
  consolas de VJ y explica por qué a veces no pasa nada.

**Experiencia**
- P3 · En vez de códigos, una línea por escena con lo que hace: «Túnel: los graves laten, el volumen acelera» (A2).
- P4 · Canales sin uso en la escena, ocultos o con «no se usa en esta escena» (A3).

**UI**
- P5 · Nombres de escena que quepan (A1): letra más chica o la tarjeta en 2 líneas.

## Ronda 2 (plan 012, A2): medición escena × estilo
Sin micrófono: la estación toca 5 estilos generados con Web Audio y la consola pasó a pads táctiles sobre el marco v2,
así que A1–A3 ya no aplican y A4 se midió aquí. Medido el 17 nov en Chromium sin altavoz (Playwright, leyendo el
analizador del `AudioContext` con `?medir=1`). **Nadie ha escuchado los 5 estilos todavía: falta que una persona los oiga
en la tablet** (las cifras dicen que suenan parejo y sin saturar, no si suenan bien).

**Niveles por estilo** (10 s por estilo, tempo Medio). RMS y pico de la salida; «Saturadas»: muestras en ±1. Las
columnas Bombo…Graves dicen qué parte del tiempo ese rasgo pasa de 0,15 (lo que la imagen ve encendido). En el peor caso
(tempo Rápido, Bum y Chas 4 veces por segundo y eco al máximo) el pico llega a −3,5 dBFS y el RMS a −14,1, sin muestras
saturadas.

| Estilo | RMS (dBFS) | Pico (dBFS) | Saturadas | Golpes/s | Notas mel./s | Bombo | Caja | Hi-hat | Agudos | Graves |
|---|---|---|---|---|---|---|---|---|---|---|
| Lo-Fi | -16,8 | -3,8 | 0 | 1,1 | 0,7 | 20 % | 17 % | 22 % | 75 % | 100 % |
| Synthwave | -17,9 | -3,8 | 0 | 1,7 | 1,2 | 25 % | 22 % | 56 % | 100 % | 100 % |
| Button Mash | -17,3 | -3,6 | 0 | 2,4 | 3,0 | 40 % | 29 % | 36 % | 100 % | 100 % |
| It's Friday | -18,6 | -3,4 | 0 | 1,7 | 1,5 | 40 % | 28 % | 44 % | 100 % | 100 % |
| Ambient | -16,5 | -5,5 | 0 | 0,4 | 1,4 | 13 % | 7 % | 20 % | 69 % | 100 % |

Lectura: los golpes (bombo y caja) mandan en Button Mash e It's Friday y casi no existen en Ambient (0,4 por segundo);
ahí la imagen se mueve con la melodía y los acordes. Los agudos crudos de Lo-Fi y Ambient están ~12 dB bajo los otros,
pero el analizador normaliza cada banda contra su pico reciente y siguen activos el 69–75 % del tiempo.

**Movimiento escena × estilo.** Diferencia media entre cuadros (lienzo reducido a 128 × 128, cada 66 ms, 6 s), en % del
rango de color; entre paréntesis los percentiles 10 y 90 (lo quieto y lo que golpea). «Sin música»: las 4 pistas
apagadas.

| Escena | Lo-Fi | Synthwave | Button Mash | It's Friday | Ambient | Sin música |
|---|---|---|---|---|---|---|
| Túnel | 14,5 (7,6–23,4) | 14,2 (7,5–23,5) | 20,1 (12,3–31,5) | 16,1 (8,7–29,0) | 13,0 (8,1–19,5) | 5,8 |
| Acordeón | 12,9 (10,2–15,2) | 15,2 (12,5–17,2) | 15,8 (13,1–17,5) | 16,4 (13,4–18,6) | 12,8 (10,6–14,3) | 0,5 |
| Caleidoscopio | 17,6 (6,2–34,0) | 16,0 (6,5–27,1) | 19,4 (6,7–34,9) | 14,5 (8,7–21,9) | 11,7 (7,1–21,4) | 2,9 |
| Tejido | 3,3 (0,6–9,8) | 4,2 (1,4–12,5) | 5,8 (1,8–14,1) | 5,6 (2,1–13,2) | 3,4 (0,5–12,2) | 0,0 |
| Escalera | 10,3 (3,1–18,1) | 11,9 (5,3–20,5) | 16,1 (7,1–24,8) | 15,5 (7,5–25,3) | 8,1 (2,6–14,7) | 2,4 |

Todas las escenas se mueven con cada estilo y bastante más que sin música. Tejido mide menos porque son figuras finas
sobre fondo liso (en las capturas se ve el cambio); con este relevo se agrandaron sus celdas, respira con el volumen y
cada nota suelta una onda (antes: 2,0–4,2 y 26–37 % de cuadros casi quietos con Lo-Fi y Ambient; ahora 3–8 %).

**Qué mueve cada pista.** Movimiento con una pista apagada (3 s) y su cambio contra «Todas». **↓** = baja 20 % o más.

| Escena · estilo | Todas | sin Batería | sin Bajo | sin Acordes | sin Melodía |
|---|---|---|---|---|---|
| Túnel · Lo-Fi | 14,5 | 9,6 (−33 %) **↓** | 15,2 (+5 %) | 14,8 (+3 %) | 10,0 (−31 %) **↓** |
| Túnel · Synthwave | 14,2 | 8,1 (−43 %) **↓** | 13,4 (−6 %) | 17,3 (+22 %) | 13,0 (−8 %) |
| Túnel · Button Mash | 20,1 | 9,3 (−54 %) **↓** | 17,7 (−12 %) | 19,7 (−2 %) | 15,2 (−24 %) **↓** |
| Túnel · It's Friday | 16,1 | 8,7 (−46 %) **↓** | 14,6 (−9 %) | 13,8 (−15 %) | 18,6 (+15 %) |
| Túnel · Ambient | 13,0 | 8,7 (−33 %) **↓** | 12,1 (−7 %) | 16,1 (+24 %) | 12,2 (−6 %) |
| Acordeón · Lo-Fi | 12,9 | 11,3 (−13 %) | 12,9 (−0 %) | 12,5 (−3 %) | 13,3 (+3 %) |
| Acordeón · Synthwave | 15,2 | 13,5 (−11 %) | 13,6 (−11 %) | 15,4 (+1 %) | 15,4 (+1 %) |
| Acordeón · Button Mash | 15,8 | 14,1 (−10 %) | 14,3 (−9 %) | 14,3 (−9 %) | 18,3 (+16 %) |
| Acordeón · It's Friday | 16,4 | 14,0 (−15 %) | 16,8 (+2 %) | 15,8 (−4 %) | 17,9 (+9 %) |
| Acordeón · Ambient | 12,8 | 10,7 (−17 %) | 11,9 (−7 %) | 11,8 (−8 %) | 13,3 (+3 %) |
| Caleidoscopio · Lo-Fi | 17,6 | 12,9 (−27 %) **↓** | 18,7 (+6 %) | 9,9 (−44 %) **↓** | 11,3 (−36 %) **↓** |
| Caleidoscopio · Synthwave | 16,0 | 13,0 (−19 %) | 14,7 (−8 %) | 12,3 (−23 %) **↓** | 32,5 (+102 %) |
| Caleidoscopio · Button Mash | 19,4 | 22,0 (+13 %) | 12,3 (−37 %) **↓** | 18,4 (−5 %) | 17,4 (−10 %) |
| Caleidoscopio · It's Friday | 14,5 | 15,9 (+10 %) | 10,4 (−28 %) **↓** | 22,8 (+57 %) | 13,9 (−4 %) |
| Caleidoscopio · Ambient | 11,7 | 8,8 (−24 %) **↓** | 14,0 (+20 %) | 10,6 (−9 %) | 8,8 (−25 %) **↓** |
| Tejido · Lo-Fi | 3,3 | 2,0 (−40 %) **↓** | 2,9 (−13 %) | 2,8 (−14 %) | 2,1 (−35 %) **↓** |
| Tejido · Synthwave | 4,2 | 2,3 (−45 %) **↓** | 3,8 (−9 %) | 4,3 (+3 %) | 3,2 (−23 %) **↓** |
| Tejido · Button Mash | 5,8 | 4,3 (−27 %) **↓** | 5,5 (−6 %) | 6,2 (+7 %) | 4,8 (−18 %) |
| Tejido · It's Friday | 5,6 | 3,7 (−35 %) **↓** | 5,7 (+1 %) | 5,7 (+1 %) | 4,5 (−20 %) |
| Tejido · Ambient | 3,4 | 2,6 (−24 %) **↓** | 3,4 (+2 %) | 3,4 (+2 %) | 1,7 (−51 %) **↓** |
| Escalera · Lo-Fi | 10,3 | 6,2 (−40 %) **↓** | 10,0 (−2 %) | 10,2 (−0 %) | 11,1 (+8 %) |
| Escalera · Synthwave | 11,9 | 7,8 (−35 %) **↓** | 10,6 (−11 %) | 11,9 (−0 %) | 11,6 (−3 %) |
| Escalera · Button Mash | 16,1 | 12,1 (−25 %) **↓** | 14,3 (−11 %) | 16,4 (+2 %) | 17,9 (+11 %) |
| Escalera · It's Friday | 15,5 | 10,5 (−33 %) **↓** | 12,7 (−18 %) | 15,3 (−2 %) | 13,1 (−16 %) |
| Escalera · Ambient | 8,1 | 5,5 (−32 %) **↓** | 7,5 (−8 %) | 7,4 (−8 %) | 5,4 (−33 %) **↓** |

Lectura: la **batería** es la que más mueve en todas las escenas (−25 a −54 % al apagarla), salvo Caleidoscopio con
Button Mash e It's Friday, donde manda el bajo. La **melodía** pesa en Túnel, Tejido y Caleidoscopio con los estilos
lentos. El **bajo** y los **acordes** cambian la forma (ondulación, torsión, inclinación, muescas) más que la cantidad de
movimiento: al apagarlos, el analizador reescala las otras bandas y el total casi no baja (y a veces sube). Las cifras de
3 s de Caleidoscopio son ruidosas porque la caja invierte todo el damero.

**Decisión abierta:** si «apaga el bajo o los acordes» debe notarse más, hay que dejar de normalizar cada banda contra su
pico (o normalizar contra el pico de toda la mezcla) para que una pista apagada deje su hueco; cambia cómo responde todo,
por eso no se hizo sin escucharlo.

