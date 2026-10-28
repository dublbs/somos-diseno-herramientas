import { marcoListo } from '../data/marcos';
import type { Tinta } from '../data/tintas';
import type { Cara } from './cara';

export type Fuente = HTMLCanvasElement | HTMLVideoElement;

// Trama CMYK de puntos rotados (Y 0°, C 15°, K 45°, M 75°).
const pool: Record<string, HTMLCanvasElement> = {};
function lienzoTmp(key: string, w: number, h: number) {
  const c = pool[key] ??= document.createElement('canvas');
  if (c.width !== w) c.width = w;
  if (c.height !== h) c.height = h;
  return c;
}

// --- Color ---------------------------------------------------------------
const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = (h: string) => { const [r, g, b] = rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const mezclar = (a: string, b: string, t: number) => '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
const HEX6 = /^#[0-9a-f]{6}$/i;

// Tintas de la paleta, de más oscura a más clara (para repartir los colores del marco).
function tintasDe(t: Tinta): string[] {
  const base = t.modo === 'cmyk' ? [t.c!, t.m!, t.y!, t.k!]
    : t.modo === 'duo' ? [t.a!, t.b!, mezclar(t.a!, t.papel, 0.5)]
    : [t.a!, mezclar(t.a!, t.papel, 0.62), mezclar(t.a!, t.papel, 0.32)];
  return base.sort((x, y) => lum(x) - lum(y));
}

// Recolorea un marco con la paleta de la tinta. Se conserva su estructura de claros y oscuros:
// lo casi blanco pasa a ser el papel; el resto se reparte entre las tintas por luminosidad
// (el color más oscuro del marco → la tinta más oscura, y así hacia arriba).
const cacheMarcos = new Map<string, { bg: string; fills: string[] }>();
function marcoConTinta(m: { id: string; bg: string; _p: [Path2D, string][] }, t: Tinta) {
  const key = m.id + '|' + t.label;
  let r = cacheMarcos.get(key);
  if (r) return r;
  const orig = [m.bg, ...m._p.map(p => p[1])];
  if (!orig.every(c => HEX6.test(c))) { r = { bg: m.bg, fills: m._p.map(p => p[1]) }; cacheMarcos.set(key, r); return r; }
  const mapa = new Map<string, string>();
  const claros = new Set(orig.map(c => c.toLowerCase()).filter(c => lum(c) > 0.86));
  claros.forEach(c => mapa.set(c, t.papel));
  const resto = [...new Set(orig.map(c => c.toLowerCase()))].filter(c => !claros.has(c)).sort((a, b) => lum(a) - lum(b));
  const pal = tintasDe(t), n = resto.length;
  resto.forEach((c, i) => mapa.set(c, pal[n === 1 ? Math.floor(pal.length / 2) : Math.round(i * (pal.length - 1) / (n - 1))]));
  const f = (c: string) => mapa.get(c.toLowerCase())!;
  r = { bg: f(m.bg), fills: m._p.map(p => f(p[1])) };
  cacheMarcos.set(key, r);
  return r;
}

const medidas = (src: Fuente) => ({
  sw: (src as HTMLVideoElement).videoWidth || (src as HTMLCanvasElement).width,
  sh: (src as HTMLVideoElement).videoHeight || (src as HTMLCanvasElement).height,
});

// Escala del encuadre. Una persona: la cara ocupa ~52 % del ancho (centrado de cámara).
// Grupo: solo se ajusta para que entren todas las caras, con aire alrededor.
function escalaEncuadre(w: number, h: number, sw: number, sh: number, cara: Cara) {
  const cubrir = Math.max(w / sw, h / sh);
  return cara.n > 1
    ? Math.max(cubrir, Math.min(w * 0.9 / cara.w, h * 0.7 / cara.h))
    : Math.max(cubrir, Math.min(w * 0.52 / cara.w, h * 0.5 / cara.h));
}

// Encuadre: si hay cara(s), escala y centra; si no, recorta al centro. Nunca deja bordes vacíos.
export function dibujarEncuadre(ctx: CanvasRenderingContext2D, src: Fuente, w: number, h: number, cara: Cara | null) {
  const { sw, sh } = medidas(src);
  const cubrir = Math.max(w / sw, h / sh);
  if (!cara) { ctx.drawImage(src, (w - sw * cubrir) / 2, (h - sh * cubrir) / 2, sw * cubrir, sh * cubrir); return; }
  const s = escalaEncuadre(w, h, sw, sh, cara);
  const fx = cara.x + cara.w / 2, fy = cara.y + cara.h / 2;
  const dx = Math.min(0, Math.max(w - sw * s, w / 2 - fx * s));
  const dy = Math.min(0, Math.max(h - sh * s, h * (cara.n > 1 ? 0.5 : 0.46) - fy * s));
  ctx.drawImage(src, dx, dy, sw * s, sh * s);
}

export function trama(src: Fuente, w: number, h: number, celda: number, tinta: Tinta, cara: Cara | null) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h)); celda = Math.max(3, celda);
  const paso = Math.max(1, celda / 2), mw = Math.ceil(w / paso), mh = Math.ceil(h / paso);
  const m = lienzoTmp('muestra', mw, mh), mx = m.getContext('2d', { willReadFrequently: true })!;
  mx.clearRect(0, 0, mw, mh); dibujarEncuadre(mx, src, mw, mh, cara);
  const px = mx.getImageData(0, 0, mw, mh).data;
  const out = lienzoTmp('trama', w, h), o = out.getContext('2d')!;
  o.globalCompositeOperation = 'source-over'; o.fillStyle = tinta.papel; o.fillRect(0, 0, w, h);
  // 'opaca': los puntos tapan lo de abajo (colores puros). 'multiply': tintas translúcidas, como imprenta.
  const opaca = tinta.mezcla === 'opaca';
  o.globalCompositeOperation = opaca ? 'source-over' : 'multiply';
  const cx = w / 2, cy = h / 2, n = Math.ceil(Math.hypot(w, h) / celda / 2) + 1, rmax = celda * 0.5 * (opaca ? 1.1 : 1.42), vmin = opaca ? 0.1 : 0.04;
  const ajustar = (v: number) => Math.min(1, Math.max(0, (v - 0.5) * 1.18 + 0.52));
  const canales: [string, number, string][] = tinta.modo === 'cmyk'
    ? [['y', 0, tinta.y!], ['c', 15, tinta.c!], ['m', 75, tinta.m!], ['k', 45, tinta.k!]]
    : tinta.modo === 'duo' ? [['b', 75, tinta.b!], ['a', 45, tinta.a!]] : [['l', 45, tinta.a!]];
  // Opaca: de lo más claro a lo más oscuro, así los puntos oscuros siempre quedan arriba.
  if (opaca) canales.sort((p, q) => lum(q[2]) - lum(p[2]));
  for (const [ch, ang, color] of canales) {
    const a = ang * Math.PI / 180, co = Math.cos(a), si = Math.sin(a);
    o.fillStyle = color; o.beginPath();
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
      const gx = i * celda, gy = j * celda, x = cx + gx * co - gy * si, y = cy + gx * si + gy * co;
      if (x < -celda || y < -celda || x > w + celda || y > h + celda) continue;
      const sx = Math.min(mw - 1, Math.max(0, (x / paso) | 0)), sy = Math.min(mh - 1, Math.max(0, (y / paso) | 0)), p = (sy * mw + sx) * 4;
      const r = ajustar(px[p] / 255), g = ajustar(px[p + 1] / 255), b = ajustar(px[p + 2] / 255);
      const k = 1 - Math.max(r, g, b), L = 0.299 * r + 0.587 * g + 0.114 * b; let v: number;
      if (ch === 'l') v = Math.pow(1 - L, 1.1);
      else if (ch === 'a') v = Math.min(1, Math.max(0, (0.66 - L) / 0.66));
      else if (ch === 'b') v = (1 - L) * 0.85;
      else if (ch === 'k') v = k * 0.9;
      else { if (k > 0.995) continue; const base = ch === 'c' ? r : ch === 'm' ? g : b; v = (1 - base - k) / (1 - k); }
      if (v < vmin) continue;
      const rad = rmax * Math.sqrt(v);
      o.moveTo(x + rad, y); o.arc(x, y, rad, 0, Math.PI * 2);
    }
    o.fill();
  }
  o.globalCompositeOperation = 'source-over';
  return out;
}

