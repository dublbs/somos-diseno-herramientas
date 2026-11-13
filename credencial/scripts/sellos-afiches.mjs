// Genera el sello de la cacería de cada afiche (plan 010 §2): una matriz QR 1-H (21 × 21 módulos) con el texto
// SDA:<SECRETO>, dibujada con el lenguaje del afiche. La lee la cámara de la credencial (BarcodeDetector o jsQR).
// Reglas probadas: las 3 esquinas guardan su proporción (anillo 7 × 7 y centro 3 × 3), los módulos vecinos se tocan,
// tinta oscura sobre fondo claro y 3 módulos de margen liso. La matriz no se redibuja a mano: cada punto es dato.
//
// Los secretos viven solo en Supabase. Sácalos en el SQL Editor con:
//   select string_agg(id || ':' || secreto || ':' || lenguaje, ',' order by id) from public.afiches where activo;
// Uso: AFICHES=AF01:K7QF2A:Geométrica,AF05:… npm run sellos:afiches   → qr/sello-AF01.svg y qr/sello-AF01-guia.svg
// Modo demo: el secreto es el id (AFICHES=AF05:AF05:Pixel).
import { mkdirSync, writeFileSync } from 'node:fs';
import QRCode from 'qrcode';

const afiches = (process.env.AFICHES || '').split(',').map(t => t.trim().split(':')).filter(p => p.length === 3 && p.every(Boolean));
if (!afiches.length) { console.error('Falta AFICHES (id:secreto:lenguaje separados por coma).'); process.exit(1); }

const MARGEN = 3; // módulos de fondo liso alrededor
const anillo = (x, y) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5z`;
const ESTILOS = {
  // Pixel: módulo cuadrado lleno.
  Pixel: { modulo: (x, y) => `<rect x="${x}" y="${y}" width="1" height="1"/>`, esquina: (x, y) => `<path fill-rule="evenodd" d="${anillo(x, y)}"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>` },
  // Geométrica: octágono (cuadrado con esquinas cortadas); toca a sus vecinos por los lados.
  Geométrica: { modulo: (x, y) => `<path d="M${x + .22} ${y}h.56l.22 .22v.56l-.22 .22h-.56l-.22-.22v-.56z"/>`, esquina: (x, y) => `<path fill-rule="evenodd" d="${anillo(x, y)}"/><path d="M${x + 2.4} ${y + 2}h2.2l.4 .4v2.2l-.4 .4h-2.2l-.4-.4v-2.2z"/>` },
  // Orgánica: punto de semitono que se toca con sus vecinos; esquinas redondeadas.
  Orgánica: {
    modulo: (x, y) => `<circle cx="${x + .5}" cy="${y + .5}" r=".56"/>`,
    esquina: (x, y) => `<path fill-rule="evenodd" d="M${x + 1.6} ${y}h3.8a1.6 1.6 0 0 1 1.6 1.6v3.8a1.6 1.6 0 0 1-1.6 1.6h-3.8a1.6 1.6 0 0 1-1.6-1.6v-3.8a1.6 1.6 0 0 1 1.6-1.6zM${x + 1.9} ${y + 1}a.9 .9 0 0 0-.9 .9v3.2a.9 .9 0 0 0 .9 .9h3.2a.9 .9 0 0 0 .9-.9v-3.2a.9 .9 0 0 0-.9-.9z"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx=".9"/>`,
  },
  // Guía lisa para el diseño: la matriz tal cual, módulo por módulo.
  guia: { modulo: (x, y) => `<rect x="${x}" y="${y}" width="1" height="1"/>`, esquina: (x, y) => `<path fill-rule="evenodd" d="${anillo(x, y)}"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>` },
};

function sello(texto, estilo, etiqueta) {
  const q = QRCode.create(texto, { errorCorrectionLevel: 'H' });
  const n = q.modules.size;
  if (n !== 21) throw new Error(`«${texto}» no cabe en 21 × 21 módulos (salió ${n}); usa un secreto de 6 caracteres.`);
  const esquina = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const e = ESTILOS[estilo], L = n + 2 * MARGEN, alto = L + 4;
  let dibujo = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.modules.get(r, c) && !esquina(r, c)) dibujo += e.modulo(c + MARGEN, r + MARGEN);
  for (const [r, c] of [[0, 0], [0, n - 7], [n - 7, 0]]) dibujo += e.esquina(c + MARGEN, r + MARGEN);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${alto}"><rect width="${L}" height="${alto}" fill="#F4EEE3"/>`
    + `<g fill="#000000">${dibujo}</g>`
    + `<text x="${L / 2}" y="${L + 2}" text-anchor="middle" font-family="monospace" font-weight="700" font-size="2">${etiqueta}</text></svg>`;
}

mkdirSync('qr', { recursive: true });
for (const [id, secreto, lenguaje] of afiches) {
  if (!ESTILOS[lenguaje] || lenguaje === 'guia') { console.error(`${id}: lenguaje desconocido «${lenguaje}» (Pixel, Geométrica u Orgánica).`); process.exit(1); }
  const texto = `SDA:${secreto.toUpperCase()}`;
  writeFileSync(`qr/sello-${id}.svg`, sello(texto, lenguaje, secreto.toUpperCase()));
  writeFileSync(`qr/sello-${id}-guia.svg`, sello(texto, 'guia', secreto.toUpperCase()));
  console.log(`qr/sello-${id}.svg (${lenguaje}) → ${texto}`);
}
