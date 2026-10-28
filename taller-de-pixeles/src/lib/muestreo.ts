import { lab, mulberry, toHex, AjustesPixeles, ColorItem } from '../data/paletas';

export function makeSample(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 900;
  const x = c.getContext('2d')!;

  const bg = x.createRadialGradient(450, 380, 60, 450, 450, 700);
  bg.addColorStop(0, '#f1ece3');
  bg.addColorStop(1, '#d8d1c4');
  x.fillStyle = bg;
  x.fillRect(0, 0, 900, 900);

  x.filter = 'blur(14px)';
  x.fillStyle = 'rgba(60,45,30,.35)';
  x.beginPath();
  x.ellipse(480, 770, 120, 22, 0, 0, 7);
  x.fill();
  x.filter = 'none';

  const body = new Path2D();
  body.moveTo(255, 300);
  body.bezierCurveTo(255, 470, 395, 605, 438, 665);
  body.lineTo(462, 665);
  body.bezierCurveTo(505, 605, 645, 470, 645, 300);
  body.closePath();

  const wood = x.createLinearGradient(255, 0, 645, 0);
  wood.addColorStop(0, '#8a5426');
  wood.addColorStop(0.32, '#e6ad6c');
  wood.addColorStop(0.55, '#cf8f4c');
  wood.addColorStop(1, '#7a4520');
  x.fillStyle = wood;
  x.fill(body);

  x.save();
  x.clip(body);
  (
    [
      [330, 362, '#d32c2c'],
      [384, 408, '#f2bf2a'],
      [428, 452, '#2650b8'],
      [474, 494, '#d32c2c'],
      [516, 530, '#f2bf2a'],
    ] as const
  ).forEach(([a, b, col]) => {
    x.fillStyle = col;
    x.fillRect(200, a, 500, b - a);
  });

  const sh = x.createLinearGradient(255, 0, 645, 0);
  sh.addColorStop(0, 'rgba(0,0,0,.45)');
  sh.addColorStop(0.3, 'rgba(255,255,255,.18)');
  sh.addColorStop(0.6, 'rgba(0,0,0,0)');
  sh.addColorStop(1, 'rgba(0,0,0,.5)');
  x.fillStyle = sh;
  x.fillRect(200, 280, 500, 420);
  x.restore();

  x.fillStyle = '#d9a062';
  x.beginPath();
  x.ellipse(450, 300, 195, 50, 0, 0, 7);
  x.fill();

  x.strokeStyle = '#9a6431';
  x.lineWidth = 5;
  x.beginPath();
  x.ellipse(450, 300, 140, 34, 0, 0, 7);
  x.stroke();

  const knob = x.createLinearGradient(420, 0, 480, 0);
  knob.addColorStop(0, '#7f4a20');
  knob.addColorStop(0.4, '#d79b5a');
  knob.addColorStop(1, '#6e3e18');
  x.fillStyle = knob;
  x.fillRect(422, 232, 56, 70);

  x.fillStyle = '#e0a868';
  x.beginPath();
  x.ellipse(450, 232, 28, 9, 0, 0, 7);
  x.fill();

  const tip = x.createLinearGradient(436, 0, 464, 0);
  tip.addColorStop(0, '#5d6168');
  tip.addColorStop(0.45, '#d9dde2');
  tip.addColorStop(1, '#4b4f55');
  x.fillStyle = tip;
  x.beginPath();
  x.moveTo(436, 660);
  x.lineTo(450, 760);
  x.lineTo(464, 660);
  x.closePath();
  x.fill();

  const id = x.getImageData(0, 0, 900, 900);
  const d = id.data;
  const rnd = mulberry(7);
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 12;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  x.putImageData(id, 0, 0);
  return c;
}

export function resample(
  srcC: HTMLCanvasElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  tw: number,
  th: number
): [HTMLCanvasElement, number, number, number, number] {
  let c = srcC;
  let x = sx;
  let y = sy;
  let w = sw;
  let h = sh;
  while (w / 2 >= tw * 2 && h / 2 >= th * 2) {
    const n = document.createElement('canvas');
    n.width = Math.max(1, Math.round(w / 2));
    n.height = Math.max(1, Math.round(h / 2));
    const nx = n.getContext('2d')!;
    nx.imageSmoothingQuality = 'high';
    nx.drawImage(c, x, y, w, h, 0, 0, n.width, n.height);
    c = n;
    x = 0;
    y = 0;
    w = n.width;
    h = n.height;
  }
  return [c, x, y, w, h];
}

export function cropRect(
  src: HTMLCanvasElement,
  S: AjustesPixeles
): { x: number; y: number; side: number } {
  const w = src.width;
  const h = src.height;
  const side = Math.min(w, h) / S.zoom;
  const cx = Math.min(1 - side / 2 / w, Math.max(side / 2 / w, S.cx));
  const cy = Math.min(1 - side / 2 / h, Math.max(side / 2 / h, S.cy));
  return { x: cx * w - side / 2, y: cy * h - side / 2, side };
}

