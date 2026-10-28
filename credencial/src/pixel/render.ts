import { marcoListo, type Visual } from '../../../shared/marcos';
import { HEX, contraste, type NombreColor } from './palette';
import { GLIFOS, AVANCE, normalizar } from './font';
import { TIMBRES, type IdPersonaje, type Tema } from '../temas';
import { raster } from '../lib/imagenes';

export const SELLOS = 4;

// Lo que va dentro del marco: la foto del Fotomatón (sin efectos) o uno de los 3 personajes.
export type Retrato = { retrato: 'foto' } | { retrato: 'personaje'; id: IdPersonaje };
// Credenciales del demo anterior (generador pixel) se muestran con el personaje Pixel.
export function normalizarRetrato(r: unknown): Retrato {
  const x = r as Partial<Retrato> | null;
  if (x?.retrato === 'foto') return { retrato: 'foto' };
  if (x?.retrato === 'personaje' && (x.id === 'pixel' || x.id === 'geometrica' || x.id === 'organica')) return { retrato: 'personaje', id: x.id };
  return { retrato: 'personaje', id: 'pixel' };
}

export interface DatosCarta {
  nombre: string;
  codigo: string;
  receta: Retrato;
  marco: string; // id de shared/marcos.ts (PM02, PM05, GM02, GM05, OM02, OM05)
  sellos: number[]; // 1..SELLOS
}
// Imágenes ya cargadas: la foto o el personaje, y los 4 timbres del lenguaje del marco.
export interface Recursos { retrato: HTMLImageElement | null; timbres: (HTMLImageElement | null)[] }
export type Cara = 'frente' | 'album';

// Tarjeta vertical en unidades lógicas: arriba el marco de 240 × 240, abajo la ficha.
export const CARTA = { ancho: 240, alto: 384 };
const ALTO_MARCO = 240;

type Caja4 = [number, number, number, number];
const caja = (ctx: CanvasRenderingContext2D, s: number) => (x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = HEX[color as NombreColor] || color;
  ctx.fillRect(Math.round(x * s), Math.round(y * s), Math.round((x + w) * s) - Math.round(x * s), Math.round((y + h) * s) - Math.round(y * s));
};

// Alfabeto pixel 5 × 7 (tam = tamaño del pixel en unidades lógicas).
export function pintarTexto(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, color: string, s: number, tam = 1) {
  const R = caja(ctx, s);
  let cx = x;
  for (const ch of normalizar(texto)) {
    const g = GLIFOS[ch];
    for (let f = 0; f < 7; f++) for (let c = 0; c < 5; c++) if (g[f][c] === '1') R(cx + c * tam, y + f * tam, tam, tam, color);
    cx += AVANCE * tam;
  }
}
const anchoPixel = (texto: string, tam: number) => Math.max(0, normalizar(texto).length * AVANCE * tam - tam);

// Texto según el lenguaje: Pixel usa el alfabeto pixel; Geométrica, Bricolage en mayúsculas; Orgánica, Bricolage normal.
// alto = altura de mayúscula aproximada en unidades lógicas. Devuelve el ancho dibujado.
function escribir(ctx: CanvasRenderingContext2D, visual: Visual, texto: string, x: number, y: number, alto: number, color: string, s: number, alinear: 'izq' | 'centro' | 'der' = 'izq', maxAncho = Infinity): number {
  if (visual === 'Pixel') {
    let tam = Math.max(1, Math.round(alto / 7));
    while (tam > 1 && anchoPixel(texto, tam) > maxAncho) tam--;
    const w = anchoPixel(texto, tam);
    const x0 = alinear === 'centro' ? x - w / 2 : alinear === 'der' ? x - w : x;
    pintarTexto(ctx, texto, Math.round(x0), Math.round(y), color, s, tam);
    return w;
  }
  const t = visual === 'Geométrica' ? texto.toUpperCase() : texto;
  let px = alto * 1.38;
  const fuente = (p: number) => `${visual === 'Geométrica' ? 800 : 700} ${p * s}px "Bricolage Grotesque", system-ui, sans-serif`;
  ctx.font = fuente(px);
  while (px > 6 && ctx.measureText(t).width / s > maxAncho) { px -= 1; ctx.font = fuente(px); }
  const w = ctx.measureText(t).width / s;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.textAlign = alinear === 'centro' ? 'center' : alinear === 'der' ? 'right' : 'left';
  ctx.fillText(t, x * s, (y - px * 0.18) * s);
  ctx.textAlign = 'left';
  return w;
}

function hash(str: string) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

// Imagen ajustada a una caja lógica: cover (la foto llena la zona) o contain (el personaje entero).
function pintarImagen(ctx: CanvasRenderingContext2D, im: HTMLImageElement, s: number, [x, y, w, h]: Caja4, modo: 'cover' | 'contain', abajo = false) {
  const iw = im.naturalWidth || im.width || 1, ih = im.naturalHeight || im.height || 1;
  const k = modo === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
  const dw = iw * k, dh = ih * k;
  const dx = x + (w - dw) / 2, dy = abajo ? y + h - dh : y + (h - dh) / 2;
  ctx.imageSmoothingEnabled = true;
  if (modo === 'cover') ctx.drawImage(im, dx * s, dy * s, dw * s, dh * s);
  else ctx.drawImage(raster(im, dw * s, dh * s), Math.round(dx * s), Math.round(dy * s));
}

