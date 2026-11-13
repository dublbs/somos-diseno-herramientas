// «Hora punta»: lógica del juego, sin dibujo (plan docs/plans/009-juego-pixel.md).
// Tablero de ANCHO columnas que avanza hacia arriba: la fila 0 es la de partida y `y` crece hacia adelante.
export const ANCHO = 13;
export const VISIBLES = 9; // filas que se ven
export const QUIETO_AVISO = 6000, QUIETO_FIN = 9000;
const PINTURAS = ['#FF8FB1', '#FFC20E', '#7FC8F8', '#00A651', '#7A2E8E'];
const COLORES_AUTO = ['#FFC20E', '#00A651', '#2B4BD8', '#FF8FB1', '#7A2E8E'];

export type TipoFila = 'vereda' | 'plaza' | 'calle' | 'metro';
export type Obstaculo = 'arbol' | 'banca' | 'basurero';
export interface Vehiculo { x: number; largo: number; tipo: 'auto' | 'micro'; color: string }
export interface Fila {
  tipo: TipoFila;
  obstaculos: Map<number, Obstaculo>;
  dir: 1 | -1; vel: number; vehiculos: Vehiculo[]; // calle
  tren: { x: number; aviso: number; activo: boolean } | null; esperaTren: number; // metro
}
export interface Gris { id: number; x: number; y: number; golpes: number; bola: boolean; libreEn: number; espera: number; rueda: { dx: number; dy: number; recorrido: number; acumulado: number; combo: number } | null; color: string }
export interface Disparo { x: number; y: number; dx: number; dy: number; recorrido: number; color: string }
export type Fin = null | 'atropellado' | 'tren' | 'atrapado' | 'hora';
export interface Aviso { texto: string; x: number; y: number; t: number }
export interface Estado {
  semilla: number; filas: Map<number, Fila>; generadas: number;
  jugador: { x: number; y: number; dx: number; dy: number; salto: number };
  grises: Gris[]; disparos: Disparo[]; avisos: Aviso[];
  puntos: number; maxY: number; bolas: number; arrastrados: number; quieto: number; tiempo: number; proximoGris: number;
  camara: number; fin: Fin; pintura: number; siguienteId: number;
}

