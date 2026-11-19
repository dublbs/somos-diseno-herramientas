import { c3EnTiempo, dibujarC3 } from '../../../shared/c3-tunel.js';
import { imagen, raster } from './imagenes';

// «En vivo» de la mezanina (P-004): una rotación que no se detiene nunca de loops del Teatro de Papel y de la Estación
// Audioreactiva, generados por código con los mismos estilos. No usa micrófono ni red: la música es un pulso simulado
// a 120 bpm (bombo, hi-hat y una melodía que cambia de nota). Cada loop dura CADA ms y entra con un barrido.

const H = '#F4EEE3', N = '#000000', AZUL = '#0062B8', LAPIS = '#2B4BD8', CELESTE = '#7FC8F8', AMARILLO = '#FFC20E',
  VERDE = '#00A651', ROSA = '#FF8FB1', MORADO = '#7A2E8E';
const VIVOS = [AZUL, AMARILLO, ROSA, VERDE, CELESTE, MORADO, LAPIS];
export const PIEZAS_TEATRO = {
  araucaria: './figma/plaza/araucaria.svg', helecho: './figma/plaza/helecho.svg', quisco: './figma/plaza/quisco.svg',
  flor: './figma/plaza/flor-propia.svg', sol: './figma/plaza/sol.svg',
};
const CADA = 12000, BARRIDO = 700;

// La música simulada en un instante.
function pulso(ms: number) {
  const bombo = Math.pow(Math.max(0, Math.sin(ms * Math.PI / 500)), 8);
  const hat = Math.pow(Math.max(0, Math.sin(ms * Math.PI / 250 + 1.2)), 16);
  const nota = Math.floor(ms / 250), melodia = [0, 4, 7, 4, 9, 7, 4, 2][nota % 8] + Math.floor(nota / 16) % 3;
  return { bombo, hat, nota, melodia };
}

type Loop = { titulo: string; dibujar: (ctx: CanvasRenderingContext2D, w: number, h: number, ms: number) => void };

// ---------- Audioreactiva ----------
const tunel: Loop = { titulo: 'EN VIVO · ESTACIÓN AUDIOREACTIVA', dibujar: (ctx, w, h, ms) => dibujarC3(ctx, w, h, c3EnTiempo(ms)) };

// Red de celdas que late: el bombo infla las celdas en una onda, el hi-hat enciende algunas y la melodía pone el color.
const red: Loop = {
  titulo: 'EN VIVO · ESTACIÓN AUDIOREACTIVA',
  dibujar: (ctx, w, h, ms) => {
    const p = pulso(ms), cols = 9, filas = Math.max(3, Math.round(cols * h / w)), c = w / cols, f = h / filas;
    ctx.fillStyle = H; ctx.fillRect(0, 0, w, h);
    const color = VIVOS[(p.melodia * 7) % VIVOS.length];
    for (let j = 0; j < filas; j++) for (let i = 0; i < cols; i++) {
      const d = Math.hypot(i - (cols - 1) / 2, j - (filas - 1) / 2), onda = Math.sin(ms / 300 - d * 0.9) * 0.5 + 0.5;
      const k = 0.42 + 0.48 * onda * (0.6 + 0.4 * p.bombo);
      const s = Math.sin(i * 127.1 + j * 311.7 + Math.floor(ms / 250) * 74.7) * 43758.5453, luz = s - Math.floor(s) < 0.12 * p.hat;
      const x = i * c + c / 2, y = j * f + f / 2, lado = Math.min(c, f) * k;
      ctx.save(); ctx.translate(x, y); ctx.rotate((i + j) % 2 ? onda * 0.6 : -onda * 0.6);
      ctx.fillStyle = luz ? AMARILLO : (i + j) % 2 ? color : AZUL;
      ctx.fillRect(-lado / 2, -lado / 2, lado, lado);
      ctx.strokeStyle = N; ctx.lineWidth = Math.max(1, lado * 0.06); ctx.strokeRect(-lado / 2, -lado / 2, lado, lado);
      ctx.restore();
    }
  },
};

