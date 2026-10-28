// Biblioteca de partes en grilla de 24 × 24.
// Cada parte es una lista de tramos [fila, xDesde, xHasta, zona].
// Zonas:
//   s = piel (color de la cabeza)       p = color propio de la característica
//   d = detalle de la característica    h = color del pelo (bigotes)
//   k = tinta (Negro)
// Son partes provisionales: se reemplazan por las dibujadas en Figma con el mismo formato.

export type Zona = 's' | 'p' | 'd' | 'h' | 'k';
export type Tramo = [number, number, number, Zona];
export interface Parte { id: string; nombre: string; tramos: Tramo[]; cerrados?: Tramo[]; lenguaje?: string | null }
export type IdRanura = 'cabeza' | 'ojos' | 'boca' | 'mejillas' | 'pelo' | 'torso' | 'accesorio';

const sym = (y: number, w: number, z: Zona = "s"): Tramo => [y, 12 - w, 11 + w, z]; // centrado entre las columnas 11 y 12
const run = (y: number, x0: number, x1: number, z: Zona = "s"): Tramo => [y, x0, x1, z];
const px = (x: number, y: number, z: Zona = "p"): Tramo => [y, x, x, z];
const filas = (y0: number, y1: number, w: number, z: Zona = "s"): Tramo[] => Array.from({ length: y1 - y0 + 1 }, (_, i) => sym(y0 + i, w, z));
const rect = (x0: number, y0: number, x1: number, y1: number, z: Zona = "p"): Tramo[] => Array.from({ length: y1 - y0 + 1 }, (_, i) => [y0 + i, x0, x1, z]);
const marco = (x0: number, y0: number, x1: number, y1: number, z: Zona = "p"): Tramo[] => [
  [y0, x0, x1, z], [y1, x0, x1, z],
  ...Array.from({ length: y1 - y0 - 1 }, (_, i): Tramo[] => [[y0 + 1 + i, x0, x0, z], [y0 + 1 + i, x1, x1, z]]).flat(),
];

const redonda: Tramo[] = [sym(4, 3), sym(5, 5), sym(6, 6), ...filas(7, 13, 7), sym(14, 6), sym(15, 5), sym(16, 3), sym(17, 2)];
const cuadrada: Tramo[] = [sym(4, 5), ...filas(5, 14, 6), sym(15, 5), sym(16, 2), sym(17, 2)];
const cerradosBase = [run(10, 8, 9, "p"), run(10, 14, 15, "p")];
const poleraBase = [sym(18, 6, "p"), ...filas(19, 23, 8, "p")];
const cuerpoBase = [sym(18, 7, "p"), ...filas(19, 23, 9, "p")];

