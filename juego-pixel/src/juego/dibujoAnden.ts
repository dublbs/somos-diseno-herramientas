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

// Tema del escenario (B-008): el andén cambia de luz y de color para que se sienta el avance. Ronda 1, la mañana
// (hueso y franja azul, tubos apagados); ronda 2, la hora punta (luces encendidas, pared cálida y franja verde); jefe, el
// Inacapín (pared morada en penumbra, franja roja y luz roja de alarma). Todos son colores de la paleta Línea azul o
// sombras de ellos (el rojo es el del Inacapín, aprobado para la L1).
export interface Tema { pared: string; costado: string; junta: string; franja: string; franja2: string; tubo: string; brillo: string; luz: number }
export const TEMAS = {
  ronda1: { pared: '#F4EEE3', costado: '#C9BFAE', junta: '#786446', franja: '#0062B8', franja2: '#2B4BD8', tubo: '#B9B9B3', brillo: '#FFF6C9', luz: 0 },
  ronda2: { pared: '#F8E7C2', costado: '#C9A874', junta: '#8A6A30', franja: '#00A651', franja2: '#007A3B', tubo: '#FFF6C9', brillo: '#FFE79A', luz: 1 },
  jefe: { pared: '#4E2C5A', costado: '#2A1730', junta: '#14091A', franja: '#E2001A', franja2: '#A80013', tubo: '#FF8FB1', brillo: '#E2001A', luz: 1 },
} satisfies Record<string, Tema>;
const hexRgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mezclaHex = (a: string, b: string, t: number) => {
  const x = hexRgb(a), y = hexRgb(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
export function mezclarTema(a: Tema, b: Tema, t: number): Tema {
  const k = Math.max(0, Math.min(1, t));
  if (k <= 0) return a;
  if (k >= 1) return b;
  return {
    pared: mezclaHex(a.pared, b.pared, k), costado: mezclaHex(a.costado, b.costado, k), junta: mezclaHex(a.junta, b.junta, k),
    franja: mezclaHex(a.franja, b.franja, k), franja2: mezclaHex(a.franja2, b.franja2, k), tubo: mezclaHex(a.tubo, b.tubo, k),
    brillo: mezclaHex(a.brillo, b.brillo, k), luz: a.luz + (b.luz - a.luz) * k,
  };
}
// Cambio de tema con transición (`MS_CAMBIO`). Devuelve el tema del cuadro, cuánto lleva el cambio (`p`, 0 a 1) y los ms desde que empezó.
// Con `prefers-reduced-motion` el cambio es inmediato.
const MS_CAMBIO = 1100;
const cambios = new WeakMap<object, { de: Tema; a: Tema; t0: number }>();
export function temaVivo(clave: object, objetivo: Tema, ahora: number, quieto: boolean): { tema: Tema; p: number; ms: number } {
  let c = cambios.get(clave);
  if (!c) { c = { de: objetivo, a: objetivo, t0: -1e9 }; cambios.set(clave, c); }
  if (c.a !== objetivo) { c.de = mezclarTema(c.de, c.a, (ahora - c.t0) / MS_CAMBIO); c.a = objetivo; c.t0 = ahora; }
  const p = Math.max(0, Math.min(1, (ahora - c.t0) / MS_CAMBIO));
  return { tema: mezclarTema(c.de, c.a, quieto ? 1 : p), p, ms: ahora - c.t0 };
}

// Pared de la estación (azulejos, franja, letrero, tubos de luz), el metro detenido al fondo y las vigas con volumen.
// La pared sigue a los lados de la arena, más oscura: la pantalla se llena entera. `parpadeo`: las luces titilan.
export function escenario(ctx: CanvasRenderingContext2D, ancho: number, alto: number, m: Marco, vigas: Viga[], _img: Imagenes, letrero: string, gris = 0, tema: Tema = TEMAS.ronda1, parpadeo = false) {
  const { c, X, Y, lw } = m;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = tema.costado; ctx.fillRect(0, 0, ancho, alto);
  ctx.fillStyle = tema.pared; ctx.fillRect(X(0), 0, ANCHO_A * c, alto);
  // azulejos (en toda la pantalla)
  const az = Math.max(4, Math.round(c / 2));
  ctx.fillStyle = tema.junta; ctx.globalAlpha = 0.16;
  for (let y = Y(0) % az; y < alto; y += az) ctx.fillRect(0, y, ancho, 1);
  for (let x = X(0) % az; x < ancho; x += az) ctx.fillRect(x, 0, 1, alto);
  ctx.globalAlpha = 1;
  // franja de la estación
  ctx.fillStyle = tema.franja; ctx.fillRect(0, Y(3.3), ancho, Math.round(c * 0.35));
  ctx.fillStyle = tema.franja2; ctx.fillRect(0, Y(3.65), ancho, Math.round(c * 0.1));
  // Tubos de luz en el techo y su luz en escalones (pixel). Apagados en la ronda 1.
  const encendida = tema.luz * (parpadeo ? 0.15 : 1);
  for (let k = 0; k < 4; k++) {
    const tx = X(1.2 + k * 4), tw = Math.round(c * 1.6), th = Math.max(3, Math.round(c * 0.16)), ty = Y(0.12);
    if (encendida > 0.02) for (let s = 0; s < 3; s++) {
      ctx.globalAlpha = encendida * (0.16 - s * 0.045);
      ctx.fillStyle = tema.brillo;
      const ex = Math.round(c * (0.25 + s * 0.45));
      ctx.fillRect(tx - ex, ty + th, tw + 2 * ex, Math.round(c * (0.9 + s * 0.9)));
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000'; ctx.fillRect(tx - 2, ty - 2, tw + 4, th + 4);
    ctx.fillStyle = encendida > 0.5 ? tema.tubo : '#8F8F8A'; ctx.fillRect(tx, ty, tw, th);
  }
  // Letrero con sombra dura.
  if (letrero) {
    const lx = X(8) - Math.round(c * 1.9), ly = Y(0.45), lw2 = Math.round(c * 3.8), lh = Math.round(c * 0.9);
    ctx.fillStyle = '#000'; ctx.fillRect(lx + 4, ly + 4, lw2, lh);
    ctx.fillStyle = tema.franja; ctx.fillRect(lx, ly, lw2, lh);
    ctx.strokeStyle = '#000'; ctx.lineWidth = lw; ctx.strokeRect(lx, ly, lw2, lh);
    ctx.font = `700 ${Math.round(c * 0.42)}px "Silkscreen", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = HUESO; ctx.fillText(letrero, X(8), ly + lh / 2);
  }
  // El metro detenido al fondo, a la altura del andén (pixel L1, apagado para que no compita con las figuras).
  const carro = lienzoCarro(), cw = Math.round(c * 6.4), ch = Math.round(c * 2.4);
  ctx.globalAlpha = 0.22;
  for (let x = X(0) - ((X(0) / cw) | 0) * cw - cw; x < ancho; x += cw) ctx.drawImage(carro, x, Y(ALTO_A - 1) - ch, cw, ch);
  ctx.globalAlpha = 1;
  utileria(ctx, m, tema);
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
      // B-008: la línea amarilla del borde, con sus botones podotáctiles y la franja de seguridad.
      const banda = Math.round(c * 0.26), boton = Math.max(2, Math.round(c * 0.07)), paso = Math.round(c / 4);
      ctx.fillStyle = '#FFC20E'; ctx.fillRect(0, y, ancho, banda);
      ctx.fillStyle = '#C99700';
      for (let x = X(0) % paso - paso; x < ancho; x += paso) for (const f of [0.3, 0.68]) ctx.fillRect(x + Math.round(paso / 2 - boton / 2), y + Math.round(banda * f - boton / 2), boton, boton);
      ctx.fillStyle = '#000';
      for (let x = X(0) % Math.round(c / 2) - c; x < ancho; x += Math.round(c / 2)) ctx.fillRect(x, y + banda, Math.round(c * 0.25), Math.round(c * 0.06));
      ctx.fillRect(0, y, ancho, lw); ctx.fillRect(0, y + banda - 1, ancho, Math.max(1, Math.round(lw / 2)));
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

// Utilería del andén (B-008), detrás de las figuras: pilares con azulejo, letreros de salida y de línea, bancas, un
// basurero y un reloj. Pixel, con contorno negro y sombra dura, como el resto del juego. Los colores siguen al tema.
function utileria(ctx: CanvasRenderingContext2D, m: Marco, tema: Tema) {
  const { c, X, Y, lw } = m, piso = Y(ALTO_A - 1);
  const caja = (x: number, y: number, w: number, h: number, fondo: string, sombra = true) => {
    if (sombra) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + Math.round(c * 0.08), y + Math.round(c * 0.08), w, h); }
    ctx.fillStyle = '#000'; ctx.fillRect(x - lw, y - lw, w + 2 * lw, h + 2 * lw);
    ctx.fillStyle = fondo; ctx.fillRect(x, y, w, h);
  };
  const texto = (t: string, x: number, y: number, tam: number, color: string) => {
    ctx.font = `700 ${Math.round(tam)}px "Silkscreen", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = color; ctx.fillText(t, Math.round(x), Math.round(y));
  };
  // Pilares: azulejo un tono más oscuro que la pared, con capitel en la franja y zócalo oscuro.
  const pilar = mezclaHex(tema.pared, tema.costado, 0.55), canto = mezclaHex(tema.pared, '#000000', 0.35);
  for (const px of [4.65, 10.75]) {
    const x = X(px), w = Math.round(c * 0.6);
    ctx.fillStyle = canto; ctx.fillRect(x - 1, 0, w + 2, piso);
    ctx.fillStyle = pilar; ctx.fillRect(x + 1, 0, w - 2, piso);
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x + 2, 0, Math.max(2, Math.round(c * 0.08)), piso);
    ctx.fillStyle = canto;
    for (let y = Math.round(c / 2); y < piso; y += Math.round(c / 2)) ctx.fillRect(x + 1, y, w - 2, 1);
    ctx.fillStyle = tema.franja; ctx.fillRect(x - 1, Y(3.3), w + 2, Math.round(c * 0.35));
    ctx.fillStyle = '#3A3A37'; ctx.fillRect(x - 1, piso - Math.round(c * 0.3), w + 2, Math.round(c * 0.3));
  }
  // Letreros de salida, a cada lado (verde, con flecha pixel).
  const sw = Math.round(c * 2.3), sh = Math.round(c * 0.62), sy = Y(6.25);
  for (const [lado, x] of [[-1, X(0.45)], [1, X(ANCHO_A - 0.45) - sw]] as const) {
    caja(x, sy, sw, sh, '#00A651');
    const fl = Math.round(c * 0.08), fx = lado < 0 ? x + Math.round(c * 0.18) : x + sw - Math.round(c * 0.18) - 5 * fl, fy = sy + Math.round(sh / 2);
    ctx.fillStyle = HUESO;
    for (let k = 0; k < 5; k++) { const h = (lado < 0 ? k + 1 : 5 - k) * 2 - 1; ctx.fillRect(fx + k * fl, fy - Math.round((h * fl) / 2), fl, h * fl); }
    texto('SALIDA', x + sw / 2 - lado * c * 0.22, fy + 1, c * 0.28, HUESO);
  }
  // Placa de la línea junto al letrero del andén.
  const lx = X(8) + Math.round(c * 2.3), ly = Y(0.55), ll = Math.round(c * 0.72);
  caja(lx, ly, ll, ll, '#E2001A');
  texto('L1', lx + ll / 2, ly + ll / 2 + 1, c * 0.34, HUESO);
  // Reloj de andén (cuadrado pixel, marca las 8 y algo: hora punta).
  const rx = X(8) - Math.round(c * 3.1), ry = Y(0.55), rl = Math.round(c * 0.72), u = Math.max(2, Math.round(c * 0.07));
  caja(rx, ry, rl, rl, HUESO);
  ctx.fillStyle = '#000';
  ctx.fillRect(rx + Math.round(rl / 2) - Math.round(u / 2), ry + Math.round(c * 0.12), u, Math.round(rl / 2) - Math.round(c * 0.12));
  ctx.fillRect(rx + Math.round(rl / 2) - Math.round(c * 0.22), ry + Math.round(rl / 2), Math.round(c * 0.22), u);
  // Bancas (asiento de listones, respaldo y patas) y un basurero, al fondo del andén.
  for (const [a, b] of [[1.5, 3.5], [12.5, 14.5]]) {
    const x = X(a), w = Math.round((b - a) * c), asiento = piso - Math.round(c * 0.5), alto = Math.max(3, Math.round(c * 0.12));
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + Math.round(c * 0.1), piso - Math.round(c * 0.08), w, Math.round(c * 0.08));
    for (const pa of [x + Math.round(c * 0.15), x + w - Math.round(c * 0.3)]) { ctx.fillStyle = '#000'; ctx.fillRect(pa, asiento, Math.round(c * 0.15), piso - asiento); }
    caja(x, piso - Math.round(c * 1.05), w, Math.round(c * 0.32), '#7FC8F8', false);
    ctx.fillStyle = '#2B4BD8'; ctx.fillRect(x, piso - Math.round(c * 0.8), w, Math.max(1, Math.round(c * 0.05)));
    caja(x - Math.round(c * 0.05), asiento - alto, w + Math.round(c * 0.1), alto, '#2B4BD8', false);
  }
  const bx = X(9.3), bw = Math.round(c * 0.5), bh = Math.round(c * 0.7);
  caja(bx, piso - bh, bw, bh, '#5A5A55', false);
  ctx.fillStyle = '#000'; ctx.fillRect(bx + Math.round(bw * 0.25), piso - bh + Math.round(c * 0.1), Math.round(bw * 0.5), Math.max(2, Math.round(c * 0.06)));
  ctx.fillStyle = '#8F8F8A'; ctx.fillRect(bx, piso - bh, Math.max(2, Math.round(c * 0.07)), bh);
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
  // B-008: la segunda ronda de Grises enciende las luces y entibia el andén (con un titileo al cambiar).
  const { tema, p, ms } = temaVivo(e, e.oleada >= 2 ? TEMAS.ronda2 : TEMAS.ronda1, ahora, quieto);
  const titila = !quieto && p < 0.5 && Math.floor(ahora / 90) % 3 === 0;
  escenario(ctx, ancho, alto, m, VIGAS, img, 'ANDÉN', 0, tema, titila);
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
  if (e.oleada >= 2 && ms < 2400) { // aviso de la ronda 2 mientras cambia la luz (y un poco más)
    textoConPlaca(ctx, 'Ronda 2 · ¡hora punta!', X(ANCHO_A / 2), Y(6.6), c * 0.5, TEMAS.ronda2.brillo);
  }
  ctx.restore();
}
