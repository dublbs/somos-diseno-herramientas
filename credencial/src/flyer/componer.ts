import type { Visual } from '../../../shared/marcos';

// «Tu flyer» (plan 012 §8): el cierre del recorrido. Se compone un flyer 1080 × 1350 con lo que la persona juntó
// (creaciones de las tablets, un afiche de la cacería y su personaje), una frase de la campaña y la franja negra común
// de las tarjetas. Todo sale de una semilla: «Mezclar» cambia la semilla y lo que se exporta es igual a lo que se ve.

export const FLYER = { ancho: 1080, alto: 1350, cuerpo: 1080 };
export const FRASES = ['Somos Diseño', 'Yo diseño', 'Hecho a mano', 'Ven a crear', 'Línea azul', 'Diseño en la calle'] as const;

export interface PiezaFlyer {
  tipo: 'creacion' | 'afiche';
  img: HTMLImageElement | null; // null: la experiencia no manda miniatura (Audio, Teatro): se dibuja una ficha
  etiqueta: string; // nombre de la experiencia o del afiche
}
export interface DatosFlyer {
  lenguaje: Visual;
  piezas: PiezaFlyer[]; // hasta 3 creaciones y 1 afiche
  personaje: HTMLImageElement | null;
  troquelado: boolean; // el personaje ya trae su borde de sticker (Pixel y Geométrica); si no, se le pone uno
  frase: string;
  nombre: string;
  semilla: number;
}

