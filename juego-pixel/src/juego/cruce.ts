// «Hora punta» · Nivel 1, El cruce (mecánica de cruzar carriles). Lógica sin dibujo (plan docs/plans/009-juego-pixel.md).
// Tablero de ANCHO columnas que avanza hacia arriba: la fila 0 es la de partida y `y` crece hacia adelante.
// En el camino hay latas de pintura: son la munición del nivel 2. El nivel termina en la entrada del metro (fila META).
import { azar, elegir, entre, PINTURAS, type Aviso } from './comun';

export const ANCHO = 13;
export const VISIBLES = 9; // filas que se ven
export const META = 30; // la entrada del metro
export const QUIETO_AVISO = 6000, QUIETO_FIN = 9000;
const COLORES_AUTO = ['#FFC20E', '#00A651', '#2B4BD8', '#FF8FB1', '#7A2E8E'];

export type TipoFila = 'vereda' | 'plaza' | 'calle' | 'metro' | 'estacion';
export type Obstaculo = 'arbol' | 'banca' | 'basurero';
export interface Vehiculo { x: number; largo: number; tipo: 'auto' | 'micro'; color: string }
export interface Fila {
  tipo: TipoFila;
  obstaculos: Map<number, Obstaculo>;
  latas: Map<number, string>; // columna → color
  dir: 1 | -1; vel: number; vehiculos: Vehiculo[]; // calle
  tren: { x: number; aviso: number; activo: boolean } | null; esperaTren: number; // metro
}
export type FinCruce = null | 'atropellado' | 'tren' | 'hora';
export interface Cruce {
  semilla: number; filas: Map<number, Fila>; generadas: number;
  jugador: { x: number; y: number; dx: number; dy: number; salto: number };
  avisos: Aviso[]; latas: string[];
  puntos: number; maxY: number; quieto: number; tiempo: number;
  camara: number; fin: FinCruce; llego: boolean;
}

const dificultad = (y: number) => Math.min(1, y / META);

function nuevaFila(e: Cruce, y: number): Fila {
  const f: Fila = { tipo: 'vereda', obstaculos: new Map(), latas: new Map(), dir: 1, vel: 0, vehiculos: [], tren: null, esperaTren: 0 };
  if (y >= META) { f.tipo = 'estacion'; return f; }
  if (y < 3) return f; // la partida: veredas libres
  const prev = e.filas.get(y - 1), prev2 = e.filas.get(y - 2);
  const callesSeguidas = prev?.tipo === 'calle' ? (prev2?.tipo === 'calle' ? 2 : 1) : 0;
  const d = dificultad(y), r = azar(e);
  if (prev?.tipo === 'metro' || y === META - 1) f.tipo = 'vereda';
  else if (y > 8 && r < 0.12) f.tipo = 'metro';
  else if (callesSeguidas < 2 + Math.round(d) && r < 0.55 + 0.15 * d) f.tipo = 'calle';
  else f.tipo = azar(e) < 0.4 ? 'plaza' : 'vereda';

  if (f.tipo === 'calle') {
    f.dir = azar(e) < 0.5 ? 1 : -1;
    f.vel = entre(e, 1.4, 2.4) + d * 1.8;
    const micro = azar(e) < 0.3;
    const largo = micro ? 3 : 2, hueco = Math.round(entre(e, 3.4, 6) - d) + largo;
    for (let x = entre(e, -2, 2); x < ANCHO + 4; x += hueco + Math.round(entre(e, 0, 3)))
      f.vehiculos.push({ x, largo, tipo: micro ? 'micro' : 'auto', color: elegir(e, COLORES_AUTO) });
    if (azar(e) < 0.3) f.latas.set(Math.floor(entre(e, 1, ANCHO - 1)), elegir(e, PINTURAS)); // más riesgo, más pintura
  } else if (f.tipo === 'metro') {
    f.esperaTren = entre(e, 1500, 5000);
  } else {
    // Obstáculos en las filas seguras: nunca tapan la fila completa ni la columna del medio en las primeras filas.
    const n = Math.floor(entre(e, 0, 3.5));
    for (let i = 0; i < n; i++) {
      const x = Math.floor(entre(e, 0, ANCHO));
      if (y < 6 && x === Math.floor(ANCHO / 2)) continue;
      f.obstaculos.set(x, f.tipo === 'plaza' ? 'arbol' : elegir(e, ['banca', 'basurero'] as Obstaculo[]));
    }
    if (azar(e) < 0.45) {
      const x = Math.floor(entre(e, 0, ANCHO));
      if (!f.obstaculos.has(x)) f.latas.set(x, elegir(e, PINTURAS));
    }
  }
  return f;
}

