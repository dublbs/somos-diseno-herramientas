import { ANCHO, QUIETO_AVISO, VISIBLES, fila, type Cruce } from './cruce';
import { ARBOL, AUTO, BANCA, BASURERO, LATA, MICRO, SENAL, sprite } from './sprites';

// Dibuja el nivel 1 (El cruce) en un canvas de ancho × alto px. `camara` es la fila de abajo (con decimales: se desliza suave).
// Las imágenes de Figma (personaje y lateral del metro) llegan ya cargadas.
export interface Imagenes { personaje: HTMLImageElement | null; metro: HTMLImageElement | null }

const TONOS = {
  vereda: '#CFC6B8', junta: '#B8AE9E', grieta: '#A99F8F',
  plaza: '#5DAA6E', pasto: '#3E9B57',
  calle: '#3D3A36', linea: '#F4EEE3',
  ripio: '#77726A', durmiente: '#7A5A3A', riel: '#C9C9C4',
  fuera: 'rgba(0,0,0,0.45)',
};

export function dibujarCruce(ctx: CanvasRenderingContext2D, ancho: number, alto: number, e: Cruce, camara: number, img: Imagenes, ahora: number) {
  const c = Math.floor(Math.min(ancho / ANCHO, alto / VISIBLES));
  const x0 = Math.round((ancho - ANCHO * c) / 2);
  const filaY = (y: number) => alto - (y - camara + 1) * c; // borde superior de la fila y
  const desde = Math.floor(camara) - 1, hasta = Math.ceil(camara) + VISIBLES + 1;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1E1C19'; ctx.fillRect(0, 0, ancho, alto);

  // Suelo de cada fila, de borde a borde (fuera del tablero se oscurece: es la ciudad que sigue).
  for (let y = desde; y <= hasta; y++) {
    const f = fila(e, y);
    if (!f) continue;
    const top = filaY(y);
    if (f.tipo === 'estacion') {
      // Entrada del metro: baldosa azul con franja amarilla de borde y la letra M.
      ctx.fillStyle = '#0062B8'; ctx.fillRect(0, top, ancho, c + 1);
      ctx.fillStyle = '#2B4BD8';
      for (let x = 0; x < ancho; x += c) ctx.fillRect(x, top, Math.max(1, c / 16), c);
      if (fila(e, y - 1)?.tipo !== 'estacion') { ctx.fillStyle = '#FFC20E'; ctx.fillRect(0, top + c - c / 8, ancho, c / 8); }
      continue;
    }
    if (f.tipo === 'vereda' || f.tipo === 'plaza') {
      ctx.fillStyle = f.tipo === 'vereda' ? TONOS.vereda : TONOS.plaza;
      ctx.fillRect(0, top, ancho, c + 1);
      const p = Math.max(1, Math.round(c / 8));
      for (let x = -Math.ceil(x0 / c); x < ANCHO + Math.ceil(x0 / c); x++) {
        const px = x0 + x * c;
        if (f.tipo === 'vereda') {
          ctx.fillStyle = TONOS.junta; ctx.fillRect(px, top, p, c); ctx.fillRect(px, top, c, p);
          if ((x * 7 + y * 3) % 5 === 0) { ctx.fillStyle = TONOS.grieta; ctx.fillRect(px + 3 * p, top + 4 * p, 2 * p, p); ctx.fillRect(px + 4 * p, top + 5 * p, p, p); }
        } else {
          ctx.fillStyle = TONOS.pasto;
          for (let k = 0; k < 4; k++) ctx.fillRect(px + (((x * 5 + y * 11 + k * 3) % 7) + 1) * p, top + (((x * 3 + y * 7 + k * 5) % 6) + 1) * p, p, p * 2);
        }
      }
    } else if (f.tipo === 'calle') {
      ctx.fillStyle = TONOS.calle; ctx.fillRect(0, top, ancho, c + 1);
      if (fila(e, y + 1)?.tipo === 'calle') { // línea discontinua entre pistas
        ctx.fillStyle = TONOS.linea;
        for (let x = 0; x < ancho; x += c) ctx.fillRect(x + c * 0.2, top - Math.max(1, c / 20), c * 0.5, Math.max(2, c / 10));
      }
    } else {
      ctx.fillStyle = TONOS.ripio; ctx.fillRect(0, top, ancho, c + 1);
      ctx.fillStyle = TONOS.durmiente;
      for (let x = 0; x < ancho; x += c / 2) ctx.fillRect(x, top + c * 0.12, c * 0.18, c * 0.76);
      ctx.fillStyle = TONOS.riel; ctx.fillRect(0, top + c * 0.25, ancho, c * 0.08); ctx.fillRect(0, top + c * 0.67, ancho, c * 0.08);
    }
  }

  // Obstáculos, vehículos y el metro.
  for (let y = desde; y <= hasta; y++) {
    const f = fila(e, y);
    if (!f) continue;
    const top = filaY(y);
    for (const [x, o] of f.obstaculos) sprite(ctx, o === 'arbol' ? ARBOL : o === 'banca' ? BANCA : BASURERO, x0 + x * c, top, c, c);
    const brilla = Math.sin(ahora / 180 + y) * c * 0.04;
    for (const [x, color] of f.latas) sprite(ctx, LATA, x0 + x * c + c * 0.22, top + c * 0.2 + brilla, c * 0.56, c * 0.56, color);
    for (const v of f.vehiculos) sprite(ctx, v.tipo === 'micro' ? MICRO : AUTO, x0 + v.x * c, top + c * 0.1, v.largo * c, c * 0.8, v.color, f.dir < 0);
    if (f.tipo === 'metro') {
      const parpadea = f.tren && !f.tren.activo && Math.floor(ahora / 160) % 2 === 0;
      sprite(ctx, SENAL, x0 - c, top, c, c, parpadea ? '#FFC20E' : '#4A453E');
      if (f.tren?.activo && img.metro) for (let k = 0; k < 3; k++) ctx.drawImage(img.metro, x0 + (f.tren.x + k * 3.34) * c, top, c * 3.34, c);
    }
  }

  // El personaje (Figma), con su salto y su sombra.
  const j = e.jugador, jx = x0 + j.x * c, jy = filaY(j.y) - Math.sin(j.salto * Math.PI) * c * 0.25;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(jx + c * 0.2, filaY(j.y) + c * 0.82, c * 0.6, c * 0.1);
  if (img.personaje) ctx.drawImage(img.personaje, jx + c * 0.05, jy + c * 0.02, c * 0.9, c * 0.9);
  else { ctx.fillStyle = '#FFC20E'; ctx.fillRect(jx + c * 0.2, jy + c * 0.2, c * 0.6, c * 0.6); }

  // Fuera del tablero: más oscuro, para que se entienda dónde se puede caminar.
  ctx.fillStyle = TONOS.fuera; ctx.fillRect(0, 0, x0, alto); ctx.fillRect(x0 + ANCHO * c, 0, ancho - x0 - ANCHO * c, alto);
  ctx.fillStyle = '#000'; ctx.fillRect(x0 - 2, 0, 2, alto); ctx.fillRect(x0 + ANCHO * c, 0, 2, alto);

  // Letrero de la entrada del metro.
  const yMeta = [...e.filas.keys()].find(k => fila(e, k)?.tipo === 'estacion' && fila(e, k - 1)?.tipo !== 'estacion');
  if (yMeta !== undefined) {
    const top = filaY(yMeta + 1), w = c * 5;
    ctx.fillStyle = '#000'; ctx.fillRect(ancho / 2 - w / 2 + 4, top + 4, w, c * 0.8);
    ctx.fillStyle = '#F4EEE3'; ctx.fillRect(ancho / 2 - w / 2, top, w, c * 0.8);
    ctx.font = `700 ${Math.round(c * 0.42)}px "Silkscreen", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0062B8'; ctx.fillText('METRO', ancho / 2, top + c * 0.42);
  }

  // Puntos que suben y aviso de quedarse quieto.
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const a of e.avisos) {
    ctx.font = `700 ${Math.round(c * 0.38)}px "Silkscreen", monospace`;
    const yy = filaY(a.y) - (1 - a.t / 900) * c * 0.8;
    ctx.fillStyle = '#000'; ctx.fillText(a.texto, x0 + (a.x + 0.5) * c + 2, yy + 2);
    ctx.fillStyle = '#FFC20E'; ctx.fillText(a.texto, x0 + (a.x + 0.5) * c, yy);
  }
  if (!e.fin && !e.llego && e.quieto > QUIETO_AVISO && Math.floor(ahora / 250) % 2 === 0) {
    ctx.font = `700 ${Math.round(c * 0.5)}px "Silkscreen", monospace`;
    ctx.fillStyle = '#000'; ctx.fillText('¡Muévete!', ancho / 2 + 3, c * 0.8 + 3);
    ctx.fillStyle = '#FF8FB1'; ctx.fillText('¡Muévete!', ancho / 2, c * 0.8);
  }
}
