import { COLS, FILAS, MUROS, PALETA, STICKERS } from '../data/config';
import { imagen, lista } from './imagenes';
import { BORDE, placa, TAPADO, type Dibujo, type Puesta } from './pintura';

// La pared es horizontal (COLS × FILAS celdas, 2:1). La pintura se arma en una imagen de una celda por pixel y se
// escala sin suavizado: así se ve pixel y dibujar 12.800 celdas sigue siendo instantáneo.
const RGB = PALETA.map(c => [parseInt(c.hex.slice(1, 3), 16), parseInt(c.hex.slice(3, 5), 16), parseInt(c.hex.slice(5, 7), 16)]);
let capaPintura: HTMLCanvasElement | null = null;
function lienzoCeldas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  if (!capaPintura) { capaPintura = document.createElement('canvas'); capaPintura.width = COLS; capaPintura.height = FILAS; }
  return [capaPintura, capaPintura.getContext('2d')!];
}

// Dibuja muro + pintura + stickers en `ancho` × `alto` px (pantalla, tarjeta o miniatura).
export function dibujarMuro(ctx: CanvasRenderingContext2D, ancho: number, alto: number, muroId: string, d: Dibujo) {
  ctx.imageSmoothingEnabled = false;
  const muro = imagen(MUROS.find(m => m.id === muroId)!.src);
  if (lista(muro)) ctx.drawImage(muro, 0, 0, ancho, alto);
  else { ctx.fillStyle = '#D9CDB7'; ctx.fillRect(0, 0, ancho, alto); }

  const [cv, c2] = lienzoCeldas();
  const img = c2.createImageData(COLS, FILAS);
  for (let i = 0; i < d.pintura.length; i++) {
    const v = d.pintura[i];
    if (!v) continue;
    const [r, g, b] = RGB[v - 1];
    img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
  }
  c2.putImageData(img, 0, 0);
  ctx.drawImage(cv, 0, 0, ancho, alto);

  const c = ancho / COLS;
  for (const e of d.stickers) {
    const s = STICKERS.find(k => k.id === e.id);
    if (!s) continue;
    const im = imagen(s.src);
    if (!lista(im)) continue;
    const w = s.ancho * c, h = w * (im.naturalHeight / im.naturalWidth);
    ctx.drawImage(im, (e.x + 0.5) * c - w / 2, (e.y + 0.5) * c - h / 2, w, h);
  }
}

// La placa de cartón del stencil, solo en pantalla (no sale en la tarjeta). Es semitransparente para ver la pared y
// lo pintado debajo; el canto del corte se ve más oscuro, como el cartón cortado a cuchillo.
let capaPlaca: { mascara: Uint8Array; lienzo: HTMLCanvasElement } | null = null;
export function dibujarPlacaStencil(ctx: CanvasRenderingContext2D, ancho: number, alto: number, p: Puesta, mascara: Uint8Array, moviendo: boolean) {
  if (!capaPlaca || capaPlaca.mascara !== mascara) {
    const lienzo = document.createElement('canvas'); lienzo.width = COLS; lienzo.height = FILAS;
    const c2 = lienzo.getContext('2d')!, img = c2.createImageData(COLS, FILAS);
    for (let y = 0; y < FILAS; y++) for (let x = 0; x < COLS; x++) {
      const i = y * COLS + x, v = mascara[i];
      if (v !== TAPADO && v !== BORDE) continue;
      const [r, g, b] = v === BORDE ? [0x6E, 0x4E, 0x26] : (x + y) % 2 ? [0xC9, 0xA6, 0x6B] : [0xC2, 0x9E, 0x62];
      img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
    }
    c2.putImageData(img, 0, 0);
    capaPlaca = { mascara, lienzo };
  }
  const c = ancho / COLS, pl = placa(p);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = moviendo ? 0.55 : 0.8;
  ctx.drawImage(capaPlaca.lienzo, 0, 0, ancho, alto);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(2, c * 0.6);
  ctx.setLineDash(moviendo ? [c * 2, c * 2] : []);
  const x0 = Math.max(0, Math.round(pl.x)) * c, y0 = Math.max(0, Math.round(pl.y)) * c;
  const x1 = Math.min(COLS, Math.round(pl.x + pl.w)) * c, y1 = Math.min(FILAS, Math.round(pl.y + pl.h)) * c;
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  ctx.restore();
}
