// Dibuja la pelea con el Inacapín Pixel (plan 009-juego-pixel, ronda 2) sobre la arena del andén.
import { ALTO_A, ANCHO_A } from './anden';
import { dibujarAvisos, dibujarGrises, dibujarJugador, dibujarTiros, escenario, marco } from './dibujoAnden';
import type { Imagenes } from './dibujoCruce';
import { ALTO_JEFE, ANCHO_JEFE, COLORES_JEFE, GOLPES_JEFE, VIGAS_JEFE, xJefe, type Jefe } from './jefe';
import { INACAPIN, PALETA, PIEZAS, sprite } from './sprites';

const GRISES = ['#6B6B66', '#8F8F8A', '#A3A39D', '#6B6B66', '#8F8F8A', '#5A5A55'];

// El Inacapín en (px, py) de `tam` px de lado. `color[i]` dice si la parte i (1 a 6) ya recuperó su color.
export function dibujarInacapin(ctx: CanvasRenderingContext2D, px: number, py: number, tam: number, partes: number, opciones: { boca?: boolean; blanco?: boolean; ojos?: 'x' | 'feliz' | null; espejo?: boolean } = {}) {
  const n = INACAPIN.length, p = tam / n;
  INACAPIN.forEach((fila, j) => [...fila].forEach((ch, i0) => {
    if (ch === '.') return;
    const i = opciones.espejo ? n - 1 - i0 : i0;
    let col: string;
    if (ch >= '1' && ch <= '6') { const k = Number(ch); col = k <= partes ? COLORES_JEFE[k - 1] : GRISES[k - 1]; }
    else if (ch === 'r') col = partes >= 3 ? '#FF8FB1' : '#B9B9B3';
    else if (ch === 'w' && opciones.ojos === 'x') col = j === 6 ? (i0 % 2 ? '#000000' : '#F4EEE3') : (i0 % 2 ? '#F4EEE3' : '#000000');
    else if (ch === 'w' && opciones.ojos === 'feliz') col = j === 7 ? '#F4EEE3' : '#000000';
    else col = PALETA[ch];
    if (opciones.blanco && ch !== 'k') col = '#FFFFFF';
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(px + i * p), Math.round(py + j * p), Math.ceil(p), Math.ceil(p));
  }));
  // Boca abierta: se agranda hacia abajo cuando ataca.
  if (opciones.boca) { // simétrica: no cambia con el espejo
    ctx.fillStyle = '#000000'; ctx.fillRect(Math.round(px + 5 * p), Math.round(py + 9 * p), Math.ceil(6 * p), Math.ceil(3 * p));
    ctx.fillStyle = '#FF8FB1'; ctx.fillRect(Math.round(px + 6 * p), Math.round(py + 11 * p), Math.ceil(4 * p), Math.ceil(p));
  }
}

