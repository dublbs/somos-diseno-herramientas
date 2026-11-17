import { marcoListo, MARCOS, type Visual } from '../../../shared/marcos';
import { mapaTinta, medidas, type TacoListo } from './tacos';

// El afiche por capas: un papel (blanco u hueso), hasta 5 capas de estampas (cada una con su tinta, como las placas
// de la risografía) y, si se quiere, un marco de la campaña bajo o sobre las estampas.
export const PAPEL = 1000; // el papel en unidades lógicas (cuadrado)
export const TACO_BASE = 320; // lado mayor del taco con escala 1, en unidades del papel
export const MAX_CAPAS = 5;

export const PAPELES = { Blanco: '#FFFFFF', Hueso: '#F4EEE3' } as const;
export type Papel = keyof typeof PAPELES;

export interface Estampa { taco: string; x: number; y: number; escala: number; giro: number; semilla: number }
export interface CapaAfiche { id: string; nombre: string; visible: boolean; tinta: string; mezcla: boolean; estampas: Estampa[] }
export interface Afiche { capas: CapaAfiche[]; activa: string; papel: Papel; marco: string | null; marcoEncima: boolean; registro: boolean }

export function azar(semilla: number) {
  let s = semilla >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------------------------------------------------------------- una impresión
// La estampa con su textura propia: la semilla hace que cada impresión sea distinta (y siempre la misma al redibujar).
// Falta tinta en algunos poros, la presión no es pareja y se notan las vetas del taco.
function impresion(t: TacoListo, e: Estampa, tinta: string, w: number, h: number): HTMLCanvasElement {
  const r = azar(e.semilla);
  const m = mapaTinta(t, w, h);
  const W = m.width, H = m.height, L = Math.max(W, H);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d')!;
  x.drawImage(m, 0, 0);
  x.globalCompositeOperation = 'source-in'; x.fillStyle = tinta; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'destination-out';
  // presión despareja: un lado queda con menos tinta
  const a = r() * Math.PI * 2, cx = W / 2, cy = H / 2;
  const g = x.createLinearGradient(cx - Math.cos(a) * L / 2, cy - Math.sin(a) * L / 2, cx + Math.cos(a) * L / 2, cy + Math.sin(a) * L / 2);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.55, 'rgba(0,0,0,0.04)'); g.addColorStop(1, `rgba(0,0,0,${0.22 + r() * 0.22})`);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // poros sin tinta: manchitas y grano
  const poros = Math.round(W * H / 120);
  x.fillStyle = '#000';
  for (let i = 0; i < poros; i++) {
    const rr = (0.6 + r() * (r() < 0.035 ? 8 : 1.8)) * L / 320;
    x.globalAlpha = 0.3 + r() * 0.6;
    x.beginPath(); x.arc(r() * W, r() * H, rr, 0, Math.PI * 2); x.fill();
  }
  // vetas del taco: líneas finas sin tinta en una dirección (como la madera)
  x.save(); x.translate(cx, cy); x.rotate(r() * Math.PI);
  for (let k = -L; k < L; k += L / (20 + r() * 10)) { x.globalAlpha = 0.1 + r() * 0.16; x.fillRect(-L, k, L * 2, Math.max(1, L / 280)); }
  x.restore();
  x.globalAlpha = 1;
  return c;
}

const cacheImp = new Map<string, HTMLCanvasElement>();
function impresionCacheada(t: TacoListo, e: Estampa, tinta: string, w: number, h: number) {
  const k = `${e.semilla}|${e.taco}|${tinta}|${Math.round(w)}|${Math.round(h)}`;
  let c = cacheImp.get(k);
  if (!c) { c = impresion(t, e, tinta, w, h); cacheImp.set(k, c); if (cacheImp.size > 300) cacheImp.delete(cacheImp.keys().next().value!); }
  return c;
}

export function tamEstampa(t: TacoListo, escala: number): [number, number] { return medidas(t, TACO_BASE * escala); }

