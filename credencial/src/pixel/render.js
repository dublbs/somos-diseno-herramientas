import { HEX, FONDO } from "./palette.js";
import { GLIFOS, AVANCE, normalizar } from "./font.js";
import { N, componer, lenguaje, CUADROS } from "./generator.js";
import { MESAS } from "../lib/mesas.js";

// Todo se dibuja en coordenadas nativas multiplicadas por la escala s, sin suavizado.
const caja = (ctx, s) => (x, y, w, h, color) => {
  ctx.fillStyle = HEX[color] || color;
  ctx.fillRect(x * s, y * s, w * s, h * s);
};

export function pintarRetrato(ctx, celdas, s, { x = 0, y = 0, fondo = FONDO, tam = 1 } = {}) {
  const R = caja(ctx, s);
  if (fondo) R(x, y, N * tam, N * tam, fondo);
  for (let i = 0; i < N * N; i++) {
    const c = celdas[i];
    if (c) R(x + (i % N) * tam, y + Math.floor(i / N) * tam, tam, tam, c);
  }
}

export function pintarTexto(ctx, texto, x, y, color, s) {
  const R = caja(ctx, s);
  let cx = x;
  for (const ch of normalizar(texto)) {
    const g = GLIFOS[ch];
    for (let f = 0; f < 7; f++) for (let c = 0; c < 5; c++) if (g[f][c] === "1") R(cx + c, y + f, 1, 1, color);
    cx += AVANCE;
  }
}

