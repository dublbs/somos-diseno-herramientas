// Dibuja el nivel 3 (La pared): la pared pintada, las piezas, el par que cae, el siguiente y el tiempo que queda.
import { HUESO } from './comun';
import { COLS, DURACION, FILAS, esColor, posB, type Pared } from './pared';
import { GRIS, PIEZAS, sprite } from './sprites';

export function dibujarPared(ctx: CanvasRenderingContext2D, ancho: number, alto: number, e: Pared, ahora: number) {
  const ANCHO_T = COLS + 3.4, ALTO_T = FILAS + 1.2; // tablero + columna del «siguiente» + barra de tiempo
  const c = Math.floor(Math.min(ancho / ANCHO_T, alto / ALTO_T));
  const x0 = Math.round((ancho - ANCHO_T * c) / 2), y0 = Math.round((alto - ALTO_T * c) / 2 + c * 1.2);
  const X = (x: number) => x0 + x * c, Y = (y: number) => y0 + y * c;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1E1C19'; ctx.fillRect(0, 0, ancho, alto);

  // Tiempo que queda (el último metro).
  const resto = Math.max(0, 1 - e.tiempo / DURACION);
  ctx.fillStyle = '#000'; ctx.fillRect(X(0), Y(-1), COLS * c, c * 0.55);
  ctx.fillStyle = resto < 0.2 && Math.floor(ahora / 200) % 2 ? '#FF8FB1' : '#FFC20E'; ctx.fillRect(X(0) + 3, Y(-1) + 3, (COLS * c - 6) * resto, c * 0.55 - 6);
  ctx.font = `700 ${Math.round(c * 0.36)}px "Silkscreen", monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = HUESO; ctx.fillText(`${Math.ceil(resto * DURACION / 1000)} s`, X(COLS) + c * 0.3, Y(-1) + c * 0.28);

  // La pared: ladrillo hueso, y lo ya pintado.
  ctx.fillStyle = HUESO; ctx.fillRect(X(0), Y(0), COLS * c, FILAS * c);
  ctx.fillStyle = '#E2D9C9';
  for (let j = 0; j < FILAS * 2; j++) {
    ctx.fillRect(X(0), Y(0) + j * c / 2, COLS * c, 1);
    for (let i = (j % 2) * 0.5; i < COLS; i += 1) ctx.fillRect(X(i), Y(0) + j * c / 2, 1, c / 2);
  }
  for (let j = 0; j < FILAS; j++) for (let i = 0; i < COLS; i++) {
    const pin = e.mural[j][i];
    if (pin) { ctx.globalAlpha = 0.55; ctx.fillStyle = pin; ctx.fillRect(X(i), Y(j), c, c); ctx.globalAlpha = 1; }
  }

  // Piezas apoyadas (parpadean las que se están borrando).
  const borrando = new Set(e.limpiando?.celdas.map(([x, y]) => x + ',' + y));
  for (let j = 0; j < FILAS; j++) for (let i = 0; i < COLS; i++) {
    const k = e.celdas[j][i];
    if (!k) continue;
    if (borrando.has(i + ',' + j) && Math.floor(ahora / 70) % 2) continue;
    if (esColor(k)) sprite(ctx, PIEZAS[k.forma], X(i) + c * 0.06, Y(j) + c * 0.06, c * 0.88, c * 0.88, k.color);
    else sprite(ctx, GRIS, X(i) + c * 0.06, Y(j) + c * 0.06, c * 0.88, c * 0.88);
  }

  // El par que cae.
  if (e.actual) {
    const p = e.actual, [bx, by] = posB(p);
    for (const [x, y, k] of [[p.x, p.y, p.a], [bx, by, p.b]] as const) {
      if (y < 0) continue;
      sprite(ctx, PIEZAS[k.forma], X(x) + c * 0.06, Y(y) + c * 0.06, c * 0.88, c * 0.88, k.color);
    }
    ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(2, c / 14);
    ctx.strokeRect(X(Math.min(p.x, bx)) + 1, Y(Math.max(0, Math.min(p.y, by))) + 1, (Math.abs(p.x - bx) + 1) * c - 2, (Math.abs(p.y - by) + 1 - (Math.min(p.y, by) < 0 ? 1 : 0)) * c - 2);
  }
  ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.strokeRect(X(0) - 2, Y(0) - 2, COLS * c + 4, FILAS * c + 4);

  // Siguiente par.
  ctx.fillStyle = HUESO; ctx.font = `700 ${Math.round(c * 0.32)}px "Silkscreen", monospace`;
  ctx.fillText('SIGUE', X(COLS) + c * 0.4, Y(0) + c * 0.3);
  ctx.fillStyle = '#000'; ctx.fillRect(X(COLS) + c * 0.4, Y(0) + c * 0.6, c * 1.6, c * 2.6);
  sprite(ctx, PIEZAS[e.siguiente[1].forma], X(COLS) + c * 0.7, Y(0) + c * 0.75, c, c, e.siguiente[1].color);
  sprite(ctx, PIEZAS[e.siguiente[0].forma], X(COLS) + c * 0.7, Y(0) + c * 1.85, c, c, e.siguiente[0].color);
  if (e.mejorCadena > 1) { ctx.fillStyle = '#FFC20E'; ctx.fillText(`×${e.mejorCadena}`, X(COLS) + c * 0.6, Y(4)); }

  // Avisos.
  ctx.textAlign = 'center';
  for (const a of e.avisos) {
    ctx.font = `700 ${Math.round(c * 0.45)}px "Silkscreen", monospace`;
    const yy = Y(a.y) - (1 - a.t / 900) * c;
    ctx.fillStyle = '#000'; ctx.fillText(a.texto, X(a.x + 0.5) + 2, yy + 2);
    ctx.fillStyle = '#FF8FB1'; ctx.fillText(a.texto, X(a.x + 0.5), yy);
  }
}
