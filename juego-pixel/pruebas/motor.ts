// Pruebas de motor de «Hora punta» (cruce, andén y jefe) en Node, sin dibujo: `npm run pruebas`.
// Los bots no son personas: sirven para ver que no hay errores y para comparar ajustes (plan 009-juego-pixel).
import { ANCHO, META, QUIETO_FIN, avanzarCruce, fila, mover, nuevoCruce, type Cruce } from '../src/juego/cruce';
import { ALTO_A, ANCHO_A, ANCHO_F, avanzarAnden, bajar, cuerpo, lanzarA, nuevoAnden, saltar, VIDAS, type Anden, type GrisA } from '../src/juego/anden';
import { avanzarJefe, bajarJ, COLORES_JEFE, fase, GOLPES_JEFE, lanzarJ, nuevoJefe, proximoColor, saltarJ, xJefe, ANCHO_JEFE, type Jefe } from '../src/juego/jefe';
import { HUESO, PINTURAS, TIROS_POR_LATA } from '../src/juego/comun';

let ok = 0, mal = 0;
const caso = (nombre: string, fn: () => boolean | string) => {
  let r: boolean | string;
  try { r = fn(); } catch (err) { r = 'error: ' + (err as Error).message; }
  if (r === true) { ok++; console.log('  ✓', nombre); } else { mal++; console.log('  ✗', nombre, r === false ? '' : r); }
};
const correr = (fn: (dt: number) => void, ms: number, dt = 16) => { for (let t = 0; t < ms; t += dt) fn(dt); };