// ---------- azar con semilla (mulberry32) ----------
type Azar = () => number;
function azar(semilla: number): Azar {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const entre = (r: Azar, a: number, b: number) => a + r() * (b - a);
const elegir = <T,>(r: Azar, l: readonly T[]) => l[Math.floor(r() * l.length) % l.length];
function barajar<T>(r: Azar, l: readonly T[]): T[] {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
  return c;
}
export const semillaNueva = () => Math.floor(Math.random() * 2 ** 31);

// ---------- paleta Línea azul ----------
const C = { hueso: '#F4EEE3', negro: '#000000', azul: '#0062B8', lapis: '#2B4BD8', celeste: '#7FC8F8', amarillo: '#FFC20E', verde: '#00A651', rosa: '#FF8FB1', morado: '#7A2E8E', blanco: '#FFFFFF' };
interface Paleta { fondo: string; tinta: string; acentos: string[]; papel: string; sombra: string }
const PALETAS: Record<Visual, Paleta[]> = {
  Pixel: [
    { fondo: C.lapis, tinta: C.hueso, acentos: [C.amarillo, C.rosa, C.celeste], papel: C.hueso, sombra: C.negro },
    { fondo: C.negro, tinta: C.hueso, acentos: [C.amarillo, C.verde, C.rosa], papel: C.hueso, sombra: C.morado },
    { fondo: C.morado, tinta: C.hueso, acentos: [C.amarillo, C.celeste, C.rosa], papel: C.hueso, sombra: C.negro },
    { fondo: C.celeste, tinta: C.negro, acentos: [C.lapis, C.rosa, C.amarillo], papel: C.hueso, sombra: C.negro },
  ],
  Geométrica: [
    { fondo: C.hueso, tinta: C.negro, acentos: [C.azul, C.amarillo, C.rosa, C.verde], papel: C.blanco, sombra: C.negro },
    { fondo: C.azul, tinta: C.hueso, acentos: [C.amarillo, C.celeste, C.rosa], papel: C.hueso, sombra: C.negro },
    { fondo: C.amarillo, tinta: C.negro, acentos: [C.lapis, C.rosa, C.negro, C.hueso], papel: C.hueso, sombra: C.negro },
    { fondo: C.negro, tinta: C.hueso, acentos: [C.verde, C.amarillo, C.celeste, C.rosa], papel: C.hueso, sombra: C.hueso },
  ],
  Orgánica: [
    { fondo: C.hueso, tinta: C.negro, acentos: [C.verde, C.rosa, C.azul, C.amarillo], papel: C.blanco, sombra: 'rgba(40,30,10,.32)' },
    { fondo: C.rosa, tinta: C.negro, acentos: [C.morado, C.amarillo, C.verde, C.hueso], papel: C.blanco, sombra: 'rgba(60,10,40,.34)' },
    { fondo: C.verde, tinta: C.hueso, acentos: [C.amarillo, C.hueso, C.rosa, C.azul], papel: C.blanco, sombra: 'rgba(0,30,10,.4)' },
    { fondo: C.celeste, tinta: C.negro, acentos: [C.azul, C.amarillo, C.rosa, C.verde], papel: C.blanco, sombra: 'rgba(0,30,60,.34)' },
  ],
};

// ---------- tipografía ----------
const FUENTE: Record<Visual, (px: number) => string> = {
  Pixel: px => `700 ${px}px "Silkscreen", monospace`,
  Geométrica: px => `800 ${px}px "Bricolage Grotesque", system-ui, sans-serif`,
  Orgánica: px => `800 ${px}px "Bricolage Grotesque", system-ui, sans-serif`,
};
export async function cargarFuentes() {
  try {
    await Promise.all([
      document.fonts.load('700 60px "Silkscreen"'), document.fonts.load('800 60px "Bricolage Grotesque"'),
      document.fonts.load('600 30px "Bricolage Grotesque"'), document.fonts.load('500 26px "DM Sans"'), document.fonts.load('700 26px "DM Sans"'),
    ]);
  } catch { /* fuentes de respaldo */ }
}

// Parte el texto en líneas (a lo más maxLineas) y busca el tamaño más grande que cabe en la caja.
function ajustar(ctx: CanvasRenderingContext2D, texto: string, fuente: (px: number) => string, w: number, h: number, maxPx: number, interlinea: number, maxLineas = 3) {
  const palabras = texto.split(/\s+/).filter(Boolean);
  for (let px = maxPx; px >= 28; px -= 4) {
    ctx.font = fuente(px);
    const lineas: string[] = [];
    let actual = '';
    for (const p of palabras) {
      const prueba = actual ? actual + ' ' + p : p;
      if (!actual || ctx.measureText(prueba).width <= w) actual = prueba;
      else { lineas.push(actual); actual = p; }
    }
    if (actual) lineas.push(actual);
    const ancho = Math.max(...lineas.map(l => ctx.measureText(l).width));
    if (lineas.length <= maxLineas && ancho <= w && lineas.length * px * interlinea <= h) return { lineas, px, ancho };
  }
  ctx.font = fuente(28);
  return { lineas: [texto], px: 28, ancho: ctx.measureText(texto).width };
}

// ---------- composición ----------
interface Caja { x: number; y: number; w: number; h: number }
const M = 60; // margen

// Tres zonas que no se pisan: el titular, el personaje (al lado del titular) y las piezas.
function plan(r: Azar, k: number) {
  const altoTit = k <= 1 ? 400 : k === 2 ? 380 : k === 3 ? 350 : 320;
  const arriba = r() < 0.5, izquierda = r() < 0.5, anchoPj = 330, sep = 30;
  const yBanda = arriba ? M : FLYER.cuerpo - M - altoTit;
  const titulo: Caja = { x: izquierda ? M + anchoPj + sep : M, y: yBanda, w: 960 - anchoPj - sep, h: altoTit };
  // Abajo, el personaje queda parado sobre la franja negra.
  const personaje: Caja = { x: izquierda ? M - 10 : M + 960 - anchoPj + 10, y: yBanda - 10, w: anchoPj, h: arriba ? altoTit + 20 : altoTit + M + 10 };
  const yPiezas = arriba ? M + altoTit + 44 : M;
  const piezas: Caja = { x: M, y: yPiezas, w: 960, h: FLYER.cuerpo - 2 * M - altoTit - 44 };
  return { titulo, personaje, piezas, arriba, izquierda };
}

// Reparte k piezas en la zona, con varias formas para cada cantidad.
function repartir(r: Azar, k: number, R: Caja): Caja[] {
  const g = 32;
  const col = (x: number, w: number, y = R.y, h = R.h): Caja => ({ x, y, w, h });
  if (k <= 1) return [{ x: R.x + 60, y: R.y, w: R.w - 120, h: R.h }];
  if (k === 2) {
    if (r() < 0.5) { const w = (R.w - g) / 2; return [col(R.x, w), col(R.x + w + g, w)]; }
    const w1 = (R.w - g) * 0.58, w2 = R.w - g - w1, h2 = R.h * 0.78, abajo = r() < 0.5;
    return [col(R.x, w1), col(R.x + w1 + g, w2, abajo ? R.y + R.h - h2 : R.y, h2)];
  }
  if (k === 3) {
    if (r() < 0.5) { const w = (R.w - 2 * g) / 3; return [0, 1, 2].map(i => col(R.x + i * (w + g), w, R.y + (i % 2 ? R.h * 0.1 : 0), R.h * 0.9)); }
    const w1 = (R.w - g) * 0.56, w2 = R.w - g - w1, h = (R.h - g) / 2, grandeIzq = r() < 0.5;
    const xg = grandeIzq ? R.x : R.x + w2 + g, xc = grandeIzq ? R.x + w1 + g : R.x;
    return [col(xg, w1), col(xc, w2, R.y, h), col(xc, w2, R.y + h + g, h)];
  }
  if (r() < 0.5) { const w = (R.w - g) / 2, h = (R.h - g) / 2; return [col(R.x, w, R.y, h), col(R.x + w + g, w, R.y, h), col(R.x, w, R.y + h + g, h), col(R.x + w + g, w, R.y + h + g, h)]; }
  const w1 = (R.w - g) * 0.5, w2 = R.w - g - w1, h = (R.h - g) / 2, w3 = (w2 - g) / 2;
  return [col(R.x, w1), col(R.x + w1 + g, w2, R.y, h), col(R.x + w1 + g, w3, R.y + h + g, h), col(R.x + w1 + 2 * g + w3, w3, R.y + h + g, h)];
}

// Tamaño de la imagen dentro de su espacio (sin pasar de 3 veces su tamaño: las miniaturas son chicas).
function medir(p: PiezaFlyer) {
  const iw = p.img ? p.img.naturalWidth || p.img.width || 200 : 200, ih = p.img ? p.img.naturalHeight || p.img.height || 200 : 200;
  return { iw, ih };
}
function encajar(iw: number, ih: number, w: number, h: number, entero = false) {
  let s = Math.min(w / iw, h / ih, 3);
  if (entero && s >= 2) s = Math.floor(s);
  return { w: Math.round(iw * s), h: Math.round(ih * s) };
}

// La ficha de una creación que no manda imagen (Audio, Teatro): el nombre y unas barras de ecualizador.
function ficha(ctx: CanvasRenderingContext2D, p: PiezaFlyer, x: number, y: number, w: number, h: number, fondo: string, tinta: string, lenguaje: Visual, r: Azar) {
  ctx.fillStyle = fondo; ctx.fillRect(x, y, w, h);
  const n = 7, bw = w / (n * 1.6), base = y + h * 0.72;
  ctx.fillStyle = tinta;
  for (let i = 0; i < n; i++) {
    const bh = h * entre(r, 0.12, 0.5), bx = x + w * 0.12 + i * bw * 1.55;
    if (lenguaje === 'Orgánica') { ctx.beginPath(); ctx.roundRect(bx, base - bh, bw, bh, bw / 2); ctx.fill(); } else ctx.fillRect(Math.round(bx), Math.round(base - bh), Math.round(bw), Math.round(bh));
  }
  const t = ajustar(ctx, lenguaje === 'Orgánica' ? p.etiqueta : p.etiqueta.toUpperCase(), FUENTE[lenguaje], w * 0.8, h * 0.18, 44, 1, 1);
  ctx.font = FUENTE[lenguaje](t.px); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(t.lineas[0], x + w / 2, y + h * 0.9);
  ctx.textAlign = 'left';
}

function pintarImagen(ctx: CanvasRenderingContext2D, p: PiezaFlyer, x: number, y: number, w: number, h: number, pal: Paleta, color: string, lenguaje: Visual, r: Azar) {
  if (!p.img) { ficha(ctx, p, x, y, w, h, color, lenguaje === 'Pixel' ? C.negro : pal.tinta === C.negro || color === C.hueso || color === C.amarillo || color === C.celeste ? C.negro : C.hueso, lenguaje, r); return; }
  ctx.imageSmoothingEnabled = lenguaje !== 'Pixel';
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(p.img, x, y, w, h);
  ctx.imageSmoothingEnabled = true;
}

// Silueta de un color (para el borde de sticker).
function silueta(img: CanvasImageSource, w: number, h: number, color: string) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  const x = c.getContext('2d')!;
  x.drawImage(img, 0, 0, c.width, c.height);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  return c;
}

