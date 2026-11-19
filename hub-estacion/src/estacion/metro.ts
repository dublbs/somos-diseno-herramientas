// Metro del andén en Pixel detallado (P-002), dibujado por código a partir de la referencia
// docs/equipo/referencias/metro-web-pixel.png: carro hueso con franja roja y línea morada, ventanas moradas con
// brillo celeste, puertas dobles cerradas (se abren del lado del andén que no se ve), techo con equipos y bogies.
// Cada carro se pinta una vez a 1 px por celda en un lienzo chico y la escena lo escala sin suavizado.

export const FILAS = 32; // alto del carro en celdas (incluye equipos del techo y ruedas)

const COL = {
  negro: '#000000', hueso: '#F4EEE3', techo: '#D8CFBF', sombra: '#E6DDCD', beige: '#D9CDB7', bajo: '#BFB29A',
  rojo: '#E2001A', rojoOscuro: '#A80014', morado: '#7A2E8E', vidrio: '#3F1650', vidrioBajo: '#5B2370', celeste: '#7FC8F8',
  pasajero: '#26092F', gris: '#6B6B6B', grisClaro: '#9C968B', grisOscuro: '#2E2E2E', amarillo: '#FFC20E', rosa: '#FF8FB1',
};

export interface OpcionesCarro { frente: boolean; cola: boolean; semilla: number }

const hechos = new Map<string, HTMLCanvasElement>();