// ——— Nivel 1 · El cruce ———
console.log('Nivel 1 · El cruce');
const despejar = (e: Cruce, y: number) => { const f = fila(e, y); if (f) { if (f.tipo !== 'estacion') f.tipo = 'vereda'; f.vehiculos = []; f.obstaculos.clear(); f.tren = null; f.esperaTren = 1e9; } };
caso('avanzar suma 1 por fila nueva', () => { const e = nuevoCruce(1); despejar(e, 1); mover(e, 0, 1); return e.puntos === 1 && e.maxY === 1; });
caso('retroceder y volver no suma de nuevo', () => { const e = nuevoCruce(2); despejar(e, 1); mover(e, 0, 1); mover(e, 0, -1); mover(e, 0, 1); return e.puntos === 1; });
caso('no se sale por los lados', () => { const e = nuevoCruce(3); for (let i = 0; i < 20; i++) mover(e, 1, 0); return e.jugador.x === ANCHO - 1; });
caso('un obstáculo tapa el paso', () => { const e = nuevoCruce(4); despejar(e, 1); fila(e, 1)!.obstaculos.set(6, 'banca'); mover(e, 0, 1); return e.jugador.y === 0; });
caso('la lata se junta (+1) y desaparece', () => {
  const e = nuevoCruce(5); despejar(e, 1); fila(e, 1)!.latas.set(6, '#FFC20E'); mover(e, 0, 1);
  return e.latas.length === 1 && e.latas[0] === '#FFC20E' && e.puntos === 2 && !fila(e, 1)!.latas.has(6);
});
caso('atropello en la calle', () => {
  const e = nuevoCruce(6); despejar(e, 1); const f = fila(e, 1)!; f.tipo = 'calle'; f.dir = 1; f.vel = 2; f.vehiculos = [{ x: 5.5, largo: 2, tipo: 'auto', color: '#FFC20E' }];
  mover(e, 0, 1); return e.fin === 'atropellado';
});
caso('el metro atropella al pasar', () => {
  const e = nuevoCruce(7); despejar(e, 1); const f = fila(e, 1)!; f.tipo = 'metro'; f.tren = { x: 2, aviso: 0, activo: true };
  mover(e, 0, 1); return e.fin === 'tren';
});
caso('el metro avisa antes de pasar', () => {
  const e = nuevoCruce(8); const f = fila(e, 2)!; f.tipo = 'metro'; f.vehiculos = []; f.tren = null; f.esperaTren = 100;
  avanzarCruce(e, 120); return !!f.tren && !f.tren.activo && f.tren.aviso > 0;
});
caso(`quedarse quieto ${QUIETO_FIN / 1000} s termina el cruce`, () => {
  const e = nuevoCruce(9); for (let y = 1; y < 6; y++) despejar(e, y);
  correr(dt => avanzarCruce(e, dt), QUIETO_FIN + 100); return e.fin === 'hora';
});
caso('tras chocar, el tránsito sigue y el salto termina', () => {
  const e = nuevoCruce(10); despejar(e, 1); const f = fila(e, 1)!; f.tipo = 'calle'; f.dir = 1; f.vel = 3; f.vehiculos = [{ x: 5.5, largo: 2, tipo: 'auto', color: '#FFC20E' }];
  mover(e, 0, 1); const x0 = f.vehiculos[0].x; correr(dt => avanzarCruce(e, dt), 400);
  return e.fin === 'atropellado' && f.vehiculos[0].x > x0 && e.jugador.salto === 0;
});
caso(`a las ${META} filas llega al metro y ya no corre el reloj`, () => {
  const e = nuevoCruce(11);
  for (let y = 1; y <= META; y++) { despejar(e, y); mover(e, 0, 1); }
  const q = e.quieto; correr(dt => avanzarCruce(e, dt), 12000);
  return e.llego && !e.fin && e.quieto === q && e.maxY === META;
});
caso('de la meta en adelante todo es estación', () => {
  const e = nuevoCruce(12); for (let y = 1; y <= META; y++) { despejar(e, y); mover(e, 0, 1); }
  for (let y = META; y < e.generadas; y++) if (fila(e, y)?.tipo !== 'estacion') return 'fila ' + y;
  return true;
});
caso('hay latas en 50 tableros al azar (≥ 3 por tablero)', () => {
  for (let s = 1; s <= 50; s++) {
    const e = nuevoCruce(s * 977); let n = 0;
    for (let y = 1; y < META; y++) { n += fila(e, y)?.latas.size ?? 0; const f = fila(e, y); if (f) { const l = new Map(f.latas); despejar(e, y); f.latas = l; } mover(e, 0, 1); }
    if (n < 3) return `semilla ${s * 977}: ${n} latas`;
  }
  return true;
});
// Bot que mira el tránsito: avanza si la fila de adelante queda libre el próximo medio segundo; si no, espera o se corre.
const seguro = (e: Cruce, x: number, y: number, T: number) => {
  const f = fila(e, y); if (!f) return true;
  if (x < 0 || x >= ANCHO || f.obstaculos.has(x)) return false;
  if (f.tipo === 'calle') return !f.vehiculos.some(v => {
    const d = f.dir * f.vel * T, a = v.x + Math.min(0, d), b = v.x + v.largo + Math.max(0, d);
    return x + 0.8 + 0.15 > a && x + 0.2 - 0.15 < b;
  });
  if (f.tipo === 'metro') return !f.tren && f.esperaTren > T * 1000 + 300;
  return true;
};
caso('300 cruces al azar sin errores; un bot que mira el tránsito llega al metro', () => {
  let llegan = 0; const fines: Record<string, number> = {}; const tiempos: number[] = [];
  for (let s = 1; s <= 300; s++) {
    const e = nuevoCruce(s * 131);
    for (let t = 0; t < 120000 && !e.fin && !e.llego; t += 16) {
      avanzarCruce(e, 16);
      if (t % 112 === 0 && !e.fin) {
        const j = e.jugador;
        if (seguro(e, j.x, j.y + 1, 0.45)) mover(e, 0, 1);
        else if (!seguro(e, j.x, j.y, 0.35)) {
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1]]) if (seguro(e, j.x + dx, j.y + dy, 0.4)) { mover(e, dx, dy); break; }
        } else if (fila(e, j.y + 1)?.obstaculos.has(j.x) || e.quieto > 4000) {
          const dx = j.x < 6 ? 1 : -1; if (seguro(e, j.x + dx, j.y, 0.4)) mover(e, dx, 0);
        }
      }
    }
    if (e.llego) { llegan++; tiempos.push(e.tiempo / 1000); } else fines[String(e.fin)] = (fines[String(e.fin)] ?? 0) + 1;
  }
  tiempos.sort((a, b) => a - b);
  console.log(`     bot: ${llegan}/300 llegan al metro (mediana ${tiempos[tiempos.length >> 1]?.toFixed(1)} s) · no llegan: ${JSON.stringify(fines)}`);
  return llegan > 200;
});

