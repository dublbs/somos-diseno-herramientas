import type { Curva, Pista } from './animacion';

// Piezas de Orgánica armadas con las capas y el movimiento de Figma (archivo SomosDiseño).
// Todas las coordenadas están en el marco de 240 × 240 de cada pieza. El `pivote` es el centro
// de la capa animada en Figma (donde rotan o escalan).
export interface Capa {
  src: string;
  x: number;
  y: number;
  w?: number; // si falta, el tamaño natural del SVG
  h?: number;
  pivote?: [number, number];
  pistas?: Pista[];
}

// Una forma de moverse: sus propias pistas por capa (en el orden de `capas`) y su propia duración.
export interface Variante {
  id: string;
  nombre: string;
  durMs: number;
  grupo?: Pista[];
  pistas: (Pista[] | undefined)[];
}

export interface Pieza {
  id: string;
  nombre: string;
  figma: string; // nodo de origen
  durMs: number;
  caja: [number, number, number, number]; // zona que se toca y se encuadra, en el marco de 240
  capas: Capa[];
  grupo?: Pista[]; // movimiento de todo el conjunto
  partes?: { tipo: string; x: number; y: number; escala: number; fase: number }[]; // piezas dentro de la pieza
  muestra?: number; // momento del ciclo (0..1) para la miniatura
  variantes?: Variante[]; // distintas animaciones de la misma pieza; la primera es la de Figma
}

const A = (ruta: string) => `${import.meta.env.BASE_URL}figma/organica/${ruta}.svg`;
const T5 = [0, 0.25, 0.5, 0.75, 1];

// La primera variante sale de las pistas originales de la pieza; las otras se suman a mano.
const conVariantes = (base: Pieza, nombre0: string, extras: Variante[]): Pieza => ({
  ...base,
  variantes: [{ id: 'base', nombre: nombre0, durMs: base.durMs, grupo: base.grupo, pistas: base.capas.map(c => c.pistas) }, ...extras],
});
const girar = (v: number[], e: Curva = 'easeInOut', t: number[] = T5): Pista[] => [{ prop: 'rotate', t, v, e }];

// C3 · Títere de varillas · pudú que camina (1 s)
const patasA: Pista[] = [{ prop: 'rotate', t: [0, 0.5, 1], v: [-16, 16, -16], e: 'easeInOut' }];
const patasB: Pista[] = [{ prop: 'rotate', t: [0, 0.5, 1], v: [16, -16, 16], e: 'easeInOut' }];
const pudu: Pieza = {
  id: 'pudu', nombre: 'Pudú', figma: '613:3802', durMs: 1000, caja: [40, 62, 176, 134],
  grupo: [{ prop: 'y', t: T5, v: [0, -3, 0, -3, 0], e: 'easeInOut' }],
  capas: [
    { src: A('pudu/cola'), x: 0, y: 0, pivote: [63.6, 116.4], pistas: [{ prop: 'rotate', t: T5, v: [0, -20, 0, -20, 0], e: 'easeInOut' }] },
    { src: A('pudu/pata1'), x: 0, y: 0, pivote: [72, 139], pistas: patasA },
    { src: A('pudu/pata2'), x: 0, y: 0, pivote: [91.2, 139], pistas: patasB },
    { src: A('pudu/pata3'), x: 0, y: 0, pivote: [132, 139], pistas: patasB },
    { src: A('pudu/pata4'), x: 0, y: 0, pivote: [148.8, 139], pistas: patasA },
    { src: A('pudu/cuerpo'), x: 0, y: 0 },
    { src: A('pudu/cabeza'), x: 0, y: 0, pivote: [153.6, 120], pistas: [{ prop: 'rotate', t: T5, v: [0, 5, 0, 5, 0], e: 'easeInOut' }] },
  ],
};

