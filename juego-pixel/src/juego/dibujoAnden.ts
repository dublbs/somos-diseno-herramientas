// Dibuja el nivel 2 (El andén) en un canvas de ancho × alto px: la estación, vigas, Grises, bolas, tiros, piezas y
// efectos. Las piezas del escenario y de las figuras se exportan porque el jefe usa la misma arena (ronda 3).
import { ALTO_A, ANCHO_A, GOLPES_COLOR, GOLPES_HUESO, VIGAS, type Anden, type Cuerpo, type GrisA, type Tiro, type Viga } from './anden';
import { HUESO, type Aviso } from './comun';
import type { Imagenes } from './dibujoCruce';
import { sombra } from './dibujoCruce';
import { avanzarEfectos, dibujarManchas, dibujarParticulas, sacudida } from './efectos';
import { textoConPlaca } from './texto';
import { lienzoCarro } from './metro';
import { dibujarBola, dibujarGris, dibujarPinta, type Pose } from './personajes';
import { PIEZAS, sprite } from './sprites';

export interface Marco { c: number; X: (x: number) => number; Y: (y: number) => number; lw: number; x0: number; y0: number }

// La arena usa todo el alto (ronda 3): el HUD va encima de la pared y los controles encima de los bordes.
// En vertical, si debajo sobra el alto de los controles (`mandoAlto`), la arena sube y los controles quedan abajo.
export function marco(ancho: number, alto: number, mandoAlto = 0): Marco {
  const c = Math.max(8, Math.floor(Math.min(ancho / ANCHO_A, alto / ALTO_A)));
  const libre = alto - ALTO_A * c;
  const x0 = Math.round((ancho - ANCHO_A * c) / 2);
  const y0 = libre >= mandoAlto && mandoAlto > 0 ? Math.round(Math.min(libre - mandoAlto, c * 1.6)) : Math.round(libre / 2);
  return { c, X: x => Math.round(x0 + x * c), Y: y => Math.round(y0 + y * c), lw: Math.max(2, Math.round(c / 18)), x0, y0 };
}