// ——— Nivel 2 · El andén ———
console.log('Nivel 2 · El andén');
const gris = (x: number, y = ALTO_A - 1): GrisA => ({ ...cuerpo(x, y, -1), id: 99, golpes: 0, color: HUESO, bola: 0, rueda: null, salta: 1e9, seca: 0, fuera: false, suelo: true });
const soloUno = (a: Anden, g: GrisA) => { a.grises = [g]; a.oleada = 2; };
caso(`cada lata son ${TIROS_POR_LATA} tiros`, () => nuevoAnden(['#FF8FB1', '#FFC20E', '#7FC8F8']).municion.length === 15);
caso('primera oleada de 3 Grises', () => nuevoAnden([]).grises.length === 3);
caso('saltar sube y bajar baja', () => {
  const a = nuevoAnden([], 3); a.grises = []; a.oleada = 2; a.limpio = false;
  a.grises = [gris(15.2, 2)]; correr(dt => avanzarAnden(a, dt), 300);
  const y0 = a.jugador.y; saltar(a); let min = y0; correr(dt => { avanzarAnden(a, dt); min = Math.min(min, a.jugador.y); }, 700);
  return min < y0 - 2;
});
caso('3 golpes de color = bola (+2) y gastan munición', () => {
  const a = nuevoAnden(['#FF8FB1'], 4); a.jugador.x = 5; a.jugador.mira = 1; const g = gris(7.5); soloUno(a, g); correr(dt => avanzarAnden(a, dt), 50);
  for (let i = 0; i < 3; i++) { lanzarA(a); correr(dt => avanzarAnden(a, dt), 350); }
  return g.bola > 0 && a.bolas === 1 && a.puntos === 2 && a.municion.length === 2 && g.color === '#FF8FB1';
});
caso('sin latas hacen falta 5 golpes de hueso', () => {
  const a = nuevoAnden([], 5); a.jugador.x = 5; a.jugador.mira = 1; const g = gris(7.5); soloUno(a, g); correr(dt => avanzarAnden(a, dt), 50);
  for (let i = 0; i < 4; i++) { lanzarA(a); correr(dt => avanzarAnden(a, dt), 300); }
  const antes = g.bola; lanzarA(a); correr(dt => avanzarAnden(a, dt), 300);
  return antes === 0 && g.bola > 0;
});
caso('caminar contra la bola la hace rodar y se lleva a otro Gris (+5, suelta pieza)', () => {
  const a = nuevoAnden(['#00A651'], 6); a.jugador.x = 5; a.jugador.mira = 1;
  const g = gris(6.2); g.bola = 6000; g.golpes = 3; g.color = '#00A651';
  const o = gris(10); o.id = 100; o.mira = 1; a.grises = [g, o]; a.oleada = 2;
  a.teclas.der = true; correr(dt => avanzarAnden(a, dt), 600); a.teclas.der = false;
  return !!a.piezas.length && a.arrastrados >= 1 && a.piezas[0].color === '#00A651';
});
caso('la pieza se junta (+3)', () => {
  const a = nuevoAnden([], 7); a.grises = [gris(15, 2)]; a.oleada = 2;
  a.piezas.push({ color: '#FFC20E', forma: 'rayo', x: a.jugador.x, y: a.jugador.y, vy: 0, t: 5000 });
  avanzarAnden(a, 16); return a.juntadas.length === 1 && a.puntos === 3;
});
caso('la pieza se borra a los 5 s', () => {
  const a = nuevoAnden([], 8); a.grises = [gris(15, 2)]; a.oleada = 2;
  a.piezas.push({ color: '#FFC20E', forma: 'rayo', x: 1, y: 2, vy: 0, t: 5000 }); a.jugador.x = 12;
  correr(dt => avanzarAnden(a, dt), 5100); return a.piezas.length === 0 && a.juntadas.length === 0;
});
caso('un Gris quita una vida y deja 2 s intocable', () => {
  const a = nuevoAnden([], 9); const g = gris(a.jugador.x + 0.1); soloUno(a, g); avanzarAnden(a, 16);
  return a.vidas === VIDAS - 1 && a.invulnerable > 1900;
});
caso('andén limpio después de las 2 oleadas', () => {
  const a = nuevoAnden([], 10); a.grises = []; a.piezas = []; avanzarAnden(a, 16);
  const segunda = a.grises.length; a.grises = []; avanzarAnden(a, 16); return segunda === 4 && a.limpio;
});
caso('100 andenes al azar sin errores (bot que lanza y camina)', () => {
  let limpios = 0;
  for (let s = 1; s <= 100; s++) {
    const a = nuevoAnden(PINTURAS.slice(0, s % 5), s * 37);
    for (let t = 0; t < 120000 && !a.fin && !a.limpio; t += 16) {
      if (t % 400 === 0) { a.teclas.izq = (s + t / 400) % 3 === 0; a.teclas.der = (s + t / 400) % 3 === 1; if ((t / 400) % 2) lanzarA(a); if ((t / 400) % 7 === 0) saltar(a); if ((t / 400) % 11 === 0) bajar(a); }
      avanzarAnden(a, 16);
      if (!Number.isFinite(a.jugador.x) || !Number.isFinite(a.jugador.y)) throw new Error('posición inválida');
    }
    if (a.limpio) limpios++;
  }
  console.log(`     bot: ${limpios} de 100 limpian el andén`);
  return true;
});