export interface GridSample {
  N: number;
  R: Float32Array;
  G: Float32Array;
  B: Float32Array;
  A: Uint8Array;
  LA: Float32Array;
}

export function sampleGrid(
  N: number,
  src: HTMLCanvasElement,
  S: AjustesPixeles
): GridSample {
  const T = N * 4;
  const can = document.createElement('canvas');
  can.width = can.height = T;
  const cx = can.getContext('2d', { willReadFrequently: true })!;
  cx.imageSmoothingEnabled = true;
  cx.imageSmoothingQuality = 'high';

  if (S.frame === 'crop') {
    const r = cropRect(src, S);
    const [c, x, y, w, h] = resample(src, r.x, r.y, r.side, r.side, T, T);
    cx.drawImage(c, x, y, w, h, 0, 0, T, T);
  } else {
    const sc = T / Math.max(src.width, src.height);
    const dw = src.width * sc;
    const dh = src.height * sc;
    const [c, x, y, w, h] = resample(src, 0, 0, src.width, src.height, dw, dh);
    cx.drawImage(c, x, y, w, h, (T - dw) / 2, (T - dh) / 2, dw, dh);
  }

  const d = cx.getImageData(0, 0, T, T).data;
  const P = N * N;
  const R = new Float32Array(P);
  const G = new Float32Array(P);
  const B = new Float32Array(P);
  const A = new Uint8Array(P);
  const sr: number[] = [];
  const sg: number[] = [];
  const sb: number[] = [];

  for (let py = 0; py < N; py++) {
    for (let px = 0; px < N; px++) {
      sr.length = sg.length = sb.length = 0;
      let ar = 0;
      let ag = 0;
      let ab = 0;
      let aw = 0;
      for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 4; i++) {
          const o = ((py * 4 + j) * T + px * 4 + i) * 4;
          const a = d[o + 3];
          if (a > 127) {
            sr.push(d[o]);
            sg.push(d[o + 1]);
            sb.push(d[o + 2]);
          }
          ar += d[o] * a;
          ag += d[o + 1] * a;
          ab += d[o + 2] * a;
          aw += a;
        }
      }
      const p = py * N + px;
      if (sr.length < 8) continue;
      A[p] = 255;
      if (S.sample === 'average') {
        R[p] = ar / aw;
        G[p] = ag / aw;
        B[p] = ab / aw;
      } else {
        let best = 0;
        let bd = Infinity;
        for (let i = 0; i < sr.length; i++) {
          let s = 0;
          for (let k = 0; k < sr.length; k++) {
            const dr = sr[i] - sr[k];
            const dg = sg[i] - sg[k];
            const db = sb[i] - sb[k];
            s += dr * dr + dg * dg + db * db;
          }
          if (s < bd) {
            bd = s;
            best = i;
          }
        }
        R[p] = sr[best];
        G[p] = sg[best];
        B[p] = sb[best];
      }
    }
  }

  const cc = S.contrast * 2.55;
  const cf = (259 * (cc + 255)) / (255 * (259 - cc));
  const bo = S.bright * 2.55;
  const sf = 1 + S.sat / 100;

  for (let p = 0; p < P; p++) {
    if (!A[p]) continue;
    const r = cf * (R[p] + bo - 128) + 128;
    const g = cf * (G[p] + bo - 128) + 128;
    const b = cf * (B[p] + bo - 128) + 128;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    R[p] = Math.max(0, Math.min(255, l + (r - l) * sf));
    G[p] = Math.max(0, Math.min(255, l + (g - l) * sf));
    B[p] = Math.max(0, Math.min(255, l + (b - l) * sf));
  }

  const LA = new Float32Array(P * 3);
  for (let p = 0; p < P; p++) {
    if (!A[p]) continue;
    const v = lab(R[p], G[p], B[p]);
    LA[p * 3] = v[0];
    LA[p * 3 + 1] = v[1];
    LA[p * 3 + 2] = v[2];
  }

  if (S.bgRemove) {
    const border: number[] = [];
    for (let i = 0; i < N; i++) {
      border.push(i, (N - 1) * N + i, i * N, i * N + N - 1);
    }
    const buckets = new Map<number, number[]>();
    border.forEach((p) => {
      if (!A[p]) return;
      const k = ((R[p] >> 5) << 6) | ((G[p] >> 5) << 3) | (B[p] >> 5);
      const e = buckets.get(k) || [];
      e.push(p);
      buckets.set(k, e);
    });
    let top: number[] = [];
    buckets.forEach((v) => {
      if (v.length > top.length) top = v;
    });
    if (top.length) {
      let rl = 0;
      let ra = 0;
      let rb = 0;
      top.forEach((p) => {
        rl += LA[p * 3];
        ra += LA[p * 3 + 1];
        rb += LA[p * 3 + 2];
      });
      rl /= top.length;
      ra /= top.length;
      rb /= top.length;

      const near = (p: number) => {
        const dl = LA[p * 3] - rl;
        const da = LA[p * 3 + 1] - ra;
        const db = LA[p * 3 + 2] - rb;
        return Math.sqrt(dl * dl + da * da + db * db) < S.tol;
      };

      const seen = new Uint8Array(P);
      const q: number[] = [];
      border.forEach((p) => {
        if (A[p] && !seen[p] && near(p)) {
          seen[p] = 1;
          q.push(p);
        }
      });

      while (q.length) {
        const p = q.pop()!;
        A[p] = 0;
        const x = p % N;
        const y = (p / N) | 0;
        ([
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ] as const).forEach(([a, b]) => {
          if (a < 0 || b < 0 || a >= N || b >= N) return;
          const n = b * N + a;
          if (!seen[n] && A[n] && near(n)) {
            seen[n] = 1;
            q.push(n);
          }
        });
      }
    }
  }

  return { N, R, G, B, A, LA };
}

