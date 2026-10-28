import { COLS, FILAS, MAX_CHORROS } from '../data/config';

export interface Chorro { x: number; y: number; color: number; resta: number }
export interface Estampa { id: string; x: number; y: number }
export interface Dibujo { pintura: Uint8Array; stickers: Estampa[] }

export const nuevoDibujo = (): Dibujo => ({ pintura: new Uint8Array(COLS * FILAS), stickers: [] });
export const copiar = (d: Dibujo): Dibujo => ({ pintura: d.pintura.slice(), stickers: d.stickers.slice() });
const dentro = (x: number, y: number) => x >= 0 && y >= 0 && x < COLS && y < FILAS;

// Spray: pinta las celdas dentro del radio con probabilidad mayor al centro (trazo con borde irregular).
// Cuando una celda se repinta muchas veces en el mismo trazo, puede nacer un chorro que gotea hacia abajo.
export function rociar(d: Dibujo, golpes: Uint8Array, cx: number, cy: number, radio: number, color: number, chorros: Chorro[]) {
  const r = radio + 0.5;
  for (let dy = -radio; dy <= radio; dy++) for (let dx = -radio; dx <= radio; dx++) {
    const x = cx + dx, y = cy + dy, dist = Math.hypot(dx, dy);
    if (!dentro(x, y) || dist > r) continue;
    if (Math.random() > 0.9 - 0.4 * (dist / r)) continue;
    const i = y * COLS + x;
    d.pintura[i] = color;
    if (golpes[i] < 255) golpes[i]++;
    if (golpes[i] === 5 && chorros.length < MAX_CHORROS && Math.random() < 0.35) {
      chorros.push({ x, y: y + 1, color, resta: 4 + Math.floor(Math.random() * 11) });
    }
  }
}

export function borrar(d: Dibujo, cx: number, cy: number, radio: number) {
  for (let dy = -radio; dy <= radio; dy++) for (let dx = -radio; dx <= radio; dx++) {
    const x = cx + dx, y = cy + dy;
    if (dentro(x, y) && Math.hypot(dx, dy) <= radio + 0.5) d.pintura[y * COLS + x] = 0;
  }
}

// Recorre la línea entre dos celdas (Bresenham) para que un trazo rápido no deje huecos.
export function linea(x0: number, y0: number, x1: number, y1: number, cada: (x: number, y: number) => void) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    cada(x0, y0);
    if (x0 === x1 && y0 === y1) return;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// Avanza cada chorro una celda hacia abajo; devuelve los que siguen activos.
export function gotear(d: Dibujo, chorros: Chorro[]): Chorro[] {
  const siguen: Chorro[] = [];
  for (const c of chorros) {
    if (!dentro(c.x, c.y) || c.resta <= 0) continue;
    d.pintura[c.y * COLS + c.x] = c.color;
    c.y++; c.resta--;
    if (c.resta > 0 && c.y < FILAS) siguen.push(c);
  }
  return siguen;
}