// M3 · Paloma que aletea. En Figma son 2 s con el mismo aleteo dos veces; aquí un ciclo de 1 s.
const U13 = Array.from({ length: 13 }, (_, i) => i / 12);
const ALA = [0, 2.391, 4.741, 6.576, 6.831, 4.502, 0, -4.502, -6.831, -6.576, -4.741, -2.391, 0];
const ALA_Y = [1, 0.977, 0.9, 0.75, 0.537, 0.329, 0.24, 0.329, 0.537, 0.75, 0.9, 0.977, 1];
const paloma: Pieza = {
  id: 'paloma', nombre: 'Paloma', figma: '669:3680', durMs: 1000, caja: [20, 10, 200, 222],
  grupo: [{ prop: 'x', t: U13, v: [0, 1.025, 2.032, 2.818, 2.927, 1.929, 0, -1.929, -2.927, -2.818, -2.032, -1.025, 0] }],
  capas: [
    { src: A('paloma/cola'), x: -148, y: -119, pivote: [92, 121],
      pistas: [{ prop: 'rotate', t: U13, v: [-2.524, -2.926, -2.955, -2.388, -1.03, 0.891, 2.524, 2.976, 2.134, 0.657, -0.759, -1.819, -2.524] }] },
    { src: A('paloma/ala-superior'), x: -130, y: -127, pivote: [110, 113],
      pistas: [{ prop: 'rotate', t: U13, v: ALA }, { prop: 'scaleY', t: U13, v: ALA_Y }] },
    { src: A('paloma/ala-inferior'), x: -130, y: -112, pivote: [110, 128],
      pistas: [{ prop: 'rotate', t: U13, v: ALA.map(n => -n) }, { prop: 'scaleY', t: U13, v: ALA_Y }] },
    { src: A('paloma/cuerpo'), x: 75.7, y: 98.9 },
    { src: A('paloma/cabeza'), x: 169.3, y: 102.8 },
    { src: A('paloma/pico'), x: 199.6, y: 115.3 },
    { src: A('paloma/ojo'), x: 185.7, y: 108.3 },
  ],
};

// C4 · Libro pop-up: el sol y la araucaria ya no brotan y se pliegan; se quedan arriba y se mueven en loop.
const sol: Pieza = {
  id: 'sol', nombre: 'Sol', figma: '620:864 (movimiento nuevo)', durMs: 8000, caja: [76, 14, 88, 88],
  capas: [{
    src: A('sol/sol'), x: 0, y: 0, pivote: [120, 58],
    pistas: [
      { prop: 'rotate', t: [0, 1], v: [0, 360] }, // una vuelta cada 8 s
      ...(['scaleX', 'scaleY'] as const).map(prop => ({ prop, t: T5, v: [1, 1.05, 1, 1.05, 1], e: 'easeInOut' as Curva })),
    ],
  }],
};
const araucaria: Pieza = {
  id: 'araucaria', nombre: 'Araucaria', figma: '620:932 (movimiento nuevo)', durMs: 4000, caja: [82, 146, 76, 80],
  capas: [{
    src: A('araucaria/araucaria'), x: 0, y: 0, pivote: [120, 222.8],
    pistas: [
      { prop: 'rotate', t: T5, v: [0, -2.5, 0, 2.5, 0], e: 'easeInOut' }, // se mece con la brisa
      { prop: 'scaleY', t: T5, v: [1, 1.02, 1, 1.02, 1], e: 'easeInOut' }, // respira
    ],
  }],
};

// Pez que nada (2 s). Movimiento creado aquí con las partes de C8 · Collage a mano, para pasarlo luego a Figma:
// el cuerpo sube y baja, la cola coletea y las aletas se mecen.
const nada = (v: number[], e: Curva = 'easeInOut'): Pista[] => [{ prop: 'rotate', t: T5, v, e }];
const pez: Pieza = {
  id: 'pez', nombre: 'Pez', figma: '613:4419 (movimiento nuevo)', durMs: 2000, caja: [18, 48, 182, 138],
  grupo: [{ prop: 'y', t: T5, v: [0, -2.5, 0, 2.5, 0], e: 'easeInOut' }],
  capas: [
    { src: A('pez/cola'), x: 18.6, y: 81.5, pivote: [60, 120], pistas: nada([0, 14, 0, -14, 0]) },
    { src: A('pez/aleta-dorsal'), x: 95.2, y: 51.2, pivote: [120, 92], pistas: nada([0, -4, 0, 4, 0]) },
    { src: A('pez/aleta-ventral'), x: 107.5, y: 148.2, pivote: [118, 150], pistas: nada([0, 6, 0, -6, 0]) },
    { src: A('pez/cuerpo'), x: 51.5, y: 80.6 },
    { src: A('pez/escamas1'), x: 76.9, y: 97.5 },
    { src: A('pez/escamas2'), x: 76.8, y: 119 },
    { src: A('pez/ojo'), x: 162.6, y: 102.8 },
    { src: A('pez/pupila'), x: 167.6, y: 106.4 },
  ],
};

