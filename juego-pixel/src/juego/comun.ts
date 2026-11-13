// Lo que comparten los niveles de «Hora punta»: azar con semilla, colores de pintura, piezas del mural y la partida.
export const PINTURAS = ['#FF8FB1', '#FFC20E', '#7FC8F8', '#00A651', '#7A2E8E']; // Rosa, Amarillo, Celeste, Verde, Morado
export const HUESO = '#F4EEE3';
export const NOMBRE_PINTURA: Record<string, string> = {
  '#FF8FB1': 'Rosa', '#FFC20E': 'Amarillo', '#7FC8F8': 'Celeste', '#00A651': 'Verde', '#7A2E8E': 'Morado', [HUESO]: 'Hueso',
};
export type Forma = 'corazon' | 'estrella' | 'rayo' | 'gota';
export const FORMAS: Forma[] = ['corazon', 'estrella', 'rayo', 'gota'];
export interface Pieza { color: string; forma: Forma }
export interface Aviso { texto: string; x: number; y: number; t: number }

// Generador pseudoaleatorio con semilla (mulberry32): el tablero no cambia al redibujar.
export function azar(e: { semilla: number }) {
  e.semilla = (e.semilla + 0x6D2B79F5) | 0;
  let t = e.semilla;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const entre = (e: { semilla: number }, a: number, b: number) => a + azar(e) * (b - a);
export const elegir = <T,>(e: { semilla: number }, l: T[]) => l[Math.floor(azar(e) * l.length)];

// Cada lata son TIROS_POR_LATA tiros de su color en el nivel 2.
export const TIROS_POR_LATA = 5;
