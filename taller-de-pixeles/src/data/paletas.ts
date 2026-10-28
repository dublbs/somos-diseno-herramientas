// Color math y paletas para Taller de Píxeles

const LIN = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  LIN[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export const cl = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
const fl = (t: number): number => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

export function lab(r: number, g: number, b: number): [number, number, number] {
  const lr = LIN[cl(r)];
  const lg = LIN[cl(g)];
  const lb = LIN[cl(b)];
  const x = fl((0.4124 * lr + 0.3576 * lg + 0.1805 * lb) / 0.95047);
  const y = fl((0.2126 * lr + 0.7152 * lg + 0.0722 * lb));
  const z = fl((0.0193 * lr + 0.1192 * lg + 0.9505 * lb) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export interface ColorItem {
  name: string;
  r: number;
  g: number;
  b: number;
  L: number;
  A: number;
  B: number;
  hex: string;
}

export const relLum = (c: { r: number; g: number; b: number }): number =>
  0.2126 * LIN[c.r] + 0.7152 * LIN[c.g] + 0.0722 * LIN[c.b];

export const contrast = (
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number }
): number => {
  const x = relLum(a);
  const y = relLum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

export const hexToCol = (h: string, name?: string): ColorItem => {
  const n = parseInt(h.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const [L, A, B] = lab(r, g, b);
  return { name: name || ('#' + h.toUpperCase()), r, g, b, L, A, B, hex: '#' + h.toUpperCase() };
};

export const toHex = (c: { r: number; g: number; b: number }): string =>
  '#' + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

export function mulberry(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Línea azul (variables del archivo Somos Diseño)
export const LINEA: ColorItem[] = [
  ['Hueso', 'f4eee3'],
  ['Blanco', 'ffffff'],
  ['Negro', '000000'],
  ['Azul', '0062b8'],
  ['Lapislázuli', '2b4bd8'],
  ['Celeste', '7fc8f8'],
  ['Amarillo', 'ffc20e'],
  ['Verde', '00a651'],
  ['Rosa', 'ff8fb1'],
  ['Morado', '7a2e8e'],
].map(([name, h]) => hexToCol(h, name));

export const byName = (n: string): ColorItem => LINEA.find((c) => c.name === n) || LINEA[0];

export const PALETTES: Record<string, string> = {
  pico8:
    '000000 1D2B53 7E2553 008751 AB5236 5F574F C2C3C7 FFF1E8 FF004D FFA300 FFEC27 00E436 29ADFF 83769C FF77A8 FFCCAA',
  gb: '0f380f 306230 8bac0f 9bbc0f',
};

export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export interface AjustesPixeles {
  mode: 'sd' | 'free';
  frame: 'crop' | 'fit';
  zoom: number;
  sample: 'dominant' | 'average';
  bright: number;
  contrast: number;
  sat: number;
  clean: number;
  bgRemove: boolean;
  tol: number;
  grid: boolean;
  // SD
  sdMargin: number;
  sdMax: number;
  sdFondo: string;
  sdOutline: boolean;
  sdOutlineColor: string;
  sdDither: boolean;
  ditherAmt2: number;
  // Free
  pal: 'auto' | 'linea' | 'pico8' | 'gb';
  colors: number;
  dither: 'none' | 'bayer' | 'fs';
  ditherAmt: number;
  outline: 'none' | 'inner' | 'outer' | 'both';
  // Posición de recorte
  cx: number;
  cy: number;
}

export const DEFAULTS: AjustesPixeles = {
  mode: 'sd',
  frame: 'crop',
  zoom: 1.6,
  sample: 'dominant',
  bright: 0,
  contrast: 15,
  sat: 20,
  clean: 1,
  bgRemove: true,
  tol: 18,
  grid: false,
  sdMargin: 2,
  sdMax: 4,
  sdFondo: 'Hueso',
  sdOutline: true,
  sdOutlineColor: 'Negro',
  sdDither: false,
  ditherAmt2: 50,
  pal: 'auto',
  colors: 12,
  dither: 'none',
  ditherAmt: 50,
  outline: 'none',
  cx: 0.5,
  cy: 0.55,
};
