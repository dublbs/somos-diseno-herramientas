// Dibuja el nivel 2 (El andén) en un canvas de ancho × alto px: pared de la estación, vigas, Grises, bolas, tiros y piezas.
import { ALTO_A, ANCHO_A, VIGAS, type Anden } from './anden';
import { HUESO } from './comun';
import type { Imagenes } from './dibujoCruce';
import { BOLA, GRIS_LADO, PIEZAS, sprite } from './sprites';

export function dibujarAnden(ctx: CanvasRenderingContext2D, ancho: number, alto: number, e: Anden, img: Imagenes, ahora: number) {
  const c = Math.floor(Math.min(ancho / ANCHO_A, alto / ALTO_A));
  const x0 = Math.round((ancho - ANCHO_A * c) / 2), y0 = Math.round((alto - ALTO_A * c) / 2);
  const X = (x: number) => x0 + x * c, Y = (y: number) => y0 + y * c;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1E1C19'; ctx.fillRect(0, 0, ancho, alto);

  // Pared de la estación: azulejos hueso, franja azul de la línea y letrero.
  ctx.fillStyle = HUESO; ctx.fillRect(X(0), Y(0), ANCHO_A * c, ALTO_A * c);
  ctx.fillStyle = '#E2D9C9';
  const az = c / 2;
  for (let y = 0; y < ALTO_A * 2; y++) ctx.fillRect(X(0), Y(0) + y * az, ANCHO_A * c, 1);
  for (let x = 0; x < ANCHO_A * 2; x++) ctx.fillRect(X(0) + x * az, Y(0), 1, ALTO_A * c);
  ctx.fillStyle = '#0062B8'; ctx.fillRect(X(0), Y(3.3), ANCHO_A * c, c * 0.35);
  ctx.fillStyle = '#2B4BD8'; ctx.fillRect(X(0), Y(3.65), ANCHO_A * c, c * 0.1);
  ctx.fillStyle = '#000'; ctx.fillRect(X(6.2) + 3, Y(0.5) + 3, c * 3.6, c * 0.9);
  ctx.fillStyle = '#0062B8'; ctx.fillRect(X(6.2), Y(0.5), c * 3.6, c * 0.9);
  ctx.font = `700 ${Math.round(c * 0.42)}px "Silkscreen", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = HUESO; ctx.fillText('ANDÉN', X(8), Y(0.95));
  // El metro detenido al fondo, a la altura del andén.
  if (img.metro) { ctx.globalAlpha = 0.3; for (let k = 0; k < 3; k++) ctx.drawImage(img.metro, X(-1 + k * 6.7), Y(8.9), c * 6.7, c * 2.1); ctx.globalAlpha = 1; }

  // Vigas (se pisan desde arriba) y el andén con su borde amarillo.
  for (const v of VIGAS) {
    if (v.y === ALTO_A - 1) {
      ctx.fillStyle = '#77726A'; ctx.fillRect(X(v.x0), Y(v.y), (v.x1 - v.x0) * c, c);
      ctx.fillStyle = '#FFC20E'; ctx.fillRect(X(v.x0), Y(v.y), (v.x1 - v.x0) * c, c * 0.18);
      ctx.fillStyle = '#000';
      for (let x = v.x0; x < v.x1; x += 0.5) ctx.fillRect(X(x), Y(v.y) + c * 0.18, c * 0.25, c * 0.06);
      continue;
    }
    ctx.fillStyle = '#000'; ctx.fillRect(X(v.x0), Y(v.y), (v.x1 - v.x0) * c, c * 0.45);
    ctx.fillStyle = '#2B4BD8'; ctx.fillRect(X(v.x0) + 2, Y(v.y) + 2, (v.x1 - v.x0) * c - 4, c * 0.45 - 4);
    ctx.fillStyle = '#7FC8F8';
    for (let x = v.x0; x < v.x1; x += 1) ctx.fillRect(X(x) + c * 0.15, Y(v.y) + c * 0.12, c * 0.3, c * 0.08);
  }
  ctx.fillStyle = '#000'; ctx.fillRect(X(0) - 3, Y(0), 3, ALTO_A * c); ctx.fillRect(X(ANCHO_A), Y(0), 3, ALTO_A * c);

  // Piezas sueltas (parpadean antes de borrarse).
  for (const p of e.piezas) {
    if (p.t < 1500 && Math.floor(ahora / 120) % 2 === 0) continue;
    sprite(ctx, PIEZAS[p.forma], X(p.x), Y(p.y - 0.85), c * 0.8, c * 0.8, p.color);
  }

  // Grises y bolas.
  for (const g of e.grises) {
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

  // Tiros de pintura.
  for (const t of e.tiros) {
    ctx.fillStyle = '#000'; ctx.fillRect(X(t.x) - c * 0.17, Y(t.y) - c * 0.17, c * 0.34, c * 0.34);
    ctx.fillStyle = t.color; ctx.fillRect(X(t.x) - c * 0.12, Y(t.y) - c * 0.12, c * 0.24, c * 0.24);
  }

  // Tú (personaje de Figma), mirando hacia donde caminas.
  const j = e.jugador, jx = X(j.x - 0.1), jy = Y(j.y - 1);
  ctx.save();
  if (e.invulnerable > 0 && Math.floor(ahora / 100) % 2 === 0) ctx.globalAlpha = 0.35;
  if (j.mira < 0) { ctx.translate(jx + c, 0); ctx.scale(-1, 1); ctx.translate(-jx, 0); }
  if (img.personaje) ctx.drawImage(img.personaje, jx, jy, c, c);
  else { ctx.fillStyle = '#FFC20E'; ctx.fillRect(jx + c * 0.2, jy + c * 0.2, c * 0.6, c * 0.6); }
  ctx.restore();

  // Vidas (corazones) arriba a la izquierda.
  for (let i = 0; i < e.vidas; i++) sprite(ctx, PIEZAS.corazon, X(0.3 + i * 0.8), Y(0.3), c * 0.65, c * 0.65, '#FF8FB1');

  // Avisos que suben.
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const a of e.avisos) {
    ctx.font = `700 ${Math.round(c * 0.4)}px "Silkscreen", monospace`;
    const yy = Y(a.y) - (1 - a.t / 900) * c * 0.8;
    ctx.fillStyle = '#000'; ctx.fillText(a.texto, X(a.x + 0.4) + 2, yy + 2);
    ctx.fillStyle = '#FF8FB1'; ctx.fillText(a.texto, X(a.x + 0.4), yy);
  }
}
