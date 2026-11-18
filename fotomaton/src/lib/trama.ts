import { marcoListo } from '../data/marcos';
import type { Tinta } from '../data/tintas';
import type { Cara } from './cara';

export type Fuente = HTMLCanvasElement | HTMLVideoElement;

// Trama CMYK de puntos rotados (Y 0°, C 15°, K 45°, M 75°).
const pool: Record<string, HTMLCanvasElement> = {};
export function lienzoTmp(key: string, w: number, h: number) {
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
// Los marcos traen '#000' y '#fff' abreviados: se pasan a 6 dígitos para poder recolorearlos.
const largo = (c: string) => (/^#[0-9a-f]{3}$/i.test(c) ? '#' + [...c.slice(1)].map(x => x + x).join('') : c);
// El rojo INACAP solo va en el logo y en detalles de marco que lo llevan a propósito: no se recolorea.
const FIJOS = new Set(['#e2001a']);

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
const cacheMarcos = new Map<string, { bg: string; fills: string[]; encima: string[] }>();
function marcoConTinta(m: { id: string; bg: string; _p: [Path2D, string][]; _encima: [Path2D, string][] }, t: Tinta) {
  const key = m.id + '|' + t.label;
  let r = cacheMarcos.get(key);
  if (r) return r;
  const orig = [m.bg, ...m._p.map(p => p[1]), ...m._encima.map(p => p[1])].map(largo);
  if (!orig.every(c => HEX6.test(c))) { r = { bg: m.bg, fills: m._p.map(p => p[1]), encima: m._encima.map(p => p[1]) }; cacheMarcos.set(key, r); return r; }
  const mapa = new Map<string, string>();
  const claros = new Set(orig.map(c => c.toLowerCase()).filter(c => lum(c) > 0.86 && !FIJOS.has(c)));
  claros.forEach(c => mapa.set(c, t.papel));
  const resto = [...new Set(orig.map(c => c.toLowerCase()))].filter(c => !claros.has(c) && !FIJOS.has(c)).sort((a, b) => lum(a) - lum(b));
  const pal = tintasDe(t), n = resto.length;
  resto.forEach((c, i) => mapa.set(c, pal[n === 1 ? Math.floor(pal.length / 2) : Math.round(i * (pal.length - 1) / (n - 1))]));
  const f = (c: string) => mapa.get(largo(c).toLowerCase()) ?? largo(c);
  r = { bg: f(m.bg), fills: m._p.map(p => f(p[1])), encima: m._encima.map(p => f(p[1])) };
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

// solo: dibuja una sola placa (canal) · apagadas: placas que la persona apagó (no se imprimen).
// Memoria de trabajo de la trama (se reutiliza entre cuadros de la vista en vivo).
let bufTrama = new Float32Array(0), bufRadios = new Float32Array(0);
export function trama(src: Fuente, w: number, h: number, celda: number, tinta: Tinta, cara: Cara | null, solo?: string, apagadas?: readonly string[]) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h)); celda = Math.max(3, celda);
  const paso = Math.max(1, celda / 2), mw = Math.ceil(w / paso), mh = Math.ceil(h / paso);
  const m = lienzoTmp('muestra', mw, mh), mx = m.getContext('2d', { willReadFrequently: true })!;
  mx.clearRect(0, 0, mw, mh); dibujarEncuadre(mx, src, mw, mh, cara);
  const px = mx.getImageData(0, 0, mw, mh).data;
  // Se rasteriza a mano (ImageData) en vez de dibujar miles de arcos: en la tablet, rellenar ~30 000 círculos por cuadro
  // con mezcla «multiply» era lo que dejaba la vista en vivo de Orgánica a pocos cuadros por segundo. Mismo dibujo:
  // cada punto es un círculo de radio rmax·√v con borde suavizado de 1 px.
  const out = lienzoTmp('trama', w, h), o = out.getContext('2d')!;
  // 'opaca': los puntos tapan lo de abajo (colores puros). 'multiply': tintas translúcidas, como imprenta.
  const opaca = tinta.mezcla === 'opaca';
  const cx = w / 2, cy = h / 2, n = Math.ceil(Math.hypot(w, h) / celda / 2) + 1, rmax = celda * 0.5 * (opaca ? 1.1 : 1.42), vmin = opaca ? 0.1 : 0.04;
  const ajustar = (v: number) => Math.min(1, Math.max(0, (v - 0.5) * 1.18 + 0.52));
  const canales: [string, number, string][] = tinta.modo === 'cmyk'
    ? [['y', 0, tinta.y!], ['c', 15, tinta.c!], ['m', 75, tinta.m!], ['k', 45, tinta.k!]]
    : tinta.modo === 'duo' ? [['b', 75, tinta.b!], ['a', 45, tinta.a!]] : [['l', 45, tinta.a!]];
  // Opaca: de lo más claro a lo más oscuro, así los puntos oscuros siempre quedan arriba.
  if (opaca) canales.sort((p, q) => lum(q[2]) - lum(p[2]));
  const N = w * h;
  if (bufTrama.length < N * 3) bufTrama = new Float32Array(N * 3);
  const R = bufTrama.subarray(0, N), G = bufTrama.subarray(N, 2 * N), B = bufTrama.subarray(2 * N, 3 * N);
  const [pr, pg, pb] = rgb(tinta.papel).map(v => v / 255);
  R.fill(pr); G.fill(pg); B.fill(pb);
  const lado = 2 * n + 1;
  if (bufRadios.length < lado * lado) bufRadios = new Float32Array(lado * lado);
  const radios = bufRadios.subarray(0, lado * lado);
  for (const [ch, ang, color] of canales) {
    if (solo ? ch !== solo : apagadas?.includes(ch)) continue;
    const a = ang * Math.PI / 180, co = Math.cos(a), si = Math.sin(a);
    // radio de cada punto de la grilla girada
    radios.fill(0);
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
      radios[(i + n) * lado + (j + n)] = rmax * Math.sqrt(v);
    }
    // cada píxel: cobertura del punto más cercano entre los 4 de su celda girada
    const [tr, tg, tb] = rgb(color).map(v => v / 255), du = co / celda, dv = -si / celda;
    for (let y = 0; y < h; y++) {
      const dy = y + 0.5 - cy, dx0 = 0.5 - cx;
      let u = (dx0 * co + dy * si) / celda + n, v = (-dx0 * si + dy * co) / celda + n;
      let q = y * w;
      for (let x = 0; x < w; x++, q++, u += du, v += dv) {
        const i0 = Math.floor(u), j0 = Math.floor(v);
        if (i0 < 0 || j0 < 0 || i0 + 1 >= lado || j0 + 1 >= lado) continue;
        const fu = u - i0, fv = v - j0, b0 = i0 * lado + j0;
        let cov = 0, rr: number, d: number, c: number;
        rr = radios[b0]; d = celda * celda * (fu * fu + fv * fv); if (rr > 0 && d < (rr + 0.5) * (rr + 0.5)) { d = Math.sqrt(d); c = rr - d + 0.5; if (c > cov) cov = c; }
        rr = radios[b0 + lado]; d = celda * celda * ((1 - fu) * (1 - fu) + fv * fv); if (rr > 0 && d < (rr + 0.5) * (rr + 0.5)) { d = Math.sqrt(d); c = rr - d + 0.5; if (c > cov) cov = c; }
        rr = radios[b0 + 1]; d = celda * celda * (fu * fu + (1 - fv) * (1 - fv)); if (rr > 0 && d < (rr + 0.5) * (rr + 0.5)) { d = Math.sqrt(d); c = rr - d + 0.5; if (c > cov) cov = c; }
        rr = radios[b0 + lado + 1]; d = celda * celda * ((1 - fu) * (1 - fu) + (1 - fv) * (1 - fv)); if (rr > 0 && d < (rr + 0.5) * (rr + 0.5)) { d = Math.sqrt(d); c = rr - d + 0.5; if (c > cov) cov = c; }
        if (cov <= 0) continue;
        if (cov > 1) cov = 1;
        if (opaca) { R[q] += (tr - R[q]) * cov; G[q] += (tg - G[q]) * cov; B[q] += (tb - B[q]) * cov; }
        else { R[q] *= 1 - cov * (1 - tr); G[q] *= 1 - cov * (1 - tg); B[q] *= 1 - cov * (1 - tb); }
      }
    }
  }
  const im = o.createImageData(w, h), dd = im.data;
  for (let q = 0, z = 0; q < N; q++, z += 4) { dd[z] = R[q] * 255; dd[z + 1] = G[q] * 255; dd[z + 2] = B[q] * 255; dd[z + 3] = 255; }
  o.putImageData(im, 0, 0);
  return out;
}