// Dibuja una estampa (o la vista previa, sin textura y translúcida) en un contexto donde 1 unidad del papel = s px.
export function dibujarEstampa(ctx: CanvasRenderingContext2D, s: number, t: TacoListo, e: Estampa, tinta: string) {
  const [w, h] = tamEstampa(t, e.escala);
  const img = impresionCacheada(t, e, tinta, w * s, h * s);
  ctx.save();
  ctx.translate(e.x * s, e.y * s); ctx.rotate(e.giro * Math.PI / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();
}

// ---------------------------------------------------------------- papel y marco
const papeles = new Map<string, HTMLCanvasElement>();
function papel(color: string, px: number): HTMLCanvasElement {
  const k = `${color}|${px}`;
  let c = papeles.get(k);
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = px;
    const x = c.getContext('2d')!, r = azar(99);
    x.fillStyle = color; x.fillRect(0, 0, px, px);
    const granos = Math.round(px * px / 80);
    for (let i = 0; i < granos; i++) {
      x.fillStyle = r() < 0.6 ? 'rgba(60,40,20,0.05)' : 'rgba(255,255,255,0.1)';
      x.fillRect(r() * px, r() * px, 1 + r() * 1.5, 1 + r() * 1.5);
    }
    // fibras largas y suaves, como el papel de grabado
    for (let i = 0; i < px / 6; i++) {
      x.strokeStyle = 'rgba(80,60,30,0.035)'; x.lineWidth = Math.max(1, px / 900);
      const a = r() * Math.PI, l = px * (0.01 + r() * 0.03), cx = r() * px, cy = r() * px;
      x.beginPath(); x.moveTo(cx - Math.cos(a) * l, cy - Math.sin(a) * l); x.quadraticCurveTo(cx + r() * l * 0.3, cy + r() * l * 0.3, cx + Math.cos(a) * l, cy + Math.sin(a) * l); x.stroke();
    }
    papeles.set(k, c);
    if (papeles.size > 6) papeles.delete(papeles.keys().next().value!);
  }
  return c;
}

// Los marcos de la campaña (shared/marcos.ts), primero los de Orgánica.
const ORDEN: Visual[] = ['Orgánica', 'Geométrica', 'Pixel'];
export const MARCOS_AFICHE = [...MARCOS].sort((a, b) => ORDEN.indexOf(a.visual) - ORDEN.indexOf(b.visual));

const lum = (hex: string) => {
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return 0;
  const n = parseInt(h, 16); return (0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255)) / 255;
};
// Lo blanco o hueso del marco toma el color del papel, para que el marco y el papel sean uno.
const alPapel = (c: string, p: string) => (lum(c) > 0.86 ? p : c);

const marcos = new Map<string, HTMLCanvasElement>();
// El marco a `px` de lado con su hueco transparente (ahí se ve el papel y lo estampado).
export function lienzoMarco(id: string, px: number, colorPapel: string): HTMLCanvasElement {
  const k = `${id}|${px}|${colorPapel}`;
  let c = marcos.get(k);
  if (c) return c;
  const m = marcoListo(id), s = px / 240;
  c = document.createElement('canvas'); c.width = c.height = px;
  const x = c.getContext('2d')!;
  x.scale(s, s);
  x.fillStyle = alPapel(m.bg, colorPapel); x.fillRect(0, 0, 240, 240);
  m._p.forEach(([p, f]) => { x.fillStyle = alPapel(f, colorPapel); x.fill(p); });
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.fill(m._clip.path);
  x.globalCompositeOperation = 'source-over';
  m._encima.forEach(([p, f]) => { x.fillStyle = alPapel(f, colorPapel); x.fill(p); });
  marcos.set(k, c);
  if (marcos.size > 24) marcos.delete(marcos.keys().next().value!);
  return c;
}

// ---------------------------------------------------------------- capas
// Corrimiento de registro de cada capa (como las placas de la risografía), en unidades del papel.
export const corrimiento = (i: number): [number, number] => { const a = 0.7 + i * 2.2; return [Math.cos(a) * 8, Math.sin(a) * 8]; };

