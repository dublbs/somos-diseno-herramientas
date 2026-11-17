import { muestrear, type Pista } from './animacion';
import { FONDO, pieza, tinteDe, type Capa } from './piezas';
import { dimension, raster } from './recursos';

export interface Item {
  uid: number;
  tipo: string;
  x: number; // Punto A (inicio) en el escenario (0..240)
  y: number;
  escala: number; // 1 = tamaño del marco de Figma (240)
  espejo: boolean;
  variante?: number; // forma de moverse (índice en `variantes` de la pieza)
  destino?: { x: number; y: number }; // Punto B (llegada) personalizado estilo After Effects
  llegada?: number; // keyframe B en la línea de tiempo: fracción del loop en que llega a B (0,1); vuelve a A al final
  color?: string; // id del color elegido (solo piezas con `colores`)
}

export const DURACION_TRAYECTO = 4000;
export const LLEGADA = 0.5;
const suave = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2); // easeInOut

export const ESCENARIO = 240;

export function posicionItem(it: Item, ms = 0): { x: number; y: number; espejo: boolean } {
  if (!it.destino) {
    return { x: it.x, y: it.y, espejo: it.espejo };
  }

  // Keyframes: A en 0, B en `llegada`, A otra vez al cerrar el loop; cada tramo con entrada y salida suaves.
  const u = (ms % DURACION_TRAYECTO) / DURACION_TRAYECTO, b = it.llegada ?? LLEGADA;
  const ida = u < b;
  const p = ida ? suave(u / b) : 1 - suave((u - b) / (1 - b));
  const x = it.x + (it.destino.x - it.x) * p;
  const y = it.y + (it.destino.y - it.y) * p;

  // Orientación natural: mira hacia donde avanza
  const dx = it.destino.x - it.x;
  let espejo = it.espejo;
  if (Math.abs(dx) > 12) espejo = dx > 0 ? !ida : ida;

  return { x, y, espejo };
}

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

function dibujarCapas(ctx: CanvasRenderingContext2D, capas: Capa[], durMs: number, ms: number, pistas?: (Pista[] | undefined)[], tinte?: string) {
  const u = (ms % durMs) / durMs;
  for (let i = 0; i < capas.length; i++) {
    const c = capas[i];
    const r = raster(c.src, tinte), d = dimension(c.src);
    if (!r || !d) continue;
    const kx = (c.w ?? d.w) / d.w, ky = (c.h ?? d.h) / d.h;
    const p = pistas ? pistas[i] : c.pistas;
    if (p?.length) {
      ctx.save();
      aplicar(ctx, p, u, c.pivote);
      ctx.drawImage(r.lienzo, c.x + r.x * kx, c.y + r.y * ky, r.w * kx, r.h * ky);
      ctx.restore();
    } else ctx.drawImage(r.lienzo, c.x + r.x * kx, c.y + r.y * ky, r.w * kx, r.h * ky);
  }
}

