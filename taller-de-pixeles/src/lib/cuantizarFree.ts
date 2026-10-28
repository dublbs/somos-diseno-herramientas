import {
  LINEA,
  PALETTES,
  BAYER,
  hexToCol,
  lab,
  AjustesPixeles,
  ColorItem,
} from '../data/paletas';
import { sampleGrid, cleanup, kmeans } from './muestreo';

export interface DatosFree {
  N: number;
  idx: Int16Array;
  pal: ColorItem[];
  counts: number[];
}

export function processFree(
  N: number,
  src: HTMLCanvasElement,
  S: AjustesPixeles
): DatosFree {
  const g = sampleGrid(N, src, S);
  const { R, G, B, A, LA } = g;
  const P = N * N;

  let pal: ColorItem[];
  if (S.pal === 'linea') {
    pal = LINEA.slice();
  } else if (S.pal !== 'auto') {
    pal = PALETTES[S.pal].split(' ').map((h) => hexToCol(h));
  } else {
    pal = kmeans(R, G, B, A, LA, P, S.colors);
  }
  if (!pal.length) pal = [hexToCol('000000')];

  const nearest = (L: number, a: number, b: number) => {
    let bi = 0;
    let bd = Infinity;
    for (let i = 0; i < pal.length; i++) {
      const c = pal[i];
      const dl = L - c.L;
      const da = a - c.A;
      const db = b - c.B;
      const dd = dl * dl + da * da + db * db;
      if (dd < bd) {
        bd = dd;
        bi = i;
      }
    }
    return bi;
  };

  let idx = new Int16Array(P).fill(-1);
  const amt = S.ditherAmt / 100;

  if (S.dither === 'fs' && amt > 0) {
    const r = Float32Array.from(R);
    const gg = Float32Array.from(G);
    const b = Float32Array.from(B);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const p = y * N + x;
        if (!A[p]) continue;
        const v = lab(r[p], gg[p], b[p]);
        const i = nearest(v[0], v[1], v[2]);
        idx[p] = i;
        const er = (r[p] - pal[i].r) * amt;
        const eg = (gg[p] - pal[i].g) * amt;
        const eb = (b[p] - pal[i].b) * amt;
        (
          [
            [1, 0, 7],
            [-1, 1, 3],
            [0, 1, 5],
            [1, 1, 1],
          ] as const
        ).forEach(([dx, dy, w]) => {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || xx >= N || yy >= N) return;
          const q = yy * N + xx;
          if (!A[q]) return;
          r[q] += (er * w) / 16;
          gg[q] += (eg * w) / 16;
          b[q] += (eb * w) / 16;
        });
      }
    }
  } else if (S.dither === 'bayer' && amt > 0) {
    for (let p = 0; p < P; p++) {
      if (!A[p]) continue;
      const o = (BAYER[((((p / N) | 0) & 3) * 4 + ((p % N) & 3))] / 16 - 0.47) * amt * 72;
      const v = lab(R[p] + o, G[p] + o, B[p] + o);
      idx[p] = nearest(v[0], v[1], v[2]);
    }
  } else {
    for (let p = 0; p < P; p++) {
      if (A[p]) idx[p] = nearest(LA[p * 3], LA[p * 3 + 1], LA[p * 3 + 2]);
    }
  }

  idx = new Int16Array(cleanup(idx, N, S.clean, S.bgRemove));

  const darker = pal.map((c, i) => {
    let bj = i;
    let bd = Infinity;
    const tL = c.L * 0.55 - 4;
    const tA = c.A * 0.85;
    const tB = c.B * 0.85;
    pal.forEach((d, j) => {
      if (j === i || d.L > c.L - 4) return;
      const dl = d.L - tL;
      const da = d.A - tA;
      const db = d.B - tB;
      const dd = dl * dl + da * da + db * db;
      if (dd < bd) {
        bd = dd;
        bj = j;
      }
    });
    return bj;
  });

  if (S.outline === 'inner' || S.outline === 'both') {
    const base = new Int16Array(idx);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const p = y * N + x;
        const v = base[p];
        if (v < 0 || darker[v] === v) continue;
        if (
          ([
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ] as const).some(([dx, dy]) => {
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= N || yy >= N) return false;
            const u = base[yy * N + xx];
            return u >= 0 && u !== v && pal[u].L - pal[v].L > 14;
          })
        ) {
          idx[p] = darker[v];
        }
      }
    }
  }

  if ((S.outline === 'outer' || S.outline === 'both') && S.bgRemove) {
    const base = new Int16Array(idx);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const p = y * N + x;
        if (base[p] >= 0) continue;
        let pick = -1;
        let pl = Infinity;
        ([
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const).forEach(([dx, dy]) => {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= N || yy >= N) return;
          const u = base[yy * N + xx];
          if (u >= 0) {
            const dk = darker[u];
            if (pal[dk].L < pl) {
              pl = pal[dk].L;
              pick = dk;
            }
          }
        });
        if (pick >= 0) idx[p] = pick;
      }
    }
  }

  const counts = new Array<number>(pal.length).fill(0);
  idx.forEach((v) => {
    if (v >= 0) counts[v]++;
  });

  return { N, idx, pal, counts };
}