// El personaje entero, apoyado abajo en su caja.
function pintarPersonaje(ctx: CanvasRenderingContext2D, d: DatosFlyer, caja: Caja, pal: Paleta, r: Azar) {
  const im = d.personaje;
  if (!im) return;
  const iw = im.naturalWidth || 240, ih = im.naturalHeight || 240;
  const s = Math.min(caja.w / iw, caja.h / ih);
  const w = iw * s, h = ih * s, x = caja.x + (caja.w - w) / 2, y = caja.y + caja.h - h;
  ctx.save();
  if (d.lenguaje === 'Geométrica') {
    // detrás, un disco plano del acento
    const lado = Math.min(caja.w, caja.h) * 0.92;
    ctx.fillStyle = elegir(r, pal.acentos.filter(a => a !== pal.fondo));
    ctx.beginPath(); ctx.arc(caja.x + caja.w / 2, y + h - lado / 2, lado / 2, 0, Math.PI * 2); ctx.fill();
  }
  if (d.lenguaje === 'Pixel') {
    ctx.imageSmoothingEnabled = false;
    const sil = silueta(im, w, h, pal.sombra);
    ctx.drawImage(sil, Math.round(x + 14), Math.round(y + 14));
  }
  if (!d.troquelado) {
    // borde de sticker recortado (Orgánica): la silueta en blanco alrededor
    const sil = silueta(im, w, h, C.blanco);
    if (d.lenguaje === 'Orgánica') { ctx.shadowColor = pal.sombra; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12; }
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; ctx.drawImage(sil, x + Math.cos(a) * 12, y + Math.sin(a) * 12); }
    ctx.shadowColor = 'transparent';
  } else if (d.lenguaje === 'Orgánica') { ctx.shadowColor = pal.sombra; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12; }
  ctx.drawImage(im, x, y, w, h);
  ctx.restore();
}

