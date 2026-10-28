import { porId } from '../data/marcos';
import type { Tinta } from '../data/tintas';
import type { Cara } from './cara';
import { componer, type Fuente } from './trama';

// Tarjeta final 1080×1350: marco con la foto en trama + franja negra con el texto.
export async function exportarTarjeta(marcoId: string, src: Fuente, celda: number, tinta: Tinta, cara: Cara | null): Promise<Blob> {
  const m = porId(marcoId);
  try { await document.fonts.load('800 64px "Bricolage Grotesque"'); await document.fonts.load('500 26px "DM Sans"'); } catch { /* usa la fuente de respaldo */ }
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d')!;
  componer(x, 1080, marcoId, src, celda, tinta, cara);
  x.fillStyle = '#000'; x.fillRect(0, 1080, 1080, 270);
  x.fillStyle = '#F4EEE3'; x.font = '800 66px "Bricolage Grotesque", sans-serif';
  x.fillText('Todas las formas', 56, 1172); x.fillText('del diseño', 56, 1244);
  x.textAlign = 'right'; x.font = '500 26px "DM Sans", sans-serif'; x.fillStyle = '#BDB6AA';
  x.fillText('Somos Diseño · Semana del Diseño 2026', 1024, 1164);
  x.fillText(m.visual + ' · ' + m.code + ' ' + m.name, 1024, 1204);
  x.fillStyle = '#F4EEE3'; x.font = '700 26px "DM Sans", sans-serif';
  x.fillText('INACAP Santiago Centro', 1024, 1244);
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('sin imagen'))), 'image/png'));
}

export const nombreArchivo = (marcoId: string) => {
  const m = porId(marcoId);
  return 'fotomaton-somos-diseno-' + m.visual.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '-' + m.code.toLowerCase() + '.png';
};
