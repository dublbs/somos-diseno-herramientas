import { COLS, FILAS, LADO_MODULO } from './vagon';

// Piezas del carro: el lateral se parte en regiones según los colores del módulo de Figma. Una pieza es un grupo de
// celdas del mismo color unidas por borde (la carrocería, cada ventana, cada franja). Los pixeles sueltos de un mismo
// color (el damero de la Línea 4) se juntan en una sola pieza de detalle por color. Se calcula sobre el módulo de
// 24 × 24 y se repite en las dos mitades del carro, igual que la base.

export interface Pieza { id: number; nombre: string }
export interface MapaPiezas { piezas: Pieza[]; mapa: Int16Array } // mapa: id de la pieza de cada celda del carro (COLS × FILAS)

const MINIMO = 3; // un trozo de color con menos celdas que esto pasa a la pieza de detalle de su color
const NOMBRE_COLOR: Record<string, string> = {
  '#F4EEE3': 'Carrocería', '#000000': 'Negro', '#7FC8F8': 'Celeste', '#7A2E8E': 'Morado',
  '#E2001A': 'Rojo', '#FFC20E': 'Amarillo', '#00A651': 'Verde', '#2B4BD8': 'Lapislázuli', '#FF8FB1': 'Rosa', '#0062B8': 'Azul',
};
const nombreDe = (hex: string) => NOMBRE_COLOR[hex] ?? 'Color';

interface Trozo { color: string; celdas: number[]; izq: number; arriba: number }

export function segmentar(base: string[]): MapaPiezas {
  const L = LADO_MODULO;
  const color = (i: number) => base[Math.floor(i / L) * COLS + (i % L)]; // i indexa el módulo (f * L + c)
  const visto = new Uint8Array(L * L);
  const trozos: Trozo[] = [];

  for (let s = 0; s < L * L; s++) {
    if (visto[s]) continue;
    const c0 = color(s), celdas: number[] = [], pila = [s];
    visto[s] = 1;
    while (pila.length) {
      const i = pila.pop()!;
      celdas.push(i);
      const f = Math.floor(i / L), c = i % L;
      for (const [df, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nf = f + df, nc = c + dc;
        if (nf < 0 || nf >= L || nc < 0 || nc >= L) continue;
        const j = nf * L + nc;
        if (!visto[j] && color(j) === c0) { visto[j] = 1; pila.push(j); }
      }
    }
    trozos.push({
      color: c0, celdas,
      izq: Math.min(...celdas.map(i => i % L)),
      arriba: Math.min(...celdas.map(i => Math.floor(i / L))),
    });
  }

  const grandes = trozos.filter(t => t.celdas.length >= MINIMO).sort((a, b) => a.izq - b.izq || a.arriba - b.arriba);
  const sueltos = trozos.filter(t => t.celdas.length < MINIMO);
  const cuantos = new Map<string, number>();
  for (const t of grandes) cuantos.set(t.color, (cuantos.get(t.color) ?? 0) + 1);

  const piezas: Pieza[] = [], modulo = new Int16Array(L * L).fill(-1), vistos = new Map<string, number>();
  for (const t of grandes) {
    const id = piezas.length, n = (vistos.get(t.color) ?? 0) + 1;
    vistos.set(t.color, n);
    const base = nombreDe(t.color);
    piezas.push({ id, nombre: cuantos.get(t.color)! > 1 ? `${base} ${n}` : base });
    for (const i of t.celdas) modulo[i] = id;
  }

  const detalle = new Map<string, number>();
  for (const t of sueltos) {
    let id = detalle.get(t.color);
    if (id === undefined) {
      id = piezas.length;
      detalle.set(t.color, id);
      piezas.push({ id, nombre: `Detalle ${nombreDe(t.color).toLowerCase()}` });
    }
    for (const i of t.celdas) modulo[i] = id;
  }

  const mapa = new Int16Array(COLS * FILAS);
  for (let f = 0; f < FILAS; f++) for (let c = 0; c < COLS; c++) mapa[f * COLS + c] = modulo[f * L + (c % L)];
  return { piezas, mapa };
}
