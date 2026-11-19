import { porId } from '../data/marcos';
import type { Tinta } from '../data/tintas';
import type { Cara } from './cara';
import { componer, type Fuente, type OpcionesComponer } from './trama';

// Tarjeta final 1080×1350: marco con la foto en trama + franja negra con el texto.
export async function exportarTarjeta(marcoId: string, src: Fuente, celda: number, tinta: Tinta, cara: Cara | null, op: OpcionesComponer = {}): Promise<Blob> {
  const m = porId(marcoId);
  try { await document.fonts.load('800 64px "Bricolage Grotesque"'); await document.fonts.load('500 26px "DM Sans"'); } catch { /* usa la fuente de respaldo */ }
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d')!;
  componer(x, 1080, marcoId, src, celda, tinta, cara, op);
  x.fillStyle = '#000'; x.fillRect(0, 1080, 1080, 270);
  // El título es largo: se achica hasta no chocar con la columna derecha (antes «Todas las formas» pisaba
  // «Somos Diseño · Semana del Diseño 2026»). Mismo margen de 32 px entre columnas, desde 66 px hacia abajo.
  const derecha = ['Somos Diseño · Semana del Diseño 2026', m.visual + ' · ' + m.code + ' ' + m.name];
  x.font = '500 26px "DM Sans", sans-serif';
  const libre = 1024 - Math.max(...derecha.map(t => x.measureText(t).width)) - 32 - 56;
  let tam = 66;
  const titulo = ['Todas las formas', 'del diseño'];
  for (; tam > 40; tam -= 2) {
    x.font = `800 ${tam}px "Bricolage Grotesque", sans-serif`;
    if (Math.max(...titulo.map(t => x.measureText(t).width)) <= libre) break;
  }
  x.fillStyle = '#F4EEE3';
  x.fillText(titulo[0], 56, 1172); x.fillText(titulo[1], 56, 1244);
  x.textAlign = 'right'; x.font = '500 26px "DM Sans", sans-serif'; x.fillStyle = '#BDB6AA';
  x.fillText(derecha[0], 1024, 1164);
  x.fillText(derecha[1], 1024, 1204);
  x.fillStyle = '#F4EEE3'; x.font = '700 26px "DM Sans", sans-serif';
  x.fillText('INACAP Santiago Centro', 1024, 1244);
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('sin imagen'))), 'image/png'));
}

export const nombreArchivo = (marcoId: string) => {
  const m = porId(marcoId);
  return 'fotomaton-somos-diseno-' + m.visual.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '-' + m.code.toLowerCase() + '.png';
};