// Marco de 240 × 240 (fondo, figura y zona de foto) con la foto o el personaje adentro, a escala s.
// paso alterna 0/1 para que el personaje respire (con «reducir movimiento» queda en 0).
export function pintarMarco(ctx: CanvasRenderingContext2D, marcoId: string, s: number, retrato: HTMLImageElement | null, modo: Retrato['retrato'], paso = 0) {
  const m = marcoListo(marcoId);
  ctx.save();
  ctx.fillStyle = m.bg;
  ctx.fillRect(0, 0, Math.round(240 * s), Math.round(240 * s));
  ctx.scale(s, s);
  // Algunas figuras se salen del cuadro de 240 (rayos, estallidos): se recortan al marco.
  ctx.beginPath(); ctx.rect(0, 0, 240, 240); ctx.clip();
  m._p.forEach(([p, f]) => { ctx.fillStyle = f; ctx.fill(p); });
  ctx.clip(m._clip.path);
  ctx.fillStyle = HEX.Hueso;
  ctx.fill(m._clip.path);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (retrato) {
    const [bx, by, bw, bh] = m._clip.box;
    if (modo === 'foto') pintarImagen(ctx, retrato, s, [bx, by, bw, bh], 'cover');
    else {
      const margen = Math.min(bw, bh) * 0.08;
      pintarImagen(ctx, retrato, s, [bx + margen, by + margen - paso * 2, bw - 2 * margen, bh - margen * 1.4], 'contain', true);
    }
  }
  ctx.restore();
}

// Silueta de la tarjeta según el lenguaje: Orgánica redondeada, Geométrica recta, Pixel con esquinas escalonadas.
function recortarCarta(ctx: CanvasRenderingContext2D, visual: Visual, s: number) {
  const W = CARTA.ancho * s, H = CARTA.alto * s;
  ctx.beginPath();
  if (visual === 'Orgánica') ctx.roundRect(0, 0, W, H, 26 * s);
  else if (visual === 'Pixel') {
    const e = 6 * s;
    ctx.moveTo(e, 0); ctx.lineTo(W - e, 0); ctx.lineTo(W - e, e); ctx.lineTo(W, e); ctx.lineTo(W, H - e); ctx.lineTo(W - e, H - e);
    ctx.lineTo(W - e, H); ctx.lineTo(e, H); ctx.lineTo(e, H - e); ctx.lineTo(0, H - e); ctx.lineTo(0, e); ctx.lineTo(e, e); ctx.closePath();
  } else ctx.rect(0, 0, W, H);
  ctx.clip();
}
function bordeCarta(ctx: CanvasRenderingContext2D, visual: Visual, s: number) {
  if (visual === 'Orgánica') return; // sin borde: papel recortado
  const R = caja(ctx, s), W = CARTA.ancho, H = CARTA.alto, g = visual === 'Pixel' ? 3 : 2;
  R(0, 0, W, g, HEX.Negro); R(0, H - g, W, g, HEX.Negro); R(0, 0, g, H, HEX.Negro); R(W - g, 0, g, H, HEX.Negro);
}