// FA01 · Pingüino de Humboldt (figura estática de Figma): camina balanceándose sobre las patas (1 s).
const pinguino: Pieza = {
  id: 'pinguino', nombre: 'Pingüino', figma: '660:3503 (movimiento nuevo)', durMs: 1000, caja: [66, 31, 108, 178],
  capas: [{
    src: A('pinguino/pinguino'), x: 65.2, y: 30, pivote: [120, 208],
    pistas: [
      { prop: 'rotate', t: T5, v: [0, 5, 0, -5, 0], e: 'easeInOut' },
      { prop: 'y', t: T5, v: [0, -3, 0, -3, 0], e: 'easeInOut' },
    ],
  }],
};

// FA10 · Cántaro de greda negra (figura estática de Figma): respira y se mece apenas (2 s).
const cantaro: Pieza = {
  id: 'cantaro', nombre: 'Cántaro', figma: '660:12182 (movimiento nuevo)', durMs: 2000, caja: [38, 44, 164, 152],
  capas: [{
    src: A('cantaro/cantaro'), x: 37.8, y: 43.6, pivote: [120, 196],
    pistas: [
      { prop: 'scaleY', t: T5, v: [1, 1.03, 1, 1.03, 1], e: 'easeInOut' },
      { prop: 'rotate', t: T5, v: [0, 1.5, 0, -1.5, 0], e: 'easeInOut' },
    ],
  }],
};

// C10 · Ola en la piña (2,4 s): la piña respira y las 25 escamas se hinchan en ola de abajo hacia arriba.
// [izquierda, arriba, a, b, c] de cada escama (posición del marco de Figma y tiempos del pulso).
const ESCAMAS: [number, number, number, number, number][] = [
  [-115.55, -186.8, 0.5013, 0.6263, 0.8138], [-135.95, -171.15, 0.4492, 0.5742, 0.7617], [-94.1, -171.45, 0.4613, 0.5863, 0.7738],
  [-156.85, -155.5, 0.3975, 0.5225, 0.71], [-115.35, -155.55, 0.4083, 0.5333, 0.7208], [-73.15, -155.45, 0.4192, 0.5442, 0.7317],
  [-177.8, -139.9, 0.3458, 0.4708, 0.6583], [-136.3, -140.2, 0.3575, 0.4825, 0.67], [-94.25, -139.95, 0.3675, 0.4925, 0.68],
  [-157.35, -124.55, 0.3054, 0.4304, 0.6179], [-115.1, -124.7, 0.3167, 0.4417, 0.6292], [-72.95, -124.25, 0.3267, 0.4517, 0.6392],
  [-178.1, -109, 0.2537, 0.3787, 0.5663], [-136.35, -109, 0.2646, 0.3896, 0.5771], [-94.3, -109.15, 0.2763, 0.4013, 0.5888],
  [-157.4, -93.3, 0.2125, 0.3375, 0.525], [-115, -93, 0.2229, 0.3479, 0.5354], [-73.35, -93.45, 0.235, 0.36, 0.5475],
  [-136.35, -77.7, 0.1717, 0.2967, 0.4842], [-94.4, -77.6, 0.1825, 0.3075, 0.495],
  [-156.85, -62.05, 0.12, 0.245, 0.4325], [-115.4, -61.85, 0.13, 0.255, 0.4425], [-72.95, -62.1, 0.1421, 0.2671, 0.4546],
  [-136.05, -46.6, 0.0796, 0.2046, 0.3921], [-94.65, -46.5, 0.09, 0.215, 0.4025],
];
const pulso = (a: number, b: number, c: number): Pista[] =>
  (['scaleX', 'scaleY'] as const).map(prop => ({
    prop, t: [0, a, b, c, 1], v: [1, 1, 1.3, 1, 1], e: ['easeInOut', 'easeOut', 'easeInOut', 'linear'] as Curva[],
  }));
