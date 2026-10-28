import { Formato, Celda, forma, HEX, U } from '../data/formas';

export function construirSVG(formato: Formato, celdas: Record<string, Celda>): string {
  const t = formato.celda;
  const W = formato.cols * t;
  const H = formato.filas * t;
  const fondos = [`<rect width="${W}" height="${H}" fill="${HEX.Hueso}" data-color="Hueso"/>`];
  const figuras: string[] = [];

  for (const [clave, cel] of Object.entries(celdas)) {
    const [x, y] = clave.split(',').map(Number);
    if (x < 0 || y < 0 || x >= formato.cols || y >= formato.filas) continue;

    fondos.push(
      `<rect x="${x * t}" y="${y * t}" width="${t}" height="${t}" fill="${HEX[cel.c.f]}" data-color="${cel.c.f}"/>`
    );

    const fDef = forma(cel.f);
    if (!fDef.capas.length) continue;

    const tr = `translate(${x * t} ${y * t}) scale(${t / U}) translate(6 6) rotate(${cel.r * 90})${
      cel.e ? ' scale(-1 1)' : ''
    } translate(-6 -6)`;

    const paths = fDef.capas
      .map(
        ([d, r]) =>
          `<path d="${d}" fill="${HEX[cel.c[r]]}" fill-rule="evenodd" data-color="${cel.c[r]}"/>`
      )
      .join('');
    figuras.push(`<g transform="${tr}">${paths}</g>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n<g id="Fondo">\n${fondos.join(
    '\n'
  )}\n</g>\n<g id="Figura">\n${figuras.join('\n')}\n</g>\n</svg>\n`;
}

export async function guardarArchivo(nombre: string, blob: Blob): Promise<'guardado' | 'cancelado' | 'ocupado'> {
  try {
    const d = (window as unknown as { claude?: { use?: (t: string) => Promise<{ save: (o: { filename: string; data: Blob }) => Promise<void> }> } }).claude?.use
      ? await (window as unknown as { claude: { use: (t: string) => Promise<{ save: (o: { filename: string; data: Blob }) => Promise<void> }> } }).claude.use('downloads')
      : null;
    if (d) {
      await d.save({ filename: nombre, data: blob });
      return 'guardado';
    }
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === 'declined') return 'cancelado';
    if (err?.code === 'rate_limited') return 'ocupado';
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'guardado';
}
