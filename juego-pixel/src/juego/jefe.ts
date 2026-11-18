// «Hora punta» · Jefe: el Inacapín Pixel (plan docs/plans/009-juego-pixel.md, ronda 2). Lógica sin dibujo.
// La misma arena del andén (16 × 12 celdas, y crece hacia abajo y marca los pies). El Inacapín, gigante y gris, ocupa
// una esquina del piso y lanza Grises, manchas y gotas. Atrapas Grises en bolas y las haces rodar contra él: cada bola
// que lo toca le devuelve un color. 6 golpes en 3 fases (cada 2 golpes cambia de esquina y se apura).
import { ALTO_A, ANCHO_A, ANCHO_F, cuerpo, enBorde, fisica, SALTO, toca, VEL_BOLA, VEL_GRIS, VEL_J, VIDAS, type Cuerpo, type GrisA, type Tiro, type Viga } from './anden';
import { azar, entre, PINTURAS, type Aviso } from './comun';

export const GOLPES_JEFE = 6, GOLPES_GRIS = 2;
export const ANCHO_JEFE = 3, ALTO_JEFE = 3;
// Colores que recupera, en orden: antenas, cabeza, cara, brazos, panza y pies.
export const COLORES_JEFE = ['#FF8FB1', '#FFC20E', '#7FC8F8', '#00A651', '#7A2E8E', '#0062B8'];
const BOLA_MS = 6000, SALTO_JEFE_MS = 1200, CELEBRA_MS = 2600;

export const VIGAS_JEFE: Viga[] = [
  { y: 11, x0: 0, x1: 16 },
  { y: 8, x0: 4.5, x1: 11.5 },
  { y: 5, x0: 0, x1: 5 }, { y: 5, x0: 11, x1: 16 },
];

export type TipoAtaque = 'gris' | 'mancha' | 'gotas';
export interface Ataque { tipo: TipoAtaque; t: number; total: number; columnas: number[] }
export interface Mancha { x: number; dir: 1 | -1; vel: number; fuera: boolean }
export interface Gota { x: number; y: number; vy: number; aviso: number; fuera: boolean }
export type FinJefe = null | 'derrota' | 'victoria';
export interface Jefe {
  semilla: number; jugador: Cuerpo; teclas: { izq: boolean; der: boolean };
  grises: GrisA[]; tiros: Tiro[]; manchas: Mancha[]; gotas: Gota[]; avisos: Aviso[];
  colores: string[]; siguiente: number; // tu pintura: tus colores, en orden y sin fin
  golpes: number; lado: 1 | -1; // 1 = esquina derecha
  ataque: Ataque | null; espera: number; herido: number; cambio: number; // cambio: ms del salto de esquina
  vidas: number; invulnerable: number; tiempo: number; puntos: number; bolas: number; arrastrados: number;
  fin: FinJefe; celebra: number; siguienteId: number; avisoDirecto: number;
}

export const fase = (e: Jefe) => (e.golpes < 2 ? 1 : e.golpes < 4 ? 2 : 3);
export const xJefe = (e: Jefe) => (e.lado > 0 ? ANCHO_A - ANCHO_JEFE : 0);
const yTope = ALTO_A - 1 - ALTO_JEFE;

export function nuevoJefe(colores: string[], semilla = Date.now() % 100000): Jefe {
  const tuyos = [...new Set(colores)].filter(c => PINTURAS.includes(c));
  return {
    semilla, jugador: cuerpo(5, ALTO_A - 1), teclas: { izq: false, der: false },
    grises: [], tiros: [], manchas: [], gotas: [], avisos: [],
    colores: tuyos.length ? tuyos : PINTURAS.slice(0, 3), siguiente: 0,
    golpes: 0, lado: 1, ataque: null, espera: 1500, herido: 0, cambio: 0,
    vidas: VIDAS, invulnerable: 0, tiempo: 0, puntos: 0, bolas: 0, arrastrados: 0,
    fin: null, celebra: 0, siguienteId: 1, avisoDirecto: 0,
  };
}

const activo = (e: Jefe) => !e.fin && !e.celebra;
export const proximoColor = (e: Jefe) => e.colores[e.siguiente % e.colores.length];
function avisar(e: Jefe, texto: string, x: number, y: number) { e.avisos.push({ texto, x, y, t: 900 }); }