// Dibuja la pieza en su marco de 240 × 240 (sin recorte artificial para permitir movimiento natural).
export function dibujarMarco(ctx: CanvasRenderingContext2D, tipo: string, ms: number, variante = 0, color?: string) {
  const p = pieza(tipo), v = p.variantes?.[variante] ?? null, dur = v?.durMs ?? p.durMs;
  ctx.save();
  const u = (ms % dur) / dur;
  aplicar(ctx, v ? v.grupo : p.grupo, u, p.pivote);
  dibujarCapas(ctx, p.capas, dur, ms, v?.pistas, tinteDe(tipo, color));
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
export function dibujarPieza(ctx: CanvasRenderingContext2D, tipo: string, ms: number, variante = 0, color?: string) {
  const [bx, by, bw, bh] = pieza(tipo).caja;
  ctx.save();
  ctx.translate(-(bx + bw / 2), -(by + bh / 2));
  dibujarMarco(ctx, tipo, ms, variante, color);
  ctx.restore();
}

// Borde de papel: cada pieza se recorta con un contorno de hueso y una sombra suave, como un papel pegado encima.
// La pieza se pinta una vez en un lienzo auxiliar (que solo crece, nunca se reasigna por cuadro); de ahí salen la
// silueta hueso, la sombra y el borde (8 copias desplazadas), y la pieza se copia encima sin volver a trazarla.
const HUESO = '#F4EEE3', BORDE = 1.5; // grosor del borde, en unidades del escenario
const tmp = document.createElement('canvas'), sil = document.createElement('canvas');
const ctxTmp = tmp.getContext('2d')!, ctxSil = sil.getContext('2d')!;
const DIRS = Array.from({ length: 8 }, (_, i) => [Math.cos((i / 8) * Math.PI * 2), Math.sin((i / 8) * Math.PI * 2)]);
function asegurar(w: number, h: number) {
  if (tmp.width >= w && tmp.height >= h) return;
  tmp.width = sil.width = Math.max(tmp.width, Math.ceil(w * 1.2));
  tmp.height = sil.height = Math.max(tmp.height, Math.ceil(h * 1.2));
}

function dibujarItem(ctx: CanvasRenderingContext2D, it: Item, ms: number, size: number, borde: boolean) {
  const pos = posicionItem(it, ms);
  const trazar = (c: CanvasRenderingContext2D) => {
    c.save();
    c.translate(pos.x, pos.y);
    c.scale(it.escala * (pos.espejo ? -1 : 1), it.escala);
    dibujarPieza(c, it.tipo, ms, it.variante ?? 0, it.color);
    c.restore();
  };
  if (!borde) { trazar(ctx); return; }

  // Margen para que alas, colas y ramas que salen de la caja al moverse no se corten.
  const k = size / ESCENARIO, b = cajaItem(it, ms), m = Math.max(b.w, b.h) * 0.3 + BORDE * 3;
  const bx = b.x - m, by = b.y - m;
  const w = Math.max(1, Math.ceil((b.w + 2 * m) * k)), h = Math.max(1, Math.ceil((b.h + 2 * m) * k));
  asegurar(w, h);
  ctxTmp.setTransform(1, 0, 0, 1, 0, 0);
  ctxTmp.clearRect(0, 0, w, h);
  ctxTmp.setTransform(k, 0, 0, k, -bx * k, -by * k);
  trazar(ctxTmp);

  ctxSil.globalCompositeOperation = 'copy';
  ctxSil.drawImage(tmp, 0, 0, w, h, 0, 0, w, h);
  ctxSil.globalCompositeOperation = 'source-in';
  ctxSil.fillStyle = HUESO; ctxSil.fillRect(0, 0, w, h);
  ctxSil.globalCompositeOperation = 'source-over';

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const ox = bx * k, oy = by * k, r = BORDE * k;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 3 * k; ctx.shadowOffsetX = 1 * k; ctx.shadowOffsetY = 2 * k;
  ctx.drawImage(sil, 0, 0, w, h, ox, oy, w, h);
  ctx.restore();
  for (const [dx, dy] of DIRS) ctx.drawImage(sil, 0, 0, w, h, ox + dx * r, oy + dy * r, w, h);
  ctx.drawImage(tmp, 0, 0, w, h, ox, oy, w, h);
  ctx.restore();
}

export function dibujarEscenario(
  ctx: CanvasRenderingContext2D, size: number, items: Item[], ms: number,
  fondo: { dur: number; capas: Capa[] } = FONDO, borde = true, enEdicion: number | null = null
) {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.setTransform(size / ESCENARIO, 0, 0, size / ESCENARIO, 0, 0);
  ctx.clearRect(0, 0, ESCENARIO, ESCENARIO);
  dibujarCapas(ctx, fondo.capas, fondo.dur, ms);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, ESCENARIO, ESCENARIO); ctx.clip();
  // La pieza que se está editando se queda quieta en su punto A para elegir el trayecto con calma.
  for (const it of items) dibujarItem(ctx, it.uid === enEdicion ? quieto(it) : it, ms, size, borde);
  ctx.restore();
  ctx.restore();
}

// La misma pieza sin trayecto: se dibuja en su punto A.
export const quieto = (it: Item): Item => (it.destino ? { ...it, destino: undefined } : it);

// Caja del item en coordenadas del escenario (para tocar, seleccionar y escalar).
export function cajaItem(it: Item, ms = 0) {
  const [, , bw, bh] = pieza(it.tipo).caja;
  const w = bw * it.escala, h = bh * it.escala;
  const pos = posicionItem(it, ms);
  return { x: pos.x - w / 2, y: pos.y - h / 2, w, h };
}

// editando: en pausa la pieza se muestra en A con un fantasma en B; en play, solo la guía del trayecto.
export function dibujarSeleccion(ctx: CanvasRenderingContext2D, size: number, it: Item, ms = 0, editando = true) {
  const k = size / ESCENARIO, b = cajaItem(editando ? quieto(it) : it, ms);
  ctx.save();
  ctx.setTransform(k, 0, 0, k, 0, 0);

  // Trayecto A → B: A (amarillo) es donde está la pieza; B (verde) se arrastra para elegir hacia dónde camina.
  if (it.destino) {
    const d = it.destino;
    if (editando) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.translate(d.x, d.y);
      ctx.scale(it.escala * (d.x < it.x ? -1 : 1), it.escala);
      dibujarPieza(ctx, it.tipo, ms, it.variante ?? 0, it.color);
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(it.x, it.y); ctx.lineTo(d.x, d.y); ctx.stroke();
    ctx.setLineDash([]);
    const punto = (x: number, y: number, color: string, letra: string, r: number) => {
      ctx.fillStyle = color; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#000'; ctx.font = `700 ${r * 1.2}px "DM Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(letra, x, y + 0.5);
    };
    punto(it.x, it.y, '#FFC20E', 'A', 5);
    punto(d.x, d.y, '#00A651', 'B', ASA);
    ctx.restore();
  }

  // Caja de selección
  ctx.lineWidth = 1.5; ctx.strokeStyle = '#FFC20E'; ctx.setLineDash([5, 4]);
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.setLineDash([]);
  ctx.fillStyle = '#FFC20E'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(b.x + b.w, b.y + b.h, ASA, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
export const ASA = 7; // radio del tirador de escala, en unidades del escenario
