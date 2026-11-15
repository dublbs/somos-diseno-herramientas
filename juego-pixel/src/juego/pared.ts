// «Hora punta» · Nivel 3, La pared (mecánica de juntar colores que caen). Lógica sin dibujo (plan 009-juego-pixel).
// Tablero de COLS × FILAS; la fila 0 es la de arriba. Caen pares con tus colores; 4 o más del mismo color que se tocan
// se borran y pintan la pared (`mural`). Los Grises solo se borran junto a un grupo de color.
import { azar, FORMAS, PINTURAS, type Aviso, type Forma, type Pieza } from './comun';

export const COLS = 8, FILAS = 10;
export const DURACION = 90000, CADA_GRIS = 15000, GRUPO = 4;
const LIMPIAR_MS = 320;

export type Celda = { color: string; forma: Forma } | { gris: true } | null;
export interface Par { x: number; y: number; giro: 0 | 1 | 2 | 3; a: Pieza; b: Pieza } // b gira alrededor de a
export type FinPared = null | 'llena' | 'tiempo';
export interface Pared {
  semilla: number; celdas: Celda[][]; mural: (string | null)[][];
  colores: string[]; formas: number; actual: Par | null; siguiente: [Pieza, Pieza];
  caida: number; tiempo: number; proximoGris: number; puntos: number; cadena: number; mejorCadena: number;
  borradas: number; grisesBorrados: number; limpiando: { celdas: [number, number][]; t: number } | null;
  avisos: Aviso[]; fin: FinPared;
}

const vacio = <T,>(v: T) => Array.from({ length: FILAS }, () => Array<T>(COLS).fill(v));
export const esColor = (c: Celda): c is { color: string; forma: Forma } => !!c && 'color' in c;
const OFF: Record<number, [number, number]> = { 0: [0, -1], 1: [1, 0], 2: [0, 1], 3: [-1, 0] };
export const posB = (p: Par): [number, number] => [p.x + OFF[p.giro][0], p.y + OFF[p.giro][1]];

// Tus colores: los de tus piezas y latas, de los más juntados a los menos; entre 3 y 4.
export function tusColores(latas: string[], piezas: Pieza[]): string[] {
  const n = new Map<string, number>();
  for (const c of [...piezas.map(p => p.color), ...latas]) if (PINTURAS.includes(c)) n.set(c, (n.get(c) ?? 0) + 1);
  const l = [...n.keys()].sort((a, b) => n.get(b)! - n.get(a)!).slice(0, 4);
  for (const c of PINTURAS) if (l.length < 3 && !l.includes(c)) l.push(c);
  return l;
}

function pieza(e: Pared): Pieza {
  return { color: e.colores[Math.floor(azar(e) * e.colores.length)], forma: FORMAS[e.formas++ % FORMAS.length] };
}

export function nuevaPared(latas: string[], piezas: Pieza[], semilla = Date.now() % 100000): Pared {
  const e: Pared = {
    semilla, celdas: vacio<Celda>(null), mural: vacio<string | null>(null), colores: tusColores(latas, piezas), formas: 0,
    actual: null, siguiente: [null!, null!], caida: 0, tiempo: 0, proximoGris: CADA_GRIS, puntos: 0, cadena: 0,
    mejorCadena: 0, borradas: 0, grisesBorrados: 0, limpiando: null, avisos: [], fin: null,
  };
  e.siguiente = [pieza(e), pieza(e)];
  nuevoPar(e);
  return e;
}

const dentro = (x: number, y: number) => x >= 0 && x < COLS && y < FILAS;
const libre = (e: Pared, x: number, y: number) => dentro(x, y) && (y < 0 || !e.celdas[y][x]);
const cabe = (e: Pared, p: Par) => { const [bx, by] = posB(p); return libre(e, p.x, p.y) && libre(e, bx, by); };

function nuevoPar(e: Pared) {
  const p: Par = { x: 3, y: 0, giro: 0, a: e.siguiente[0], b: e.siguiente[1] };
  e.siguiente = [pieza(e), pieza(e)];
  if (!cabe(e, p)) { e.fin = 'llena'; e.actual = null; return; }
  e.actual = p; e.caida = 0;
}

export function moverPar(e: Pared, dx: number) {
  const p = e.actual;
  if (!p || e.fin) return;
  const n = { ...p, x: p.x + dx };
  if (cabe(e, n)) e.actual = n;
}
export function girar(e: Pared) {
  const p = e.actual;
  if (!p || e.fin) return;
  const giro = ((p.giro + 1) % 4) as Par['giro'];
  // Si choca, prueba corriendo el par un paso al otro lado (o hacia arriba).
  for (const [dx, dy] of [[0, 0], [-OFF[giro][0], -OFF[giro][1]]]) {
    const n = { ...p, giro, x: p.x + dx, y: p.y + dy };
    if (cabe(e, n)) { e.actual = n; return; }
  }
}
export function bajarPaso(e: Pared) {
  const p = e.actual;
  if (!p || e.fin) return;
  const n = { ...p, y: p.y + 1 };
  if (cabe(e, n)) { e.actual = n; e.caida = 0; } else fijar(e);
}
export function soltarPar(e: Pared) {
  const p = e.actual;
  if (!p || e.fin) return;
  let n = p;
  while (cabe(e, { ...n, y: n.y + 1 })) n = { ...n, y: n.y + 1 };
  e.actual = n; fijar(e); // solo este par: el siguiente aparece arriba y cae a su ritmo
}