export function saltarJ(e: Jefe) {
  const j = e.jugador;
  if (!activo(e) || !j.suelo) return;
  j.vy = -SALTO; j.suelo = false;
}
export function bajarJ(e: Jefe) {
  const j = e.jugador;
  if (!activo(e) || !j.suelo || j.y >= ALTO_A - 1) return;
  j.ignora = j.y; j.y += 0.05; j.suelo = false;
}
export function lanzarJ(e: Jefe) {
  if (!activo(e) || e.tiros.length >= 2) return;
  const j = e.jugador, color = proximoColor(e);
  e.siguiente++;
  e.tiros.push({ x: j.x + (j.mira > 0 ? 0.6 : -0.2), y: j.y - 0.45, dir: j.mira, recorrido: 0, color });
}

// ¿Toca la caja del Inacapín? (no mientras salta de esquina)
const enJefe = (e: Jefe, x: number, y: number, ancho = ANCHO_F) => !e.cambio && x + ancho > xJefe(e) + 0.2 && x < xJefe(e) + ANCHO_JEFE - 0.2 && y > yTope + 0.3;

function elegirAtaque(e: Jefe): Ataque {
  const f = fase(e), vivos = e.grises.length, maxGrises = f === 3 ? 3 : 2;
  const r = azar(e);
  let tipo: TipoAtaque;
  if (!vivos) tipo = 'gris';
  else if (vivos >= maxGrises) tipo = f === 1 || r < 0.5 ? 'mancha' : 'gotas';
  else if (f === 1) tipo = r < 0.6 ? 'gris' : 'mancha';
  else tipo = r < 0.4 ? 'gris' : r < 0.7 ? 'mancha' : 'gotas';
  const total = tipo === 'gris' ? 700 : tipo === 'mancha' ? 900 : 1000;
  const columnas: number[] = [];
  if (tipo === 'gotas') {
    const libres = Array.from({ length: ANCHO_A }, (_, i) => i).filter(i => i < xJefe(e) - 0.5 || i >= xJefe(e) + ANCHO_JEFE);
    while (columnas.length < f && libres.length) columnas.push(libres.splice(Math.floor(azar(e) * libres.length), 1)[0]);
  }
  return { tipo, t: total, total, columnas };
}

function lanzarAtaque(e: Jefe, a: Ataque) {
  const f = fase(e), boca = e.lado > 0 ? xJefe(e) - 0.9 : xJefe(e) + ANCHO_JEFE + 0.1;
  const hacia: 1 | -1 = e.lado > 0 ? -1 : 1;
  if (a.tipo === 'gris') {
    const g: GrisA = { ...cuerpo(boca, yTope + 1.5, hacia), id: e.siguienteId++, golpes: 0, color: '#F4EEE3', bola: 0, rueda: null, salta: entre(e, 1800, 3500), seca: 0, fuera: false };
    g.vy = -10; g.vx = hacia * 3;
    e.grises.push(g);
  } else if (a.tipo === 'mancha') {
    e.manchas.push({ x: boca, dir: hacia, vel: f === 3 ? 7.5 : 6, fuera: false });
  } else {
    for (const x of a.columnas) e.gotas.push({ x: x + 0.5, y: -0.5, vy: 0, aviso: 0, fuera: false });
  }
}

function perderVida(e: Jefe) {
  const j = e.jugador;
  if (e.invulnerable > 0 || !activo(e)) return;
  e.vidas--; avisar(e, e.vidas ? '¡Ay!' : '', j.x, j.y - 1);
  if (!e.vidas) { e.fin = 'derrota'; return; }
  Object.assign(j, cuerpo(e.lado > 0 ? 3 : ANCHO_A - 4, ALTO_A - 1, e.lado > 0 ? 1 : -1));
  e.invulnerable = 2000;
}

function golpear(e: Jefe, g: GrisA) {
  g.fuera = true; e.golpes++; e.herido = 700; e.puntos += 10;
  avisar(e, '+10 ¡color!', xJefe(e) + 1, yTope);
  if (e.golpes >= GOLPES_JEFE) {
    e.celebra = CELEBRA_MS; e.puntos += 30; e.ataque = null; e.grises = []; e.manchas = []; e.gotas = [];
    avisar(e, '+30', xJefe(e) + 1, yTope - 1);
    return;
  }
  if (e.golpes % 2 === 0) { e.cambio = SALTO_JEFE_MS; e.ataque = null; e.espera = SALTO_JEFE_MS + 800; avisar(e, `¡Fase ${fase(e)}!`, ANCHO_A / 2 - 0.5, 3); }
}