// ---------- Pixel: bloques, contornos y ventanas ----------
function pixelFondo(ctx: CanvasRenderingContext2D, pal: Paleta, r: Azar) {
  ctx.fillStyle = pal.fondo; ctx.fillRect(0, 0, FLYER.ancho, FLYER.cuerpo);
  ctx.fillStyle = pal.tinta; ctx.globalAlpha = 0.14;
  for (let y = 18; y < FLYER.cuerpo; y += 36) for (let x = 18; x < FLYER.ancho; x += 36) ctx.fillRect(x - 3, y - 3, 6, 6);
  ctx.globalAlpha = 1;
  // Escaleras de bloques en dos esquinas opuestas
  const b = 36, esquinas = barajar(r, [[0, 0, 1, 1], [1, 0, -1, 1], [0, 1, 1, -1], [1, 1, -1, -1]]).slice(0, 2);
  esquinas.forEach(([ex, ey, dx, dy], i) => {
    ctx.fillStyle = pal.acentos[i % pal.acentos.length];
    const n = 4 + Math.floor(r() * 3);
    for (let f = 0; f < n; f++) for (let c = 0; c < n - f; c++) {
      const x = ex * FLYER.ancho + dx * c * b - (dx < 0 ? b : 0), y = ey * FLYER.cuerpo + dy * f * b - (dy < 0 ? b : 0);
      ctx.fillRect(x, y, b, b);
    }
  });
}
function pixelChispa(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x - t / 2, y - 2.5 * t, t, 5 * t); ctx.fillRect(x - 2.5 * t, y - t / 2, 5 * t, t);
}
function pixelVentana(ctx: CanvasRenderingContext2D, p: PiezaFlyer, s: Caja, pal: Paleta, color: string, r: Azar) {
  const b = 8, barra = 40, sombra = 16, { iw, ih } = medir(p);
  const { w, h } = encajar(iw, ih, s.w - 2 * b - sombra, s.h - 2 * b - barra - sombra, true);
  const W = w + 2 * b, H = h + 2 * b + barra;
  const x = Math.round((s.x + (s.w - sombra - W) / 2) / 4) * 4, y = Math.round((s.y + (s.h - sombra - H) / 2) / 4) * 4;
  ctx.fillStyle = pal.sombra; ctx.fillRect(x + sombra, y + sombra, W, H);
  ctx.fillStyle = C.negro; ctx.fillRect(x, y, W, H);
  ctx.fillStyle = color; ctx.fillRect(x + b, y + b, W - 2 * b, barra - b);
  for (let i = 0; i < 3; i++) { ctx.fillStyle = C.negro; ctx.fillRect(x + W - b - 22 - i * 22, y + b + 10, 14, 14); }
  ctx.fillStyle = C.negro;
  const t = ajustar(ctx, p.etiqueta.toUpperCase(), FUENTE.Pixel, W - 2 * b - 90, barra - 12, 20, 1, 1);
  ctx.font = FUENTE.Pixel(t.px); ctx.textBaseline = 'middle';
  ctx.fillText(t.lineas[0], x + b + 10, y + b + (barra - b) / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  pintarImagen(ctx, p, x + b, y + b + barra, w, h, pal, color, 'Pixel', r);
}
function pixelTitulo(ctx: CanvasRenderingContext2D, d: DatosFlyer, caja: Caja, pal: Paleta, r: Azar, resumen: string) {
  ctx.font = FUENTE.Pixel(22); ctx.fillStyle = pal.acentos[0]; ctx.textBaseline = 'top';
  ctx.fillText(resumen.toUpperCase(), caja.x, caja.y + 4);
  ctx.fillRect(caja.x, caja.y + 38, Math.min(caja.w, ctx.measureText(resumen.toUpperCase()).width), 6);
  const t = ajustar(ctx, d.frase.toUpperCase(), FUENTE.Pixel, caja.w, caja.h - 70, 150, 1.02);
  ctx.font = FUENTE.Pixel(t.px);
  const alto = t.lineas.length * t.px * 1.02, y0 = caja.y + 64 + (caja.h - 64 - alto) / 2;
  const desfase = Math.max(6, Math.round(t.px / 14));
  t.lineas.forEach((l, i) => {
    const y = y0 + i * t.px * 1.02;
    ctx.fillStyle = pal.sombra === pal.fondo ? pal.acentos[1] : pal.sombra; ctx.fillText(l, caja.x + desfase, y + desfase);
    ctx.fillStyle = i === t.lineas.length - 1 && r() < 0.6 ? pal.acentos[0] : pal.tinta; ctx.fillText(l, caja.x, y);
  });
  ctx.textBaseline = 'alphabetic';
}

// ---------- Geométrica: figuras planas sobre una grilla ----------
function geoFondo(ctx: CanvasRenderingContext2D, pal: Paleta, r: Azar) {
  ctx.fillStyle = pal.fondo; ctx.fillRect(0, 0, FLYER.ancho, FLYER.cuerpo);
  const m = 90, colores = barajar(r, pal.acentos);
  const figuras = barajar(r, ['circulo', 'media', 'cuarto', 'triangulo', 'franjas', 'puntos', 'rombo']).slice(0, 4);
  figuras.forEach((f, i) => {
    ctx.fillStyle = colores[i % colores.length];
    const gx = Math.floor(r() * 12) * m, gy = Math.floor(r() * 12) * m, giro = Math.floor(r() * 4) * Math.PI / 2;
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(giro);
    if (f === 'circulo') { ctx.beginPath(); ctx.arc(0, 0, m * entre(r, 1.6, 2.6), 0, Math.PI * 2); ctx.fill(); }
    else if (f === 'media') { ctx.beginPath(); ctx.arc(0, 0, m * 2.4, 0, Math.PI); ctx.fill(); }
    else if (f === 'cuarto') { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, m * 3.4, 0, Math.PI / 2); ctx.closePath(); ctx.fill(); }
    else if (f === 'triangulo') { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(m * 4, 0); ctx.lineTo(0, m * 4); ctx.closePath(); ctx.fill(); }
    else if (f === 'franjas') { for (let k = 0; k < 6; k++) ctx.fillRect(0, k * m * 0.5, m * 5, m * 0.25); }
    else if (f === 'puntos') { for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) { ctx.beginPath(); ctx.arc(a * 45, b * 45, 9, 0, Math.PI * 2); ctx.fill(); } }
    else { ctx.beginPath(); ctx.moveTo(0, -m * 1.6); ctx.lineTo(m * 1.6, 0); ctx.lineTo(0, m * 1.6); ctx.lineTo(-m * 1.6, 0); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  });
}
function geoPieza(ctx: CanvasRenderingContext2D, p: PiezaFlyer, s: Caja, pal: Paleta, color: string, r: Azar, circulo: boolean) {
  const b = 6, desfase = 20, { iw, ih } = medir(p);
  if (circulo) {
    const lado = Math.min(s.w, s.h) - desfase - 2 * b, cx = s.x + (s.w - desfase) / 2, cy = s.y + (s.h - desfase) / 2;
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx + desfase, cy + desfase, lado / 2 + b, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pal.tinta === C.hueso ? C.hueso : C.negro; ctx.beginPath(); ctx.arc(cx, cy, lado / 2 + b, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, lado / 2, 0, Math.PI * 2); ctx.clip();
    const k = Math.max(lado / iw, lado / ih);
    pintarImagen(ctx, p, cx - iw * k / 2, cy - ih * k / 2, iw * k, ih * k, pal, color, 'Geométrica', r);
    ctx.restore();
    return;
  }
  const { w, h } = encajar(iw, ih, s.w - 2 * b - desfase, s.h - 2 * b - desfase);
  const W = w + 2 * b, H = h + 2 * b, x = s.x + (s.w - desfase - W) / 2, y = s.y + (s.h - desfase - H) / 2;
  ctx.fillStyle = color; ctx.fillRect(x + desfase, y + desfase, W, H);
  ctx.fillStyle = pal.tinta === C.hueso ? C.hueso : C.negro; ctx.fillRect(x, y, W, H);
  pintarImagen(ctx, p, x + b, y + b, w, h, pal, color, 'Geométrica', r);
}
function geoTitulo(ctx: CanvasRenderingContext2D, d: DatosFlyer, caja: Caja, pal: Paleta, resumen: string) {
  // Un rectángulo del fondo detrás del texto: la figura de atrás nunca le quita lectura.
  const t = ajustar(ctx, d.frase.toUpperCase(), FUENTE.Geométrica, caja.w - 40, caja.h - 90, 190, 0.9);
  const alto = t.lineas.length * t.px * 0.9;
  ctx.fillStyle = pal.fondo; ctx.fillRect(caja.x - 20, caja.y - 10, t.ancho + 60, alto + 110);
  ctx.fillStyle = pal.acentos[0]; ctx.fillRect(caja.x, caja.y + 10, 120, 12);
  ctx.fillStyle = pal.tinta; ctx.font = '700 24px "DM Sans", sans-serif'; ctx.textBaseline = 'top';
  ctx.fillText(resumen.toUpperCase(), caja.x + 140, caja.y + 4);
  ctx.font = FUENTE.Geométrica(t.px); ctx.textBaseline = 'alphabetic';
  t.lineas.forEach((l, i) => ctx.fillText(l, caja.x, caja.y + 60 + (i + 0.8) * t.px * 0.9));
}

