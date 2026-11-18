// Los 5 estilos de música de la estación (plan 012, D3): composiciones originales que se generan aquí con Web Audio,
// sin archivos. Cada estilo es un bucle de 8 compases de 16 semicorcheas con cuatro pistas: batería, bajo, acordes y
// melodía. Los timbres (qué onda, qué filtro, qué envolvente) están en el mismo estilo; el motor (motor.ts) solo los toca.

export type Pista = 'bateria' | 'bajo' | 'acordes' | 'melodia';
export const PISTAS: Pista[] = ['bateria', 'bajo', 'acordes', 'melodia'];

export type Onda = OscillatorType | 'pulso25';
export interface Voz {
  ondas: Onda[];          // osciladores sumados
  desafinar?: number[];   // cents por oscilador (coro)
  ataque: number; caida: number; sostener: number; relajo: number; // ADSR (s y 0..1)
  filtro: number;         // corte del pasa bajos (Hz)
  filtroEnv?: number;     // cuánto abre el filtro al atacar (múltiplo del corte)
  q?: number;
  vol: number;
  vibrato?: [number, number]; // [Hz, cents]
  octava?: number;        // transpone en octavas
  eco?: number;           // envío al eco (0..1)
  sala?: number;          // envío a la sala (0..1)
}
export interface Bombo { f0: number; f1: number; caida: number; clic: number; vol: number }
export interface Caja { tono: number; filtro: number; q: number; caida: number; cuerpo: number; vol: number; sala?: number }
export interface Hat { filtro: number; caida: number; abierto: number; vol: number }

export interface Estilo {
  id: string;
  nombre: string;
  bajada: string;          // una línea para el botón
  color: string;           // color del botón (Línea azul)
  bpm: number;
  swing: number;           // 0..0,3 de una semicorchea, en las impares
  nivel: number;           // ganancia final del estilo (medida para que todos suenen parejo)
  // 8 compases: [bajo (MIDI), notas del acorde (MIDI)]
  acordes: [number, number[]][];
  ritmoAcordes: string;    // 16 pasos: x = ataque, o = ataque suave, - = sigue, . = suelta, a = arpegio
  bajo: string | string[]; // 16 pasos: R = fundamental, O = octava, 5 = quinta, - = sigue, . = silencio
  bateria: { bombo: string[]; caja: string[]; hat: string[] }; // por compás (se repiten); x fuerte, o medio, g suave, O hat abierto
  melodia: string[];       // 8 compases en fichas «NOTA/pasos» o «./pasos» que suman 16
  timbre: { bombo: Bombo; caja: Caja; hat: Hat; bajo: Voz; acordes: Voz; melodia: Voz };
  eco: number;             // tiempo del eco en negras (0,75 = corchea con puntillo)
}

