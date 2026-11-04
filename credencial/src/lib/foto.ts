// Selfie del Fotomatón sin efectos: se achica a 720 px por lado y se guarda como JPEG.
const MAX = 720;

export function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, no) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => no(new Error('No pudimos leer la foto.'));
    im.src = src;
  });
}

// Miniatura de la cara para el avatar del HUB: recorte cuadrado del centro alto de la selfie, 96 px.
export function caraDe(im: HTMLImageElement): string {
  const w = im.naturalWidth, h = im.naturalHeight, lado = Math.min(w, h) * 0.7;
  const c = document.createElement('canvas'); c.width = c.height = 96;
  c.getContext('2d')!.drawImage(im, (w - lado) / 2, Math.max(0, h * 0.42 - lado / 2), lado, lado, 0, 0, 96, 96);
  return c.toDataURL('image/jpeg', 0.8);
}

export async function leerFoto(archivo: File): Promise<string> {
  const url = URL.createObjectURL(archivo);
  try {
    const im = await cargarImagen(url);
    const k = Math.min(1, MAX / Math.max(im.naturalWidth, im.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