// Caleidoscopio: triángulos reflejados que giran con el bombo y cambian de color con la melodía.
const caleidoscopio: Loop = {
  titulo: 'EN VIVO · ESTACIÓN AUDIOREACTIVA',
  dibujar: (ctx, w, h, ms) => {
    const p = pulso(ms), r = Math.hypot(w, h) / 2, n = 12;
    ctx.fillStyle = N; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(ms / 4000);
    for (let anillo = 4; anillo >= 1; anillo--) {
      const ra = r * anillo / 4 * (1 + p.bombo * 0.06), col = VIVOS[(p.melodia + anillo * 2) % VIVOS.length];
      for (let k = 0; k < n; k++) {
        const a0 = k * Math.PI * 2 / n, a1 = (k + 1) * Math.PI * 2 / n, am = (a0 + a1) / 2 + (k % 2 ? 1 : -1) * Math.sin(ms / 700 + anillo) * 0.12;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a0) * ra, Math.sin(a0) * ra); ctx.lineTo(Math.cos(am) * ra * 0.82, Math.sin(am) * ra * 0.82); ctx.lineTo(Math.cos(a1) * ra, Math.sin(a1) * ra); ctx.closePath();
        ctx.fillStyle = k % 2 ? col : (anillo % 2 ? H : AZUL); ctx.fill();
        ctx.strokeStyle = N; ctx.lineWidth = Math.max(1, r * 0.008); ctx.stroke();
      }
    }
    ctx.fillStyle = AMARILLO; ctx.beginPath(); ctx.arc(0, 0, r * (0.06 + 0.04 * p.bombo), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
};

// ---------- Teatro de Papel ----------
// Pieza de papel: silueta hueso alrededor (el borde recortado) y la pieza encima, meciéndose desde su base.
const siluetas = new Map<string, HTMLCanvasElement>();
function silueta(im: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const llave = `${im.src}|${Math.round(w)}x${Math.round(h)}`;
  let c = siluetas.get(llave);
  if (!c) {
    c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    const x = c.getContext('2d')!; x.drawImage(im, 0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = H; x.fillRect(0, 0, c.width, c.height);
    if (siluetas.size > 60) siluetas.clear();
    siluetas.set(llave, c);
  }
  return c;
}
function pieza(ctx: CanvasRenderingContext2D, src: string, x: number, base: number, alto: number, giro: number) {
  const im = imagen(src); if (!im) return;
  const w = alto * (im.naturalWidth / im.naturalHeight || 1), b = Math.max(1.5, alto * 0.025);
  ctx.save(); ctx.translate(x, base); ctx.rotate(giro);
  const s = silueta(im, w, alto);
  ctx.globalAlpha = 0.25; ctx.drawImage(s, -w / 2 + b * 1.5, -alto + b * 1.5); ctx.globalAlpha = 1; // sombra sobre el telón
  for (let a = 0; a < 8; a++) ctx.drawImage(s, -w / 2 + Math.cos(a * Math.PI / 4) * b, -alto + Math.sin(a * Math.PI / 4) * b);
  ctx.drawImage(raster(im, w, alto), -w / 2, -alto);
  ctx.restore();
}
// Cerros o dunas de papel que avanzan lento (parallax), con el borde recortado hueso.
function lomas(ctx: CanvasRenderingContext2D, w: number, h: number, y: number, amp: number, largo: number, corre: number, color: string) {
  ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w + 4; x += 4) ctx.lineTo(x, y + Math.sin((x + corre) / largo) * amp + Math.sin((x + corre) / (largo * 0.37)) * amp * 0.3);
  ctx.lineTo(w, h); ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = H; ctx.lineWidth = Math.max(2, h * 0.014); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.stroke();
}
// Marco del teatro: telones a los lados, bambalina festoneada arriba y tablas abajo.
function teatro(ctx: CanvasRenderingContext2D, w: number, h: number, ms: number) {
  const t = w * 0.07, mece = Math.sin(ms / 900) * w * 0.004;
  ctx.fillStyle = '#A81E3A';
  for (const lado of [0, 1]) {
    ctx.beginPath();
    const x0 = lado ? w : 0, d = lado ? -1 : 1;
    ctx.moveTo(x0, 0); ctx.lineTo(x0 + d * t, 0); ctx.quadraticCurveTo(x0 + d * (t * 0.55 + mece), h * 0.5, x0 + d * t * 1.1, h); ctx.lineTo(x0, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = Math.max(1, w * 0.004);
    for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x0 + d * t * k / 3, 0); ctx.quadraticCurveTo(x0 + d * (t * k / 3 * 0.6 + mece), h * 0.5, x0 + d * t * k / 3, h); ctx.stroke(); }
  }
  const alto = h * 0.11, n = 9;
  ctx.fillStyle = MORADO; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, alto * 0.6);
  for (let k = n; k > 0; k--) ctx.quadraticCurveTo(w * (k - 0.5) / n, alto * 1.25, w * (k - 1) / n, alto * 0.6);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = AMARILLO; ctx.lineWidth = Math.max(1, h * 0.012); ctx.beginPath(); ctx.moveTo(0, alto * 0.35); ctx.lineTo(w, alto * 0.35); ctx.stroke();
  ctx.fillStyle = '#8A5A33'; ctx.fillRect(0, h * 0.94, w, h * 0.06); ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < w; x += w / 12) ctx.fillRect(x, h * 0.94, 1, h * 0.06);
}
// Pájaro de papel que cruza aleteando.
function pajaro(ctx: CanvasRenderingContext2D, x: number, y: number, tam: number, ms: number) {
  const ala = Math.sin(ms / 120) * tam * 0.8;
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(0, 0, tam, tam * 0.45, 0, 0, Math.PI * 2); ctx.fillStyle = N; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-tam * 0.3, 0); ctx.lineTo(tam * 0.1, -ala); ctx.lineTo(tam * 0.5, 0); ctx.closePath(); ctx.fillStyle = ROSA; ctx.fill();
  ctx.strokeStyle = H; ctx.lineWidth = Math.max(1, tam * 0.15); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tam, -tam * 0.1); ctx.lineTo(tam * 1.5, tam * 0.05); ctx.lineTo(tam, tam * 0.15); ctx.closePath(); ctx.fillStyle = AMARILLO; ctx.fill();
  ctx.restore();
}

