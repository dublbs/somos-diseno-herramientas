import { COLS, FILAS, MAX_CHORROS, PASO_CHORRO_MS } from '../data/config';
import { PLANTILLAS, TEXTURA_RODILLO } from '../data/stencils';

// largo: celdas en total; resta: las que faltan; t: tiempo acumulado para el próximo paso.
export interface Chorro { x: number; y: number; color: number; resta: number; largo: number; ancho: 1 | 2; t: number }
// Sticker pegado: centro en celdas del muro, escala (1 = su ancho base en STICKERS) y giro en grados (horario).
export interface Estampa { id: string; x: number; y: number; escala: number; giro: number }
export interface Dibujo { pintura: Uint8Array; stickers: Estampa[] }

export const nuevoDibujo = (): Dibujo => ({ pintura: new Uint8Array(COLS * FILAS), stickers: [] });
export const copiar = (d: Dibujo): Dibujo => ({ pintura: d.pintura.slice(), stickers: d.stickers.slice() });
const dentro = (x: number, y: number) => x >= 0 && y >= 0 && x < COLS && y < FILAS;

// Stencil puesto sobre el muro: plantilla, capa (1 base, 2 detalle), centro en celdas del muro, celdas del muro por
// celda de la plantilla (escala) y giro en grados (horario, como las manijas). La placa de cartón tiene un margen fijo
// alrededor de la figura, para que el spray no se pase por el borde.
export interface Puesta { id: string; capa: 1 | 2; x: number; y: number; escala: number; giro: number }
export const MARGEN_PLACA = 8;
// Máscara por celda del muro: TAPADO (cartón), BORDE (junto a un hueco: llega un poco de pintura), HUECO, LIBRE (fuera de la placa).
export const TAPADO = 0, BORDE = 1, HUECO = 2, LIBRE = 3;
export type Mascara = Uint8Array | null;

export const plantilla = (id: string) => PLANTILLAS.find(p => p.id === id)!;
export const medidas = (id: string) => { const t = plantilla(id); return { w: t.filas[0].length, h: t.filas.length }; };

