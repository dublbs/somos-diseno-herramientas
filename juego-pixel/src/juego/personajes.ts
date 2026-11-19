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
// Gorro celeste con borde lapislázuli, cara hueso, polerón azul, pantalón lapislázuli, zapatillas hueso y, en la mano,
// la lata de spray rosa (B-007: sin la mejilla rosa bajo el ojo, que se leía como una lágrima).
const PINTA_CABEZA: Filas = [
  '.....kkkkkk.....',
  '....kcccccwck...',
  '...kccccccccck..',
  '...kLLLLLLLLLk..',
  '...knhhhhhhhhk..',
  '...knhhhkhhkhk..',
  '...khhhhkhhkhk..',
  '...khhhhhhhhhk..',
  '....kkhhhhhhk...',
];
// El polerón; 'h' es la mano que sostiene la lata (más arriba al lanzar y al saltar).
const PINTA_CUERPO: Record<'quieto' | 'lanza' | 'arriba', Filas> = {
  quieto: [
    '...kaaaaaaaak...',
    '..kaaAaaaaaaak..',
    '..kaAkaaaaaahk..',
    '..kAAkaaaaaahk..',
  ],
  lanza: [
    '...kaaaaaaaak...',
    '..kaaAaaaaaahk..',
    '..kaAkaaaaaaak..',
    '..kAAkaaaaaaak..',
  ],
  arriba: [
    '...kaaaaaaahk...',
    '..kaaAaaaaaaak..',
    '..kaAkaaaaaaak..',
    '..kAAkaaaaaaak..',
  ],
};
// La lata de spray en la mano (4 × 6, columnas 12 a 15): válvula, hombro metálico, cuerpo rosa con brillo y la mano ('h') que la agarra.
// Se superpone al cuerpo y las piernas; ' ' deja ver lo de abajo. `arriba` es la fila de la válvula.
const LATA_MANO: Filas = [
  ' kk ',
  'kssk',
  'kwrk',
  'hrrk',
  'krrk',
  'kkkk',
];
const LATA_ARRIBA: Record<Pose, number> = { quieto: 9, camina1: 9, camina2: 9, golpe: 9, lanza: 8, salta: 8 };
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
function conLata(filas: Filas, p: Pose): Filas {
  const y0 = LATA_ARRIBA[p];
  return filas.map((f, j) => {
    const l = LATA_MANO[j - y0];
    if (!l) return f;
    return f.slice(0, 12) + [...l].map((ch, i) => (ch === ' ' ? f[12 + i] : ch)).join('');
  });
}
function filasPinta(p: Pose): Filas {
  const cuerpo = p === 'lanza' ? PINTA_CUERPO.lanza : p === 'salta' ? PINTA_CUERPO.arriba : PINTA_CUERPO.quieto;
  const piernas = p === 'salta' ? PINTA_PIERNAS.salto : p === 'camina1' ? PINTA_PIERNAS.paso : p === 'camina2' ? PINTA_PIERNAS.junto : PINTA_PIERNAS.quieto;
  let cabeza = PINTA_CABEZA;
  if (p === 'golpe') cabeza = cabeza.map((f, j) => (j === 5 || j === 6 ? '...khhhhwhhwhk..' : f)); // ojos en blanco
  return conLata([...cabeza, ...cuerpo, ...piernas], p);
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
// B-009: el Inacapín camina con las piernas completas y los brazos, y tiene cara de enojado. Todo sale de la grilla
// de Figma de arriba, sin arte nuevo: el cuerpo (filas 0–13), el guante (columnas 0–3), la mano de atrás (18–19) y las
// piernas con sus zapatillas se separan y se vuelven a armar en cada cuadro, en una grilla de 22 × 20 (un margen de 1 a
// cada lado para que el guante y los pies se puedan mover).
export type PasoInacapin = 0 | 1 | 2 | 3 | 4;
export interface OpcionesInacapin { boca?: boolean; blanco?: boolean; ojos?: 'x' | 'feliz' | 'enojo' | null; paso?: PasoInacapin; silueta?: string }
// Cuadros de la caminata (mira a la izquierda: «adelante» es x menor). base: fila del borde de abajo del cuerpo (14 =
// el cuerpo baja 1 al apoyar); pies: columna de cada pie (pierna de adelante, de atrás) y si va en el aire; guante y
// mano: desplazamiento (dx, dy). Los brazos van al revés que las piernas.
interface CuadroInacapin { base: number; adelante: [number, number]; atras: [number, number]; guante: [number, number]; mano: number }
const CAMINATA: Record<PasoInacapin, CuadroInacapin> = {
  0: { base: 13, adelante: [6, 0], atras: [12, 0], guante: [0, 0], mano: 0 },
  1: { base: 13, adelante: [4, 1], atras: [12, 0], guante: [1, 0], mano: -1 },  // da el paso: pie de adelante en el aire
  2: { base: 14, adelante: [4, 0], atras: [14, 0], guante: [1, 1], mano: 0 },   // apoya: piernas abiertas, cuerpo abajo
  3: { base: 13, adelante: [6, 0], atras: [13, 1], guante: [-1, -1], mano: 1 }, // la de atrás se levanta y viene
  4: { base: 14, adelante: [6, 0], atras: [12, 0], guante: [-1, 0], mano: 0 },  // apoya de nuevo
};
const GUANTE = ['.kk.', 'khhk', 'khhh', 'khhk', '.kk.']; // columnas 0–3, desde la fila 6
const MANO = ['kk', 'hk', 'hk', 'hk', 'kk'];             // columnas 18–19, desde la fila 7
const PIERNA = 'kRk', ANCHO_INACAPIN = 22;

export function filasInacapin(o: OpcionesInacapin = {}): Filas {
  const q = CAMINATA[o.paso ?? 0];
  // Cuerpo sin el guante ni la mano.
  let cuerpo = INACAPIN.slice(0, 14).map((f, j) => {
    let r = f;
    if (j >= 6 && j <= 10) r = '....' + r.slice(4);
    if (j >= 7 && j <= 11) r = r.slice(0, 18) + '..';
    return r;
  });
  const fila = (j: number, cols: number[], ch: string) => { const a = [...cuerpo[j]]; for (const i of cols) a[i] = ch; cuerpo[j] = a.join(''); };
  // El libro se abre (boca): la franja de la «i» se separa y se ve el interior hueso.
  if (o.boca) cuerpo = cuerpo.map((f, j) => (j >= 6 && j <= 12 ? f.slice(0, 13) + (j === 6 || j === 12 ? 'kk' : 'hh') + f.slice(15) : f));
  if (o.ojos === 'x') { cuerpo[2] = '....kRkRkRRkRkRRRk..'; cuerpo[3] = '....kRRkRRRRkRRRRk..'; cuerpo[4] = '....kRkRkRRkRkRRRk..'; }
  else if (o.ojos === 'feliz') { cuerpo[3] = '....kRRkkRRRkkRRRk..'; cuerpo[4] = '....kRkRRkRkRRkRRk..'; cuerpo[5] = '....kRRRRkkkRRRRRk..'; }
  else {
    // Enojado siempre (B-009).
    // Cejas en diagonal que bajan hacia el centro, sobre los ojos, y boca hacia abajo.
    fila(1, [6, 14], 'k'); fila(2, [7, 8, 12, 13], 'k');
    fila(5, [9, 10], 'k'); fila(6, [8, 11], 'k');
    if (o.ojos === 'enojo') { fila(3, [7, 12], 'k'); fila(2, [9, 11], 'k'); } // furioso (carga, embiste, ruge): ojos entrecerrados
  }
  const g = Array.from({ length: 20 }, () => Array<string>(ANCHO_INACAPIN).fill('.'));
  const poner = (x: number, y: number, ch: string) => { if (ch !== '.' && y >= 0 && y < 20 && x + 1 >= 0 && x + 1 < ANCHO_INACAPIN) g[y][x + 1] = ch; };
  const baja = q.base - 13;
  cuerpo.forEach((f, j) => [...f].forEach((ch, i) => poner(i, j + baja, ch)));
  // Brazos: el guante (adelante) y la mano de atrás. Si el guante se adelanta, la muñeca se estira.
  const [gx, gy] = q.guante;
  if (gx < 0) { poner(3, 7 + baja + gy, 'k'); poner(3, 8 + baja + gy, 'h'); poner(3, 9 + baja + gy, 'k'); }
  GUANTE.forEach((f, j) => [...f].forEach((ch, i) => poner(i + gx, 6 + j + baja + gy, ch)));
  MANO.forEach((f, j) => [...f].forEach((ch, i) => poner(18 + i, 7 + j + baja + q.mano, ch)));
  // Piernas completas: van de la cadera (columna fija) al pie, en diagonal; luego la zapatilla. La de atrás, primero.
  const pierna = (cadera: number, [pie, aire]: [number, number], adelante: boolean) => {
    const filas = 16 - aire - q.base;
    for (let k = 0; k < filas; k++) {
      const x = Math.round(cadera + ((pie - cadera) * (k + 1)) / filas);
      [...PIERNA].forEach((ch, i) => poner(x + i, q.base + 1 + k, ch));
    }
    const y = 17 - aire, [a, b] = adelante ? [pie - 2, pie + 3] : [pie - 1, pie + 4];
    for (let x = pie - 1; x <= pie + 3; x++) poner(x, y, 'k');
    for (let x = a; x <= b; x++) { poner(x, y + 1, 'k'); poner(x, y + 2, 'h'); }
  };
  pierna(12, q.atras, false);
  pierna(6, q.adelante, true);
  return g.map(f => f.join(''));
}

// `rojo` (0 a 1): cuánto color recuperó. Mira a la izquierda en el sprite (el guante va adelante).
export function lienzoInacapin(rojo: number, o: OpcionesInacapin = {}): HTMLCanvasElement {
  const n = Math.round(rojo * 18) / 18;
  const filas = filasInacapin(o);
  const alto = filas.length, borde = alto - n * alto;
  const gris = { R: '#8F8F8A', h: '#C9C9C4' } as Record<string, string>;
  const tramado = (i: number, j: number) => (i + j) % 2 === 0;
  return lienzo(`inacapin|${n}|${JSON.stringify(o)}`, filas, (ch, i, j) => {
    if (o.silueta) return o.silueta;
    if (o.blanco && ch !== 'k') return '#FFFFFF';
    if (ch === 'k') return '#000000';
    const conColor = n >= 1 || j >= borde;
    if (conColor) return ch === 'R' ? (j >= borde && j < borde + 1 && n < 1 && tramado(i, j) ? '#FF8FB1' : '#E2001A') : '#F4EEE3';
    return ch === 'R' ? (tramado(i, j) && (i * 7 + j * 3) % 5 === 0 ? '#A3A39D' : gris.R) : gris.h;
  });
}
// Dibuja el Inacapín con los pies en (pieX, pieY) px, de `alto` px de alto. `mira`: 1 derecha.
// La grilla mide 22 de ancho (el sprite de Figma, 20, más el margen): el ancho sale de esa proporción.
export function dibujarInacapin(ctx: CanvasRenderingContext2D, pieX: number, pieY: number, alto: number, mira: 1 | -1, rojo: number, o: OpcionesInacapin = {}, aplasta = 1) {
  const ancho = (alto * ANCHO_INACAPIN) / 20, h = alto * aplasta, w = ancho * (1 + (1 - aplasta) * 0.6);
  // El sprite mira a la izquierda (guante adelante): se refleja para mirar a la derecha.
  estampar(ctx, lienzoInacapin(rojo, o), pieX - w / 2, pieY - h, w, h, mira > 0);
}

// ——— Colores ———
function rgb(hex: string) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const aHex = (c: number[]) => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const oscurecer = (hex: string, f: number) => aHex(rgb(hex).map(v => v * f));
export const aclarar = (hex: string, f: number) => aHex(rgb(hex).map(v => v + (255 - v) * f));
