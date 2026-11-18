import { COLS, FILAS, MUROS, PALETA, STICKERS } from '../data/config';
import { imagen, lista } from './imagenes';
import { BORDE, MARGEN_PLACA, medidas, TAPADO, type Dibujo, type Estampa, type Puesta } from './pintura';

// La pared es horizontal (COLS × FILAS celdas, 2:1). La pintura se arma en una imagen de una celda por pixel y se
// escala sin suavizado: así se ve pixel y dibujar 12.800 celdas sigue siendo instantáneo.
const RGB = PALETA.map(c => [parseInt(c.hex.slice(1, 3), 16), parseInt(c.hex.slice(3, 5), 16), parseInt(c.hex.slice(5, 7), 16)]);
let capaPintura: HTMLCanvasElement | null = null;
function lienzoCeldas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  if (!capaPintura) { capaPintura = document.createElement('canvas'); capaPintura.width = COLS; capaPintura.height = FILAS; }
  return [capaPintura, capaPintura.getContext('2d')!];
}

// ---------------------------------------------------------------- stickers
// Los SVG de Figma ya traen su troquel (borde hueso y sombra). Cada uno se rasteriza una vez a buena resolución y
// se dibuja con suavizado: así se ve nítido a cualquier tamaño y girado, sin el pixelado del escalado sin suavizar.
const ANCHO_PREP = 640;
const preparados = new Map<string, HTMLCanvasElement>();
function preparado(src: string): HTMLCanvasElement | null {
  const listo = preparados.get(src);
  if (listo) return listo;
  const im = imagen(src);
  if (!lista(im)) return null;
  const c = document.createElement('canvas');
  c.width = ANCHO_PREP; c.height = Math.round((ANCHO_PREP * im.naturalHeight) / im.naturalWidth);
  c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height);
  preparados.set(src, c);
  return c;
}

// Medidas del sticker en celdas del muro con escala 1 (sin el borde blanco). null si su imagen aún no carga.
export function medidaSticker(id: string): { w: number; h: number } | null {
  const s = STICKERS.find(k => k.id === id);
  if (!s) return null;
  const im = imagen(s.src);
  if (!lista(im)) return null;
  return { w: s.ancho, h: (s.ancho * im.naturalHeight) / im.naturalWidth };
}

// Índice del sticker pegado bajo el punto (celdas del muro, con decimales), mirando primero el de más arriba. -1 si no hay.
export function stickerEn(stickers: Estampa[], fx: number, fy: number): number {
  for (let i = stickers.length - 1; i >= 0; i--) {
    const e = stickers[i], m = medidaSticker(e.id);
    if (!m) continue;
    const a = (-e.giro * Math.PI) / 180, dx = fx - e.x, dy = fy - e.y;
    const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
    // un poco de holgura: el dedo es más grueso que el troquel
    if (Math.abs(lx) <= (m.w * e.escala) / 2 + 1 && Math.abs(ly) <= (m.h * e.escala) / 2 + 1) return i;
  }
  return -1;
}

export function dibujarSticker(ctx: CanvasRenderingContext2D, c: number, e: Estampa) {
  const s = STICKERS.find(k => k.id === e.id), m = medidaSticker(e.id);
  if (!s || !m) return;
  const prep = preparado(s.src);
  if (!prep) return;
  const w = m.w * e.escala * c, f = w / ANCHO_PREP; // px de pantalla por px preparado
  ctx.save();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.translate(e.x * c, e.y * c); ctx.rotate((e.giro * Math.PI) / 180);
  ctx.drawImage(prep, (-prep.width / 2) * f, (-prep.height / 2) * f, prep.width * f, prep.height * f);
  ctx.restore();
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
  for (const e of d.stickers) dibujarSticker(ctx, c, e);
}

// La placa de cartón del stencil, solo en pantalla (no sale en la tarjeta). Es semitransparente para ver la pared y
// lo pintado debajo; el canto del corte se ve más oscuro, como el cartón cortado a cuchillo.
let capaPlaca: { mascara: Uint8Array; lienzo: HTMLCanvasElement } | null = null;
export function dibujarPlacaStencil(ctx: CanvasRenderingContext2D, ancho: number, _alto: number, p: Puesta, mascara: Uint8Array, moviendo: boolean) {
  if (!capaPlaca || capaPlaca.mascara !== mascara) {
    const lienzo = capaPlaca?.lienzo ?? document.createElement('canvas'); lienzo.width = COLS; lienzo.height = FILAS;
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
  const c = ancho / COLS, { w, h } = medidas(p.id);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = moviendo ? 0.6 : 0.82;
  ctx.drawImage(capaPlaca.lienzo, 0, 0, ancho, _alto);
  ctx.globalAlpha = 1;
  // canto de la placa, girado con ella
  ctx.translate(p.x * c, p.y * c); ctx.rotate((p.giro * Math.PI) / 180);
  const pw = w * p.escala + 2 * MARGEN_PLACA, ph = h * p.escala + 2 * MARGEN_PLACA;
  ctx.strokeStyle = 'rgba(60, 40, 15, 0.9)'; ctx.lineWidth = Math.max(1.5, c * 0.35);
  ctx.strokeRect((-pw / 2) * c, (-ph / 2) * c, pw * c, ph * c);
  ctx.restore();
}
