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

// Lata de pintura (vista de frente): 'B' es el color de la pintura.
export const LATA = S([
  '.kkkkkk.',
  'kssssssk',
  'kBBBBBBk',
  'kBwBBBBk',
  'kBwBBBBk',
  'kBBBBBBk',
  'kssssssk',
  '.kkkkkk.',
]);

// Gris de lado (nivel 2): el mismo Gris, caminando. Mira a la derecha.
export const GRIS_LADO = S([
  '..kkkk..',
  '.kggggk.',
  'kgggwkwk',
  'kgggwkwk',
  'kggggggk',
  'kgGggGgk',
  '.kgkkgk.',
  '.kk..kk.',
]);

// Piezas del mural (7 × 7): formas pixel en el color con que se atrapó al Gris ('B').
export const PIEZAS: Record<'corazon' | 'estrella' | 'rayo' | 'gota', string[]> = {
  corazon: S([
    '.kk.kk.',
    'kBBkBBk',
    'kBwBBBk',
    'kBBBBBk',
    '.kBBBk.',
    '..kBk..',
    '...k...',
  ]),
  estrella: S([
    '...k...',
    '..kBk..',
    'kkkBkkk',
    'kBBwBBk',
    '.kBBBk.',
    'kBk.kBk',
    'kk...kk',
  ]),
  rayo: S([
    '...kkk.',
    '..kBBk.',
    '.kBwk..',
    'kBBBBBk',
    '..kBBk.',
    '.kBk...',
    '.kk....',
  ]),
  gota: S([
    '...k...',
    '..kBk..',
    '.kBBBk.',
    'kBwBBBk',
    'kBwBBBk',
    'kBBBBBk',
    '.kkkkk.',
  ]),
};

// Trofeo (8 × 8): va en la primera casilla del mural si venciste al Inacapín Pixel.
export const TROFEO = S([
  'kkkkkkkk',
  'kyywyyyk',
  'kyywyyyk',
  '.kyyyyk.',
  '..kyyk..',
  '...kk...',
  '..kyyk..',
  '.kkkkkk.',
]);

// El Inacapín Pixel (16 × 16), diseño propuesto, a validar: personaje original de la familia del personaje Pixel
// (antenas, ojos cuadrados, cuerpo de bloque), sin logo ni colores de INACAP. Los dígitos son las partes que recuperan
// color: 1 antenas, 2 cabeza, 3 cara, 4 brazos, 5 panza, 6 pies. 'o' es la boca (se abre cuando ataca).
export const INACAPIN = S([
  '..kk........kk..',
  '..k11k....k11k..',
  '...kk1k..k1kk...',
  '....kkkkkkkk....',
  '..kk22222222kk..',
  '.k222222222222k.',
  '.k2wwwk22wwwk2k.',
  '.k2wwkk22wwkk2k.',
  '.k333333333333k.',
  '.k33kkkkkkkk33k.',
  'kk33kookkook33kk',
  'k44k33333333k44k',
  'k44k55555555k44k',
  '.kkk55555555kkk.',
  '...k666kk666k...',
  '...kkkkkkkkkk...',
]);
