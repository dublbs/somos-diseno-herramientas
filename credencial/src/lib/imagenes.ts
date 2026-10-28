import { useEffect, useState } from 'react';

// Carga de los SVG de Figma (y de la foto) como Image, con caché. Además guarda una versión
// rasterizada por tamaño: los stickers orgánicos traen filtros de textura caros de redibujar a 12 fps.
const cargadas = new Map<string, Promise<HTMLImageElement>>();
export function cargar(src: string): Promise<HTMLImageElement> {
  let p = cargadas.get(src);
  if (!p) {
    p = new Promise((ok, no) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => ok(im);
      im.onerror = () => no(new Error('No se pudo cargar ' + src.slice(0, 40)));
      im.src = src;
    });
    cargadas.set(src, p);
  }
  return p;
}

const rasters = new Map<string, HTMLCanvasElement>();
export function raster(im: HTMLImageElement, ancho: number, alto: number): HTMLCanvasElement {
  const w = Math.max(1, Math.round(ancho)), h = Math.max(1, Math.round(alto));
  const clave = im.src.length > 200 ? im.src.slice(0, 100) + im.src.length : im.src;
  const k = `${clave}|${w}x${h}`;
  let c = rasters.get(k);
  if (!c) {
    c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d')!.drawImage(im, 0, 0, w, h);
    rasters.set(k, c);
  }
  return c;
}

// Devuelve las imágenes ya cargadas (null mientras cargan) en el mismo orden que srcs.
export function useImagenes(srcs: (string | null | undefined)[]): (HTMLImageElement | null)[] {
  const clave = srcs.join('|');
  const [listas, setListas] = useState<Record<string, HTMLImageElement>>({});
  useEffect(() => {
    let vivo = true;
    srcs.forEach(src => {
      if (!src) return;
      cargar(src).then(im => { if (vivo) setListas(l => (l[src] === im ? l : { ...l, [src]: im })); }).catch(() => { /* sin imagen */ });
    });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  return srcs.map(s => (s ? listas[s] || null : null));
}