// ---------- Orgánica: recortes de papel ----------
// Contorno blando con algo de ruido, como papel cortado a tijera.
function mancha(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, r: Azar, puntos = 9, ruido = 0.22) {
  const p = Array.from({ length: puntos }, (_, i) => {
    const a = (i / puntos) * Math.PI * 2, k = 1 + entre(r, -ruido, ruido);
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
  ctx.beginPath();
  const medio = (i: number) => [(p[i][0] + p[(i + 1) % puntos][0]) / 2, (p[i][1] + p[(i + 1) % puntos][1]) / 2];
  const ini = medio(puntos - 1);
  ctx.moveTo(ini[0], ini[1]);
  for (let i = 0; i < puntos; i++) { const m = medio(i); ctx.quadraticCurveTo(p[i][0], p[i][1], m[0], m[1]); }
  ctx.closePath();
}
// Rectángulo con el borde apenas irregular (papel rasgado).
function papel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: Azar, ruido = 3) {
  ctx.beginPath();
  const paso = 26, borde = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / paso));
    for (let i = 1; i <= n; i++) ctx.lineTo(x0 + (x1 - x0) * i / n + entre(r, -ruido, ruido), y0 + (y1 - y0) * i / n + entre(r, -ruido, ruido));
  };
  ctx.moveTo(x, y); borde(x, y, x + w, y); borde(x + w, y, x + w, y + h); borde(x + w, y + h, x, y + h); borde(x, y + h, x, y);
  ctx.closePath();
}
function hoja(ctx: CanvasRenderingContext2D, x: number, y: number, largo: number, giro: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(giro); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(largo * 0.5, -largo * 0.32, largo, 0); ctx.quadraticCurveTo(largo * 0.5, largo * 0.32, 0, 0); ctx.fill();
  ctx.restore();
}
function orgFondo(ctx: CanvasRenderingContext2D, pal: Paleta, r: Azar) {
  ctx.fillStyle = pal.fondo; ctx.fillRect(0, 0, FLYER.ancho, FLYER.cuerpo);
  // grano del papel
  ctx.fillStyle = pal.tinta; ctx.globalAlpha = 0.05;
  for (let i = 0; i < 2600; i++) ctx.fillRect(r() * FLYER.ancho, r() * FLYER.cuerpo, 2, 2);
  ctx.globalAlpha = 1;
  const colores = barajar(r, pal.acentos.filter(a => a !== pal.fondo));
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.shadowColor = pal.sombra; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    ctx.fillStyle = colores[i % colores.length];
    const borde = r() < 0.75; // casi siempre asomando por un borde
    const cx = borde ? (r() < 0.5 ? entre(r, -60, 200) : entre(r, 880, 1140)) : entre(r, 200, 880);
    mancha(ctx, cx, entre(r, 0, FLYER.cuerpo), entre(r, 170, 320), entre(r, 150, 290), r);
    ctx.fill(); ctx.restore();
  }
  for (let i = 0; i < 5; i++) hoja(ctx, entre(r, 0, FLYER.ancho), entre(r, 0, FLYER.cuerpo), entre(r, 90, 170), entre(r, 0, Math.PI * 2), colores[(i + 1) % colores.length]);
}
function orgPolaroid(ctx: CanvasRenderingContext2D, p: PiezaFlyer, s: Caja, pal: Paleta, color: string, r: Azar) {
  const lado = 18, pie = 62, { iw, ih } = medir(p);
  const { w, h } = encajar(iw, ih, s.w * 0.88 - 2 * lado, s.h * 0.88 - lado - pie);
  const W = w + 2 * lado, H = h + lado + pie;
  const cx = s.x + s.w / 2 + entre(r, -12, 12), cy = s.y + s.h / 2 + entre(r, -12, 12), giro = entre(r, -7, 7) * Math.PI / 180;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(giro);
  ctx.shadowColor = pal.sombra; ctx.shadowBlur = 28; ctx.shadowOffsetY = 14;
  ctx.fillStyle = pal.papel; papel(ctx, -W / 2, -H / 2, W, H, r); ctx.fill();
  ctx.shadowColor = 'transparent';
  pintarImagen(ctx, p, -W / 2 + lado, -H / 2 + lado, w, h, pal, color, 'Orgánica', r);
  ctx.fillStyle = C.negro;
  const t = ajustar(ctx, p.etiqueta, px => `600 ${px}px "Bricolage Grotesque", sans-serif`, W - 2 * lado, pie - 20, 30, 1, 1);
  ctx.font = `600 ${t.px}px "Bricolage Grotesque", sans-serif`; ctx.textBaseline = 'middle';
  ctx.fillText(t.lineas[0], -W / 2 + lado, H / 2 - pie / 2);
  ctx.textBaseline = 'alphabetic';
  // cinta de papel arriba
  ctx.rotate(entre(r, -0.18, 0.18));
  ctx.globalAlpha = 0.78; ctx.fillStyle = color; papel(ctx, -60, -H / 2 - 22, 120, 40, r, 2); ctx.fill();
  ctx.restore();
}
function orgTitulo(ctx: CanvasRenderingContext2D, d: DatosFlyer, caja: Caja, pal: Paleta, r: Azar, resumen: string) {
  const t = ajustar(ctx, d.frase, FUENTE.Orgánica, caja.w - 70, caja.h - 120, 170, 0.98);
  const alto = t.lineas.length * t.px * 0.98;
  const etiqueta = pal.fondo === C.hueso ? C.negro : C.hueso, texto = etiqueta === C.negro ? C.hueso : C.negro;
  ctx.save();
  ctx.translate(caja.x + 10, caja.y + (caja.h - alto - 100) / 2);
  ctx.rotate(entre(r, -2.5, 1.5) * Math.PI / 180);
  ctx.shadowColor = pal.sombra; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  ctx.fillStyle = etiqueta; papel(ctx, -24, 40, t.ancho + 60, alto + 50, r, 5); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = texto; ctx.font = FUENTE.Orgánica(t.px);
  t.lineas.forEach((l, i) => ctx.fillText(l, 6, 40 + 18 + (i + 0.8) * t.px * 0.98));
  ctx.fillStyle = pal.tinta; ctx.font = '600 28px "Bricolage Grotesque", sans-serif';
  ctx.fillText(resumen, 0, 22);
  ctx.restore();
}

