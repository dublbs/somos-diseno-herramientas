// Sprites pixel de «Hora punta», generados aquí (generado: true; plan 009-juego-pixel). Paleta Línea azul y neutros.
// Cada sprite es una lista de filas; cada carácter es un color de PALETA ('.' = transparente).
export const PALETA: Record<string, string> = {
  k: '#000000', // negro (contorno)
  h: '#F4EEE3', // hueso
  a: '#0062B8', // azul
  l: '#2B4BD8', // lapislázuli
  c: '#7FC8F8', // celeste
  y: '#FFC20E', // amarillo
  v: '#00A651', // verde
  r: '#FF8FB1', // rosa
  m: '#7A2E8E', // morado
  g: '#8F8F8A', // gris (los Grises)
  G: '#6B6B66', // gris oscuro
  s: '#B9B9B3', // gris claro
  w: '#FFFFFF', // brillo
  t: '#7A5A3A', // madera
  T: '#4F3A25', // madera oscura
  d: '#2E7D46', // verde oscuro
};

const S = (filas: string[]) => filas;

// Auto visto desde arriba (2 celdas de largo = 16 × 8). El color de carrocería se reemplaza con 'B'.
export const AUTO = S([
  '..kkkkkkkkkkkk..',
  '.kBBBBBBBBBBBBk.',
  'kkBBccBBBBccBBkk',
  'kBBBccBBBBccBBBk',
  'kBBBccBBBBccBBBk',
  'kkBBccBBBBccBBkk',
  '.kBBBBBBBBBBBBk.',
  '..kkkkkkkkkkkk..',
]);

// Micro (3 celdas = 24 × 8): hueso con franja azul y ventanas.
export const MICRO = S([
  'kkkkkkkkkkkkkkkkkkkkkkkk',
  'khhhhhhhhhhhhhhhhhhhhhhk',
  'khccchccchccchccchccchck',
  'kaaaaaaaaaaaaaaaaaaaaaak',
  'kaaaaaaaaaaaaaaaaaaaaaak',
  'khccchccchccchccchccchck',
  'khhhhhhhhhhhhhhhhhhhhhhk',
  'kkkkkkkkkkkkkkkkkkkkkkkk',
]);

// Gris: la mancha que borra el color. Ojos que miran.
export const GRIS = S([
  '..kkkk..',
  '.kggggk.',
  'kgwkgwkk',
  'kgwkgwgk',
  'kggggggk',
  'kgGggGgk',
  '.kgGGgk.',
  '..kkkk..',
]);

// Bola de pintura con un Gris adentro (el color 'B' es la pintura).
export const BOLA = S([
  '..kkkk..',
  '.kBwwBk.',
  'kBwBBBBk',
  'kBBkBkBk',
  'kBBBBBBk',
  'kBBBBBBk',
  '.kBBBBk.',
  '..kkkk..',
]);

export const ARBOL = S([
  '..kkkk..',
  '.kvvvvk.',
  'kvvdvvvk',
  'kvdvvdvk',
  'kvvvvvvk',
  '.kvddvk.',
  '..kTTk..',
  '...kk...',
]);

export const BANCA = S([
  '........',
  'kkkkkkkk',
  'kttttttk',
  'kTTTTTTk',
  'kttttttk',
  'kkkkkkkk',
  '.k....k.',
  '.k....k.',
]);

// Contenedor de reciclaje (verde, con tapa y ranura): no se confunde con un auto visto desde arriba.
export const BASURERO = S([
  '........',
  '.kkkkkk.',
  'kddddddk',
  'kkkkkkkk',
  '.kvvvvk.',
  '.kvkkvk.',
  '.kvvvvk.',
  '.kkkkkk.',
]);

// Señal del metro (luz de aviso): 'B' parpadea en amarillo.
export const SENAL = S([
  '..kkkk..',
  '.kBBBBk.',
  '.kBwBBk.',
  '.kBBBBk.',
  '..kkkk..',
  '...kk...',
  '...kk...',
  '..kkkk..',
]);

// Dibuja un sprite en (x, y) con `tam` px por pixel. `reemplazo` cambia el color 'B'.
const cache = new Map<string, HTMLCanvasElement>();
export function sprite(ctx: CanvasRenderingContext2D, filas: string[], x: number, y: number, ancho: number, alto: number, reemplazo = '#FF8FB1', espejo = false) {
  const clave = filas.join('|') + reemplazo + espejo;
  let c = cache.get(clave);
  if (!c) {
    c = document.createElement('canvas');
    c.width = filas[0].length; c.height = filas.length;
    const x2 = c.getContext('2d')!;
    filas.forEach((f, j) => [...f].forEach((ch, i) => {
      if (ch === '.') return;
      x2.fillStyle = ch === 'B' ? reemplazo : PALETA[ch];
      x2.fillRect(espejo ? f.length - 1 - i : i, j, 1, 1);
    }));
    cache.set(clave, c);
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(c, Math.round(x), Math.round(y), Math.round(ancho), Math.round(alto));
}
