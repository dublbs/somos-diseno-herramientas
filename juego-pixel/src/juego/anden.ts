// «Hora punta» · Nivel 2, El andén (mecánica de atrapar y empujar). Lógica sin dibujo (plan docs/plans/009-juego-pixel.md).
// Una pantalla vista de lado, en celdas: x crece a la derecha, y crece hacia abajo y marca los pies de cada figura.
// La pintura sale de las latas del nivel 1; cada Gris que cae suelta una pieza del mural.
import { azar, entre, FORMAS, HUESO, TIROS_POR_LATA, type Aviso, type Forma, type Pieza } from './comun';

export const ANCHO_A = 16, ALTO_A = 12;
const G = 42, SALTO = 16.6, VEL_J = 5.2, VEL_GRIS = 2.1, VEL_BOLA = 10;
const ANCHO_F = 0.8; // ancho de cada figura
export const GOLPES_COLOR = 3, GOLPES_HUESO = 5;
export const VIDAS = 3;
const BOLA_MS = 6000, PIEZA_MS = 5000, PRISA_MS = 60000;

// Vigas: se pasan desde abajo y se pisan desde arriba. El piso (y = 11) es firme.
export interface Viga { y: number; x0: number; x1: number }
export const VIGAS: Viga[] = [
  { y: 11, x0: 0, x1: 16 },
  { y: 8, x0: 0, x1: 6 }, { y: 8, x0: 10, x1: 16 },
  { y: 5, x0: 3, x1: 13 },
  { y: 2, x0: 0, x1: 5 }, { y: 2, x0: 11, x1: 16 },
];

interface Cuerpo { x: number; y: number; vx: number; vy: number; suelo: boolean; ignora: number; mira: 1 | -1 }
export interface GrisA extends Cuerpo {
  id: number; golpes: number; color: string; bola: number; // bola: ms que le quedan encerrado (0 = suelto)
  rueda: { rebotes: number; combo: number } | null; salta: number; seca: number; fuera: boolean; // seca: ms hasta perder una capa
}
export interface Tiro { x: number; y: number; dir: 1 | -1; recorrido: number; color: string }
export interface PiezaSuelta extends Pieza { x: number; y: number; vy: number; t: number }
export type FinAnden = null | 'atrapado';
export interface Anden {
  semilla: number; jugador: Cuerpo;
  grises: GrisA[]; tiros: Tiro[]; piezas: PiezaSuelta[]; avisos: Aviso[];
  municion: string[]; juntadas: Pieza[]; oleada: number; tiempo: number; puntos: number;
  bolas: number; arrastrados: number; vidas: number; invulnerable: number; fin: FinAnden; limpio: boolean; siguienteId: number; formas: number;
  teclas: { izq: boolean; der: boolean };
}

const OLEADAS: [number, number][][] = [
  [[2, 2], [13, 2], [8, 5]],
  [[1, 2], [14, 2], [5, 5], [11, 5]],
];

const cuerpo = (x: number, y: number, mira: 1 | -1 = 1): Cuerpo => ({ x, y, vx: 0, vy: 0, suelo: false, ignora: -1, mira });

export function nuevoAnden(latas: string[], semilla = Date.now() % 100000): Anden {
  const e: Anden = {
    semilla, jugador: cuerpo(7.6, 11), grises: [], tiros: [], piezas: [], avisos: [],
    municion: latas.flatMap(c => Array<string>(TIROS_POR_LATA).fill(c)), juntadas: [], oleada: 0, tiempo: 0, puntos: 0,
    bolas: 0, arrastrados: 0, vidas: VIDAS, invulnerable: 0, fin: null, limpio: false, siguienteId: 1, formas: Math.floor(azar({ semilla }) * 4),
    teclas: { izq: false, der: false },
  };
  soltarOleada(e);
  return e;
}

function soltarOleada(e: Anden) {
  for (const [x, y] of OLEADAS[e.oleada]) {
    e.grises.push({ ...cuerpo(x, y - 3, azar(e) < 0.5 ? 1 : -1), id: e.siguienteId++, golpes: 0, color: HUESO, bola: 0, rueda: null, salta: entre(e, 1500, 3500), seca: 0, fuera: false });
  }
  e.oleada++;
}

function avisar(e: Anden, texto: string, x: number, y: number) { e.avisos.push({ texto, x, y, t: 900 }); }
const toca = (a: Cuerpo, b: Cuerpo, holgura = 0) => Math.abs(a.x - b.x) < ANCHO_F - holgura && Math.abs(a.y - b.y) < 0.85 - holgura;