function hash(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

// Sello octogonal entintado, con un leve corrimiento y pixeles sin tinta, como un timbre real.
function pintarSello(ctx, s, x, y, mesa, codigo) {
  const R = caja(ctx, s);
  const h = hash(codigo + ":" + mesa);
  const jx = (h % 5) - 2, jy = ((h >> 3) % 3) - 1;
  const sx = x + 4 + jx, sy = y + 2 + jy, w = 20, alto = 15;
  const tinta = MESAS[mesa - 1].tinta;
  let k = 0;
  const punto = (px, py) => {
    k++;
    if ((h >> (k % 24)) % 11 === 0) return; // tinta que no marcó
    R(px, py, 1, 1, tinta);
  };
  for (let i = 2; i < w - 2; i++) { punto(sx + i, sy); punto(sx + i, sy + alto - 1); }
  for (let i = 2; i < alto - 2; i++) { punto(sx, sy + i); punto(sx + w - 1, sy + i); }
  punto(sx + 1, sy + 1); punto(sx + w - 2, sy + 1); punto(sx + 1, sy + alto - 2); punto(sx + w - 2, sy + alto - 2);
  pintarTexto(ctx, "M" + mesa, sx + 5, sy + 4, tinta, s);
}

export const CARTA = { ancho: 160, alto: 100 };

export function pintarCarta(ctx, { nombre, codigo, receta, sellos = [] }, cuadro, s) {
  const R = caja(ctx, s);
  R(0, 0, CARTA.ancho, CARTA.alto, "Negro");
  R(1, 1, CARTA.ancho - 2, CARTA.alto - 2, "Hueso");
  R(1, 1, CARTA.ancho - 2, 14, "Azul");
  pintarTexto(ctx, "SOMOS DISEÑO", 5, 5, "Blanco", s);
  pintarTexto(ctx, "CREDENCIAL", 155 - 59, 5, "Celeste", s);

  R(5, 19, 52, 52, "Negro");
  R(6, 20, 50, 50, "Hueso");
  pintarRetrato(ctx, componer(receta, cuadro), s, { x: 7, y: 21, fondo: null, tam: 2 });

  pintarTexto(ctx, "NOMBRE", 62, 20, "Azul", s);
  pintarTexto(ctx, nombre || "SIN NOMBRE", 62, 29, "Negro", s);
  pintarTexto(ctx, "LENGUAJE", 62, 40, "Azul", s);
  pintarTexto(ctx, lenguaje(receta), 62, 49, "Negro", s);
  pintarTexto(ctx, "N°", 62, 61, "Azul", s);
  pintarTexto(ctx, codigo || "SD-?????", 80, 61, "Negro", s);

  for (let x = 5; x < 155; x += 2) R(x, 75, 1, 1, "Negro");
  for (let i = 0; i < 5; i++) {
    const x = 6 + i * 30, y = 78, mesa = i + 1;
    if (sellos.includes(mesa)) {
      pintarSello(ctx, s, x, y, mesa, codigo || "");
    } else {
      for (let k = 0; k < 28; k += 2) { R(x + k, y, 1, 1, "Azul"); R(x + k, y + 18, 1, 1, "Azul"); }
      for (let k = 2; k < 18; k += 2) { R(x, y + k, 1, 1, "Azul"); R(x + 27, y + k, 1, 1, "Azul"); }
      pintarTexto(ctx, String(mesa), x + 12, y + 6, "Azul", s);
    }
  }
}

export function lienzo(ancho, alto) {
  const c = document.createElement("canvas");
  c.width = ancho;
  c.height = alto;
  return c;
}

// Cara B: sticker «HELLO my name is» de la propuesta Lo urbano, con la ruta de las 5 mesas.
export function pintarHello(ctx, { nombre, codigo, receta, sellos = [] }, cuadro, s) {
  const R = caja(ctx, s);
  const W = CARTA.ancho, H = CARTA.alto;
  ctx.clearRect(0, 0, W * s, H * s);
  // Silueta con esquinas pixeladas y contorno Negro.
  const filaDe = (y) => (y === 0 || y === H - 1 ? 2 : y === 1 || y === H - 2 ? 1 : 0);
  for (let y = 0; y < H; y++) { const m = filaDe(y); R(m, y, W - 2 * m, 1, "Negro"); }
  const relleno = (y0, y1, color) => {
    for (let y = y0; y <= y1; y++) { const m = filaDe(y) + 1; R(m, y, W - 2 * m, 1, color); }
  };
  relleno(1, 27, "Azul");
  relleno(28, 83, "Blanco");
  relleno(84, H - 2, "Azul");

  // HELLO a doble escala y MY NAME IS, como el sticker del archivo.
  const hello = "HELLO", ancho2 = hello.length * 12 - 2;
  ctx.save();
  ctx.scale(2, 2);
  pintarTexto(ctx, hello, (W - ancho2) / 4, 1.5, "Blanco", s);
  ctx.restore();
  pintarTexto(ctx, "MY NAME IS", Math.round((W - 59) / 2), 19, "Hueso", s);

  pintarRetrato(ctx, componer(receta, cuadro), s, { x: 8, y: 31, fondo: null, tam: 2 });
  const n = nombre || "SIN NOMBRE";
  if (n.length <= 7) {
    ctx.save();
    ctx.scale(2, 2);
    pintarTexto(ctx, n, 31, 21.5, "Negro", s);
    ctx.restore();
  } else {
    pintarTexto(ctx, n, 62, 48, "Negro", s);
  }
  pintarTexto(ctx, codigo || "SD-?????", 62, 70, "Azul", s);

  // Ruta: las mesas como estaciones de una línea.
  pintarTexto(ctx, "RUTA", 7, 88, "Blanco", s);
  R(38, 91, 112, 1, "Blanco");
  for (let i = 0; i < 5; i++) {
    const cx = 41 + i * 26, cy = 91, mesa = i + 1;
    const anillo = [[-1, -3, 3], [-2, -2, 1], [2, -2, 1], [-3, -1, 1], [3, -1, 1], [-3, 0, 1], [3, 0, 1], [-3, 1, 1], [3, 1, 1], [-2, 2, 1], [2, 2, 1], [-1, 3, 3]];
    const dentro = [[-1, -2, 3], [-2, -1, 5], [-2, 0, 5], [-2, 1, 5], [-1, 2, 3]];
    const ok = sellos.includes(mesa);
    dentro.forEach(([dx, dy, w]) => R(cx + dx, cy + dy, w, 1, ok ? "Amarillo" : "Azul"));
    anillo.forEach(([dx, dy, w]) => R(cx + dx, cy + dy, w, 1, "Blanco"));
    if (ok) R(cx, cy, 1, 1, "Negro");
  }
}

export const DISENOS = [
  { id: "documento", nombre: "Documento", pintar: (...a) => pintarCarta(...a) },
  { id: "hello", nombre: "HELLO my name is", pintar: (...a) => pintarHello(...a) },
];

export function cartaEnLienzo(datos, s = 8, cuadro = 0, diseno = "documento") {
  const c = lienzo(CARTA.ancho * s, CARTA.alto * s);
  (DISENOS.find((d) => d.id === diseno) || DISENOS[0]).pintar(c.getContext("2d"), datos, cuadro, s);
  return c;
}

// Hoja de sprites: los cuadros en fila, fondo transparente, 10 px por pixel como el sistema.
export function hojaDeSprites(receta, s = 10) {
  const c = lienzo(N * s * CUADROS.length, N * s);
  const ctx = c.getContext("2d");
  CUADROS.forEach((_, i) => pintarRetrato(ctx, componer(receta, i), s, { x: i * N, fondo: null }));
  return c;
}

export function moduloEnLienzo(receta, s = 10) {
  const c = lienzo(N * s, N * s);
  pintarRetrato(c.getContext("2d"), componer(receta, 0), s);
  return c;
}

export const aBlob = (canvas) => new Promise((ok) => canvas.toBlob(ok, "image/png"));
