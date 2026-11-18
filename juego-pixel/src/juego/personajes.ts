// Personajes de «Hora punta», ronda 3 (plan 009-juego-pixel): Pinta (tú), los Grises, la bola de pintura y el Inacapín.
// Sprites pixel en código (generado: true), salvo el Inacapín, que es la grilla de 20 × 20 de Figma (1002:29670,
// copia en public/figma/inacapin.svg). Cada sprite se pinta una vez en un canvas chico y después se estampa escalado.
import { PALETA } from './sprites';

type Filas = string[];
const COLORES: Record<string, string> = {
  ...PALETA,
  R: '#E2001A', // rojo INACAP (solo el Inacapín, aprobado por Amaro)
  o: '#C99700', // amarillo en sombra
  A: '#004A8C', // azul en sombra
  L: '#1D3399', // lapislázuli en sombra
  e: '#A3A39D', // gris medio (los Grises)
  E: '#7A7A75', // gris en sombra
  n: '#3A3A37', // casi negro (suela, pelo)
};

const cache = new Map<string, HTMLCanvasElement>();
function lienzo(clave: string, filas: Filas, color: (ch: string, i: number, j: number) => string | null): HTMLCanvasElement {
  let c = cache.get(clave);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = filas[0].length; c.height = filas.length;
  const x = c.getContext('2d')!;
  filas.forEach((f, j) => [...f].forEach((ch, i) => {
    if (ch === '.') return;
    const col = color(ch, i, j);
    if (!col) return;
    x.fillStyle = col; x.fillRect(i, j, 1, 1);
  }));
  if (cache.size > 400) cache.clear();
  cache.set(clave, c);
  return c;
}
function estampar(ctx: CanvasRenderingContext2D, c: HTMLCanvasElement, x: number, y: number, ancho: number, alto: number, espejo = false) {
  ctx.imageSmoothingEnabled = false;
  if (!espejo) { ctx.drawImage(c, Math.round(x), Math.round(y), Math.round(ancho), Math.round(alto)); return; }
  ctx.save(); ctx.translate(Math.round(x + ancho), Math.round(y)); ctx.scale(-1, 1);
  ctx.drawImage(c, 0, 0, Math.round(ancho), Math.round(alto)); ctx.restore();
}

// ——— Pinta: tú (16 × 16, mira a la derecha) ———
// Gorro celeste con borde lapislázuli, cara hueso, polerón azul, pantalón lapislázuli, zapatillas hueso y la lata rosa.
const PINTA_CABEZA: Filas = [
  '.....kkkkkk.....',
  '....kcccccwck...',
  '...kccccccccck..',
  '...kLLLLLLLLLk..',
  '...knhhhhhhhhk..',
  '...knhhhkhhkhk..',
  '...khhhhkhhkhk..',
  '...khhhhhhhrhk..',
  '....kkhhhhhhk...',
];
const PINTA_CUERPO: Record<'quieto' | 'lanza' | 'arriba', Filas> = {
  quieto: [
    '...kaaaaaaaak...',
    '..kaaAaaaaaaakk.',
    '..kaAkaaaaaakrrk',
    '..kAAkaaaaahkrrk',
  ],
  lanza: [
    '...kaaaaaaaakkk.',
    '..kaaAaaaaaaahrk',
    '..kaAkaaaaaaakrk',
    '..kAAkaaaaaaak..',
  ],
  arriba: [
    '...kaaaaaaaakrrk',
    '..kaaAaaaaaakrrk',
    '..kaAkaaaaaaahk.',
    '..kAAkaaaaaaak..',
  ],
};
const PINTA_PIERNAS: Record<'quieto' | 'paso' | 'junto' | 'salto', Filas> = {
  junto: ['.....kllllk.....', '....kkhhhhkk....', '....khhhhhhhk...'],
  quieto: [
    '....kllkkllk....',
    '...kkhhkkkhhk...',
    '...khhhhkkhhhk..',
  ],
  paso: [
    '...kllk..kllk...',
    '..kkhhk.kkhhhk..',
    '..khhhk..khhhk..',
  ],
  salto: [
    '...kllkkkllk....',
    '..khhhk.khhhk...',
    '...kkk...kkk....',
  ],
};
export type Pose = 'quieto' | 'camina1' | 'camina2' | 'salta' | 'lanza' | 'golpe';
function filasPinta(p: Pose): Filas {
  const cuerpo = p === 'lanza' ? PINTA_CUERPO.lanza : p === 'salta' ? PINTA_CUERPO.arriba : PINTA_CUERPO.quieto;
  const piernas = p === 'salta' ? PINTA_PIERNAS.salto : p === 'camina1' ? PINTA_PIERNAS.paso : PINTA_PIERNAS.quieto;
  let cabeza = PINTA_CABEZA;
  if (p === 'golpe') cabeza = cabeza.map((f, j) => (j === 5 || j === 6 ? '...khhhhwhhwhk..' : f)); // ojos en blanco
  if (p === 'camina2') return [...cabeza, ...cuerpo, ...PINTA_PIERNAS.junto];
  return [...cabeza, ...cuerpo, ...piernas];
}
export function lienzoPinta(p: Pose = 'quieto'): HTMLCanvasElement {
  const filas = filasPinta(p);
  return lienzo('pinta|' + p, filas, ch => COLORES[ch] ?? null);
}
// Pinta con los pies en (pieX, pieY) px, de `tam` px de alto.
export function dibujarPinta(ctx: CanvasRenderingContext2D, pieX: number, pieY: number, tam: number, pose: Pose, mira: 1 | -1) {
  estampar(ctx, lienzoPinta(pose), pieX - tam / 2, pieY - tam, tam, tam, mira < 0);
}

