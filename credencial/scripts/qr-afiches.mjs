// Genera los QR impresos de los afiches de la cacería (plan 008).
// Los secretos viven en Supabase, nunca en el repo. Sácalos en el SQL Editor con:
//   select string_agg(id || ':' || secreto, ',' order by id) from public.afiches where activo;
// Uso: SITIO_URL=https://dublbs.github.io/somos-diseno-herramientas AFICHES=GM01:K7QF2A,GM02:… npm run qr:afiches
// Bajo cada QR se imprime el secreto: sirve para escribirlo si la cámara no lee.
// En modo demo (sin Supabase) el secreto es el id del afiche: AFICHES=PM02:PM02,GM01:GM01,…
import { mkdirSync, writeFileSync } from 'node:fs';
import QRCode from 'qrcode';

const sitio = (process.env.SITIO_URL || '').replace(/\/+$/, '');
const afiches = (process.env.AFICHES || '').split(',').map(par => par.trim().split(':')).filter(p => p.length === 2 && p[0] && p[1]);
if (!sitio || !afiches.length) {
  console.error('Falta SITIO_URL o AFICHES (id:secreto separados por coma).');
  process.exit(1);
}
mkdirSync('qr', { recursive: true });
for (const [id, secreto] of afiches) {
  const url = `${sitio}/credencial/dist/#/afiche/${encodeURIComponent(secreto.toUpperCase())}`;
  const qr = await QRCode.toString(url, { type: 'svg', margin: 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#F4EEE3' } });
  const lado = Number(qr.match(/viewBox="0 0 (\d+) /)[1]);
  const etiqueta = `AFICHE · ${secreto.toUpperCase()}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado + 6}">`
    + `<rect width="${lado}" height="${lado + 6}" fill="#F4EEE3"/>`
    + qr.replace(/^<svg[^>]*>/, `<svg x="0" y="0" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">`)
    + `<text x="${lado / 2}" y="${lado + 3.5}" text-anchor="middle" font-family="monospace" font-weight="700" font-size="3">${etiqueta}</text></svg>`;
  writeFileSync(`qr/afiche-${id}.svg`, svg);
  console.log(`qr/afiche-${id}.svg → ${url}`);
}