// ——— Jefe · El Inacapín Pixel ———
console.log('Jefe · El Inacapín Pixel');
caso('tus colores, sin repetir y solo de la paleta', () => { const j = nuevoJefe(['#FF8FB1', '#FF8FB1', '#00A651', '#123456']); return j.colores.join() === '#FF8FB1,#00A651'; });
caso('sin colores usa 3 de la paleta', () => nuevoJefe([]).colores.length === 3);
caso('la pintura no se acaba: sale de tus colores en orden', () => {
  const j = nuevoJefe(['#FF8FB1', '#00A651']); const vistos: string[] = [];
  for (let i = 0; i < 6; i++) { vistos.push(proximoColor(j)); lanzarJ(j); j.tiros = []; }
  return vistos.join() === '#FF8FB1,#00A651,#FF8FB1,#00A651,#FF8FB1,#00A651';
});
caso('el primer ataque es un Gris que sale de su boca', () => {
  const j = nuevoJefe(['#FF8FB1'], 1); correr(dt => avanzarJefe(j, dt), 2400); return j.grises.length === 1;
});
caso('2 golpes encierran al Gris (+2)', () => {
  const j = nuevoJefe(['#FF8FB1'], 2); j.espera = 1e9; j.jugador = { ...cuerpo(4, ALTO_A - 1, 1), suelo: true };
  const g = gris(6.5); j.grises = [g]; avanzarJefe(j, 16);
  lanzarJ(j); correr(dt => avanzarJefe(j, dt), 300); lanzarJ(j); correr(dt => avanzarJefe(j, dt), 300);
  return g.bola > 0 && j.puntos === 2;
});
caso('pintura directa no le hace nada (y avisa «¡Con una bola!»)', () => {
  const j = nuevoJefe(['#FF8FB1'], 3); j.espera = 1e9; j.jugador = { ...cuerpo(11, ALTO_A - 1, 1), suelo: true };
  lanzarJ(j); correr(dt => avanzarJefe(j, dt), 500);
  return j.golpes === 0 && j.avisos.some(a => a.texto === '¡Con una bola!');
});
caso('una bola que rueda contra él es un golpe (+10) y devuelve un color', () => {
  const j = nuevoJefe(['#FF8FB1'], 4); j.espera = 1e9; j.jugador = { ...cuerpo(7, ALTO_A - 1, 1), suelo: true };
  const g = gris(8.5); g.bola = 6000; g.golpes = 2; j.grises = [g];
  j.teclas.der = true; correr(dt => avanzarJefe(j, dt), 150); j.teclas.der = false;
  j.jugador.x = 2; correr(dt => avanzarJefe(j, dt), 1500);
  return j.golpes === 1 && j.puntos === 10;
});
caso('cada 2 golpes cambia de esquina y de fase', () => {
  const j = nuevoJefe(['#FF8FB1'], 5); j.espera = 1e9; j.jugador = { ...cuerpo(7, ALTO_A - 1, 1), suelo: true };
  const lado0 = j.lado;
  for (let k = 0; k < 2; k++) {
    const hacia = j.lado > 0 ? 1 : -1;
    j.jugador.x = hacia > 0 ? 7 : 8; const g = gris(hacia > 0 ? 8.3 : 6.7); g.bola = 6000; g.golpes = 2; j.grises = [g];
    if (hacia > 0) j.teclas.der = true; else j.teclas.izq = true;
    correr(dt => avanzarJefe(j, dt), 150); j.teclas.der = j.teclas.izq = false; j.jugador.x = hacia > 0 ? 1 : 14;
    correr(dt => avanzarJefe(j, dt), 1500);
  }
  correr(dt => avanzarJefe(j, dt), 1400);
  return j.golpes === 2 && fase(j) === 2 && j.lado === -lado0 && xJefe(j) === 0;
});
caso('la mancha que rueda quita una vida; saltarla no', () => {
  const a = nuevoJefe(['#FF8FB1'], 6); a.espera = 1e9; a.jugador = { ...cuerpo(6, ALTO_A - 1, 1), suelo: true };
  a.manchas.push({ x: 9, dir: -1, vel: 6, fuera: false }); correr(dt => avanzarJefe(a, dt), 800);
  const b = nuevoJefe(['#FF8FB1'], 6); b.espera = 1e9; b.jugador = { ...cuerpo(6, ALTO_A - 1, 1), suelo: true };
  b.manchas.push({ x: 9, dir: -1, vel: 6, fuera: false }); correr(dt => avanzarJefe(b, dt), 200); saltarJ(b); correr(dt => avanzarJefe(b, dt), 600);
  return a.vidas === VIDAS - 1 && b.vidas === VIDAS;
});
caso('las gotas caen en columnas marcadas (fase 2 = 2 columnas, fuera del Inacapín)', () => {
  const j = nuevoJefe(['#FF8FB1'], 7); j.golpes = 2;
  for (let i = 0; i < 40; i++) {
    j.grises = [gris(1, 2), gris(2, 2)]; j.ataque = null; j.espera = 0; avanzarJefe(j, 16);
    if (j.ataque?.tipo === 'gotas') return j.ataque.columnas.length === 2 && j.ataque.columnas.every(c => c < xJefe(j) || c >= xJefe(j) + ANCHO_JEFE) || 'columnas ' + j.ataque.columnas;
  }
  return 'no salieron gotas';
});
caso('tocar al Inacapín te empuja y no quita vidas', () => {
  const j = nuevoJefe(['#FF8FB1'], 8); j.espera = 1e9; j.jugador = { ...cuerpo(xJefe(j) - 0.9, ALTO_A - 1, 1), suelo: true };
  const x0 = j.jugador.x; j.teclas.der = true; correr(dt => avanzarJefe(j, dt), 300); return j.vidas === VIDAS && j.jugador.x < x0;
});
caso('3 vidas y pierdes; lo juntado se queda', () => {
  const j = nuevoJefe(['#FF8FB1'], 9); j.espera = 1e9;
  for (let i = 0; i < 3; i++) { j.invulnerable = 0; j.manchas.push({ x: j.jugador.x + 0.4, dir: 1, vel: 0.01, fuera: false }); j.jugador.y = ALTO_A - 1; avanzarJefe(j, 16); j.manchas = []; }
  return j.fin === 'derrota' && j.vidas === 0;
});
caso(`${GOLPES_JEFE} golpes: celebra, +30 y gana`, () => {
  const j = nuevoJefe(['#FF8FB1'], 10); j.golpes = GOLPES_JEFE - 1; j.espera = 1e9; j.jugador = { ...cuerpo(7, ALTO_A - 1, 1), suelo: true };
  const g = gris(xJefe(j) - 1.5); g.bola = 6000; g.golpes = 2; g.rueda = { rebotes: 0, combo: 0 }; g.mira = 1; j.grises = [g];
  correr(dt => avanzarJefe(j, dt), 400); const celebra = j.celebra > 0 && !j.fin;
  correr(dt => avanzarJefe(j, dt), 3000);
  return celebra && j.fin === 'victoria' && j.puntos === 40 && COLORES_JEFE.length === GOLPES_JEFE;
});

