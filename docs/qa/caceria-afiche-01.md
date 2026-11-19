# QA · Cacería: el afiche 01 (Tejido) no se reconoce · 19 nov 2026

Reporte del equipo, durante el evento: «Tenemos problemas en cacería de afiches con el diseño 01 · Afiche A3 · Geométrica · Portada semitono (tejido)». La cámara de `#/afiches` no lo reconoce o lo confunde con otro.
Tareas que salen de aquí: [`docs/tasks/017-correcciones-caceria-01.md`](../tasks/017-correcciones-caceria-01.md).

## Cómo se reconoce un afiche (plan 013)
- `credencial/src/lib/reconocer-afiche.ts` compara cada cuadro de la cámara (zona visible del visor, reducida a 480 px) con la miniatura de cada afiche de `credencial/src/lib/afiches.ts` (`public/figma/afiches/afNN.webp`, 300 × 424).
- **Forma:** correlación normalizada de luz, rojo-verde y amarillo-azul (pesos 1 · 0,35 · 0,35) en una grilla de 36 × 48, a 5 escalas, 3 tamaños de guía y todos los corrimientos.
- **Color:** cromaticidad en una grilla de 4 × 4 sobre el mejor encuadre; las zonas oscuras pesan menos y se perdona un tinte general de hasta 0,05.
- **Puntaje:** forma × (0,4 + 0,6 × color). Pasa con ≥ 0,34, 0,12 de ventaja sobre el segundo y 3 cuadros seguidos (uno cada 450 ms).

## Causa
1. **El 01 no estaba en la lista.** El 18 nov (commit `0ec209b`, «la cacería usa los 5 afiches A3») se sacó AF01 Tejido con su miniatura: la sección `afiches` de Figma (`1044:12794`) ya no lo tiene, pero el A3 existe en la misma página (`1306:17020`, «01 · Afiche A3 · Geométrica · Portada semitono (tejido)») y está impreso en la sede. Sin plantilla, la cámara no puede reconocerlo nunca, y cuando la pared se ve azulada (luz fría) un afiche negro sobre pared clara se parece al pingüino (AF03, figura oscura sobre celeste) y lo da por ese.
2. **El negro impreso no es negro.** Con la miniatura A3 de vuelta, el 01 seguía fallando 1 de cada 3 fotos: la cámara promedia los puntos rosados del semitono con el negro del papel (grisáceo, nunca 0) y ve un rosado más apagado que el de la miniatura (rosado sobre negro puro). La prueba de color le daba 0,67 en vez de ~0,9. Sin simular el papel daba 0,89. Los afiches sobre fondo claro casi no lo notan.
3. El moiré o la pérdida del semitono no son la causa: con el afiche desenfocado 9 px (semitono plano) o muestreado sin suavizar (moiré) el puntaje queda igual (0,82–0,84), porque el reconocedor ya promedia por bloques grandes.

## Arreglo (`credencial/`)
- `afiches.ts`: vuelve `AF01 · Tejido · Geométrica` y `public/figma/afiches/af01.webp` (captura del A3 `1306:17020` de Figma, 300 × 424).
- `reconocer-afiche.ts`: la miniatura se compara «como papel» (`NEGRO_PAPEL = 20`: el negro sube a 20 de 255 antes de armar las plantillas). No cambia la forma (correlación normalizada), solo el color de las zonas oscuras. Se probaron 0, 20, 30 y 40, y también suavizar la grilla: 20 fue lo mejor sin dejar pasar no-afiches.
- `Juego.tsx` y `styles.css`: el álbum de la cacería muestra los 6 afiches en una fila (columnas automáticas en vez de 5 fijas).
- La base no cambia: `001-afiches.sql` ya tiene `AF01` activo y `reconocer_afiche()` lo acepta (ver «Base» abajo).

## Pruebas (simuladas)
Scripts y bancos fuera del repo (scratchpad de la sesión). Fotos de un celular apuntando al A3 impreso, generadas desde las capturas de Figma a 842 × 1191: papel (negro levantado, algo desaturado), pared lisa de 5 colores, afiche al 38–75 % del ancho, corrido, girado hasta 8°, trapecio y de costado hasta 15–18 %, desenfoque 0–5 px, balance cálido y frío, exposición 0,65–1,35, viñeta, reflejo, ruido, JPEG 40–85 y, en la mitad, muestreo sin suavizar (moiré del semitono). No-afiches: 50 capturas de pantallas del repo, 6 fotos del Sol viejo y 10 paredes vacías. Se pasan por `prepararAfiches()` y `reconocer()` del archivo real (Node, sin React). Cifras por cuadro: en la app hacen falta 3 cuadros seguidos.

| Afiche | Antes (5 plantillas) | Después (6 plantillas + papel) |
|---|---|---|
| AF01 Tejido | 0 de 80 · 16 dado por AF03 | **66 de 80** · 2 dado por AF03 · 12 sin reconocer |
| AF02 Ven a ver | 80 de 80 | 80 de 80 |
| AF03 Diseño con raíces | 80 de 80 | 80 de 80 |
| AF04 Ven a crear | 79 de 80 | 80 de 80 |
| AF05 Metro | 72 de 80 | 77 de 80 |
| AF06 Ven a jugar | 73 de 80 | 75 de 80 |
| No-afiches rechazados | 132 de 132 | 131 de 132 (pasa 1 foto del Sol viejo como AF03) |

Banco por factores (de frente, un factor a la vez, 23 por afiche): antes AF01 0 de 23 (5 dados por AF03, todos con luz fría); después 20 de 23, sin confusiones. Los 3 que quedan son luz fría fuerte con el afiche chico en el cuadro: el pingüino queda a menos de 0,12 y no se da ninguno (falla segura; acercándose, pasa). Los otros cinco: 23 de 23 antes y después.

De punta a punta en Chromium (Playwright) con cámara falsa que muestra una foto simulada del A3 impreso, modo demo: el 01 se anota como AF01 y el 03 como AF03 («¡Timbre Cacería!» al tercer afiche).

Pantalla: `#/juego` con los 6 afiches sin scroll en 390 × 844, 412 × 915 y 360 × 740 (ranuras de 45–56 px de ancho, en una fila).

## Sin comprobar
- Un celular real apuntando al A3 impreso, con la luz de la sede (sobre todo luz fría o fluorescente).
- Que en `somos-diseno` el afiche `AF01` siga con `activo = true` (no hay registro de que se haya apagado).
- Costo por cuadro con 6 plantillas en un celular lento (+20 % frente a 5).
