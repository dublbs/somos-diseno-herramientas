import { muestrear, type Pista } from './animacion';
import { FONDO, FONDO_DESIERTO, FONDO_MAR, pieza, PIEZAS, type Capa } from './piezas';

export interface Item {
  uid: number;
  tipo: string;
  x: number; // centro de la caja en el escenario (0..240)
  y: number;
  escala: number; // 1 = tamaño del marco de Figma (240)
  espejo: boolean;
  variante?: number; // forma de moverse (índice en `variantes` de la pieza)
}

export const ESCENARIO = 240;

const cache = new Map<string, HTMLImageElement>();
export function cargarImagen(src: string): Promise<HTMLImageElement> {
  const hay = cache.get(src);
  if (hay) return hay.complete ? Promise.resolve(hay) : new Promise(r => hay.addEventListener('load', () => r(hay), { once: true }));
  const im = new Image();
  cache.set(src, im);
  return new Promise((res, rej) => { im.onload = () => res(im); im.onerror = rej; im.src = src; });
}
export const cargarTodo = () =>
  Promise.all([...FONDO.capas, ...FONDO_MAR.capas, ...FONDO_DESIERTO.capas, ...PIEZAS.flatMap(p => p.capas)].map(c => cargarImagen(c.src)));

function aplicar(ctx: CanvasRenderingContext2D, pistas: Pista[] | undefined, u: number, pivote?: [number, number]) {
  if (!pistas?.length) return;
  let dx = 0, dy = 0, rot = 0, sx = 1, sy = 1;
  for (const p of pistas) {
    const v = muestrear(p, u);
    if (p.prop === 'x') dx = v; else if (p.prop === 'y') dy = v;
    else if (p.prop === 'rotate') rot = v; else if (p.prop === 'scaleX') sx = v;
    else if (p.prop === 'scaleY') sy = v; else ctx.globalAlpha *= Math.min(1, Math.max(0, v));
  }
  ctx.translate(dx, dy);
  if (pivote) ctx.translate(pivote[0], pivote[1]);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.scale(sx, sy);
  if (pivote) ctx.translate(-pivote[0], -pivote[1]);
}

function dibujarCapas(ctx: CanvasRenderingContext2D, capas: Capa[], durMs: number, ms: number, pistas?: (Pista[] | undefined)[]) {
  const u = (ms % durMs) / durMs;
  for (let i = 0; i < capas.length; i++) {
    const c = capas[i];
    const im = cache.get(c.src);
    if (!im || !im.complete) continue;
    ctx.save();
    aplicar(ctx, pistas ? pistas[i] : c.pistas, u, c.pivote);
    ctx.drawImage(im, c.x, c.y, c.w ?? im.naturalWidth, c.h ?? im.naturalHeight);
    ctx.restore();
  }
}

// Dibuja la pieza en su marco de 240 × 240 (recortada al marco, como en Figma).
export function dibujarMarco(ctx: CanvasRenderingContext2D, tipo: string, ms: number, variante = 0) {
  const p = pieza(tipo), v = p.variantes?.[variante] ?? null, dur = v?.durMs ?? p.durMs;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, 240, 240); ctx.clip();
  const u = (ms % dur) / dur;
  aplicar(ctx, v ? v.grupo : p.grupo, u);
  dibujarCapas(ctx, p.capas, dur, ms, v?.pistas);
  for (const parte of p.partes ?? []) {
    ctx.save();
    ctx.translate(parte.x, parte.y);
    ctx.scale(parte.escala, parte.escala);
    dibujarMarco(ctx, parte.tipo, ms + parte.fase * pieza(parte.tipo).durMs);
    ctx.restore();
  }
  ctx.restore();
}

// Dibuja una pieza con su caja centrada en (0,0) y escala 1 = tamaño del marco de 240.
export function dibujarPieza(ctx: CanvasRenderingContext2D, tipo: string, ms: number, variante = 0) {
  const [bx, by, bw, bh] = pieza(tipo).caja;
  ctx.save();
  ctx.translate(-(bx + bw / 2), -(by + bh / 2));
  dibujarMarco(ctx, tipo, ms, variante);
  ctx.restore();
}

