// Formas base de Geométrica, dibujadas sobre una celda de 12 × 12 unidades.
// Cada forma es una lista de capas [trazo SVG, ranura de color]:
//   "a" = figura · "b" = segundo color de figura. El fondo de la celda es la ranura "f".
export const U = 12;

export interface Capa {
  d: string;
  ranura: 'a' | 'b';
}

export interface FormaDef {
  id: string;
  nombre: string;
  nota: string;
  capas: [string, 'a' | 'b'][];
}

export const FORMAS: FormaDef[] = [
  { id: "vacia", nombre: "Celda vacía", nota: "Solo fondo", capas: [] },
  { id: "llena", nombre: "Celda llena", nota: "Color sólido", capas: [["M0 0H12V12H0Z", "a"]] },
  { id: "media", nombre: "Media celda", nota: "Triángulo diagonal", capas: [["M0 0H12L0 12Z", "a"]] },
  { id: "mitad", nombre: "Mitad", nota: "Banda media", capas: [["M0 0H12V6H0Z", "a"]] },
  { id: "damero", nombre: "Damero", nota: "Cuadrícula 2×2", capas: [["M0 0H6V6H0Z M6 6H12V12H6Z", "a"]] },
  { id: "listas", nombre: "Líneas k'isa", nota: "Franjas rítmicas", capas: [["M0 0H12V2H0Z M0 8H12V10H0Z", "a"], ["M0 4H12V6H0Z", "b"]] },
  { id: "greca", nombre: "Greca", nota: "Línea continua", capas: [["M0 0H12V2H0Z M10 0H12V12H10Z M2 10H12V12H2Z M2 4H4V12H2Z M2 4H8V6H2Z M6 4H8V8H6Z", "a"]] },
  { id: "escalon", nombre: "Escalón", nota: "Escalinata", capas: [["M0 12V8H4V4H8V0H12V12Z", "a"]] },
  { id: "punta", nombre: "Punta", nota: "Triángulo isósceles", capas: [["M0 12L6 0L12 12Z", "a"]] },
  { id: "cuarto", nombre: "Cuarto de círculo", nota: "Curva suave", capas: [["M0 0H12A12 12 0 0 1 0 12Z", "a"]] },
  { id: "anillo", nombre: "Cuarto de anillo", nota: "Arco concéntrico", capas: [["M6 0H12A12 12 0 0 1 0 12V6A6 6 0 0 0 6 0Z", "a"]] },
  { id: "semicirculo", nombre: "Medio círculo", nota: "Arco completo", capas: [["M0 12A6 6 0 0 1 12 12Z", "a"]] },
  { id: "marco", nombre: "Marco", nota: "Borde y centro", capas: [["M0 0H12V12H0Z M3 3V9H9V3Z", "a"], ["M4.5 4.5H7.5V7.5H4.5Z", "b"]] },
  { id: "inclinado", nombre: "Inclinado", nota: "Paralelogramo", capas: [["M4 0H12L8 12H0Z", "a"]] },
  { id: "rombo", nombre: "Rombo", nota: "Diamante concéntrico", capas: [["M6 0L12 6L6 12L0 6Z", "a"], ["M6 3.5L8.5 6L6 8.5L3.5 6Z", "b"]] },
  { id: "muesca", nombre: "Barra con muesca", nota: "Columna escalonada", capas: [["M3 0H9V3H7.5V9H9V12H3V9H4.5V3H3Z", "a"]] },
  { id: "cruz", nombre: "Cruz escalonada", nota: "Chakana / Cruz andina", capas: [["M4 0H8V2H10V4H12V8H10V10H8V12H4V10H2V8H0V4H2V2H4Z", "a"], ["M5 5H7V7H5Z", "b"]] },
  { id: "punto", nombre: "Punto", nota: "Círculo centrado", capas: [["M2 6a4 4 0 1 0 8 0a4 4 0 1 0 -8 0Z", "a"]] },
];

export const forma = (id: string): FormaDef => FORMAS.find((f) => f.id === id) || FORMAS[0];
export const usaB = (id: string): boolean => forma(id).capas.some((c) => c[1] === "b");
export const usaA = (id: string): boolean => forma(id).capas.some((c) => c[1] === "a");

// Transformación de la celda: giro r (0–3, en pasos de 90°) y espejo e (horizontal), aplicado antes del giro.
export interface Transf {
  r: number;
  e: boolean;
}
export const reflejarH = ({ r, e }: Transf): Transf => ({ r: (4 - r) % 4, e: !e });
export const reflejarV = ({ r, e }: Transf): Transf => ({ r: (6 - r) % 4, e: !e });
export const girar = ({ r, e }: Transf, n = 1): Transf => ({ r: (r + n) % 4, e });

// ---------- paleta Línea azul ----------
export const HEX: Record<string, string> = {
  Hueso: "#F4EEE3",
  Blanco: "#FFFFFF",
  Negro: "#000000",
  Azul: "#0062B8",
  "Lapislázuli": "#2B4BD8",
  Celeste: "#7FC8F8",
  Amarillo: "#FFC20E",
  Verde: "#00A651",
  Rosa: "#FF8FB1",
  Morado: "#7A2E8E",
};
export const COLORES = Object.keys(HEX);
export const MAX_COLORES = 4; // regla 3: un fondo y hasta tres colores de figura

// ---------- formatos (en celdas) ----------
export interface Formato {
  id: string;
  nombre: string;
  cols: number;
  filas: number;
  celda: number;
}

export const FORMATOS: Formato[] = [
  { id: "cuadrado", nombre: "Cuadrado · 1:1", cols: 8, filas: 8, celda: 135 },
  { id: "flyer", nombre: "Flyer / Afiche · 4:5", cols: 8, filas: 10, celda: 135 },
  { id: "historia", nombre: "Historia · 9:16", cols: 9, filas: 16, celda: 120 },
  { id: "horizontal", nombre: "Horizontal · 16:9", cols: 16, filas: 9, celda: 120 },
  { id: "modulo4", nombre: "Módulo 4 × 4", cols: 4, filas: 4, celda: 270 },
  { id: "modulo2", nombre: "Módulo 2 × 2", cols: 2, filas: 2, celda: 540 },
];


export interface PaletaDef {
  id: string;
  nombre: string;
  f: string;
  a: string;
  b: string;
}

export const PALETAS: PaletaDef[] = [
  { id: "clasica", nombre: "Línea Azul", f: "Hueso", a: "Azul", b: "Amarillo" },
  { id: "lapis", nombre: "Lapislázuli", f: "Hueso", a: "Lapislázuli", b: "Rosa" },
  { id: "mar", nombre: "Azul & Celeste", f: "Azul", a: "Celeste", b: "Blanco" },
  { id: "morado", nombre: "Morado & Amarillo", f: "Morado", a: "Amarillo", b: "Rosa" },
  { id: "verde", nombre: "Verde & Azul", f: "Hueso", a: "Verde", b: "Azul" },
  { id: "contraste", nombre: "Negro & Amarillo", f: "Negro", a: "Amarillo", b: "Blanco" },
  { id: "rosa", nombre: "Rosa Pop", f: "Rosa", a: "Lapislázuli", b: "Hueso" },
  { id: "monocromo", nombre: "Monocromo", f: "Hueso", a: "Negro", b: "Azul" },
];

export interface ColoresCelda {
  f: string;
  a: string;
  b: string;
}

export interface Celda {
  f: string;
  r: number;
  e: boolean;
  c: ColoresCelda;
}

export interface Pincel {
  id: string;
  r: number;
  e: boolean;
  c: ColoresCelda;
}

