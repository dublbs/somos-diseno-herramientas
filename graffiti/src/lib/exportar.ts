import { dibujarMuro } from './dibujar';
import type { Dibujo } from './pintura';

// Tarjeta 1080 × 1350 con la franja negra común (como el Fotomatón). La pared es horizontal (2:1): va entera,
// 1080 × 540, en cuatro franjas iguales de 270: cielo, pared (dos) y vereda; abajo, la franja común.
export async function crearTarjeta(muroId: string, d: Dibujo): Promise<Blob> {
  try { await document.fonts.load('800 66px "Bricolage Grotesque"'); await document.fonts.load('500 26px "DM Sans"'); } catch { /* respaldo */ }
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const x = c.getContext('2d')!;
  x.fillStyle = '#F4EEE3'; x.fillRect(0, 0, 1080, 1080);
  x.save(); x.translate(0, 270); dibujarMuro(x, 1080, 540, muroId, d); x.restore();
  x.fillStyle = '#4A453E'; x.fillRect(0, 810, 1080, 270); // la vereda
  x.fillStyle = '#5E584F'; for (let i = 0; i < 1080; i += 135) x.fillRect(i, 810, 4, 270);
  x.fillStyle = '#000'; x.fillRect(0, 802, 1080, 10); // la solera
  x.fillStyle = '#000'; x.fillRect(0, 1080, 1080, 270);
  x.fillStyle = '#F4EEE3'; x.font = '800 66px "Bricolage Grotesque", sans-serif';
  x.fillText('Graffiti', 56, 1172); x.fillText('y tags', 56, 1244);
  x.textAlign = 'right'; x.font = '500 26px "DM Sans", sans-serif'; x.fillStyle = '#BDB6AA';
  x.fillText('Somos Diseño · Semana del Diseño 2026', 1024, 1164);
  x.fillText('Lenguaje Pixel', 1024, 1204);
  x.fillStyle = '#F4EEE3'; x.font = '700 26px "DM Sans", sans-serif';
  x.fillText('INACAP Santiago Centro', 1024, 1244);
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('sin imagen'))), 'image/png'));
}

export function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