export function mascaraDe(p: Puesta | null): Mascara {
  if (!p) return null;
  const t = plantilla(p.id), bit = p.capa === 1 ? 1 : 2, w = t.filas[0].length, h = t.filas.length;
  const a = (p.giro * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a), mg = MARGEN_PLACA / p.escala;
  const m = new Uint8Array(COLS * FILAS).fill(LIBRE);
  for (let y = 0; y < FILAS; y++) for (let x = 0; x < COLS; x++) {
    // La celda del muro, llevada a la plantilla: se deshace el giro y la escala alrededor del centro.
    const dx = x + 0.5 - p.x, dy = y + 0.5 - p.y;
    const lx = (dx * cos + dy * sin) / p.escala + w / 2, ly = (-dx * sin + dy * cos) / p.escala + h / 2;
    if (lx < -mg || ly < -mg || lx > w + mg || ly > h + mg) continue;
    const fila = t.filas[Math.floor(ly)], sx = Math.floor(lx);
    m[y * COLS + x] = fila && sx >= 0 && sx < w && (Number(fila[sx]) & bit) > 0 ? HUECO : TAPADO;
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

// Los tres pinceles (plan 009 §3, como los pinceles de Photoshop): cada uno deja una marca propia.
// · Spray: gotitas al azar con distribución gaussiana (denso al centro, difuso al borde) y algo de rocío suelto
//   más lejos. Se acumula: pasar varias veces tapa más. `carga` cuenta la pintura por celda: de ahí nacen los chorros.
// · Plumón: borde duro y parejo, cubre de una (el tag). La tinta se acumula al apoyar y al levantar (ver App).
// · Rodillo: franja ancha con vetas, perpendicular al avance, que se va quedando sin pintura a lo largo del trazo.
const gauss = (): [number, number] => {
  const u = Math.random() || 1e-6, v = Math.random();
  const r = Math.sqrt(-2 * Math.log(u));
  return [r * Math.cos(2 * Math.PI * v), r * Math.sin(2 * Math.PI * v)];
};

export function rociar(d: Dibujo, cx: number, cy: number, radio: number, color: number, mascara: Mascara, carga?: Float32Array) {
  const sigma = radio / 2, n = Math.round(radio * radio * 1.5) + 4;
  for (let k = 0; k < n; k++) {
    const [gx, gy] = gauss();
    const x = Math.round(cx + gx * sigma), y = Math.round(cy + gy * sigma);
    if (!dentro(x, y)) continue;
    const i = y * COLS + x;
    if (Math.random() > paso(mascara, i)) continue;
    d.pintura[i] = color;
    if (carga) carga[i] += 1;
  }
  // Rocío: unas pocas gotitas sueltas fuera del trazo, como el aerosol de verdad.
  for (let k = 0; k < Math.ceil(radio / 2); k++) {
    const [gx, gy] = gauss();
    const x = Math.round(cx + gx * radio * 1.1), y = Math.round(cy + gy * radio * 1.1);
    if (dentro(x, y) && Math.random() < 0.5 * paso(mascara, y * COLS + x)) d.pintura[y * COLS + x] = color;
  }
}

// Plumón: disco lleno de borde duro.
export function plumon(d: Dibujo, cx: number, cy: number, radio: number, color: number, mascara: Mascara) {
  const r = radio + 0.5, n = Math.ceil(r);
  for (let dy = -n; dy <= n; dy++) for (let dx = -n; dx <= n; dx++) {
    const x = Math.round(cx) + dx, y = Math.round(cy) + dy;
    if (!dentro(x, y) || Math.hypot(x - cx, y - cy) > r) continue;
    const i = y * COLS + x;
    if (!mascara || mascara[i] === HUECO || mascara[i] === LIBRE) d.pintura[i] = color;
  }
}

// Rodillo: una franja ancha perpendicular al avance (ux, uy es el eje del rodillo). La textura P12 deja vetas a lo
// largo del recorrido (s = distancia recorrida) y los extremos quedan irregulares. `tinta` (1 → 0,3) baja a medida
// que el rodillo avanza: se va quedando sin pintura y hay que levantarlo y volver a pasar.
export function rodillo(d: Dibujo, cx: number, cy: number, ux: number, uy: number, s: number, mitad: number, color: number, mascara: Mascara, tinta = 1) {
  const fila = TEXTURA_RODILLO[((Math.round(s) % 24) + 24) % 24];
  for (let t = -mitad; t <= mitad; t += 0.5) {
    const x = Math.round(cx + ux * t), y = Math.round(cy + uy * t);
    if (!dentro(x, y)) continue;
    const i = y * COLS + x;
    const veta = fila[(((Math.round(t) + mitad) % 24) + 24) % 24] === '0';
    const borde = Math.abs(t) > mitad - 1.5 ? 0.55 : 1;
    // Con poca tinta el rodillo «se seca»: la pintura queda en franjas y las vetas se marcan más.
    if (Math.random() > (veta ? 0.1 * tinta : 0.97 * Math.pow(tinta, 0.6)) * borde * paso(mascara, i)) continue;
    d.pintura[i] = color;
  }
}
export const tintaRodillo = (s: number) => Math.max(0.3, 1 - s / 260);

export function borrar(d: Dibujo, cx: number, cy: number, radio: number) {
  radio = Math.round(radio);
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

// Nace un chorro en la columna x: desde la celda más baja con pintura de ese color, cerca del spray.
export function nacerChorro(d: Dibujo, chorros: Chorro[], x: number, cy: number, radio: number, color: number, largo: [number, number], anchoDoble: number): boolean {
  if (chorros.length >= MAX_CHORROS || x < 0 || x >= COLS) return false;
  radio = Math.ceil(radio);
  let y = Math.min(FILAS - 1, cy + radio + 1);
  while (y >= Math.max(0, cy - radio) && d.pintura[y * COLS + x] !== color) y--;
  if (y < 0 || d.pintura[y * COLS + x] !== color || y >= FILAS - 1) return false;
  const n = largo[0] + Math.floor(Math.random() * (largo[1] - largo[0] + 1));
  const ancho = x < COLS - 1 && Math.random() < anchoDoble ? 2 : 1;
  chorros.push({ x, y: y + 1, color, resta: n, largo: n, ancho, t: 0 });
  return true;
}

// Avanza los chorros según el tiempo (dt en ms; Infinity los completa de una vez). Bajan rápido al empezar y frenan
// al final; al terminar dejan una gota más ancha. Se detienen contra el cartón del stencil.
export function gotear(d: Dibujo, chorros: Chorro[], mascara: Mascara, dt: number): { siguen: Chorro[]; cambio: boolean } {
  const siguen: Chorro[] = [];
  let cambio = false;
  const pinta = (x: number, y: number, color: number) => {
    if (!dentro(x, y)) return false;
    const i = y * COLS + x;
    if (mascara && (mascara[i] === TAPADO || mascara[i] === BORDE)) return false;
    d.pintura[i] = color; return true;
  };
  for (const c of chorros) {
    c.t += dt;
    let vivo = true;
    while (vivo) {
      const paso = PASO_CHORRO_MS[0] + (PASO_CHORRO_MS[1] - PASO_CHORRO_MS[0]) * (1 - c.resta / c.largo);
      if (c.t < paso) break;
      c.t -= paso;
      if (c.y >= FILAS || !pinta(c.x, c.y, c.color)) { vivo = false; break; }
      if (c.ancho === 2) pinta(c.x + 1, c.y, c.color);
      cambio = true;
      c.y++; c.resta--;
      if (c.resta <= 0 || c.y >= FILAS) {
        // la gota del final: una celda más a cada lado
        pinta(c.x - 1, c.y - 1, c.color); pinta(c.x + c.ancho, c.y - 1, c.color);
        for (let k = 0; k < c.ancho; k++) pinta(c.x + k, c.y, c.color);
        vivo = false;
      }
    }
    if (vivo) siguen.push(c);
  }
  return { siguen, cambio };
}