const pina: Pieza = {
  id: 'pina', nombre: 'Piña', figma: '620:1446', durMs: 2000, caja: [38, 14, 164, 204], muestra: 0.55,
  capas: [
    { src: A('pina/tallo'), x: 0, y: 0 },
    { src: A('pina/cuerpo'), x: 0, y: 0, pivote: [120, 125],
      pistas: (['scaleX', 'scaleY'] as const).map(prop => ({ prop, t: [0, 1 / 3, 2 / 3, 1], v: [1, 1.03, 1, 1], e: 'easeInOut' as Curva })) },
    ...ESCAMAS.map(([l, t, a, b, c], i): Capa => ({
      src: A(`pina/escama${String(i + 1).padStart(2, '0')}`), x: 0, y: 0, pivote: [l + 240, t + 240], pistas: pulso(a, b, c),
    })),
  ],
};

// C9 · K'isa · el color corre por la faja (2,6 s): las franjas y los rombos aparecen en cascada.
const inset = (t: number, r: number, b: number, l: number) => ({ x: l * 2.4, y: t * 2.4, w: (100 - l - r) * 2.4, h: (100 - t - b) * 2.4 });
const fundido = (t: number[], v: number[], e: Curva[]): Pista[] => [{ prop: 'opacity', t, v, e }];
const e6: Curva[] = ['linear', 'linear', 'easeInOut', 'linear', 'linear'];
const franja = (n: number, caja: [number, number, number, number], t: number[], v: number[], e: Curva[]): Capa =>
  ({ src: A(`kisa/${n < 7 ? 'franja' : 'rombo'}${n < 7 ? n : n - 6}`), ...inset(...caja), pistas: fundido(t, v, e) });
const kisa: Pieza = {
  id: 'kisa', nombre: "K'isa", figma: '613:4553', durMs: 4000, caja: [68, 18, 104, 216], muestra: 0.5,
  capas: [
    { src: A('kisa/faja'), x: 0, y: 0 },
    franja(1, [9.75, 29.87, 86.79, 29.87], [0, 0.0692, 0.4615, 0.5308, 1], [0, 1, 1, 0, 0], ['linear', 'easeInOut', 'linear', 'linear']),
    franja(2, [16.33, 30, 80.29, 29.96], [0, 0.0577, 0.1269, 0.5192, 0.5885, 1], [0, 0, 1, 1, 0, 0], e6),
    franja(3, [22.83, 30.08, 73.83, 29.96], [0, 0.1154, 0.1846, 0.5769, 0.6462, 1], [0, 0, 1, 1, 0, 0], e6),
    franja(4, [29.29, 29.83, 64.29, 30], [0, 0.1731, 0.2423, 0.6346, 0.7038, 1], [0, 0, 1, 1, 0, 0], e6),
    franja(5, [38.83, 29.96, 54.75, 29.87], [0, 0.2308, 0.3, 0.6923, 0.7615, 1], [0, 0, 1, 1, 0, 0], e6),
    franja(6, [48.29, 29.92, 39.33, 29.79], [0, 0.2885, 0.3577, 0.75, 0.8192, 1], [0, 0, 1, 1, 0, 0], e6),
    ...([[77.5, 57.54, 17.63, 37.54], [77.37, 50.75, 17.54, 44.21], [77.46, 44.17, 17.58, 50.96], [77.54, 37.46, 17.42, 57.54]] as const)
      .map((c, i) => franja(7 + i, [...c], [0, 0.3654, 0.4346, 0.8269, 0.8962, 1], [0, 0, 1, 1, 0, 0], e6)),
  ],
};


