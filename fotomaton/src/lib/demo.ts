import type { Visual } from '../data/marcos';

// Personaje de muestra para las miniaturas de marcos y las placas antes de la foto (plan 012).
// Un retrato de busto, dibujado aquí en el estilo de cada lenguaje (generado, ver el manifiesto
// docs/plans/012-ui-herramientas/assets-fotomaton.manifest.md):
//   Pixel       grilla de 24 × 24 con contorno negro de un escalón, como los personajes de la web.
//   Geométrica  figuras planas (círculos, semicírculos, triángulos), sin contorno.
//   Orgánica    papel recortado: bordes con pulso de tijera, sombra de recorte y grano.
// Tiene luces y sombras claras para que la trama, el CRT y el mosaico se lean en chico.
const L = 360;
const C = {
  hueso: '#F4EEE3', negro: '#000000', azul: '#0062B8', lapis: '#2B4BD8', celeste: '#7FC8F8',
  amarillo: '#FFC20E', verde: '#00A651', rosa: '#FF8FB1', morado: '#7A2E8E',
  piel: '#F6C7A1', pielSombra: '#DE9A6E',
};

// Azar con semilla: el personaje sale igual en cada carga.
function azar(semilla: number) {
  let s = semilla >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function lienzo() {
  const c = document.createElement('canvas'); c.width = c.height = L;
  return [c, c.getContext('2d')!] as const;
}

// ---------- Pixel ----------
function pixel(): HTMLCanvasElement {
  const N = 24, g: (string | null)[][] = Array.from({ length: N }, () => Array(N).fill(null));
  const rect = (x0: number, y0: number, x1: number, y1: number, col: string) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = col; };
  const p = (x: number, y: number, col: string | null) => { g[y][x] = col; };
  // hombros y polera
  rect(3, 19, 20, 23, C.azul); p(3, 19, null); p(4, 19, null); p(3, 20, null); p(19, 19, null); p(20, 19, null); p(20, 20, null);
  rect(4, 22, 19, 22, C.amarillo); // franja
  rect(9, 19, 14, 19, C.hueso); rect(10, 20, 13, 20, C.hueso); // cuello de la polera
  rect(11, 20, 12, 21, C.piel);
  // cuello
  rect(10, 16, 13, 19, C.piel); rect(10, 16, 13, 16, C.pielSombra); p(11, 19, C.piel); p(12, 19, C.piel);
  // orejas
  rect(6, 10, 6, 12, C.piel); rect(17, 10, 17, 12, C.piel); p(6, 11, C.pielSombra); p(17, 11, C.pielSombra);
  // cara
  rect(7, 5, 16, 16, C.piel); p(7, 16, null); p(16, 16, null);
  rect(15, 8, 16, 15, C.pielSombra); p(15, 8, C.piel); // sombra a la derecha
  // pelo
  rect(6, 3, 17, 7, C.negro); p(6, 3, null); p(17, 3, null); rect(8, 2, 15, 2, C.negro);
  rect(6, 8, 6, 9, C.negro); rect(17, 8, 17, 9, C.negro); p(7, 8, C.negro);
  rect(9, 3, 11, 3, C.morado); rect(12, 4, 13, 4, C.morado); // brillo del pelo
  // ojos, mejillas, nariz y sonrisa
  rect(9, 10, 9, 11, C.negro); rect(14, 10, 14, 11, C.negro); p(9, 10, C.negro);
  p(9, 9, C.morado); p(14, 9, C.morado); // cejas
  p(8, 13, C.rosa); p(15, 13, C.rosa);
  p(12, 12, C.pielSombra);
  p(10, 13, C.negro); p(13, 13, C.negro); rect(11, 14, 12, 14, C.negro);
  // contorno de un escalón alrededor de la figura
  const fig = g.map(f => f.map(v => v !== null));
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (fig[y][x]) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => fig[y + dy]?.[x + dx])) g[y][x] = C.negro;
  }
  const [c, x] = lienzo(), k = L / N;
  x.fillStyle = C.celeste; x.fillRect(0, 0, L, L);
  // fondo: sol de píxeles y destellos, como el afiche de los arcades
  const sol = [[13, 1, 21, 1], [12, 2, 22, 2], [11, 3, 23, 5], [12, 6, 22, 6], [13, 7, 21, 7]];
  x.fillStyle = C.amarillo; sol.forEach(([a, y0, b, y1]) => x.fillRect(a * k, y0 * k, (b - a + 1) * k, (y1 - y0 + 1) * k));
  x.fillStyle = C.hueso; [[2, 3], [4, 8], [1, 13], [21, 12], [22, 16], [3, 17]].forEach(([a, b]) => { x.fillRect(a * k, b * k, k, k); });
  for (let y = 0; y < N; y++) for (let xx = 0; xx < N; xx++) if (g[y][xx]) { x.fillStyle = g[y][xx]!; x.fillRect(xx * k, y * k, k, k); }
  return c;
}

