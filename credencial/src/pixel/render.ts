import { marcoListo } from '../../../shared/marcos';
import { HEX, contraste, type NombreColor } from './palette';
import { GLIFOS, AVANCE, normalizar } from './font';
import { N, componer, type Receta, type Celdas } from './generator';

export const SELLOS = 4;

export interface DatosCarta {
  nombre: string;
  codigo: string;
  receta: Receta;
  marco: string; // id de shared/marcos.ts (GM01, OM05, PM05…)
  sellos: number[]; // 1..SELLOS
  foto?: CanvasImageSource & { width: number; height: number } | null; // selfie del Fotomatón (solo en este celular)
}

// Tarjeta vertical en unidades lógicas: arriba el marco de 240 × 240, abajo la ficha.
export const CARTA = { ancho: 240, alto: 384 };
const ALTO_MARCO = 240;

type Caja = (x: number, y: number, w: number, h: number, color: string) => void;
const caja = (ctx: CanvasRenderingContext2D, s: number): Caja => (x, y, w, h, color) => {
  ctx.fillStyle = HEX[color as NombreColor] || color;
  ctx.fillRect(Math.round(x * s), Math.round(y * s), Math.round((x + w) * s) - Math.round(x * s), Math.round((y + h) * s) - Math.round(y * s));
};

// Personaje con celdas de tamaño entero en pixeles de pantalla, centrado en una caja lógica.
function pintarPersonaje(ctx: CanvasRenderingContext2D, celdas: Celdas, s: number, [bx, by, bw, bh]: [number, number, number, number], llenar = 0.86) {
  const lado = Math.max(1, Math.floor((Math.min(bw, bh) * s * llenar) / N));
  const x0 = Math.round((bx + bw / 2) * s - (lado * N) / 2);
  const y0 = Math.round((by + bh) * s - lado * N); // apoyado abajo, como un retrato
  for (let i = 0; i < N * N; i++) {
    const c = celdas[i];
    if (!c) continue;
    ctx.fillStyle = HEX[c];
    ctx.fillRect(x0 + (i % N) * lado, y0 + Math.floor(i / N) * lado, lado, lado);
  }
}

export function pintarTexto(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, color: string, s: number, tam = 1) {
  const R = caja(ctx, s);
  let cx = x;
  for (const ch of normalizar(texto)) {
    const g = GLIFOS[ch];
    for (let f = 0; f < 7; f++) for (let c = 0; c < 5; c++) if (g[f][c] === '1') R(cx + c * tam, y + f * tam, tam, tam, color);
    cx += AVANCE * tam;
  }
}
const anchoDe = (texto: string, tam: number) => Math.max(0, normalizar(texto).length * AVANCE * tam - tam);

function hash(str: string) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

// Colores de la ficha a partir del marco: fondo, texto legible y un acento de la figura para los sellos.
export function coloresDeMarco(marcoId: string) {
  const m = marcoListo(marcoId);
  const fondo = m.bg.toUpperCase();
  const texto = contraste(fondo, HEX.Hueso) >= contraste(fondo, HEX.Negro) ? HEX.Hueso : HEX.Negro;
  const usados = m.paths.map(([, f]) => f.toUpperCase()).filter(f => f !== fondo && f !== '#000' && f !== '#000000');
  const acento = usados.find(f => contraste(f, fondo) >= 1.6) || (texto === HEX.Hueso ? HEX.Amarillo : HEX.Lapislázuli);
  return { fondo, texto, acento };
}

// Sello entintado con un leve corrimiento y pixeles sin tinta, como un timbre real.
function pintarSello(ctx: CanvasRenderingContext2D, s: number, x: number, y: number, w: number, h: number, n: number, codigo: string, tinta: string) {
  const R = caja(ctx, s);
  const k = hash(codigo + ':' + n);
  const jx = (k % 3) - 1, jy = ((k >> 3) % 3) - 1;
  const sx = x + jx, sy = y + jy;
  let i = 0;
  const punto = (px: number, py: number, t = 2) => { i++; if ((k >> (i % 24)) % 9 === 0) return; R(px, py, t, t, tinta); };
  for (let a = 4; a < w - 4; a += 2) { punto(sx + a, sy); punto(sx + a, sy + h - 2); }
  for (let a = 4; a < h - 4; a += 2) { punto(sx, sy + a); punto(sx + w - 2, sy + a); }
  punto(sx + 2, sy + 2); punto(sx + w - 4, sy + 2); punto(sx + 2, sy + h - 4); punto(sx + w - 4, sy + h - 4);
  pintarTexto(ctx, String(n), sx + w / 2 - 5, sy + h / 2 - 7, tinta, s, 2);
}