export function avanzarJefe(e: Jefe, dtMs: number) {
  if (e.fin) return;
  const dt = Math.min(dtMs, 50) / 1000, f = fase(e);
  e.tiempo += dtMs;
  for (const a of e.avisos) a.t -= dtMs;
  e.avisos = e.avisos.filter(a => a.t > 0);
  e.herido = Math.max(0, e.herido - dtMs);
  if (e.celebra) { e.celebra = Math.max(0, e.celebra - dtMs); if (!e.celebra) e.fin = 'victoria'; return; }
  e.avisoDirecto = Math.max(0, e.avisoDirecto - dtMs);

  // El Inacapín cambia de esquina de un salto.
  if (e.cambio) {
    const antes = e.cambio;
    e.cambio = Math.max(0, e.cambio - dtMs);
    if (antes > SALTO_JEFE_MS / 2 && e.cambio <= SALTO_JEFE_MS / 2) e.lado = e.lado > 0 ? -1 : 1;
    if (!e.cambio) { // si caes encima, te corre
      const j = e.jugador;
      if (j.x + ANCHO_F > xJefe(e) && j.x < xJefe(e) + ANCHO_JEFE) j.x = e.lado > 0 ? xJefe(e) - 1.2 : xJefe(e) + ANCHO_JEFE + 0.4;
    }
  }

  // Ataques: avisa, espera y lanza.
  if (!e.cambio) {
    if (e.ataque) {
      e.ataque.t -= dtMs;
      if (e.ataque.t <= 0) { lanzarAtaque(e, e.ataque); e.ataque = null; e.espera = [4400, 3800, 3200][f - 1]; }
    } else if ((e.espera -= dtMs) <= 0) e.ataque = elegirAtaque(e);
  }

  // Tú.
  const j = e.jugador;
  e.invulnerable = Math.max(0, e.invulnerable - dtMs);
  j.vx = (e.teclas.der ? VEL_J : 0) - (e.teclas.izq ? VEL_J : 0);
  if (j.vx) j.mira = j.vx > 0 ? 1 : -1;
  fisica(j, dt, VIGAS_JEFE);
  j.x = Math.max(0, Math.min(ANCHO_A - ANCHO_F, j.x));
  if (enJefe(e, j.x, j.y)) { // el Inacapín es una pared que te empuja de un salto (no quita vidas: medido con bots, ver plan)
    j.x = e.lado > 0 ? Math.min(j.x, xJefe(e) + 0.2 - ANCHO_F) - 1 : Math.max(j.x, xJefe(e) + ANCHO_JEFE - 0.2) + 1;
    if (j.suelo) { j.vy = -9; j.suelo = false; }
  }

  // Tiros.
  for (const t of e.tiros) {
    t.x += t.dir * 12 * dt; t.recorrido += 12 * dt;
    if (t.recorrido > 5 || t.x < -0.5 || t.x > ANCHO_A) { t.recorrido = 99; continue; }
    if (enJefe(e, t.x - 0.1, t.y, 0.2)) {
      t.recorrido = 99;
      if (!e.avisoDirecto) { avisar(e, '¡Con una bola!', xJefe(e) + 0.5, yTope - 0.3); e.avisoDirecto = 2500; }
      continue;
    }
    const g = e.grises.find(h => !h.rueda && !h.fuera && h.bola === 0 && Math.abs(h.x + ANCHO_F / 2 - t.x) < 0.55 && t.y <= h.y && t.y >= h.y - 0.95);
    if (!g) continue;
    t.recorrido = 99; g.golpes++; g.color = t.color; g.vx = 0; g.seca = 2500;
    if (g.golpes >= GOLPES_GRIS) { g.bola = BOLA_MS; e.bolas++; e.puntos += 2; avisar(e, '+2', g.x, g.y - 1); }
  }
  e.tiros = e.tiros.filter(t => t.recorrido < 99);

  // Grises y bolas.
  for (const g of e.grises) {
    if (g.fuera) continue;
    if (g.rueda) {
      g.vx = g.mira * VEL_BOLA;
      fisica(g, dt, VIGAS_JEFE);
      if (enJefe(e, g.x, g.y)) { golpear(e, g); continue; }
      if (g.x <= 0 || g.x >= ANCHO_A - ANCHO_F) {
        g.x = Math.max(0, Math.min(ANCHO_A - ANCHO_F, g.x)); g.mira = g.mira > 0 ? -1 : 1; g.rueda.rebotes++;
        if (g.rueda.rebotes > 3) { g.fuera = true; avisar(e, 'Se rompió', g.x, g.y - 1); continue; }
      }
      for (const o of e.grises) if (o !== g && !o.fuera && !o.rueda && toca(g, o)) {
        o.fuera = true; g.rueda.combo++;
        const pts = 5 * g.rueda.combo; e.puntos += pts; e.arrastrados++;
        avisar(e, `+${pts}`, o.x, o.y - 1);
      }
      continue;
    }
    if (g.bola > 0) {
      g.vx = 0; fisica(g, dt, VIGAS_JEFE);
      g.bola -= dtMs;
      if (g.bola <= 0) { g.bola = 0; g.golpes = 0; g.color = '#F4EEE3'; }
      if (toca(j, g, -0.05) && j.vx !== 0 && Math.sign(g.x - j.x) === Math.sign(j.vx)) {
        g.rueda = { rebotes: 0, combo: 0 }; g.mira = j.vx > 0 ? 1 : -1; avisar(e, '¡Rueda!', g.x, g.y - 1);
      }
      continue;
    }
    g.vx = g.golpes > 0 ? 0 : g.mira * VEL_GRIS * (1 + 0.18 * (f - 1));
    if (g.suelo && enBorde(g, VIGAS_JEFE) && azar(e) < 0.6) g.mira = g.mira > 0 ? -1 : 1;
    g.salta -= dtMs;
    if (g.suelo && g.salta <= 0) {
      g.salta = entre(e, 2200, 4500);
      if (azar(e) < 0.45) { g.vy = -SALTO; g.suelo = false; } else if (g.y < ALTO_A - 1 && azar(e) < 0.5) { g.ignora = g.y; g.y += 0.05; }
      if (Math.abs(j.y - g.y) < 0.5) g.mira = j.x > g.x ? 1 : -1;
    }
    if (g.golpes > 0 && (g.seca -= dtMs) <= 0) { g.golpes--; g.seca = 1200; if (!g.golpes) g.color = '#F4EEE3'; }
    fisica(g, dt, VIGAS_JEFE);
    if (g.x <= 0 || g.x >= ANCHO_A - ANCHO_F) { g.x = Math.max(0, Math.min(ANCHO_A - ANCHO_F, g.x)); g.mira = g.mira > 0 ? -1 : 1; }
    if (enJefe(e, g.x, g.y)) { g.x = e.lado > 0 ? xJefe(e) + 0.2 - ANCHO_F : xJefe(e) + ANCHO_JEFE - 0.2; g.mira = e.lado > 0 ? -1 : 1; }
    if (toca(j, g, 0.15)) perderVida(e);
  }
  e.grises = e.grises.filter(g => !g.fuera);

  // Manchas que ruedan por el piso (se saltan).
  for (const m of e.manchas) {
    m.x += m.dir * m.vel * dt;
    if (m.x < -1 || m.x > ANCHO_A + 1) m.fuera = true;
    if (Math.abs(m.x - (j.x + ANCHO_F / 2)) < 0.65 && j.y > ALTO_A - 1 - 0.6) perderVida(e);
  }
  e.manchas = e.manchas.filter(m => !m.fuera);

  // Gotas: caen del techo en las columnas marcadas.
  for (const g of e.gotas) {
    g.vy = Math.min(g.vy + 30 * dt, 16); g.y += g.vy * dt;
    if (g.y >= ALTO_A - 1) g.fuera = true;
    if (Math.abs(g.x - (j.x + ANCHO_F / 2)) < 0.6 && g.y > j.y - 1 && g.y < j.y + 0.1) { perderVida(e); g.fuera = true; }
  }
  e.gotas = e.gotas.filter(g => !g.fuera);
}

// Para el dibujo y el HUD: cuánto color recuperó (0 a 1) y qué partes ya tienen color.
export const recuperado = (e: Jefe) => e.golpes / GOLPES_JEFE;