// Pared de la estación (azulejos hueso, franja azul, letrero), el metro detenido al fondo y las vigas con volumen.
// La pared sigue a los lados de la arena, más oscura: la pantalla se llena entera.
export function escenario(ctx: CanvasRenderingContext2D, ancho: number, alto: number, m: Marco, vigas: Viga[], _img: Imagenes, letrero: string, gris = 0) {
  const { c, X, Y, lw } = m;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#C9BFAE'; ctx.fillRect(0, 0, ancho, alto);
  ctx.fillStyle = HUESO; ctx.fillRect(X(0), 0, ANCHO_A * c, alto);
  // azulejos (en toda la pantalla)
  const az = Math.max(4, Math.round(c / 2));
  ctx.fillStyle = 'rgba(120,100,70,0.16)';
  for (let y = Y(0) % az; y < alto; y += az) ctx.fillRect(0, y, ancho, 1);
  for (let x = X(0) % az; x < ancho; x += az) ctx.fillRect(x, 0, 1, alto);
  // franja azul de la estación
  ctx.fillStyle = '#0062B8'; ctx.fillRect(0, Y(3.3), ancho, Math.round(c * 0.35));
  ctx.fillStyle = '#2B4BD8'; ctx.fillRect(0, Y(3.65), ancho, Math.round(c * 0.1));
  // Letrero con sombra dura.
  if (letrero) {
    const lx = X(8) - Math.round(c * 1.9), ly = Y(0.45), lw2 = Math.round(c * 3.8), lh = Math.round(c * 0.9);
    ctx.fillStyle = '#000'; ctx.fillRect(lx + 4, ly + 4, lw2, lh);
    ctx.fillStyle = '#0062B8'; ctx.fillRect(lx, ly, lw2, lh);
    ctx.strokeStyle = '#000'; ctx.lineWidth = lw; ctx.strokeRect(lx, ly, lw2, lh);
    ctx.font = `700 ${Math.round(c * 0.42)}px "Silkscreen", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = HUESO; ctx.fillText(letrero, X(8), ly + lh / 2);
  }
  // El metro detenido al fondo, a la altura del andén (pixel L1, apagado para que no compita con las figuras).
  const carro = lienzoCarro(), cw = Math.round(c * 6.4), ch = Math.round(c * 2.4);
  ctx.globalAlpha = 0.22;
  for (let x = X(0) - ((X(0) / cw) | 0) * cw - cw; x < ancho; x += cw) ctx.drawImage(carro, x, Y(ALTO_A - 1) - ch, cw, ch);
  ctx.globalAlpha = 1;
  // El color se va: una capa gris sobre la pared mientras el jefe no lo devuelve (0 a 1).
  if (gris > 0) { ctx.fillStyle = `rgba(110,110,106,${0.5 * gris})`; ctx.fillRect(0, 0, ancho, Y(ALTO_A - 1)); }
  // Los costados de la arena, más oscuros.
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.fillRect(0, 0, X(0), alto); ctx.fillRect(X(ANCHO_A), 0, ancho - X(ANCHO_A), alto);

  // Vigas con techo (se pisan desde arriba) y el andén con su borde amarillo.
  const d = Math.round(c * 0.16);
  for (const v of vigas) {
    const ax = X(v.x0), bx = X(v.x1), y = Y(v.y);
    if (v.y === ALTO_A - 1) {
      ctx.fillStyle = '#77726A'; ctx.fillRect(0, y, ancho, alto - y);
      ctx.fillStyle = '#5A564F'; for (let x = X(0) % c; x < ancho; x += c) ctx.fillRect(x, y + Math.round(c * 0.3), 2, alto);
      ctx.fillStyle = '#FFC20E'; ctx.fillRect(0, y, ancho, Math.round(c * 0.18));
      ctx.fillStyle = '#000';
      for (let x = X(0) % Math.round(c / 2) - c; x < ancho; x += Math.round(c / 2)) ctx.fillRect(x, y + Math.round(c * 0.18), Math.round(c * 0.25), Math.round(c * 0.06));
      ctx.fillRect(0, y, ancho, lw);
      continue;
    }
    const h = Math.round(c * 0.42);
    ctx.beginPath(); ctx.moveTo(ax, y); ctx.lineTo(ax + d, y - d); ctx.lineTo(bx + d, y - d); ctx.lineTo(bx, y); ctx.closePath();
    ctx.fillStyle = '#7FC8F8'; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = '#000'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + d, y - d); ctx.lineTo(bx + d, y + h - d); ctx.lineTo(bx, y + h); ctx.closePath();
    ctx.fillStyle = sombra('#2B4BD8', 0.6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2B4BD8'; ctx.fillRect(ax, y, bx - ax, h); ctx.strokeRect(ax, y, bx - ax, h);
    ctx.fillStyle = '#1D3399'; ctx.fillRect(ax + lw, y + h - Math.round(c * 0.1), bx - ax - 2 * lw, Math.round(c * 0.06));
    ctx.fillStyle = '#7FC8F8';
    for (let x = v.x0; x < v.x1 - 0.4; x += 1) ctx.fillRect(X(x) + Math.round(c * 0.2), y + Math.round(c * 0.14), Math.round(c * 0.12), Math.round(c * 0.12));
  }
  // Paredes de la arena: columnas negras con remaches.
  for (const px of [X(0) - Math.round(c * 0.18), X(ANCHO_A)]) {
    ctx.fillStyle = '#000'; ctx.fillRect(px, 0, Math.round(c * 0.18), Y(ALTO_A - 1));
  }
}

// Sombra en el piso o la viga bajo una figura.
function sombraBajo(ctx: CanvasRenderingContext2D, m: Marco, x: number, y: number, vigas: Viga[], ancho = 0.8) {
  const v = vigas.filter(w => w.y >= y - 0.01 && x + ancho / 2 > w.x0 && x + ancho / 2 < w.x1).sort((a, b) => a.y - b.y)[0];
  if (!v) return;
  const lejos = Math.min(1, (v.y - y) / 4);
  ctx.globalAlpha = 0.25 * (1 - lejos * 0.6);
  ctx.fillStyle = '#000'; ctx.fillRect(m.X(x + 0.05 + lejos * 0.1), m.Y(v.y) - Math.round(m.c * 0.08), Math.round(m.c * ancho * (1 - lejos * 0.4)), Math.round(m.c * 0.1));
  ctx.globalAlpha = 1;
}

// Los Grises: caminan (2 cuadros), saltan, se cubren de pintura por capas y, atrapados, son una bola que gira.
export function dibujarGrises(ctx: CanvasRenderingContext2D, m: Marco, grises: GrisA[], vigas: Viga[], ahora: number, golpesBola: (g: GrisA) => number, quieto = false) {
  const { c, X, Y } = m;
  for (const g of grises) {
    sombraBajo(ctx, m, g.x, g.y, vigas);
    const cx = X(g.x + 0.4), pie = Y(g.y);
    if (g.bola > 0 || g.rueda) {
      const avisa = !g.rueda && g.bola < 1500 && Math.floor(ahora / 120) % 2 === 0;
      const r = c * 0.56, bote = g.rueda && !quieto ? Math.abs(Math.sin((g.giro ?? 0) * 2)) * c * 0.05 : 0;
      // al escaparse tiembla
      const tiembla = !g.rueda && g.bola < 1500 && !quieto ? Math.sin(ahora / 30) * c * 0.04 : 0;
      dibujarBola(ctx, cx + tiembla, pie - r - bote + c * 0.02, r, g.color, quieto ? 0 : g.giro ?? 0, avisa);
      continue;
    }
    const camina = Math.abs(g.vx) > 0.1 && g.suelo;
    const frame = !g.suelo ? 'salto' : camina && !quieto && Math.floor(ahora / 160 + g.id) % 2 === 0 ? 'b' : 'a';
    const nivel = g.golpes > 0 ? g.golpes / golpesBola(g) : 0;
    const tiembla = g.golpes > 0 && !quieto ? Math.round(Math.sin(ahora / 40 + g.id) * c * 0.03) : 0;
    const bota = camina && !quieto && frame === 'b' ? -Math.round(c * 0.03) : 0;
    dibujarGris(ctx, cx + tiembla, pie + bota, c * 1.05, frame, g.mira, g.golpes > 0 ? g.color : '', nivel, !!g.aturde);
    if (g.aturde && !quieto) { // estrellitas de mareo
      for (let k = 0; k < 3; k++) {
        const a = ahora / 220 + k * 2.1;
        ctx.fillStyle = '#000'; ctx.fillRect(cx + Math.cos(a) * c * 0.4 - 1, pie - c * 1.15 + Math.sin(a) * c * 0.1 - 1, c * 0.12 + 2, c * 0.12 + 2);
        ctx.fillStyle = '#FFC20E'; ctx.fillRect(cx + Math.cos(a) * c * 0.4, pie - c * 1.15 + Math.sin(a) * c * 0.1, c * 0.12, c * 0.12);
      }
    }
  }
}

// Tiros de pintura: una gota del color con su estela.
export function dibujarTiros(ctx: CanvasRenderingContext2D, m: Marco, tiros: Tiro[]) {
  const { c, X, Y } = m;
  for (const t of tiros) {
    for (let k = 3; k >= 1; k--) {
      const s = c * (0.08 + 0.03 * (3 - k));
      ctx.fillStyle = t.color; ctx.globalAlpha = 0.25 * (4 - k);
      ctx.fillRect(X(t.x - t.dir * k * 0.18) - s / 2, Y(t.y) - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000'; ctx.fillRect(X(t.x) - c * 0.18, Y(t.y) - c * 0.15, c * 0.36, c * 0.3);
    ctx.fillStyle = t.color; ctx.fillRect(X(t.x) - c * 0.13, Y(t.y) - c * 0.1, c * 0.26, c * 0.2);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(X(t.x) - c * 0.08, Y(t.y) - c * 0.07, c * 0.07, c * 0.06);
  }
}

// Tú (Pinta), con la pose que toca: caminar, saltar, lanzar o recibir un golpe.
export function dibujarJugador(ctx: CanvasRenderingContext2D, m: Marco, j: Cuerpo, invulnerable: number, tiros: Tiro[], vigas: Viga[], ahora: number, quieto = false) {
  const { c, X, Y } = m;
  sombraBajo(ctx, m, j.x, j.y, vigas);
  let pose: Pose = 'quieto';
  if (invulnerable > 1600) pose = 'golpe';
  else if (tiros.some(t => t.recorrido < 1.4)) pose = 'lanza';
  else if (!j.suelo) pose = 'salta';
  else if (j.vx && !quieto) pose = Math.floor(ahora / 130) % 2 ? 'camina1' : 'camina2';
  ctx.save();
  if (invulnerable > 0 && Math.floor(ahora / 100) % 2 === 0) ctx.globalAlpha = 0.4;
  dibujarPinta(ctx, X(j.x + 0.4), Y(j.y) + Math.round(c * 0.02), c * 1.1, pose, j.mira);
  ctx.restore();
}

export function dibujarAvisos(ctx: CanvasRenderingContext2D, m: Marco, avisos: Aviso[], color = '#FF8FB1') {
  const { c, X, Y } = m;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const a of avisos) {
    if (!a.texto) continue;
    const yy = Y(a.y) - (1 - a.t / 900) * c * 0.8;
    textoConPlaca(ctx, a.texto, X(a.x + 0.4), yy, c * 0.42, color); // B-010: placa oscura, se lee sobre cualquier fondo
  }
}

const previo = new WeakMap<object, number>();
export function pasoEfectos(clave: object, ahora: number) {
  const p = previo.get(clave) ?? ahora; previo.set(clave, ahora);
  return Math.max(0, Math.min(50, ahora - p));
}

export function dibujarAnden(ctx: CanvasRenderingContext2D, ancho: number, alto: number, e: Anden, img: Imagenes, ahora: number, mandoAlto = 0, quieto = false) {
  const m = marco(ancho, alto, mandoAlto), { c, X, Y } = m;
  avanzarEfectos(e, e.eventos, e.grises, VIGAS, pasoEfectos(e, ahora), quieto);
  const [sx, sy] = sacudida(e, c, ahora);
  ctx.save(); ctx.translate(sx, sy);
  escenario(ctx, ancho, alto, m, VIGAS, img, 'ANDÉN');
  dibujarManchas(ctx, m, e);
  // Piezas sueltas (parpadean antes de borrarse).
  for (const p of e.piezas) {
    if (p.t < 1500 && Math.floor(ahora / 120) % 2 === 0) continue;
    const flota = quieto ? 0 : Math.sin(ahora / 200 + p.x) * c * 0.06;
    sprite(ctx, PIEZAS[p.forma], X(p.x), Y(p.y - 0.85) + flota, c * 0.8, c * 0.8, p.color);
  }
  dibujarGrises(ctx, m, e.grises, VIGAS, ahora, g => (g.color === HUESO ? GOLPES_HUESO : GOLPES_COLOR), quieto);
  dibujarTiros(ctx, m, e.tiros);
  dibujarJugador(ctx, m, e.jugador, e.invulnerable, e.tiros, VIGAS, ahora, quieto);
  dibujarParticulas(ctx, m, e, ancho, alto);
  dibujarAvisos(ctx, m, e.avisos);
  ctx.restore();
}