// Borde de papel: cada pieza se recorta con un contorno de hueso y una sombra suave, como un papel pegado encima.
// Así una pieza se distingue del fondo aunque tenga los mismos colores (por ejemplo, sobre la cordillera morada).
const HUESO = '#F4EEE3', BORDE = 1.5; // grosor del borde, en unidades del escenario
const tmp = document.createElement('canvas'), sil = document.createElement('canvas');

function dibujarItem(ctx: CanvasRenderingContext2D, it: Item, ms: number, size: number, borde: boolean) {
  const trazar = (c: CanvasRenderingContext2D) => {
    c.save();
    c.translate(it.x, it.y);
    c.scale(it.escala * (it.espejo ? -1 : 1), it.escala);
    dibujarPieza(c, it.tipo, ms, it.variante ?? 0);
    c.restore();
  };
  if (!borde) { trazar(ctx); return; }

  const k = size / ESCENARIO, b = cajaItem(it), m = BORDE + 3;
  const bx = b.x - m, by = b.y - m, w = Math.max(1, Math.ceil((b.w + 2 * m) * k)), h = Math.max(1, Math.ceil((b.h + 2 * m) * k));
  tmp.width = sil.width = w; tmp.height = sil.height = h;
  const t = tmp.getContext('2d')!;
  t.setTransform(k, 0, 0, k, -bx * k, -by * k);
  trazar(t);
  const sx = sil.getContext('2d')!;
  sx.globalCompositeOperation = 'source-over';
  sx.drawImage(tmp, 0, 0);
  sx.globalCompositeOperation = 'source-in';
  sx.fillStyle = HUESO; sx.fillRect(0, 0, w, h);

  // se dibuja en píxeles del lienzo, sin la escala del escenario
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const ox = bx * k, oy = by * k, r = BORDE * k;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.32)'; ctx.shadowBlur = 2.5 * k; ctx.shadowOffsetX = 1 * k; ctx.shadowOffsetY = 1.8 * k;
  ctx.drawImage(sil, ox, oy);
  ctx.restore();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.drawImage(sil, ox + Math.cos(a) * r, oy + Math.sin(a) * r);
  }
  ctx.drawImage(tmp, ox, oy);
  ctx.restore();
}

export function dibujarEscenario(
  ctx: CanvasRenderingContext2D, size: number, items: Item[], ms: number,
  fondo: { dur: number; capas: Capa[] } = FONDO, borde = true
) {
  ctx.save();
  ctx.setTransform(size / ESCENARIO, 0, 0, size / ESCENARIO, 0, 0);
  ctx.clearRect(0, 0, ESCENARIO, ESCENARIO);
  dibujarCapas(ctx, fondo.capas, fondo.dur, ms);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, ESCENARIO, ESCENARIO); ctx.clip();
  for (const it of items) dibujarItem(ctx, it, ms, size, borde);
  ctx.restore();
  ctx.restore();
}

// Caja del item en coordenadas del escenario (para tocar, seleccionar y escalar).
export function cajaItem(it: Item) {
  const [, , bw, bh] = pieza(it.tipo).caja;
  const w = bw * it.escala, h = bh * it.escala;
  return { x: it.x - w / 2, y: it.y - h / 2, w, h };
}

export function dibujarSeleccion(ctx: CanvasRenderingContext2D, size: number, it: Item) {
  const k = size / ESCENARIO, b = cajaItem(it);
  ctx.save();
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.lineWidth = 1.4; ctx.strokeStyle = '#FFC20E'; ctx.setLineDash([4, 3]);
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.setLineDash([]);
  ctx.fillStyle = '#FFC20E'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(b.x + b.w, b.y + b.h, ASA, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
export const ASA = 7; // radio del tirador de escala, en unidades del escenario