// Densidad constante: la trama se mide contra la cara (o contra la zona de foto
// si no hay cara), tomando Panel escalonado (192×200, cara ≈ 100 u) como referencia.
// Así un hueco chico (Túnel) usa puntos más finos y la cara lleva la misma cantidad de trama.
export function celdaRelativa(src: Fuente, bw: number, bh: number, celda: number, cara: Cara | null) {
  let escala: number;
  if (cara) {
    const { sw, sh } = medidas(src);
    escala = (cara.ref * escalaEncuadre(bw, bh, sw, sh, cara)) / 100;
  } else escala = Math.sqrt(bw * bh) / 196;
  return Math.max(0.8, celda * escala);
}

// Compone marco: fondo → figura → foto en trama dentro de su zona.
export function componer(ctx: CanvasRenderingContext2D, size: number, marcoId: string, src: Fuente, celda: number, tinta: Tinta, cara?: Cara | null) {
  const m = marcoListo(marcoId), s = size / 240, marco = marcoConTinta(m, tinta);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = marco.bg; ctx.fillRect(0, 0, size, size);
  ctx.setTransform(s, 0, 0, s, 0, 0);
  m._p.forEach(([p], i) => { ctx.fillStyle = marco.fills[i]; ctx.fill(p); });
  const [bx, by, bw, bh] = m._clip.box;
  const t = trama(src, bw * s, bh * s, celdaRelativa(src, bw, bh, celda, cara ?? null) * s, tinta, cara ?? null);
  ctx.clip(m._clip.path);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(t, Math.round(bx * s), Math.round(by * s));
  ctx.restore();
}

