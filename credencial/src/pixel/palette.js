// Paleta Línea azul — valores tomados de las variables del archivo Somos Diseño.
export const LINEA = [
  { nombre: "Hueso", hex: "#F4EEE3" },
  { nombre: "Blanco", hex: "#FFFFFF" },
  { nombre: "Negro", hex: "#000000" },
  { nombre: "Azul", hex: "#0062B8" },
  { nombre: "Lapislázuli", hex: "#2B4BD8" },
  { nombre: "Celeste", hex: "#7FC8F8" },
  { nombre: "Amarillo", hex: "#FFC20E" },
  { nombre: "Verde", hex: "#00A651" },
  { nombre: "Rosa", hex: "#FF8FB1" },
  { nombre: "Morado", hex: "#7A2E8E" },
];

export const HEX = Object.fromEntries(LINEA.map((c) => [c.nombre, c.hex]));

// Fondo de la celda y tinta del contorno (regla 3: contorno solo por fuera).
export const FONDO = "Hueso";
export const TINTA = "Negro";

// Colores que puede tomar cada característica. Hueso queda reservado para el fondo de la celda.
export const COLORES_FIGURA = ["Blanco", "Azul", "Lapislázuli", "Celeste", "Amarillo", "Verde", "Rosa", "Morado"];
export const COLORES_ELEGIBLES = [...COLORES_FIGURA, "Negro"];
// La piel no puede ser Negro: se perdería contra el contorno.
export const COLORES_PIEL = COLORES_FIGURA;
// Tonos claros que usa el azar para la piel, así los ojos en Negro se leen.
export const COLORES_PIEL_CLAROS = ["Blanco", "Celeste", "Amarillo", "Verde", "Rosa"];
export const MAX_COLORES = 4;

const lin = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
export function luminancia(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
export function contraste(a, b) {
  const x = luminancia(a), y = luminancia(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