// ——— Los Grises (12 × 12, familia del Inacapín: libro-caja con contorno, ojos, piernas y zapatillas) ———
// 'g' cuerpo, 'e' tramado «borrado», 'E' franja en sombra, 's' guantes y suelas, 'w' brillo del ojo.
const GRIS_CUERPO: Filas = [
  '..kkkkkkkk..',
  '..kgggegEk..',
  '..kwkgwkEk..',
  '.kkkkgkkEkk.',
  'kskggkgegksk',
  'kskgegggEksk',
  '.kkggggeEkk.',
  '..kkkkkkkk..',
];
const GRIS_PIERNAS: Record<'a' | 'b' | 'salto', Filas> = {
  a: ['...kEk.kEk..', '...kEk.kEk..', '..kkkk.kkkk.', '..ssss.ssss.'],
  b: ['....kEkEk...', '....kEkEk...', '...kkkkkkk..', '...sssssss..'],
  salto: ['..kEk..kEk..', '.kkkk..kkkk.', '.ssss..ssss.', '............'],
};
export type FrameGris = 'a' | 'b' | 'salto';
// `nivel` (0 a 1): cuánto lo cubre la pintura, desde los pies hacia arriba, con un borde que chorrea.
export function lienzoGris(frame: FrameGris, color: string, nivel: number, mareado = false): HTMLCanvasElement {
  const filas = [...GRIS_CUERPO, ...GRIS_PIERNAS[frame]];
  const n = Math.round(nivel * 10) / 10;
  if (mareado) { filas[2] = '..kwkgwkEk..'.replace(/w/g, 's'); }
  const borde = filas.length - n * filas.length; // fila desde donde hay pintura
  const chorreo = [0, 1, 0, 2, 1, 0, 1, 2, 0, 1, 0, 1]; // gotas que bajan del borde
  const sombra = oscurecer(color, 0.78);
  return lienzo(`gris|${frame}|${color}|${n}|${mareado}`, filas, (ch, i, j) => {
    if (ch === 'k') return COLORES.k;
    const pintado = n > 0 && (j >= borde - (n < 1 ? chorreo[i] * 0.8 : 0));
    if (pintado && ch !== 'w') return ch === 'E' || ch === 'e' ? sombra : color;
    return COLORES[ch] ?? null;
  });
}
export function dibujarGris(ctx: CanvasRenderingContext2D, pieX: number, pieY: number, tam: number, frame: FrameGris, mira: 1 | -1, color = '', nivel = 0, mareado = false) {
  estampar(ctx, lienzoGris(frame, color || '#8F8F8A', nivel, mareado), pieX - tam / 2, pieY - tam, tam, tam, mira < 0);
}

// ——— La bola de pintura: un círculo pixel del color, con brillo, sombra y los ojos del Gris asomando ———
// `giro` (celdas que lleva rodando) hace girar las manchas y los ojos.
export function dibujarBola(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, giro = 0, aviso = false) {
  const N = 14, px = (2 * r) / N, a = giro * 1.6;
  const sombra = oscurecer(color, 0.72), luz = aclarar(color, 0.35);
  ctx.save();
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const dx = i - N / 2 + 0.5, dy = j - N / 2 + 0.5, d = Math.hypot(dx, dy);
    if (d > N / 2) continue;
    let col = d > N / 2 - 1.1 ? '#000000' : color;
    if (col !== '#000000') {
      // sombra abajo a la derecha, luz arriba a la izquierda (fijas: la luz no gira)
      if (dx + dy > 5.5) col = sombra;
      // manchas y ojos que giran con la bola
      const rx = dx * Math.cos(-a) - dy * Math.sin(-a), ry = dx * Math.sin(-a) + dy * Math.cos(-a);
      if ((Math.abs(rx + 1.6) < 0.8 || Math.abs(rx - 1.6) < 0.8) && Math.abs(ry + 0.3) < 0.9) col = aviso ? '#F4EEE3' : '#000000';
      else if (Math.abs(rx - 2.3) < 0.7 && Math.abs(ry - 3.2) < 0.8) col = sombra;
      else if (Math.abs(rx + 3) < 0.7 && Math.abs(ry - 2.4) < 0.7) col = sombra;
      if (dx < -1.5 && dy < -1.5 && dx + dy > -6.5 && dx + dy < -4.2) col = luz;
      if (i === 4 && j === 3) col = '#FFFFFF';
    }
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(cx - r + i * px), Math.round(cy - r + j * px), Math.ceil(px), Math.ceil(px));
  }
  ctx.restore();
}