// --- Efectos por lenguaje -------------------------------------------------
// Orgánica = trama CMYK (arriba) · Pixel = pantalla CRT · Geométrica = semitono de triángulos.
export const EFECTOS = {
  Orgánica: { nombre: 'Trama CMYK', control: 'Trama', paleta: 'Tinta', ayuda: 'Con la trama fina se reconoce mejor la cara.' },
  Pixel: { nombre: 'Pantalla CRT', control: 'Píxel', paleta: 'Paleta', ayuda: 'Con píxeles chicos se reconoce mejor la cara.' },
  'Geométrica': { nombre: 'Semitono de triángulos', control: 'Triángulo', paleta: 'Paleta', ayuda: 'Cada triángulo crece con la sombra. Con triángulos chicos se reconoce mejor la cara.' },
} as const;

// Foto reducida a una grilla: un pixel por bloque.
function reducir(src: Fuente, w: number, h: number, bloque: number, cara: Cara | null) {
  const mw = Math.max(1, Math.ceil(w / bloque)), mh = Math.max(1, Math.ceil(h / bloque));
  const m = lienzoTmp('reducida', mw, mh), mx = m.getContext('2d', { willReadFrequently: true })!;
  mx.clearRect(0, 0, mw, mh); dibujarEncuadre(mx, src, mw, mh, cara);
  return { mw, mh, px: mx.getImageData(0, 0, mw, mh).data };
}
const realce = (v: number) => Math.min(1, Math.max(0, (v - 0.5) * 1.2 + 0.5));
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// Pixel · pantalla CRT: bloques de color con tramado ordenado, líneas de barrido, máscara RGB y viñeta.
// Con la tinta CMYK se ve a todo color (posterizado); con las otras, la foto se pinta con la paleta.
export function crt(src: Fuente, w: number, h: number, celda: number, tinta: Tinta, cara: Cara | null) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  const b = Math.max(3, celda * 1.3), { mw, mh, px } = reducir(src, w, h, b, cara);
  const out = lienzoTmp('crt', w, h), o = out.getContext('2d')!;
  o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1; o.fillStyle = tinta.papel; o.fillRect(0, 0, w, h);
  const rampa = [...tintasDe(tinta), tinta.papel], n = rampa.length;
  for (let j = 0; j < mh; j++) for (let i = 0; i < mw; i++) {
    const p = (j * mw + i) * 4, r = px[p] / 255, g = px[p + 1] / 255, bl = px[p + 2] / 255;
    if (tinta.colorReal) {
      const q = (v: number) => Math.round(realce(v) * 5) / 5 * 255;
      o.fillStyle = `rgb(${q(r) | 0},${q(g) | 0},${q(bl) | 0})`;
    } else {
      const L = realce(0.299 * r + 0.587 * g + 0.114 * bl) + (BAYER[(j & 3) * 4 + (i & 3)] / 16 - 0.47) * 0.3;
      o.fillStyle = rampa[Math.min(n - 1, Math.max(0, Math.round(L * (n - 1))))];
    }
    o.fillRect(i * b, j * b, b + 0.6, b + 0.6);
  }
  // líneas de barrido: la parte baja de cada fila de píxeles queda más oscura
  o.fillStyle = 'rgba(0,0,0,0.24)';
  for (let y = 0; y < h; y += b) o.fillRect(0, y + b * 0.62, w, b * 0.38);
  // máscara de fósforo RGB: franjas finas que tiñen apenas cada tercio del píxel
  const k = Math.max(1, b / 3), tile = lienzoTmp('mascara', Math.ceil(k * 3), 2), tx = tile.getContext('2d')!;
  ['#ff8f8f', '#8fff8f', '#8f8fff'].forEach((c, i) => { tx.fillStyle = c; tx.fillRect(i * k, 0, k + 0.5, 2); });
  const pat = o.createPattern(tile, 'repeat');
  if (pat) { o.globalCompositeOperation = 'multiply'; o.globalAlpha = 0.32; o.fillStyle = pat; o.fillRect(0, 0, w, h); }
  // viñeta de tubo
  o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1;
  const v = o.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.hypot(w, h) / 2);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.4)');
  o.fillStyle = v; o.fillRect(0, 0, w, h);
  return out;
}

