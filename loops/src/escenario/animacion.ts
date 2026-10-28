// Muestreo de las pistas de keyframes que salen de Figma Motion (get_motion_context).
export type Curva = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | [number, number, number, number];
export type Prop = 'x' | 'y' | 'rotate' | 'scaleX' | 'scaleY' | 'opacity';

export interface Pista {
  prop: Prop;
  t: number[]; // 0..1, mismo largo que v
  v: number[];
  e?: Curva | Curva[]; // una curva por tramo (largo t - 1), o una sola para todos
}

const BEZIER: Record<string, [number, number, number, number]> = {
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
};

function bezier(x1: number, y1: number, x2: number, y2: number, t: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  let lo = 0, hi = 1, s = t;
  for (let i = 0; i < 18; i++) {
    const x = 3 * (1 - s) ** 2 * s * x1 + 3 * (1 - s) * s * s * x2 + s ** 3;
    if (x < t) lo = s; else hi = s;
    s = (lo + hi) / 2;
  }
  return 3 * (1 - s) ** 2 * s * y1 + 3 * (1 - s) * s * s * y2 + s ** 3;
}

function suavizar(c: Curva | undefined, t: number) {
  if (!c || c === 'linear') return t;
  const [a, b, c2, d] = typeof c === 'string' ? BEZIER[c] : c;
  return bezier(a, b, c2, d, t);
}

export function muestrear(p: Pista, u: number): number {
  const { t, v } = p;
  if (u <= t[0]) return v[0];
  for (let i = 0; i < t.length - 1; i++) {
    if (u < t[i + 1]) {
      const local = (u - t[i]) / (t[i + 1] - t[i]);
      const c = Array.isArray(p.e) && typeof p.e[0] !== 'number' ? (p.e as Curva[])[i] : (p.e as Curva | undefined);
      return v[i] + (v[i + 1] - v[i]) * suavizar(c, local);
    }
  }
  return v[v.length - 1];
}
