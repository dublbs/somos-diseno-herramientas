// Dibuja el nivel 2 (El andén) en un canvas de ancho × alto px: pared de la estación, vigas, Grises, bolas, tiros y
// piezas. Las piezas del escenario y de las figuras se exportan porque el jefe usa la misma arena.
import { ALTO_A, ANCHO_A, VIGAS, type Anden, type Cuerpo, type GrisA, type Tiro, type Viga } from './anden';
import { HUESO, type Aviso } from './comun';
import type { Imagenes } from './dibujoCruce';
import { sombra } from './dibujoCruce';
import { BOLA, GRIS_LADO, PIEZAS, sprite } from './sprites';

export interface Marco { c: number; X: (x: number) => number; Y: (y: number) => number; lw: number }

// `mando`: lado (px) de cada grupo de controles en las esquinas de abajo. La arena se achica lo justo para no quedar
// debajo de ellos: o deja libres los costados, o deja libre la franja de abajo (lo que la deje más grande).
export function marco(ancho: number, alto: number, mando = 0): Marco {
  const cA = Math.min((ancho - 2 * mando) / ANCHO_A, alto / ALTO_A), cB = Math.min(ancho / ANCHO_A, (alto - mando) / ALTO_A);
  const abajo = cB > cA, c = Math.max(8, Math.floor(Math.max(cA, cB)));
  const x0 = Math.round((ancho - ANCHO_A * c) / 2), y0 = Math.round(((abajo ? alto - mando : alto) - ALTO_A * c) / 2);
  return { c, X: x => Math.round(x0 + x * c), Y: y => Math.round(y0 + y * c), lw: Math.max(2, Math.round(c / 20)) };
}