// ---------- Geométrica ----------
function geometrica(): HTMLCanvasElement {
  const [c, x] = lienzo();
  const circ = (cx: number, cy: number, r: number, col: string, a0 = 0, a1 = Math.PI * 2) => { x.fillStyle = col; x.beginPath(); if (a1 - a0 < Math.PI * 2) x.moveTo(cx, cy); x.arc(cx, cy, r, a0, a1); x.closePath(); x.fill(); };
  const poli = (pts: number[][], col: string) => { x.fillStyle = col; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); };
  x.fillStyle = C.hueso; x.fillRect(0, 0, L, L);
  // fondo: cuartos de círculo en las esquinas y un círculo detrás de la cabeza
  circ(0, 0, 110, C.amarillo, 0, Math.PI / 2); circ(L, L, 120, C.verde, Math.PI, Math.PI * 1.5);
  circ(L, 0, 70, C.rosa, Math.PI / 2, Math.PI); circ(0, L, 70, C.lapis, -Math.PI / 2, 0);
  circ(180, 158, 128, C.celeste);
  // hombros: medio círculo con la polera partida en dos triángulos
  circ(180, 384, 148, C.azul, Math.PI, Math.PI * 2);
  poli([[180, 300], [332, 384], [180, 384]], C.lapis);
  poli([[150, 262], [210, 262], [180, 318]], C.hueso); // cuello de la polera
  // cuello
  x.fillStyle = C.pielSombra; x.fillRect(156, 222, 48, 54);
  poli([[156, 262], [204, 262], [180, 300]], C.piel);
  // cabeza
  circ(110, 166, 15, C.piel); circ(250, 166, 15, C.pielSombra); // orejas
  circ(180, 162, 72, C.piel);
  circ(180, 162, 72, C.pielSombra, -Math.PI / 2 + 0.35, Math.PI / 2 - 0.35); // sombra plana a la derecha
  x.fillStyle = C.piel; x.beginPath(); x.ellipse(180, 162, 46, 72, 0, 0, Math.PI * 2); x.fill();
  // pelo: semicírculo y un triángulo de chasquilla
  circ(180, 150, 80, C.negro, Math.PI, Math.PI * 2);
  poli([[100, 150], [184, 150], [100, 184]], C.negro);
  poli([[196, 150], [260, 150], [260, 176]], C.negro);
  circ(220, 112, 16, C.morado, Math.PI, Math.PI * 2);
  // cara: ojos, mejillas, nariz y boca
  circ(156, 170, 8, C.negro); circ(206, 170, 8, C.negro);
  circ(143, 198, 10, C.rosa); circ(219, 198, 10, C.rosa);
  poli([[180, 176], [190, 200], [178, 200]], C.pielSombra);
  circ(181, 210, 18, C.negro, 0, Math.PI);
  circ(181, 210, 11, C.rosa, 0, Math.PI);
  return c;
}

