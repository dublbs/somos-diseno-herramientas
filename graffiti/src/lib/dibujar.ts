import { COLS, FILAS, MUROS, PALETA, STICKERS } from '../data/config';
import { imagen, lista } from './imagenes';
import type { Dibujo } from './pintura';

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
