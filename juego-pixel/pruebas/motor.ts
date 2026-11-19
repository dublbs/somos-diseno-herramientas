// Pruebas de motor de «Hora punta» (cruce, andén y jefe) en Node, sin dibujo: `npm run pruebas`.
// Los bots no son personas: sirven para ver que no hay errores y para comparar ajustes (plan 009-juego-pixel).
import { ANCHO, META, QUIETO_FIN, avanzarCruce, fila, mover, nuevoCruce, type Cruce } from '../src/juego/cruce';
import { ALTO_A, ANCHO_A, ANCHO_F, avanzarAnden, bajar, cuerpo, lanzarA, nuevoAnden, saltar, VIDAS, type Anden, type GrisA } from '../src/juego/anden';
import { avanzarJefe, ANCHO_JEFE, VIDAS_JEFE, GOLPES_FASE, GOLPES_JEFE, fase, lanzarJ, nuevoJefe, proximoColor, saltarJ, bajarJ, type Jefe } from '../src/juego/jefe';
import { HUESO, PINTURAS, TIROS_POR_LATA } from '../src/juego/comun';
import { escenaLlegada, LLEGADA_MS } from '../src/juego/llegada';

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

// ——— Jefe · El Inacapín (ronda 3) ———
console.log('Jefe · El Inacapín');
// Un Inacapín quieto (no decide nada por un rato) en el piso, en x.
const quieto = (j: Jefe, x: number, y = ALTO_A - 1) => { Object.assign(j.jefe, { x, y, vx: 0, vy: 0, estado: 'camina', t: 1e9 }); j.caen = 1e9; };
const bolaQueRueda = (x: number, mira: 1 | -1, y = ALTO_A - 1): GrisA => { const g = gris(x, y); g.bola = 6000; g.golpes = 2; g.color = '#FF8FB1'; g.rueda = { rebotes: 0, combo: 0 }; g.mira = mira; return g; };
caso('tus colores, sin repetir y solo de la paleta', () => { const j = nuevoJefe(['#FF8FB1', '#FF8FB1', '#00A651', '#123456']); return j.colores.join() === '#FF8FB1,#00A651'; });
caso('sin colores usa 3 de la paleta', () => nuevoJefe([]).colores.length === 3);
caso('la pintura no se acaba: sale de tus colores en orden', () => {
  const j = nuevoJefe(['#FF8FB1', '#00A651']); const vistos: string[] = [];
  for (let i = 0; i < 6; i++) { vistos.push(proximoColor(j)); lanzarJ(j); j.tiros = []; }
  return vistos.join() === '#FF8FB1,#00A651,#FF8FB1,#00A651,#FF8FB1,#00A651';
});
caso('lo primero que hace es escupir un Gris (avisa antes, abriendo el libro)', () => {
  const j = nuevoJefe(['#FF8FB1'], 1); let aviso = false;
  for (let t = 0; t < 2600 && !j.grises.length; t += 16) { avanzarJefe(j, 16); if (j.jefe.estado === 'escupe') aviso = true; }
  return aviso && j.grises.length === 1;
});
caso('se mueve todo el tiempo: camina, salta y pisa vigas en 40 s', () => {
  const j = nuevoJefe(['#FF8FB1'], 2); j.jugador.y = -50; // fuera del alcance: nadie le pega
  const xs = new Set<number>(); let salto = 0, enViga = false, quietoMax = 0, quietoT = 0, px = j.jefe.x, py = j.jefe.y;
  for (let t = 0; t < 40000; t += 16) {
    avanzarJefe(j, 16); j.vidas = VIDAS_JEFE; j.invulnerable = 1e9;
    if (j.jefe.estado === 'salta' && j.jefe.vy < 0 && j.jefe.y === py) salto++;
    if (j.jefe.y < ALTO_A - 1 - 0.01 && j.jefe.estado === 'camina') enViga = true;
    xs.add(Math.round(j.jefe.x));
    quietoT = j.jefe.x === px && j.jefe.y === py ? quietoT + 16 : 0; quietoMax = Math.max(quietoMax, quietoT);
    px = j.jefe.x; py = j.jefe.y;
  }
  return (salto >= 6 && enViga && xs.size >= 10 && quietoMax <= 1300) || `saltos ${salto}, viga ${enViga}, columnas ${xs.size}, quieto ${quietoMax} ms`;
});
caso('2 golpes encierran al Gris (+2)', () => {
  const j = nuevoJefe(['#FF8FB1'], 3); quieto(j, 12.5); j.jugador = { ...cuerpo(4, ALTO_A - 1, 1), suelo: true };
  const g = gris(6.5); j.grises = [g]; avanzarJefe(j, 16);
  lanzarJ(j); correr(dt => avanzarJefe(j, dt), 300); lanzarJ(j); correr(dt => avanzarJefe(j, dt), 300);
  return g.bola > 0 && j.puntos === 2 && j.eventos.some(v => v.tipo === 'bola');
});
caso('pintura directa no le hace nada (y avisa «¡Con una bola!»)', () => {
  const j = nuevoJefe(['#FF8FB1'], 4); quieto(j, 12); j.jugador = { ...cuerpo(9.5, ALTO_A - 1, 1), suelo: true };
  lanzarJ(j); correr(dt => avanzarJefe(j, dt), 500);
  return j.golpes === 0 && j.avisos.some(a => a.texto === '¡Con una bola!');
});
caso('una bola que rueda contra él es un golpe (+10): le duele y salta lejos', () => {
  const j = nuevoJefe(['#FF8FB1'], 5); quieto(j, 12); j.jugador = { ...cuerpo(2, ALTO_A - 1, 1), suelo: true };
  j.grises = [bolaQueRueda(8, 1)]; correr(dt => avanzarJefe(j, dt), 600);
  return (j.golpes === 1 && j.puntos === 10 && j.herido > 0 && j.jefe.estado === 'salta') || `golpes ${j.golpes} estado ${j.jefe.estado}`;
});
caso('le pega aunque esté en el aire (bola contra el libro que cae)', () => {
  const j = nuevoJefe(['#FF8FB1'], 6); quieto(j, 10, ALTO_A - 1 - 0.5); j.jefe.estado = 'salta'; j.jefe.vy = 0.1; j.jugador.x = 1;
  j.grises = [bolaQueRueda(8, 1)]; correr(dt => avanzarJefe(j, dt), 300);
  return j.golpes === 1;
});
caso('recién golpeado (0,9 s) otra bola lo atraviesa', () => {
  const j = nuevoJefe(['#FF8FB1'], 7); quieto(j, 12); j.herido = 900; j.jugador.x = 1;
  j.grises = [bolaQueRueda(10.5, 1)]; correr(dt => avanzarJefe(j, dt), 150);
  return j.golpes === 0;
});
caso(`cada ${GOLPES_FASE} golpes sube de fase y ruge`, () => {
  const j = nuevoJefe(['#FF8FB1'], 8); quieto(j, 12); j.golpes = GOLPES_FASE - 1; j.jugador.x = 1;
  j.grises = [bolaQueRueda(9, 1)]; correr(dt => avanzarJefe(j, dt), 400);
  return fase(j) === 2 && j.jefe.estado === 'ruge' && j.avisos.some(a => a.texto === '¡Fase 2!');
});
caso('fase 3: al caer al piso levanta 2 ondas; quedarse quita una vida y saltarlas no', () => {
  const prueba = (salta: boolean) => {
    const j = nuevoJefe(['#FF8FB1'], 9); j.golpes = 2 * GOLPES_FASE; quieto(j, 13, 6); j.jefe.estado = 'salta'; j.jefe.vy = 5; j.caen = 1e9;
    j.jugador = { ...cuerpo(4, ALTO_A - 1, 1), suelo: true };
    for (let t = 0; t < 2600; t += 16) {
      avanzarJefe(j, 16);
      const o = j.ondas.find(w => w.dir < 0);
      if (salta && o && o.x - (j.jugador.x + ANCHO_F / 2) < 1.6) saltarJ(j);
      if (t < 200) j.jefe.t = 1e9;
    }
    return j;
  };
  const a = prueba(false), b = prueba(true);
  return (a.vidas === VIDAS_JEFE - 1 && b.vidas === VIDAS_JEFE) || `quieto ${a.vidas}, saltando ${b.vidas}`;
});
caso('fases 1 y 2: caer al piso no levanta ondas', () => {
  const j = nuevoJefe(['#FF8FB1'], 10); j.golpes = GOLPES_FASE; quieto(j, 13, 6); j.jefe.estado = 'salta'; j.jefe.vy = 5; j.jugador.x = 1;
  correr(dt => avanzarJefe(j, dt), 600); return j.ondas.length === 0 && j.jefe.y === ALTO_A - 1;
});
caso('la embestida avisa ≥ 0,8 s, quita una vida en el piso y no en la viga; después queda mareado', () => {
  const prueba = (enViga: boolean) => {
    const j = nuevoJefe(['#FF8FB1'], 11); j.golpes = GOLPES_FASE; quieto(j, 12.5);
    j.jefe.estado = 'carga'; j.jefe.t = 1000; j.jefe.mira = -1;
    j.jugador = enViga ? { ...cuerpo(7, 8, 1), suelo: true } : { ...cuerpo(3, ALTO_A - 1, 1), suelo: true };
    let movio = 0, mareado = false;
    for (let t = 0; t < 3000; t += 16) { const x = j.jefe.x; avanzarJefe(j, 16); if (!movio && j.jefe.x !== x) movio = t; if (j.jefe.estado === 'mareado') mareado = true; }
    return { j, movio, mareado };
  };
  const a = prueba(false), b = prueba(true);
  return (a.movio >= 800 && a.j.vidas === VIDAS_JEFE - 1 && b.j.vidas === VIDAS_JEFE && b.mareado) || `movió ${a.movio} vidas ${a.j.vidas}/${b.j.vidas} mareado ${b.mareado}`;
});
caso('la embestida se puede saltar (con 1 a 2 celdas de distancia)', () => {
  const res: string[] = [];
  for (const dist of [0.8, 1.2, 1.6, 2.0]) {
    const j = nuevoJefe(['#FF8FB1'], 17); j.golpes = GOLPES_FASE; quieto(j, 12.5); j.jefe.estado = 'embiste'; j.jefe.t = 4000; j.jefe.mira = -1;
    j.jugador = { ...cuerpo(2, ALTO_A - 1, 1), suelo: true }; let salto = false;
    for (let t = 0; t < 2500; t += 16) { const gap = j.jefe.x - (j.jugador.x + ANCHO_F); if (!salto && gap < dist) { saltarJ(j); salto = true; } avanzarJefe(j, 16); }
    res.push(`${dist}:${j.vidas}`);
  }
  return res.every(r => r.endsWith(':' + VIDAS_JEFE)) || res.join(' ');
});
caso('si te cae encima te aplasta (una vida)', () => {
  const j = nuevoJefe(['#FF8FB1'], 12); quieto(j, 2, 7.5); j.jefe.estado = 'salta'; j.jefe.vy = 6;
  j.jugador = { ...cuerpo(3, ALTO_A - 1, 1), suelo: true }; correr(dt => avanzarJefe(j, dt), 600);
  return j.vidas === VIDAS_JEFE - 1;
});
caso('caminando, tocarlo te empuja y no quita vidas', () => {
  const j = nuevoJefe(['#FF8FB1'], 13); quieto(j, 10); j.jugador = { ...cuerpo(9, ALTO_A - 1, 1), suelo: true };
  j.teclas.der = true; correr(dt => avanzarJefe(j, dt), 300); return j.vidas === VIDAS_JEFE && j.jugador.x < 10;
});
caso('del techo caen gotas (fase 2) y Grises (fase 3), siempre marcados antes', () => {
  const j = nuevoJefe(['#FF8FB1'], 14); j.golpes = 2 * GOLPES_FASE; j.jugador.y = -50; let marcas = 0, sinMarca = 0;
  const vistas = new Set<number>();
  for (let t = 0; t < 30000; t += 16) {
    const antes = j.gotas.length + j.grises.length;
    const marcadas = new Set(j.marcas.map(m => m.x));
    avanzarJefe(j, 16); j.vidas = VIDAS_JEFE; j.invulnerable = 1e9;
    for (const m of j.marcas) vistas.add(m.x);
    if (j.marcas.length) marcas++;
    for (const g of j.gotas) if (g.y < 0 && !marcadas.has(g.x - 0.5) && j.gotas.length + j.grises.length > antes && !vistas.has(g.x - 0.5)) sinMarca++;
  }
  return (marcas > 0 && sinMarca === 0) || `marcas ${marcas} sin marca ${sinMarca}`;
});
caso(`${VIDAS_JEFE} vidas y pierdes; lo juntado se queda`, () => {
  const j = nuevoJefe(['#FF8FB1'], 15); quieto(j, 12);
  for (let i = 0; i < VIDAS_JEFE; i++) { j.invulnerable = 0; j.ondas = [{ x: j.jugador.x + 0.4, dir: 1, fuera: false }]; j.jugador.y = ALTO_A - 1; avanzarJefe(j, 1); j.ondas = []; }
  return j.fin === 'derrota' && j.vidas === 0;
});
caso(`${GOLPES_JEFE} golpes: celebra, +30 y gana`, () => {
  const j = nuevoJefe(['#FF8FB1'], 16); quieto(j, 12); j.golpes = GOLPES_JEFE - 1; j.jugador.x = 1;
  j.grises = [bolaQueRueda(9, 1)];
  correr(dt => avanzarJefe(j, dt), 400); const celebra = j.celebra > 0 && !j.fin;
  correr(dt => avanzarJefe(j, dt), 3000);
  return celebra && j.fin === 'victoria' && j.puntos === 40;
});