// El par se apoya: cada pieza cae por su lado hasta tocar algo, y se buscan grupos.
function fijar(e: Pared) {
  const p = e.actual!; const [bx, by] = posB(p);
  e.actual = null;
  if (p.y < 0 || by < 0) { e.fin = 'llena'; return; }
  e.celdas[p.y][p.x] = { ...p.a }; e.celdas[by][bx] = { ...p.b };
  asentar(e);
  e.cadena = 0;
  buscarGrupos(e);
}

function asentar(e: Pared) {
  for (let x = 0; x < COLS; x++) {
    const col = [];
    for (let y = FILAS - 1; y >= 0; y--) if (e.celdas[y][x]) col.push(e.celdas[y][x]);
    for (let y = FILAS - 1, i = 0; y >= 0; y--, i++) e.celdas[y][x] = col[i] ?? null;
  }
}

function buscarGrupos(e: Pared) {
  const visto = vacio(false), borrar: [number, number][] = [];
  for (let y = 0; y < FILAS; y++) for (let x = 0; x < COLS; x++) {
    const c = e.celdas[y][x];
    if (visto[y][x] || !esColor(c)) continue;
    const grupo: [number, number][] = [], pila: [number, number][] = [[x, y]];
    visto[y][x] = true;
    while (pila.length) {
      const [cx, cy] = pila.pop()!; grupo.push([cx, cy]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= FILAS || visto[ny][nx]) continue;
        const o = e.celdas[ny][nx];
        if (esColor(o) && o.color === c.color) { visto[ny][nx] = true; pila.push([nx, ny]); }
      }
    }
    if (grupo.length >= GRUPO) borrar.push(...grupo);
  }
  if (!borrar.length) { if (!e.fin) nuevoPar(e); return; }
  // Los Grises que tocan un grupo se borran con él.
  const grises = new Set<string>();
  for (const [x, y] of borrar) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < COLS && ny < FILAS && e.celdas[ny][nx] && !esColor(e.celdas[ny][nx])) grises.add(nx + ',' + ny);
  }
  e.cadena++; e.mejorCadena = Math.max(e.mejorCadena, e.cadena);
  const pts = borrar.length * 2 * e.cadena + grises.size * 3;
  e.puntos += pts; e.borradas += borrar.length; e.grisesBorrados += grises.size;
  const [ax, ay] = borrar[0];
  e.avisos.push({ texto: e.cadena > 1 ? `+${pts} ×${e.cadena}` : `+${pts}`, x: ax, y: ay, t: 900 });
  e.limpiando = { celdas: [...borrar, ...[...grises].map(k => k.split(',').map(Number) as [number, number])], t: LIMPIAR_MS };
}

function terminarLimpieza(e: Pared) {
  for (const [x, y] of e.limpiando!.celdas) {
    const c = e.celdas[y][x];
    if (esColor(c)) e.mural[y][x] = c.color; // lo borrado pinta la pared
    e.celdas[y][x] = null;
  }
  e.limpiando = null;
  asentar(e);
  buscarGrupos(e); // cadena
}

function caerGrises(e: Pared) {
  const n = 1 + Math.floor(e.tiempo / 40000); // 1, 2 y después 3
  const cols = [...Array(COLS).keys()].sort(() => azar(e) - 0.5).slice(0, n);
  for (const x of cols) {
    if (e.celdas[0][x]) { e.fin = 'llena'; return; }
    e.celdas[0][x] = { gris: true };
  }
  asentar(e);
}

export function avanzarPared(e: Pared, dtMs: number) {
  if (e.fin) return;
  e.tiempo += dtMs;
  for (const a of e.avisos) a.t -= dtMs;
  e.avisos = e.avisos.filter(a => a.t > 0);
  if (e.tiempo >= DURACION) { e.fin = 'tiempo'; e.actual = null; return; }
  if (e.limpiando) {
    e.limpiando.t -= dtMs;
    if (e.limpiando.t <= 0) terminarLimpieza(e);
    return;
  }
  e.proximoGris -= dtMs;
  if (e.proximoGris <= 0 && e.actual) {
    e.proximoGris = CADA_GRIS;
    // Los Grises caen sin tocar el par que está bajando.
    const p = e.actual; e.actual = null; caerGrises(e);
    if (e.fin) return;
    e.actual = cabe(e, p) ? p : null;
    if (!e.actual) nuevoPar(e);
  }
  if (!e.actual) return;
  const paso = 750 - (e.tiempo / DURACION) * 400; // de 750 ms a 350 ms por fila
  e.caida += dtMs;
  if (e.caida >= paso) { e.caida = 0; bajarPaso(e); }
}

// Lo que queda para el mural: la pared pintada y, encima, las piezas que siguen en pie.
export function muralDePared(e: Pared): { pintura: (string | null)[][]; encima: Celda[][] } {
  return { pintura: e.mural.map(f => [...f]), encima: e.celdas.map(f => f.map(c => (c ? { ...c } : null))) };
}
