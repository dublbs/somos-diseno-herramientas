import { HEX, figuraEn, type NombreColor } from './comun';

// Faja tejida a telar (Figma: Orgánica / FA02 · Faja tejida a telar).
// La faja es una grilla de hilos: COLS de urdimbre (verticales) × FILAS de trama (las pasadas).
// Se arma por secciones que se repiten: una banda en zigzag y una fila de motivos (las figuras elegidas),
// con orillas de listas a los lados. Cada celda guarda qué color lleva: 0 fondo, 1 figura, 2 detalle, 3 negro.
export const COLS = 36, FILAS = 72, MOTIVO = 22;

export interface Diseno { motivos: HTMLImageElement[]; colores: [NombreColor, NombreColor, NombreColor] }

// La figura convertida en MOTIVO × MOTIVO hilos: 0 no se teje, 1 parte oscura (hilo de figura), 2 parte clara (hilo de detalle).
// Así se lee el dibujo interior (la guata del pingüino, el centro del sol) y no solo la silueta.
const mascaras = new Map<HTMLImageElement, Uint8Array>();
export function mascara(im: HTMLImageElement): Uint8Array {
  let m = mascaras.get(im);
  if (!m) {
    const k = 4, n = MOTIVO * k, c = figuraEn(im, n, n, 0.02), d = c.getContext('2d')!.getImageData(0, 0, n, n).data;
    m = new Uint8Array(MOTIVO * MOTIVO);
    for (let i = 0; i < MOTIVO * MOTIVO; i++) {
      const x0 = (i % MOTIVO) * k, y0 = Math.floor(i / MOTIVO) * k;
      let a = 0, lum = 0;
      for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) {
        const j = ((y0 + y) * n + x0 + x) * 4, al = d[j + 3] / 255;
        a += al; lum += al * (0.3 * d[j] + 0.59 * d[j + 1] + 0.11 * d[j + 2]) / 255;
      }
      a /= k * k;
      if (a > 0.4) m[i] = lum / (a * k * k) < 0.45 ? 1 : 2;
    }
    mascaras.set(im, m);
  }
  return m;
}

export function componer(d: Diseno): Uint8Array {
  const g = new Uint8Array(COLS * FILAS);
  const pon = (x: number, y: number, v: number) => { if (x >= 0 && x < COLS && y >= 0 && y < FILAS) g[y * COLS + x] = v; };
  let y = 0, seccion = 0;
  // remate superior
  for (let x = 0; x < COLS; x++) { pon(x, 0, 3); pon(x, 1, 3); }
  y = 3;
  while (y < FILAS - 3) {
    // banda en zigzag de 5 pasadas (como la k'isa)
    for (let k = 0; k < 5 && y < FILAS - 3; k++, y++) for (let x = 2; x < COLS - 2; x++) {
      const z = Math.abs(((x + seccion * 4) % 8) - 4);
      if (z === k || z === k - 1) pon(x, y, seccion % 2 ? 2 : 1);
    }
    y++;
    // el motivo al centro: una figura por sección, en el orden elegido
    if (d.motivos.length && y + MOTIVO < FILAS - 3) {
      const m = mascara(d.motivos[seccion % d.motivos.length]), x0 = Math.floor((COLS - MOTIVO) / 2);
      for (let my = 0; my < MOTIVO; my++) for (let mx = 0; mx < MOTIVO; mx++) {
        const v = m[my * MOTIVO + mx];
        if (v) pon(x0 + mx, y + my, v);
      }
      y += MOTIVO + 1;
    }
    seccion++;
  }
  for (let x = 0; x < COLS; x++) { pon(x, FILAS - 1, 3); pon(x, FILAS - 2, 3); }
  // orillas: listas verticales a cada lado
  for (let yy = 2; yy < FILAS - 2; yy++) { pon(0, yy, 3); pon(1, yy, 1); pon(COLS - 1, yy, 3); pon(COLS - 2, yy, 1); }
  return g;
}

const color = (d: Diseno, v: number) => (v === 3 ? HEX.Negro : HEX[d.colores[v]]);

// Dibuja la faja en un lienzo de cel × cel por hilo. `tejido` son las pasadas terminadas (puede tener decimales:
// la pasada en curso se teje de izquierda a derecha o al revés, como va la lanzadera).
export function dibujarFaja(ctx: CanvasRenderingContext2D, g: Uint8Array, d: Diseno, cel: number, tejido = FILAS, ox = 0, oy = 0) {
  const completas = Math.floor(tejido), parcial = tejido - completas;
  // urdimbre sin tejer: hilos verticales sobre fondo oscuro
  ctx.fillStyle = '#2A2622'; ctx.fillRect(ox, oy, COLS * cel, FILAS * cel);
  ctx.fillStyle = HEX.Hueso;
  for (let x = 0; x < COLS; x++) ctx.fillRect(ox + x * cel + cel * 0.35, oy, Math.max(1, cel * 0.3), FILAS * cel);
  for (let y = 0; y < Math.min(FILAS, completas + 1); y++) {
    const hasta = y < completas ? COLS : Math.floor(parcial * COLS), izq = y % 2 === 0;
    for (let i = 0; i < hasta; i++) {
      const x = izq ? i : COLS - 1 - i, v = g[y * COLS + x];
      ctx.fillStyle = color(d, v);
      ctx.fillRect(ox + x * cel, oy + y * cel, cel, cel);
      // textura de punto: el hilo de urdimbre asoma un poco
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(ox + x * cel + cel * 0.45, oy + y * cel, Math.max(1, cel * 0.1), cel);
    }
  }
}

// Posición de la lanzadera en la pasada actual (para dibujarla).
export function lanzadera(tejido: number) {
  const y = Math.floor(tejido), p = tejido - y;
  return { fila: y, x: y % 2 === 0 ? p * COLS : COLS - p * COLS };
}
