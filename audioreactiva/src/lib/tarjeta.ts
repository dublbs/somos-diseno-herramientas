// Lo que se lleva la persona (T-010): la escena llena todo el lienzo, pero a la tarjeta va solo el cuadro del centro
// (el lado corto × el lado corto), en el cuadro de 1080 de la tarjeta común de 1080 × 1350 con la franja negra
// (como la Cabina, Graffiti y Grabado). La foto y el loop usan la misma tarjeta.
export const TARJETA = { ancho: 1080, alto: 1350, arte: 1080 };

/** El cuadro central del lienzo, en píxeles del lienzo. */
export function recorteCentral(W: number, H: number) {
  const lado = Math.min(W, H);
  return { x: Math.round((W - lado) / 2), y: Math.round((H - lado) / 2), lado };
}

export async function cargarFuentes() {
  try { await document.fonts.load('800 66px "Bricolage Grotesque"'); await document.fonts.load('500 26px "DM Sans"'); await document.fonts.load('700 26px "DM Sans"'); } catch { /* respaldo */ }
}

/** Una tarjeta vacía (con la franja ya pintada) para ir copiando la escena encima. */
export function crearTarjeta(): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = TARJETA.ancho; c.height = TARJETA.alto;
  const x = c.getContext('2d')!;
  x.fillStyle = '#000'; x.fillRect(0, 0, TARJETA.ancho, TARJETA.alto);
  x.fillStyle = '#F4EEE3'; x.font = '800 66px "Bricolage Grotesque", sans-serif';
  x.fillText('Estación', 56, 1172); x.fillText('Audioreactiva', 56, 1244);
  x.textAlign = 'right'; x.font = '500 26px "DM Sans", sans-serif'; x.fillStyle = '#BDB6AA';
  x.fillText('Somos Diseño · Semana del Diseño 2026', 1024, 1164);
  x.fillText('Lenguaje Geométrica', 1024, 1204);
  x.fillStyle = '#F4EEE3'; x.font = '700 26px "DM Sans", sans-serif';
  x.fillText('INACAP Santiago Centro', 1024, 1244);
  return c;
}

/** Copia el cuadro central del lienzo en el cuadro de arte de la tarjeta. */
export function copiarCentro(tarjeta: HTMLCanvasElement, lienzo: HTMLCanvasElement) {
  const { x, y, lado } = recorteCentral(lienzo.width, lienzo.height);
  const t = tarjeta.getContext('2d')!;
  t.imageSmoothingEnabled = true; t.imageSmoothingQuality = 'high';
  t.drawImage(lienzo, x, y, lado, lado, 0, 0, TARJETA.arte, TARJETA.arte);
}

export async function fotoTarjeta(lienzo: HTMLCanvasElement): Promise<Blob> {
  // el cuadro se toma en el instante del toque, antes de esperar las fuentes
  const cuadro = document.createElement('canvas'); cuadro.width = lienzo.width; cuadro.height = lienzo.height;
  cuadro.getContext('2d')!.drawImage(lienzo, 0, 0);
  await cargarFuentes();
  const c = crearTarjeta();
  copiarCentro(c, cuadro);
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('No se pudo sacar la foto.'))), 'image/png'));
}