// Geométrica · semitono de triángulos (ronda 3, plan 014): una grilla regular de triángulos equiláteros, alternados
// arriba y abajo. Cada celda lleva de fondo el tono claro y encima un triángulo del tono oscuro que crece con la sombra,
// como un semitono de imprenta hecho con triángulos: la gradación es continua y la cara se lee por luces y sombras.
// Los tonos salen de la paleta por bandas de luz (ver bandasDe); con la tinta CMYK, cada triángulo va con su color real.
// Se eligió entre cuatro ensayos (grilla de tono plano, semitono, truchet de cuartos de círculo y cuadros partidos por
// la diagonal) por ser el que mejor deja reconocer la cara en todas las paletas y tamaños.
const bandasCache = new Map<string, { n: number; de: (i: number, r: number, g: number, b: number) => string }>();
// Paleta por bandas de luz: las tintas de luz parecida forman una banda (en Línea azul, rosa, celeste y amarillo casi
// no se distinguen en gris) y dentro de cada banda se elige la de color más parecido a la foto. Así las luces y
// sombras quedan ordenadas y el color sigue a la foto (piel rosa, fondo celeste…).
function bandasDe(t: Tinta) {
  let r = bandasCache.get(t.label);
  if (r) return r;
  const inks = tintasDe(t), g: string[][] = [];
  for (const c of inks) { const u = g[g.length - 1]; if (u && lum(c) - lum(u[u.length - 1]) < 0.1) u.push(c); else g.push([c]); }
  if (g.length > 1 && lum(t.papel) - lum(inks[inks.length - 1]) < 0.1) g[g.length - 1].push(t.papel); else g.push([t.papel]);
  const info = g.map(b => b.map(h => { const [x, y, z] = rgb(h).map(v => v / 255), l = 0.299 * x + 0.587 * y + 0.114 * z; return { h, c: [x - l, y - l, z - l] }; }));
  r = {
    n: g.length,
    de(i, x, y, z) {
      const banda = info[Math.max(0, Math.min(info.length - 1, i))];
      if (banda.length === 1) return banda[0].h;
      const l = 0.299 * x + 0.587 * y + 0.114 * z, c = [x - l, y - l, z - l];
      let mejor = banda[0].h, dm = Infinity;
      for (const e of banda) { const d = (e.c[0] - c[0]) ** 2 + (e.c[1] - c[1]) ** 2 + (e.c[2] - c[2]) ** 2; if (d < dm) { dm = d; mejor = e.h; } }
      return mejor;
    },
  };
  bandasCache.set(t.label, r);
  return r;
}
// Color real (tinta CMYK): un poco más saturado y en pocos niveles, para que cada pieza sea un color plano y limpio.
function colorPlano(r: number, g: number, b: number) {
  const l = 0.299 * r + 0.587 * g + 0.114 * b;
  const f = (v: number) => Math.round(Math.round(Math.min(1, Math.max(0, (l + (v - l) * 1.25 - 0.5) * 1.15 + 0.5)) * 6) / 6 * 255);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
export function mosaico(src: Fuente, w: number, h: number, celda: number, tinta: Tinta, cara: Cara | null) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  const T = Math.max(7, celda * 2.6), paso = Math.max(1, T / 5);
  const { mw, mh, px } = reducir(src, w, h, paso, cara);
  // niveles automáticos (percentiles 2 y 98 de la luz): la cara usa toda la escala aunque la foto esté apagada
  const n = mw * mh, L = new Float32Array(n), hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) { L[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255; hist[Math.min(255, (L[i] * 255) | 0)]++; }
  const pct = (p: number) => { let a = 0; for (let i = 0; i < 256; i++) { a += hist[i]; if (a >= n * p) return i / 255; } return 1; };
  const lo = pct(0.02), hi = Math.max(lo + 0.1, pct(0.98));
  const out = lienzoTmp('mosaico', w, h), o = out.getContext('2d')!;
  o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1; o.fillStyle = tinta.papel; o.fillRect(0, 0, w, h);
  const bn = bandasDe(tinta);
  const H = T * Math.sqrt(3) / 2, cols = Math.ceil(w / (T / 2)) + 3, filas = Math.ceil(h / H) + 1;
  const ox = (w - (cols - 1) * T / 2) / 2 - T / 2, oy = (h - filas * H) / 2;
  const tri = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => { o.beginPath(); o.moveTo(ax, ay); o.lineTo(bx, by); o.lineTo(cx, cy); o.closePath(); o.fill(); };
  for (let j = 0; j < filas; j++) for (let i = 0; i < cols; i++) {
    const x = ox + i * T / 2, arriba = (i + j) % 2 === 0, yb = oy + j * H + (arriba ? H : 0), yp = oy + j * H + (arriba ? 0 : H);
    // base (x, yb)–(x+T, yb) y punta (x+T/2, yp); centro a un tercio de la altura desde la base
    const gx = x + T / 2, gy = yb + (yp - yb) / 3;
    if (gx < -T || gy < -T || gx > w + T || gy > h + T) continue;
    const sx = Math.min(mw - 1, Math.max(0, (gx / paso) | 0)), sy = Math.min(mh - 1, Math.max(0, (gy / paso) | 0)), q = sy * mw + sx;
    const r = px[q * 4] / 255, g = px[q * 4 + 1] / 255, b = px[q * 4 + 2] / 255;
    if (tinta.colorReal) { o.fillStyle = colorPlano(r, g, b); tri(x, yb, x + T, yb, gx, yp); continue; }
    const t = Math.min(1, Math.max(0, (L[q] - lo) / (hi - lo))) * (bn.n - 1), banda = Math.min(bn.n - 2, Math.floor(t)), f = t - banda;
    o.fillStyle = bn.de(banda + 1, r, g, b); tri(x - 0.3, yb, x + T + 0.3, yb, gx, yp);
    const e = Math.sqrt(1 - f) * 0.98;
    if (e < 0.08) continue;
    o.fillStyle = bn.de(banda, r, g, b);
    tri(gx + (x - gx) * e, gy + (yb - gy) * e, gx + (x + T - gx) * e, gy + (yb - gy) * e, gx, gy + (yp - gy) * e);
  }
  return out;
}