export const PARTES: Record<IdRanura, Parte[]> = {
  cabeza: [
    { id: "redonda", nombre: "Redonda", tramos: redonda },
    { id: "cuadrada", nombre: "Cuadrada", tramos: cuadrada },
    { id: "alta", nombre: "Alta", tramos: [sym(3, 3), sym(4, 4), ...filas(5, 13, 5), sym(14, 4), sym(15, 3), sym(16, 2), sym(17, 2)] },
    { id: "ancha", nombre: "Ancha", tramos: [sym(5, 6), ...filas(6, 13, 8), sym(14, 7), sym(15, 5), sym(16, 2), sym(17, 2)] },
    { id: "gota", nombre: "Gota", tramos: [sym(2, 1), sym(3, 2), sym(4, 3), sym(5, 4), sym(6, 5), sym(7, 6), ...filas(8, 13, 7), sym(14, 6), sym(15, 5), sym(16, 3), sym(17, 2)] },
    {
      id: "criatura", nombre: "Con orejas",
      tramos: [...redonda, run(1, 5, 6), run(2, 5, 7), run(3, 6, 8), run(4, 7, 8), run(1, 17, 18), run(2, 16, 18), run(3, 15, 17), run(4, 15, 16)],
    },
    { id: "antena", nombre: "Con antena", tramos: [...cuadrada, ...rect(11, 1, 12, 3, "s"), run(0, 10, 13, "k")] },
  ],
  ojos: [
    { id: "puntos", nombre: "Puntos", tramos: [...rect(8, 9, 9, 10), ...rect(14, 9, 15, 10)], cerrados: cerradosBase },
    { id: "grandes", nombre: "Grandes", tramos: [...rect(8, 8, 9, 10), ...rect(14, 8, 15, 10)], cerrados: cerradosBase },
    { id: "alargados", nombre: "Alargados", tramos: [...rect(8, 8, 9, 11), ...rect(14, 8, 15, 11)], cerrados: cerradosBase },
    {
      id: "felices", nombre: "Felices",
      tramos: [px(8, 10), px(9, 9), px(10, 10), px(13, 10), px(14, 9), px(15, 10)],
      cerrados: [run(10, 8, 10, "p"), run(10, 13, 15, "p")],
    },
    { id: "guino", nombre: "Guiño", tramos: [...rect(8, 9, 9, 10), run(10, 13, 15, "p")], cerrados: [run(10, 8, 9, "p"), run(10, 13, 15, "p")] },
    { id: "ciclope", nombre: "Un solo ojo", tramos: rect(10, 8, 13, 11), cerrados: [run(10, 10, 13, "p")] },
    {
      id: "lentes", nombre: "Lentes",
      tramos: [...marco(6, 8, 10, 11), ...marco(13, 8, 17, 11), run(9, 11, 12, "p"), px(8, 10), px(15, 10)],
      cerrados: [...marco(6, 8, 10, 11), ...marco(13, 8, 17, 11), run(9, 11, 12, "p"), run(10, 7, 9, "p"), run(10, 14, 16, "p")],
    },
  ],
  boca: [
    { id: "sonrisa", nombre: "Sonrisa", tramos: [px(9, 12), px(14, 12), run(13, 10, 13, "p")] },
    { id: "recta", nombre: "Recta", tramos: [run(13, 10, 13, "p")] },
    { id: "triste", nombre: "Triste", tramos: [run(12, 10, 13, "p"), px(9, 13), px(14, 13)] },
    { id: "o", nombre: "Sorpresa", tramos: rect(11, 12, 12, 13) },
    { id: "gato", nombre: "Gatuna", tramos: [px(9, 12), px(10, 13), px(11, 12), px(12, 12), px(13, 13), px(14, 12)] },
    { id: "bigote", nombre: "Con bigote", tramos: [run(11, 9, 14, "h"), px(8, 12, "h"), px(15, 12, "h"), run(13, 10, 13, "p")] },
  ],
  mejillas: [
    { id: "ninguna", nombre: "Sin mejillas", tramos: [] },
    { id: "rubor", nombre: "Rubor", tramos: [run(11, 6, 7, "p"), run(11, 16, 17, "p")] },
    { id: "pecas", nombre: "Pecas", tramos: [px(7, 11), px(9, 12), px(6, 12), px(14, 12), px(16, 11), px(17, 12)] },
    { id: "rayas", nombre: "Bigotes de gato", tramos: [run(11, 5, 7, "p"), run(13, 5, 7, "p"), run(11, 16, 18, "p"), run(13, 16, 18, "p")] },
  ],
  pelo: [
    { id: "ninguno", nombre: "Sin pelo", tramos: [] },
    { id: "corto", nombre: "Corto", tramos: [sym(3, 4, "p"), sym(4, 6, "p"), sym(5, 7, "p"), run(6, 5, 13, "p"), run(6, 16, 18, "p"), run(7, 5, 6, "p"), run(7, 17, 18, "p")] },
    {
      id: "melena", nombre: "Melena",
      tramos: [sym(2, 5, "p"), sym(3, 7, "p"), sym(4, 8, "p"), sym(5, 8, "p"), run(6, 3, 20, "p"), ...[7, 8, 9, 10, 11, 12, 13, 14, 15].flatMap((y) => [run(y, 3, 5, "p"), run(y, 18, 20, "p")])],
    },
    {
      id: "afro", nombre: "Afro",
      tramos: [sym(1, 4, "p"), sym(2, 6, "p"), sym(3, 8, "p"), ...filas(4, 7, 9, "p"), ...[8, 9, 10, 11, 12].flatMap((y) => [run(y, 3, 5, "p"), run(y, 18, 20, "p")])],
    },
    { id: "mono", nombre: "Moño", tramos: [...rect(10, 0, 13, 2), run(3, 10, 13, "d"), sym(4, 7, "p"), sym(5, 7, "p"), run(6, 5, 6, "p"), run(6, 17, 18, "p")] },
    { id: "mohicano", nombre: "Mohicano", tramos: [...rect(10, 0, 13, 6)] },
    { id: "jockey", nombre: "Jockey", tramos: [sym(2, 4, "p"), sym(3, 6, "p"), sym(4, 6, "p"), sym(5, 7, "p"), run(6, 5, 21, "p"), run(4, 11, 12, "d")] },
    { id: "gorro", nombre: "Gorro de lana", tramos: [run(0, 11, 12, "d"), run(1, 10, 13, "d"), sym(2, 4, "p"), sym(3, 6, "p"), sym(4, 7, "p"), sym(5, 7, "p"), sym(6, 8, "d")] },
  ],
  torso: [
    { id: "polera", nombre: "Polera", tramos: [...poleraBase, run(18, 10, 13, "s"), run(19, 11, 12, "s")] },
    { id: "rayas", nombre: "Polera a rayas", tramos: [...poleraBase, run(18, 10, 13, "s"), run(19, 11, 12, "s"), run(20, 4, 19, "d"), run(22, 4, 19, "d")] },
    { id: "camisa", nombre: "Camisa y corbata", tramos: [...poleraBase, run(18, 9, 10, "d"), run(18, 13, 14, "d"), run(18, 11, 12, "s"), ...rect(11, 19, 12, 22, "d"), run(23, 10, 13, "d")] },
    {
      id: "poleron", nombre: "Polerón con capucha",
      tramos: [sym(15, 7, "p"), sym(16, 7, "p"), sym(17, 6, "p"), sym(18, 8, "p"), ...filas(19, 23, 9, "p"), ...[19, 20, 21].flatMap((y) => [px(10, y, "d"), px(13, y, "d")])],
    },
    { id: "chaqueta", nombre: "Chaqueta", tramos: [...cuerpoBase, ...[18, 19, 20, 21, 22, 23].map((y) => run(y, 10, 13, "d"))] },
    { id: "delantal", nombre: "Delantal de taller", tramos: [...cuerpoBase, ...rect(9, 20, 14, 23, "d"), px(9, 18, "d"), px(9, 19, "d"), px(14, 18, "d"), px(14, 19, "d")] },
  ],
  accesorio: [
    { id: "ninguno", nombre: "Sin accesorio", lenguaje: null, tramos: [] },
    { id: "zigzag", nombre: "Collar en zigzag", lenguaje: "Geométrica", tramos: [...[8, 10, 12, 14].map((x) => px(x, 18)), ...[9, 11, 13, 15].map((x) => px(x, 19))] },
    { id: "aro", nombre: "Aro triangular", lenguaje: "Geométrica", tramos: [px(4, 11, "k"), px(4, 12), run(13, 3, 5, "p"), run(14, 2, 6, "p")] },
    { id: "lapiz", nombre: "Lápiz en la oreja", lenguaje: "Geométrica", tramos: [px(20, 4), px(19, 5), px(18, 6), px(17, 7), px(16, 8, "k")] },
    { id: "flor", nombre: "Flor en el pelo", lenguaje: "Orgánica", tramos: [px(17, 3), px(16, 4), px(18, 4), px(17, 5), px(17, 4, "k")] },
    { id: "hoja", nombre: "Hoja en el pelo", lenguaje: "Orgánica", tramos: [px(5, 2), px(6, 2), px(5, 3), px(6, 3), px(7, 3), px(6, 4), px(7, 4), px(8, 5, "k")] },
    { id: "bufanda", nombre: "Bufanda", lenguaje: "Orgánica", tramos: [sym(16, 6, "p"), sym(17, 6, "p"), run(18, 14, 16, "p"), run(19, 15, 16, "p"), run(20, 15, 16, "p")] },
    {
      id: "audifonos", nombre: "Audífonos", lenguaje: "Pixel",
      tramos: [run(2, 8, 15, "k"), px(7, 3, "k"), px(16, 3, "k"), px(6, 4, "k"), px(17, 4, "k"), ...rect(5, 5, 5, 7, "k"), ...rect(18, 5, 18, 7, "k"), ...rect(3, 8, 5, 12), ...rect(18, 8, 20, 12)],
    },
    {
      id: "lentes-sol", nombre: "Lentes de sol", lenguaje: "Pixel",
      tramos: [run(9, 6, 17, "k"), run(10, 7, 10, "k"), run(10, 13, 16, "k"), run(11, 8, 9, "k"), run(11, 14, 15, "k"), px(8, 10), px(14, 10)],
    },
    { id: "cadena", nombre: "Cadena", lenguaje: "Pixel", tramos: [px(8, 18), px(15, 18), run(19, 9, 14, "p"), ...rect(11, 20, 12, 21)] },
  ],
};