const causas: Record<string, number> = {};
// Bot que juega al jefe como una persona: esquiva lo que se avisa, atrapa Grises y empuja la bola contra el Inacapín.
// `reaccion`: ms entre decisiones; `fallo`: probabilidad de distraerse (no cambia nada ese rato).
function botJefe(semilla: number, reaccion = 120, fallo = 0, colores = ['#FF8FB1', '#FFC20E', '#7FC8F8']) {
  const j: Jefe = nuevoJefe(colores, semilla); let t = 0, pensar = 0, r = semilla * 2654435761 >>> 0;
  const dado = () => ((r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 4294967296);
  const PISO = ALTO_A - 1;
  while (!j.fin && t < 300000) {
    pensar -= 16;
    if (pensar <= 0) {
      pensar = reaccion * (0.6 + dado() * 0.8);
      if (dado() < fallo) { avanzarJefe(j, 16); t += 16; continue; } // se distrae
      const yo = j.jugador, b = j.jefe, cx = b.x + ANCHO_JEFE / 2, px = yo.x + ANCHO_F / 2, enPiso = yo.y >= PISO - 0.01;
      j.teclas.izq = j.teclas.der = false;
      const ir = (x: number) => { if (x > yo.x + 0.15) j.teclas.der = true; else if (x < yo.x - 0.15) j.teclas.izq = true; };
      const lejosDe = (x: number) => ir(x > 8 ? Math.max(0.3, x - 6) : Math.min(15, x + 6));
      const onda = j.ondas.find(o => Math.abs(o.x - px) < 2.6 && Math.abs(o.x - px) > 0.4 && Math.sign(px - o.x) === o.dir);
      const columnas = [...j.marcas.filter(m => m.tipo === 'gota').map(m => m.x), ...j.gotas.map(g => Math.floor(g.x))];
      const bajoGota = columnas.some(c => Math.abs(c + 0.5 - px) < 1);
      const embiste = (b.estado === 'carga' || b.estado === 'embiste') && b.y === PISO && enPiso;
      const caeCerca = (b.estado === 'agacha' || b.estado === 'salta') && b.destino && Math.abs(b.destino.x + ANCHO_JEFE / 2 - px) < 2.6 && Math.abs(b.destino.y - yo.y) < 0.5;
      const bola = j.grises.find(g => g.bola > 0 && !g.rueda && Math.abs(g.y - yo.y) < 0.5);
      const suelto = j.grises.find(g => g.bola === 0 && !g.rueda);
      const haciaJefe = cx > px ? 1 : -1;
      const cerca = j.grises.find(g => !g.rueda && g.bola === 0 && !g.aturde && ((Math.abs(g.y - yo.y) < 0.5 && Math.abs(g.x - yo.x) < 2.4 && Math.sign(g.vx || (yo.x - g.x)) === Math.sign(yo.x - g.x) || Math.abs(g.y - yo.y) < 0.5 && Math.abs(g.x - yo.x) < 1.4) || (g.y < yo.y && yo.y - g.y < 3.2 && Math.abs(g.x - yo.x) < 1.3 && !g.suelo)));
      if (onda && enPiso) saltarJ(j);
      else if (cerca && !embiste) { const d = yo.x - cerca.x; if ((d >= 0 && yo.x > 13.5) || (d < 0 && yo.x < 1.7)) { saltarJ(j); ir(yo.x - (d >= 0 ? 2 : -2)); } else ir(yo.x + (d >= 0 ? 2 : -2)); }
      else if (embiste) { // a la viga del medio
        const gap = b.mira > 0 ? yo.x - (b.x + ANCHO_JEFE) : b.x - (yo.x + ANCHO_F);
        if (b.estado === 'embiste' && gap > 0.5 && gap < 2.2) saltarJ(j);
        else if (b.estado === 'carga' && gap < 3) ir(b.mira > 0 ? yo.x + 2 : yo.x - 2);
      } else if (caeCerca) lejosDe(b.destino!.x + ANCHO_JEFE / 2);
      else if (bajoGota) ir(yo.x + (yo.x < 8 ? 2 : -2));
      else if (bola && b.estado !== 'carga') {
        const atras = bola.x - haciaJefe * 1.0; // del lado contrario al Inacapín
        if (Math.abs(yo.x - atras) > 0.5 && Math.sign(bola.x - yo.x) !== haciaJefe) ir(atras);
        else if (haciaJefe > 0) j.teclas.der = true; else j.teclas.izq = true;
      } else if (j.grises.find(g => g.bola > 0 && !g.rueda && g.y < yo.y - 0.5)) {
        ir(j.grises.find(g => g.bola > 0 && !g.rueda)!.x); // espera debajo a que caiga
      } else if (suelto) {
        if (Math.abs(suelto.y - yo.y) < 0.5) {
          const d = suelto.x - yo.x;
          if (Math.abs(d) < 1.3) ir(yo.x - Math.sign(d) * 2);
          else { yo.mira = d > 0 ? 1 : -1; if (Math.abs(d) < 4.5) lanzarJ(j); else ir(suelto.x - Math.sign(d) * 3); }
        } else if (yo.y < PISO) bajarJ(j);
        else { const lejos = suelto.x + (suelto.x > 8 ? -3.5 : 3.5); ir(Math.max(0.5, Math.min(14.5, lejos))); yo.mira = suelto.x > yo.x ? 1 : -1; }
      } else if (Math.abs(cx - px) < 4 && Math.abs(b.y - yo.y) < 1) lejosDe(cx);
      else if (yo.y < PISO && !embiste) bajarJ(j);
    }
    const v0 = j.vidas, yo = j.jugador, px = yo.x + ANCHO_F / 2, b = j.jefe;
    const causa = j.ondas.some(o => Math.abs(o.x - px) < 1.2) && yo.y > ALTO_A - 1.6 ? 'onda' : j.gotas.some(g => Math.abs(g.x - px) < 1.2) ? 'gota'
      : j.grises.some(g => !g.rueda && g.bola === 0 && Math.abs(g.x - yo.x) < 1.2 && Math.abs(g.y - yo.y) < 1.2) ? 'gris'
      : b.estado === 'embiste' ? 'embestida' : b.estado === 'salta' ? 'aplastado' : 'otro';
    avanzarJefe(j, 16); t += 16;
    if (j.vidas < v0) { const k = process.env.FASES ? causa + fase(j) : causa; causas[k] = (causas[k] ?? 0) + 1; }
    if (!Number.isFinite(j.jugador.x) || !Number.isFinite(j.jefe.x) || j.jefe.x < -0.01 || j.jefe.x > ANCHO_A - ANCHO_JEFE + 0.01) throw new Error('posición inválida');
  }
  return { fin: j.fin, t, golpes: j.golpes, vidas: j.vidas, puntos: j.puntos };
}
for (const [nombre, reac, fallo] of [['atento (0,12 s)', 120, 0], ['primera vez (0,35 s y 25 % de distracción)', 350, 0.25], ['torpe (0,5 s y 40 %)', 500, 0.4]] as const) {
  caso(`100 peleas con un bot ${nombre}: sin errores`, () => {
    const r = Array.from({ length: 100 }, (_, i) => botJefe(i * 7919 + 3, reac, fallo));
    const v = r.filter(x => x.fin === 'victoria').map(x => x.t / 1000).sort((a, b) => a - b);
    const med = v.length ? v[Math.floor(v.length / 2)] : NaN;
    const golpesMedio = r.reduce((s, x) => s + x.golpes, 0) / r.length;
    const durMed = r.map(x => x.t / 1000).sort((a, b) => a - b)[50];
    console.log(`     ${v.length}/100 ganan · mediana al ganar ${med.toFixed(1)} s · rango ${v[0]?.toFixed(1)}–${v.at(-1)?.toFixed(1)} s · duración mediana ${durMed.toFixed(1)} s · golpes medios ${golpesMedio.toFixed(1)} · vidas perdidas por ${JSON.stringify(causas)}`);
    for (const k in causas) delete causas[k];
    return r.every(x => x.fin !== null);
  });
}

// ——— Llegada del Inacapín (B-008) ———
console.log('Llegada del Inacapín');
caso('la llegada dura entre 2 y 3 s', () => LLEGADA_MS >= 2000 && LLEGADA_MS <= 3000);
caso('el Inacapín cae desde arriba y termina en el piso', () => {
  const caidas = Array.from({ length: 30 }, (_, i) => escenaLlegada((i * LLEGADA_MS) / 29).cae);
  return caidas[0] > 10 && caidas.at(-1) === 0 && caidas.every((v, i) => i === 0 || v <= caidas[i - 1]);
});
caso('el andén cambia de color después de la caída y termina en el del jefe', () => {
  const a = escenaLlegada(800), b = escenaLlegada(LLEGADA_MS);
  return a.cambio === 0 && !a.aterrizo && b.cambio === 1 && b.aterrizo && b.ruge && b.aplasta === 1;
});
caso('con movimiento reducido: sin caída, sin aplastón ni titileo', () =>
  Array.from({ length: 60 }, (_, i) => escenaLlegada(i * 50, true)).every(l => l.cae === 0 && l.aplasta === 1 && !l.apagon));

console.log(`\n${ok} bien, ${mal} mal`);
if (mal) process.exit(1);
