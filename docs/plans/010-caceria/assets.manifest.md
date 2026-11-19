# Assets · 010 Cacería de afiches

Miniaturas de los afiches para la vista Juego de la credencial. Salen de Figma (archivo `Yo9o3ZG2lyaEGcyxoxs89R`, página «Evento · Imprenta», sección `afiches` `1044:12794`), exportadas el 13 nov 2026 a 200 px de alto en WebP. Son **tentativos**: si el afiche cambia en Figma, se vuelve a exportar.

| Archivo | id | Afiche | Lenguaje | Nodo de Figma | Original | Miniatura |
|---|---|---|---|---|---|---|
| `credencial/public/figma/afiches/af01.webp` | `AF01` | Tejido («Libreta B · Portada v2 · tejido en semitono») | Geométrica | `1046:12810` | 1080 × 1440 | 150 × 200 |
| `credencial/public/figma/afiches/af02.webp` | `AF02` | Ven a ver («02 · Ven a ver · v2 copy») | Geométrica | `1191:222770` | 1080 × 1350 | 160 × 200 |
| `credencial/public/figma/afiches/af03.webp` | `AF03` | Sol («Libreta C · Portada v2 · sol en semitono») | Orgánica | `1046:16048` | 1080 × 1440 | 150 × 200 |
| `credencial/public/figma/afiches/af04.webp` | `AF04` | Ven a crear («03 · Ven a crear · v2 copy») | Orgánica | `1191:222479` | 1080 × 1350 | 160 × 200 |
| `credencial/public/figma/afiches/af05.webp` | `AF05` | Metro («Libreta Pixel · Portada · metro en tramado») | Pixel | `1046:17722` | 1080 × 1440 | 150 × 200 |
| `credencial/public/figma/afiches/af06.webp` | `AF06` | Ven a jugar («04B · Ven a jugar · versión graffiti») | Pixel | `1191:217482` | 1080 × 1350 | 160 × 200 |

El lenguaje de Tejido y Sol se dedujo del arte (semitono geométrico y sol orgánico): confirmar con el equipo.

**18 nov:** las miniaturas pasan a los afiches A3 (842 × 1191 en Figma; miniatura 300 × 424): AF02 `1191:222770`, AF03 pingüino `1242:18575`, AF04 `1191:222479`, AF05 `1046:17722`, AF06 `1191:217482`.

**19 nov:** vuelve `af01.webp` (AF01 Tejido): «01 · Afiche A3 · Geométrica · Portada semitono (tejido)», nodo `1306:17020` (fuera de la sección `afiches`, en la misma página), captura de Figma a 842 × 1191 reducida a 300 × 424 (Lanczos, WebP calidad 82). Es el afiche impreso que está en la sede; el 18 nov se había sacado por error.

## Sellos de la cacería (generados por script)
No van al repo: dependen del secreto de cada afiche, que vive solo en la base. Se generan con `npm --prefix credencial run sellos:afiches` (`credencial/scripts/sellos-afiches.mjs`) en `credencial/qr/` (ignorada por git), uno por afiche en el estilo de su lenguaje, más la matriz lisa de guía. `generado: true`. Reglas de diseño: plan 010 §2.