// Un timbre puesto: el sticker de Figma levemente girado, como un timbre de goma real.
function pintarTimbre(ctx: CanvasRenderingContext2D, im: HTMLImageElement, s: number, [x, y, w, h]: Caja4, semilla: string, opacidad = 1) {
  const giro = ((hash(semilla) % 15) - 7) * (Math.PI / 180);
  ctx.save();
  ctx.globalAlpha = opacidad;
  ctx.translate((x + w / 2) * s, (y + h / 2) * s);
  ctx.rotate(opacidad < 1 ? 0 : giro);
  const lado = Math.min(w, h);
  ctx.drawImage(raster(im, lado * s, lado * s), (-lado / 2) * s, (-lado / 2) * s);
  ctx.restore();
}
function hueco(ctx: CanvasRenderingContext2D, s: number, [x, y, w, h]: Caja4, color: string, n: number, visual: Visual) {
  const R = caja(ctx, s);
  if (visual === 'Orgánica') {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 2 * s; ctx.setLineDash([4 * s, 4 * s]);
    ctx.beginPath(); ctx.arc((x + w / 2) * s, (y + h / 2) * s, (Math.min(w, h) / 2 - 1) * s, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  } else {
    for (let k = 0; k < w; k += 4) { R(x + k, y, 2, 2, color); R(x + k, y + h - 2, 2, 2, color); }
    for (let k = 4; k < h - 2; k += 4) { R(x, y + k, 2, 2, color); R(x + w - 2, y + k, 2, 2, color); }
  }
  escribir(ctx, visual, String(n), x + w / 2, y + h / 2 - 7, 14, color, s, 'centro');
}

// Colores de la ficha a partir del fondo del marco.
function tintaSobre(fondo: string) {
  return contraste(fondo, HEX.Hueso) >= contraste(fondo, HEX.Negro) ? HEX.Hueso : HEX.Negro;
}

// Cara A: la credencial con la forma, los colores y la figura del marco elegido, y los 4 timbres.
export function pintarFrente(ctx: CanvasRenderingContext2D, d: DatosCarta, rec: Recursos, tema: Tema, s: number, paso = 0) {
  const m = marcoListo(d.marco);
  const fondo = m.bg.toUpperCase();
  const texto = tintaSobre(fondo);
  const acento = contraste(tema.acento, fondo) >= 1.8 ? tema.acento : texto;
  const W = CARTA.ancho;
  ctx.save();
  recortarCarta(ctx, tema.visual, s);
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, W * s, CARTA.alto * s);
  pintarMarco(ctx, d.marco, s, rec.retrato, d.receta.retrato, paso);

  // Ficha: nombre, código y marco
  const y0 = ALTO_MARCO + 12;
  escribir(ctx, tema.visual, d.nombre || 'Sin nombre', 14, y0, 18, texto, s, 'izq', W - 28);
  escribir(ctx, tema.visual, d.codigo || 'SD-?????', 14, y0 + 28, 11, acento, s, 'izq');
  escribir(ctx, tema.visual, `${m.visual} · ${m.name}`, W - 14, y0 + 30, 7, texto, s, 'der');

  // Timbres
  const lado = 46, gap = (W - 28 - SELLOS * lado) / (SELLOS - 1), ys = CARTA.alto - lado - 14;
  for (let i = 0; i < SELLOS; i++) {
    const x = 14 + i * (lado + gap), n = i + 1, im = rec.timbres[i];
    if (d.sellos.includes(n) && im) pintarTimbre(ctx, im, s, [x - 2, ys - 2, lado + 4, lado + 4], d.codigo + n);
    else hueco(ctx, s, [x, ys, lado, lado], texto, n, tema.visual);
  }
  ctx.restore();
  bordeCarta(ctx, tema.visual, s);
}

// Cara B: el álbum de timbres. Los conseguidos a todo color; los que faltan, como silueta.
export function pintarAlbum(ctx: CanvasRenderingContext2D, d: DatosCarta, rec: Recursos, tema: Tema, s: number) {
  const W = CARTA.ancho, H = CARTA.alto;
  const timbres = TIMBRES[tema.visual];
  ctx.save();
  recortarCarta(ctx, tema.visual, s);
  ctx.fillStyle = tema.banda;
  ctx.fillRect(0, 0, W * s, H * s);
  escribir(ctx, tema.visual, 'Timbres', 16, 18, 16, tema.tinta, s);
  escribir(ctx, tema.visual, `${d.sellos.length}/${SELLOS}`, W - 16, 18, 16, tema.acento, s, 'der');
  const cw = (W - 16 * 2 - 10) / 2, ch = (H - 60 - 16 - 10) / 2;
  for (let i = 0; i < SELLOS; i++) {
    const x = 16 + (i % 2) * (cw + 10), y = 52 + Math.floor(i / 2) * (ch + 10), n = i + 1;
    const tengo = d.sellos.includes(n), im = rec.timbres[i];
    ctx.fillStyle = tengo ? 'rgba(244,238,227,.16)' : 'rgba(0,0,0,.16)';
    if (tema.visual === 'Orgánica') { ctx.beginPath(); ctx.roundRect(x * s, y * s, cw * s, ch * s, 16 * s); ctx.fill(); }
    else ctx.fillRect(x * s, y * s, cw * s, ch * s);
    const lado = Math.min(cw - 20, ch - 46);
    if (im) pintarTimbre(ctx, im, s, [x + (cw - lado) / 2, y + 8, lado, lado], d.codigo + n, tengo ? 1 : 0.22);
    escribir(ctx, tema.visual, timbres[i].nombre, x + cw / 2, y + ch - 32, 9, tema.tinta, s, 'centro', cw - 10);
    escribir(ctx, tema.visual, tengo ? '¡Conseguido!' : `Estación ${n}`, x + cw / 2, y + ch - 16, 6, tengo ? tema.acento : tema.tinta, s, 'centro', cw - 10);
  }
  ctx.restore();
  bordeCarta(ctx, tema.visual, s);
}

export function pintarCara(ctx: CanvasRenderingContext2D, cara: Cara, d: DatosCarta, rec: Recursos, tema: Tema, s: number, paso = 0) {
  if (cara === 'album') pintarAlbum(ctx, d, rec, tema, s);
  else pintarFrente(ctx, d, rec, tema, s, paso);
}

export function cartaEnLienzo(d: DatosCarta, rec: Recursos, tema: Tema, cara: Cara = 'frente', s = 4) {
  const c = document.createElement('canvas');
  c.width = CARTA.ancho * s; c.height = CARTA.alto * s;
  pintarCara(c.getContext('2d')!, cara, d, rec, tema, s);
  return c;
}

export const aBlob = (canvas: HTMLCanvasElement) => new Promise<Blob>((ok, no) => canvas.toBlob(b => (b ? ok(b) : no(new Error('sin imagen'))), 'image/png'));
