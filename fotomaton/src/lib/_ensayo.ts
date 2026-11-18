// TEMPORAL (no se commitea): candidatos del efecto Geométrico para la hoja comparativa.
import type { Tinta } from '../data/tintas';
import type { Cara } from './cara';
import { dibujarEncuadre, lienzoTmp, type Fuente } from './trama';

const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = (h: string) => { const [r, g, b] = rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const mezclar = (a: string, b: string, t: number) => '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
function tintasDe(t: Tinta): string[] {
  const base = t.modo === 'cmyk' ? [t.c!, t.m!, t.y!, t.k!]
    : t.modo === 'duo' ? [t.a!, t.b!, mezclar(t.a!, t.papel, 0.5)]
    : [t.a!, mezclar(t.a!, t.papel, 0.62), mezclar(t.a!, t.papel, 0.32)];
  return base.sort((x, y) => lum(x) - lum(y));
}

// Paleta por bandas de luz: las tintas de luz parecida forman una banda; dentro de una banda se elige la de color más
// parecido a la foto. Así la cara se lee por luces y sombras y el color sigue a la foto (piel rosa, cielo celeste…).
export function bandas(t: Tinta) {
  const inks = tintasDe(t), g: string[][] = [];
  for (const c of inks) { const u = g[g.length - 1]; if (u && lum(c) - lum(u[u.length - 1]) < 0.1) u.push(c); else g.push([c]); }
  if (lum(t.papel) - lum(inks[inks.length - 1]) < 0.1 && g.length > 1) g[g.length - 1].push(t.papel); else g.push([t.papel]);
  const info = g.map(b => b.map(h => { const [r, gg, bb] = rgb(h).map(v => v / 255), l = 0.299 * r + 0.587 * gg + 0.114 * bb; return { h, c: [r - l, gg - l, bb - l] }; }));
  return {
    n: g.length,
    de(i: number, r: number, gg: number, b: number) {
      const banda = info[Math.max(0, Math.min(info.length - 1, i))]; if (banda.length === 1) return banda[0].h;
      const l = 0.299 * r + 0.587 * gg + 0.114 * b, c = [r - l, gg - l, b - l];
      let mejor = banda[0].h, dm = 1e9;
      for (const x of banda) { const d = (x.c[0] - c[0]) ** 2 + (x.c[1] - c[1]) ** 2 + (x.c[2] - c[2]) ** 2; if (d < dm) { dm = d; mejor = x.h; } }
      return mejor;
    },
  };
}

// Muestra fina de la foto encuadrada + niveles automáticos (percentiles 2 y 98 de la luz).
function muestra(src: Fuente, w: number, h: number, paso: number, cara: Cara | null) {
  const mw = Math.max(1, Math.ceil(w / paso)), mh = Math.max(1, Math.ceil(h / paso));
  const m = lienzoTmp('ens', mw, mh), mx = m.getContext('2d', { willReadFrequently: true })!;
  mx.clearRect(0, 0, mw, mh); dibujarEncuadre(mx, src, mw, mh, cara);
  const d = mx.getImageData(0, 0, mw, mh).data;
  const L = new Float32Array(mw * mh), R = new Float32Array(mw * mh), G = new Float32Array(mw * mh), B = new Float32Array(mw * mh);
  const hist = new Uint32Array(256);
  for (let i = 0; i < mw * mh; i++) {
    R[i] = d[i * 4] / 255; G[i] = d[i * 4 + 1] / 255; B[i] = d[i * 4 + 2] / 255;
    L[i] = 0.299 * R[i] + 0.587 * G[i] + 0.114 * B[i]; hist[Math.min(255, (L[i] * 255) | 0)]++;
  }
  const pct = (p: number) => { let a = 0; const n = mw * mh * p; for (let i = 0; i < 256; i++) { a += hist[i]; if (a >= n) return i / 255; } return 1; };
  const lo = pct(0.02), hi = Math.max(lo + 0.1, pct(0.98));
  for (let i = 0; i < L.length; i++) L[i] = Math.min(1, Math.max(0, (L[i] - lo) / (hi - lo)));
  const en = (x: number, y: number) => Math.min(mw - 1, Math.max(0, (x / paso) | 0)) + Math.min(mh - 1, Math.max(0, (y / paso) | 0)) * mw;
  return { L, R, G, B, en, mw, mh };
}

const q = (v: number, n: number) => Math.round(Math.min(1, Math.max(0, v)) * (n - 1)) / (n - 1);
function colorReal(r: number, g: number, b: number) {
  // un poco más de saturación y pocos niveles: color plano, no sucio
  const l = 0.299 * r + 0.587 * g + 0.114 * b, s = 1.25;
  const f = (v: number) => Math.round(q((l + (v - l) * s - 0.5) * 1.15 + 0.5, 7) * 255);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

type P = [number, number];
const triangulo = (o: CanvasRenderingContext2D, a: P, b: P, c: P) => { o.moveTo(a[0], a[1]); o.lineTo(b[0], b[1]); o.lineTo(c[0], c[1]); o.closePath(); };

// B · grilla regular de triángulos equiláteros, color medio por celda (tono plano de la paleta), juntas finas
export function grillaTri(src: Fuente, w: number, h: number, celda: number, tinta: Tinta, cara: Cara | null, k = 3.4) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  const T = Math.max(7, celda * k), paso = Math.max(1, T / 6), s = muestra(src, w, h, paso, cara);
  const out = lienzoTmp('ensB', w, h), o = out.getContext('2d')!;
  o.globalAlpha = 1; o.fillStyle = tinta.papel; o.fillRect(0, 0, w, h);
  const rampa = [...tintasDe(tinta), tinta.papel], n = rampa.length;
  const H = T * Math.sqrt(3) / 2, cols = Math.ceil(w / (T / 2)) + 3, filas = Math.ceil(h / H) + 1;
  const ox = (w - (cols - 1) * T / 2) / 2 - T / 2, oy = (h - filas * H) / 2;
  const junta = Math.max(0.6, T / 28), bn = bandas(tinta); void rampa; void n;
  for (let j = 0; j < filas; j++) for (let i = 0; i < cols; i++) {
    const x = ox + i * T / 2, y0 = oy + j * H, y1 = y0 + H, arriba = (i + j) % 2 === 0;
    const a: P = arriba ? [x, y1] : [x, y0], b: P = arriba ? [x + T / 2, y0] : [x + T / 2, y1], c: P = arriba ? [x + T, y1] : [x + T, y0];
    const gx = (a[0] + b[0] + c[0]) / 3, gy = (a[1] + b[1] + c[1]) / 3;
    let L = 0, r = 0, g = 0, bl = 0, m = 0;
    for (const t of [0, 0.45]) for (const v of t ? [a, b, c] : [[gx, gy] as P]) {
      const p = s.en(gx + (v[0] - gx) * t, gy + (v[1] - gy) * t); L += s.L[p]; r += s.R[p]; g += s.G[p]; bl += s.B[p]; m++;
    }
    L /= m;
    o.fillStyle = tinta.colorReal ? colorReal(r / m, g / m, bl / m) : bn.de(Math.round(L * (bn.n - 1)), r / m, g / m, bl / m);
    o.beginPath(); triangulo(o, a, b, c); o.fill();
  }
  // juntas de papel
  o.strokeStyle = tinta.papel; o.lineWidth = junta; o.beginPath();
  for (let j = 0; j <= filas; j++) { o.moveTo(0, oy + j * H); o.lineTo(w, oy + j * H); }
  const d = H / (T / 2);
  for (let i = -filas; i <= cols + filas; i++) {
    const x = ox + i * T / 2;
    o.moveTo(x - (oy + 2 * H) / d * 0, oy); // marcador
    o.moveTo(x, oy); o.lineTo(x + (h + 2 * H) / d, oy + h + 2 * H);
    o.moveTo(x, oy); o.lineTo(x - (h + 2 * H) / d, oy + h + 2 * H);
  }
  o.stroke();
  return out;
}

// C · semitono de triángulos: grilla regular; cada celda lleva el tono claro de fondo y un triángulo del tono oscuro
// que crece con la sombra (dos tonos vecinos de la paleta → gradación continua)
export function semitonoTri(src: Fuente, w: number, h: number, celda: number, tinta: Tinta, cara: Cara | null, k = 2.6) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  const T = Math.max(6, celda * k), paso = Math.max(1, T / 5), s = muestra(src, w, h, paso, cara);
  const out = lienzoTmp('ensC', w, h), o = out.getContext('2d')!;
  o.globalAlpha = 1; o.fillStyle = tinta.papel; o.fillRect(0, 0, w, h);
  const rampa = [...tintasDe(tinta), tinta.papel], n = rampa.length;
  const H = T * Math.sqrt(3) / 2, cols = Math.ceil(w / (T / 2)) + 3, filas = Math.ceil(h / H) + 1;
  const ox = (w - (cols - 1) * T / 2) / 2 - T / 2, oy = (h - filas * H) / 2;
  for (let j = 0; j < filas; j++) for (let i = 0; i < cols; i++) {
    const x = ox + i * T / 2, y0 = oy + j * H, y1 = y0 + H, arriba = (i + j) % 2 === 0;
    const a: P = arriba ? [x, y1] : [x, y0], b: P = arriba ? [x + T / 2, y0] : [x + T / 2, y1], c: P = arriba ? [x + T, y1] : [x + T, y0];
    const gx = (a[0] + b[0] + c[0]) / 3, gy = (a[1] + b[1] + c[1]) / 3, p = s.en(gx, gy);
    const bn = bandas(tinta), t = s.L[p] * (bn.n - 1), lo = Math.min(bn.n - 2, Math.floor(t)), f = t - lo; void rampa; void n;
    if (tinta.colorReal) {
      o.fillStyle = colorReal(s.R[p], s.G[p], s.B[p]); o.beginPath(); triangulo(o, a, b, c); o.fill();
      continue;
    }
    o.fillStyle = bn.de(lo + 1, s.R[p], s.G[p], s.B[p]); o.beginPath(); triangulo(o, a, b, c); o.fill();
    const e = Math.sqrt(1 - f) * 0.98; if (e < 0.08) continue;
    const z = (v: P): P => [gx + (v[0] - gx) * e, gy + (v[1] - gy) * e];
    o.fillStyle = bn.de(lo, s.R[p], s.G[p], s.B[p]); o.beginPath(); triangulo(o, z(a), z(b), z(c)); o.fill();
  }
  return out;
}

