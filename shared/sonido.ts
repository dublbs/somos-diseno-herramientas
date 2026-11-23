// Efectos de sonido sintetizados con Web Audio (plan 018). Sin archivos, sin dependencias y sin red.
// - El audio se enciende con el primer toque (regla de los navegadores) y se pausa con la pestaña oculta.
// - Cada equipo puede quedar mudo: botón «Sonido» (BotonSonido) o `?sonido=0`; se guarda en localStorage (`sd:sonido`).
// - Si Web Audio no está o falla, todo sigue igual sin sonido.

const LLAVE = 'sd:sonido';
const VOLUMEN = 0.6; // volumen general: bajo, porque en el stand hay varias tablets juntas
const SEPARACION_MS = 40; // el mismo efecto no se repite antes de esto

let ctx: AudioContext | null = null;
let maestro: GainNode | null = null;
let ruidoBuf: AudioBuffer | null = null;
let activo = leerActivo();
const oyentes = new Set<(on: boolean) => void>();
const ultimos = new Map<string, number>();

function leerActivo(): boolean {
  try {
    const q = new URLSearchParams(location.search).get('sonido');
    if (q === '0') localStorage.setItem(LLAVE, 'off');
    if (q === '1') localStorage.removeItem(LLAVE);
    return localStorage.getItem(LLAVE) !== 'off';
  } catch { return true; }
}

export const sonidoActivo = () => activo;
export function ponerSonido(on: boolean) {
  activo = on;
  try { if (on) localStorage.removeItem(LLAVE); else localStorage.setItem(LLAVE, 'off'); } catch { /* sin almacenamiento */ }
  if (maestro && ctx) maestro.gain.setTargetAtTime(on ? VOLUMEN : 0, ctx.currentTime, 0.02);
  if (!on) detenerContinuos();
  oyentes.forEach(f => f(on));
}
export function alCambiarSonido(f: (on: boolean) => void) { oyentes.add(f); return () => { oyentes.delete(f); }; }

// Crea el contexto la primera vez que se necesita. Los navegadores lo dejan «suspendido» hasta un toque: `despertar`.
function audio(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: 'interactive' });
    maestro = ctx.createGain();
    maestro.gain.value = activo ? VOLUMEN : 0;
    // Un compresor suave evita que varios efectos juntos saturen el parlante de la tablet.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    maestro.connect(comp).connect(ctx.destination);
    ruidoBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = ruidoBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch { ctx = null; }
  return ctx;
}
const despertar = () => { const c = audio(); if (c && c.state === 'suspended') c.resume().catch(() => {}); };
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', despertar, { capture: true, passive: true });
  window.addEventListener('keydown', despertar, { capture: true });
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { detenerContinuos(); ctx.suspend().catch(() => {}); } else ctx.resume().catch(() => {});
  });
}

// ¿Se puede tocar ahora? (activo, contexto corriendo y sin repetir el mismo efecto demasiado seguido)
function listo(clave: string): AudioContext | null {
  if (!activo) return null;
  const c = audio();
  if (!c || c.state !== 'running' || !maestro) return null;
  const t = performance.now(), u = ultimos.get(clave) ?? 0;
  if (t - u < SEPARACION_MS) return null;
  ultimos.set(clave, t);
  return c;
}

