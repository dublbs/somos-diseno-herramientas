import { NOMBRE_PINTURA } from './comun';
import { dibujarMural, type Mural } from './mural';

// Lo que deja una partida: el puntaje y lo que juntaste en cada nivel.
export interface Resumen extends Mural { puntos: number; filas: number; bolas: number; arrastrados: number; nivel: 1 | 2 | 3; limpio: boolean; borradas: number; cadena: number }

// Tarjeta 1080 × 1350 con la franja negra común: tu mural, el personaje y el puntaje.
export async function crearTarjeta(r: Resumen, personaje: HTMLImageElement | null): Promise<Blob> {
  try { await document.fonts.load('700 120px "Silkscreen"'); await document.fonts.load('800 66px "Bricolage Grotesque"'); await document.fonts.load('500 26px "DM Sans"'); } catch { /* respaldo */ }
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const x = c.getContext('2d')!;
  x.imageSmoothingEnabled = false;
  // Fondo: calles de la ciudad en franjas (vereda, calle, plaza, vías), como el nivel 1.
  const franjas = ['#CFC6B8', '#3D3A36', '#3D3A36', '#5DAA6E', '#77726A', '#CFC6B8', '#3D3A36', '#CFC6B8'];
  franjas.forEach((t, i) => { x.fillStyle = t; x.fillRect(0, i * 135, 1080, 135); });

  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.fillStyle = '#000'; x.fillRect(140 + 10, 56 + 10, 800, 96);
  x.fillStyle = '#F4EEE3'; x.fillRect(140, 56, 800, 96);
  x.fillStyle = '#000'; x.font = '700 60px "Silkscreen", monospace'; x.fillText('MI MURAL', 540, 128);
  x.fillStyle = '#000'; x.fillRect(120 + 14, 190 + 14, 840, 630);
  dibujarMural(x, 120, 190, 840, r);
  if (personaje) x.drawImage(personaje, 40, 700, 240, 240);

  x.fillStyle = 'rgba(244,238,227,0.9)'; x.fillRect(300, 860, 720, 190);
  x.strokeStyle = '#000'; x.lineWidth = 6; x.strokeRect(300, 860, 720, 190);
  x.fillStyle = '#2B4BD8'; x.font = `700 ${String(r.puntos).length > 2 ? 76 : 104}px "Silkscreen", monospace`; x.textAlign = 'left'; x.fillText(String(r.puntos), 330, 960);
  x.fillStyle = '#000'; x.font = '700 30px "Silkscreen", monospace'; x.fillText('PUNTOS', 330, 1010);
  x.textAlign = 'right'; x.font = '600 30px "DM Sans", sans-serif';
  const colores = [...new Set(r.latas)].map(k => NOMBRE_PINTURA[k]).filter(Boolean);
  const pl = (n: number, uno: string, varios = uno + 's') => `${n} ${n === 1 ? uno : varios}`;
  x.fillText(`${pl(r.filas, 'fila')} · ${pl(r.latas.length, 'lata')}`, 990, 920);
  x.fillText(r.nivel === 3 ? `${pl(r.borradas, 'pintada', 'pintadas')}${r.cadena > 1 ? ` · ×${r.cadena}` : ''}` : r.nivel === 2 ? `${pl(r.arrastrados, 'Gris', 'Grises')} · ${pl(r.piezas.length, 'pieza')}` : 'Llegaste a la calle', 990, 964);
  x.fillText(colores.length ? colores.slice(0, 3).join(', ') + (colores.length > 3 ? '…' : '') : 'Sin color', 990, 1008);

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
