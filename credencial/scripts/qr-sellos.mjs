// Genera los QR impresos de los 4 sellos.
// Uso: SITIO_URL=https://tu-sitio.vercel.app SELLO_TOKENS=t1,t2,t3,t4 npm run qr:sellos
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
  const svg = await QRCode.toString(url, { type: 'svg', margin: 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#F4EEE3' } });
  writeFileSync(`qr/sello-${i + 1}.svg`, svg);
  console.log(`qr/sello-${i + 1}.svg → ${url}`);
}
