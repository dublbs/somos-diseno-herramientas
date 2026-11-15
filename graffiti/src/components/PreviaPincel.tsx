import React, { useEffect, useRef } from 'react';
import { COLS, FILAS, TAMANOS, type Tamano } from '../data/config';
import { linea, nuevoDibujo, plumon, rociar, rodillo, tintaRodillo } from '../lib/pintura';

// Vista previa del pincel activo, como la lista de pinceles de Photoshop: un trazo de muestra hecho con el mismo
// pincel, tamaño y color, y tres rasgos que lo distinguen (plan 009 §3).
type Pincel = 'spray' | 'plumon' | 'rodillo';
const RASGOS: Record<Pincel, string[]> = {
  spray: ['Borde difuso', 'Se acumula', 'Gotea'],
  plumon: ['Borde duro', 'Cubre de una', 'Tinta en los extremos'],
  rodillo: ['Franja ancha', 'Con vetas', 'Se descarga'],
};
// La muestra se pinta en una franja de la pared (filas 10 a 70) y se recorta.
const X0 = 8, X1 = COLS - 8, Y0 = 6, Y1 = FILAS - 6;

export const PreviaPincel: React.FC<{ pincel: Pincel; tamano: Tamano; color: string }> = ({ pincel, tamano, color }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const d = nuevoDibujo(), t = TAMANOS[tamano];
    // Una curva en S de lado a lado.
    const punto = (k: number): [number, number] => [Math.round(X0 + 10 + (X1 - X0 - 20) * k), Math.round(FILAS / 2 + Math.sin(k * Math.PI * 2) * (FILAS * 0.22))];
    let [px, py] = punto(0), s = 0;
    for (let i = 1; i <= 60; i++) {
      const [x, y] = punto(i / 60);
      if (pincel === 'spray') linea(px, py, x, y, (a, b) => { if ((a + b) % 2 === 0) rociar(d, a, b, t.spray, 1, null); });
      else if (pincel === 'plumon') linea(px, py, x, y, (a, b) => plumon(d, a, b, t.plumon, 1, null));
      else {
        const dx = x - px, dy = y - py, n = Math.hypot(dx, dy) || 1;
        for (let k = 0; k <= n; k += 0.5) { s += 0.5; rodillo(d, Math.round(px + (dx * k) / n), Math.round(py + (dy * k) / n), -dy / n, dx / n, s, t.rodillo, 1, null, tintaRodillo(s * 2.2)); }
      }
      [px, py] = [x, y];
    }
    if (pincel === 'plumon') { plumon(d, ...punto(0), t.plumon + 1, 1, null); plumon(d, ...punto(1), t.plumon + 0.6, 1, null); }
    const w = X1 - X0, h = Y1 - Y0;
    c.width = w; c.height = h;
    const ctx = c.getContext('2d')!, img = ctx.createImageData(w, h);
    const [r, g, b] = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, pintado = d.pintura[(y + Y0) * COLS + (x + X0)];
      if (pintado) { img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255; }
    }
    ctx.putImageData(img, 0, 0);
  }, [pincel, tamano, color]);

  return (
    <figure className="previa-pincel">
      <canvas ref={ref} aria-hidden="true" />
      <figcaption>{RASGOS[pincel].map(r => <span key={r}>{r}</span>)}</figcaption>
    </figure>
  );
};
