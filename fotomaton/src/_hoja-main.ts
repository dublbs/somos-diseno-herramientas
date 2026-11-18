// TEMPORAL (no se commitea): hoja de contacto antes / después.
import { componer } from './lib/trama';
import { componer as componerAntes } from './_antes/trama';
import { demoDe } from './lib/demo';
import { demoDe as demoAntes } from './_antes/demo';
import { TINTAS } from './data/tintas';
import type { Visual } from './data/marcos';
const Z = 220;
const cargar = (u: string) => new Promise<HTMLCanvasElement>(r => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; c.getContext('2d')!.drawImage(i, 0, 0); r(c); }; i.src = u; });
const CAJAS: Record<string, number[]> = { 1: [140, 80, 190, 180], 2: [240, 140, 200, 200], 3: [230, 100, 150, 200] };
(async () => {
  const h = document.getElementById('h')!;
  const fotos: Record<string, HTMLCanvasElement> = {};
  for (const n of ['1', '2', '3']) fotos[n] = await cargar('./_caras/c' + n + '.jpg');
  const fila = (titulo: string) => { const d = document.createElement('div'); d.className = 'f'; d.innerHTML = `<b>${titulo}</b>`; h.appendChild(d); return d; };
  const celda = (d: HTMLElement, etq: string, dib: (x: CanvasRenderingContext2D) => void) => {
    const m = document.createElement('div'); m.className = 'm'; const c = document.createElement('canvas'); c.width = c.height = Z;
    dib(c.getContext('2d')!); m.appendChild(c); m.append(etq); d.appendChild(m);
  };
  const cara = (n: string) => { const cj = CAJAS[n]; return { x: cj[0], y: cj[1], w: cj[2], h: cj[3], n: 1, ref: cj[2] }; };
  for (const id of ['PM05', 'PM06']) {
    const d = fila(id + ' · antes | después');
    for (const [n, t] of [['1', 'cmyk'], ['3', 'azul']]) celda(d, `antes · ${t}`, x => componerAntes(x, Z, id, fotos[n], 2.5, TINTAS[t], cara(n)));
    for (const [n, t] of [['1', 'cmyk'], ['3', 'azul']]) celda(d, `después · ${t}`, x => componer(x, Z, id, fotos[n], 2.5, TINTAS[t], cara(n)));
  }
  const d = fila('Efecto Geométrica (GM05) · antes | después');
  for (const [n, t] of [['1', 'cmyk'], ['2', 'azul'], ['3', 'lapis']]) celda(d, `antes · ${t}`, x => componerAntes(x, Z, 'GM05', fotos[n], 2.5, TINTAS[t], cara(n)));
  const d2 = fila('');
  for (const [n, t] of [['1', 'cmyk'], ['2', 'azul'], ['3', 'lapis']]) celda(d2, `después · ${t}`, x => componer(x, Z, 'GM05', fotos[n], 2.5, TINTAS[t], cara(n)));
  const d3 = fila('Miniaturas (personaje) · antes | después');
  for (const [id, v] of [['GM04', 'Geométrica'], ['OM04', 'Orgánica'], ['PM04', 'Pixel']] as [string, Visual][]) celda(d3, 'antes ' + id, x => componerAntes(x, Z, id, demoAntes(v), 3, TINTAS.cmyk));
  const d4 = fila('');
  for (const [id, v] of [['GM04', 'Geométrica'], ['OM04', 'Orgánica'], ['PM04', 'Pixel']] as [string, Visual][]) celda(d4, 'después ' + id, x => componer(x, Z, id, demoDe(v), 3, TINTAS.cmyk));
  document.title = 'listo';
})();