// Gravedad y vigas: un cuerpo que cae se apoya en la primera viga que cruza con los pies.
function fisica(c: Cuerpo, dt: number) {
  const antes = c.y;
  c.vy = Math.min(c.vy + G * dt, 24);
  c.x += c.vx * dt; c.y += c.vy * dt;
  c.suelo = false;
  if (c.vy >= 0) {
    for (const v of VIGAS) {
      if (v.y === c.ignora) continue;
      if (antes <= v.y + 0.01 && c.y >= v.y && c.x + ANCHO_F > v.x0 + 0.15 && c.x < v.x1 - 0.15) {
        c.y = v.y; c.vy = 0; c.suelo = true; break;
      }
    }
  }
  if (c.y > ALTO_A - 1 + 0.001 && c.ignora !== ALTO_A - 1) { c.y = ALTO_A - 1; c.vy = 0; c.suelo = true; }
  if (c.suelo) c.ignora = -1;
}
const enBorde = (c: Cuerpo) => {
  const v = VIGAS.find(w => w.y === c.y && c.x + ANCHO_F > w.x0 && c.x < w.x1);
  if (!v || v.y === ALTO_A - 1) return false;
  return (c.mira > 0 && c.x + ANCHO_F + 0.05 >= v.x1) || (c.mira < 0 && c.x - 0.05 <= v.x0);
};

export function saltar(e: Anden) {
  const j = e.jugador;
  if (e.fin || e.limpio || !j.suelo) return;
  j.vy = -SALTO; j.suelo = false;
}
export function bajar(e: Anden) {
  const j = e.jugador;
  if (e.fin || e.limpio || !j.suelo || j.y >= ALTO_A - 1) return;
  j.ignora = j.y; j.y += 0.05; j.suelo = false;
}
export function lanzarA(e: Anden) {
  if (e.fin || e.limpio || e.tiros.length >= 2) return;
  const j = e.jugador, color = e.municion.shift() ?? HUESO;
  e.tiros.push({ x: j.x + (j.mira > 0 ? 0.6 : -0.2), y: j.y - 0.45, dir: j.mira, recorrido: 0, color });
}

function soltarPieza(e: Anden, g: GrisA) {
  const forma: Forma = FORMAS[e.formas++ % FORMAS.length];
  e.piezas.push({ color: g.color, forma, x: g.x, y: g.y - 0.5, vy: -8, t: PIEZA_MS });
}

