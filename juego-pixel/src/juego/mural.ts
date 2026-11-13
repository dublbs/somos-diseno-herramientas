// Tu mural (plan 009-juego-pixel, «Lo que te llevas»): una pared hueso de 4 × 3 casillas con las piezas que juntaste,
// en el orden en que las juntaste, y después tus latas. Cada una va en un azulejo negro (así se ve también la pieza hueso). Lo usan la pantalla final, la tarjeta y el inventario.
import { HUESO, type Pieza } from './comun';
import { LATA, PIEZAS, sprite } from './sprites';

export const COLS_MURAL = 4, FILAS_MURAL = 3;

export function dibujarMural(x: CanvasRenderingContext2D, px: number, py: number, ancho: number, piezas: Pieza[], latas: string[]) {
  const alto = ancho * FILAS_MURAL / COLS_MURAL, c = ancho / COLS_MURAL, b = Math.max(2, Math.round(ancho / 90));
  x.imageSmoothingEnabled = false;
  // Pared: ladrillo hueso con juntas suaves, borde negro.
  x.fillStyle = HUESO; x.fillRect(px, py, ancho, alto);
  x.fillStyle = '#E2D9C9';
  const lad = c / 4;
  for (let j = 0; j * lad / 2 < alto; j++) {
    x.fillRect(px, py + j * lad / 2, ancho, Math.max(1, b / 2));
    for (let i = (j % 2) * lad / 2; i < ancho; i += lad) x.fillRect(px + i, py + j * lad / 2, Math.max(1, b / 2), lad / 2);
  }
  const lista: { color: string; forma: Pieza['forma'] | null }[] = [...piezas, ...latas.map(color => ({ color, forma: null }))].slice(0, COLS_MURAL * FILAS_MURAL);
  lista.forEach((p, i) => {
    const cx = px + (i % COLS_MURAL) * c, cy = py + Math.floor(i / COLS_MURAL) * c, m = c * 0.14, t = c * 0.06;
    x.fillStyle = '#000'; x.fillRect(cx + t * 1.5, cy + t * 1.5, c - t * 3, c - t * 3);
    x.fillStyle = '#1E1C19'; x.fillRect(cx + t * 2.5, cy + t * 2.5, c - t * 5, c - t * 5);
    if (p.forma) sprite(x, PIEZAS[p.forma], cx + m, cy + m, c - 2 * m, c - 2 * m, p.color);
    else sprite(x, LATA, cx + m * 1.5, cy + m * 1.5, c - 3 * m, c - 3 * m, p.color);
  });
  x.strokeStyle = '#000'; x.lineWidth = b * 2; x.strokeRect(px + b, py + b, ancho - 2 * b, alto - 2 * b);
}

// Miniatura cuadrada (160 px) para el inventario de la credencial.
export function miniaturaMural(piezas: Pieza[], latas: string[]): string {
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const x = c.getContext('2d')!;
  x.fillStyle = '#000'; x.fillRect(0, 0, 160, 160);
  dibujarMural(x, 0, 20, 160, piezas, latas);
  return c.toDataURL('image/png');
}