// Boca para el cuadro "habla" de la animación (los bigotes se mantienen).
export const BOCA_ABIERTA: Tramo[] = [run(12, 10, 13, "p"), px(10, 13), px(13, 13), run(14, 10, 13, "p")];

// Características en el orden en que se eligen, con los colores que controla cada una.
// detalle: true → la característica tiene un segundo color para las partes con zona "d".
export interface Ranura {
  id: IdRanura; nombre: string;
  colores: { id: string; nombre: string; soloSi?: Zona }[];
  recorte: { x: number; y: number; w: number } | null;
}
export const RANURAS: Ranura[] = [
  { id: "cabeza", nombre: "Cabeza", colores: [{ id: "cabeza", nombre: "Piel" }], recorte: null },
  { id: "ojos", nombre: "Ojos", colores: [{ id: "ojos", nombre: "Color" }], recorte: { x: 4, y: 5, w: 16 } },
  { id: "boca", nombre: "Boca", colores: [{ id: "boca", nombre: "Color" }], recorte: { x: 4, y: 5, w: 16 } },
  { id: "mejillas", nombre: "Mejillas", colores: [{ id: "mejillas", nombre: "Color" }], recorte: { x: 4, y: 5, w: 16 } },
  { id: "pelo", nombre: "Pelo o gorro", colores: [{ id: "pelo", nombre: "Color" }, { id: "peloDetalle", nombre: "Detalle", soloSi: "d" }], recorte: null },
  { id: "torso", nombre: "Ropa", colores: [{ id: "ropa", nombre: "Color" }, { id: "ropaDetalle", nombre: "Detalle", soloSi: "d" }], recorte: { x: 2, y: 4, w: 20 } },
  { id: "accesorio", nombre: "Accesorio", colores: [{ id: "accesorio", nombre: "Color" }], recorte: null },
];