export function avanzarAnden(e: Anden, dtMs: number) {
  if (e.fin || e.limpio) return;
  const dt = Math.min(dtMs, 50) / 1000, prisa = e.tiempo > PRISA_MS;
  if (e.tiempo < PRISA_MS && e.tiempo + dtMs >= PRISA_MS) avisar(e, '¡Se apuran!', ANCHO_A / 2 - 0.4, 4);
  e.tiempo += dtMs;

  // Tú.
  const j = e.jugador;
  e.invulnerable = Math.max(0, e.invulnerable - dtMs);
  j.vx = (e.teclas.der ? VEL_J : 0) - (e.teclas.izq ? VEL_J : 0);
  if (j.vx) j.mira = j.vx > 0 ? 1 : -1;
  fisica(j, dt);
  j.x = Math.max(0, Math.min(ANCHO_A - ANCHO_F, j.x));

  // Tiros: 12 celdas por segundo, hasta 5 celdas.
  for (const t of e.tiros) {
    t.x += t.dir * 12 * dt; t.recorrido += 12 * dt;
    if (t.recorrido > 5 || t.x < -0.5 || t.x > ANCHO_A) { t.recorrido = 99; continue; }
    const g = e.grises.find(h => !h.rueda && !h.fuera && h.bola === 0 && Math.abs(h.x + ANCHO_F / 2 - t.x) < 0.55 && t.y <= h.y && t.y >= h.y - 0.95);
    if (!g) continue;
    t.recorrido = 99; g.golpes++; g.color = t.color; g.vx = 0; g.seca = 2500;
    if (g.golpes >= (t.color === HUESO ? GOLPES_HUESO : GOLPES_COLOR)) {
      g.bola = BOLA_MS; e.bolas++; e.puntos += 2; avisar(e, '+2', g.x, g.y - 1);
    }
  }
  e.tiros = e.tiros.filter(t => t.recorrido < 99);

  // Grises, bolas y bolas que ruedan.
  for (const g of e.grises) {
    if (g.fuera) continue;
    if (g.rueda) {
      g.vx = g.mira * VEL_BOLA;
      fisica(g, dt);
      if (g.x <= 0 || g.x >= ANCHO_A - ANCHO_F) {
        g.x = Math.max(0, Math.min(ANCHO_A - ANCHO_F, g.x)); g.mira = g.mira > 0 ? -1 : 1; g.rueda.rebotes++;
        if (g.rueda.rebotes > 2) { g.fuera = true; e.puntos += 5; e.arrastrados++; soltarPieza(e, g); avisar(e, '+5', g.x, g.y - 1); continue; }
      }
      for (const o of e.grises) if (o !== g && !o.fuera && !o.rueda && toca(g, o)) {
        o.fuera = true; o.color = g.color; g.rueda.combo++;
        const pts = 5 * g.rueda.combo; e.puntos += pts; e.arrastrados++;
        soltarPieza(e, o);
        avisar(e, g.rueda.combo > 1 ? `+${pts} ×${g.rueda.combo}` : `+${pts}`, o.x, o.y - 1);
      }
      continue;
    }
    if (g.bola > 0) {
      g.vx = 0; fisica(g, dt);
      g.bola -= dtMs;
      if (g.bola <= 0) { g.bola = 0; g.golpes = 0; g.color = HUESO; } // se escapa
      // Caminar contra la bola la empuja.
      if (toca(j, g, -0.05) && j.vx !== 0 && Math.sign(g.x - j.x) === Math.sign(j.vx)) {
        g.rueda = { rebotes: 0, combo: 0 }; g.mira = j.vx > 0 ? 1 : -1; avisar(e, '¡Rueda!', g.x, g.y - 1);
      }
      continue;
    }
    // Suelto: camina, se da vuelta en paredes y bordes (a veces baja), y a veces salta a la viga de arriba.
    if (g.golpes > 0) { g.vx = 0; } else g.vx = g.mira * VEL_GRIS * (prisa ? 1.5 : 1);
    if (g.suelo && enBorde(g)) { if (azar(e) < 0.6) g.mira = g.mira > 0 ? -1 : 1; }
    g.salta -= dtMs;
    if (g.suelo && g.salta <= 0) {
      g.salta = entre(e, 2000, 4500);
      if (azar(e) < 0.5) { g.vy = -SALTO; g.suelo = false; } else if (g.y < ALTO_A - 1 && azar(e) < 0.5) { g.ignora = g.y; g.y += 0.05; }
      if (Math.abs(j.y - g.y) < 0.5) g.mira = j.x > g.x ? 1 : -1; // si estás en su viga, va hacia ti
    }
    // Un Gris con pintura se queda quieto; si pasan 2,5 s sin otro golpe se saca una capa (y otra cada 1,2 s).
    if (g.golpes > 0 && (g.seca -= dtMs) <= 0) { g.golpes--; g.seca = 1200; if (!g.golpes) g.color = HUESO; }
    fisica(g, dt);
    if (g.x <= 0 || g.x >= ANCHO_A - ANCHO_F) { g.x = Math.max(0, Math.min(ANCHO_A - ANCHO_F, g.x)); g.mira = g.mira > 0 ? -1 : 1; }
    if (e.invulnerable <= 0 && toca(j, g, 0.15)) {
      // Te tocó un Gris: pierdes una vida y vuelves al centro del andén, intocable por 2 s.
      e.vidas--; avisar(e, e.vidas ? '¡Ay!' : '', j.x, j.y - 1);
      if (!e.vidas) e.fin = 'atrapado';
      else { Object.assign(j, cuerpo(7.6, ALTO_A - 1, j.mira)); e.invulnerable = 2000; }
    }
  }
  e.grises = e.grises.filter(g => !g.fuera);

  // Piezas: caen, se apoyan y hay que ir a buscarlas antes de que se borren.
  for (const p of e.piezas) {
    const c = { x: p.x, y: p.y, vx: 0, vy: p.vy, suelo: false, ignora: -1, mira: 1 as const };
    fisica(c, dt); p.y = c.y; p.vy = c.vy; p.t -= dtMs;
    if (Math.abs(j.x - p.x) < 0.8 && Math.abs(j.y - p.y) < 1) {
      p.t = -1; e.juntadas.push({ color: p.color, forma: p.forma }); e.puntos += 3; avisar(e, '+3 pieza', p.x, p.y - 1);
    }
  }
  e.piezas = e.piezas.filter(p => p.t > 0);

  for (const a of e.avisos) a.t -= dtMs;
  e.avisos = e.avisos.filter(a => a.t > 0);

  if (!e.grises.length && !e.piezas.length) {
    if (e.oleada < OLEADAS.length) soltarOleada(e); else e.limpio = true;
  }
}

export const golpesQueFaltan = (g: GrisA) => (g.color === HUESO ? GOLPES_HUESO : GOLPES_COLOR) - g.golpes;
