import { COLS, FILAS, MUROS, PALETA, STICKERS } from '../data/config';
import { imagen, lista } from './imagenes';
import { BORDE, placa, TAPADO, type Dibujo, type Puesta } from './pintura';

// Dibuja muro + pintura + stickers en un cuadrado de `lado` px (pantalla o tarjeta).
export function dibujarMuro(ctx: CanvasRenderingContext2D, lado: number, muroId: string, d: Dibujo) {
  ctx.imageSmoothingEnabled = false;
  const muro = imagen(MUROS.find(m => m.id === muroId)!.src);
  if (lista(muro)) ctx.drawImage(muro, 0, 0, lado, lado);
  else { ctx.fillStyle = '#D9CDB7'; ctx.fillRect(0, 0, lado, lado); }

  const c = lado / COLS;
  for (let y = 0; y < FILAS; y++) for (let x = 0; x < COLS; x++) {
    const v = d.pintura[y * COLS + x];
    if (!v) continue;
    ctx.fillStyle = PALETA[v - 1].hex;
    // +0.5 px evita líneas finas entre celdas al escalar
    ctx.fillRect(Math.floor(x * c), Math.floor(y * c), Math.ceil(c) + 0.5, Math.ceil(c) + 0.5);
  }

  for (const e of d.stickers) {
    const s = STICKERS.find(k => k.id === e.id);
    if (!s) continue;
    const im = imagen(s.src);
    if (!lista(im)) continue;
    const w = s.ancho * c, h = w * (im.naturalHeight / im.naturalWidth);
    ctx.drawImage(im, (e.x + 0.5) * c - w / 2, (e.y + 0.5) * c - h / 2, w, h);
  }
}

// La placa de cartón del stencil, solo en pantalla (no sale en la tarjeta): tapa lo que no es hueco de la capa activa.
export function dibujarPlacaStencil(ctx: CanvasRenderingContext2D, lado: number, p: Puesta, mascara: Uint8Array, moviendo: boolean) {
  const c = lado / COLS, pl = placa(p);
  ctx.save();
  ctx.globalAlpha = moviendo ? 0.7 : 0.92;
  for (let y = 0; y < FILAS; y++) for (let x = 0; x < COLS; x++) {
    const v = mascara[y * COLS + x];
    if (v !== TAPADO && v !== BORDE) continue;
    // El canto del corte se ve más oscuro, como el cartón cortado a cuchillo.
    ctx.fillStyle = v === BORDE ? '#8C6A3C' : (x + y) % 2 ? '#C9A66B' : '#C29E62';
    ctx.fillRect(Math.floor(x * c), Math.floor(y * c), Math.ceil(c) + 0.5, Math.ceil(c) + 0.5);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(2, c * 0.35);
  ctx.setLineDash(moviendo ? [c, c] : []);
  const x0 = Math.max(0, Math.round(pl.x)) * c, y0 = Math.max(0, Math.round(pl.y)) * c;
  const x1 = Math.min(COLS, Math.round(pl.x + pl.w)) * c, y1 = Math.min(FILAS, Math.round(pl.y + pl.h)) * c;
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  ctx.restore();
}
