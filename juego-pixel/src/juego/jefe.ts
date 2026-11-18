// «Hora punta» · Jefe: el Inacapín (plan docs/plans/009-juego-pixel.md, ronda 3). Lógica sin dibujo.
// La misma arena del andén (16 × 12 celdas, y crece hacia abajo y marca los pies). El Inacapín (el de Figma, gris) se
// mueve todo el tiempo: camina hacia ti, salta entre el piso y las vigas, escupe Grises y embiste. Atrapas Grises en
// bolas y las haces rodar contra él: cada bola que lo toca le devuelve su rojo. 9 golpes en 3 fases (cada 3 golpes).
// Mecánicas tomadas del primer jefe de Snow Bros y de la dificultad de los jefes de Cuphead; el arte es de la campaña.
import { ALTO_A, ANCHO_A, ANCHO_F, cuerpo, enBorde, fisica, SALTO, toca, VEL_BOLA, VEL_GRIS, VEL_J, VIDAS, type Cuerpo, type GrisA, type Tiro, type Viga } from './anden';
import { azar, entre, PINTURAS, type Aviso, type Evento } from './comun';

export const GOLPES_JEFE = 9, GOLPES_GRIS = 2, GOLPES_FASE = 3;
export const VIDAS_JEFE = VIDAS + 2; // 5 corazones: la pelea es larga (medido con bots, ver plan)
export const ANCHO_JEFE = 2.4, ALTO_JEFE = 3; // la caja del libro, en celdas
export const ROJO = '#E2001A'; // el rojo INACAP del Inacapín de Figma
const BOLA_MS = 6000, CELEBRA_MS = 2600, HERIDO_MS = 900, RUGE_MS = 1200, G_JEFE = 30;
const PISO = ALTO_A - 1;

export const VIGAS_JEFE: Viga[] = [
  { y: 11, x0: 0, x1: 16 },
  { y: 8, x0: 4.5, x1: 11.5 },
  { y: 5, x0: 0, x1: 5 }, { y: 5, x0: 11, x1: 16 },
];

// Lo que está haciendo el Inacapín. `t` cuenta hacia atrás (ms) el estado actual.
export type EstadoJefe = 'camina' | 'agacha' | 'salta' | 'escupe' | 'carga' | 'embiste' | 'mareado' | 'ruge';
export interface Inacapin { x: number; y: number; vx: number; vy: number; mira: 1 | -1; estado: EstadoJefe; t: number; destino: { x: number; y: number } | null }
export interface Onda { x: number; dir: 1 | -1; fuera: boolean }
export interface Gota { x: number; y: number; vy: number; fuera: boolean }
export interface Marca { x: number; t: number; tipo: 'gota' | 'gris' } // aviso en el techo antes de que algo caiga
export type FinJefe = null | 'derrota' | 'victoria';
export interface Jefe {
  semilla: number; jugador: Cuerpo; teclas: { izq: boolean; der: boolean };
  grises: GrisA[]; tiros: Tiro[]; ondas: Onda[]; gotas: Gota[]; marcas: Marca[]; avisos: Aviso[]; eventos: Evento[];
  colores: string[]; siguiente: number; // tu pintura: tus colores, en orden y sin fin
  jefe: Inacapin; golpes: number; herido: number; caen: number; // caen: ms hasta la próxima lluvia del techo
  vidas: number; invulnerable: number; tiempo: number; puntos: number; bolas: number; arrastrados: number;
  fin: FinJefe; celebra: number; siguienteId: number; avisoDirecto: number;
}

export const fase = (e: Jefe) => (e.golpes < GOLPES_FASE ? 1 : e.golpes < 2 * GOLPES_FASE ? 2 : 3);
// Ritmo por fase: velocidad al caminar, cuánto camina entre ataques, aviso del salto y del escupo, Grises vivos.
const RITMO = {
  1: { camina: 1.3, pausa: 1700, agacha: 520, escupe: 650, carga: 1000, maxGrises: 1, salto: 1050, caen: 0 },
  2: { camina: 1.7, pausa: 1300, agacha: 450, escupe: 600, carga: 1200, maxGrises: 1, salto: 950, caen: 6500 },
  3: { camina: 2.1, pausa: 1000, agacha: 400, escupe: 550, carga: 1000, maxGrises: 2, salto: 850, caen: 5000 },
} as const;
const ritmo = (e: Jefe) => RITMO[fase(e)];