// Figuras estáticas de Figma («Figuras solas»): se centran en el marco de 240 y se mueven enteras, en loop.
// Para animarles partes sueltas (aletas, pétalos, hojas) hay que separarlas en Figma.
const figura = (id: string, nombre: string, figma: string, ruta: string, w: number, h: number, durMs: number, pistas: Pista[], pivoteBase = 5): Pieza => {
  const x = (240 - w) / 2, y = (240 - h) / 2;
  return {
    id, nombre, figma: `${figma} (movimiento nuevo)`, durMs, caja: [x + 0.6, y + 0.6, w - 1.2, h - 1.2],
    capas: [{ src: A(ruta), x, y, pivote: [120, y + h - pivoteBase], pistas }],
  };
};
const mece = (grados: number, e: Curva = 'easeInOut'): Pista => ({ prop: 'rotate', t: T5, v: [0, grados, 0, -grados, 0], e });
const respira = (k: number): Pista => ({ prop: 'scaleY', t: T5, v: [1, k, 1, k, 1], e: 'easeInOut' });

const helecho = figura('helecho', 'Helecho', '660:4006', 'helecho/helecho', 85, 194, 2000, [mece(4), respira(1.02)]);
const canasto = figura('canasto', 'Canasto', '660:11130', 'canasto/canasto', 173.6, 188.7, 2000, [mece(1.2), respira(1.025)]);
const quisco = figura('quisco', 'Quisco', '660:13012', 'quisco/quisco', 145.4, 199.9, 4000, [mece(2.5), respira(1.015)]);
const flor = figura('flor', 'Flor', '660:14079', 'flor/flor-propia', 140.6, 140.6, 2000, [mece(6), { prop: 'scaleX', t: T5, v: [1, 1.04, 1, 1.04, 1], e: 'easeInOut' }, respira(1.04)], 20);

// ---- Variantes de movimiento (creadas aquí a partir de las partes de Figma) ----
// Pudú: capas = cola, pata 1-4, cuerpo, cabeza.
const pataA = (g: number) => girar([0, g, 0, g, 0]);
const pataB = (g: number) => girar([0, -g, 0, -g, 0]);
const pudu2 = conVariantes(pudu, 'Camina', [
  { id: 'brinca', nombre: 'Brinca', durMs: 1000, grupo: [{ prop: 'y', t: T5, v: [0, -10, 0, -10, 0], e: 'easeInOut' }],
    pistas: [girar([0, -25, 0, -25, 0]), pataA(-22), pataB(-22), pataB(-22), pataA(-22), undefined, girar([0, -6, 0, -6, 0])] },
  { id: 'olfatea', nombre: 'Olfatea', durMs: 2000, grupo: undefined,
    pistas: [girar([0, -18, 0, -18, 0, -18, 0, -18, 0], 'easeInOut', [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]),
      undefined, girar([0, 0, -8, 0, 0], 'easeInOut'), undefined, undefined, undefined,
      girar([0, 15, 15, 0, 0], 'easeInOut', [0, 0.3, 0.6, 0.9, 1])] },
]);
// Paloma: capas = cola, ala superior, ala inferior, cuerpo, cabeza, pico, ojo.
const aleteo = paloma.capas.map(c => c.pistas);
const palomaV = conVariantes(paloma, 'Aletea', [
  { id: 'planea', nombre: 'Planea', durMs: 2000,
    grupo: [{ prop: 'y', t: T5, v: [0, -4, 0, 4, 0], e: 'easeInOut' }, { prop: 'x', t: T5, v: [0, 3, 0, -3, 0], e: 'easeInOut' }],
    pistas: [girar([0, -4, 0, 4, 0]),
      [{ prop: 'rotate', t: T5, v: [0, 2.5, 0, -2.5, 0], e: 'easeInOut' }, { prop: 'scaleY', t: T5, v: [1, 0.92, 1, 0.92, 1], e: 'easeInOut' }],
      [{ prop: 'rotate', t: T5, v: [0, -2.5, 0, 2.5, 0], e: 'easeInOut' }, { prop: 'scaleY', t: T5, v: [1, 0.92, 1, 0.92, 1], e: 'easeInOut' }],
      undefined, undefined, undefined, undefined] },
  { id: 'revolotea', nombre: 'Revolotea', durMs: 500,
    grupo: [{ prop: 'y', t: T5, v: [0, -5, 0, -5, 0], e: 'easeInOut' }],
    pistas: aleteo },
]);
// Pingüino (figura entera): camina, salta o se mece.
const pinguinoV = conVariantes(pinguino, 'Camina', [
  { id: 'salta', nombre: 'Salta', durMs: 1000,
    pistas: [[{ prop: 'y', t: T5, v: [0, -14, 0, -14, 0], e: 'easeInOut' }, { prop: 'scaleY', t: T5, v: [0.93, 1.04, 0.93, 1.04, 0.93], e: 'easeInOut' }]] },
  { id: 'mece', nombre: 'Se mece', durMs: 2000, pistas: [girar([0, 8, 0, -8, 0])] },
]);
// Flor (figura entera): se mece, gira o late.
const florV = conVariantes(flor, 'Se mece', [
  { id: 'gira', nombre: 'Gira', durMs: 8000, pistas: [[{ prop: 'rotate', t: [0, 1], v: [0, 360] }]] },
  { id: 'late', nombre: 'Late', durMs: 2000,
    pistas: [[{ prop: 'scaleX', t: T5, v: [1, 1.1, 1, 1.1, 1], e: 'easeInOut' }, { prop: 'scaleY', t: T5, v: [1, 1.1, 1, 1.1, 1], e: 'easeInOut' }]] },
]);