type Efecto = (src: Fuente, w: number, h: number, celda: number, tinta: Tinta, cara: Cara | null, apagadas?: readonly string[]) => HTMLCanvasElement;
const tramaConPlacas: Efecto = (src, w, h, celda, tinta, cara, apagadas) => trama(src, w, h, celda, tinta, cara, undefined, apagadas);
export const efectoDe = (visual: string): Efecto => (visual === 'Pixel' ? crt : visual === 'Geométrica' ? mosaico : tramaConPlacas);
// Las placas (C, M, Y, K) solo existen en la trama de imprenta: la de Orgánica.
export const tienePlacas = (visual: string) => visual === 'Orgánica';

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

// Placas de impresión: cada tinta de la trama por separado (C, M, Y, K; o las dos del dúo; o la única), como las
// planchas que se entintan una a una en la imprenta. Se ven en el panel derecho y se apagan y prenden con un toque.
export const placasDe = (t: Tinta): { canal: string; nombre: string; color: string }[] =>
  t.modo === 'cmyk' ? [{ canal: 'c', nombre: 'C', color: t.c! }, { canal: 'm', nombre: 'M', color: t.m! }, { canal: 'y', nombre: 'Y', color: t.y! }, { canal: 'k', nombre: 'K', color: t.k! }]
    : t.modo === 'duo' ? [{ canal: 'a', nombre: 'Sombras', color: t.a! }, { canal: 'b', nombre: 'Medios', color: t.b! }]
    : [{ canal: 'l', nombre: 'Tinta', color: t.a! }];