export function nuevoJefe(colores: string[], semilla = Date.now() % 100000): Jefe {
  const tuyos = [...new Set(colores)].filter(c => PINTURAS.includes(c));
  return {
    semilla, jugador: cuerpo(3, PISO, 1), teclas: { izq: false, der: false },
    grises: [], tiros: [], ondas: [], gotas: [], marcas: [], avisos: [], eventos: [],
    colores: tuyos.length ? tuyos : PINTURAS.slice(0, 3), siguiente: 0,
    jefe: { x: ANCHO_A - ANCHO_JEFE - 1.5, y: PISO, vx: 0, vy: 0, mira: -1, estado: 'camina', t: 1400, destino: null },
    golpes: 0, herido: 0, caen: RITMO[2].caen,
    vidas: VIDAS_JEFE, invulnerable: 0, tiempo: 0, puntos: 0, bolas: 0, arrastrados: 0,
    fin: null, celebra: 0, siguienteId: 1, avisoDirecto: 0,
  };
}

const activo = (e: Jefe) => !e.fin && !e.celebra;
export const proximoColor = (e: Jefe) => e.colores[e.siguiente % e.colores.length];
function avisar(e: Jefe, texto: string, x: number, y: number) { e.avisos.push({ texto, x, y, t: 900 }); }
function evento(e: Jefe, ev: Evento) { e.eventos.push(ev); if (e.eventos.length > 60) e.eventos.shift(); }
export const enElAire = (b: Inacapin) => b.estado === 'salta';
export const xJefe = (e: Jefe) => e.jefe.x;

export function saltarJ(e: Jefe) {
  const j = e.jugador;
  if (!activo(e) || !j.suelo) return;
  j.vy = -SALTO; j.suelo = false;
}
export function bajarJ(e: Jefe) {
  const j = e.jugador;
  if (!activo(e) || !j.suelo || j.y >= PISO) return;
  j.ignora = j.y; j.y += 0.05; j.suelo = false;
}
export function lanzarJ(e: Jefe) {
  if (!activo(e) || e.tiros.length >= 2) return;
  const j = e.jugador, color = proximoColor(e);
  e.siguiente++;
  e.tiros.push({ x: j.x + (j.mira > 0 ? 0.6 : -0.2), y: j.y - 0.45, dir: j.mira, recorrido: 0, color });
}

// Agachado (cuando carga y embiste) mide menos: la embestida se puede saltar.
export const altoJefe = (b: Inacapin) => (b.estado === 'carga' || b.estado === 'embiste' ? 1.4 : ALTO_JEFE);
// ¿Una caja (x, y pies, ancho, alto) toca al Inacapín? Su caja es el libro: ANCHO_JEFE × alto sobre sus pies.
export const tocaJefe = (e: Jefe, x: number, y: number, ancho = ANCHO_F, alto = 0.85) => {
  const b = e.jefe;
  return x + ancho > b.x + 0.1 && x < b.x + ANCHO_JEFE - 0.1 && y > b.y - altoJefe(b) + 0.15 && y - alto < b.y - 0.05;
};
// La viga (o el piso) bajo una x a cierta altura.
const vigaEn = (x: number, y: number) => VIGAS_JEFE.find(v => v.y === y && x + ANCHO_JEFE > v.x0 + 0.3 && x < v.x1 - 0.3);
const vigaDe = (b: Inacapin) => VIGAS_JEFE.find(v => v.y === b.y && b.x + ANCHO_JEFE / 2 >= v.x0 - 0.01 && b.x + ANCHO_JEFE / 2 <= v.x1 + 0.01) ?? VIGAS_JEFE[0];

function perderVida(e: Jefe, texto = '¡Ay!') {
  const j = e.jugador;
  if (e.invulnerable > 0 || !activo(e)) return;
  e.vidas--; avisar(e, e.vidas ? texto : '', j.x, j.y - 1);
  evento(e, { tipo: 'dano', x: j.x + 0.4, y: j.y - 0.5, color: '#8F8F8A' });
  if (!e.vidas) { e.fin = 'derrota'; return; }
  e.invulnerable = 2000;
  // Vuelves al piso, en el lado contrario al Inacapín, intocable por 2 s.
  const lejos = e.jefe.x + ANCHO_JEFE / 2 > ANCHO_A / 2 ? 2.5 : ANCHO_A - 3.3;
  Object.assign(j, cuerpo(lejos, PISO, lejos < ANCHO_A / 2 ? 1 : -1));
}

