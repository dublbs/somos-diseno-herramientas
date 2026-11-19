# 013 · Cacería: reconocer el afiche por su diseño

**Estado:** para probar en la prueba general del 18 nov. Si no pasa, se apaga y queda el QR del plan 010.
**Cambia:** el plan 010 §2 eligió un QR dentro del sello porque un detector propio era «más libre en lo visual pero mucho más riesgoso». Esto prueba un camino intermedio: la cámara reconoce el afiche completo por su diseño, sin código impreso, y el QR sigue funcionando en la misma pantalla.

## Cómo funciona
- `credencial/src/lib/reconocer-afiche.ts`, sin dependencias. Corre sobre el mismo `<video>` del lector de QR, en `#/afiches`.
- Compara la imagen de la cámara con las miniaturas que ya tiene la credencial (`public/figma/afiches/af01–af06.webp`):
  1. a varias escalas y encuadres;
  2. primero la **forma**, con correlación normalizada por canal, así que no importa si hay más o menos luz;
  3. después el **color** en una grilla de 4 × 4. La forma sola no basta: cualquier figura oscura centrada sobre fondo claro se parece al Sol.
- Da el afiche si el mejor puntaje es ≥ 0,34, le saca ≥ 0,12 al segundo y se repite en 3 cuadros seguidos (uno cada 450 ms). El mismo afiche no se vuelve a avisar antes de 8 s.
- La guía de la cámara pasa a tener la forma del afiche (3:4) y el texto dice «Encuadra el afiche completo, de frente».
- Base: `reconocer_afiche(p_codigo, p_afiche)` (migración `007-afiche-por-diseno.sql`) recibe el id público y timbra como `encontrar_afiche()`. Se apaga con `config.cacería_por_diseño = 'no'`; la credencial muestra entonces «apunta al sello o escribe su código».

## Cambios del 17 nov, después de la primera prueba en el celular
- **No reconocía:** muchos celulares entregan el video en horizontal y el visor muestra solo el centro (object-fit: cover). Ahora se compara solo la zona visible del video.
- **Solo reconocer:** la pantalla de la cacería ya no tiene campo de código; basta apuntar al afiche. El QR del sello se sigue leyendo en silencio.
- **Diagnóstico:** `#/afiches?ver` muestra en vivo los dos afiches más parecidos y sus puntajes, para ajustar el umbral con los impresos.

- **Tejido (AF01) no se reconocía en pantalla:** los negros de una pantalla o una cámara se ven azulados y la prueba de color lo descartaba. Ahora la forma pesa más la luz que los canales de color, los bloques oscuros casi no cuentan en el color y se perdona un tinte general leve de la luz. Banco de condiciones duras (afiche al 40–90 % de la guía; luz de pantalla, cálida y oscura; ruido y compresión): 119 de 120. Banco anterior: 78 de 78; 0 de 85 no-afiches aceptados.

- **18 nov · afiches A3 actualizados:** las miniaturas salen de Figma (sección «afiches», 1044:12794): AF02 Ven a ver, AF03 Diseño con raíces (pingüino, reemplaza al Sol), AF04 Ven a crear, AF05 Metro, AF06 Ven a jugar. **Tejido (AF01) salió.** La prueba de color vuelve a ser un promedio pesado (lo oscuro pesa menos, pero un afiche casi negro como Metro se juzga por sus partes de color): con el ajuste anterior, piezas negras sobre fondo claro pasaban por Metro. Con los 5 afiches nuevos: condiciones duras 99 de 100, banco normal 65 de 65, no-afiches 0 de 87 (incluidos el Tejido y el Sol viejos).

- **19 nov · vuelve el 01 Tejido (A3):** está impreso y colgado, pero el 18 nov salió de la lista: la cámara no podía reconocerlo y, con luz fría, lo daba por Diseño con raíces (el pingüino). Vuelve con su miniatura A3 (Figma `1306:17020`). Además, la miniatura se compara «como papel»: su negro sube a 20 (de 255) antes de armar las plantillas, porque el negro impreso y fotografiado nunca es negro y el rosado del semitono, promediado con ese negro grisáceo, quedaba fuera de la prueba de color. Banco nuevo de 480 fotos simuladas del A3 impreso (por cuadro, sin contar los 3 seguidos) + 132 no-afiches: el 01 pasa de 0 de 80 (16 dados por el pingüino) a 66 de 80 (2), los otros cinco de 384 a 392 de 400, y los no-afiches de 132 a 131 de 132 rechazados (pasa una foto del Sol viejo, que ya no está impreso). Bitácora: `docs/qa/caceria-afiche-01.md`.

## Pruebas (simuladas)
- 78 fotos simuladas de los 6 afiches: de frente, más grande, más chico, corrido, inclinado 20° y 35°, desde abajo, girado 8°, poca luz, luz cálida, desenfocado, reflejo y en la pared con otros afiches. Reconoce 77 sin confundir ninguno; Tejido con muy poca luz queda bajo el umbral.
- 85 imágenes que no son afiches (piezas de las experiencias, personajes, estampillas, pared): ninguna pasa.
- De punta a punta con cámara falsa en modo demo: el Sol y Ven a jugar suman «¡Afiche encontrado! 2 de 3».
- Página suelta para probar con fotos desde el celular: artefacto «Prueba · reconocer afiches».

## Riesgos
- **Trampa:** basta conocer el id del afiche (o fotografiarlo en otra pantalla) para sumarlo sin estar frente a él. Se acepta para un premio de bajo riesgo; si se abusa, se apaga en `config`.
- **Papel real:** las pruebas compararon contra las mismas imágenes. Falta el afiche impreso, la luz de la sede y celulares reales.
- **Afiches nuevos:** si cambia un afiche, hay que reemplazar su miniatura en `public/figma/afiches/` y volver a construir.
- **Celulares lentos:** cada análisis cuesta ~100 ms en un computador. Si traba la cámara, subir `CADA_MS`.

## Para activarlo
1. Correr `shared/supabase/migraciones/007-afiche-por-diseno.sql` en el SQL Editor de somos-diseno.
2. Mergear el PR (la credencial se sirve desde `main` en GitHub Pages).
3. Probar en la prueba general del 18 nov: los 6 afiches impresos, iPhone y Android, de frente y de lado, y cosas que no son afiches.
