// Tacos del Taller de Grabado: 16 piezas de la familia Orgánica (Figma y bocetos de Teatro de Papel).
// Cada taco se arma con las capas de la pieza en su marco de 240 (las mismas posiciones que usa Teatro de Papel en
// loops/src/escenario/piezas.ts) y se convierte en un «mapa de tinta»: lo oscuro y lo de color recibe tinta y lo
// claro (hueso, blanco) queda tallado, como en un taco de linóleo. Manifiesto:
// docs/plans/012-ui-herramientas/assets-grabado.manifest.md

const BASE = import.meta.env.BASE_URL + 'figma/';
type CapaTaco = [ruta: string, x: number, y: number];
// `corte`: desde qué luminosidad (0 a 1) la pieza queda tallada (sin tinta). Por defecto 0,9: solo lo hueso y blanco.
export interface DefTaco { id: string; nombre: string; capas: CapaTaco[]; corte?: number }

const una = (ruta: string, x = 0, y = 0): CapaTaco[] => [[ruta, x, y]];
const ave = (id: string): CapaTaco[] => ['ala-inferior', 'cuerpo', 'ala-superior'].map(c => [`organica-bocetos/${id}/${c}`, 0, 0]);

export const TACOS: DefTaco[] = [
  { id: 'helecho', nombre: 'Helecho', capas: una('organica/helecho/helecho') },
  { id: 'araucaria', nombre: 'Araucaria', capas: una('organica/araucaria/araucaria') },
  { id: 'quisco', nombre: 'Quisco', capas: una('organica/quisco/quisco') },
  { id: 'copihue', nombre: 'Copihue', capas: una('organica-bocetos/copihue/copihue') },
  { id: 'chanar', nombre: 'Chañar', capas: una('organica-bocetos/chanar/chanar') },
  { id: 'flor', nombre: 'Flor', capas: una('organica/flor/flor-propia') },
  { id: 'pinguino', nombre: 'Pingüino', capas: una('organica/pinguino/pinguino', 65.2, 30) },
  { id: 'pez', nombre: 'Pez', capas: [
    ['organica/pez/cola', 18.6, 81.5], ['organica/pez/aleta-dorsal', 95.2, 51.2], ['organica/pez/aleta-ventral', 107.5, 148.2],
    ['organica/pez/cuerpo', 51.5, 80.6], ['organica/pez/escamas1', 76.9, 97.5], ['organica/pez/escamas2', 76.8, 119],
    ['organica/pez/ojo', 162.6, 102.8], ['organica/pez/pupila', 167.6, 106.4]], corte: 0.62 },
  { id: 'pudu', nombre: 'Pudú', capas: ['cola', 'pata1', 'pata2', 'pata3', 'pata4', 'cuerpo', 'cabeza'].map(c => [`organica/pudu/${c}`, 0, 0] as CapaTaco) },
  { id: 'huemul', nombre: 'Huemul', capas: ['pata1', 'pata2', 'pata3', 'pata4', 'cuerpo'].map(c => [`organica-bocetos/huemul/${c}`, 0, 0] as CapaTaco) },
  { id: 'condor', nombre: 'Cóndor', capas: ave('condor') },
  { id: 'picaflor', nombre: 'Picaflor', capas: ave('picaflor') },
  { id: 'sol', nombre: 'Sol', capas: una('organica/sol/sol') },
  { id: 'luna', nombre: 'Luna', capas: una('organica-bocetos/luna/luna') },
  { id: 'cantaro', nombre: 'Cántaro', capas: una('organica/cantaro/cantaro', 37.8, 43.6) },
  { id: 'canasto', nombre: 'Canasto', capas: una('organica/canasto/canasto') },
];
export type IdTaco = string;
export const tacoPorId = (id: string) => TACOS.find(t => t.id === id) ?? TACOS[0];

const imagenes = new Map<string, Promise<HTMLImageElement>>();
function cargar(src: string): Promise<HTMLImageElement> {
  let p = imagenes.get(src);
  if (!p) {
    p = new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error(src)); im.src = src; });
    imagenes.set(src, p);
  }
  return p;
}

// T-011: el navegador rasteriza un SVG (y su filtro de grano) a su tamaño propio; si después se agranda en el canvas,
// se pixela. Por eso cada parte se vuelve a cargar con el ancho y alto del <svg> multiplicados por `k`: así se
// rasteriza ya al tamaño grande y luego solo se achica, que siempre se ve nítido.
const textos = new Map<string, Promise<string>>();
async function cargarGrande(src: string, k: number): Promise<HTMLImageElement> {
  let t = textos.get(src);
  if (!t) { t = fetch(src).then(r => { if (!r.ok) throw new Error(src); return r.text(); }); textos.set(src, t); }
  const svg = (await t).replace(/<svg\b[^>]*>/, tag => tag
    .replace(/\swidth="([\d.]+)"/, (_, w) => ` width="${(+w * k).toFixed(2)}"`)
    .replace(/\sheight="([\d.]+)"/, (_, h) => ` height="${(+h * k).toFixed(2)}"`));
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try { return await new Promise<HTMLImageElement>((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error(src)); im.src = url; }); }
  finally { URL.revokeObjectURL(url); }
}

export interface TacoListo {
  id: string;
  fuente: HTMLCanvasElement; // el mapa de tinta a alta resolución (lado mayor FUENTE px), recortado a lo visible
  caja: [number, number, number, number]; // lo visible, en el marco de 240
  proporcion: number; // ancho / alto de lo visible
  corte: number;
}

// Lado mayor del mapa de tinta de origen. La estampa más grande ocupa ~0,27 del papel: en 1366×768 con pantalla 2×
// son ~340 px, y en la tarjeta de 1080, ~300. 1024 deja holgura para achicar siempre, nunca agrandar.
const FUENTE = 1024;