// Elige el salto: a otra viga o al piso cerca de ti (nunca justo encima: cae a 2 celdas o más de donde estás).
function elegirSalto(e: Jefe, lejos = false): { x: number; y: number } {
  const b = e.jefe, j = e.jugador;
  const opciones: { x: number; y: number; peso: number }[] = [];
  for (const v of VIGAS_JEFE) {
    const ancho = v.x1 - v.x0 - ANCHO_JEFE;
    if (ancho < 0.5) continue;
    for (let k = 0; k < 3; k++) {
      const x = v.x0 + 0.2 + (ancho - 0.4) * (k / 2);
      const dx = Math.abs(x + ANCHO_JEFE / 2 - (j.x + ANCHO_F / 2));
      if (Math.abs(x - b.x) < 2 && v.y === b.y) continue; // que se mueva de verdad
      if (b.y !== PISO && v.y !== PISO) continue; // de una viga siempre vuelve al piso
      let peso = v.y === PISO ? 3 : 1;
      if (lejos) peso *= dx > 5 ? 3 : 0.2;
      else peso *= dx < 3.2 && Math.abs(v.y - j.y) < 0.5 ? 0.05 : dx < 6 ? 2 : 1; // cerca de ti, pero no encima
      opciones.push({ x, y: v.y, peso });
    }
  }
  let r = azar(e) * opciones.reduce((s, o) => s + o.peso, 0);
  for (const o of opciones) { r -= o.peso; if (r <= 0) return o; }
  return opciones[0];
}

function iniciarSalto(e: Jefe, destino: { x: number; y: number }) {
  const b = e.jefe, T = ritmo(e).salto / 1000;
  b.destino = destino;
  b.vx = (destino.x - b.x) / T;
  b.vy = (destino.y - b.y - 0.5 * G_JEFE * T * T) / T;
  if (b.vy > -9) b.vy = -9; // siempre un salto visible, aunque baje
  b.mira = destino.x > b.x ? 1 : -1;
  b.estado = 'salta'; b.t = 4000;
}

// Qué hace después de caminar: saltar, escupir Grises o (desde la fase 2, en el piso) embestir.
function decidir(e: Jefe) {
  const b = e.jefe, f = fase(e), r = azar(e), vivos = e.grises.filter(g => !g.rueda).length;
  const puedeEscupir = vivos < ritmo(e).maxGrises;
  const enPiso = b.y === PISO;
  let accion: 'salto' | 'escupe' | 'embiste';
  if (vivos === 0 && b.y === PISO) accion = 'escupe'; // siempre hay con qué pegarle
  else if (b.y !== PISO) accion = puedeEscupir && r < 0.35 ? 'escupe' : 'salto'; // en una viga: escupe o vuelve al piso
  else if (f === 1) accion = puedeEscupir && r < 0.5 ? 'escupe' : 'salto';
  else if (enPiso && r < (f === 3 ? 0.38 : 0.28)) accion = 'embiste';
  else accion = puedeEscupir && azar(e) < 0.5 ? 'escupe' : 'salto';
  b.vx = 0;
  if (accion === 'salto') { b.estado = 'agacha'; b.t = ritmo(e).agacha; b.destino = elegirSalto(e); }
  else if (accion === 'escupe') { b.estado = 'escupe'; b.t = ritmo(e).escupe; b.mira = e.jugador.x > b.x ? 1 : -1; }
  else { b.estado = 'carga'; b.t = ritmo(e).carga; b.mira = e.jugador.x + ANCHO_F / 2 > b.x + ANCHO_JEFE / 2 ? 1 : -1; }
}

