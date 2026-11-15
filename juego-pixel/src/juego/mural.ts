// Tu mural (plan 009-juego-pixel, «Lo que te llevas»). Lo usan la pantalla final, la tarjeta, el QR y el inventario.
// · Si llegaste a la pared (nivel 3): la pared pintada con lo que borraste, y encima las piezas que quedaron.
// · Si no: una pared hueso de 4 × 3 casillas con tus piezas y después tus latas, cada una en un azulejo negro.
import { HUESO, type Pieza } from './comun';
import { COLS, FILAS, esColor, type Celda } from './pared';
import { GRIS, LATA, PIEZAS, sprite } from './sprites';

export const COLS_MURAL = 4, FILAS_MURAL = 3;
export interface Mural { piezas: Pieza[]; latas: string[]; pared?: { pintura: (string | null)[][]; encima: Celda[][] } }

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
  if (m.pared) {
    // La pared del nivel 3, centrada: cada celda pintada es un cuadrado de color; encima, las piezas que quedaron.
    const c = (alto - 4 * b) / FILAS, ox = px + (ancho - COLS * c) / 2, oy = py + 2 * b;
    x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(ox, oy, COLS * c, FILAS * c);
    for (let j = 0; j < FILAS; j++) for (let i = 0; i < COLS; i++) {
      const pin = m.pared.pintura[j][i];
      if (pin) { x.fillStyle = pin; x.fillRect(ox + i * c, oy + j * c, Math.ceil(c), Math.ceil(c)); }
      const e = m.pared.encima[j][i];
      if (esColor(e)) sprite(x, PIEZAS[e.forma], ox + i * c + c * 0.08, oy + j * c + c * 0.08, c * 0.84, c * 0.84, e.color);
      else if (e) sprite(x, GRIS, ox + i * c + c * 0.08, oy + j * c + c * 0.08, c * 0.84, c * 0.84);
    }
  } else {
    const c = ancho / COLS_MURAL;
    const lista: { color: string; forma: Pieza['forma'] | null }[] = [...m.piezas, ...m.latas.map(color => ({ color, forma: null }))].slice(0, COLS_MURAL * FILAS_MURAL);
    lista.forEach((p, i) => {
      const cx = px + (i % COLS_MURAL) * c, cy = py + Math.floor(i / COLS_MURAL) * c, mm = c * 0.14, t = c * 0.06;
      x.fillStyle = '#000'; x.fillRect(cx + t * 1.5, cy + t * 1.5, c - t * 3, c - t * 3);
      x.fillStyle = '#1E1C19'; x.fillRect(cx + t * 2.5, cy + t * 2.5, c - t * 5, c - t * 5);
      if (p.forma) sprite(x, PIEZAS[p.forma], cx + mm, cy + mm, c - 2 * mm, c - 2 * mm, p.color);
      else sprite(x, LATA, cx + mm * 1.5, cy + mm * 1.5, c - 3 * mm, c - 3 * mm, p.color);
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
