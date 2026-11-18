import type { Visual } from '../data/marcos';

// Personaje de muestra para las miniaturas de marcos y las placas antes de la foto (plan 014): el ícono clásico de
// usuario (cabeza redonda y hombros, plano), dibujado aquí en el estilo de cada lenguaje (generado, ver el manifiesto
// docs/plans/012-ui-herramientas/assets-fotomaton.manifest.md):
//   Pixel       grilla de 24 × 24 con contorno negro de un escalón y un brillo, como los personajes de la web.
//   Geométrica  un círculo y un semicírculo perfectos, planos, sin contorno, con cuartos de círculo en las esquinas.
//   Orgánica    papel recortado: bordes con pulso de tijera, sombra de recorte y grano.
// El ícono va en azul sobre fondo claro: así la trama, el CRT y los triángulos se leen en chico.
const L = 360;
const C = {
  hueso: '#F4EEE3', negro: '#000000', azul: '#0062B8', lapis: '#2B4BD8', celeste: '#7FC8F8',
  amarillo: '#FFC20E', verde: '#00A651', rosa: '#FF8FB1', morado: '#7A2E8E',
};
// Medidas del ícono en el lienzo de 360: cabeza y hombros con un respiro entre ambos.
const CABEZA = { x: 180, y: 140, r: 70 }, HOMBROS = { x: 180, y: 360, rx: 136, ry: 128 };

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
  const N = 24, k = L / N, g: (string | null)[][] = Array.from({ length: N }, () => Array(N).fill(null));
  // centro de cada celda en unidades del lienzo
  const en = (i: number) => (i + 0.5) * k;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const cx = en(x), cy = en(y);
    if (Math.hypot(cx - CABEZA.x, cy - CABEZA.y) <= CABEZA.r) g[y][x] = C.azul;
    else if (cy >= 236 && ((cx - HOMBROS.x) / HOMBROS.rx) ** 2 + ((cy - HOMBROS.y) / HOMBROS.ry) ** 2 <= 1) g[y][x] = C.azul;
  }
  // brillo de un escalón arriba a la izquierda de la cabeza y de los hombros
  const brillo = (x: number, y: number) => { if (g[y][x]) g[y][x] = C.celeste; };
  brillo(9, 5); brillo(10, 5); brillo(9, 6); brillo(6, 18); brillo(7, 17); brillo(8, 17);
  // contorno de un escalón alrededor de la figura
  const fig = g.map(f => f.map(v => v !== null));
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (fig[y][x]) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => fig[y + dy]?.[x + dx])) g[y][x] = C.negro;
  }
  const [c, x] = lienzo();
  x.fillStyle = C.amarillo; x.fillRect(0, 0, L, L);
  // fondo: destellos de píxel
  x.fillStyle = C.hueso; [[2, 3], [4, 8], [1, 13], [21, 4], [20, 11], [22, 15]].forEach(([a, b]) => { x.fillRect(a * k, b * k, k, k); });
  for (let y = 0; y < N; y++) for (let xx = 0; xx < N; xx++) if (g[y][xx]) { x.fillStyle = g[y][xx]!; x.fillRect(xx * k, y * k, k, k); }
  return c;
}

// ---------- Geométrica ----------
function geometrica(): HTMLCanvasElement {
  const [c, x] = lienzo();
  x.fillStyle = C.hueso; x.fillRect(0, 0, L, L);
  // fondo: cuartos de círculo en dos esquinas (el ícono queda sobre el papel, con todo el contraste)
  x.fillStyle = C.amarillo; x.beginPath(); x.moveTo(L, 0); x.arc(L, 0, 120, Math.PI / 2, Math.PI); x.closePath(); x.fill();
  x.fillStyle = C.rosa; x.beginPath(); x.moveTo(0, L); x.arc(0, L, 90, -Math.PI / 2, 0); x.closePath(); x.fill();
  // el ícono: círculo + semicírculo (elipse cortada abajo), planos
  x.fillStyle = C.azul;
  x.beginPath(); x.arc(CABEZA.x, CABEZA.y, CABEZA.r, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.ellipse(HOMBROS.x, HOMBROS.y, HOMBROS.rx, HOMBROS.ry, 0, Math.PI, Math.PI * 2); x.closePath(); x.fill();
  return c;
}

// ---------- Orgánica ----------
// Contorno de papel cortado a mano: una forma base con pulso irregular.
function recorte(x: CanvasRenderingContext2D, rnd: () => number, cx: number, cy: number, rx: number, ry: number, opts: { pulso?: number; desde?: number; hasta?: number } = {}) {
  const pulso = opts.pulso ?? 0.035, a0 = opts.desde ?? 0, a1 = opts.hasta ?? Math.PI * 2, n = 90;
  const f1 = rnd() * 6, f2 = rnd() * 6;
  x.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n;
    const r = 1 + pulso * Math.sin(a * 3 + f1) + pulso * 0.6 * Math.sin(a * 7 + f2) + (rnd() - 0.5) * pulso * 0.5;
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
  // fondo: una mancha verde de papel detrás
  pieza(C.verde, () => recorte(x, rnd, 186, 190, 150, 140, { pulso: 0.05 }), 0.12);
  // el ícono: cabeza y hombros recortados en papel azul (los hombros, media loma cortada abajo)
  pieza(C.azul, () => recorte(x, rnd, HOMBROS.x, HOMBROS.y + 4, HOMBROS.rx, HOMBROS.ry, { pulso: 0.025, desde: Math.PI, hasta: Math.PI * 2 }));
  pieza(C.azul, () => recorte(x, rnd, CABEZA.x, CABEZA.y, CABEZA.r, CABEZA.r * 1.03, { pulso: 0.03 }));
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