function nuevoGris(e: Jefe, x: number, y: number, mira: 1 | -1): GrisA {
  return { ...cuerpo(x, y, mira), id: e.siguienteId++, golpes: 0, color: '#F4EEE3', bola: 0, rueda: null, salta: entre(e, 1800, 3500), seca: 0, fuera: false, giro: 0 };
}
function escupir(e: Jefe) {
  const b = e.jefe, f = fase(e), n = f === 3 ? 2 : 1;
  const libres = ritmo(e).maxGrises - e.grises.filter(g => !g.rueda).length;
  for (let k = 0; k < Math.min(n, Math.max(1, libres)); k++) {
    const bx = b.mira > 0 ? b.x + ANCHO_JEFE - 0.4 : b.x - 0.4;
    const g = nuevoGris(e, bx, b.y - ALTO_JEFE * 0.55, b.mira);
    g.vy = -9 - k * 3; g.vx = b.mira * (2.2 + k * 1.2); g.suelo = false; g.salta = 1600; g.ignora = -1; g.aturde = 1500;
    e.grises.push(g);
  }
  evento(e, { tipo: 'escupe', x: b.x + ANCHO_JEFE / 2, y: b.y - ALTO_JEFE * 0.55, color: '#8F8F8A' });
}

function golpear(e: Jefe, g: GrisA) {
  const b = e.jefe;
  g.fuera = true; e.golpes++; e.herido = HERIDO_MS; e.puntos += 10;
  evento(e, { tipo: 'golpe', x: g.x + 0.4, y: g.y - 0.5, color: g.color });
  avisar(e, '+10 ¡color!', b.x + ANCHO_JEFE / 2 - 0.4, b.y - ALTO_JEFE - 0.3);
  if (e.golpes >= GOLPES_JEFE) {
    e.celebra = CELEBRA_MS; e.puntos += 30; e.grises = []; e.ondas = []; e.gotas = []; e.marcas = [];
    b.estado = 'camina'; b.vx = 0; b.vy = 0; b.t = 1e9;
    avisar(e, '+30', b.x + 0.6, b.y - ALTO_JEFE - 1);
    return;
  }
  if (e.golpes % GOLPES_FASE === 0) { // cambio de fase: ruge
    if (b.estado !== 'salta') { b.estado = 'ruge'; b.t = RUGE_MS; b.vx = 0; }
    avisar(e, `¡Fase ${fase(e)}!`, ANCHO_A / 2 - 0.5, 3);
    if (e.vidas < VIDAS_JEFE) { e.vidas++; avisar(e, '+1 vida', e.jugador.x, e.jugador.y - 1.4); } // un respiro: recuperas un corazón
    e.caen = Math.min(e.caen, 2500);
    return;
  }
  // Le dolió: salta lejos de ti (si no estaba ya en el aire).
  if (b.estado !== 'salta') iniciarSalto(e, elegirSalto(e, true));
}

function avanzarInacapin(e: Jefe, dtMs: number) {
  const b = e.jefe, dt = dtMs / 1000, R = ritmo(e), j = e.jugador;
  b.t -= dtMs;
  switch (b.estado) {
    case 'camina': {
      const v = vigaDe(b);
      const mismoPiso = Math.abs(j.y - b.y) < 0.5;
      // Se acerca hasta quedar a ~3,5 celdas de ti y ahí se pasea (no se queda quieto); si no estás en su piso, ronda.
      const jc = j.x + ANCHO_F / 2, bc = b.x + ANCHO_JEFE / 2;
      if (mismoPiso) {
        const objetivo = Math.max(v.x0 + ANCHO_JEFE / 2 + 0.9, Math.min(v.x1 - ANCHO_JEFE / 2 - 0.9, jc + (bc > jc ? 3.5 : -3.5)));
        if (bc > objetivo + 0.8) b.mira = -1; else if (bc < objetivo - 0.8) b.mira = 1;
      }
      b.vx = b.mira * R.camina;
      b.x += b.vx * dt;
      if (b.x < v.x0) { b.x = v.x0; b.mira = 1; }
      if (b.x + ANCHO_JEFE > v.x1) { b.x = v.x1 - ANCHO_JEFE; b.mira = -1; }
      if (b.t <= 0) decidir(e);
      break;
    }
    case 'agacha':
      if (b.t <= 0) iniciarSalto(e, b.destino ?? elegirSalto(e));
      break;
    case 'salta': {
      const antes = b.y;
      b.vy = Math.min(b.vy + G_JEFE * dt, 26);
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx) * 0.3; }
      if (b.x + ANCHO_JEFE > ANCHO_A) { b.x = ANCHO_A - ANCHO_JEFE; b.vx = -Math.abs(b.vx) * 0.3; }
      if (b.vy > 0) {
        for (const v of VIGAS_JEFE) {
          if (antes <= v.y + 0.01 && b.y >= v.y && vigaEn(b.x, v.y) === v && (v.y === PISO || !b.destino || v.y >= b.destino.y - 0.01)) {
            aterrizar(e, v.y); break;
          }
        }
      }
      if (b.estado === 'salta' && b.y >= PISO) aterrizar(e, PISO);
      break;
    }
    case 'escupe':
      if (b.t <= 0) { escupir(e); b.estado = 'camina'; b.t = R.pausa * 0.8; }
      break;
    case 'carga':
      if (b.t <= 0) { b.estado = 'embiste'; b.t = 4000; evento(e, { tipo: 'embiste', x: b.x + ANCHO_JEFE / 2, y: b.y, color: '#8F8F8A' }); }
      break;
    case 'embiste': {
      b.vx = b.mira * (fase(e) === 3 ? 9.5 : 8);
      b.x += b.vx * dt;
      if (b.x <= 0 || b.x + ANCHO_JEFE >= ANCHO_A) {
        b.x = Math.max(0, Math.min(ANCHO_A - ANCHO_JEFE, b.x));
        b.estado = 'mareado'; b.t = 1200; b.vx = 0;
        evento(e, { tipo: 'aterriza', x: b.x + ANCHO_JEFE / 2, y: b.y, color: '#8F8F8A' });
        avisar(e, '¡Mareado!', b.x + 0.4, b.y - ALTO_JEFE - 0.4);
      }
      break;
    }
    case 'mareado':
    case 'ruge':
      b.vx = 0;
      if (b.t <= 0) { b.estado = 'camina'; b.t = R.pausa; b.mira = j.x > b.x ? 1 : -1; }
      break;
  }
}