// ---------------------------------------------------------------- notación
const NOMBRES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function midi(n: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(n);
  if (!m) throw new Error('Nota inválida: ' + n);
  return 12 * (Number(m[3]) + 1) + NOMBRES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
const ac = (bajo: string, ...notas: string[]): [number, number[]] => [midi(bajo), notas.map(midi)];

export interface NotaMel { paso: number; midi: number; largo: number }
// «A4/3 ./1 C5/4» → notas por paso absoluto dentro del bucle de 8 compases.
export function leerMelodia(compases: string[]): NotaMel[] {
  const out: NotaMel[] = [];
  compases.forEach((c, k) => {
    let paso = 0;
    for (const ficha of c.trim().split(/\s+/)) {
      const [n, l] = ficha.split('/'); const largo = Number(l);
      if (n !== '.') out.push({ paso: k * 16 + paso, midi: midi(n), largo });
      paso += largo;
    }
    if (paso !== 16) throw new Error(`Compás ${k + 1} de la melodía suma ${paso}`);
  });
  return out;
}

// ---------------------------------------------------------------- estilos
const loFi: Estilo = {
  id: 'lofi', nombre: 'Lo-Fi Hip Hop', bajada: '80 bpm · tranquilo', color: '#7FC8F8',
  bpm: 80, swing: 0.2, nivel: 0.93, eco: 0.75,
  acordes: [ac('D2', 'F3', 'A3', 'C4', 'E4'), ac('G2', 'F3', 'A3', 'B3', 'E4'), ac('C2', 'E3', 'G3', 'B3', 'D4'), ac('A1', 'G3', 'B3', 'C4', 'E4'),
    ac('D2', 'F3', 'A3', 'C4', 'E4'), ac('G2', 'F3', 'A3', 'B3', 'E4'), ac('C2', 'E3', 'G3', 'B3', 'D4'), ac('A1', 'G3', 'B3', 'C#4', 'E4')],
  ritmoAcordes: 'x-------o-----..',
  bajo: 'R------.R--.5-..',
  bateria: {
    bombo: ['x.........x.....', 'x......x..x.....'],
    caja: ['....x.......x...', '....x.......x..g'],
    hat: ['x.o.x.o.x.o.x.o.', 'x.o.x.o.x.o.x.oo'],
  },
  melodia: ['./4 A4/3 C5/1 E5/4 D5/4', './2 D5/2 B4/4 G4/6 ./2', './4 E5/2 G5/2 E5/2 D5/2 C5/4', 'B4/6 A4/2 ./8',
    './4 A4/3 C5/1 E5/4 G5/4', 'F5/4 E5/2 D5/2 B4/8', './2 C5/2 E5/2 G5/2 B5/4 A5/4', 'G5/2 E5/2 C5/4 A4/8'],
  timbre: {
    bombo: { f0: 110, f1: 45, caida: 0.32, clic: 0.15, vol: 0.9 },
    caja: { tono: 190, filtro: 2200, q: 0.8, caida: 0.16, cuerpo: 0.3, vol: 0.5, sala: 0.15 },
    hat: { filtro: 6500, caida: 0.045, abierto: 0.2, vol: 0.36 },
    bajo: { ondas: ['sine', 'triangle'], ataque: 0.01, caida: 0.4, sostener: 0.7, relajo: 0.12, filtro: 700, vol: 0.2 },
    acordes: { ondas: ['triangle', 'sine'], desafinar: [-6, 5], ataque: 0.012, caida: 1.1, sostener: 0.35, relajo: 0.4, filtro: 1700, filtroEnv: 1.6, vol: 0.12, vibrato: [0.6, 12], sala: 0.3 },
    melodia: { ondas: ['triangle'], ataque: 0.02, caida: 0.5, sostener: 0.45, relajo: 0.25, filtro: 2600, vol: 0.184, vibrato: [5, 6], eco: 0.4, sala: 0.25 },
  },
};

const synthwave: Estilo = {
  id: 'synthwave', nombre: 'Synthwave', bajada: '100 bpm · de noche', color: '#7A2E8E',
  bpm: 100, swing: 0, nivel: 1.2, eco: 0.75,
  acordes: [ac('A1', 'A3', 'C4', 'E4', 'A4'), ac('F1', 'A3', 'C4', 'F4'), ac('C2', 'G3', 'C4', 'E4', 'G4'), ac('G1', 'G3', 'B3', 'D4', 'G4'),
    ac('A1', 'A3', 'C4', 'E4', 'A4'), ac('F1', 'A3', 'C4', 'F4'), ac('G1', 'G3', 'B3', 'D4', 'G4'), ac('E1', 'G#3', 'B3', 'E4')],
  ritmoAcordes: 'x---------------',
  bajo: 'R.R.R.R.R.R.R.O.',
  bateria: {
    bombo: ['x.......x.......', 'x.......x.x.....'],
    caja: ['....x.......x...', '....x.......x...'],
    hat: ['xoxoxoxoxoxoxoxo'],
  },
  melodia: ['A4/2 C5/2 E5/4 D5/2 C5/2 D5/4', 'C5/8 A4/4 ./4', 'G4/2 C5/2 E5/4 G5/4 E5/4', 'D5/8 B4/4 ./4',
    'A4/2 C5/2 E5/4 A5/4 G5/4', 'F5/4 E5/4 C5/8', 'D5/4 B4/4 D5/4 G5/4', 'G#5/8 E5/4 B4/4'],
  timbre: {
    bombo: { f0: 150, f1: 42, caida: 0.38, clic: 0.4, vol: 1 },
    caja: { tono: 180, filtro: 3000, q: 0.7, caida: 0.32, cuerpo: 0.45, vol: 0.55, sala: 0.55 },
    hat: { filtro: 8000, caida: 0.035, abierto: 0.2, vol: 0.2 },
    bajo: { ondas: ['sawtooth'], ataque: 0.004, caida: 0.18, sostener: 0.3, relajo: 0.06, filtro: 380, filtroEnv: 3, q: 4, vol: 0.26 },
    acordes: { ondas: ['sawtooth', 'sawtooth'], desafinar: [-9, 9], ataque: 0.35, caida: 1, sostener: 0.8, relajo: 0.9, filtro: 1500, vol: 0.068, sala: 0.45 },
    melodia: { ondas: ['square', 'sawtooth'], desafinar: [0, 7], ataque: 0.015, caida: 0.3, sostener: 0.6, relajo: 0.2, filtro: 2600, filtroEnv: 1.4, vol: 0.098, vibrato: [5.5, 10], eco: 0.45, sala: 0.3 },
  },
};

const buttonMash: Estilo = {
  id: 'chip', nombre: 'Button Mash', bajada: '150 bpm · 8 bits', color: '#00A651',
  bpm: 150, swing: 0, nivel: 1.08, eco: 0.5,
  acordes: [ac('C3', 'C4', 'E4', 'G4', 'C5'), ac('G2', 'B3', 'D4', 'G4', 'B4'), ac('A2', 'A3', 'C4', 'E4', 'A4'), ac('F2', 'A3', 'C4', 'F4', 'A4'),
    ac('C3', 'C4', 'E4', 'G4', 'C5'), ac('G2', 'B3', 'D4', 'G4', 'B4'), ac('F2', 'A3', 'C4', 'F4', 'A4'), ac('G2', 'B3', 'D4', 'G4', 'B4')],
  ritmoAcordes: 'aaaaaaaaaaaaaaaa',
  bajo: 'R.O.R.O.R.O.R.O.',
  bateria: {
    bombo: ['x.....x...x.....', 'x.....x...x.....', 'x.....x...x.....', 'x.....x...x...x.', 'x.....x...x.....', 'x.....x...x.....', 'x.....x...x.....', 'x.....x...x.....'],
    caja: ['....x.......x...', '....x.......x...', '....x.......x...', '....x.......x...', '....x.......x...', '....x.......x...', '....x.......x...', '....x.....x.xoxx'],
    hat: ['x.x.x.x.x.x.x.x.'],
  },
  melodia: ['E5/2 G5/2 C6/2 G5/2 E5/2 G5/2 C6/4', 'B5/2 D6/2 B5/2 G5/2 D5/4 ./4', 'C6/2 A5/2 E5/2 A5/2 C6/2 E6/2 D6/4', 'C6/4 A5/4 F5/4 ./4',
    'E5/2 G5/2 C6/2 G5/2 E5/2 G5/2 C6/2 E6/2', 'D6/2 B5/2 G5/2 B5/2 D6/4 ./4', 'A5/2 C6/2 F6/2 C6/2 A5/2 C6/2 F6/4', 'G5/2 A5/2 B5/2 D6/2 G6/6 ./2'],
  timbre: {
    bombo: { f0: 220, f1: 50, caida: 0.12, clic: 0.6, vol: 0.85 },
    caja: { tono: 240, filtro: 5000, q: 0.5, caida: 0.1, cuerpo: 0.2, vol: 0.45 },
    hat: { filtro: 9000, caida: 0.025, abierto: 0.08, vol: 0.2 },
    bajo: { ondas: ['triangle'], ataque: 0.002, caida: 0.1, sostener: 0.85, relajo: 0.03, filtro: 5000, vol: 0.28 },
    acordes: { ondas: ['pulso25'], ataque: 0.002, caida: 0.06, sostener: 0.5, relajo: 0.02, filtro: 4500, vol: 0.058 },
    melodia: { ondas: ['square'], ataque: 0.003, caida: 0.08, sostener: 0.7, relajo: 0.04, filtro: 3800, vol: 0.075, octava: -1, vibrato: [6, 8], eco: 0.2 },
  },
};

const friday: Estilo = {
  id: 'friday', nombre: "It's Friday", bajada: '118 bpm · funk y disco', color: '#FFC20E',
  bpm: 118, swing: 0.06, nivel: 1.32, eco: 0.75,
  acordes: [ac('E2', 'G3', 'B3', 'D4', 'F#4'), ac('E2', 'G3', 'B3', 'D4', 'F#4'), ac('A2', 'G3', 'C#4', 'F#4', 'B4'), ac('A2', 'G3', 'C#4', 'F#4', 'B4'),
    ac('E2', 'G3', 'B3', 'D4', 'F#4'), ac('E2', 'G3', 'B3', 'D4', 'F#4'), ac('C3', 'G3', 'B3', 'C4', 'E4'), ac('B2', 'A3', 'B3', 'D#4', 'F#4')],
  ritmoAcordes: '.x.x..x..x.x..x.',
  bajo: ['R.O.R.O.R.O.R.O.', 'R.O.R.O.R.O.5.O.'],
  bateria: {
    bombo: ['x...x...x...x...'],
    caja: ['....x.......x...', '....x.......x.g.'],
    hat: ['x.O.x.O.x.O.x.O.', 'xgOgx.O.xgOgx.Ox'],
  },
  melodia: ['./8 B4/1 D5/1 ./1 E5/3 ./2', 'D5/2 B4/2 A4/2 B4/4 ./6', './8 C#5/1 E5/1 ./1 F#5/3 ./2', 'E5/2 C#5/2 B4/2 A4/4 ./6',
    './8 B4/1 D5/1 ./1 E5/1 G5/2 ./2', 'F#5/2 E5/2 D5/2 E5/4 ./6', './4 G5/2 E5/2 ./2 G5/2 B5/4', 'A5/2 F#5/2 D#5/4 B4/4 ./4'],
  timbre: {
    bombo: { f0: 130, f1: 48, caida: 0.26, clic: 0.35, vol: 0.95 },
    caja: { tono: 210, filtro: 1500, q: 0.9, caida: 0.18, cuerpo: 0.15, vol: 0.55, sala: 0.3 },
    hat: { filtro: 7500, caida: 0.035, abierto: 0.22, vol: 0.22 },
    bajo: { ondas: ['sawtooth', 'square'], ataque: 0.003, caida: 0.14, sostener: 0.25, relajo: 0.05, filtro: 500, filtroEnv: 2.5, q: 3, vol: 0.24 },
    acordes: { ondas: ['square', 'sawtooth'], desafinar: [-4, 4], ataque: 0.002, caida: 0.09, sostener: 0.15, relajo: 0.05, filtro: 2000, filtroEnv: 1.5, q: 2, vol: 0.081 },
    melodia: { ondas: ['sawtooth', 'sawtooth'], desafinar: [-7, 7], ataque: 0.03, caida: 0.2, sostener: 0.7, relajo: 0.1, filtro: 1800, filtroEnv: 2, q: 1.5, vol: 0.091, eco: 0.2, sala: 0.3 },
  },
};

const ambient: Estilo = {
  id: 'ambient', nombre: 'Acoustic Ambient', bajada: '72 bpm · calma', color: '#FF8FB1',
  bpm: 72, swing: 0, nivel: 0.9, eco: 0.75,
  acordes: [ac('D2', 'F#3', 'A3', 'C#4', 'E4'), ac('B1', 'A3', 'D4', 'E4', 'F#4'), ac('G2', 'F#3', 'A3', 'B3', 'D4'), ac('A2', 'E3', 'A3', 'B3', 'D4'),
    ac('D2', 'F#3', 'A3', 'C#4', 'E4'), ac('F#2', 'E3', 'A3', 'C#4', 'F#4'), ac('G2', 'F#3', 'A3', 'B3', 'D4'), ac('A2', 'E3', 'A3', 'B3', 'D4')],
  ritmoAcordes: 'x---------------',
  bajo: 'R---------------',
  bateria: {
    bombo: ['x..........x....'],
    caja: ['........x.......'],
    hat: ['x.o.x.o.x.o.x.o.', 'x.o.x.o.x.o.x.oo'],
  },
  melodia: ['D4/2 A4/2 E5/2 F#5/2 A5/2 F#5/2 E5/2 C#5/2', 'B3/2 F#4/2 D5/2 E5/2 A5/2 E5/2 D5/2 F#4/2', 'G3/2 D4/2 A4/2 B4/2 F#5/2 B4/2 A4/2 D4/2', 'A3/2 E4/2 B4/2 D5/2 E5/4 ./4',
    'D4/2 A4/2 E5/2 F#5/2 A5/2 F#5/2 E5/2 C#5/2', 'F#3/2 C#4/2 E4/2 A4/2 C#5/2 A4/2 E4/2 C#4/2', 'G3/2 D4/2 A4/2 B4/2 F#5/2 B4/2 A4/2 D4/2', 'A3/2 E4/2 B4/2 E5/2 A5/8'],
  timbre: {
    bombo: { f0: 90, f1: 42, caida: 0.4, clic: 0.05, vol: 0.5 },
    caja: { tono: 700, filtro: 3500, q: 2, caida: 0.06, cuerpo: 0.5, vol: 0.28, sala: 0.5 },
    hat: { filtro: 5500, caida: 0.06, abierto: 0.1, vol: 0.26 },
    bajo: { ondas: ['sine'], ataque: 0.15, caida: 1, sostener: 0.8, relajo: 0.8, filtro: 400, vol: 0.15 },
    acordes: { ondas: ['sine', 'triangle'], desafinar: [-5, 5], ataque: 1.2, caida: 1.5, sostener: 0.75, relajo: 1.8, filtro: 1800, vol: 0.102, vibrato: [0.3, 8], sala: 0.6 },
    melodia: { ondas: ['triangle', 'sine'], desafinar: [0, 1200], ataque: 0.004, caida: 0.9, sostener: 0, relajo: 0.6, filtro: 3200, filtroEnv: 1.3, vol: 0.184, eco: 0.3, sala: 0.45 },
  },
};

export const ESTILOS: Estilo[] = [loFi, synthwave, buttonMash, friday, ambient];

export const TEMPOS = [
  { id: 'lento', nombre: 'Lento', factor: 0.85 },
  { id: 'medio', nombre: 'Medio', factor: 1 },
  { id: 'rapido', nombre: 'Rápido', factor: 1.15 },
] as const;
export type Tempo = typeof TEMPOS[number]['id'];
