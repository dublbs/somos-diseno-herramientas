// Recursos del Teatro: cada SVG se baja, se rasteriza UNA vez a un bitmap recortado a su contenido y queda en caché.
// Al dibujar un cuadro solo se copian bitmaps (drawImage de un canvas), nunca se vuelve a decodificar ni a pasar el
// filtro de grano de un SVG. Se carga por escenario: primero el que se ve, después los demás en segundo plano.

export interface Raster {
  lienzo: HTMLCanvasElement;
  x: number; y: number; w: number; h: number; // en unidades del SVG (su viewBox), relativo a su esquina
}
interface Entrada { w: number; h: number; raster: Raster | null }

// Densidad del bitmap (pixeles por unidad del marco de 240). El escenario se dibuja a 1080 / 240 = 4,5 px por unidad;
// las piezas se rasterizan un poco más finas para que se vean nítidas al agrandarlas.
export const PPU_PIEZA = 6;
export const PPU_FONDO = 4.5;
const LADO_MAX = 2048;

const listos = new Map<string, Entrada>();
const enCurso = new Map<string, Promise<void>>();

// Tintes: reemplazo de colores en el texto del SVG (p. ej. el pez de otro color que el mar).
export type Tinte = Record<string, string>; // color original (mayúsculas) → nuevo
const tintes = new Map<string, Tinte>();
export const registrarTinte = (id: string, t: Tinte) => tintes.set(id, t);
const clave = (src: string, tinte?: string) => (tinte ? `${src}|${tinte}` : src);

export const dimension = (src: string) => listos.get(src) ?? null;
export function raster(src: string, tinte?: string): Raster | null {
  if (tinte) { const t = listos.get(clave(src, tinte)); if (t) return t.raster; }
  return listos.get(src)?.raster ?? null;
}
export const estaListo = (src: string, tinte?: string) => listos.has(clave(src, tinte));

const textos = new Map<string, Promise<string>>();
const bajar = (src: string) => {
  let p = textos.get(src);
  if (!p) { p = fetch(src).then(r => { if (!r.ok) throw new Error(`No se pudo bajar ${src}`); return r.text(); }); textos.set(src, p); }
  return p;
};

// Una sola rasterización a la vez: así la página sigue respondiendo y la barra de avance se mueve.
let cola: Promise<unknown> = Promise.resolve();
const enCola = <T,>(f: () => Promise<T>) => { const p = cola.then(f, f); cola = p.catch(() => undefined); return p; };
const respiro = () => new Promise<void>(r => setTimeout(r, 0));

async function rasterizar(texto: string, ppu: number, tinte?: Tinte): Promise<Entrada> {
  let svg = texto;
  if (tinte) for (const [de, a] of Object.entries(tinte)) svg = svg.split(de).join(a).split(de.toLowerCase()).join(a);
  const vb = svg.match(/viewBox="([^"]+)"/)?.[1].trim().split(/[\s,]+/).map(Number);
  let w = parseFloat(svg.match(/\bwidth="([\d.]+)"/)?.[1] ?? '240'), h = parseFloat(svg.match(/\bheight="([\d.]+)"/)?.[1] ?? '240');
  if (vb && vb.length === 4 && vb[2] > 0 && vb[3] > 0) { w = vb[2]; h = vb[3]; }
  else svg = svg.replace('<svg', `<svg viewBox="0 0 ${w} ${h}"`);
  const k = Math.min(ppu, LADO_MAX / Math.max(w, h));
  const W = Math.max(1, Math.round(w * k)), H = Math.max(1, Math.round(h * k));
  svg = svg.replace(/\bwidth="[^"]+"/, `width="${W}"`).replace(/\bheight="[^"]+"/, `height="${H}"`);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const im = new Image();
    im.src = url;
    await im.decode();
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(im, 0, 0, W, H);
    // Recorte al contenido (muchas capas ocupan el marco entero de 240 con una pata o un ala chica).
    const d = ctx.getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) {
      const fila = y * W * 4;
      for (let x = 0; x < W; x++) {
        if (d[fila + x * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; }
      }
    }
    if (x1 < 0) return { w, h, raster: null };
    x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1); x1 = Math.min(W - 1, x1 + 1); y1 = Math.min(H - 1, y1 + 1);
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
    let lienzo = c;
    if (cw < W || ch < H) {
      lienzo = document.createElement('canvas');
      lienzo.width = cw; lienzo.height = ch;
      lienzo.getContext('2d')!.drawImage(c, x0, y0, cw, ch, 0, 0, cw, ch);
      c.width = c.height = 0; // suelta la memoria del grande
    }
    return { w, h, raster: { lienzo, x: x0 / k, y: y0 / k, w: cw / k, h: ch / k } };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function cargar(src: string, ppu = PPU_PIEZA, tinte?: string): Promise<void> {
  const id = clave(src, tinte);
  if (listos.has(id)) return Promise.resolve();
  let p = enCurso.get(id);
  if (!p) {
    p = bajar(src)
      .then(texto => enCola(async () => { const e = await rasterizar(texto, ppu, tinte ? tintes.get(tinte) : undefined); await respiro(); return e; }))
      .then(e => { listos.set(id, e); })
      .finally(() => enCurso.delete(id));
    enCurso.set(id, p);
  }
  return p;
}

// Carga un lote y avisa el avance (hechas / total) a medida que termina cada archivo.
export async function cargarLote(lista: { src: string; ppu?: number; tinte?: string }[], alAvance?: (hechas: number, total: number) => void) {
  const unicos = [...new Map(lista.map(l => [clave(l.src, l.tinte), l])).values()];
  let hechas = 0;
  alAvance?.(0, unicos.length);
  await Promise.all(unicos.map(l => cargar(l.src, l.ppu, l.tinte).catch(e => console.warn(e)).then(() => alAvance?.(++hechas, unicos.length))));
}
