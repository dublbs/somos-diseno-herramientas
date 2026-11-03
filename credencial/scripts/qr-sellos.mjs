// Genera los QR impresos de los 4 sellos.
// Uso: SITIO_URL=https://tu-sitio.vercel.app SELLO_TOKENS=K7QF,M2XA,P9RT,Z4HB npm run qr:sellos
// Bajo cada QR se imprime el código: sirve para sellar escribiéndolo (iPhone, sin cámara, claude.ai).
import { mkdirSync, writeFileSync } from 'node:fs';
import QRCode from 'qrcode';

const sitio = (process.env.SITIO_URL || '').replace(/\/+$/, '');
const tokens = (process.env.SELLO_TOKENS || '').split(',').map(t => t.trim());
if (!sitio || tokens.length !== 4 || tokens.some(t => !t)) {
  console.error('Falta SITIO_URL o los 4 SELLO_TOKENS (separados por coma, en orden 1..4).');
  process.exit(1);
}
mkdirSync('qr', { recursive: true });
for (let i = 0; i < 4; i++) {
  const url = `${sitio}/credencial/dist/#/sello/${i + 1}?t=${encodeURIComponent(tokens[i])}`;
  const qr = await QRCode.toString(url, { type: 'svg', margin: 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#F4EEE3' } });
  const lado = Number(qr.match(/viewBox="0 0 (\d+) /)[1]);
  const etiqueta = `SELLO ${i + 1} · ${tokens[i].toUpperCase()}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado + 6}">`
    + `<rect width="${lado}" height="${lado + 6}" fill="#F4EEE3"/>`
    + qr.replace(/^<svg[^>]*>/, `<svg x="0" y="0" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">`)
    + `<text x="${lado / 2}" y="${lado + 3.5}" text-anchor="middle" font-family="monospace" font-weight="700" font-size="3">${etiqueta}</text></svg>`;
  writeFileSync(`qr/sello-${i + 1}.svg`, svg);
  console.log(`qr/sello-${i + 1}.svg → ${url}`);
}
