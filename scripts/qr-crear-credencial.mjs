// Genera shared/qr-crear-credencial.svg: el QR que lleva a crear la credencial en el celular.
// Lo muestran el menú de las tablets (index.html, sin compilación) y el HUB «Estación» (hub-estacion/),
// que no tiene la librería qrcode. Apunta al sitio publicado, que es el que abre el celular de la gente.
// Uso: node scripts/qr-crear-credencial.mjs  (necesita `npm --prefix credencial install`).
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const QRCode = createRequire(raiz + 'credencial/package.json')('qrcode');
export const ENLACE = 'https://dublbs.github.io/somos-diseno-herramientas/credencial/dist/#/crear';

const svg = await QRCode.toString(ENLACE, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#FFFFFF' } });
writeFileSync(raiz + 'shared/qr-crear-credencial.svg', svg);
console.log('shared/qr-crear-credencial.svg →', ENLACE);