// D · truchet Bauhaus: grilla cuadrada; cada celda tiene el tono claro de fondo y un cuarto de círculo del tono
// oscuro, en la esquina hacia donde está la sombra, que crece con ella
export function truchet(src: Fuente, w: number, h: number, celda: number, tinta: Tinta, cara: Cara | null, k = 2.6) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  const S = Math.max(5, celda * k), paso = Math.max(1, S / 4), s = muestra(src, w, h, paso, cara);
  const out = lienzoTmp('ensD', w, h), o = out.getContext('2d')!;
  o.globalAlpha = 1; o.fillStyle = tinta.papel; o.fillRect(0, 0, w, h);
  const rampa = [...tintasDe(tinta), tinta.papel], n = rampa.length;
  const cols = Math.ceil(w / S), filas = Math.ceil(h / S), ox = (w - cols * S) / 2, oy = (h - filas * S) / 2;
  for (let j = 0; j < filas; j++) for (let i = 0; i < cols; i++) {
    const x = ox + i * S, y = oy + j * S, cx = x + S / 2, cy = y + S / 2;
    const Lc = s.L[s.en(cx, cy)];
    const dx = s.L[s.en(x + S, cy)] - s.L[s.en(x, cy)], dy = s.L[s.en(cx, y + S)] - s.L[s.en(cx, y)];
    // la esquina del lado oscuro; en lo plano, alterna como en un tablero
    const sx = Math.abs(dx) > 0.04 ? (dx > 0 ? 0 : 1) : (i + j) % 2, sy = Math.abs(dy) > 0.04 ? (dy > 0 ? 0 : 1) : ((i >> 1) + j) % 2;
    const bn = bandas(tinta), t = Lc * (bn.n - 1), lo = Math.min(bn.n - 2, Math.floor(t)), f = t - lo, pc = s.en(cx, cy); void rampa; void n;
    if (tinta.colorReal) {
      const p = s.en(cx, cy);
      o.fillStyle = colorReal(s.R[p], s.G[p], s.B[p]); o.fillRect(x, y, S + 0.5, S + 0.5);
      continue;
    }
    o.fillStyle = bn.de(lo + 1, s.R[pc], s.G[pc], s.B[pc]); o.fillRect(x, y, S + 0.5, S + 0.5);
    const area = 1 - f; if (area < 0.06) continue;
    const r = Math.min(S * Math.SQRT2, S * Math.sqrt(area * 4 / Math.PI));
    const qx = x + sx * S, qy = y + sy * S;
    o.save(); o.beginPath(); o.rect(x, y, S + 0.5, S + 0.5); o.clip();
    o.fillStyle = bn.de(lo, s.R[pc], s.G[pc], s.B[pc]); o.beginPath(); o.moveTo(qx, qy); o.arc(qx, qy, r, 0, Math.PI * 2); o.fill(); o.restore();
  }
  return out;
}

