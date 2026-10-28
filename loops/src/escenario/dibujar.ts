import { muestrear, type Pista } from './animacion';
import { FONDO, FONDO_DESIERTO, FONDO_MAR, pieza, PIEZAS, type Capa } from './piezas';

export type TipoTrayectoria = 'estatico' | 'cruzar' | 'ida-vuelta' | 'vaiven';

export interface Item {
  uid: number;
  tipo: string;
  x: number; // centro de la caja en el escenario (0..240)
  y: number;
  escala: number; // 1 = tamaño del marco de Figma (240)
  espejo: boolean;
  variante?: number; // forma de moverse (índice en `variantes` de la pieza)
  trayectoria?: TipoTrayectoria;
}

export const ESCENARIO = 240;

export function posicionItem(it: Item, ms = 0): { x: number; y: number; espejo: boolean } {
  const tray = it.trayectoria || 'estatico';
  if (tray === 'estatico') return { x: it.x, y: it.y, espejo: it.espejo };

  const dur = 4000;
  const u = (ms % dur) / dur; // 0..1

  if (tray === 'cruzar') {
    const ancho = 300;
    const inicio = -30;
    const offset = u * ancho;
    const x = it.espejo ? 270 - offset : inicio + offset;
    return { x, y: it.y, espejo: it.espejo };
  }

  if (tray === 'ida-vuelta') {
    const rango = 40;
    if (u < 0.5) {
      const p = u / 0.5;
      const x = it.x + (it.espejo ? -rango : rango) * p;
      return { x, y: it.y, espejo: it.espejo };
    } else {
      const p = (u - 0.5) / 0.5;
      const x = it.x + (it.espejo ? -rango : rango) * (1 - p);
      return { x, y: it.y, espejo: !it.espejo };
    }
  }

  if (tray === 'vaiven') {
    const rango = 20;
    const dx = Math.sin(u * Math.PI * 2) * rango;
    return { x: it.x + dx, y: it.y, espejo: it.espejo };
  }

  return { x: it.x, y: it.y, espejo: it.espejo };
}

const cache = new Map<string, HTMLImageElement>();
const dimensionesLogicas = new Map<string, { w: number; h: number }>();

export async function cargarImagen(src: string): Promise<HTMLImageElement> {
  const hay = cache.get(src);
  if (hay) return hay.complete ? Promise.resolve(hay) : new Promise(r => hay.addEventListener('load', () => r(hay), { once: true }));

  if (src.endsWith('.svg')) {
    try {
      const resp = await fetch(src);
      if (resp.ok) {
        let svg = await resp.text();
        const vbMatch = svg.match(/viewBox="([^"]+)"/);
        const wMatch = svg.match(/width="([^"]+)"/);
        const hMatch = svg.match(/height="([^"]+)"/);

        let origW = wMatch ? parseFloat(wMatch[1]) : 240;
        let origH = hMatch ? parseFloat(hMatch[1]) : 240;

        if (vbMatch) {
          const parts = vbMatch[1].trim().split(/\s+/).map(Number);
          if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
            origW = parts[2];
            origH = parts[3];
          }
        } else {
          svg = svg.replace('<svg', `<svg viewBox="0 0 ${origW} ${origH}"`);
        }

        dimensionesLogicas.set(src, { w: origW, h: origH });

        // Multiplicador 4x (mínimo 960px) para máxima nitidez vectorial en pantallas Retina y al agrandar figuras
        const mult = Math.max(4, Math.ceil(960 / Math.max(origW, origH)));
        const nuevoW = Math.round(origW * mult);
        const nuevoH = Math.round(origH * mult);

        svg = svg.replace(/width="[^"]+"/, `width="${nuevoW}"`);
        svg = svg.replace(/height="[^"]+"/, `height="${nuevoH}"`);

        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const im = new Image();
        cache.set(src, im);
        return new Promise((res, rej) => {
          im.onload = () => res(im);
          im.onerror = rej;
          im.src = blobUrl;
        });
      }
    } catch {
      // Fallback a carga estándar si fetch no está disponible
    }
  }

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
    const dim = dimensionesLogicas.get(c.src);
    const w = c.w ?? dim?.w ?? (im.naturalWidth > 500 ? 240 : im.naturalWidth);
    const h = c.h ?? dim?.h ?? (im.naturalHeight > 500 ? 240 : im.naturalHeight);
    ctx.save();
    aplicar(ctx, pistas ? pistas[i] : c.pistas, u, c.pivote);
    ctx.drawImage(im, c.x, c.y, w, h);
    ctx.restore();
  }
}