export const PIEZAS: Pieza[] = [pudu2, palomaV, sol, araucaria, pina, helecho, quisco, florV, pez, pinguinoV, cantaro, canasto, kisa];

export const pieza = (id: string) => PIEZAS.find(p => p.id === id)!;

// Fondo fijo: cielo y cordillera de C6 · Teatro de papel (la cordillera se mece 4 s).
export const FONDO: { dur: number; capas: Capa[] } = {
  dur: 4000,
  capas: [
    { src: A('fondo/cielo'), x: 0, y: 0 },
    { src: A('fondo/cordon-lejano'), x: -1.7, y: 0, pistas: [{ prop: 'x', t: [0, 0.5, 1], v: [0, -10, 0], e: 'easeInOut' }] },
    { src: A('fondo/cordon-cercano'), x: -6.6, y: 0, pistas: [{ prop: 'x', t: [0, 0.5, 1], v: [0, 16, 0], e: 'easeInOut' }] },
    { src: A('fondo/suelo'), x: 0, y: 0 },
  ],
};

// Fondos creados aquí con scripts/generar-fondos.py (bordes de papel recortado y el grano de los cordones de Figma).
// Mar: olas largas de período 80 que corren un período entero en 4 s y cierran sin salto.
export const FONDO_MAR: { dur: number; capas: Capa[] } = {
  dur: 4000,
  capas: [
    { src: A('mar/cielo'), x: 0, y: 0 },
    { src: A('mar/ola-lejana'), x: -80, y: 0, pistas: [{ prop: 'x', t: [0, 1], v: [0, 80] }] },
    { src: A('mar/ola-media'), x: -80, y: 0, pistas: [{ prop: 'x', t: [0, 1], v: [0, -80] }] },
    { src: A('mar/ola-cercana'), x: -80, y: 0, pistas: [{ prop: 'x', t: [0, 1], v: [0, 80] }] },
    { src: A('mar/crestas'), x: -80, y: 0, pistas: [{ prop: 'x', t: [0, 1], v: [0, 80] }] },
    { src: A('mar/playa'), x: -60, y: 0 },
    { src: A('mar/espuma'), x: -60, y: 0, pistas: [{ prop: 'y', t: T5, v: [0, -1.2, 0, 1.2, 0], e: 'easeInOut' }] },
  ],
};

// Desierto: dunas que se mecen apenas, como la cordillera de C6.
export const FONDO_DESIERTO: { dur: number; capas: Capa[] } = {
  dur: 4000,
  capas: [
    { src: A('desierto/cielo'), x: 0, y: 0 },
    { src: A('desierto/duna-lejana'), x: 0, y: 0, pistas: [{ prop: 'x', t: [0, 0.5, 1], v: [0, -5, 0], e: 'easeInOut' }] },
    { src: A('desierto/duna-media'), x: 0, y: 0, pistas: [{ prop: 'x', t: [0, 0.5, 1], v: [0, 8, 0], e: 'easeInOut' }] },
    { src: A('desierto/arena'), x: 0, y: 0 },
  ],
};