// E · cuadros partidos: grilla cuadrada; cada cuadro se parte por la diagonal que mejor separa la foto y cada
// mitad lleva su tono plano (los bordes de la cara quedan como triángulos)
export function partidos(src: Fuente, w: number, h: number, celda: number, tinta: Tinta, cara: Cara | null, k = 3.2) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  const S = Math.max(6, celda * k), paso = Math.max(1, S / 6), s = muestra(src, w, h, paso, cara);
  const out = lienzoTmp('ensE', w, h), o = out.getContext('2d')!;
  o.globalAlpha = 1; o.fillStyle = tinta.papel; o.fillRect(0, 0, w, h);
  const rampa = [...tintasDe(tinta), tinta.papel], n = rampa.length;
  const cols = Math.ceil(w / S), filas = Math.ceil(h / S), ox = (w - cols * S) / 2, oy = (h - filas * S) / 2;
  const bn = bandas(tinta); void rampa; void n;
  const tono = (pts: P[]) => {
    let L = 0, r = 0, g = 0, b = 0;
    for (const [x, y] of pts) { const p = s.en(x, y); L += s.L[p]; r += s.R[p]; g += s.G[p]; b += s.B[p]; }
    const m = pts.length;
    return tinta.colorReal ? colorReal(r / m, g / m, b / m) : bn.de(Math.round(L / m * (bn.n - 1)), r / m, g / m, b / m);
  };
  const lumDe = (pts: P[]) => pts.reduce((t, [x, y]) => t + s.L[s.en(x, y)], 0) / pts.length;
  for (let j = 0; j < filas; j++) for (let i = 0; i < cols; i++) {
    const x = ox + i * S, y = oy + j * S, u = S / 4;
    // muestras en las 4 esquinas internas de la celda (tl, tr, bl, br) y en los bordes
    const tl: P[] = [[x + u, y + u], [x + u * 0.6, y + u * 2], [x + u * 2, y + u * 0.6]], br: P[] = [[x + 3 * u, y + 3 * u], [x + 3.4 * u, y + 2 * u], [x + 2 * u, y + 3.4 * u]];
    const tr: P[] = [[x + 3 * u, y + u], [x + 3.4 * u, y + 2 * u], [x + 2 * u, y + u * 0.6]], bl: P[] = [[x + u, y + 3 * u], [x + u * 0.6, y + 2 * u], [x + 2 * u, y + 3.4 * u]];
    // diagonal «\» separa tr de bl; «/» separa tl de br
    const d1 = Math.abs(lumDe(tr) - lumDe(bl)), d2 = Math.abs(lumDe(tl) - lumDe(br));
    const A: P = [x, y], B: P = [x + S + 0.4, y], C: P = [x + S + 0.4, y + S + 0.4], D: P = [x, y + S + 0.4];
    if (d1 >= d2) { // «\»: A–C
      o.fillStyle = tono(tr); o.beginPath(); triangulo(o, A, B, C); o.fill();
      o.fillStyle = tono(bl); o.beginPath(); triangulo(o, A, C, D); o.fill();
    } else { // «/»: B–D
      o.fillStyle = tono(tl); o.beginPath(); triangulo(o, A, B, D); o.fill();
      o.fillStyle = tono(br); o.beginPath(); triangulo(o, B, C, D); o.fill();
    }
  }
  return out;
}