type Foto = NonNullable<DatosCarta['foto']>;

// Foto que cubre la caja lógica [x, y, w, h] sin deformarse (recorta lo que sobra).
function pintarFotoCubriendo(ctx: CanvasRenderingContext2D, foto: Foto, [x, y, w, h]: [number, number, number, number]) {
  const k = Math.max(w / foto.width, h / foto.height);
  const fw = foto.width * k, fh = foto.height * k;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(foto, x + (w - fw) / 2, y + (h - fh) / 2, fw, fh);
}

// Marco de 240 × 240 (fondo, figura y zona de foto) con el personaje (o la foto) adentro, a escala s.
export function pintarMarco(ctx: CanvasRenderingContext2D, marcoId: string, celdas: Celdas | null, s: number, foto?: Foto | null) {
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
  if (foto) pintarFotoCubriendo(ctx, foto, m._clip.box);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (!foto && celdas) pintarPersonaje(ctx, celdas, s, m._clip.box);
  ctx.restore();
}

// Cara A: la credencial con la forma, los colores y la figura del marco elegido.
export function pintarFrente(ctx: CanvasRenderingContext2D, d: DatosCarta, cuadro: number, s: number) {
  const R = caja(ctx, s);
  const m = marcoListo(d.marco);
  const { fondo, texto, acento } = coloresDeMarco(d.marco);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  R(0, 0, CARTA.ancho, CARTA.alto, fondo);

  pintarMarco(ctx, d.marco, componer(d.receta, cuadro), s);

  // Ficha: nombre, código y lenguaje del marco
  const y0 = ALTO_MARCO + 10;
  const nombre = d.nombre || 'SIN NOMBRE';
  const tam = anchoDe(nombre, 3) <= CARTA.ancho - 24 ? 3 : 2;
  pintarTexto(ctx, nombre, 12, y0, texto, s, tam);
  const y1 = y0 + 7 * tam + 8;
  pintarTexto(ctx, d.codigo || 'SD-?????', 12, y1, acento, s, 2);
  const etiqueta = `${m.visual} ${m.code}`;
  pintarTexto(ctx, etiqueta, CARTA.ancho - 12 - anchoDe(etiqueta, 1), y1 + 4, texto, s, 1);

  // Sellos
  const ys = CARTA.alto - 58, ancho = 48, alto = 44, gap = (CARTA.ancho - 24 - SELLOS * ancho) / (SELLOS - 1);
  for (let i = 0; i < SELLOS; i++) {
    const x = 12 + i * (ancho + gap), n = i + 1;
    if (d.sellos.includes(n)) {
      R(x, ys, ancho, alto, acento);
      pintarSello(ctx, s, x + 3, ys + 3, ancho - 6, alto - 6, n, d.codigo, contraste(acento, HEX.Negro) > 6 ? HEX.Negro : HEX.Hueso);
    } else {
      for (let k = 0; k < ancho; k += 4) { R(x + k, ys, 2, 2, texto); R(x + k, ys + alto - 2, 2, 2, texto); }
      for (let k = 4; k < alto - 2; k += 4) { R(x, ys + k, 2, 2, texto); R(x + ancho - 2, ys + k, 2, 2, texto); }
      pintarTexto(ctx, String(n), x + ancho / 2 - 5, ys + alto / 2 - 7, texto, s, 2);
    }
  }
  // Borde de la tarjeta (se lee aunque el fondo del marco sea igual al de la página)
  R(0, 0, CARTA.ancho, 2, HEX.Negro); R(0, CARTA.alto - 2, CARTA.ancho, 2, HEX.Negro);
  R(0, 0, 2, CARTA.alto, HEX.Negro); R(CARTA.ancho - 2, 0, 2, CARTA.alto, HEX.Negro);
  ctx.restore();
}