// Generador pseudoaleatorio con semilla (mulberry32): el tablero no cambia al redibujar.
function azar(e: Estado) {
  e.semilla = (e.semilla + 0x6D2B79F5) | 0;
  let t = e.semilla;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const entre = (e: Estado, a: number, b: number) => a + azar(e) * (b - a);
const elegir = <T,>(e: Estado, l: T[]) => l[Math.floor(azar(e) * l.length)];
const dificultad = (y: number) => Math.min(1, y / 120); // 0 al partir, 1 a las 120 filas

function nuevaFila(e: Estado, y: number): Fila {
  const f: Fila = { tipo: 'vereda', obstaculos: new Map(), dir: 1, vel: 0, vehiculos: [], tren: null, esperaTren: 0 };
  if (y < 3) return f; // la partida: veredas libres
  const prev = e.filas.get(y - 1), prev2 = e.filas.get(y - 2);
  const callesSeguidas = prev?.tipo === 'calle' ? (prev2?.tipo === 'calle' ? 2 : 1) : 0;
  const d = dificultad(y), r = azar(e);
  if (prev?.tipo === 'metro') f.tipo = 'vereda';
  else if (y > 8 && r < 0.12) f.tipo = 'metro';
  else if (callesSeguidas < 2 + Math.round(d) && r < 0.55 + 0.15 * d) f.tipo = 'calle';
  else f.tipo = azar(e) < 0.4 ? 'plaza' : 'vereda';

  if (f.tipo === 'calle') {
    f.dir = azar(e) < 0.5 ? 1 : -1;
    f.vel = entre(e, 1.4, 2.6) + d * 2.4;
    const micro = azar(e) < 0.3;
    const largo = micro ? 3 : 2, hueco = Math.round(entre(e, 3.2, 6) - d * 1.2) + largo;
    for (let x = entre(e, -2, 2); x < ANCHO + 4; x += hueco + Math.round(entre(e, 0, 3)))
      f.vehiculos.push({ x, largo, tipo: micro ? 'micro' : 'auto', color: elegir(e, COLORES_AUTO) });
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
  }
  return f;
}

export function nuevoEstado(semilla = Date.now() % 100000): Estado {
  const e: Estado = {
    semilla, filas: new Map(), generadas: 0, jugador: { x: Math.floor(ANCHO / 2), y: 0, dx: 0, dy: 1, salto: 0 },
    grises: [], disparos: [], avisos: [], puntos: 0, maxY: 0, bolas: 0, arrastrados: 0, quieto: 0, tiempo: 0, proximoGris: 4000,
    camara: 0, fin: null, pintura: 0, siguienteId: 1,
  };
  generarHasta(e, VISIBLES + 4);
  return e;
}
function generarHasta(e: Estado, y: number) {
  while (e.generadas <= y) { e.filas.set(e.generadas, nuevaFila(e, e.generadas)); e.generadas++; }
}

export const fila = (e: Estado, y: number) => e.filas.get(y);
const segura = (f: Fila | undefined) => !!f && (f.tipo === 'vereda' || f.tipo === 'plaza');
const libre = (e: Estado, x: number, y: number) => x >= 0 && x < ANCHO && y >= 0 && !fila(e, y)?.obstaculos.has(x);
const grisEn = (e: Estado, x: number, y: number) => e.grises.find(g => g.x === x && g.y === y && !g.rueda);

function avisar(e: Estado, texto: string, x: number, y: number) { e.avisos.push({ texto, x, y, t: 900 }); }

// Mover al jugador una celda. Si hay una bola de pintura en el camino, la empuja.
export function mover(e: Estado, dx: number, dy: number) {
  if (e.fin) return;
  const j = e.jugador, x = j.x + dx, y = j.y + dy;
  j.dx = dx; j.dy = dy;
  if (!libre(e, x, y) || y < e.camara) return;
  const g = grisEn(e, x, y);
  if (g?.bola) {
    g.rueda = { dx, dy, recorrido: 0, acumulado: 0, combo: 0 };
    avisar(e, '¡Al ataque!', x, y);
    return;
  }
  j.x = x; j.y = y; j.salto = 1;
  if (y > e.maxY) { e.maxY = y; e.puntos += 1; e.quieto = 0; }
  generarHasta(e, y + VISIBLES + 2);
  revisarChoques(e);
}

// Lanzar pintura hacia donde mira el jugador.
export function lanzar(e: Estado) {
  if (e.fin || e.disparos.length >= 3) return;
  const j = e.jugador, color = PINTURAS[e.pintura++ % PINTURAS.length];
  e.disparos.push({ x: j.x, y: j.y, dx: j.dx || 0, dy: j.dx ? 0 : (j.dy || 1), recorrido: 0, color });
}

function revisarChoques(e: Estado) {
  const j = e.jugador, f = fila(e, j.y);
  if (!f || e.fin) return;
  if (f.tipo === 'calle' && f.vehiculos.some(v => j.x + 0.8 > v.x && j.x + 0.2 < v.x + v.largo)) e.fin = 'atropellado';
  if (f.tipo === 'metro' && f.tren?.activo && j.x + 0.8 > f.tren.x && j.x + 0.2 < f.tren.x + 10) e.fin = 'tren';
  if (e.grises.some(g => !g.bola && !g.rueda && g.x === j.x && g.y === j.y)) e.fin = 'atrapado';
}

export function avanzar(e: Estado, dtMs: number) {
  if (e.fin) return;
  const dt = Math.min(dtMs, 50) / 1000, d = dificultad(e.maxY);
  e.tiempo += dtMs; e.quieto += dtMs;
  e.jugador.salto = Math.max(0, e.jugador.salto - dt * 8);
  // La cámara sigue al jugador (deja 2 filas detrás) y nunca retrocede.
  e.camara = Math.max(e.camara, e.jugador.y - 2);
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
        f.tren.activo = true; f.tren.x += (22 + d * 8) * dt;
        if (f.tren.x > ANCHO + 2) { f.tren = null; f.esperaTren = 2500 + (1 - d) * 3000; }
      }
    }
  }

  // Disparos: avanzan 14 celdas/s, hasta 4 celdas; un golpe pinta al Gris (3 golpes = bola).
  for (const s of e.disparos) {
    s.recorrido += 14 * dt;
    const paso = Math.floor(s.recorrido) + 1;
    const cx = s.x + s.dx * paso, cy = s.y + s.dy * paso;
    if (!libre(e, cx, cy) || paso > 4) { s.recorrido = 99; continue; }
    const g = e.grises.find(h => h.x === cx && h.y === cy && !h.bola && !h.rueda);
    if (g) {
      g.golpes++; g.color = s.color; s.recorrido = 99;
      if (g.golpes >= 3) { g.bola = true; g.libreEn = 5000; e.bolas++; e.puntos += 2; avisar(e, '+2', cx, cy); }
    }
  }
  e.disparos = e.disparos.filter(s => s.recorrido < 99);

  // Grises: aparecen adelante en filas seguras y persiguen al jugador sin pisar calles ni vías.
  e.proximoGris -= dtMs;
  const activos = e.grises.filter(g => !g.bola).length;
  if (e.proximoGris <= 0 && activos < 2 + Math.round(d * 3)) {
    e.proximoGris = 4500 - d * 2500;
    for (let intento = 0; intento < 8; intento++) {
      const y = e.jugador.y + Math.floor(entre(e, 2, 6)), x = Math.floor(entre(e, 0, ANCHO));
      if (segura(fila(e, y)) && libre(e, x, y) && !grisEn(e, x, y)) {
        e.grises.push({ id: e.siguienteId++, x, y, golpes: 0, bola: false, libreEn: 0, espera: 900, rueda: null, color: '#FF8FB1' });
        break;
      }
    }
  }
  for (const g of e.grises) {
    if (g.rueda) {
      // La bola rueda 10 celdas/s; arrastra a los Grises que encuentra (combo) y se rompe contra un obstáculo.
      g.rueda.acumulado += 10 * dt;
      while (g.rueda && g.rueda.acumulado >= 1) {
        g.rueda.acumulado -= 1;
        const nx = g.x + g.rueda.dx, ny = g.y + g.rueda.dy;
        if (!libre(e, nx, ny) || g.rueda.recorrido > 12) { g.golpes = -1; break; }
        g.x = nx; g.y = ny; g.rueda.recorrido++;
        for (const o of e.grises) if (o !== g && !o.rueda && o.x === nx && o.y === ny && o.golpes >= 0) {
          g.rueda.combo++; o.golpes = -1;
          const pts = 5 * g.rueda.combo; e.puntos += pts; e.arrastrados++;
          avisar(e, g.rueda.combo > 1 ? `+${pts} ×${g.rueda.combo}` : `+${pts}`, nx, ny);
        }
      }
      continue;
    }
    if (g.bola) {
      g.libreEn -= dtMs;
      if (g.libreEn <= 0) { g.bola = false; g.golpes = 0; } // se escapa de la bola
      continue;
    }
    g.espera -= dtMs;
    if (g.espera > 0) continue;
    g.espera = 750 - d * 300;
    const j = e.jugador, pasos: [number, number][] = [];
    if (j.x !== g.x) pasos.push([Math.sign(j.x - g.x), 0]);
    if (j.y !== g.y) pasos.push([0, Math.sign(j.y - g.y)]);
    if (Math.abs(j.y - g.y) > Math.abs(j.x - g.x)) pasos.reverse();
    for (const [dx, dy] of pasos) {
      const nx = g.x + dx, ny = g.y + dy;
      if (libre(e, nx, ny) && segura(fila(e, ny)) && !grisEn(e, nx, ny)) { g.x = nx; g.y = ny; break; }
    }
  }
  e.grises = e.grises.filter(g => g.golpes >= 0 && g.y >= e.camara - 1);

  for (const a of e.avisos) a.t -= dtMs;
  e.avisos = e.avisos.filter(a => a.t > 0);

  revisarChoques(e);
  if (!e.fin && e.quieto > QUIETO_FIN) e.fin = 'hora';
}

export const TEXTO_FIN: Record<Exclude<Fin, null>, string> = {
  atropellado: '¡Te atropellaron!',
  tren: '¡Pasó el metro!',
  atrapado: '¡Un Gris te borró!',
  hora: 'Se te pasó la hora punta',
};
