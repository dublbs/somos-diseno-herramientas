// Imágenes de la escena: se cargan una vez y se rasterizan por tamaño (los SVG orgánicos traen filtros caros).
const cargadas = new Map<string, HTMLImageElement>();
const pendientes = new Set<string>();

export function precargar(srcs: string[]): Promise<void> {
  return Promise.all(srcs.map(src => new Promise<void>(ok => {
    if (cargadas.has(src)) return ok();
    const im = new Image();
    im.onload = () => { cargadas.set(src, im); ok(); };
    im.onerror = () => ok();
    im.src = src;
  }))).then(() => undefined);
}

export function imagen(src: string): HTMLImageElement | null {
  const im = cargadas.get(src);
  if (!im && !pendientes.has(src)) { pendientes.add(src); precargar([src]); }
  return im || null;
}

const rasters = new Map<string, HTMLCanvasElement>();
export function raster(im: HTMLImageElement, ancho: number, alto: number): HTMLCanvasElement {
  const w = Math.max(1, Math.round(ancho)), h = Math.max(1, Math.round(alto));
  const k = `${im.src}|${w}x${h}`;
  let c = rasters.get(k);
  if (!c) {
    c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d')!.drawImage(im, 0, 0, w, h);
    rasters.set(k, c);
    if (rasters.size > 600) rasters.delete(rasters.keys().next().value!);
  }
  return c;
}
