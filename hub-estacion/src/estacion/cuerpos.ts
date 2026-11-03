import { C } from './escena';
import { imagen, raster } from './imagenes';

// Hoja de propuestas de cuerpos para los personajes del HUB (?cuerpos): tres opciones por lenguaje, caminando.
// Todas usan la misma cabeza (la foto o el personaje de la credencial) para comparar solo el cuerpo.
// Se dibujan en un cuadro de 200 × 260 con los pies en y = 230.

export interface OpcionCuerpo { id: string; lenguaje: 'Pixel' | 'Geométrica' | 'Orgánica'; nombre: string; idea: string; dibujar: (ctx: CanvasRenderingContext2D, t: number) => number }
// dibujar devuelve la altura del cuello (donde va la cabeza).

const PIE = 230;
const paso = (t: number) => Math.sin(t * Math.PI * 2 * 1.6); // −1..1, ~1,6 pasos por segundo

// ---------- Pixel ----------
const spritePixel = (ctx: CanvasRenderingContext2D, t: number) => {
  const p = 8, f = Math.floor(t * 3.2) % 2; // dos cuadros, como un sprite
  const bloque = (x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(100 + x * p, PIE + y * p, w * p, h * p); };
  bloque(-3, -6 - (f ? 1 : 0), 2, 6 + (f ? 1 : 0), C.Negro); bloque(1, -6 - (f ? 0 : 1), 2, 6 + (f ? 0 : 1), C.Negro);
  bloque(-4, -14, 8, 8, C.Negro); bloque(-3, -13, 6, 6, C.Morado);
  bloque(-6, -13 + (f ? 1 : 0), 2, 5, C.Morado); bloque(4, -13 + (f ? 0 : 1), 2, 5, C.Morado);
  bloque(-6, -8 + (f ? 1 : 0), 2, 2, C.Hueso); bloque(4, -8 + (f ? 0 : 1), 2, 2, C.Hueso);
  bloque(-2, -12, 4, 1, C.Amarillo); // la franja del uniforme pixel
  return PIE - 14 * p;
};
const bloques = (ctx: CanvasRenderingContext2D, t: number) => {
  const s = paso(t), linea = (x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.Negro; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h); };
  linea(78, PIE - 54 + Math.max(0, s) * 6, 20, 54 - Math.max(0, s) * 6, C.Lapis); linea(102, PIE - 54 + Math.max(0, -s) * 6, 20, 54 - Math.max(0, -s) * 6, C.Lapis);
  linea(72, PIE - 62, 56, 10, C.Negro);
  ctx.beginPath(); ctx.moveTo(68, PIE - 62); ctx.lineTo(132, PIE - 62); ctx.lineTo(124, PIE - 126); ctx.lineTo(76, PIE - 126); ctx.closePath();
  ctx.fillStyle = C.Morado; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  for (const [lado, fase] of [[-1, s], [1, -s]] as const) {
    ctx.save(); ctx.translate(100 + lado * 30, PIE - 120); ctx.rotate(fase * 0.35);
    linea(-7, 0, 14, 44, C.Morado); linea(-9, 44, 18, 12, C.Amarillo); ctx.restore();
  }
  return PIE - 126;
};
const sticker = (ctx: CanvasRenderingContext2D, t: number) => {
  const s = paso(t), bote = Math.abs(s) * 4;
  ctx.save(); ctx.translate(100, PIE - bote); ctx.rotate(s * 0.05);
  const silueta = () => {
    ctx.beginPath();
    ctx.moveTo(-34, -118); ctx.lineTo(34, -118); ctx.lineTo(40, -60); ctx.lineTo(22, -60); ctx.lineTo(20, 0); ctx.lineTo(4, 0); ctx.lineTo(0, -40);
    ctx.lineTo(-4, 0); ctx.lineTo(-20, 0); ctx.lineTo(-22, -60); ctx.lineTo(-40, -60); ctx.closePath();
  };
  ctx.lineJoin = 'round';
  silueta(); ctx.strokeStyle = C.Negro; ctx.lineWidth = 22; ctx.stroke();
  silueta(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 16; ctx.stroke();
  silueta(); ctx.fillStyle = C.Morado; ctx.fill();
  ctx.fillStyle = C.Celeste; for (let k = 0; k < 4; k++) ctx.fillRect(-28 + k * 16, -100, 8, 8);
  ctx.restore();
  return PIE - 118 - bote;
};

// ---------- Geométrica ----------
const apiladas = (ctx: CanvasRenderingContext2D, t: number) => {
  const s = paso(t);
  ctx.fillStyle = C.Negro;
  ctx.fillRect(82 + s * 6, PIE - 40, 14, 40); ctx.fillRect(104 - s * 6, PIE - 40, 14, 40);
  ctx.fillRect(78 + s * 6, PIE - 10, 22, 10); ctx.fillRect(100 - s * 6, PIE - 10, 22, 10);
  ctx.fillStyle = C.Azul; ctx.strokeStyle = C.Negro; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(56, PIE - 126); ctx.lineTo(144, PIE - 126); ctx.lineTo(100, PIE - 36); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const [x, f] of [[50, s], [150, -s]] as const) { ctx.fillStyle = C.Amarillo; ctx.beginPath(); ctx.arc(x + f * 4, PIE - 86 + f * 6, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  return PIE - 126;
};
const modulos = (ctx: CanvasRenderingContext2D, t: number) => {
  const s = paso(t), c = 22, corre = Math.floor(t * 3) % 2;
  for (let f = 0; f < 4; f++) for (let k = 0; k < 3; k++) {
    ctx.fillStyle = (f + k + corre) % 2 ? C.Azul : C.Hueso;
    ctx.fillRect(67 + k * c, PIE - 130 + f * c, c, c);
  }
  ctx.strokeStyle = C.Negro; ctx.lineWidth = 3; ctx.strokeRect(67, PIE - 130, c * 3, c * 4);
  ctx.fillStyle = C.Negro;
  ctx.fillRect(74, PIE - 42 + Math.max(0, s) * 8, 20, 42 - Math.max(0, s) * 8); ctx.fillRect(106, PIE - 42 + Math.max(0, -s) * 8, 20, 42 - Math.max(0, -s) * 8);
  return PIE - 130;
};
const patron = (ctx: CanvasRenderingContext2D, t: number) => {
  const s = paso(t);
  ctx.fillStyle = C.Negro; ctx.fillRect(84, PIE - 46, 12, 46 - Math.max(0, s) * 8); ctx.fillRect(104, PIE - 46, 12, 46 - Math.max(0, -s) * 8);
  ctx.save(); ctx.beginPath(); ctx.roundRect(62, PIE - 132, 76, 92, 6); ctx.clip();
  ctx.fillStyle = C.Hueso; ctx.fillRect(62, PIE - 132, 76, 92);
  const corre = (t * 30) % 16;
  ctx.fillStyle = C.Lapis; for (let y = -16; y < 92; y += 16) ctx.fillRect(62, PIE - 132 + y + corre, 76, 8);
  ctx.restore();
  ctx.strokeStyle = C.Negro; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(62, PIE - 132, 76, 92, 6); ctx.stroke();
  return PIE - 132;
};

// ---------- Orgánica ----------
const articulado = (ctx: CanvasRenderingContext2D, t: number) => {
  const s = paso(t);
  const pieza = (x: number, y: number, ang: number, w: number, h: number, color: string) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.ellipse(0, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.lineWidth = 6; ctx.strokeStyle = C.Hueso; ctx.stroke(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  };
  pieza(90, PIE - 60, s * 0.35, 18, 62, '#0B8F48'); pieza(110, PIE - 60, -s * 0.35, 18, 62, '#0B8F48');
  pieza(66, PIE - 120, -s * 0.4 + 0.2, 16, 54, C.Verde);
  ctx.beginPath(); ctx.ellipse(100, PIE - 92, 34, 44, 0, 0, Math.PI * 2); ctx.lineWidth = 6; ctx.strokeStyle = C.Hueso; ctx.stroke(); ctx.fillStyle = C.Verde; ctx.fill();
  pieza(134, PIE - 120, s * 0.4 - 0.2, 16, 54, C.Verde);
  return PIE - 134;
};
const blanda = (ctx: CanvasRenderingContext2D, t: number) => {
  const s = paso(t), aplasta = 1 + Math.abs(s) * 0.08;
  ctx.save(); ctx.translate(100, PIE); ctx.scale(aplasta, 1 / aplasta);
  ctx.beginPath(); ctx.moveTo(-40, 0);
  ctx.bezierCurveTo(-52, -60, -36, -128, 0, -128); ctx.bezierCurveTo(36, -128, 52, -60, 40, 0); ctx.closePath();
  ctx.fillStyle = C.Rosa; ctx.fill();
  ctx.fillStyle = C.Verde; ctx.beginPath(); ctx.ellipse(-16 + s * 6, -2, 14, 6, 0, 0, Math.PI * 2); ctx.ellipse(16 - s * 6, -2, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  return PIE - 128 / aplasta;
};
const deFigura = (ctx: CanvasRenderingContext2D, t: number) => {
  const s = paso(t);
  ctx.strokeStyle = '#0B8F48'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(92, PIE - 50); ctx.quadraticCurveTo(88 + s * 8, PIE - 22, 90 + s * 10, PIE); ctx.moveTo(108, PIE - 50); ctx.quadraticCurveTo(112 - s * 8, PIE - 22, 110 - s * 10, PIE); ctx.stroke();
  const flor = imagen('./figma/plaza/flor-propia.svg');
  if (flor) { ctx.save(); ctx.translate(100, PIE - 92); ctx.rotate(s * 0.08); ctx.drawImage(raster(flor, 96, 96), -48, -48); ctx.restore(); }
  else { ctx.fillStyle = C.Azul; ctx.beginPath(); ctx.arc(100, PIE - 92, 44, 0, Math.PI * 2); ctx.fill(); }
  return PIE - 138;
};

export const OPCIONES: OpcionCuerpo[] = [
  { id: 'p1', lenguaje: 'Pixel', nombre: 'Sprite 8-bit', idea: 'Bloques de 8 px, dos cuadros por paso, como un videojuego.', dibujar: spritePixel },
  { id: 'p2', lenguaje: 'Pixel', nombre: 'Figura de bloques', idea: 'Torso trapecio, piernas y brazos rectos con contorno negro.', dibujar: bloques },
  { id: 'p3', lenguaje: 'Pixel', nombre: 'Sticker troquelado', idea: 'Silueta plana con el troquel blanco de los stickers Pixel.', dibujar: sticker },
  { id: 'g1', lenguaje: 'Geométrica', nombre: 'Figuras apiladas', idea: 'Triángulo, círculos y cuadrados (la opción actual, pulida).', dibujar: apiladas },
  { id: 'g2', lenguaje: 'Geométrica', nombre: 'Cuerpo de módulos', idea: 'El torso es un damero FA que corre al caminar.', dibujar: modulos },
  { id: 'g3', lenguaje: 'Geométrica', nombre: 'Silueta con patrón', idea: 'Una forma simple llena de listas que bajan (acordeón).', dibujar: patron },
  { id: 'o1', lenguaje: 'Orgánica', nombre: 'Papel articulado', idea: 'Piezas de papel con borde hueso que giran, como el Teatro.', dibujar: articulado },
  { id: 'o2', lenguaje: 'Orgánica', nombre: 'Forma blanda', idea: 'Un cuerpo sin extremidades que se aplasta y estira al andar.', dibujar: blanda },
  { id: 'o3', lenguaje: 'Orgánica', nombre: 'Cuerpo de figura', idea: 'El cuerpo es una figura Orgánica (aquí la flor) con piernas de tallo.', dibujar: deFigura },
];

// Cabeza: el mismo personaje de la credencial para todas las opciones.
export function cabeza(ctx: CanvasRenderingContext2D, cuello: number, src: string) {
  const d = 62, cy = cuello - d * 0.42;
  ctx.save(); ctx.beginPath(); ctx.arc(100, cy, d / 2, 0, Math.PI * 2); ctx.fillStyle = C.Hueso; ctx.fill(); ctx.clip();
  const im = imagen(src); if (im) ctx.drawImage(raster(im, d * 1.15, d * 1.15), 100 - d * 0.575, cy - d * 0.575);
  ctx.restore();
  ctx.strokeStyle = C.Negro; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(100, cy, d / 2, 0, Math.PI * 2); ctx.stroke();
}
