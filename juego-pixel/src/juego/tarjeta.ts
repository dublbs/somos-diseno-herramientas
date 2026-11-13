import type { Estado } from './motor';
import { GRIS, BOLA, sprite } from './sprites';

// Tarjeta 1080 × 1350 con la franja negra común: el personaje, el puntaje y lo que hizo en la partida.
export async function crearTarjeta(e: Estado, personaje: HTMLImageElement | null): Promise<Blob> {
  try { await document.fonts.load('700 120px "Silkscreen"'); await document.fonts.load('800 66px "Bricolage Grotesque"'); await document.fonts.load('500 26px "DM Sans"'); } catch { /* respaldo */ }
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const x = c.getContext('2d')!;
  x.imageSmoothingEnabled = false;
  // Fondo: calles de la ciudad en franjas (vereda, calle, plaza, vías), como el tablero.
  const franjas = ['#CFC6B8', '#3D3A36', '#3D3A36', '#5DAA6E', '#77726A', '#CFC6B8', '#3D3A36', '#CFC6B8'];
  franjas.forEach((t, i) => { x.fillStyle = t; x.fillRect(0, i * 135, 1080, 135); });
  x.fillStyle = 'rgba(244,238,227,0.82)'; x.fillRect(60, 60, 960, 960);
  x.strokeStyle = '#000'; x.lineWidth = 8; x.strokeRect(60, 60, 960, 960);

  x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = '#000';
  x.font = '700 64px "Silkscreen", monospace'; x.fillText('HORA PUNTA', 540, 160);
  if (personaje) x.drawImage(personaje, 340, 200, 400, 400);
  x.font = '700 150px "Silkscreen", monospace'; x.fillStyle = '#2B4BD8'; x.fillText(String(e.puntos), 540, 770);
  x.font = '700 34px "Silkscreen", monospace'; x.fillStyle = '#000'; x.fillText('PUNTOS', 540, 820);
  x.font = '600 34px "DM Sans", sans-serif';
  x.fillText(`${e.maxY} filas cruzadas`, 540, 900);
  sprite(x, BOLA, 250, 930, 56, 56, '#FF8FB1'); x.textAlign = 'left'; x.fillText(`${e.bolas} bolas`, 320, 970);
  sprite(x, GRIS, 600, 930, 56, 56); x.fillText(`${e.arrastrados} Grises`, 670, 970);

  x.fillStyle = '#000'; x.fillRect(0, 1080, 1080, 270);
  x.textAlign = 'left'; x.fillStyle = '#F4EEE3'; x.font = '800 66px "Bricolage Grotesque", sans-serif';
  x.fillText('Hora', 56, 1172); x.fillText('punta', 56, 1244);
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