// Pared de la estación (azulejos hueso, franja azul, letrero), el metro detenido al fondo y las vigas con volumen.
export function escenario(ctx: CanvasRenderingContext2D, ancho: number, alto: number, m: Marco, vigas: Viga[], img: Imagenes, letrero: string, gris = 0) {
  const { c, X, Y, lw } = m;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1E1C19'; ctx.fillRect(0, 0, ancho, alto);
  ctx.fillStyle = HUESO; ctx.fillRect(X(0), Y(0), ANCHO_A * c, ALTO_A * c);
  ctx.fillStyle = '#E2D9C9';
  const az = c / 2;
  for (let y = 0; y < ALTO_A * 2; y++) ctx.fillRect(X(0), Math.round(Y(0) + y * az), ANCHO_A * c, 1);
  for (let x = 0; x < ANCHO_A * 2; x++) ctx.fillRect(Math.round(X(0) + x * az), Y(0), 1, ALTO_A * c);
  ctx.fillStyle = '#0062B8'; ctx.fillRect(X(0), Y(3.3), ANCHO_A * c, Math.round(c * 0.35));
  ctx.fillStyle = '#2B4BD8'; ctx.fillRect(X(0), Y(3.65), ANCHO_A * c, Math.round(c * 0.1));
  ctx.save(); ctx.beginPath(); ctx.rect(X(0), Y(0), ANCHO_A * c, ALTO_A * c); ctx.clip();
  // Letrero con sombra dura.
  if (letrero) {
  const lx = X(8) - Math.round(c * 1.9), ly = Y(0.45), lw2 = Math.round(c * 3.8), lh = Math.round(c * 0.9);
  ctx.fillStyle = '#000'; ctx.fillRect(lx + 4, ly + 4, lw2, lh);
  ctx.fillStyle = '#0062B8'; ctx.fillRect(lx, ly, lw2, lh);
  ctx.strokeStyle = '#000'; ctx.lineWidth = lw; ctx.strokeRect(lx, ly, lw2, lh);
  ctx.font = `700 ${Math.round(c * 0.42)}px "Silkscreen", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = HUESO; ctx.fillText(letrero, X(8), ly + lh / 2);
  }
  // El metro detenido al fondo, a la altura del andén.
  if (img.metro) { ctx.globalAlpha = 0.3; for (let k = 0; k < 3; k++) ctx.drawImage(img.metro, X(-1 + k * 6.7), Y(8.9), Math.round(c * 6.7), Math.round(c * 2.1)); ctx.globalAlpha = 1; }
  // El color se va: una capa gris sobre la pared mientras el jefe no lo devuelve (0 a 1).
  if (gris > 0) { ctx.fillStyle = `rgba(120,120,116,${0.45 * gris})`; ctx.fillRect(X(0), Y(0), ANCHO_A * c, ALTO_A * c); }
  ctx.restore();

  // Vigas con techo (se pisan desde arriba) y el andén con su borde amarillo.
  const d = Math.round(c * 0.16);
  for (const v of vigas) {
    const ax = X(v.x0), bx = X(v.x1), y = Y(v.y);
    if (v.y === ALTO_A - 1) {
      ctx.fillStyle = '#77726A'; ctx.fillRect(ax, y, bx - ax, c);
      ctx.fillStyle = '#FFC20E'; ctx.fillRect(ax, y, bx - ax, Math.round(c * 0.18));
      ctx.fillStyle = '#000';
      for (let x = v.x0; x < v.x1; x += 0.5) ctx.fillRect(X(x), y + Math.round(c * 0.18), Math.round(c * 0.25), Math.round(c * 0.06));
      ctx.fillRect(ax, y, bx - ax, lw);
      continue;
    }
    const h = Math.round(c * 0.42);
    // techo de la viga (un poco de volumen hacia el fondo)
    ctx.beginPath(); ctx.moveTo(ax, y); ctx.lineTo(ax + d, y - d); ctx.lineTo(bx + d, y - d); ctx.lineTo(bx, y); ctx.closePath();
    ctx.fillStyle = '#7FC8F8'; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = '#000'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + d, y - d); ctx.lineTo(bx + d, y + h - d); ctx.lineTo(bx, y + h); ctx.closePath();
    ctx.fillStyle = sombra('#2B4BD8', 0.6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2B4BD8'; ctx.fillRect(ax, y, bx - ax, h); ctx.strokeRect(ax, y, bx - ax, h);
    ctx.fillStyle = '#7FC8F8';
    for (let x = v.x0; x < v.x1 - 0.4; x += 1) ctx.fillRect(X(x) + Math.round(c * 0.2), y + Math.round(c * 0.14), Math.round(c * 0.12), Math.round(c * 0.12));
  }
  ctx.fillStyle = '#000'; ctx.fillRect(X(0) - 3, Y(0), 3, ALTO_A * c); ctx.fillRect(X(ANCHO_A), Y(0), 3, ALTO_A * c);
}

// Sombra en el piso o la viga bajo una figura.
function sombraBajo(ctx: CanvasRenderingContext2D, m: Marco, x: number, y: number, vigas: Viga[], ancho = 0.8) {
  const v = vigas.filter(w => w.y >= y - 0.01 && x + 0.4 > w.x0 && x + 0.4 < w.x1).sort((a, b) => a.y - b.y)[0];
  if (!v) return;
  const lejos = Math.min(1, (v.y - y) / 4);
  ctx.globalAlpha = 0.25 * (1 - lejos * 0.6);
  ctx.fillStyle = '#000'; ctx.fillRect(m.X(x + 0.05 + lejos * 0.1), m.Y(v.y) - Math.round(m.c * 0.08), Math.round(m.c * ancho * (1 - lejos * 0.4)), Math.round(m.c * 0.1));
  ctx.globalAlpha = 1;
}

export function dibujarGrises(ctx: CanvasRenderingContext2D, m: Marco, grises: GrisA[], vigas: Viga[], ahora: number) {
  const { c, X, Y } = m;
  for (const g of grises) {
    sombraBajo(ctx, m, g.x, g.y, vigas);
    const gx = X(g.x - 0.1), gy = Y(g.y - 1);
    if (g.bola > 0 || g.rueda) {
      const avisa = !g.rueda && g.bola < 1500 && Math.floor(ahora / 120) % 2 === 0;
      const giro = g.rueda ? Math.floor(ahora / 60) % 2 : 0;
      sprite(ctx, BOLA, gx, gy + giro, c, c, avisa ? '#8F8F8A' : g.color, g.mira < 0);
      continue;
    }
    const tiembla = Math.sin(ahora / 90 + g.id) * c * 0.03;
    sprite(ctx, GRIS_LADO, gx + tiembla, gy + c * 0.05, c * 0.95, c * 0.95, '#FF8FB1', g.mira < 0);
    for (let k = 0; k < g.golpes; k++) { // manchas de pintura de cada golpe
      ctx.fillStyle = '#000'; ctx.fillRect(gx + c * (0.1 + (k % 3) * 0.27) - 1, gy + c * (0.62 - Math.floor(k / 3) * 0.3) - 1, c * 0.24 + 2, c * 0.2 + 2);
      ctx.fillStyle = g.color; ctx.fillRect(gx + c * (0.1 + (k % 3) * 0.27), gy + c * (0.62 - Math.floor(k / 3) * 0.3), c * 0.24, c * 0.2);
    }
  }
}

export function dibujarTiros(ctx: CanvasRenderingContext2D, m: Marco, tiros: Tiro[]) {
  const { c, X, Y } = m;
  for (const t of tiros) {
    ctx.fillStyle = '#000'; ctx.fillRect(X(t.x) - c * 0.17, Y(t.y) - c * 0.17, c * 0.34, c * 0.34);
    ctx.fillStyle = t.color; ctx.fillRect(X(t.x) - c * 0.12, Y(t.y) - c * 0.12, c * 0.24, c * 0.24);
  }
}

// Tú (personaje de Figma), mirando hacia donde caminas, con tu sombra.
export function dibujarJugador(ctx: CanvasRenderingContext2D, m: Marco, j: Cuerpo, invulnerable: number, img: Imagenes, vigas: Viga[], ahora: number) {
  const { c, X, Y } = m;
  sombraBajo(ctx, m, j.x, j.y, vigas);
  const jx = X(j.x - 0.1), jy = Y(j.y - 1);
  ctx.save();
  if (invulnerable > 0 && Math.floor(ahora / 100) % 2 === 0) ctx.globalAlpha = 0.35;
  if (j.mira < 0) { ctx.translate(jx + c, 0); ctx.scale(-1, 1); ctx.translate(-jx, 0); }
  if (img.personaje) ctx.drawImage(img.personaje, jx, jy, c, c);
  else { ctx.fillStyle = '#00A651'; ctx.fillRect(jx + c * 0.2, jy + c * 0.2, c * 0.6, c * 0.6); }
  ctx.restore();
}

export function dibujarAvisos(ctx: CanvasRenderingContext2D, m: Marco, avisos: Aviso[], color = '#FF8FB1') {
  const { c, X, Y } = m;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const a of avisos) {
    if (!a.texto) continue;
    ctx.font = `700 ${Math.round(c * 0.4)}px "Silkscreen", monospace`;
    const yy = Y(a.y) - (1 - a.t / 900) * c * 0.8;
    ctx.fillStyle = '#000'; ctx.fillText(a.texto, X(a.x + 0.4) + 2, yy + 2);
    ctx.fillStyle = color; ctx.fillText(a.texto, X(a.x + 0.4), yy);
  }
}

export function dibujarAnden(ctx: CanvasRenderingContext2D, ancho: number, alto: number, e: Anden, img: Imagenes, ahora: number, mando = 0) {
  const m = marco(ancho, alto, mando), { c, X, Y } = m;
  escenario(ctx, ancho, alto, m, VIGAS, img, 'ANDÉN');
  // Piezas sueltas (parpadean antes de borrarse).
  for (const p of e.piezas) {
    if (p.t < 1500 && Math.floor(ahora / 120) % 2 === 0) continue;
    sprite(ctx, PIEZAS[p.forma], X(p.x), Y(p.y - 0.85), c * 0.8, c * 0.8, p.color);
  }
  dibujarGrises(ctx, m, e.grises, VIGAS, ahora);
  dibujarTiros(ctx, m, e.tiros);
  dibujarJugador(ctx, m, e.jugador, e.invulnerable, img, VIGAS, ahora);
  dibujarAvisos(ctx, m, e.avisos);
}
