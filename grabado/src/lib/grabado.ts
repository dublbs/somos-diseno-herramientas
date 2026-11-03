import { HEX, azar, figuraEn, type IdFigura, type NombreColor } from './comun';

// Taller de grabado: cada «taco» es la silueta de una figura Orgánica. Al tocar el papel se estampa con tinta
// imperfecta, como un taco de madera o linóleo: falta tinta en algunos poros, la presión no es pareja,
// el taco gira un poco y las tintas se mezclan donde se cruzan (multiplicar).
export const PAPEL = 1000; // el papel en unidades lógicas (cuadrado)
export const TAMANOS = { chico: 170, mediano: 260, grande: 380 } as const;
export type Tamano = keyof typeof TAMANOS;

export interface Estampa { taco: IdFigura; tinta: NombreColor; x: number; y: number; tam: number; giro: number; semilla: number }

// Silueta entintada (sin textura) por taco, tinta y tamaño en pixeles.
const siluetas = new Map<string, HTMLCanvasElement>();
function silueta(im: HTMLImageElement, taco: string, tinta: NombreColor, px: number): HTMLCanvasElement {
  const k = `${taco}|${tinta}|${px}`;
  let c = siluetas.get(k);
  if (!c) {
    c = figuraEn(im, px, px, 0.04);
    const x = c.getContext('2d')!;
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = HEX[tinta]; x.fillRect(0, 0, px, px);
    siluetas.set(k, c);
  }
  return c;
}

// Una estampa con su textura propia (la semilla hace que cada impresión sea distinta y siempre la misma al redibujar).
function impresion(im: HTMLImageElement, e: Estampa, px: number): HTMLCanvasElement {
  const r = azar(e.semilla);
  const c = document.createElement('canvas'); c.width = c.height = px;
  const x = c.getContext('2d')!;
  x.drawImage(silueta(im, e.taco, e.tinta, px), 0, 0);
  x.globalCompositeOperation = 'destination-out';
  // presión despareja: un lado queda con menos tinta
  const a = r() * Math.PI * 2, g = x.createLinearGradient(px / 2 - Math.cos(a) * px / 2, px / 2 - Math.sin(a) * px / 2, px / 2 + Math.cos(a) * px / 2, px / 2 + Math.sin(a) * px / 2);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.6, 'rgba(0,0,0,0.05)'); g.addColorStop(1, `rgba(0,0,0,${0.3 + r() * 0.25})`);
  x.fillStyle = g; x.fillRect(0, 0, px, px);
  // poros sin tinta: manchitas y grano
  const poros = Math.round(px * px / 110);
  for (let i = 0; i < poros; i++) {
    const rr = (0.7 + r() * (r() < 0.04 ? 9 : 2)) * px / 300;
    x.globalAlpha = 0.35 + r() * 0.65;
    x.beginPath(); x.arc(r() * px, r() * px, rr, 0, Math.PI * 2); x.fill();
  }
  // vetas del taco: líneas finas sin tinta, en una dirección (como la madera)
  const veta = r() * Math.PI;
  x.save(); x.translate(px / 2, px / 2); x.rotate(veta);
  for (let k = -px; k < px; k += px / (18 + r() * 10)) { x.globalAlpha = 0.12 + r() * 0.2; x.fillRect(-px, k, px * 2, Math.max(1, px / 260)); }
  x.restore();
  x.globalAlpha = 1;
  return c;
}

// Papel con grano (fijo para cada color de papel).
const papeles = new Map<string, HTMLCanvasElement>();
function papel(color: NombreColor, px: number): HTMLCanvasElement {
  const k = `${color}|${px}`;
  let c = papeles.get(k);
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = px;
    const x = c.getContext('2d')!, r = azar(99);
    x.fillStyle = HEX[color]; x.fillRect(0, 0, px, px);
    const granos = Math.round(px * px / 90);
    for (let i = 0; i < granos; i++) {
      x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)';
      x.fillRect(r() * px, r() * px, 1 + r() * 1.5, 1 + r() * 1.5);
    }
    papeles.set(k, c);
  }
  return c;
}

const cacheImpresiones = new Map<string, HTMLCanvasElement>();
export function dibujarGrabado(ctx: CanvasRenderingContext2D, lado: number, colorPapel: NombreColor, estampas: Estampa[], tacos: Record<IdFigura, HTMLImageElement>, aparece?: { indice: number; t: number }) {
  const s = lado / PAPEL;
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(papel(colorPapel, Math.round(lado)), 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  estampas.forEach((e, i) => {
    const px = Math.max(8, Math.round(e.tam * s));
    const k = `${e.semilla}|${e.taco}|${e.tinta}|${px}`;
    let imp = cacheImpresiones.get(k);
    if (!imp) { imp = impresion(tacos[e.taco], e, px); cacheImpresiones.set(k, imp); if (cacheImpresiones.size > 400) cacheImpresiones.delete(cacheImpresiones.keys().next().value!); }
    let escala = 1, alfa = 1;
    if (aparece && aparece.indice === i) { const t = Math.min(1, aparece.t); escala = 1.12 - 0.12 * t; alfa = 0.3 + 0.7 * t; }
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.translate(e.x * s, e.y * s); ctx.rotate(e.giro); ctx.scale(escala, escala);
    ctx.drawImage(imp, -px / 2, -px / 2);
    ctx.restore();
  });
  ctx.restore();
}