// ---------- franja común ----------
function franja(ctx: CanvasRenderingContext2D, d: DatosFlyer) {
  const y0 = FLYER.cuerpo;
  ctx.fillStyle = C.negro; ctx.fillRect(0, y0, FLYER.ancho, FLYER.alto - y0);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#BDB6AA'; ctx.font = '500 26px "DM Sans", sans-serif';
  ctx.fillText('Flyer de', 56, 1150);
  const fuente = d.lenguaje === 'Pixel' ? (px: number) => `700 ${px}px "Silkscreen", monospace` : (px: number) => `800 ${px}px "Bricolage Grotesque", sans-serif`;
  const t = ajustar(ctx, d.lenguaje === 'Geométrica' || d.lenguaje === 'Pixel' ? d.nombre.toUpperCase() : d.nombre, fuente, 520, 80, d.lenguaje === 'Pixel' ? 58 : 72, 1, 1);
  ctx.fillStyle = C.hueso; ctx.font = fuente(t.px);
  ctx.fillText(t.lineas[0], 56, 1244);
  ctx.textAlign = 'right'; ctx.font = '500 26px "DM Sans", sans-serif'; ctx.fillStyle = '#BDB6AA';
  ctx.fillText('Somos Diseño · Semana del Diseño 2026', 1024, 1164);
  ctx.fillText(`Lenguaje ${d.lenguaje}`, 1024, 1204);
  ctx.fillStyle = C.hueso; ctx.font = '700 26px "DM Sans", sans-serif';
  ctx.fillText('INACAP Santiago Centro', 1024, 1244);
  ctx.textAlign = 'left';
}

