// Efectos del andén y del jefe (solo dibujo): salpicaduras, estallidos de color, polvo, el rastro de la bola y la
// sacudida de la pantalla. Se alimentan de los `eventos` que deja el motor en cada cuadro.
import type { Evento } from './comun';
import type { GrisA, Viga } from './anden';
import type { Marco } from './dibujoAnden';

interface Particula { x: number; y: number; vx: number; vy: number; t: number; total: number; color: string; tam: number; piso: boolean }
interface Mancha { x: number; y: number; ancho: number; color: string; t: number }
interface Estado { parts: Particula[]; manchas: Mancha[]; sacude: number; destello: number; ultimo: Map<number, number> }
const estados = new WeakMap<object, Estado>();
const est = (k: object) => { let s = estados.get(k); if (!s) { s = { parts: [], manchas: [], sacude: 0, destello: 0, ultimo: new Map() }; estados.set(k, s); } return s; };

// Semilla propia (el dibujo no toca el azar del motor).
let semilla = 7;
const rnd = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);

function chorro(s: Estado, ev: Evento, n: number, vel: number, tam: number, vida: number, colores: string[], arriba = 6) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, v = vel * (0.4 + rnd() * 0.8);
    s.parts.push({ x: ev.x, y: ev.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - arriba * rnd(), t: vida, total: vida, color: colores[i % colores.length], tam: tam * (0.6 + rnd() * 0.7), piso: true });
  }
}

// Lee los eventos nuevos del motor (y los borra) y avanza las partículas.
export function avanzarEfectos(clave: object, eventos: Evento[], grises: GrisA[], vigas: Viga[], dtMs: number, quieto: boolean) {
  const s = est(clave), dt = Math.min(dtMs, 50) / 1000;
  for (const ev of eventos.splice(0)) {
    if (quieto) { if (ev.tipo === 'golpe') s.destello = 160; continue; }
    const col = ev.color, gris = ['#8F8F8A', '#B9B9B3', '#6B6B66'];
    switch (ev.tipo) {
      case 'pinta': chorro(s, ev, 9, 5, 0.13, 600, [col, col, '#FFFFFF']); break;
      case 'bola': chorro(s, ev, 14, 6, 0.15, 700, [col, '#FFFFFF', col]); s.destello = Math.max(s.destello, 60); break;
      case 'rebota': chorro(s, ev, 6, 4, 0.12, 400, [col]); break;
      case 'rompe': chorro(s, ev, 26, 9, 0.18, 900, [col, col, '#FFFFFF', '#000000']); s.sacude = Math.max(s.sacude, 180); break;
      case 'golpe': chorro(s, ev, 40, 11, 0.22, 1100, [col, '#E2001A', '#FFFFFF', '#FFC20E']); s.sacude = 320; s.destello = 160; break;
      case 'salpica': chorro(s, ev, 6, 3, 0.11, 400, [col, ...gris]); break;
      case 'aterriza': chorro(s, { ...ev, y: ev.y - 0.1 }, 16, 4, 0.2, 600, gris, 3); s.sacude = Math.max(s.sacude, 220); break;
      case 'escupe': chorro(s, ev, 8, 4, 0.14, 500, gris); break;
      case 'embiste': chorro(s, ev, 10, 3, 0.18, 500, gris, 2); break;
      case 'escapa': chorro(s, ev, 10, 4, 0.14, 600, gris); break;
      case 'dano': chorro(s, ev, 12, 5, 0.14, 700, ['#FF8FB1', '#FFFFFF', '#8F8F8A']); s.sacude = Math.max(s.sacude, 200); break;
    }
  }
  if (quieto) { s.parts = []; s.sacude = 0; }
  // Rastro: la bola que rueda deja gotas de su color en el piso, cada ~0,3 celdas.
  for (const g of grises) {
    if (!g.rueda || !g.suelo || quieto) continue;
    const u = s.ultimo.get(g.id) ?? -99, x = g.x + 0.4;
    if (Math.abs(x - u) > 0.3) { s.ultimo.set(g.id, x); s.manchas.push({ x: x - 0.15 + rnd() * 0.1, y: g.y, ancho: 0.18 + rnd() * 0.22, color: g.color, t: 2600 }); }
  }
  if (s.manchas.length > 120) s.manchas.splice(0, s.manchas.length - 120);
  for (const m of s.manchas) m.t -= dtMs;
  s.manchas = s.manchas.filter(m => m.t > 0);
  for (const p of s.parts) {
    p.vy += 26 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dtMs;
    if (p.piso && p.vy > 0) for (const v of vigas) if (p.y >= v.y && p.y - p.vy * dt < v.y && p.x > v.x0 && p.x < v.x1) {
      // Al caer en una viga queda una gotita pegada un rato.
      if (p.color !== '#000000' && p.color !== '#FFFFFF' && rnd() < 0.5) s.manchas.push({ x: p.x, y: v.y, ancho: p.tam, color: p.color, t: 1500 });
      p.t = 0;
    }
  }
  s.parts = s.parts.filter(p => p.t > 0);
  s.sacude = Math.max(0, s.sacude - dtMs); s.destello = Math.max(0, s.destello - dtMs);
}

// Sacudida de la pantalla (px), para aplicar con ctx.translate antes de dibujar.
export function sacudida(clave: object, c: number, ahora: number): [number, number] {
  const s = est(clave);
  if (!s.sacude) return [0, 0];
  const f = (s.sacude / 320) * c * 0.12;
  return [Math.round(Math.sin(ahora / 23) * f), Math.round(Math.cos(ahora / 31) * f)];
}

// Manchas en el piso y las vigas (antes de las figuras).
export function dibujarManchas(ctx: CanvasRenderingContext2D, m: Marco, clave: object) {
  const s = est(clave), { c, X, Y } = m;
  for (const k of s.manchas) {
    ctx.globalAlpha = Math.min(1, k.t / 600);
    const w = Math.max(2, Math.round(k.ancho * c)), h = Math.max(2, Math.round(c * 0.07));
    ctx.fillStyle = '#000'; ctx.fillRect(X(k.x) - 1, Y(k.y) - h - 1, w + 2, h + 1);
    ctx.fillStyle = k.color; ctx.fillRect(X(k.x), Y(k.y) - h, w, h);
  }
  ctx.globalAlpha = 1;
}
// Partículas y destello (después de las figuras).
export function dibujarParticulas(ctx: CanvasRenderingContext2D, m: Marco, clave: object, ancho: number, alto: number) {
  const s = est(clave), { c, X, Y } = m;
  for (const p of s.parts) {
    const t = Math.max(2, Math.round(p.tam * c * Math.min(1, (p.t / p.total) * 1.6)));
    ctx.fillStyle = '#000'; ctx.fillRect(X(p.x) - 1, Y(p.y) - 1, t + 2, t + 2);
    ctx.fillStyle = p.color; ctx.fillRect(X(p.x), Y(p.y), t, t);
  }
  if (s.destello) { ctx.globalAlpha = (s.destello / 160) * 0.35; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, ancho, alto); ctx.globalAlpha = 1; }
}