export function dibujarPlaca(ctx: CanvasRenderingContext2D, lado: number, src: Fuente, celda: number, tinta: Tinta, cara: Cara | null, canal: string) {
  const t = trama(src, lado, lado, celdaRelativa(src, 240, 240, celda, cara) * (lado / 240), tinta, cara, canal);
  ctx.drawImage(t, 0, 0);
}

// Compone marco: fondo → figura → foto en trama dentro de su zona → lo que en Figma va sobre la foto.
export interface OpcionesComponer { apagadas?: readonly string[] }
// Las capas fijas del marco (fondo + figura, y lo que va encima) se dibujan una vez por marco, tinta y tamaño y se
// guardan: los marcos de Orgánica traen trazados de Figma muy pesados y, en la vista en vivo, redibujarlos en cada cuadro
// era lo que más costaba en la tablet.
const capasCache = new Map<string, { bajo: HTMLCanvasElement; sobre: HTMLCanvasElement | null }>();
function capasMarco(m: ReturnType<typeof marcoListo>, marco: { bg: string; fills: string[]; encima: string[] }, tinta: Tinta, size: number) {
  const key = m.id + '|' + tinta.label + '|' + size;
  let r = capasCache.get(key);
  if (r) return r;
  if (capasCache.size > 24) capasCache.clear();
  const s = size / 240, nuevo = () => { const c = document.createElement('canvas'); c.width = c.height = size; return c; };
  const bajo = nuevo(), x = bajo.getContext('2d')!;
  x.fillStyle = marco.bg; x.fillRect(0, 0, size, size);
  x.setTransform(s, 0, 0, s, 0, 0);
  m._p.forEach(([p], i) => { x.fillStyle = marco.fills[i]; x.fill(p); });
  let sobre: HTMLCanvasElement | null = null;
  if (m._encima.length) {
    sobre = nuevo(); const y = sobre.getContext('2d')!; y.setTransform(s, 0, 0, s, 0, 0);
    m._encima.forEach(([p], i) => { y.fillStyle = marco.encima[i]; y.fill(p); });
  }
  r = { bajo, sobre };
  capasCache.set(key, r);
  return r;
}

