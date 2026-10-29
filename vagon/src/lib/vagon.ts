import { AVANCE, GLIFOS, normalizar } from '../../../shared/pixelfont';

// Vagón: el lateral de un carro de metro como grilla de pixeles. La base sale del módulo de Figma
// (Pixel · FA08 · Metro, 240 × 240 en celdas de 10): rasterizado a 24 × 24 cada celda de Figma es un pixel.
// El carro mide dos módulos (48 × 24). Encima van los pixeles pintados, los stickers y el tag.

export const COLS = 48, FILAS = 24, LADO_MODULO = 24;

export const HEX = {
  Hueso: '#F4EEE3', Negro: '#000000', Azul: '#0062B8', Lapislázuli: '#2B4BD8', Celeste: '#7FC8F8',
  Amarillo: '#FFC20E', Verde: '#00A651', Rosa: '#FF8FB1', Morado: '#7A2E8E',
} as const;
export type NombreColor = keyof typeof HEX;
export const PALETA = Object.keys(HEX) as NombreColor[];

export const MODELOS = [
  { id: 'l1', nombre: 'Línea 1', detalle: 'Blanco con franja roja', lateral: './figma/metro/linea1-lateral.svg', frente: './figma/metro/linea1-frente.svg' },
  { id: 'l4', nombre: 'Línea 4', detalle: 'Damero celeste', lateral: './figma/metro/linea4-lateral.svg', frente: './figma/metro/linea4-frente.svg' },
] as const;
export type IdModelo = (typeof MODELOS)[number]['id'];

export const STICKERS = ['spray', 'rodillo', 'tarro-pintura', 'plumon', 'senal-rodillo', 'zapatilla', 'personaje', 'cruce-peatonal'] as const;
export type IdSticker = (typeof STICKERS)[number];
export const srcSticker = (id: IdSticker) => `./figma/stickers/${id}.svg`;

export interface Sticker { id: IdSticker; x: number; y: number; tam: number } // en celdas; x, y es el centro
export interface Diseno { pixeles: (string | null)[]; stickers: Sticker[] } // null: se ve la base del modelo
export const disenoVacio = (): Diseno => ({ pixeles: Array(COLS * FILAS).fill(null), stickers: [] });

export function cargar(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
}

// La base de un modelo: el módulo lateral repetido dos veces, leído pixel a pixel.
export async function baseDe(src: string): Promise<string[]> {
  const im = await cargar(src);
  const c = document.createElement('canvas'); c.width = LADO_MODULO; c.height = LADO_MODULO;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.imageSmoothingEnabled = false;
  x.drawImage(im, 0, 0, LADO_MODULO, LADO_MODULO);
  const d = x.getImageData(0, 0, LADO_MODULO, LADO_MODULO).data;
  const hex = (i: number) => '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  const out: string[] = [];
  for (let f = 0; f < FILAS; f++) for (let c2 = 0; c2 < COLS; c2++) out.push(hex((f * LADO_MODULO + (c2 % LADO_MODULO)) * 4));
  return out;
}

export const colorEn = (base: string[], d: Diseno, i: number) => d.pixeles[i] ?? base[i];

// ---------- herramientas ----------
export function pintar(d: Diseno, col: number, fila: number, color: string | null, tam: number): Diseno {
  const pixeles = d.pixeles.slice();
  const r0 = Math.floor((tam - 1) / 2);
  for (let f = fila - r0; f < fila - r0 + tam; f++) for (let c = col - r0; c < col - r0 + tam; c++)
    if (f >= 0 && f < FILAS && c >= 0 && c < COLS) pixeles[f * COLS + c] = color;
  return { ...d, pixeles };
}

// Balde: rellena la zona del mismo color (como el balde de pintura de cualquier editor de imágenes).
export function rellenar(base: string[], d: Diseno, col: number, fila: number, color: string): Diseno {
  const objetivo = colorEn(base, d, fila * COLS + col);
  if (objetivo === color) return d;
  const pixeles = d.pixeles.slice(), pila = [[col, fila]], visto = new Uint8Array(COLS * FILAS);
  while (pila.length) {
    const [c, f] = pila.pop()!;
    if (c < 0 || c >= COLS || f < 0 || f >= FILAS) continue;
    const i = f * COLS + c;
    if (visto[i] || (pixeles[i] ?? base[i]) !== objetivo) continue;
    visto[i] = 1; pixeles[i] = color;
    pila.push([c + 1, f], [c - 1, f], [c, f + 1], [c, f - 1]);
  }
  return { ...d, pixeles };
}