type Parte = { im: HTMLImageElement; x: number; y: number };
// Lo visible de la pieza, medido a 2× (480): basta para recortar.
function medir(partes: Parte[]): [number, number, number, number] {
  const K = 2, c = document.createElement('canvas'); c.width = c.height = 240 * K;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  partes.forEach(p => x.drawImage(p.im, p.x * K, p.y * K, p.im.naturalWidth * K, p.im.naturalHeight * K));
  const d = x.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) if (d[(y * c.width + xx) * 4 + 3] > 24) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < x0) return [0, 0, 240, 240];
  return [x0 / K - 1, y0 / K - 1, (x1 - x0 + 1) / K + 2, (y1 - y0 + 1) / K + 2];
}

// Mapa de tinta (negro con alfa = cuánta tinta): lo claro se talla (no recibe tinta); lo de color, un poco menos
// cargado que lo negro (se ve la presión).
function entintar(x: CanvasRenderingContext2D, W: number, H: number, corte: number) {
  const img = x.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    if (!a) continue;
    const L = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    const tinta = Math.max(0, Math.min(1, (corte - L) / 0.07)) * (1 - 0.22 * L);
    d[i] = d[i + 1] = d[i + 2] = 0; d[i + 3] = Math.round(255 * a * tinta);
  }
  x.putImageData(img, 0, 0);
}

async function prepararTaco(t: DefTaco): Promise<TacoListo> {
  // 1) a tamaño propio, solo para medir lo visible
  const chicas = await Promise.all(t.capas.map(async ([ruta, x, y]) => ({ im: await cargar(`${BASE}${ruta}.svg`), x, y })));
  const caja = medir(chicas);
  const [bx, by, bw, bh] = caja, k = FUENTE / Math.max(bw, bh);
  // 2) cada parte rasterizada ya a la escala final del mapa de origen
  const grandes = await Promise.all(t.capas.map(async ([ruta, x, y]) => ({ im: await cargarGrande(`${BASE}${ruta}.svg`, k), x, y })));
  const W = Math.max(4, Math.round(bw * k)), H = Math.max(4, Math.round(bh * k));
  const fuente = document.createElement('canvas'); fuente.width = W; fuente.height = H;
  const x = fuente.getContext('2d', { willReadFrequently: true })!;
  grandes.forEach(p => x.drawImage(p.im, Math.round((p.x - bx) * k), Math.round((p.y - by) * k), p.im.naturalWidth, p.im.naturalHeight));
  const corte = t.corte ?? 0.9;
  entintar(x, W, H, corte);
  return { id: t.id, fuente, caja, proporcion: bw / bh, corte };
}

export async function cargarTacos(): Promise<Record<string, TacoListo>> {
  const lista = await Promise.all(TACOS.map(prepararTaco));
  return Object.fromEntries(lista.map(t => [t.id, t]));
}

// Tamaño del taco en px para un lado mayor dado.
export function medidas(t: TacoListo, ladoMayor: number): [number, number] {
  return t.proporcion >= 1 ? [ladoMayor, ladoMayor / t.proporcion] : [ladoMayor * t.proporcion, ladoMayor];
}

// Mapa de tinta del taco a w × h px: se achica desde la fuente de alta resolución (por pasos de a la mitad, para que
// el achicado sea suave y no pierda líneas finas). Se guarda por tamaño redondeado.
const mapas = new Map<string, HTMLCanvasElement>();
export function mapaTinta(t: TacoListo, w: number, h: number): HTMLCanvasElement {
  const W = Math.max(4, Math.round(w)), H = Math.max(4, Math.round(h));
  const k = `${t.id}|${W}|${H}`;
  let c = mapas.get(k);
  if (c) return c;
  let src: HTMLCanvasElement = t.fuente;
  while (src.width / 2 >= W * 1.5 && src.height / 2 >= H * 1.5) {
    const m = document.createElement('canvas'); m.width = Math.round(src.width / 2); m.height = Math.round(src.height / 2);
    const mx = m.getContext('2d')!; mx.imageSmoothingQuality = 'high'; mx.drawImage(src, 0, 0, m.width, m.height);
    src = m;
  }
  c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d')!;
  x.imageSmoothingQuality = 'high';
  x.drawImage(src, 0, 0, W, H);
  mapas.set(k, c);
  if (mapas.size > 80) mapas.delete(mapas.keys().next().value!);
  return c;
}

// El taco entintado (sin textura), para las miniaturas y la vista previa.
export function tacoEntintado(t: TacoListo, w: number, h: number, tinta: string): HTMLCanvasElement {
  const m = mapaTinta(t, w, h);
  const c = document.createElement('canvas'); c.width = m.width; c.height = m.height;
  const x = c.getContext('2d')!;
  x.drawImage(m, 0, 0);
  x.globalCompositeOperation = 'source-in'; x.fillStyle = tinta; x.fillRect(0, 0, c.width, c.height);
  return c;
}

// Miniatura cuadrada (data URL) para la grilla de tacos.
const minis = new Map<string, string>();
export function miniaturaTaco(t: TacoListo, tinta: string, lado = 144): string {
  const k = `${t.id}|${tinta}|${lado}`;
  let u = minis.get(k);
  if (!u) {
    const [w, h] = medidas(t, lado * 0.92);
    const e = tacoEntintado(t, w, h, tinta);
    const c = document.createElement('canvas'); c.width = c.height = lado;
    c.getContext('2d')!.drawImage(e, (lado - e.width) / 2, (lado - e.height) / 2);
    u = c.toDataURL();
    minis.set(k, u);
  }
  return u;
}