// ---------------------------------------------------------------- piezas
type Onda = OscillatorType;
interface Tono { f: number; f2?: number; dur: number; onda?: Onda; vol?: number; en?: number; ataque?: number }
function tono(c: AudioContext, { f, f2, dur, onda = 'square', vol = 0.2, en = 0, ataque = 0.004 }: Tono) {
  const t0 = c.currentTime + en, o = c.createOscillator(), g = c.createGain();
  o.type = onda;
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(maestro!);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
interface Ruido { dur: number; filtro?: BiquadFilterType; f?: number; f2?: number; q?: number; vol?: number; en?: number; ataque?: number }
function ruido(c: AudioContext, { dur, filtro = 'bandpass', f = 2000, f2, q = 1, vol = 0.2, en = 0, ataque = 0.004 }: Ruido) {
  const t0 = c.currentTime + en, s = c.createBufferSource(), b = c.createBiquadFilter(), g = c.createGain();
  s.buffer = ruidoBuf; s.loop = true;
  b.type = filtro; b.Q.value = q;
  b.frequency.setValueAtTime(f, t0);
  if (f2) b.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(b).connect(g).connect(maestro!);
  s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
}
// Notas en semitonos desde La 440 (para melodías cortas).
const nota = (semitonos: number) => 440 * Math.pow(2, semitonos / 12);
function melodia(c: AudioContext, notas: number[], paso: number, onda: Onda = 'square', vol = 0.14) {
  notas.forEach((n, i) => tono(c, { f: nota(n), dur: paso * 1.6, onda, vol, en: i * paso }));
}

// ---------------------------------------------------------------- sonidos continuos (el spray de Graffiti)
export interface Continuo { volumen(v: number): void; parar(): void }
const continuos = new Set<{ parar(): void }>();
function detenerContinuos() { continuos.forEach(c => c.parar()); continuos.clear(); }

// Ruido filtrado continuo que entra y sale suave (el siseo de la lata, el rodillo, el plumón). `volumen(0..1)` lo ajusta
// mientras suena, relativo a `pico`.
export function siseo(f = 6500, q = 0.7, pico = 0.09, filtro: BiquadFilterType = 'bandpass'): Continuo {
  const nada: Continuo = { volumen() {}, parar() {} };
  if (!activo) return nada;
  const c = audio();
  if (!c || c.state !== 'running' || !maestro) return nada;
  const s = c.createBufferSource(), b = c.createBiquadFilter(), g = c.createGain();
  s.buffer = ruidoBuf; s.loop = true;
  b.type = filtro; b.frequency.value = f; b.Q.value = q;
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(pico, c.currentTime + 0.05);
  s.connect(b).connect(g).connect(maestro);
  s.start(0, Math.random());
  let vivo = true;
  const h = {
    volumen(v: number) { if (vivo) g.gain.setTargetAtTime(0.0001 + pico * Math.max(0, Math.min(1, v)), c.currentTime, 0.03); },
    parar() {
      if (!vivo) return; vivo = false; continuos.delete(h);
      g.gain.setTargetAtTime(0.0001, c.currentTime, 0.03);
      s.stop(c.currentTime + 0.2);
    },
  };
  continuos.add(h);
  return h;
}

// ---------------------------------------------------------------- catálogo
// Cada efecto es una función corta. Los nombres son los que usan las experiencias.
const efectos = {
  // comunes
  toque: (c: AudioContext) => tono(c, { f: 900, dur: 0.05, onda: 'triangle', vol: 0.08 }),
  pop: (c: AudioContext) => tono(c, { f: 420, f2: 900, dur: 0.08, onda: 'sine', vol: 0.18 }),
  quitar: (c: AudioContext) => { tono(c, { f: 500, f2: 180, dur: 0.12, onda: 'triangle', vol: 0.14 }); ruido(c, { dur: 0.1, f: 1500, vol: 0.06 }); },
  exito: (c: AudioContext) => melodia(c, [3, 7, 10, 15], 0.07, 'square', 0.1),

  // Hora punta · nivel 1 (el cruce)
  paso: (c: AudioContext) => tono(c, { f: 520, f2: 760, dur: 0.06, vol: 0.07 }),
  lata: (c: AudioContext) => { tono(c, { f: nota(12), dur: 0.06, vol: 0.12 }); tono(c, { f: nota(19), dur: 0.12, vol: 0.12, en: 0.06 }); ruido(c, { dur: 0.08, f: 5000, q: 3, vol: 0.05, en: 0.02 }); },
  bocina: (c: AudioContext) => { tono(c, { f: 330, dur: 0.28, onda: 'sawtooth', vol: 0.1 }); tono(c, { f: 415, dur: 0.28, onda: 'sawtooth', vol: 0.08 }); },
  choque: (c: AudioContext) => { ruido(c, { dur: 0.35, filtro: 'lowpass', f: 1800, f2: 200, vol: 0.3 }); tono(c, { f: 160, f2: 50, dur: 0.3, onda: 'square', vol: 0.18 }); },
  metro: (c: AudioContext) => { tono(c, { f: 220, dur: 0.5, onda: 'sawtooth', vol: 0.09 }); tono(c, { f: 277, dur: 0.5, onda: 'sawtooth', vol: 0.07 }); ruido(c, { dur: 0.7, filtro: 'lowpass', f: 400, vol: 0.2, ataque: 0.15 }); },
  llego: (c: AudioContext) => melodia(c, [0, 4, 7, 12, 16], 0.08, 'square', 0.1),
  tarde: (c: AudioContext) => melodia(c, [7, 3, 0, -5], 0.12, 'triangle', 0.12),

  // Hora punta · andén y jefe
  salto: (c: AudioContext) => tono(c, { f: 300, f2: 820, dur: 0.12, vol: 0.09 }),
  bajar: (c: AudioContext) => tono(c, { f: 600, f2: 250, dur: 0.1, onda: 'triangle', vol: 0.08 }),
  lanzar: (c: AudioContext) => ruido(c, { dur: 0.14, filtro: 'highpass', f: 3500, vol: 0.12 }),
  pinta: (c: AudioContext) => { ruido(c, { dur: 0.09, filtro: 'lowpass', f: 900, vol: 0.22 }); tono(c, { f: 200, f2: 120, dur: 0.07, onda: 'sine', vol: 0.12 }); },
  bola: (c: AudioContext) => melodia(c, [5, 9, 12], 0.05, 'square', 0.1),
  rebota: (c: AudioContext) => tono(c, { f: 260, f2: 520, dur: 0.12, onda: 'sine', vol: 0.16 }),
  rompe: (c: AudioContext) => { ruido(c, { dur: 0.18, f: 2600, q: 0.8, vol: 0.18 }); tono(c, { f: nota(19), dur: 0.08, vol: 0.08, en: 0.04 }); tono(c, { f: nota(24), dur: 0.1, vol: 0.07, en: 0.1 }); },
  escapa: (c: AudioContext) => ruido(c, { dur: 0.3, f: 600, f2: 2400, q: 2, vol: 0.12 }),
  dano: (c: AudioContext) => { tono(c, { f: 330, f2: 110, dur: 0.22, vol: 0.14 }); ruido(c, { dur: 0.12, filtro: 'lowpass', f: 700, vol: 0.12 }); },
  pieza: (c: AudioContext) => melodia(c, [12, 16, 19, 24], 0.05, 'triangle', 0.12),
  golpe: (c: AudioContext) => { ruido(c, { dur: 0.2, filtro: 'lowpass', f: 1200, vol: 0.3 }); tono(c, { f: 140, f2: 60, dur: 0.22, vol: 0.2 }); },
  escupe: (c: AudioContext) => ruido(c, { dur: 0.16, f: 1200, f2: 300, q: 1.5, vol: 0.16 }),
  embiste: (c: AudioContext) => { tono(c, { f: 90, f2: 60, dur: 0.45, onda: 'sawtooth', vol: 0.16 }); ruido(c, { dur: 0.45, filtro: 'lowpass', f: 300, vol: 0.18, ataque: 0.08 }); },
  aterriza: (c: AudioContext) => { tono(c, { f: 120, f2: 35, dur: 0.35, onda: 'sine', vol: 0.35 }); ruido(c, { dur: 0.3, filtro: 'lowpass', f: 500, vol: 0.25 }); },
  salpica: (c: AudioContext) => ruido(c, { dur: 0.12, filtro: 'lowpass', f: 1400, f2: 500, vol: 0.14 }),
  llegaJefe: (c: AudioContext) => { melodia(c, [-12, -11, -12, -11], 0.18, 'sawtooth', 0.09); ruido(c, { dur: 0.8, filtro: 'lowpass', f: 250, vol: 0.12, ataque: 0.3 }); },
  victoria: (c: AudioContext) => melodia(c, [0, 4, 7, 12, 7, 12, 16, 19], 0.09, 'square', 0.11),
  derrota: (c: AudioContext) => melodia(c, [4, 3, 2, -1, -6], 0.14, 'triangle', 0.13),

  // Graffiti
  rodillo: (c: AudioContext) => ruido(c, { dur: 0.12, filtro: 'lowpass', f: 450, vol: 0.12, ataque: 0.03 }),
  plumon: (c: AudioContext) => ruido(c, { dur: 0.06, f: 3200, q: 4, vol: 0.06 }),
  sticker: (c: AudioContext) => { ruido(c, { dur: 0.05, filtro: 'lowpass', f: 2500, vol: 0.2 }); tono(c, { f: 240, f2: 140, dur: 0.06, onda: 'sine', vol: 0.12 }); },
  borrar: (c: AudioContext) => ruido(c, { dur: 0.08, filtro: 'lowpass', f: 1100, vol: 0.08 }),
  agitar: (c: AudioContext) => { for (let i = 0; i < 3; i++) { ruido(c, { dur: 0.04, f: 4500, q: 5, vol: 0.08, en: i * 0.07 }); tono(c, { f: 2400 + i * 200, dur: 0.03, onda: 'triangle', vol: 0.04, en: i * 0.07 }); } },
  plantilla: (c: AudioContext) => ruido(c, { dur: 0.12, f: 1800, f2: 900, q: 1, vol: 0.1 }),

  // Cabina de fotos
  cuenta: (c: AudioContext) => tono(c, { f: 880, dur: 0.1, onda: 'sine', vol: 0.16 }),
  obturador: (c: AudioContext) => { ruido(c, { dur: 0.03, filtro: 'highpass', f: 2500, vol: 0.3 }); ruido(c, { dur: 0.06, f: 1500, q: 2, vol: 0.2, en: 0.07 }); tono(c, { f: 1760, dur: 0.05, onda: 'sine', vol: 0.08 }); },
  revelado: (c: AudioContext) => { ruido(c, { dur: 0.7, f: 2500, f2: 7000, q: 0.8, vol: 0.05, ataque: 0.3 }); melodia(c, [12, 19, 24], 0.12, 'sine', 0.06); },
  placa: (c: AudioContext) => tono(c, { f: 1400, dur: 0.03, onda: 'square', vol: 0.05 }),

  // Taller de Grabado
  taco: (c: AudioContext) => { tono(c, { f: 180, f2: 90, dur: 0.12, onda: 'sine', vol: 0.3 }); ruido(c, { dur: 0.06, filtro: 'lowpass', f: 1600, vol: 0.18 }); },
  prensa: (c: AudioContext) => { tono(c, { f: 110, f2: 55, dur: 0.3, onda: 'sine', vol: 0.32 }); ruido(c, { dur: 0.25, filtro: 'lowpass', f: 600, vol: 0.15, ataque: 0.02 }); ruido(c, { dur: 0.3, f: 3000, q: 0.7, vol: 0.05, en: 0.15 }); },
  entintar: (c: AudioContext) => ruido(c, { dur: 0.25, filtro: 'lowpass', f: 700, f2: 350, vol: 0.12, ataque: 0.05 }),

  // Taller de Mosaicos (muy suave: se repite mucho)
  clac: (c: AudioContext) => { tono(c, { f: 2100, f2: 1700, dur: 0.035, onda: 'triangle', vol: 0.07 }); ruido(c, { dur: 0.025, f: 4500, q: 3, vol: 0.04 }); },
  giro: (c: AudioContext) => tono(c, { f: 1200, f2: 1500, dur: 0.04, onda: 'triangle', vol: 0.05 }),
  multiplicar: (c: AudioContext) => melodia(c, [7, 12, 16, 19], 0.035, 'triangle', 0.05),

  // Teatro de Papel
  papel: (c: AudioContext) => ruido(c, { dur: 0.16, f: 3500, f2: 1800, q: 0.6, vol: 0.07, ataque: 0.02 }),
  telon: (c: AudioContext) => ruido(c, { dur: 0.4, f: 900, f2: 2600, q: 0.6, vol: 0.07, ataque: 0.1 }),
};
export type Efecto = keyof typeof efectos;

// Toca un efecto. Sin sonido activo, sin audio o repetido muy seguido, no hace nada.
export function sonar(e: Efecto) {
  const c = listo(e);
  if (!c) return;
  try { efectos[e](c); } catch { /* el juego sigue sin sonido */ }
}
