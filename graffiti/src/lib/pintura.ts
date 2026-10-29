import { COLS, FILAS, MAX_CHORROS } from '../data/config';
import { PLANTILLAS, TEXTURA_RODILLO } from '../data/stencils';

export interface Chorro { x: number; y: number; color: number; resta: number }
export interface Estampa { id: string; x: number; y: number }
export interface Dibujo { pintura: Uint8Array; stickers: Estampa[] }

export const nuevoDibujo = (): Dibujo => ({ pintura: new Uint8Array(COLS * FILAS), stickers: [] });
export const copiar = (d: Dibujo): Dibujo => ({ pintura: d.pintura.slice(), stickers: d.stickers.slice() });
const dentro = (x: number, y: number) => x >= 0 && y >= 0 && x < COLS && y < FILAS;

// Stencil puesto sobre el muro: plantilla, capa (1 base, 2 detalle), esquina superior izquierda y celdas del muro
// por celda de la plantilla. La placa de cartón tiene un margen alrededor de la figura.
export interface Puesta { id: string; capa: 1 | 2; x: number; y: number; escala: number }
export const MARGEN_PLACA = 2;
// Máscara por celda del muro: TAPADO (cartón), BORDE (junto a un hueco: llega un poco de pintura), HUECO, LIBRE (fuera de la placa).
export const TAPADO = 0, BORDE = 1, HUECO = 2, LIBRE = 3;
export type Mascara = Uint8Array | null;

export const plantilla = (id: string) => PLANTILLAS.find(p => p.id === id)!;
export function placa(p: Puesta) {
  const t = plantilla(p.id), m = MARGEN_PLACA * p.escala;
  return { x: p.x - m, y: p.y - m, w: t.filas[0].length * p.escala + 2 * m, h: t.filas.length * p.escala + 2 * m };
}

export function mascaraDe(p: Puesta | null): Mascara {
  if (!p) return null;
  const t = plantilla(p.id), bit = p.capa === 1 ? 1 : 2, pl = placa(p);
  const m = new Uint8Array(COLS * FILAS).fill(LIBRE);
  const hueco = (x: number, y: number) => {
    const sx = Math.floor((x + 0.5 - p.x) / p.escala), sy = Math.floor((y + 0.5 - p.y) / p.escala);
    const fila = t.filas[sy];
    return !!fila && sx >= 0 && sx < fila.length && (Number(fila[sx]) & bit) > 0;
  };
  for (let y = 0; y < FILAS; y++) for (let x = 0; x < COLS; x++) {
    if (x + 0.5 < pl.x || y + 0.5 < pl.y || x + 0.5 > pl.x + pl.w || y + 0.5 > pl.y + pl.h) continue;
    m[y * COLS + x] = hueco(x, y) ? HUECO : TAPADO;
  }
  // El borde pulverizado: la pintura se cuela apenas por debajo del cartón junto a cada hueco.
  for (let y = 0; y < FILAS; y++) for (let x = 0; x < COLS; x++) {
    const i = y * COLS + x;
    if (m[i] !== TAPADO) continue;
    if ((x > 0 && m[i - 1] === HUECO) || (x < COLS - 1 && m[i + 1] === HUECO) || (y > 0 && m[i - COLS] === HUECO) || (y < FILAS - 1 && m[i + COLS] === HUECO)) m[i] = BORDE;
  }
  return m;
}

// Probabilidad de que la pintura llegue a la celda según la plantilla.
const paso = (mascara: Mascara, i: number) => !mascara ? 1 : mascara[i] === HUECO || mascara[i] === LIBRE ? 1 : mascara[i] === BORDE ? 0.12 : 0;

// Spray: pinta las celdas dentro del radio con probabilidad mayor al centro (trazo con borde irregular).
export function rociar(d: Dibujo, cx: number, cy: number, radio: number, color: number, mascara: Mascara) {
  const r = radio + 0.5;
  for (let dy = -radio; dy <= radio; dy++) for (let dx = -radio; dx <= radio; dx++) {
    const x = cx + dx, y = cy + dy, dist = Math.hypot(dx, dy);
    if (!dentro(x, y) || dist > r) continue;
    const i = y * COLS + x;
    if (Math.random() > (0.9 - 0.4 * (dist / r)) * paso(mascara, i)) continue;
    d.pintura[i] = color;
  }
}

// Plumón: trazo parejo y nítido, sin pulverizado (el tag).
export function plumon(d: Dibujo, cx: number, cy: number, radio: number, color: number, mascara: Mascara) {
  const r = radio - 1;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = cx + dx, y = cy + dy;
    if (!dentro(x, y) || Math.hypot(dx, dy) > r + 0.5) continue;
    const i = y * COLS + x;
    if (!mascara || mascara[i] === HUECO || mascara[i] === LIBRE) d.pintura[i] = color;
  }
}

// Rodillo: una franja ancha perpendicular al avance (ux, uy es el eje del rodillo). La textura P12 deja vetas
// a lo largo del recorrido (s = distancia recorrida); una segunda pasada las va tapando.
export function rodillo(d: Dibujo, cx: number, cy: number, ux: number, uy: number, s: number, mitad: number, color: number, mascara: Mascara) {
  const fila = TEXTURA_RODILLO[((Math.round(s) % 24) + 24) % 24];
  for (let t = -mitad; t <= mitad; t += 0.5) {
    const x = Math.round(cx + ux * t), y = Math.round(cy + uy * t);
    if (!dentro(x, y)) continue;
    const i = y * COLS + x;
    const veta = fila[(Math.round(t) + mitad) % 24] === '0';
    if (Math.random() > (veta ? 0.18 : 0.97) * paso(mascara, i)) continue;
    d.pintura[i] = color;
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

// Nace un chorro bajo la pintura del spray, en una columna al azar del radio (cuando el spray lleva rato quieto).
export function nacerChorro(d: Dibujo, chorros: Chorro[], cx: number, cy: number, radio: number, color: number) {
  if (chorros.length >= MAX_CHORROS) return;
  const x = cx + Math.round((Math.random() * 2 - 1) * radio);
  if (x < 0 || x >= COLS) return;
  let y = Math.min(FILAS - 1, cy + radio);
  while (y > cy - radio && d.pintura[y * COLS + x] !== color) y--;
  if (d.pintura[y * COLS + x] !== color) return;
  chorros.push({ x, y: y + 1, color, resta: 5 + Math.floor(Math.random() * 12) });
}

// Avanza cada chorro una celda hacia abajo; devuelve los que siguen activos. Se detiene contra el cartón del stencil.
export function gotear(d: Dibujo, chorros: Chorro[], mascara: Mascara): Chorro[] {
  const siguen: Chorro[] = [];
  for (const c of chorros) {
    if (!dentro(c.x, c.y) || c.resta <= 0) continue;
    const i = c.y * COLS + c.x;
    if (mascara && (mascara[i] === TAPADO || mascara[i] === BORDE)) continue;
    d.pintura[i] = c.color;
    c.y++; c.resta--;
    if (c.resta > 0 && c.y < FILAS) siguen.push(c);
  }
  return siguen;
}
