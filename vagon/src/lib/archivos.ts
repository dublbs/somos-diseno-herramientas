// Tarjeta común: el trabajo en el cuadro de 1080 y la franja negra de 270 con el texto (como Fotomatón y Graffiti).
export async function tarjeta(pintar: (ctx: CanvasRenderingContext2D, lado: number) => void, titulo: [string, string]): Promise<Blob> {
  try { await document.fonts.load('800 66px "Bricolage Grotesque"'); await document.fonts.load('500 26px "DM Sans"'); } catch { /* respaldo */ }
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
  const x = c.getContext('2d')!;
  x.fillStyle = '#F4EEE3'; x.fillRect(0, 0, 1080, 1080);
  pintar(x, 1080);
  x.fillStyle = '#000'; x.fillRect(0, 1080, 1080, 270);
  x.fillStyle = '#F4EEE3'; x.font = '800 66px "Bricolage Grotesque", sans-serif';
  x.fillText(titulo[0], 56, 1172); x.fillText(titulo[1], 56, 1244);
  x.textAlign = 'right'; x.font = '500 26px "DM Sans", sans-serif'; x.fillStyle = '#BDB6AA';
  x.fillText('Somos Diseño · Semana del Diseño 2026', 1024, 1164);
  x.fillText('Lenguaje Pixel', 1024, 1204);
  x.fillStyle = '#F4EEE3'; x.font = '700 26px "DM Sans", sans-serif';
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