export function nuevoCruce(semilla = Date.now() % 100000): Cruce {
  const e: Cruce = {
    semilla, filas: new Map(), generadas: 0, jugador: { x: Math.floor(ANCHO / 2), y: 0, dx: 0, dy: 1, salto: 0 },
    avisos: [], latas: [], puntos: 0, maxY: 0, quieto: 0, tiempo: 0, camara: 0, fin: null, llego: false,
  };
  generarHasta(e, VISIBLES + 4);
  return e;
}
function generarHasta(e: Cruce, y: number) {
  while (e.generadas <= y) { e.filas.set(e.generadas, nuevaFila(e, e.generadas)); e.generadas++; }
}

export const fila = (e: Cruce, y: number) => e.filas.get(y);
const libre = (e: Cruce, x: number, y: number) => x >= 0 && x < ANCHO && y >= 0 && !fila(e, y)?.obstaculos.has(x);
function avisar(e: Cruce, texto: string, x: number, y: number) { e.avisos.push({ texto, x, y, t: 900 }); }

// Mover al jugador una celda.
export function mover(e: Cruce, dx: number, dy: number) {
  if (e.fin || e.llego) return;
  const j = e.jugador, x = j.x + dx, y = j.y + dy;
  j.dx = dx; j.dy = dy;
  if (!libre(e, x, y) || y < e.camara) return;
  j.x = x; j.y = y; j.salto = 1;
  if (y > e.maxY) { e.maxY = y; e.puntos += 1; e.quieto = 0; }
  generarHasta(e, y + VISIBLES + 2);
  const f = fila(e, y), lata = f?.latas.get(x);
  if (f && lata) { f.latas.delete(x); e.latas.push(lata); e.puntos += 1; avisar(e, '+1 lata', x, y); }
  if (y >= META) e.llego = true;
  revisarChoques(e);
}

function revisarChoques(e: Cruce) {
  const j = e.jugador, f = fila(e, j.y);
  if (!f || e.fin || e.llego) return;
  if (f.tipo === 'calle' && f.vehiculos.some(v => j.x + 0.8 > v.x && j.x + 0.2 < v.x + v.largo)) e.fin = 'atropellado';
  if (f.tipo === 'metro' && f.tren?.activo && j.x + 0.8 > f.tren.x && j.x + 0.2 < f.tren.x + 10) e.fin = 'tren';
}

export function avanzarCruce(e: Cruce, dtMs: number) {
  if (e.fin) return;
  const dt = Math.min(dtMs, 50) / 1000, d = dificultad(e.maxY);
  e.tiempo += dtMs; if (!e.llego) e.quieto += dtMs;
  e.jugador.salto = Math.max(0, e.jugador.salto - dt * 8);
  // La cámara sigue al jugador (deja 2 filas detrás) y nunca retrocede.
  e.camara = Math.max(e.camara, Math.min(e.jugador.y - 2, META - VISIBLES + 2));
  for (const k of [...e.filas.keys()]) if (k < e.camara - 2) e.filas.delete(k);

  for (let y = e.camara; y < e.camara + VISIBLES + 1; y++) {
    const f = fila(e, y);
    if (!f) continue;
    if (f.tipo === 'calle') {
      for (const v of f.vehiculos) {
        v.x += f.dir * f.vel * dt;
        if (f.dir > 0 && v.x > ANCHO + 3) v.x -= ANCHO + 3 + v.largo + 3;
        if (f.dir < 0 && v.x + v.largo < -3) v.x += ANCHO + 3 + v.largo + 3;
      }
    } else if (f.tipo === 'metro') {
      if (!f.tren) {
        f.esperaTren -= dtMs;
        if (f.esperaTren <= 0) f.tren = { x: -12, aviso: 1300, activo: false };
      } else if (f.tren.aviso > 0) f.tren.aviso -= dtMs;
      else {
        f.tren.activo = true; f.tren.x += (22 + d * 6) * dt;
        if (f.tren.x > ANCHO + 2) { f.tren = null; f.esperaTren = 2500 + (1 - d) * 3000; }
      }
    }
  }
  for (const a of e.avisos) a.t -= dtMs;
  e.avisos = e.avisos.filter(a => a.t > 0);

  revisarChoques(e);
  if (!e.fin && !e.llego && e.quieto > QUIETO_FIN) e.fin = 'hora';
}
