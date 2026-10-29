// Marcos de Figma (componentes «B · Marcos para foto y texto»). Los usan el Fotomatón y la credencial.
// Los datos vienen de shared/marcos-figma.ts, que se genera con scripts/marcos-desde-figma.py desde los SVG de Figma:
// color de fondo, capas de la figura (viewBox 240), capas que van encima de la foto y la zona de foto.
import { MARCOS_FIGMA } from './marcos-figma';

export type Visual = 'Geométrica' | 'Orgánica' | 'Pixel';

export interface Marco {
  id: string;
  visual: Visual;
  code: string;
  name: string;
  bg: string;
  zona: string; // la zona de foto, como path
  caja: readonly number[]; // su caja [x, y, ancho, alto]
  paths: readonly (readonly [string, string])[]; // figura, bajo la foto
  encima: readonly (readonly [string, string])[]; // figura sobre la foto (contornos, enredaderas, franjas)
}

export const MARCOS: Marco[] = MARCOS_FIGMA as unknown as Marco[];

export const VISUALES: Visual[] = ['Geométrica', 'Orgánica', 'Pixel'];
export const porId = (id: string): Marco => MARCOS.find(m => m.id === id) ?? MARCOS[0];

export interface MarcoListo extends Marco {
  _p: [Path2D, string][];
  _encima: [Path2D, string][];
  _clip: { path: Path2D; box: [number, number, number, number] };
}

export const ZONA = 150;
const C0 = 120 - ZONA / 2;

// Ajuste de cada marco a la zona estándar (los de Figma traen huecos de 84 a 240 de ancho):
// · escala: agranda o achica la figura alrededor de su hueco hasta que el hueco mida ~ZONA (se recorta lo que sale).
// · forma + mate: si el hueco sigue siendo más grande que ZONA, la foto va en una forma de ZONA al centro y el resto
//   del hueco se rellena con el color `mate` (como el paspartú de un cuadro).
type Ajuste = { escala?: number; forma?: 'cuadro' | 'circulo' | 'octogono' | 'rombo'; mate?: string };
const AJUSTES: Record<string, Ajuste> = {
  GM01: { forma: 'cuadro', mate: '#000000' },                     // 160 × 192
  GM02: { forma: 'circulo', mate: '#7FC8F8' },                    // círculo de 148
  GM04: { forma: 'cuadro', mate: '#FF8FB1' },                     // 192 × 200
  GM05: { escala: ZONA / 120 },                                   // 120
  GM06: { forma: 'octogono', mate: '#2B4BD8' },                   // 240 × 160
  OM01: { escala: ZONA / 120, forma: 'cuadro', mate: '#0062B8' }, // 120 × 160 entre las franjas
  OM02: { escala: ZONA / 140, forma: 'circulo' },                 // círculo de 140 (en Figma es una máscara)
  OM04: { forma: 'cuadro', mate: '#7A2E8E' },                     // el panel morado, 192 × 202
  OM05: { escala: ZONA / 117 },                                   // el cuadro más chico del túnel, 117
  OM06: { escala: ZONA / 147, forma: 'rombo' },                   // rombo de 147 (en Figma es una máscara)
  PM01: { escala: ZONA / 100, forma: 'cuadro', mate: '#7FC8F8' }, // pizarra 140 × 100
  PM02: { escala: ZONA / 140 },                                   // disco de 140: centrado y el vinilo llena el cuadro
  PM04: { escala: ZONA / 120, forma: 'cuadro', mate: '#7FC8F8' }, // ventana 180 × 120
  PM05: { escala: ZONA / 100, forma: 'cuadro', mate: '#FFC20E' }, // ventana del metro 180 × 100
  PM06: { escala: ZONA / 140 },                                   // señal de 140 × 130
};

// Prepara Path2D de figura, zona de foto y capas de encima (una sola vez), ya ajustados a la zona estándar.
const cache = new Map<string, MarcoListo>();
export function marcoListo(id: string): MarcoListo {
  let r = cache.get(id);
  if (r) return r;
  const m = porId(id), aj = AJUSTES[m.id] ?? {};
  const original = new Path2D(m.zona);
  // La figura se escala alrededor del centro de su hueco y ese centro pasa al centro del cuadro.
  const [bx, by, bw, bh] = m.caja, k = aj.escala ?? 1;
  const t = new DOMMatrix().translate(120, 120).scale(k).translate(-(bx + bw / 2), -(by + bh / 2));
  const mover = (p: Path2D) => { const q = new Path2D(); q.addPath(p, t); return q; };
  const capas = m.paths.map(([d, f]) => [mover(new Path2D(d)), f] as [Path2D, string]);
  const encima = m.encima.map(([d, f]) => [mover(new Path2D(d)), f] as [Path2D, string]);
  let zona: Path2D, caja: [number, number, number, number];
  if (aj.forma) {
    zona = new Path2D();
    if (aj.forma === 'cuadro') zona.rect(C0, C0, ZONA, ZONA);
    else if (aj.forma === 'circulo') zona.arc(120, 120, ZONA / 2, 0, Math.PI * 2);
    else if (aj.forma === 'rombo') { zona.moveTo(120, C0); zona.lineTo(C0 + ZONA, 120); zona.lineTo(120, C0 + ZONA); zona.lineTo(C0, 120); zona.closePath(); }
    else { const e = ZONA * 0.25; zona.moveTo(C0 + e, C0); zona.lineTo(C0 + ZONA - e, C0); zona.lineTo(C0 + ZONA, C0 + e); zona.lineTo(C0 + ZONA, C0 + ZONA - e); zona.lineTo(C0 + ZONA - e, C0 + ZONA); zona.lineTo(C0 + e, C0 + ZONA); zona.lineTo(C0, C0 + ZONA - e); zona.lineTo(C0, C0 + e); zona.closePath(); }
    caja = [C0, C0, ZONA, ZONA];
    if (aj.mate) { // el resto del hueco original queda de paspartú (en el octógono, toda su caja: sin costuras con las esquinas)
      const p = new Path2D(); if (aj.forma === 'octogono') p.rect(bx, by, bw, bh); else p.addPath(original);
      capas.push([mover(p), aj.mate]);
    }
  } else {
    zona = mover(original);
    caja = [120 - bw * k / 2, 120 - bh * k / 2, bw * k, bh * k];
  }
  r = { ...m, _p: capas, _encima: encima, _clip: { path: zona, box: caja } };
  cache.set(id, r);
  return r;
}
