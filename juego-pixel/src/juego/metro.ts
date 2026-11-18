// El metro de la Línea 1 en pixel (generado: true), con el estilo del tren de la web (referencia de Amaro, 18 nov):
// contorno negro grueso, carro hueso, franja roja y morada, ventanas moradas con brillo celeste en la esquina, puertas
// dobles, luces amarillas en el techo y bogies grises. Lo usan el cruce (costado y trompa) y el fondo del andén.
const ANCHO = 64, ALTO = 24;
let carro: HTMLCanvasElement | null = null, trompa: HTMLCanvasElement | null = null;

const C = { k: '#000000', h: '#F4EEE3', b: '#E2D9C9', B: '#C9BFAE', r: '#E2001A', R: '#A80013', m: '#7A2E8E', v: '#3B1748', V: '#5A2370', c: '#7FC8F8', y: '#FFC20E', g: '#8F8F8A', G: '#5A5A55', s: '#B9B9B3' };

function nuevo(w: number, h: number) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// Costado de un carro: 64 × 24 px (la caja va de la fila 2 a la 19; abajo, los bogies).
export function lienzoCarro(): HTMLCanvasElement {
  if (carro) return carro;
  carro = nuevo(ANCHO, ALTO);
  const x = carro.getContext('2d')!;
  const r = (col: string, a: number, b: number, w: number, h: number) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  // luces del techo
  for (const lx of [13, 47]) { r(C.k, lx - 1, 0, 6, 2); r(C.y, lx, 0, 4, 1); }
  // caja
  r(C.k, 1, 2, ANCHO - 2, 18); r(C.k, 0, 3, ANCHO, 16);
  r(C.h, 2, 3, ANCHO - 4, 16); r(C.b, 2, 3, ANCHO - 4, 1);
  // franjas: roja (con sombra) y morada
  r(C.r, 2, 12, ANCHO - 4, 2); r(C.R, 2, 14, ANCHO - 4, 1); r(C.m, 2, 16, ANCHO - 4, 1);
  r(C.b, 2, 17, ANCHO - 4, 2);
  // ventanas
  const ventana = (a: number, w: number) => { r(C.k, a - 1, 4, w + 2, 7); r(C.v, a, 5, w, 5); r(C.V, a, 9, w, 1); r(C.c, a, 5, 2, 1); r(C.c, a, 6, 1, 1); };
  for (const a of [4, 23, 31, 39, 58]) ventana(a, a === 4 || a === 58 ? 3 : 6);
  // puertas dobles
  const puerta = (a: number) => {
    r(C.k, a, 3, 10, 16); r(C.h, a + 1, 4, 8, 15);
    r(C.k, a + 5 - 1, 4, 1, 15);
    for (const p of [a + 1, a + 5]) { r(C.k, p, 5, 4, 5); r(C.v, p + 1, 6, 2, 3); r(C.c, p + 1, 6, 1, 1); }
    r(C.r, a + 1, 12, 8, 2); r(C.R, a + 1, 14, 8, 1); r(C.m, a + 1, 16, 8, 1);
  };
  puerta(11); puerta(45);
  // bogies
  for (const a of [5, 43]) { r(C.k, a, 19, 16, 3); r(C.g, a + 1, 19, 14, 2); r(C.k, a + 2, 21, 4, 3); r(C.k, a + 10, 21, 4, 3); r(C.G, a + 3, 21, 2, 2); r(C.G, a + 11, 21, 2, 2); }
  return carro;
}

// Trompa del carro que va adelante (frente de la L1): 20 × 24 px. Parabrisas negro, letrero «L1», focos y panel rojo.
export function lienzoTrompa(): HTMLCanvasElement {
  if (trompa) return trompa;
  trompa = nuevo(20, ALTO);
  const x = trompa.getContext('2d')!;
  const r = (col: string, a: number, b: number, w: number, h: number) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  r(C.k, 0, 2, 20, 18); r(C.h, 1, 3, 18, 16);
  r(C.k, 2, 4, 16, 8); r('#1E1C19', 3, 5, 14, 6); r(C.c, 3, 5, 3, 1); r(C.c, 3, 6, 1, 1);
  r(C.y, 4, 5, 7, 1); r(C.r, 13, 5, 3, 1); // letrero de destino y número
  r(C.r, 1, 13, 18, 2); r(C.R, 1, 15, 18, 1);
  r(C.k, 3, 16, 3, 2); r('#FFF6C9', 3, 16, 2, 1); r(C.k, 14, 16, 3, 2); r('#FFF6C9', 15, 16, 2, 1);
  r(C.b, 1, 17, 18, 2);
  r(C.k, 7, 19, 6, 4); r(C.g, 8, 19, 4, 2);
  return trompa;
}