// Una capa sola, en un canvas de `px` (fondo transparente). Las estampas de una misma capa se tapan entre sí.
export function pintarCapa(c: HTMLCanvasElement, px: number, capa: CapaAfiche, tacos: Record<string, TacoListo>) {
  if (c.width !== px) { c.width = c.height = px; }
  const x = c.getContext('2d')!;
  x.clearRect(0, 0, px, px);
  const s = px / PAPEL;
  capa.estampas.forEach(e => { const t = tacos[e.taco]; if (t) dibujarEstampa(x, s, t, e, capa.tinta); });
}

// Caché de cada capa ya pintada: solo se repinta la que cambió.
export class CacheCapas {
  private m = new Map<string, { c: HTMLCanvasElement; firma: string }>();
  obtener(capa: CapaAfiche, px: number, tacos: Record<string, TacoListo>): HTMLCanvasElement {
    const firma = `${px}|${capa.tinta}|${capa.estampas.length}|${capa.estampas.map(e => e.semilla).join(',')}`;
    let r = this.m.get(capa.id);
    if (!r) { r = { c: document.createElement('canvas'), firma: '' }; this.m.set(capa.id, r); }
    if (r.firma !== firma) { pintarCapa(r.c, px, capa, tacos); r.firma = firma; }
    return r.c;
  }
  limpiar(vivas: string[]) { for (const k of [...this.m.keys()]) if (!vivas.includes(k)) this.m.delete(k); }
}

// El afiche completo en un cuadrado de `lado` px: papel → (marco bajo) → capas de atrás hacia adelante → (marco sobre).
export function componer(ctx: CanvasRenderingContext2D, lado: number, a: Afiche, tacos: Record<string, TacoListo>, cache = new CacheCapas()) {
  const px = Math.round(lado), s = px / PAPEL, colorPapel = PAPELES[a.papel];
  ctx.save();
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.drawImage(papel(colorPapel, px), 0, 0);
  const marco = a.marco ? lienzoMarco(a.marco, px, colorPapel) : null;
  if (marco && !a.marcoEncima) ctx.drawImage(marco, 0, 0);
  a.capas.forEach((capa, i) => {
    if (!capa.visible || !capa.estampas.length) return;
    const c = cache.obtener(capa, px, tacos);
    const [dx, dy] = a.registro ? corrimiento(i) : [0, 0];
    ctx.globalCompositeOperation = capa.mezcla ? 'multiply' : 'source-over';
    ctx.drawImage(c, dx * s, dy * s);
  });
  ctx.globalCompositeOperation = 'source-over';
  if (marco && a.marcoEncima) ctx.drawImage(marco, 0, 0);
  ctx.restore();
}

// ---------------------------------------------------------------- tarjeta
// Tarjeta común: el afiche en el cuadro de 1080 y la franja negra de 270 con el texto (como Fotomatón y Graffiti).
export async function tarjeta(pintar: (ctx: CanvasRenderingContext2D, lado: number) => void, titulo: [string, string]): Promise<Blob> {
  try { await document.fonts.load('800 66px "Bricolage Grotesque"'); await document.fonts.load('500 26px "DM Sans"'); } catch { /* respaldo */ }
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
  const x = c.getContext('2d')!;
  x.fillStyle = PAPELES.Hueso; x.fillRect(0, 0, 1080, 1080);
  pintar(x, 1080);
  x.fillStyle = '#000'; x.fillRect(0, 1080, 1080, 270);
  x.fillStyle = PAPELES.Hueso; x.font = '800 66px "Bricolage Grotesque", sans-serif';
  x.fillText(titulo[0], 56, 1172); x.fillText(titulo[1], 56, 1244);
  x.textAlign = 'right'; x.font = '500 26px "DM Sans", sans-serif'; x.fillStyle = '#BDB6AA';
  x.fillText('Somos Diseño · Semana del Diseño 2026', 1024, 1164);
  x.fillText('Lenguaje Orgánica', 1024, 1204);
  x.fillStyle = PAPELES.Hueso; x.font = '700 26px "DM Sans", sans-serif';
  x.fillText('INACAP Santiago Centro', 1024, 1244);
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('sin imagen'))), 'image/png'));
}