export function dibujarJefe(ctx: CanvasRenderingContext2D, ancho: number, alto: number, e: Jefe, img: Imagenes, ahora: number, quieto = false, mando = 0) {
  const m = marco(ancho, alto, mando, Math.round(mando * 0.22)), { c, X, Y } = m;
  const partes = e.celebra || e.fin === 'victoria' ? GOLPES_JEFE : e.golpes;
  escenario(ctx, ancho, alto, m, VIGAS_JEFE, img, '', 1 - partes / GOLPES_JEFE);

  // Avisos de gotas: la columna se marca en el piso y arriba.
  if (e.ataque?.tipo === 'gotas') {
    const on = Math.floor(ahora / 140) % 2 === 0;
    for (const x of e.ataque.columnas) {
      ctx.fillStyle = on ? '#FFC20E' : '#000'; ctx.fillRect(X(x + 0.1), Y(ALTO_A - 1) - Math.round(c * 0.16), Math.round(c * 0.8), Math.round(c * 0.16));
      ctx.globalAlpha = 0.18; ctx.fillStyle = '#000'; ctx.fillRect(X(x + 0.1), Y(0), Math.round(c * 0.8), (ALTO_A - 1) * c); ctx.globalAlpha = 1;
      sprite(ctx, PIEZAS.gota, X(x + 0.2), Y(0.15), c * 0.6, c * 0.6, '#8F8F8A');
    }
  }

  // El Inacapín: respira, se agacha y brilla antes de atacar, parpadea al recibir un golpe y salta de esquina.
  const tam = ANCHO_JEFE * c, yTope = ALTO_A - 1 - ALTO_JEFE;
  let bx = X(xJefe(e)), by = Y(yTope);
  if (e.cambio) {
    const p = 1 - e.cambio / 1200, viejo = p < 0.5 ? e.lado : -e.lado;
    const desde = viejo > 0 ? ANCHO_A - ANCHO_JEFE : 0, hacia = viejo > 0 ? 0 : ANCHO_A - ANCHO_JEFE;
    bx = X(desde + (hacia - desde) * p); by = Y(yTope - Math.sin(p * Math.PI) * 4);
  }
  const celebra = e.celebra > 0 || e.fin === 'victoria';
  const respira = quieto ? 0 : Math.round(Math.sin(ahora / 300) * c * 0.04);
  const avisa = e.ataque && e.ataque.t > 0;
  const agacha = avisa && e.ataque!.tipo === 'mancha' ? Math.round(c * 0.2) : 0;
  const salto = celebra && !quieto ? Math.abs(Math.sin(ahora / 160)) * c * 0.6 : 0;
  // sombra
  ctx.globalAlpha = 0.25; ctx.fillStyle = '#000'; ctx.fillRect(bx + c * 0.2, Y(ALTO_A - 1) - Math.round(c * 0.12), tam - c * 0.4, Math.round(c * 0.14)); ctx.globalAlpha = 1;
  if (avisa && Math.floor(ahora / 120) % 2 === 0) { // brillo de aviso
    ctx.fillStyle = '#FFC20E'; ctx.fillRect(bx - c * 0.12, by - c * 0.12 + agacha + respira, tam + c * 0.24, tam + c * 0.24 - agacha);
  }
  ctx.save();
  ctx.translate(bx, by + respira - salto);
  if (agacha) { ctx.translate(0, agacha + tam * 0.08); ctx.scale(1, 0.92); }
  dibujarInacapin(ctx, 0, 0, tam, partes, {
    boca: !!avisa || celebra, blanco: e.herido > 0 && Math.floor(ahora / 80) % 2 === 0,
    ojos: celebra ? 'feliz' : e.herido > 0 ? 'x' : null, espejo: e.lado < 0,
  });
  ctx.restore();

  // Manchas y gotas grises.
  for (const mm of e.manchas) {
    const gx = X(mm.x - 0.4), gy = Y(ALTO_A - 1) - Math.round(c * 0.62), gira = quieto ? 0 : Math.floor(ahora / 70) % 2;
    ctx.fillStyle = '#000'; ctx.fillRect(gx, gy + gira, Math.round(c * 0.8), Math.round(c * 0.62));
    ctx.fillStyle = '#8F8F8A'; ctx.fillRect(gx + 3, gy + 3 + gira, Math.round(c * 0.8) - 6, Math.round(c * 0.62) - 6);
    ctx.fillStyle = '#6B6B66'; ctx.fillRect(gx + 3, gy + Math.round(c * 0.4) + gira, Math.round(c * 0.8) - 6, Math.round(c * 0.16));
  }
  for (const g of e.gotas) sprite(ctx, PIEZAS.gota, X(g.x - 0.35), Y(g.y - 0.75), c * 0.7, c * 0.7, '#8F8F8A');

  dibujarGrises(ctx, m, e.grises, VIGAS_JEFE, ahora);
  dibujarTiros(ctx, m, e.tiros);
  if (!(e.fin === 'derrota')) dibujarJugador(ctx, m, e.jugador, e.invulnerable, img, VIGAS_JEFE, ahora);

  // Celebración: papel picado de los colores que recuperó.
  if (celebra) {
    for (let k = 0; k < 60; k++) {
      const t = quieto ? 0.5 : ((ahora / 2200 + k * 0.137) % 1);
      const x = X(((k * 7.31) % ANCHO_A)), y = Y(t * ALTO_A);
      ctx.fillStyle = COLORES_JEFE[k % COLORES_JEFE.length]; ctx.fillRect(x, y, Math.round(c * 0.18), Math.round(c * 0.18));
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(c * 0.62)}px "Silkscreen", monospace`;
    ctx.fillStyle = '#000'; ctx.fillText('¡Le devolviste el color!', X(ANCHO_A / 2) + 4, Y(2.6) + 4);
    ctx.fillStyle = '#FFC20E'; ctx.fillText('¡Le devolviste el color!', X(ANCHO_A / 2), Y(2.6));
  }
  dibujarAvisos(ctx, m, e.avisos, '#FFC20E');
}