// Tag: el texto en la tipografía pixel de Somos Diseño (5 × 7), escrito desde la celda tocada.
export function escribir(d: Diseno, texto: string, col: number, fila: number, color: string): Diseno {
  const pixeles = d.pixeles.slice();
  let x = col;
  for (const ch of normalizar(texto)) {
    const g = GLIFOS[ch];
    if (g) for (let f = 0; f < 7; f++) for (let c = 0; c < 5; c++) {
      const cc = x + c, ff = fila + f;
      if (g[f][c] === '1' && cc >= 0 && cc < COLS && ff >= 0 && ff < FILAS) pixeles[ff * COLS + cc] = color;
    }
    x += AVANCE;
  }
  return { ...d, pixeles };
}
export const anchoTag = (texto: string) => Math.max(0, normalizar(texto).length * AVANCE - 1);

// ---------- dibujo ----------
// El carro con su diseño, en un rectángulo de COLS × FILAS celdas de `cel` pixeles.
export function dibujarCarro(ctx: CanvasRenderingContext2D, x0: number, y0: number, cel: number, base: string[], d: Diseno, stickers: Record<string, HTMLImageElement>, grilla = false) {
  for (let f = 0; f < FILAS; f++) for (let c = 0; c < COLS; c++) {
    ctx.fillStyle = colorEn(base, d, f * COLS + c);
    ctx.fillRect(Math.floor(x0 + c * cel), Math.floor(y0 + f * cel), Math.ceil(cel), Math.ceil(cel));
  }
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.beginPath(); ctx.rect(x0, y0, COLS * cel, FILAS * cel); ctx.clip();
  for (const s of d.stickers) {
    const im = stickers[s.id]; if (!im) continue;
    ctx.drawImage(im, x0 + (s.x - s.tam / 2) * cel, y0 + (s.y - s.tam / 2) * cel, s.tam * cel, s.tam * cel);
  }
  ctx.restore();
  if (grilla && cel >= 6) {
    ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 1; c < COLS; c++) { const x = Math.round(x0 + c * cel) + 0.5; ctx.moveTo(x, y0); ctx.lineTo(x, y0 + FILAS * cel); }
    for (let f = 1; f < FILAS; f++) { const y = Math.round(y0 + f * cel) + 0.5; ctx.moveTo(x0, y); ctx.lineTo(x0 + COLS * cel, y); }
    ctx.stroke();
  }
}

// Un tren: el carro diseñado al medio y carros de base a los lados (cuantos pida la persona).
export function dibujarTren(ctx: CanvasRenderingContext2D, x0: number, y0: number, cel: number, carros: number, base: string[], d: Diseno, stickers: Record<string, HTMLImageElement>) {
  const vacio = disenoVacio(), junta = Math.max(2, cel * 0.8), ancho = COLS * cel;
  const medio = Math.floor((carros - 1) / 2);
  for (let k = 0; k < carros; k++) {
    const x = x0 + k * (ancho + junta);
    dibujarCarro(ctx, x, y0, cel, base, k === medio ? d : vacio, stickers);
    if (k < carros - 1) { ctx.fillStyle = HEX.Negro; ctx.fillRect(x + ancho, y0 + FILAS * cel * 0.3, junta, FILAS * cel * 0.5); }
  }
  return carros * ancho + (carros - 1) * junta;
}

// Fondo de andén: muro de azulejos, franja morada, borde amarillo y vía.
export function dibujarAnden(ctx: CanvasRenderingContext2D, W: number, H: number, via: number) {
  ctx.fillStyle = HEX.Hueso; ctx.fillRect(0, 0, W, H);
  const t = Math.max(12, Math.round(H / 22));
  ctx.strokeStyle = 'rgba(0,0,0,.07)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let y = 0; y < via; y += t) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
  for (let x = 0; x < W; x += t) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, via); }
  ctx.stroke();
  ctx.fillStyle = HEX.Morado; ctx.fillRect(0, H * 0.08, W, t * 1.2);
  ctx.fillStyle = HEX.Rosa; ctx.fillRect(0, H * 0.08 + t * 1.2, W, t * 0.25);
  ctx.fillStyle = HEX.Amarillo; ctx.fillRect(0, via - t * 0.45, W, t * 0.35);
  ctx.fillStyle = '#2A2A2A'; ctx.fillRect(0, via, W, H - via);
  ctx.fillStyle = '#6B6B6B'; for (let x = 0; x < W; x += t * 1.6) ctx.fillRect(x, via + t * 0.5, t * 0.8, t * 0.3);
  ctx.fillStyle = HEX.Hueso; ctx.fillRect(0, via + t * 0.2, W, Math.max(2, t * 0.15));
}

// El carro diseñado como PNG chico (10 pixeles por celda): lo lee el HUB para el vagón pintado que pasa por la estación.
export function pngDelCarro(base: string[], d: Diseno, stickers: Record<string, HTMLImageElement>): string {
  const c = document.createElement('canvas'); c.width = COLS * 10; c.height = FILAS * 10;
  dibujarCarro(c.getContext('2d')!, 0, 0, 10, base, d, stickers);
  return c.toDataURL('image/png');
}