// Cara B: sticker «HELLO my name is» de la propuesta Lo urbano, con la ruta de los sellos.
export function pintarHello(ctx: CanvasRenderingContext2D, d: DatosCarta, cuadro: number, s: number) {
  const R = caja(ctx, s);
  const W = CARTA.ancho, H = CARTA.alto;
  const { fondo } = coloresDeMarco(d.marco);
  ctx.save();
  R(0, 0, W, H, HEX.Negro);
  R(3, 3, W - 6, 66, HEX.Azul);
  R(3, 69, W - 6, H - 69 - 64, HEX.Blanco);
  R(3, H - 64, W - 6, 61, HEX.Azul);
  pintarTexto(ctx, 'HELLO', (W - anchoDe('HELLO', 5)) / 2, 12, HEX.Blanco, s, 5);
  pintarTexto(ctx, 'MY NAME IS', (W - anchoDe('MY NAME IS', 2)) / 2, 54, HEX.Hueso, s, 2);

  R(70, 82, 100, 100, fondo);
  pintarPersonaje(ctx, componer(d.receta, cuadro), s, [70, 82, 100, 100], 0.96);
  const nombre = d.nombre || 'SIN NOMBRE';
  const tam = anchoDe(nombre, 3) <= W - 24 ? 3 : 2;
  pintarTexto(ctx, nombre, (W - anchoDe(nombre, tam)) / 2, 196, HEX.Negro, s, tam);
  pintarTexto(ctx, d.codigo || 'SD-?????', (W - anchoDe(d.codigo || 'SD-?????', 2)) / 2, 232, HEX.Azul, s, 2);

  // Ruta: los sellos como estaciones de una línea
  pintarTexto(ctx, 'RUTA', 14, H - 50, HEX.Blanco, s, 2);
  R(80, H - 34, 140, 2, HEX.Blanco);
  for (let i = 0; i < SELLOS; i++) {
    const cx = 92 + i * 38, cy = H - 33, ok = d.sellos.includes(i + 1);
    R(cx - 8, cy - 8, 16, 16, HEX.Blanco);
    R(cx - 6, cy - 6, 12, 12, ok ? HEX.Amarillo : HEX.Azul);
    if (ok) R(cx - 2, cy - 2, 4, 4, HEX.Negro);
  }
  ctx.restore();
}

// Cara C: Fotomatón sin efectos. La selfie dentro del marco y la franja negra de las tarjetas del hub.
export function pintarFoto(ctx: CanvasRenderingContext2D, d: DatosCarta, _cuadro: number, s: number) {
  const R = caja(ctx, s);
  const m = marcoListo(d.marco);
  const { acento } = coloresDeMarco(d.marco);
  const W = CARTA.ancho, H = CARTA.alto;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  R(0, 0, W, H, HEX.Negro);
  pintarMarco(ctx, d.marco, null, s, d.foto);
  if (!d.foto) {
    const [bx, by, bw, bh] = m._clip.box;
    const t1 = 'SACA TU', t2 = 'FOTO';
    pintarTexto(ctx, t1, bx + (bw - anchoDe(t1, 2)) / 2, by + bh / 2 - 16, HEX.Negro, s, 2);
    pintarTexto(ctx, t2, bx + (bw - anchoDe(t2, 2)) / 2, by + bh / 2 + 2, HEX.Negro, s, 2);
  }
  const y0 = ALTO_MARCO + 14;
  pintarTexto(ctx, 'FOTOMATÓN', 12, y0, acento === HEX.Negro ? HEX.Amarillo : acento, s, 1);
  const nombre = d.nombre || 'SIN NOMBRE';
  const tam = anchoDe(nombre, 3) <= W - 24 ? 3 : 2;
  pintarTexto(ctx, nombre, 12, y0 + 16, HEX.Hueso, s, tam);
  const y1 = y0 + 16 + 7 * tam + 10;
  pintarTexto(ctx, d.codigo || 'SD-?????', 12, y1, HEX.Hueso, s, 2);
  const etiqueta = `${m.visual} ${m.code}`;
  pintarTexto(ctx, etiqueta, W - 12 - anchoDe(etiqueta, 1), y1 + 4, HEX.Hueso, s, 1);
  pintarTexto(ctx, 'SOMOS DISEÑO 2026', 12, H - 20, HEX.Hueso, s, 1);
  R(0, 0, W, 2, HEX.Negro); R(0, H - 2, W, 2, HEX.Negro); R(0, 0, 2, H, HEX.Negro); R(W - 2, 0, 2, H, HEX.Negro);
  ctx.restore();
}

export type Cara = 'frente' | 'hello' | 'foto';

export const DISENOS = [
  { id: 'frente', nombre: 'Credencial', pintar: pintarFrente },
  { id: 'hello', nombre: 'HELLO my name is', pintar: pintarHello },
  { id: 'foto', nombre: 'Fotomatón', pintar: pintarFoto },
] as const;

export function cartaEnLienzo(d: DatosCarta, s = 4, cuadro = 0, diseno: Cara = 'frente') {
  const c = document.createElement('canvas');
  c.width = CARTA.ancho * s; c.height = CARTA.alto * s;
  (DISENOS.find(x => x.id === diseno) || DISENOS[0]).pintar(c.getContext('2d')!, d, cuadro, s);
  return c;
}

export const aBlob = (canvas: HTMLCanvasElement) => new Promise<Blob>((ok, no) => canvas.toBlob(b => (b ? ok(b) : no(new Error('sin imagen'))), 'image/png'));
