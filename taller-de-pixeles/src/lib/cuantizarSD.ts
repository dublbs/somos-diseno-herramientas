import {
  LINEA,
  byName,
  lab,
  contrast,
  relLum,
  BAYER,
  AjustesPixeles,
  ColorItem,
} from '../data/paletas';
import { sampleGrid, cleanup } from './muestreo';

export interface DatosSD {
  N: number;
  idx: Int16Array;
  pal: ColorItem[];
  isOutline: Uint8Array;
  fondo: ColorItem;
  oc: ColorItem | null;
}

export interface ReglaCheck {
  estado: 'ok' | 'warn' | 'info';
  texto: string;
}

export function processSD(
  src: HTMLCanvasElement,
  S: AjustesPixeles,
  allowed: Set<string>
): DatosSD {
  const m = S.sdMargin;
  const n = 24 - 2 * m;
  const g = sampleGrid(n, src, S);
  const P = n * n;
  const oc = S.sdOutline ? byName(S.sdOutlineColor) : null;

  let cands = LINEA.filter((c) => c.name !== S.sdFondo && allowed.has(c.name));
  if (!cands.length) cands = LINEA.filter((c) => c.name !== S.sdFondo);

  const pts: number[] = [];
  for (let p = 0; p < P; p++) {
    if (g.A[p]) pts.push(p);
  }

  const C = cands.length;
  const dist = new Float32Array(pts.length * C);
  pts.forEach((p, i) => {
    for (let k = 0; k < C; k++) {
      const c = cands[k];
      const dl = g.LA[p * 3] - c.L;
      const da = g.LA[p * 3 + 1] - c.A;
      const db = g.LA[p * 3 + 2] - c.B;
      dist[i * C + k] = dl * dl + da * da + db * db;
    }
  });

  // Elegir el mejor subconjunto de la paleta (búsqueda exhaustiva, ≤255 combinaciones)
  let best: number[] = [];
  let bestE = Infinity;
  const ocInC = oc ? cands.indexOf(oc) : -1;

  const evalSub = (sub: number[]) => {
    let e = 0;
    for (let i = 0; i < pts.length; i++) {
      let mn = Infinity;
      for (const k of sub) {
        const v = dist[i * C + k];
        if (v < mn) mn = v;
      }
      e += mn;
    }
    return e;
  };

  const rec = (start: number, sub: number[]) => {
    if (sub.length) {
      const used = sub.length + (oc && !sub.includes(ocInC) ? 1 : 0);
      if (used <= S.sdMax) {
        const e = evalSub(sub);
        if (e < bestE - 1e-6) {
          bestE = e;
          best = sub.slice();
        }
      } else return;
    }
    if (sub.length >= 4) return;
    for (let k = start; k < C; k++) {
      sub.push(k);
      rec(k + 1, sub);
      sub.pop();
    }
  };

  if (pts.length) rec(0, []);
  const pal = best.map((k) => cands[k]);

  let small = new Int16Array(P).fill(-1);
  const amt = S.ditherAmt2 / 100;

  for (let p = 0; p < P; p++) {
    if (!g.A[p] || !pal.length) continue;
    let L = g.LA[p * 3];
    let a = g.LA[p * 3 + 1];
    let b = g.LA[p * 3 + 2];
    if (S.sdDither && amt > 0) {
      const o = (BAYER[((((p / n) | 0) & 3) * 4 + ((p % n) & 3))] / 16 - 0.47) * amt * 72;
      [L, a, b] = lab(g.R[p] + o, g.G[p] + o, g.B[p] + o);
    }
    let bi = 0;
    let bd = Infinity;
    pal.forEach((c, i) => {
      const dl = L - c.L;
      const da = a - c.A;
      const db = b - c.B;
      const dd = dl * dl + da * da + db * db;
      if (dd < bd) {
        bd = dd;
        bi = i;
      }
    });
    small[p] = bi;
  }

  small = new Int16Array(cleanup(small, n, S.clean, true));

  const N = 24;
  const idx = new Int16Array(N * N).fill(-1);
  const isOutline = new Uint8Array(N * N);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      idx[(y + m) * N + x + m] = small[y * n + x];
    }
  }

  const palAll = pal.slice();
  if (oc) {
    let oi = palAll.indexOf(oc);
    if (oi < 0) {
      palAll.push(oc);
      oi = palAll.length - 1;
    }
    const base = new Int16Array(idx);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const p = y * N + x;
        if (base[p] >= 0) continue;
        if (
          ([
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ] as const).some(([dx, dy]) => {
            const xx = x + dx;
            const yy = y + dy;
            return xx >= 0 && yy >= 0 && xx < N && yy < N && base[yy * N + xx] >= 0;
          })
        ) {
          idx[p] = oi;
          isOutline[p] = 1;
        }
      }
    }
  }

  return { N, idx, pal: palAll, isOutline, fondo: byName(S.sdFondo), oc };
}

export function drawModule(
  res: DatosSD,
  scale: number,
  ctx: CanvasRenderingContext2D,
  grid: boolean
) {
  const { N, idx, pal, fondo } = res;
  const s = scale;
  ctx.fillStyle = fondo.hex;
  ctx.fillRect(0, 0, N * s, N * s);

  for (let p = 0; p < N * N; p++) {
    const v = idx[p];
    if (v < 0) continue;
    ctx.fillStyle = pal[v].hex;
    ctx.fillRect((p % N) * s, ((p / N) | 0) * s, s, s);
  }

  if (grid) {
    ctx.strokeStyle =
      relLum(fondo) > 0.4 ? 'rgba(0,0,0,.14)' : 'rgba(255,255,255,.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < N; i++) {
      const v = i * s + 0.5;
      ctx.moveTo(v, 0);
      ctx.lineTo(v, N * s);
      ctx.moveTo(0, v);
      ctx.lineTo(N * s, v);
    }
    ctx.stroke();
  }
}