// Dibuja la pieza en su marco de 240 × 240 (sin recorte artificial para permitir movimiento natural).
export function dibujarMarco(ctx: CanvasRenderingContext2D, tipo: string, ms: number, variante = 0) {
  const p = pieza(tipo), v = p.variantes?.[variante] ?? null, dur = v?.durMs ?? p.durMs;
  ctx.save();
  const u = (ms % dur) / dur;
  aplicar(ctx, v ? v.grupo : p.grupo, u, p.pivote);
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
const HUESO = '#F4EEE3', BORDE = 1.5; // grosor del borde, en unidades del escenario
const tmp = document.createElement('canvas'), sil = document.createElement('canvas');

function dibujarItem(ctx: CanvasRenderingContext2D, it: Item, ms: number, size: number, borde: boolean) {
  const pos = posicionItem(it, ms);
  const trazar = (c: CanvasRenderingContext2D) => {
    c.save();
    c.translate(pos.x, pos.y);
    c.scale(it.escala * (pos.espejo ? -1 : 1), it.escala);
    dibujarPieza(c, it.tipo, ms, it.variante ?? 0);
    c.restore();
  };
  if (!borde) { trazar(ctx); return; }

  // Margen amplio para que ninguna rama, ala, cola ni espina sufra clipping al rotar o vibrar
  const k = size / ESCENARIO, b = cajaItem(it, ms), m = Math.max(36, BORDE * 14) * Math.max(1, it.escala);
  const bx = b.x - m, by = b.y - m, w = Math.max(1, Math.ceil((b.w + 2 * m) * k)), h = Math.max(1, Math.ceil((b.h + 2 * m) * k));
  tmp.width = sil.width = w; tmp.height = sil.height = h;
  const t = tmp.getContext('2d')!;
  t.clearRect(0, 0, w, h);
  t.imageSmoothingEnabled = true;
  t.imageSmoothingQuality = 'high';
  t.setTransform(k, 0, 0, k, -bx * k, -by * k);
  trazar(t);

  const sx = sil.getContext('2d')!;
  sx.clearRect(0, 0, w, h);
  sx.imageSmoothingEnabled = true;
  sx.imageSmoothingQuality = 'high';
  sx.globalCompositeOperation = 'source-over';
  sx.drawImage(tmp, 0, 0);
  sx.globalCompositeOperation = 'source-in';
  sx.fillStyle = HUESO; sx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const ox = bx * k, oy = by * k, r = BORDE * k;
  
  // Sombra suave inferior
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 3 * k; ctx.shadowOffsetX = 1 * k; ctx.shadowOffsetY = 2 * k;
  ctx.drawImage(sil, ox, oy);
  ctx.restore();

  // Borde de papel suave
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.drawImage(sil, ox + Math.cos(a) * r, oy + Math.sin(a) * r);
  }
  ctx.restore();

  // Dibujar la pieza original directamente en el lienzo destino para máxima nitidez vectorial
  trazar(ctx);
}

export function dibujarEscenario(
  ctx: CanvasRenderingContext2D, size: number, items: Item[], ms: number,
  fondo: { dur: number; capas: Capa[] } = FONDO, borde = true
) {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
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
export function cajaItem(it: Item, ms = 0) {
  const [, , bw, bh] = pieza(it.tipo).caja;
  const w = bw * it.escala, h = bh * it.escala;
  const pos = posicionItem(it, ms);
  return { x: pos.x - w / 2, y: pos.y - h / 2, w, h };
}

export function dibujarSeleccion(ctx: CanvasRenderingContext2D, size: number, it: Item, ms = 0) {
  const k = size / ESCENARIO, b = cajaItem(it, ms);
  ctx.save();
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.lineWidth = 1.5; ctx.strokeStyle = '#FFC20E'; ctx.setLineDash([5, 4]);
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.setLineDash([]);
  ctx.fillStyle = '#FFC20E'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(b.x + b.w, b.y + b.h, ASA, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
export const ASA = 7; // radio del tirador de escala, en unidades del escenario