const bosque: Loop = {
  titulo: 'EN VIVO · TEATRO DE PAPEL',
  dibujar: (ctx, w, h, ms) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, CELESTE); g.addColorStop(1, H);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const sol = imagen(PIEZAS_TEATRO.sol);
    if (sol) { const l = h * 0.32; ctx.save(); ctx.translate(w * 0.72, h * 0.3); ctx.rotate(ms / 6000); ctx.drawImage(raster(sol, l, l), -l / 2, -l / 2); ctx.restore(); }
    lomas(ctx, w, h, h * 0.62, h * 0.05, w * 0.14, ms * 0.01, '#7CC796');
    pieza(ctx, PIEZAS_TEATRO.araucaria, w * 0.3, h * 0.8, h * 0.5, Math.sin(ms / 1400) * 0.035);
    lomas(ctx, w, h, h * 0.76, h * 0.04, w * 0.1, ms * 0.02, VERDE);
    pieza(ctx, PIEZAS_TEATRO.araucaria, w * 0.66, h * 0.92, h * 0.6, Math.sin(ms / 1600 + 1) * 0.03);
    pieza(ctx, PIEZAS_TEATRO.helecho, w * 0.47, h * 0.93, h * 0.3, Math.sin(ms / 800) * 0.08);
    const vuelo = (ms % 6000) / 6000;
    pajaro(ctx, -w * 0.1 + vuelo * w * 1.2, h * (0.32 + Math.sin(vuelo * Math.PI * 3) * 0.05), h * 0.035, ms);
    teatro(ctx, w, h, ms);
  },
};

