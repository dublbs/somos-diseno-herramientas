// Tu mural (plan 009-juego-pixel, «Lo que te llevas»). Lo usan la pantalla final, la tarjeta, el QR y el inventario.
// Una pared hueso de 4 × 3 casillas: si venciste al Inacapín Pixel, primero el trofeo; después tus piezas y tus latas,
// cada una en un azulejo negro.
import { HUESO, type Pieza } from './comun';
import { LATA, LATA_PROPORCION, PIEZAS, TROFEO, sprite } from './sprites';

export const COLS_MURAL = 4, FILAS_MURAL = 3;
export interface Mural { piezas: Pieza[]; latas: string[]; trofeo?: boolean }

function ladrillo(x: CanvasRenderingContext2D, px: number, py: number, ancho: number, alto: number, b: number) {
  x.fillStyle = HUESO; x.fillRect(px, py, ancho, alto);
  x.fillStyle = '#E2D9C9';
  const lad = ancho / 16;
  for (let j = 0; j * lad / 2 < alto; j++) {
    x.fillRect(px, py + j * lad / 2, ancho, Math.max(1, b / 2));
    for (let i = (j % 2) * lad / 2; i < ancho; i += lad) x.fillRect(px + i, py + j * lad / 2, Math.max(1, b / 2), lad / 2);
  }
}

export function dibujarMural(x: CanvasRenderingContext2D, px: number, py: number, ancho: number, m: Mural) {
  const alto = ancho * FILAS_MURAL / COLS_MURAL, b = Math.max(2, Math.round(ancho / 90));
  x.imageSmoothingEnabled = false;
  ladrillo(x, px, py, ancho, alto, b);
  {
    const c = ancho / COLS_MURAL;
    const lista: { color: string; forma: Pieza['forma'] | 'trofeo' | null }[] = [...(m.trofeo ? [{ color: '#FFC20E', forma: 'trofeo' as const }] : []), ...m.piezas, ...m.latas.map(color => ({ color, forma: null }))].slice(0, COLS_MURAL * FILAS_MURAL);
    lista.forEach((p, i) => {
      const cx = px + (i % COLS_MURAL) * c, cy = py + Math.floor(i / COLS_MURAL) * c, mm = c * 0.14, t = c * 0.06;
      x.fillStyle = '#000'; x.fillRect(cx + t * 1.5, cy + t * 1.5, c - t * 3, c - t * 3);
      x.fillStyle = '#1E1C19'; x.fillRect(cx + t * 2.5, cy + t * 2.5, c - t * 5, c - t * 5);
      if (p.forma === 'trofeo') { x.fillStyle = '#2B4BD8'; x.fillRect(cx + t * 2.5, cy + t * 2.5, c - t * 5, c - t * 5); sprite(x, TROFEO, cx + mm, cy + mm, c - 2 * mm, c - 2 * mm); }
      else if (p.forma) sprite(x, PIEZAS[p.forma], cx + mm, cy + mm, c - 2 * mm, c - 2 * mm, p.color);
      else { const h = c - 2.4 * mm, w = h * LATA_PROPORCION; sprite(x, LATA, cx + (c - w) / 2, cy + 1.2 * mm, w, h, p.color); }
    });
  }
  x.strokeStyle = '#000'; x.lineWidth = b * 2; x.strokeRect(px + b, py + b, ancho - 2 * b, alto - 2 * b);
}

// Miniatura cuadrada (160 px) para el inventario de la credencial.
export function miniaturaMural(m: Mural): string {
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const x = c.getContext('2d')!;
  x.fillStyle = '#000'; x.fillRect(0, 0, 160, 160);
  dibujarMural(x, 0, 20, 160, m);
  return c.toDataURL('image/png');
}