export function buildSVG(res: DatosSD): string {
  const { N, idx, pal, isOutline, fondo } = res;
  const s = 10;
  const groups = new Map<string, { hex: string; d: string[]; n: number }>();

  for (let y = 0; y < N; y++) {
    let x = 0;
    while (x < N) {
      const p = y * N + x;
      const v = idx[p];
      if (v < 0) {
        x++;
        continue;
      }
      const key = isOutline[p] ? 'Contorno' : pal[v].name;
      const hex = pal[v].hex;
      let len = 1;
      while (x + len < N) {
        const q = y * N + x + len;
        if (idx[q] < 0 || (isOutline[q] ? 'Contorno' : pal[idx[q]].name) !== key) break;
        len++;
      }
      if (!groups.has(key)) groups.set(key, { hex, d: [], n: 0 });
      const gr = groups.get(key)!;
      gr.d.push(`M${x * s} ${y * s}h${len * s}v${s}h-${len * s}z`);
      gr.n += len;
      x += len;
    }
  }

  const order = [...groups.entries()].sort((a, b) =>
    a[0] === 'Contorno' ? -1 : b[0] === 'Contorno' ? 1 : b[1].n - a[1].n
  );
  const esc = (t: string) =>
    t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240" fill="none">\n` +
    `  <g id="Fondo"><rect id="Celda" width="240" height="240" fill="${fondo.hex}"/></g>\n` +
    `  <g id="Figura">\n` +
    order.map(([k, gr]) => `    <path id="${esc(k)}" fill="${gr.hex}" d="${gr.d.join('')}"/>`).join('\n') +
    `\n  </g>\n</svg>\n`
  );
}

export function validarReglasSD(res: DatosSD, S: AjustesPixeles): ReglaCheck[] {
  const { N, idx, pal, isOutline, fondo, oc } = res;
  const counts = new Map<number, number>();
  let outlineCount = 0;
  let fig = 0;

  for (let p = 0; p < N * N; p++) {
    const v = idx[p];
    if (v < 0) continue;
    fig++;
    if (isOutline[p]) {
      outlineCount++;
      continue;
    }
    counts.set(v, (counts.get(v) || 0) + 1);
  }

  const usedColors = new Set<ColorItem>();
  counts.forEach((_, v) => usedColors.add(pal[v]));
  if (outlineCount && oc) usedColors.add(oc);

  const checks: ReglaCheck[] = [];
  checks.push({
    estado: 'ok',
    texto: 'Grilla de 24 × 24 sobre un cuadro de 240: cada pixel mide 10 px.',
  });

  if (!fig) {
    checks.push({
      estado: 'warn',
      texto: 'No quedó figura. Baja la tolerancia, desactiva «Quitar el fondo» o mueve el recorte.',
    });
  } else {
    checks.push({
      estado: usedColors.size <= 4 ? 'ok' : 'warn',
      texto: `${usedColors.size} de 4 colores como máximo, todos de Línea azul.`,
    });

    const edge = new Map<ColorItem, number>();
    let edgeN = 0;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const p = y * N + x;
        const v = idx[p];
        if (v < 0) continue;
        const out = ([
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const).some(([dx, dy]) => {
          const xx = x + dx;
          const yy = y + dy;
          return xx < 0 || yy < 0 || xx >= N || yy >= N || idx[yy * N + xx] < 0;
        });
        if (out) {
          edgeN++;
          edge.set(pal[v], (edge.get(pal[v]) || 0) + 1);
        }
      }
    }

    let pass = 0;
    let worstColor: ColorItem | null = null;
    let worstRatio = Infinity;
    edge.forEach((n, c) => {
      const r = contrast(c, fondo);
      if (r >= 3) pass += n;
      else if (r < worstRatio) {
        worstRatio = r;
        worstColor = c;
      }
    });

    const share = edgeN ? pass / edgeN : 1;
    if (share >= 0.9) {
      checks.push({
        estado: 'ok',
        texto: `Contraste 3:1 entre figura y fondo en ${Math.round(share * 100)} % del borde.`,
      });
    } else if (worstColor !== null) {
      const c = worstColor as ColorItem;
      checks.push({
        estado: 'warn',
        texto: `Contraste bajo 3:1 en parte del borde (${c.name} sobre ${fondo.name}: ${worstRatio
          .toFixed(1)
          .replace('.', ',')}:1). Activa el contorno o cambia el fondo.`,
      });
    }

    checks.push(
      S.sdDither
        ? { estado: 'warn', texto: 'Trama activa: revisa que solo quede en nubes, metal o humo.' }
        : { estado: 'ok', texto: 'Color plano, sin brillos ni degradados.' }
    );

    checks.push(
      oc
        ? { estado: 'ok', texto: `Contorno solo por fuera, en ${oc.name}.` }
        : { estado: 'info', texto: 'Sin contorno exterior.' }
    );

    const touches = [...Array(N).keys()].some(
      (i) => idx[i] >= 0 || idx[(N - 1) * N + i] >= 0 || idx[i * N] >= 0 || idx[i * N + N - 1] >= 0
    );
    if (touches) {
      checks.push({ estado: 'warn', texto: 'La figura toca el borde de la celda. Sube el margen.' });
    }
  }

  checks.push({
    estado: 'info',
    texto: 'Boceto automático: revisa a mano las formas clave antes de sumarlo al sistema.',
  });

  return checks;
}