export function cleanup(
  idx: Int16Array,
  N: number,
  passes: number,
  allowClear: boolean
): Int16Array {
  let curr = idx;
  for (let it = 0; it < passes; it++) {
    const nx = new Int16Array(curr);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const p = y * N + x;
        const v = curr[p];
        if (v < 0) continue;
        const cnt = new Map<number, number>();
        let same = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
            const u = curr[yy * N + xx];
            if (u === v) same++;
            cnt.set(u, (cnt.get(u) || 0) + 1);
          }
        }
        if (same === 0) {
          let bu = v;
          let bc = 0;
          cnt.forEach((c, u) => {
            if (c > bc || (c === bc && u >= 0 && bu < 0)) {
              bc = c;
              bu = u;
            }
          });
          if (bu < 0 && !allowClear) continue;
          nx[p] = bu;
        }
      }
    }
    curr = nx;
  }
  return curr;
}

export function kmeans(
  R: Float32Array,
  G: Float32Array,
  B: Float32Array,
  A: Uint8Array,
  LA: Float32Array,
  P: number,
  K: number
): ColorItem[] {
  const pts: number[] = [];
  for (let p = 0; p < P; p++) {
    if (A[p]) pts.push(p);
  }
  if (!pts.length) return [];

  const rnd = mulberry(1234);
  const n = pts.length;
  K = Math.min(K, n);
  const C: { L: number; A: number; B: number }[] = [];
  const first = pts[Math.floor(rnd() * n)];
  C.push({ L: LA[first * 3], A: LA[first * 3 + 1], B: LA[first * 3 + 2] });
  const D = new Float32Array(n).fill(Infinity);

  while (C.length < K) {
    const c = C[C.length - 1];
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const dl = LA[p * 3] - c.L;
      const da = LA[p * 3 + 1] - c.A;
      const db = LA[p * 3 + 2] - c.B;
      const dd = dl * dl + da * da + db * db;
      if (dd < D[i]) D[i] = dd;
      sum += D[i];
    }
    if (sum === 0) break;
    let t = rnd() * sum;
    let i = 0;
    for (; i < n - 1; i++) {
      t -= D[i];
      if (t <= 0) break;
    }
    const p = pts[i];
    C.push({ L: LA[p * 3], A: LA[p * 3 + 1], B: LA[p * 3 + 2] });
  }

  let out: { r: number; g: number; b: number; L: number; A: number; B: number; hex?: string }[] =
    [];
  for (let it = 0; it < 14; it++) {
    const acc = C.map(() => ({ r: 0, g: 0, b: 0, n: 0 }));
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      let bi = 0;
      let bd = Infinity;
      for (let k = 0; k < C.length; k++) {
        const c = C[k];
        const dl = LA[p * 3] - c.L;
        const da = LA[p * 3 + 1] - c.A;
        const db = LA[p * 3 + 2] - c.B;
        const dd = dl * dl + da * da + db * db;
        if (dd < bd) {
          bd = dd;
          bi = k;
        }
      }
      const a = acc[bi];
      a.r += R[p];
      a.g += G[p];
      a.b += B[p];
      a.n++;
    }
    out = [];
    acc.forEach((a, k) => {
      if (!a.n) return;
      const r = Math.round(a.r / a.n);
      const g = Math.round(a.g / a.n);
      const b = Math.round(a.b / a.n);
      const v = lab(r, g, b);
      C[k] = { L: v[0], A: v[1], B: v[2] };
      out.push({ r, g, b, L: v[0], A: v[1], B: v[2] });
    });
  }

  const res: ColorItem[] = [];
  out.forEach((c) => {
    if (!res.some((d) => (d.r - c.r) ** 2 + (d.g - c.g) ** 2 + (d.b - c.b) ** 2 < 4)) {
      const hex = toHex(c);
      res.push({ name: hex, r: c.r, g: c.g, b: c.b, L: c.L, A: c.A, B: c.B, hex });
    }
  });
  return res;
}
