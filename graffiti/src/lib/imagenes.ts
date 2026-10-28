// Carga y guarda en memoria las imágenes de muros y stickers.
const cache = new Map<string, HTMLImageElement>();

export function imagen(src: string): HTMLImageElement {
  let im = cache.get(src);
  if (!im) { im = new Image(); im.decoding = 'async'; im.src = src; cache.set(src, im); }
  return im;
}

export const lista = (im: HTMLImageElement) => im.complete && im.naturalWidth > 0;

export const cargar = (srcs: string[]) =>
  Promise.all(srcs.map(src => {
    const im = imagen(src);
    return lista(im) ? Promise.resolve() : new Promise<void>(res => { im.addEventListener('load', () => res(), { once: true }); im.addEventListener('error', () => res(), { once: true }); });
  }));