export function resumenPiezas(piezas: PiezaFlyer[]) {
  const c = piezas.filter(p => p.tipo === 'creacion').length, a = piezas.filter(p => p.tipo === 'afiche').length;
  const partes = [c ? `${c} ${c === 1 ? 'creación' : 'creaciones'}` : '', a ? `${a} afiche` : ''].filter(Boolean);
  return partes.length ? `Hecho con ${partes.join(' y ')}` : 'Hecho en la Semana del Diseño';
}

// Dibuja el flyer completo en un lienzo de 1080 × 1350 (o escalado con `escala`).
export function pintarFlyer(ctx: CanvasRenderingContext2D, d: DatosFlyer, escala = 1) {
  const r = azar(d.semilla * 7 + (d.lenguaje === 'Pixel' ? 1 : d.lenguaje === 'Geométrica' ? 2 : 3));
  const pal = elegir(r, PALETAS[d.lenguaje]);
  ctx.save();
  ctx.setTransform(escala, 0, 0, escala, 0, 0);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const k = Math.max(1, d.piezas.length), zonas = plan(r, k);
  const resumen = resumenPiezas(d.piezas);
  if (d.lenguaje === 'Pixel') pixelFondo(ctx, pal, r);
  else if (d.lenguaje === 'Geométrica') geoFondo(ctx, pal, r);
  else orgFondo(ctx, pal, r);

  const cajas = repartir(r, d.piezas.length, zonas.piezas);
  const orden = barajar(r, d.piezas);
  const colores = barajar(r, pal.acentos.filter(a => a !== pal.fondo));
  const circulo = d.lenguaje === 'Geométrica' && r() < 0.55 ? Math.floor(r() * orden.length) : -1;
  if (d.lenguaje === 'Pixel') for (let i = 0; i < 5; i++) pixelChispa(ctx, Math.round(entre(r, 40, 1040) / 4) * 4, Math.round(entre(r, 40, 1040) / 4) * 4, 12, colores[i % colores.length]);
  orden.forEach((p, i) => {
    const s = cajas[i], color = colores[i % colores.length];
    if (!s) return;
    if (d.lenguaje === 'Pixel') pixelVentana(ctx, p, s, pal, color, r);
    else if (d.lenguaje === 'Geométrica') geoPieza(ctx, p, s, pal, color, r, i === circulo && p.tipo === 'creacion');
    else orgPolaroid(ctx, p, s, pal, color, r);
  });

  if (d.lenguaje === 'Pixel') pixelTitulo(ctx, d, zonas.titulo, pal, r, resumen);
  else if (d.lenguaje === 'Geométrica') geoTitulo(ctx, d, zonas.titulo, pal, resumen);
  else orgTitulo(ctx, d, zonas.titulo, pal, r, resumen);
  pintarPersonaje(ctx, d, zonas.personaje, pal, r);
  franja(ctx, d);
  ctx.restore();
}

export function flyerEnLienzo(d: DatosFlyer): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = FLYER.ancho; c.height = FLYER.alto;
  pintarFlyer(c.getContext('2d')!, d);
  return c;
}