function aterrizar(e: Jefe, y: number) {
  const b = e.jefe, f = fase(e);
  b.y = y; b.vy = 0; b.vx = 0; b.destino = null;
  b.estado = 'camina'; b.t = ritmo(e).pausa;
  evento(e, { tipo: 'aterriza', x: b.x + ANCHO_JEFE / 2, y, color: '#8F8F8A' });
  // Si te cae encima, pierdes una vida.
  const j = e.jugador;
  if (tocaJefe(e, j.x, j.y)) perderVida(e, '¡Aplastado!');
  // Desde la fase 2, al caer al piso levanta una onda hacia ambos lados.
  if (f >= 3 && y === PISO) for (const dir of [-1, 1] as const) e.ondas.push({ x: b.x + ANCHO_JEFE / 2 + dir * ANCHO_JEFE * 0.5, dir, fuera: false });
}

export function avanzarJefe(e: Jefe, dtMs: number) {
  if (e.fin) return;
  dtMs = Math.min(dtMs, 50);
  const dt = dtMs / 1000, f = fase(e), b = e.jefe;
  e.tiempo += dtMs;
  for (const a of e.avisos) a.t -= dtMs;
  e.avisos = e.avisos.filter(a => a.t > 0);
  e.herido = Math.max(0, e.herido - dtMs);
  if (e.celebra) { e.celebra = Math.max(0, e.celebra - dtMs); if (!e.celebra) e.fin = 'victoria'; return; }
  e.avisoDirecto = Math.max(0, e.avisoDirecto - dtMs);

  avanzarInacapin(e, dtMs);

  // Desde la fase 2, el techo: Grises y gotas que caen donde se marca.
  if (f >= 2) {
    e.caen -= dtMs;
    if (e.caen <= 0) {
      e.caen = ritmo(e).caen;
      const vivos = e.grises.filter(g => !g.rueda).length;
      if (f >= 3 && vivos < ritmo(e).maxGrises && azar(e) < 0.55) e.marcas.push({ x: Math.floor(entre(e, 1, ANCHO_A - 2)), t: 800, tipo: 'gris' });
      else {
        const n = f === 3 ? 3 : 2, libres = Array.from({ length: ANCHO_A }, (_, i) => i);
        for (let k = 0; k < n; k++) e.marcas.push({ x: libres.splice(Math.floor(azar(e) * libres.length), 1)[0], t: 1000, tipo: 'gota' });
      }
    }
  }
  for (const m of e.marcas) {
    m.t -= dtMs;
    if (m.t > 0) continue;
    if (m.tipo === 'gota') e.gotas.push({ x: m.x + 0.5, y: -0.5, vy: 0, fuera: false });
    else { const g = nuevoGris(e, m.x, -0.5, azar(e) < 0.5 ? 1 : -1); g.salta = 1500; g.aturde = 1300; e.grises.push(g); }
  }
  e.marcas = e.marcas.filter(m => m.t > 0);

  // Tú.
  const j = e.jugador;
  e.invulnerable = Math.max(0, e.invulnerable - dtMs);
  j.vx = (e.teclas.der ? VEL_J : 0) - (e.teclas.izq ? VEL_J : 0);
  if (j.vx) j.mira = j.vx > 0 ? 1 : -1;
  fisica(j, dt, VIGAS_JEFE);
  j.x = Math.max(0, Math.min(ANCHO_A - ANCHO_F, j.x));
  if (activo(e) && b.estado !== 'salta' && tocaJefe(e, j.x, j.y)) { // en el aire te atraviesa: aplasta solo si cae encima
    if (b.estado === 'embiste') perderVida(e, '¡Embestida!'); // en el aire solo te empuja: aplasta al caer (ver aterrizar)
    // Caminando (o quieto) es una pared que te empuja de un saltito.
    const centro = b.x + ANCHO_JEFE / 2;
    if (j.x + ANCHO_F / 2 < centro) j.x = Math.max(0, b.x - ANCHO_F - 0.15); else j.x = Math.min(ANCHO_A - ANCHO_F, b.x + ANCHO_JEFE + 0.15);
    if (tocaJefe(e, j.x, j.y)) j.x = j.x < 1 ? b.x + ANCHO_JEFE + 0.15 : b.x - ANCHO_F - 0.15; // contra la pared: pasa al otro lado
    j.x = Math.max(0, Math.min(ANCHO_A - ANCHO_F, j.x));
    if (j.suelo) { j.vy = -9; j.suelo = false; }
  }

  // Tiros.
  for (const t of e.tiros) {
    t.x += t.dir * 12 * dt; t.recorrido += 12 * dt;
    if (t.recorrido > 5 || t.x < -0.5 || t.x > ANCHO_A) { t.recorrido = 99; continue; }
    if (tocaJefe(e, t.x - 0.1, t.y + 0.1, 0.2, 0.2)) {
      t.recorrido = 99; evento(e, { tipo: 'salpica', x: t.x, y: t.y, color: t.color });
      if (!e.avisoDirecto) { avisar(e, '¡Con una bola!', b.x + 0.2, b.y - ALTO_JEFE - 0.3); e.avisoDirecto = 2500; }
      continue;
    }
    const g = e.grises.find(h => !h.rueda && !h.fuera && h.bola === 0 && Math.abs(h.x + ANCHO_F / 2 - t.x) < 0.55 && t.y <= h.y && t.y >= h.y - 0.95);
    if (!g) continue;
    t.recorrido = 99; g.golpes++; g.color = t.color; g.vx = 0; g.seca = 2500;
    evento(e, { tipo: 'pinta', x: t.x, y: t.y, color: t.color });
    if (g.golpes >= GOLPES_GRIS) { g.bola = BOLA_MS; e.bolas++; e.puntos += 2; avisar(e, '+2', g.x, g.y - 1); evento(e, { tipo: 'bola', x: g.x + 0.4, y: g.y - 0.45, color: g.color }); }
  }
  e.tiros = e.tiros.filter(t => t.recorrido < 99);

  // Grises y bolas.
  for (const g of e.grises) {
    if (g.fuera) continue;
    if (g.rueda) {
      g.vx = g.mira * VEL_BOLA;
      fisica(g, dt, VIGAS_JEFE);
      g.giro = (g.giro ?? 0) + g.mira * VEL_BOLA * dt;
      if (e.herido <= 0 && tocaJefe(e, g.x, g.y)) { golpear(e, g); if (e.celebra) return; continue; }
      if (g.x <= 0 || g.x >= ANCHO_A - ANCHO_F) {
        g.x = Math.max(0, Math.min(ANCHO_A - ANCHO_F, g.x)); g.mira = g.mira > 0 ? -1 : 1; g.rueda.rebotes++;
        evento(e, { tipo: 'rebota', x: g.x + 0.4, y: g.y - 0.4, color: g.color });
        if (g.rueda.rebotes > 3) { g.fuera = true; avisar(e, 'Se rompió', g.x, g.y - 1); evento(e, { tipo: 'rompe', x: g.x + 0.4, y: g.y - 0.45, color: g.color }); continue; }
      }
      for (const o of e.grises) if (o !== g && !o.fuera && !o.rueda && toca(g, o)) {
        o.fuera = true; g.rueda.combo++;
        const pts = 5 * g.rueda.combo; e.puntos += pts; e.arrastrados++;
        avisar(e, `+${pts}`, o.x, o.y - 1); evento(e, { tipo: 'rompe', x: o.x + 0.4, y: o.y - 0.45, color: g.color });
      }
      continue;
    }
    if (g.bola > 0) {
      g.vx = 0; fisica(g, dt, VIGAS_JEFE);
      g.bola -= dtMs;
      if (g.bola <= 0) { g.bola = 0; g.golpes = 0; g.color = '#F4EEE3'; evento(e, { tipo: 'escapa', x: g.x + 0.4, y: g.y - 0.45, color: '#8F8F8A' }); }
      if (toca(j, g, -0.05) && j.vx !== 0 && Math.sign(g.x - j.x) === Math.sign(j.vx)) {
        g.rueda = { rebotes: 0, combo: 0 }; g.mira = j.vx > 0 ? 1 : -1; avisar(e, '¡Rueda!', g.x, g.y - 1);
      }
      continue;
    }
    g.vx = g.golpes > 0 || (g.aturde && g.suelo) ? 0 : g.mira * VEL_GRIS * (0.8 + 0.12 * (f - 1));
    if (g.suelo && enBorde(g, VIGAS_JEFE) && azar(e) < 0.6) g.mira = g.mira > 0 ? -1 : 1;
    g.salta -= dtMs;
    if (g.suelo && g.salta <= 0) {
      g.salta = entre(e, 2200, 4500);
      if (azar(e) < 0.45) { g.vy = -SALTO; g.suelo = false; } else if (g.y < PISO && azar(e) < 0.5) { g.ignora = g.y; g.y += 0.05; }
      if (Math.abs(j.y - g.y) < 0.5) g.mira = j.x > g.x ? 1 : -1;
    }
    if (g.golpes > 0 && (g.seca -= dtMs) <= 0) { g.golpes--; g.seca = 1200; if (!g.golpes) g.color = '#F4EEE3'; }
    fisica(g, dt, VIGAS_JEFE);
    if (g.x <= 0 || g.x >= ANCHO_A - ANCHO_F) { g.x = Math.max(0, Math.min(ANCHO_A - ANCHO_F, g.x)); g.mira = g.mira > 0 ? -1 : 1; }
    if (g.aturde) g.aturde = Math.max(0, g.aturde - dtMs); // recién llegado: mareado e inofensivo
    else if (toca(j, g, 0.15)) perderVida(e);
  }
  e.grises = e.grises.filter(g => !g.fuera);

  // Ondas que corren por el piso (se saltan).
  for (const o of e.ondas) {
    o.x += o.dir * (f === 3 ? 7 : 5.5) * dt;
    if (o.x < -1 || o.x > ANCHO_A + 1) o.fuera = true;
    if (Math.abs(o.x - (j.x + ANCHO_F / 2)) < 0.55 && j.y > PISO - 0.5) perderVida(e, '¡La onda!');
  }
  e.ondas = e.ondas.filter(o => !o.fuera);

  // Gotas: caen del techo en las columnas marcadas.
  for (const g of e.gotas) {
    g.vy = Math.min(g.vy + 30 * dt, 16); g.y += g.vy * dt;
    if (g.y >= PISO || VIGAS_JEFE.some(v => v.y !== PISO && g.y >= v.y && g.y - g.vy * dt < v.y && g.x > v.x0 && g.x < v.x1)) {
      g.fuera = true; evento(e, { tipo: 'salpica', x: g.x, y: g.y, color: '#8F8F8A' });
    }
    if (Math.abs(g.x - (j.x + ANCHO_F / 2)) < 0.6 && g.y > j.y - 1 && g.y < j.y + 0.1) { perderVida(e); g.fuera = true; }
  }
  e.gotas = e.gotas.filter(g => !g.fuera);
}

// Para el dibujo y el HUD: cuánto color recuperó (0 a 1).
export const recuperado = (e: Jefe) => e.golpes / GOLPES_JEFE;