// ---------- Orgánica ----------
// Contorno de papel cortado a mano: una forma base (función del ángulo) con pulso irregular.
function recorte(x: CanvasRenderingContext2D, rnd: () => number, cx: number, cy: number, rx: number, ry: number, opts: { pulso?: number; forma?: (a: number) => number; desde?: number; hasta?: number } = {}) {
  const pulso = opts.pulso ?? 0.035, forma = opts.forma ?? (() => 1);
  const a0 = opts.desde ?? 0, a1 = opts.hasta ?? Math.PI * 2, n = 90;
  const f1 = rnd() * 6, f2 = rnd() * 6;
  x.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n;
    const r = forma(a) * (1 + pulso * Math.sin(a * 3 + f1) + pulso * 0.6 * Math.sin(a * 7 + f2) + (rnd() - 0.5) * pulso * 0.5);
    const px = cx + Math.cos(a) * rx * r, py = cy + Math.sin(a) * ry * r;
    if (i) x.lineTo(px, py); else x.moveTo(px, py);
  }
  x.closePath();
}
function organica(): HTMLCanvasElement {
  const [c, x] = lienzo(), rnd = azar(7);
  x.fillStyle = C.hueso; x.fillRect(0, 0, L, L);
  // Cada pieza: sombra del recorte (corrida) y después el papel.
  const pieza = (col: string, dibujar: () => void, sombra = 0.2) => {
    x.save(); x.translate(4, 6); dibujar(); x.fillStyle = `rgba(60,40,20,${sombra})`; x.fill(); x.restore();
    dibujar(); x.fillStyle = col; x.fill();
  };
  // fondo: sol de pétalos y una hoja
  pieza(C.amarillo, () => recorte(x, rnd, 286, 78, 64, 64, { pulso: 0.02, forma: a => 1 + 0.16 * Math.cos(a * 9) }), 0.12);
  pieza(C.verde, () => { x.save(); x.translate(56, 286); x.rotate(-0.7); recorte(x, rnd, 0, 0, 34, 86, { forma: a => Math.pow(Math.abs(Math.sin(a)), 0.6) * 0.3 + 0.7 }); x.restore(); }, 0.12);
  x.strokeStyle = C.hueso; x.lineWidth = 3; x.lineCap = 'round';
  x.beginPath(); x.moveTo(30, 318); x.quadraticCurveTo(58, 284, 92, 238); x.stroke();
  // hombros: una loma de papel azul
  pieza(C.azul, () => recorte(x, rnd, 180, 392, 168, 128, { pulso: 0.025, forma: a => (Math.sin(a) < 0 ? 1 : 1.4) }));
  pieza(C.rosa, () => recorte(x, rnd, 180, 292, 40, 24, { pulso: 0.06 }), 0.15); // pañuelo
  // cuello
  pieza(C.pielSombra, () => recorte(x, rnd, 180, 252, 30, 44, { pulso: 0.03 }), 0.12);
  // cabeza: pelo atrás, cara, pelo encima
  pieza(C.negro, () => recorte(x, rnd, 180, 150, 100, 104, { pulso: 0.05, forma: a => 1 + 0.07 * Math.cos(a * 8) }), 0.25);
  pieza(C.piel, () => recorte(x, rnd, 180, 172, 70, 84, { pulso: 0.025 }));
  x.save(); recorte(x, rnd, 180, 172, 70, 84, { pulso: 0.0 }); x.clip();
  recorte(x, rnd, 258, 188, 52, 110, { pulso: 0.03 }); x.fillStyle = 'rgba(190,105,60,.35)'; x.fill(); x.restore();
  pieza(C.negro, () => recorte(x, rnd, 168, 106, 92, 52, { pulso: 0.06, forma: a => (Math.sin(a) > 0.2 ? 0.55 : 1) + 0.08 * Math.cos(a * 6) }), 0.2);
  pieza(C.morado, () => recorte(x, rnd, 214, 86, 22, 12, { pulso: 0.1 }), 0);
  // cara
  const punto = (cx: number, cy: number, rx: number, ry: number, col: string) => { recorte(x, rnd, cx, cy, rx, ry, { pulso: 0.08 }); x.fillStyle = col; x.fill(); };
  punto(152, 176, 9, 11, C.negro); punto(208, 176, 9, 11, C.negro);
  punto(149, 172, 3, 3, C.hueso); punto(205, 172, 3, 3, C.hueso);
  punto(134, 206, 16, 11, C.rosa); punto(226, 206, 16, 11, C.rosa);
  x.strokeStyle = C.negro; x.lineWidth = 7; x.lineCap = 'round';
  x.beginPath(); x.moveTo(158, 216); x.quadraticCurveTo(182, 240, 206, 214); x.stroke();
  x.lineWidth = 6; x.strokeStyle = C.pielSombra; x.beginPath(); x.moveTo(182, 182); x.quadraticCurveTo(190, 198, 178, 202); x.stroke();
  // grano de papel
  const im = x.getImageData(0, 0, L, L), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const v = (rnd() - 0.5) * 18; d[i] += v; d[i + 1] += v; d[i + 2] += v; }
  x.putImageData(im, 0, 0);
  return c;
}

const lienzos = new Map<Visual, HTMLCanvasElement>();
const DIBUJOS: Record<Visual, () => HTMLCanvasElement> = { Pixel: pixel, 'Geométrica': geometrica, 'Orgánica': organica };
export const demoDe = (visual: Visual): HTMLCanvasElement => {
  let c = lienzos.get(visual);
  if (!c) { c = DIBUJOS[visual](); lienzos.set(visual, c); }
  return c;
};