// Un carro de `n` celdas de ancho. El frente (cabina) mira a la izquierda, hacia donde va el tren.
export function carro(n: number, o: OpcionesCarro): HTMLCanvasElement {
  n = Math.max(40, Math.round(n));
  const llave = `${n}|${o.frente ? 1 : 0}${o.cola ? 1 : 0}|${o.semilla}`;
  const hecho = hechos.get(llave);
  if (hecho) return hecho;
  const c = document.createElement('canvas');
  c.width = n; c.height = FILAS;
  const x = c.getContext('2d')!;
  const r = (cx: number, cy: number, w: number, h: number, color: string) => { x.fillStyle = color; x.fillRect(cx, cy, w, h); };
  let s = o.semilla * 7919 + 13;
  const azar = () => ((s = (s * 9301 + 49297) % 233280) / 233280);

  const TOPE = 3, FONDO = 23; // filas del borde superior e inferior de la caja
  // Silueta: el frente lleva la trompa en escalera arriba a la izquierda.
  const inicio = (f: number) => (o.frente && f < TOPE + 6 ? TOPE + 6 - f : 0);

  // equipos del techo (cajas grises) y faroles amarillos, como en la referencia
  for (const k of [0.3, 0.68]) {
    const bx = Math.round(n * k) - 6;
    r(bx, 0, 12, 3, COL.negro); r(bx + 1, 1, 10, 2, COL.grisClaro); r(bx + 2, 1, 2, 1, COL.hueso); r(bx + 6, 1, 2, 1, COL.hueso);
  }
  r(Math.round(n * 0.12), 1, 4, 2, COL.negro); r(Math.round(n * 0.12) + 1, 2, 2, 1, COL.amarillo);

  // caja del carro, fila por fila
  for (let f = TOPE; f <= FONDO; f++) {
    const a = inicio(f), fin = n - 1;
    let color = COL.hueso;
    if (f === TOPE || f === FONDO) color = COL.negro;
    else if (f === TOPE + 1) color = COL.techo;
    else if (f === TOPE + 2) color = COL.sombra;
    else if (f >= 15 && f <= 17) color = f === 17 ? COL.rojoOscuro : COL.rojo;
    else if (f === 19) color = COL.morado;
    else if (f >= 20) color = f === 22 ? COL.bajo : COL.beige;
    r(a, f, fin - a + 1, 1, color);
    r(a, f, 1, 1, COL.negro); r(fin, f, 1, 1, COL.negro); // contorno
  }
  // contorno de la trompa en escalera
  if (o.frente) for (let f = TOPE; f < TOPE + 6; f++) r(inicio(f), f, Math.max(1, inicio(f) - inicio(f + 1) + 1), 1, COL.negro);

  // puertas dobles (cerradas): dos por carro
  const puertas = [Math.round(n * 0.24), Math.round(n * 0.76)];
  const ANCHO_PUERTA = 10;
  const puerta = (px: number) => {
    const x0 = px - ANCHO_PUERTA / 2;
    r(x0, TOPE + 3, ANCHO_PUERTA, FONDO - TOPE - 3, COL.hueso);
    for (let f = 15; f <= 17; f++) r(x0, f, ANCHO_PUERTA, 1, f === 17 ? COL.rojoOscuro : COL.rojo);
    r(x0, 19, ANCHO_PUERTA, 1, COL.morado);
    r(x0, 20, ANCHO_PUERTA, 3, COL.beige);
    // marco y junta central
    r(x0 - 1, TOPE + 3, 1, FONDO - TOPE - 3, COL.negro); r(x0 + ANCHO_PUERTA, TOPE + 3, 1, FONDO - TOPE - 3, COL.negro);
    r(px, TOPE + 3, 1, FONDO - TOPE - 3, COL.negro);
    r(x0 - 1, TOPE + 3, ANCHO_PUERTA + 2, 1, COL.negro);
    // ventanas altas de cada hoja
    for (const vx of [x0 + 1, px + 2]) {
      r(vx, 7, 3, 7, COL.negro); r(vx, 8, 2, 5, COL.vidrio); r(vx, 11, 2, 2, COL.vidrioBajo); r(vx, 8, 1, 1, COL.celeste);
    }
  };

  // ventanas: en los tramos libres entre la cabina, las puertas y los extremos
  const ventana = (vx: number, w: number) => {
    r(vx - 1, 7, w + 2, 8, COL.negro);
    r(vx, 8, w, 3, COL.vidrio); r(vx, 11, w, 3, COL.vidrioBajo);
    r(vx, 8, 2, 1, COL.celeste); r(vx, 9, 1, 1, COL.celeste); // brillo
    // pasajeros a contraluz en algunas ventanas
    const gente = Math.floor(azar() * 3);
    for (let k = 0; k < gente; k++) {
      const hx = vx + 2 + Math.floor(azar() * Math.max(1, w - 6));
      r(hx + 1, 10, 3, 2, COL.pasajero); r(hx, 12, 5, 2, COL.pasajero);
    }
  };
  const cabina = o.frente ? 9 : 2;
  const tramos: [number, number][] = [];
  let desde = cabina + 1;
  for (const p of puertas) { tramos.push([desde, p - ANCHO_PUERTA / 2 - 2]); desde = p + ANCHO_PUERTA / 2 + 2; }
  tramos.push([desde, n - 3]);
  for (const [t0, t1] of tramos) {
    const libre = t1 - t0, w = 10, g = 4, k = Math.max(0, Math.floor((libre + g) / (w + g)));
    if (k === 0) { if (libre >= 4) ventana(t0 + 1, libre - 2); continue; }
    const ancho = k * w + (k - 1) * g, x0 = t0 + Math.floor((libre - ancho) / 2);
    for (let q = 0; q < k; q++) ventana(x0 + q * (w + g), w);
  }
  for (const p of puertas) puerta(p);

  // número del carro sobre la franja
  r(Math.round(n * 0.5) - 3, 18, 6, 1, COL.negro);

  if (o.frente) {
    // parabrisas, farol y luz de ruta
    r(2, 8, 6, 7, COL.negro); r(3, 9, 4, 5, COL.celeste); r(3, 9, 2, 1, COL.hueso); r(3, 12, 4, 2, '#5DA9DB');
    r(1, 20, 3, 2, COL.amarillo); r(1, 20, 1, 1, COL.hueso);
  }
  if (o.cola) { r(n - 3, 20, 2, 2, COL.rosa); }

  // bastidor, bogies y ruedas
  r(3, FONDO + 1, n - 6, 1, COL.grisOscuro);
  for (const k of [0.2, 0.8]) {
    const bx = Math.round(n * k) - 8;
    r(bx, FONDO + 2, 16, 3, COL.negro); r(bx + 1, FONDO + 2, 14, 2, COL.gris); r(bx + 6, FONDO + 3, 4, 1, COL.grisClaro);
    for (const wx of [bx + 1, bx + 10]) {
      r(wx, FONDO + 4, 5, 5, COL.negro); r(wx + 1, FONDO + 5, 3, 3, COL.grisOscuro); r(wx + 2, FONDO + 6, 1, 1, COL.grisClaro);
    }
  }
  if (hechos.size > 40) hechos.clear();
  hechos.set(llave, c);
  return c;
}