const causas: Record<string, number> = {};
// Bot que juega al jefe como una persona atenta: atrapa Grises, empuja la bola contra él y esquiva.
function botJefe(semilla: number, reaccion = 120, fallo = 0, colores = ['#FF8FB1', '#FFC20E', '#7FC8F8']) {
  const j: Jefe = nuevoJefe(colores, semilla); let t = 0, pensar = 0, r = semilla * 2654435761 >>> 0;
  const dado = () => ((r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 4294967296);
  while (!j.fin && t < 240000) {
    pensar -= 16;
    if (pensar <= 0) {
      pensar = reaccion * (0.6 + dado() * 0.8);
      if (dado() < fallo) { avanzarJefe(j, 16); t += 16; continue; } // se distrae: no cambia nada este rato
      const yo = j.jugador, xj = xJefe(j), haciaJefe = j.lado > 0 ? 1 : -1;
      j.teclas.izq = j.teclas.der = false;
      const ir = (x: number) => { if (x > yo.x + 0.15) j.teclas.der = true; else if (x < yo.x - 0.15) j.teclas.izq = true; };
      const mancha = j.manchas.find(m => Math.abs(m.x - (yo.x + ANCHO_F / 2)) < 2.4 && Math.sign(yo.x - m.x) === m.dir);
      const gotas = j.ataque?.tipo === 'gotas' ? j.ataque.columnas : j.gotas.map(g => Math.floor(g.x));
      const bajoGota = gotas.some(c => Math.abs(c + 0.5 - (yo.x + ANCHO_F / 2)) < 1);
      const bola = j.grises.find(g => g.bola > 0 && !g.rueda && Math.abs(g.y - yo.y) < 0.5);
      const suelto = j.grises.find(g => g.bola === 0 && !g.rueda);
      if (mancha && yo.y >= ALTO_A - 1.01) { if (dado() >= fallo) saltarJ(j); }
      else if (bajoGota) ir(yo.x + (yo.x < 8 ? 2 : -2));
      else if (bola) {
        const atras = bola.x - haciaJefe * 1.0; // ponerse del lado contrario al Inacapín
        if (Math.abs(yo.x - atras) > 0.5 && Math.sign(bola.x - yo.x) !== haciaJefe) ir(atras);
        else if (haciaJefe > 0) j.teclas.der = true; else j.teclas.izq = true;
      } else if (j.grises.find(g => g.bola > 0 && !g.rueda && g.y < yo.y - 0.5)) {
        const b = j.grises.find(g => g.bola > 0 && !g.rueda)!; ir(b.x); // espera debajo a que caiga
      } else if (suelto) {
        if (Math.abs(suelto.y - yo.y) < 0.5) {
          const d = suelto.x - yo.x;
          if (Math.abs(d) < 1.3) ir(yo.x - Math.sign(d) * 2);
          else { yo.mira = d > 0 ? 1 : -1; if (Math.abs(d) < 4.5) lanzarJ(j); else ir(suelto.x - Math.sign(d) * 3); }
        } else if (yo.y < ALTO_A - 1) bajarJ(j);
        else { // en el aire o en una viga: esperarlo a 3,5 celdas, mirándolo
          const lejos = suelto.x + (suelto.x > 8 ? -3.5 : 3.5);
          ir(Math.max(0.5, Math.min(14.5, lejos))); yo.mira = suelto.x > yo.x ? 1 : -1;
        }
      } else ir(xj + (haciaJefe > 0 ? -5 : ANCHO_JEFE + 5));
      if (Math.abs(yo.x - (xj + (haciaJefe > 0 ? 0 : ANCHO_JEFE))) < 1.2 && !bola) { j.teclas.izq = haciaJefe > 0; j.teclas.der = haciaJefe < 0; }
    }
    const v0 = j.vidas, yo = j.jugador, px = yo.x + ANCHO_F / 2;
    const causa = j.manchas.some(m => Math.abs(m.x - px) < 1.2) ? 'mancha' : j.gotas.some(g => Math.abs(g.x - px) < 1.2) ? 'gota'
      : j.grises.some(g => !g.rueda && g.bola === 0 && Math.abs(g.x - yo.x) < 1.2 && Math.abs(g.y - yo.y) < 1.2) ? 'gris' : 'otro';
    avanzarJefe(j, 16); t += 16;
    if (j.vidas < v0) causas[causa] = (causas[causa] ?? 0) + 1;
    if (!Number.isFinite(j.jugador.x)) throw new Error('posición inválida');
  }
  return { fin: j.fin, t, golpes: j.golpes, vidas: j.vidas, puntos: j.puntos };
}
for (const [nombre, reac, fallo] of [['atento (0,12 s)', 120, 0], ['primera vez (0,35 s y 25 % de distracción)', 350, 0.25], ['torpe (0,5 s y 40 %)', 500, 0.4]] as const) {
  caso(`100 peleas con un bot ${nombre}: sin errores`, () => {
    const r = Array.from({ length: 100 }, (_, i) => botJefe(i * 7919 + 3, reac, fallo));
    const v = r.filter(x => x.fin === 'victoria').map(x => x.t / 1000).sort((a, b) => a - b);
    const med = v.length ? v[Math.floor(v.length / 2)] : NaN;
    const golpesMedio = r.reduce((s, x) => s + x.golpes, 0) / r.length;
    console.log(`     ${v.length}/100 ganan · mediana ${med.toFixed(1)} s · rango ${v[0]?.toFixed(1)}–${v.at(-1)?.toFixed(1)} s · golpes medios ${golpesMedio.toFixed(1)} · vidas perdidas por ${JSON.stringify(causas)}`);
    for (const k in causas) delete causas[k];
    return r.every(x => x.fin !== null);
  });
}

console.log(`\n${ok} bien, ${mal} mal`);
if (mal) process.exit(1);
