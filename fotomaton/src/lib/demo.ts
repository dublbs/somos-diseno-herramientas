import { useEffect, useState } from 'react';
import type { Visual } from '../data/marcos';
import { DEMO } from './trama';

// Imagen de muestra para miniaturas de marcos y portada: la «Persona» de cada lenguaje, tomada de Figma
// (Orgánica: persona + globo · Geométrica: figura de disciplina · Pixel: personaje FA10).
// Hasta que carga el vector se usa la ilustración de respaldo.
const RUTA: Record<Visual, string> = {
  'Orgánica': 'organica', 'Geométrica': 'geometrica', Pixel: 'pixel',
};
const FONDO = '#F4EEE3';
const lienzos = new Map<Visual, HTMLCanvasElement>();
let listas = false;
const oyentes = new Set<() => void>();

function armar(visual: Visual, img: HTMLImageElement) {
  const c = lienzos.get(visual) ?? document.createElement('canvas');
  c.width = c.height = 360;
  const x = c.getContext('2d')!;
  x.fillStyle = FONDO; x.fillRect(0, 0, 360, 360);
  // la figura ocupa ~76 % del cuadro, centrada
  const k = Math.min(274 / img.naturalWidth, 274 / img.naturalHeight);
  const w = img.naturalWidth * k, h = img.naturalHeight * k;
  x.drawImage(img, (360 - w) / 2, (360 - h) / 2, w, h);
  // un degradado suave para que el efecto (trama, CRT, mosaico) muestre varios tonos
  const g = x.createLinearGradient(0, 0, 360, 360);
  g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0.38)');
  x.globalCompositeOperation = 'multiply'; x.fillStyle = g; x.fillRect(0, 0, 360, 360);
  x.globalCompositeOperation = 'source-over';
  lienzos.set(visual, c);
}

let cargando: Promise<void> | null = null;
export function cargarDemos(): Promise<void> {
  cargando ??= Promise.all((Object.keys(RUTA) as Visual[]).map(v => new Promise<void>(res => {
    const im = new Image();
    im.onload = () => { armar(v, im); res(); };
    im.onerror = () => res(); // si falla, queda la ilustración de respaldo
    im.src = `${import.meta.env.BASE_URL}figma/persona/${RUTA[v]}.svg`;
  }))).then(() => { listas = true; oyentes.forEach(f => f()); });
  return cargando;
}

export const demoDe = (visual: Visual): HTMLCanvasElement => lienzos.get(visual) ?? DEMO;

// true cuando ya están las personas de Figma: sirve para volver a dibujar miniaturas y portada.
export function useDemosListas(): boolean {
  const [ok, setOk] = useState(listas);
  useEffect(() => {
    if (listas) { setOk(true); return; }
    const f = () => setOk(true);
    oyentes.add(f); cargarDemos();
    return () => { oyentes.delete(f); };
  }, []);
  return ok;
}
