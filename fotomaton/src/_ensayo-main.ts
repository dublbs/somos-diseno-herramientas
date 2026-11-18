// TEMPORAL (no se commitea): hoja comparativa de efectos.
import { mosaico, celdaRelativa } from './lib/trama';
import { mosaico as antes } from './lib/_trama-antes';
import { grillaTri, semitonoTri, truchet, partidos } from './lib/_ensayo';
import { TINTAS } from './data/tintas';
import { cargarCara, detectarCara } from './lib/cara';
const P = new URLSearchParams(location.search);
const tintas = (P.get('t') ?? 'cmyk,azul').split(',');
const celdaU = +(P.get('c') ?? 2.5), Z = +(P.get('z') ?? 300);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const efectos: Record<string, any> = { X: antes, A: mosaico, B: grillaTri, C: semitonoTri, D: truchet, E: partidos };
const sel = (P.get('e') ?? 'ABCDE').split('');
const cargar = (u: string) => new Promise<HTMLCanvasElement>(r => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; c.getContext('2d')!.drawImage(i, 0, 0); r(c); }; i.src = u; });
(async () => {
  await cargarCara();
  const h = document.getElementById('h')!;
  for (const n of (P.get('caras') ?? '1,2,3').split(',')) {
    const src = await cargar('./_caras/c' + n + '.jpg'); const CAJAS: Record<string, number[]> = { 1: [140, 80, 190, 180], 2: [240, 140, 200, 200], 3: [230, 100, 150, 200] }; const cj = CAJAS[n]; const cara = (await detectarCara(src, 512)) ?? { x: cj[0], y: cj[1], w: cj[2], h: cj[3], n: 1, ref: cj[2] };
    for (const t of tintas) {
      const fila = document.createElement('div'); fila.className = 'f'; fila.innerHTML = `<b>cara ${n} · ${t}</b>`; h.appendChild(fila);
      for (const e of sel) {
        const s = Z / 150, celda = celdaRelativa(src, 150, 150, celdaU, cara) * s;
        const out = efectos[e](src, Z, Z, celda, TINTAS[t], cara);
        const c = document.createElement('canvas'); c.width = c.height = Z; c.getContext('2d')!.drawImage(out, 0, 0); fila.appendChild(c);
      }
    }
  }
  document.title = 'listo';
})();
