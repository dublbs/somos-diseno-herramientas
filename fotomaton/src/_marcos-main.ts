// TEMPORAL (no se commitea): hoja de contacto de marcos.
import { componer } from './lib/trama';
import { MARCOS } from './data/marcos';
import { TINTAS } from './data/tintas';
import { demoDe } from './lib/demo';
const P = new URLSearchParams(location.search);
const ids = (P.get('ids') ?? MARCOS.map(m => m.id).join(',')).split(',');
const Z = +(P.get('z') ?? 200), tinta = P.get('t') ?? 'cmyk', foto = P.get('foto');
const cargar = (u: string) => new Promise<HTMLCanvasElement>(r => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; c.getContext('2d')!.drawImage(i, 0, 0); r(c); }; i.src = u; });
(async () => {
  const h = document.getElementById('h')!;
  const src = foto ? await cargar('./_caras/c' + foto + '.jpg') : null;
  const CAJAS: Record<string, number[]> = { 1: [140, 80, 190, 180], 2: [240, 140, 200, 200], 3: [230, 100, 150, 200] };
  const cj = foto ? CAJAS[foto] : null, cara = cj ? { x: cj[0], y: cj[1], w: cj[2], h: cj[3], n: 1, ref: cj[2] } : null;
  for (const id of ids) {
    const m = MARCOS.find(x => x.id === id)!;
    const d = document.createElement('div'); d.className = 'm';
    const c = document.createElement('canvas'); c.width = c.height = Z;
    componer(c.getContext('2d')!, Z, id, src ?? demoDe(m.visual), src ? 2.5 : 3, TINTAS[tinta], cara);
    d.appendChild(c); d.append(id + ' ' + m.name); h.appendChild(d);
  }
  document.title = 'listo';
})();