export function componer(ctx: CanvasRenderingContext2D, size: number, marcoId: string, src: Fuente, celda: number, tinta: Tinta, cara?: Cara | null, op: OpcionesComponer = {}) {
  const m = marcoListo(marcoId), s = size / 240, marco = marcoConTinta(m, tinta), capas = capasMarco(m, marco, tinta, size);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(capas.bajo, 0, 0);
  const [bx, by, bw, bh] = m._clip.box;
  const t = efectoDe(m.visual)(src, bw * s, bh * s, celdaRelativa(src, bw, bh, celda, cara ?? null) * s, tinta, cara ?? null, op.apagadas);
  ctx.save();
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.clip(m._clip.path);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(t, Math.round(bx * s), Math.round(by * s));
  ctx.restore();
  if (capas.sobre) ctx.drawImage(capas.sobre, 0, 0);
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

// Cuadro de la cámara en retrato 3:4 (recortado al centro si la cámara entrega apaisado), espejado en la selfie.
// `max` es el alto en px.
export function pintarVideo(canvas: HTMLCanvasElement, v: HTMLVideoElement, espejo: boolean, max: number) {
  const vw = v.videoWidth, vh = v.videoHeight; if (!vw) return false;
  const sw = Math.min(vw, vh * 3 / 4), sh = Math.min(vh, vw * 4 / 3), sx = (vw - sw) / 2, sy = (vh - sh) / 2;
  const h = Math.round(Math.min(max, sh)), w = Math.round(h * 3 / 4);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const x = canvas.getContext('2d')!; x.save();
  if (espejo) { x.translate(w, 0); x.scale(-1, 1); }
  x.drawImage(v, sx, sy, sw, sh, 0, 0, w, h); x.restore(); return true;
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