// Imagen de muestra para miniaturas y portada.
export const DEMO = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 360; const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 360, 360); g.addColorStop(0, '#7FC8F8'); g.addColorStop(1, '#FF8FB1');
  x.fillStyle = g; x.fillRect(0, 0, 360, 360);
  const h = x.createLinearGradient(0, 240, 0, 360); h.addColorStop(0, '#2B4BD8'); h.addColorStop(1, '#141414');
  x.fillStyle = h; x.beginPath(); x.ellipse(180, 372, 150, 118, 0, 0, Math.PI * 2); x.fill();
  const f = x.createRadialGradient(150, 130, 10, 180, 165, 95); f.addColorStop(0, '#FFE7A8'); f.addColorStop(1, '#D9862B');
  x.fillStyle = f; x.beginPath(); x.ellipse(180, 160, 74, 88, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#141414'; x.beginPath(); x.ellipse(180, 96, 82, 44, 0, Math.PI, 0); x.fill();
  return c;
})();

export function pintarVideo(canvas: HTMLCanvasElement, v: HTMLVideoElement, espejo: boolean, max: number) {
  const vw = v.videoWidth, vh = v.videoHeight; if (!vw) return false;
  const s = Math.min(1, max / Math.max(vw, vh)), w = Math.round(vw * s), h = Math.round(vh * s);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const x = canvas.getContext('2d')!; x.save();
  if (espejo) { x.translate(w, 0); x.scale(-1, 1); }
  x.drawImage(v, 0, 0, w, h); x.restore(); return true;
}

export function leerArchivo(file: File): Promise<HTMLCanvasElement> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const s = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
      c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c);
    };
    im.onerror = rej; im.src = url;
  });
}
