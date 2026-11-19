import { C, entintar, mosaico } from '../estacion/escena';
import { azar } from '../estacion/fuente';
import { imagen, precargar } from '../estacion/imagenes';
import type { Pieza } from './piezas';

// Creaciones de ejemplo para la galería (modo demo, o mientras llegan las primeras del día): miniaturas hechas en
// canvas con los assets que ya están en el HUB, una sola vez, como PNG para mostrarlas con <img>.

const SVG = {
  pixel: './figma/personajes/personaje-pixel.svg', geometrica: './figma/personajes/personaje-geometrica.svg', organica: './figma/personajes/personaje-organica.svg',
  helecho: './figma/plaza/helecho.svg', sol: './figma/plaza/sol.svg', araucaria: './figma/plaza/araucaria.svg', flor: './figma/plaza/flor-propia.svg', quisco: './figma/plaza/quisco.svg',
  tag: './figma/vagon/tag-ejemplo.svg', spray: './figma/vagon/spray.svg', tarro: './figma/vagon/tarro-pintura.svg', zapatilla: './figma/vagon/zapatilla.svg', plumon: './figma/vagon/plumon.svg',
};

const lienzo = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')!] as const; };
const png = (c: HTMLCanvasElement) => c.toDataURL('image/png');
const dibujar = (x: CanvasRenderingContext2D, src: string, cx: number, cy: number, alto: number, giro = 0) => {
  const im = imagen(src); if (!im) return;
  const w = alto * (im.naturalWidth / im.naturalHeight || 1);
  x.save(); x.translate(cx, cy); x.rotate(giro); x.drawImage(im, -w / 2, -alto / 2, w, alto); x.restore();
};

function ejMosaico(semilla: number) { return png(mosaico(semilla, 320)); }

function ejGrabado(taco: string, tinta: string, papel: string) {
  const [c, x] = lienzo(300, 380);
  x.fillStyle = papel; x.fillRect(0, 0, 300, 380);
  const im = imagen(taco);
  if (im) { x.globalCompositeOperation = 'multiply'; x.drawImage(entintar(im, tinta, 230), 35, 50); x.globalCompositeOperation = 'source-over'; }
  x.strokeStyle = tinta; x.lineWidth = 3; x.strokeRect(18, 18, 264, 344);
  return png(c);
}

function ejGraffiti(semilla: number) {
  const r = azar(semilla), [c, x] = lienzo(400, 300);
  const muro = [C.Hueso, '#D9CDB7', C.Celeste][semilla % 3];
  x.fillStyle = muro; x.fillRect(0, 0, 400, 300);
  x.fillStyle = 'rgba(0,0,0,.08)';
  for (let f = 0; f < 12; f++) for (let k = 0; k < 9; k++) x.fillRect(k * 48 + (f % 2) * 24, f * 26, 46, 2); // junta de ladrillos
  // brochazos de spray
  x.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    x.strokeStyle = [C.Rosa, C.Amarillo, C.Verde, C.Lapis][(semilla + i) % 4]; x.lineWidth = 26 + r() * 20; x.globalAlpha = 0.85;
    x.beginPath(); x.moveTo(20 + r() * 60, 60 + r() * 200); x.bezierCurveTo(140, r() * 300, 260, r() * 300, 380 - r() * 60, 60 + r() * 200); x.stroke();
  }
  x.globalAlpha = 1;
  dibujar(x, SVG.tag, 200, 140, 210, -0.08 + r() * 0.16);
  const stickers = [SVG.spray, SVG.tarro, SVG.zapatilla, SVG.plumon];
  dibujar(x, stickers[semilla % 4], 70 + r() * 40, 230, 90, -0.3 + r() * 0.6);
  dibujar(x, stickers[(semilla + 1) % 4], 330 - r() * 40, 70, 80, -0.3 + r() * 0.6);
  return png(c);
}

// Mural de Hora punta: pixeles grandes, como lo que queda pintado en el andén.
function ejJuego(semilla: number) {
  const r = azar(semilla), cols = 32, filas = 20, t = 12, [c, x] = lienzo(cols * t, filas * t);
  x.fillStyle = '#9C968B'; x.fillRect(0, 0, cols * t, filas * t); // gris de la ciudad sin color
  const colores = [C.Rosa, C.Amarillo, C.Celeste, C.Verde, C.Morado, C.Lapis];
  for (let i = 0; i < 9; i++) { // manchas de pintura que devolvieron el color
    const cx = r() * cols, cy = r() * filas, rad = 2 + r() * 5, color = colores[Math.floor(r() * colores.length)];
    x.fillStyle = color;
    for (let f = 0; f < filas; f++) for (let k = 0; k < cols; k++) if (Math.hypot(k - cx, f - cy) < rad + (r() - 0.5)) x.fillRect(k * t, f * t, t, t);
  }
  x.fillStyle = C.Negro; x.fillRect(0, (filas - 2) * t, cols * t, 2 * t); // el andén
  x.fillStyle = C.Amarillo; for (let k = 0; k < cols; k += 2) x.fillRect(k * t, (filas - 2) * t, t, t / 3);
  dibujar(x, SVG.pixel, cols * t * (0.25 + r() * 0.5), (filas - 6) * t, 8 * t);
  return png(c);
}