// ——— El Inacapín (Figma 1002:29670, 20 × 20) ———
// 'R' cuerpo rojo INACAP, 'h' guante y suelas hueso. Gris mientras no le devuelves el color: el rojo vuelve desde los pies.
export const INACAPIN: Filas = [
  '....kkkkkkkkkkkkkk..',
  '....kRRRRRRRRRRRRk..',
  '....kRRRRRRRRRRRRk..',
  '....kRRhkRRRhkRRRk..',
  '....kRRkkRRRkkRRRk..',
  '....kRRRRRkRRRRRRk..',
  '.kk.kRRRRRRRRkkRRk..',
  'khhkkRRRRRRRRkkRRkkk',
  'khhhkRRRRRRRRkkRRkhk',
  'khhkkRRRRRRRRkkRRkhk',
  '.kk.kRRRRRRRRkkRRkhk',
  '....kRRRRRRRRkkRRkkk',
  '....kRRRRRRRRkkRRk..',
  '....kkkkkkkkkkkkkk..',
  '......kRk...kRk.....',
  '......kRk...kRk.....',
  '......kRk...kRk.....',
  '.....kkkkk.kkkkk....',
  '....kkkkkk.kkkkkk...',
  '....hhhhhh.hhhhhh...',
];
export interface OpcionesInacapin { boca?: boolean; blanco?: boolean; ojos?: 'x' | 'feliz' | 'enojo' | null; paso?: 0 | 1 | 2 }
// `rojo` (0 a 1): cuánto color recuperó. Mira a la izquierda en el sprite (el guante va adelante).
export function lienzoInacapin(rojo: number, o: OpcionesInacapin = {}): HTMLCanvasElement {
  const n = Math.round(rojo * 18) / 18;
  let filas = INACAPIN.slice();
  // El libro se abre (boca): la franja de la «i» se separa y se ve el interior hueso.
  if (o.boca) filas = filas.map((f, j) => (j >= 6 && j <= 12 ? f.slice(0, 13) + (j === 6 || j === 12 ? 'kk' : 'hh') + f.slice(15) : f));
  if (o.ojos === 'x') { filas[2] = '....kRkRkRRkRkRRRk..'; filas[3] = '....kRRkRRRRkRRRRk..'; filas[4] = '....kRkRkRRkRkRRRk..'; }
  if (o.ojos === 'feliz') { filas[3] = '....kRRkkRRRkkRRRk..'; filas[4] = '....kRkRRkRkRRkRRk..'; filas[5] = '....kRRRRkkkRRRRRk..'; }
  if (o.ojos === 'enojo') { filas[2] = '....kRkkRRRkkRRRRk..'; }
  if (o.paso === 1) { filas[14] = '.....kRk....kRk.....'; filas[15] = '.....kRk....kRk.....'; }
  if (o.paso === 2) { filas[14] = '.......kRk.kRk......'; filas[15] = '.......kRk.kRk......'; }
  const alto = filas.length, borde = alto - n * alto;
  const gris = { R: '#8F8F8A', h: '#C9C9C4' } as Record<string, string>;
  const tramado = (i: number, j: number) => (i + j) % 2 === 0;
  return lienzo(`inacapin|${n}|${JSON.stringify(o)}`, filas, (ch, i, j) => {
    if (o.blanco && ch !== 'k') return '#FFFFFF';
    if (ch === 'k') return '#000000';
    const conColor = n >= 1 || j >= borde;
    if (conColor) return ch === 'R' ? (j >= borde && j < borde + 1 && n < 1 && tramado(i, j) ? '#FF8FB1' : '#E2001A') : '#F4EEE3';
    return ch === 'R' ? (tramado(i, j) && (i * 7 + j * 3) % 5 === 0 ? '#A3A39D' : gris.R) : gris.h;
  });
}
// Dibuja el Inacapín con los pies en (pieX, pieY) px, de `alto` px de alto. `mira`: 1 derecha.
export function dibujarInacapin(ctx: CanvasRenderingContext2D, pieX: number, pieY: number, alto: number, mira: 1 | -1, rojo: number, o: OpcionesInacapin = {}, aplasta = 1) {
  const ancho = alto, h = alto * aplasta, w = ancho * (1 + (1 - aplasta) * 0.6);
  // El sprite mira a la izquierda (guante adelante): se refleja para mirar a la derecha.
  estampar(ctx, lienzoInacapin(rojo, o), pieX - w / 2, pieY - h, w, h, mira > 0);
}

// ——— Colores ———
function rgb(hex: string) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const aHex = (c: number[]) => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const oscurecer = (hex: string, f: number) => aHex(rgb(hex).map(v => v * f));
export const aclarar = (hex: string, f: number) => aHex(rgb(hex).map(v => v + (255 - v) * f));