const desierto: Loop = {
  titulo: 'EN VIVO · TEATRO DE PAPEL',
  dibujar: (ctx, w, h, ms) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, LAPIS); g.addColorStop(0.7, MORADO); g.addColorStop(1, ROSA);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 18; k++) { // estrellas que titilan
      const s = Math.sin(k * 91.7) * 1e4, x = (s - Math.floor(s)) * w, y = ((k * 37) % 50) / 100 * h + h * 0.12, b = 0.5 + 0.5 * Math.sin(ms / 400 + k);
      ctx.fillStyle = `rgba(244,238,227,${0.3 + 0.7 * b})`; ctx.fillRect(x, y, Math.max(1.5, h * 0.012), Math.max(1.5, h * 0.012));
    }
    const lx = w * 0.28, ly = h * 0.3, lr = h * 0.1; // luna de papel
    ctx.fillStyle = H; ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(122,46,142,.25)'; ctx.beginPath(); ctx.arc(lx - lr * 0.3, ly - lr * 0.2, lr * 0.22, 0, Math.PI * 2); ctx.arc(lx + lr * 0.35, ly + lr * 0.3, lr * 0.15, 0, Math.PI * 2); ctx.fill();
    lomas(ctx, w, h, h * 0.66, h * 0.05, w * 0.18, ms * 0.012, '#E8B04A');
    pieza(ctx, PIEZAS_TEATRO.quisco, w * 0.62, h * 0.82, h * 0.42, Math.sin(ms / 1500) * 0.03);
    lomas(ctx, w, h, h * 0.8, h * 0.035, w * 0.12, ms * 0.024, AMARILLO);
    const abre = 0.85 + 0.15 * Math.sin(ms / 500);
    pieza(ctx, PIEZAS_TEATRO.flor, w * 0.38, h * 0.93, h * 0.22 * abre, Math.sin(ms / 700) * 0.06);
    pieza(ctx, PIEZAS_TEATRO.quisco, w * 0.8, h * 0.95, h * 0.24, Math.sin(ms / 1100 + 2) * 0.04);
    const fugaz = (ms % 9000) / 1200; // estrella fugaz de vez en cuando
    if (fugaz < 1) { ctx.strokeStyle = H; ctx.lineWidth = Math.max(1, h * 0.01); ctx.beginPath(); ctx.moveTo(w * (0.5 + fugaz * 0.4), h * (0.1 + fugaz * 0.15)); ctx.lineTo(w * (0.44 + fugaz * 0.4), h * (0.07 + fugaz * 0.15)); ctx.stroke(); }
    teatro(ctx, w, h, ms);
  },
};

const ROTACION: Loop[] = [tunel, bosque, red, desierto, caleidoscopio];

/** Dibuja «En vivo» en w × h. `ms` anima los loops; `reloj` decide qué loop va (con movimiento reducido, `ms` queda
 * fijo y la rotación sigue con `reloj`). Devuelve el título que va bajo la pantalla. */
export function dibujarEnVivo(ctx: CanvasRenderingContext2D, w: number, h: number, ms: number, reloj: number): string {
  const n = Math.floor(reloj / CADA), dentro = reloj - n * CADA;
  const actual = ROTACION[n % ROTACION.length], antes = ROTACION[(n + ROTACION.length - 1) % ROTACION.length];
  const corte = n > 0 && dentro < BARRIDO ? w * (1 - Math.pow(1 - dentro / BARRIDO, 3)) : w;
  if (corte < w) { ctx.save(); ctx.beginPath(); ctx.rect(corte, 0, w - corte, h); ctx.clip(); antes.dibujar(ctx, w, h, ms); ctx.restore(); }
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, corte, h); ctx.clip(); actual.dibujar(ctx, w, h, ms); ctx.restore();
  if (corte < w) { ctx.fillStyle = AMARILLO; ctx.fillRect(corte - 2, 0, 4, h); }
  // marca «● EN VIVO» en la esquina
  const t = Math.max(9, h * 0.07), pad = t * 0.5;
  ctx.font = `800 ${t}px "DM Sans", sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const ancho = ctx.measureText('EN VIVO').width + t * 1.6 + pad;
  ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(pad, pad, ancho, t * 1.6);
  ctx.fillStyle = `rgba(226,0,26,${0.55 + 0.45 * Math.abs(Math.sin(reloj / 600))})`; ctx.beginPath(); ctx.arc(pad + t * 0.8, pad + t * 0.8, t * 0.32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = H; ctx.fillText('EN VIVO', pad + t * 1.4, pad + t * 0.85);
  return (corte < w * 0.5 ? antes : actual).titulo;
}