// Tarjeta del Fotomatón (1080 × 1350 en chico): retrato en semitono CMYK y la franja negra común.
function ejFoto(semilla: number) {
  const r = azar(semilla), [c, x] = lienzo(270, 338);
  const fondo = [C.Amarillo, C.Celeste, C.Rosa, C.Verde][semilla % 4];
  x.fillStyle = fondo; x.fillRect(0, 0, 270, 338);
  const tintas = ['rgba(0,174,239,.55)', 'rgba(236,0,140,.5)', 'rgba(0,0,0,.6)'];
  tintas.forEach((t, i) => {
    x.fillStyle = t;
    for (let f = 0; f < 30; f++) for (let k = 0; k < 24; k++) {
      const px = k * 12 + (f % 2) * 6 + i * 2, py = f * 10 + i * 2, d = Math.hypot(px - 135, (py - 150) * 0.8);
      const rad = Math.max(0, 5 - d / 26) + (r() < 0.02 ? 1 : 0);
      if (rad > 0.4) { x.beginPath(); x.arc(px, py, rad, 0, Math.PI * 2); x.fill(); }
    }
  });
  dibujar(x, [SVG.pixel, SVG.geometrica, SVG.organica][semilla % 3], 135, 150, 170);
  x.fillStyle = C.Negro; x.fillRect(0, 300, 270, 38);
  x.fillStyle = C.Hueso; x.font = '800 15px "Bricolage Grotesque", sans-serif'; x.textBaseline = 'middle';
  x.fillText('Somos Diseño', 12, 319); x.textAlign = 'right'; x.font = '700 11px "DM Sans", sans-serif'; x.fillText('Cabina de fotos', 258, 319);
  return png(c);
}

const AUTORES = ['Antonia', 'Benjamín', 'Camila', 'Diego', 'Fernanda', 'Gaspar', 'Isidora', 'Matías', 'Renata', 'Vicente', 'Trinidad', 'Joaquín'];

export async function crearEjemplos(): Promise<{ piezas: Pieza[]; personas: Pieza[] }> {
  await precargar(Object.values(SVG));
  try { await (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts?.ready; } catch { /* sin FontFace */ }
  const hechos: [Pieza['clase'], () => string][] = [
    ['mosaico', () => ejMosaico(24)], ['graffiti', () => ejGraffiti(1)], ['foto', () => ejFoto(2)], ['grabado', () => ejGrabado(SVG.helecho, C.Verde, C.Hueso)],
    ['juego', () => ejJuego(5)], ['mosaico', () => ejMosaico(52)], ['grabado', () => ejGrabado(SVG.sol, C.Rosa, C.Celeste)], ['graffiti', () => ejGraffiti(2)],
    ['foto', () => ejFoto(1)], ['mosaico', () => ejMosaico(81)], ['juego', () => ejJuego(9)], ['grabado', () => ejGrabado(SVG.araucaria, C.Lapis, C.Amarillo)],
    ['mosaico', () => ejMosaico(3)], ['foto', () => ejFoto(3)], ['graffiti', () => ejGraffiti(3)], ['grabado', () => ejGrabado(SVG.quisco, C.Morado, C.Hueso)],
  ];
  const ahora = Date.now();
  const piezas: Pieza[] = hechos.map(([clase, f], i) => ({ id: 'ej-' + i, clase, src: f(), codigo: null, autor: AUTORES[i % AUTORES.length], creado: ahora - (i + 1) * 7 * 60000, ejemplo: true }));
  const lenguajes = ['Pixel', 'Geométrica', 'Orgánica'] as const, ids = ['pixel', 'geometrica', 'organica'] as const;
  const personas: Pieza[] = AUTORES.slice(0, 10).map((n, i) => ({ id: 'ej-p' + i, clase: 'credencial', codigo: null, autor: n, creado: ahora - (i + 1) * 5 * 60000, lenguaje: lenguajes[i % 3], personaje: ids[(i * 2) % 3], ejemplo: true }));
  return { piezas, personas };
}
