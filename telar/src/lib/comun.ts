// Lo común de los talleres Orgánicos (Telar y Grabado): figuras de Teatro de Papel, paleta,
// carga de imágenes, tarjeta 1080 × 1350 con la franja negra y descarga.

export const HEX = {
  Hueso: '#F4EEE3', Negro: '#000000', Azul: '#0062B8', Lapislázuli: '#2B4BD8', Celeste: '#7FC8F8',
  Amarillo: '#FFC20E', Verde: '#00A651', Rosa: '#FF8FB1', Morado: '#7A2E8E',
} as const;
export type NombreColor = keyof typeof HEX;
export const COLORES: NombreColor[] = ['Hueso', 'Negro', 'Azul', 'Lapislázuli', 'Celeste', 'Amarillo', 'Verde', 'Rosa', 'Morado'];

// Figuras de la familia Orgánica (Figma, página Visual · Orgánica), las mismas de Teatro de Papel.
export const FIGURAS = [
  { id: 'pinguino', nombre: 'Pingüino', src: './figma/organica/pinguino.svg' },
  { id: 'araucaria', nombre: 'Araucaria', src: './figma/organica/araucaria.svg' },
  { id: 'helecho', nombre: 'Helecho', src: './figma/organica/helecho.svg' },
  { id: 'sol', nombre: 'Sol', src: './figma/organica/sol.svg' },
  { id: 'flor', nombre: 'Flor', src: './figma/organica/flor-propia.svg' },
  { id: 'quisco', nombre: 'Quisco', src: './figma/organica/quisco.svg' },
  { id: 'cantaro', nombre: 'Cántaro', src: './figma/organica/cantaro.svg' },
  { id: 'canasto', nombre: 'Canasto', src: './figma/organica/canasto.svg' },
] as const;
export type IdFigura = (typeof FIGURAS)[number]['id'];

const cargadas = new Map<string, Promise<HTMLImageElement>>();
export function cargar(src: string): Promise<HTMLImageElement> {
  let p = cargadas.get(src);
  if (!p) {
    p = new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error(src)); im.src = src; });
    cargadas.set(src, p);
  }
  return p;
}
export const cargarFiguras = () => Promise.all(FIGURAS.map(f => cargar(f.src).then(im => [f.id, im] as const))).then(l => Object.fromEntries(l) as Record<IdFigura, HTMLImageElement>);

// Caja de lo que de verdad ocupa la figura: los SVG de Teatro traen un marco de 240 con aire alrededor.
const cajas = new Map<HTMLImageElement, [number, number, number, number]>();
function cajaVisible(im: HTMLImageElement): [number, number, number, number] {
  let b = cajas.get(im);
  if (!b) {
    const iw = im.naturalWidth || 1, ih = im.naturalHeight || 1, k = Math.min(1, 400 / Math.max(iw, ih));
    const c = document.createElement('canvas'); c.width = Math.round(iw * k); c.height = Math.round(ih * k);
    const x = c.getContext('2d')!; x.drawImage(im, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) if (d[(y * c.width + xx) * 4 + 3] > 20) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    b = x1 >= x0 ? [x0 / k, y0 / k, (x1 - x0 + 1) / k, (y1 - y0 + 1) / k] : [0, 0, iw, ih];
    cajas.set(im, b);
  }
  return b;
}

// La figura recortada a lo que ocupa y centrada (contain) en un lienzo de w × h, con margen.
export function figuraEn(im: HTMLImageElement, w: number, h: number, margen = 0.06): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d')!;
  const [bx, by, bw, bh] = cajaVisible(im), k = Math.min((w * (1 - 2 * margen)) / bw, (h * (1 - 2 * margen)) / bh);
  x.drawImage(im, bx, by, bw, bh, (w - bw * k) / 2, (h - bh * k) / 2, bw * k, bh * k);
  return c;
}

export function azar(semilla: number) {
  let s = semilla >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Tarjeta común: el trabajo en el cuadro de 1080 y la franja negra de 270 con el texto (como Fotomatón y Graffiti).
export async function tarjeta(pintar: (ctx: CanvasRenderingContext2D, lado: number) => void, titulo: [string, string]): Promise<Blob> {
  try { await document.fonts.load('800 66px "Bricolage Grotesque"'); await document.fonts.load('500 26px "DM Sans"'); } catch { /* respaldo */ }
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
  const x = c.getContext('2d')!;
  x.fillStyle = HEX.Hueso; x.fillRect(0, 0, 1080, 1080);
  pintar(x, 1080);
  x.fillStyle = '#000'; x.fillRect(0, 1080, 1080, 270);
  x.fillStyle = HEX.Hueso; x.font = '800 66px "Bricolage Grotesque", sans-serif';
  x.fillText(titulo[0], 56, 1172); x.fillText(titulo[1], 56, 1244);
  x.textAlign = 'right'; x.font = '500 26px "DM Sans", sans-serif'; x.fillStyle = '#BDB6AA';
  x.fillText('Somos Diseño · Semana del Diseño 2026', 1024, 1164);
  x.fillText('Lenguaje Orgánica', 1024, 1204);
  x.fillStyle = HEX.Hueso; x.font = '700 26px "DM Sans", sans-serif';
  x.fillText('INACAP Santiago Centro', 1024, 1244);
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('sin imagen'))), 'image/png'));
}

export function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
