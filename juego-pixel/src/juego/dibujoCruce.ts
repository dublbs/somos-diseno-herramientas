import { ANCHO, META, QUIETO_AVISO, fila, type Cruce, type Fila, type Vehiculo } from './cruce';
import { LATA, LATA_PROPORCION, sprite } from './sprites';
import { lienzoCarro, lienzoFuelle, lienzoTrompa } from './metro';
import { lienzoPinta } from './personajes';

// Dibuja el nivel 1 (El cruce) en vista isométrica 3/4 (plan 009-juego-pixel, ronda 2): el motor no cambia, solo el dibujo.
// Mundo: x crece a lo largo del carril, y hacia adelante (filas) y z hacia arriba, todo en celdas.
// Se ven el techo, el frente (cara y = y0) y el costado derecho (cara x = x1) de cada caja, en 3 tonos y con contorno negro.
// Las imágenes de Figma (personaje y lateral del metro) llegan ya cargadas.
export interface Imagenes { personaje: CanvasImageSource | null; metro: CanvasImageSource | null }

// Proyección: un paso en x baja un poco (las filas son bandas inclinadas); un paso en y sube y se corre a la derecha.
const KX = 0.2, FX = 0.42, FY = 0.8, Z = 0.75;
const NEGRO = '#000000';
const SUELO = {
  vereda: { top: '#D9D0C1', frente: '#B5AA97', junta: '#C2B8A6', h: 0.14 },
  plaza: { top: '#5DAA6E', frente: '#3E7F4E', junta: '#4C9A5E', h: 0.14 },
  calle: { top: '#3D3A36', frente: '#2A2825', junta: '#4A4641', h: 0 },
  metro: { top: '#77726A', frente: '#5A564F', junta: '#8A857C', h: 0 },
  estacion: { top: '#0062B8', frente: '#004A8C', junta: '#2B4BD8', h: 0.14 },
} as const;

// Oscurece un color (#RRGGBB) por un factor (1 = igual).
const tonos = new Map<string, string>();
export function sombra(hex: string, f: number) {
  const k = hex + f;
  let r = tonos.get(k);
  if (!r) {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v * f));
    r = '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
    tonos.set(k, r);
  }
  return r;
}

// Estado del dibujo que no es del motor: la cámara en x y el salto del personaje entre celdas.
// `fin`: cuándo terminó el cruce (llegada o choque), para animar la entrada al metro o el aplastón.
interface Vista { camX: number; desdeX: number; desdeY: number; x: number; y: number; mira: 1 | -1; fin: number }
const vistas = new WeakMap<Cruce, Vista>();
// Piezas ya dibujadas, por tamaño de celda (se rehacen si cambia).
const cache = { c: 0, piezas: new Map<string, { lienzo: HTMLCanvasElement; ax: number; ay: number }>() };

type P = [number, number];

// Rojo de las micros de la red de Santiago (excepción a la paleta Línea azul, solo aquí; pedido de Pipe, 18 nov).
const ROJO_RED = '#D7262E';

export function dibujarCruce(ctx: CanvasRenderingContext2D, ancho: number, alto: number, e: Cruce, camara: number, img: Imagenes, ahora: number, quieto = false) {
  const j = e.jugador;
  let v = vistas.get(e);
  if (!v) { v = { camX: j.x + 0.5, desdeX: j.x, desdeY: j.y, x: j.x, y: j.y, mira: 1, fin: 0 }; vistas.set(e, v); }
  if (v.x !== j.x || v.y !== j.y) { // se movió: el salto parte desde donde estaba
    v.desdeX = v.x; v.desdeY = v.y; v.x = j.x; v.y = j.y;
    if (j.x !== v.desdeX) v.mira = j.x > v.desdeX ? 1 : -1;
  }
  if ((e.llego || e.fin) && !v.fin) v.fin = ahora;
  const s = quieto ? 0 : j.salto; // 1 → 0 durante el salto
  let jx = j.x + (v.desdeX - j.x) * s, jy = j.y + (v.desdeY - j.y) * s;
  // Al llegar, el personaje camina hasta el pórtico y baja la escalera (se pierde detrás del letrero).
  const entra = e.llego && !quieto ? Math.min(1, Math.max(0, (ahora - v.fin - 150) / 750)) : 0;
  if (entra) { jx += (6 - j.x) * Math.min(1, entra * 1.6); jy += entra * 2.2; }
  const foco = 6.5 + (jx + 0.5 - 6.5) * 0.6;
  v.camX += (foco - v.camX) * (quieto ? 1 : 0.12);

  // Tamaño de celda: unas 12 filas a lo alto y al menos 8,5 columnas a lo ancho.
  const c = Math.max(8, Math.floor(Math.min(alto / (FY * 13.5), ancho / 8.5)));
  const lw = Math.max(2, Math.round(c / 24));
  const camY = camara + 2.5, ox = ancho / 2, oy = alto * 0.7;
  // P proyecta al lienzo; `estampa` la reapunta un momento a un canvas aparte (por eso usa variables).
  let OX = ox, OY = oy, CX = v.camX, CY = camY;
  const P = (x: number, y: number, z: number): P => [
    Math.round(OX + (x - CX) * c + (y - CY) * FX * c),
    Math.round(OY + (x - CX) * KX * c - (y - CY) * FY * c - z * Z * c),
  ];
  const cara = (pts: P[], relleno: string, borde = true) => {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath(); ctx.fillStyle = relleno; ctx.fill();
    if (borde) { ctx.lineWidth = lw; ctx.strokeStyle = NEGRO; ctx.lineJoin = 'miter'; ctx.stroke(); }
  };
  // Caja con techo, frente y costado derecho (3 tonos del mismo color, o colores propios).
  const caja = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: string, frente = sombra(color, 0.8), costado = sombra(color, 0.6)) => {
    cara([P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], frente);
    cara([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], costado);
    cara([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], color);
  };
  const plano = (x0: number, x1: number, y0: number, y1: number, z: number, color: string, borde = false) =>
    cara([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)], color, borde);
  const sombraSuelo = (x0: number, x1: number, y0: number, y1: number, z: number) => {
    ctx.globalAlpha = 0.28; plano(x0 + 0.12, x1 + 0.12, y0 - 0.1, y1 - 0.1, z + 0.002, NEGRO); ctx.globalAlpha = 1;
  };
  // Calco sobre una cara frontal (cara y = y0): ejes en px, con la inclinación del carril.
  const enFrente = (x: number, y: number, z: number, dibujo: () => void) => {
    const [px, py] = P(x, y, z);
    ctx.save(); ctx.transform(1, KX, 0, 1, px, py); dibujo(); ctx.restore();
  };

  // Las piezas quietas (autos, micros, carros del metro, árboles, bancas, basureros) se dibujan una vez en un canvas
  // aparte y después solo se estampan: la proyección es la misma en todo el tablero, solo cambia el lugar.
  // `caja3`: lo que ocupa la pieza (x0, x1, y0, y1, z0, z1) respecto de su ancla (x, y, 0).
  const estampa = (clave: string, x: number, y: number, caja3: number[], dibujar: () => void) => {
    if (cache.c !== c || cache.piezas.size > 80) { cache.piezas.clear(); cache.c = c; }
    let pz = cache.piezas.get(clave);
    if (!pz) {
      const [x0, x1, y0, y1, z0, z1] = caja3, xs: number[] = [], ys: number[] = [];
      for (const dx of [x0, x1]) for (const dy of [y0, y1]) for (const dz of [z0, z1]) {
        xs.push(dx * c + dy * FX * c); ys.push(dx * KX * c - dy * FY * c - dz * Z * c);
      }
      const borde = lw * 2 + 2, mx = Math.floor(Math.min(...xs)) - borde, my = Math.floor(Math.min(...ys)) - borde;
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.ceil(Math.max(...xs)) + borde - mx; lienzo.height = Math.ceil(Math.max(...ys)) + borde - my;
      const antes = { ctx, OX, OY, CX, CY };
      ctx = lienzo.getContext('2d')!; ctx.imageSmoothingEnabled = false;
      OX = -mx; OY = -my; CX = x; CY = y;
      dibujar();
      ({ ctx, OX, OY, CX, CY } = antes);
      pz = { lienzo, ax: -mx, ay: -my };
      cache.piezas.set(clave, pz);
    }
    const [px, py] = P(x, y, 0);
    ctx.drawImage(pz.lienzo, px - pz.ax, py - pz.ay);
  };

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#2B4BD8'; ctx.fillRect(0, 0, ancho, alto);

  const desde = Math.floor(camY - (alto - oy) / (FY * c)) - 3;
  const hasta = Math.ceil(camY + oy / (FY * c)) + 3;
  const xa = Math.floor(v.camX - ancho / c) - 2, xb = Math.ceil(v.camX + ancho / c) + 2;
  const altura = (f: Fila | undefined) => (f ? SUELO[f.tipo].h : SUELO.vereda.h);
  const yMeta = META;

  for (let y = Math.min(hasta, e.generadas - 1); y >= desde; y--) {
    const f = fila(e, y);
    const tipo = f?.tipo ?? (y >= META ? 'estacion' : 'vereda');
    const t = SUELO[tipo], h = t.h;
    const cerca = fila(e, y - 1), canto = h > 0 && (!cerca || cerca.tipo !== tipo);
    // Losa del suelo: dentro del tablero a todo color; afuera, más oscura (la ciudad que sigue).
    if (canto) cara([P(xa, y, 0), P(xb, y, 0), P(xb, y, h), P(xa, y, h)], t.frente, false);
    plano(xa, 0, y, y + 1, h, sombra(t.top, 0.62));
    plano(ANCHO, xb, y, y + 1, h, sombra(t.top, 0.62));
    plano(0, ANCHO, y, y + 1, h, t.top);
    if (canto) { ctx.lineWidth = lw; ctx.strokeStyle = NEGRO; ctx.beginPath(); const a = P(xa, y, h), b = P(xb, y, h); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    detalleSuelo(y, tipo, h, f);
    if (y === yMeta + 2) escalera(y - 1); // antes que el personaje, que la baja al llegar

    if (!f) continue;
    // Señal del metro, a la izquierda del tablero.
    if (f.tipo === 'metro') {
      const avisa = f.tren && !f.tren.activo && Math.floor(ahora / 160) % 2 === 0;
      caja(-0.75, -0.6, y + 0.85, y + 0.98, 0, 1.3, '#4A453E');
      caja(-0.95, -0.4, y + 0.82, y + 0.98, 1.3, 1.75, '#1E1C19');
      enFrente(-0.95, y + 0.82, 1.75, () => {
        const u = 0.55 * c, r = Math.max(3, Math.round(u * 0.32));
        ctx.fillStyle = avisa ? '#FFC20E' : '#4A453E'; ctx.fillRect(Math.round(u / 2 - r), Math.round(0.45 * Z * c * 0.5 - r * 0.6), r * 2, r * 2);
      });
    }
    // Objetos de la fila, de izquierda a derecha (lo que está más a la derecha queda más cerca).
    const cosas: { x: number; dibujar: () => void }[] = [];
    for (const [x, o] of f.obstaculos) {
      const alto2 = o === 'arbol' && (x * 7 + y * 3) % 3 === 0;
      cosas.push({ x, dibujar: () => estampa(`${o}|${alto2}|${h}`, x, y, [0, 1.1, 0, 1, 0, h + 1.7], () => obstaculo(x, y, h, o, alto2)) });
    }
    for (const [x, color] of f.latas) cosas.push({ x, dibujar: () => lata(x, y, h, color) });
    for (const veh of f.vehiculos) cosas.push({ x: veh.x, dibujar: () => estampa(`${veh.tipo}|${veh.color}|${veh.largo}|${f.dir}`, veh.x, y, [0, veh.largo + 0.2, 0, 1, 0, 1.25], () => vehiculo(veh, y, f.dir)) });
    if (f.tren?.activo) cosas.push({ x: f.tren.x, dibujar: () => tren(f.tren!.x, y) });
    if (y === Math.round(jy)) cosas.push({ x: e.fin === 'atropellado' || e.fin === 'tren' ? -99 : jx, dibujar: personaje }); // aplastado: queda en el suelo y el tránsito le pasa por encima
    cosas.sort((a, b) => a.x - b.x).forEach(k => k.dibujar());
    if (y === yMeta + 1) portico(y);
  }
  // El personaje fuera de las filas generadas (no debería pasar, pero por si acaso).
  if (!fila(e, Math.round(jy))) personaje();

  // Bruma al fondo: las filas que todavía no existen se pierden en el cielo.
  const bruma = ctx.createLinearGradient(0, 0, 0, alto * 0.22);
  bruma.addColorStop(0, '#2B4BD8'); bruma.addColorStop(1, 'rgba(43,75,216,0)');
  ctx.fillStyle = bruma; ctx.fillRect(0, 0, ancho, alto * 0.22);

  // Puntos que suben y aviso de quedarse quieto.
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const a of e.avisos) {
    ctx.font = `700 ${Math.round(c * 0.36)}px "Silkscreen", monospace`;
    const [px, py] = P(a.x + 0.5, a.y + 0.5, 1.4 + (1 - a.t / 900) * 0.9);
    ctx.fillStyle = NEGRO; ctx.fillText(a.texto, px + 3, py + 3);
    ctx.fillStyle = '#FFC20E'; ctx.fillText(a.texto, px, py);
  }
  if (!e.fin && !e.llego && e.quieto > QUIETO_AVISO && Math.floor(ahora / 250) % 2 === 0) {
    ctx.font = `700 ${Math.round(c * 0.5)}px "Silkscreen", monospace`;
    const [px, py] = P(jx + 0.5, jy + 0.5, 2.3);
    ctx.fillStyle = NEGRO; ctx.fillText('¡Muévete!', px + 3, py + 3);
    ctx.fillStyle = '#FF8FB1'; ctx.fillText('¡Muévete!', px, py);
  }

  // ——— Partes ———
  function detalleSuelo(y: number, tipo: keyof typeof SUELO, h: number, f: Fila | undefined) {
    const t = SUELO[tipo];
    ctx.lineWidth = Math.max(1, Math.round(lw / 2)); ctx.strokeStyle = t.junta;
    if (tipo === 'vereda' || tipo === 'estacion') {
      ctx.beginPath();
      for (let x = 0; x <= ANCHO; x++) { const a = P(x, y, h), b = P(x, y + 1, h); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      const a = P(0, y + 0.5, h), b = P(ANCHO, y + 0.5, h); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      ctx.stroke();
      if (tipo === 'estacion' && fila(e, y - 1)?.tipo !== 'estacion') plano(0, ANCHO, y, y + 0.16, h + 0.001, '#FFC20E');
    } else if (tipo === 'plaza') {
      for (let x = 0; x < ANCHO; x++) for (let k = 0; k < 2; k++) {
        const u = ((x * 5 + y * 11 + k * 7) % 9) / 10 + 0.05, w = ((x * 3 + y * 7 + k * 5) % 7) / 9 + 0.1;
        plano(x + u, x + u + 0.1, y + w, y + w + 0.08, h + 0.001, t.junta);
      }
    } else if (tipo === 'calle') {
      if (fila(e, y + 1)?.tipo === 'calle') for (let x = 0; x < ANCHO; x++) plano(x + 0.15, x + 0.65, y + 0.95, y + 1.05, 0.001, '#F4EEE3');
      if (fila(e, y - 1)?.tipo !== 'calle') plano(xa, xb, y, y + 0.07, 0.001, '#FFC20E'); // borde de la solera
    } else if (tipo === 'metro') {
      for (let x = Math.floor(xa); x < xb; x += 0.5) plano(x, x + 0.18, y + 0.12, y + 0.88, 0.001, '#7A5A3A');
      for (const r of [0.28, 0.66]) { caja(xa, xb, y + r, y + r + 0.06, 0, 0.06, '#C9C9C4', '#9A9A94', '#7A7A74'); }
    }
    void f;
  }

  function obstaculo(x: number, y: number, h: number, o: string, alto2: boolean) {
    if (o === 'arbol') {
      sombraSuelo(x + 0.15, x + 0.85, y + 0.15, y + 0.85, h);
      caja(x + 0.36, x + 0.64, y + 0.36, y + 0.64, h, h + 0.55, '#7A5A3A');
      caja(x + 0.12, x + 0.88, y + 0.16, y + 0.84, h + 0.55, h + 1.15, '#00A651');
      if (alto2) caja(x + 0.26, x + 0.74, y + 0.3, y + 0.7, h + 1.15, h + 1.55, '#00A651');
      plano(x + 0.2, x + 0.34, y + 0.62, y + 0.74, h + 1.151, '#5FD08A');
    } else if (o === 'banca') {
      sombraSuelo(x + 0.08, x + 0.92, y + 0.3, y + 0.8, h);
      for (const lx of [0.14, 0.78]) caja(x + lx, x + lx + 0.08, y + 0.38, y + 0.46, h, h + 0.22, '#1E1C19');
      caja(x + 0.08, x + 0.92, y + 0.34, y + 0.7, h + 0.22, h + 0.32, '#A0703F');
      caja(x + 0.08, x + 0.92, y + 0.66, y + 0.76, h + 0.32, h + 0.68, '#A0703F');
    } else {
      sombraSuelo(x + 0.25, x + 0.75, y + 0.28, y + 0.74, h);
      caja(x + 0.25, x + 0.75, y + 0.28, y + 0.74, h, h + 0.62, '#00A651');
      caja(x + 0.22, x + 0.78, y + 0.25, y + 0.77, h + 0.62, h + 0.72, '#2E7D46');
      enFrente(x + 0.25, y + 0.28, h + 0.5, () => { ctx.fillStyle = '#F4EEE3'; ctx.fillRect(Math.round(c * 0.17), 0, Math.round(c * 0.16), Math.round(c * 0.16)); });
    }
  }

  function lata(x: number, y: number, h: number, color: string) {
    const flota = quieto ? 0.25 : 0.25 + Math.sin(ahora / 260 + x + y) * 0.1;
    const giro = quieto ? 1 : Math.cos(ahora / 300 + x * 1.7);
    sombraSuelo(x + 0.3, x + 0.7, y + 0.35, y + 0.65, h);
    const [px, py] = P(x + 0.5, y + 0.5, h + flota);
    // La lata gira sobre su eje (se angosta y se da vuelta) sin deformar su alto.
    const t = Math.round(c * 0.62), w = Math.max(Math.round(t * 0.12), Math.round(t * LATA_PROPORCION * Math.abs(giro)));
    sprite(ctx, LATA, px - w / 2, py - t, w, t, color, giro < 0);
  }

  // ——— Vehículos (ronda 3): Pixel con volumen, contorno negro, colores planos y detalles pixel en cada cara ———
  // Calco sobre el costado (cara x = x): eje u a lo largo de y, eje v hacia abajo en z.
  function enCostado(x: number, y: number, z: number, dibujo: () => void) {
    const [px, py] = P(x, y, z);
    ctx.save(); ctx.transform(FX, -FY, 0, 1, px, py); dibujo(); ctx.restore();
  }
  function u() { return Math.max(1, Math.round(c / 16)); } // un «pixel» del dibujo
  function rueda(x: number, y: number) { // rueda en la cara del frente: neumático negro y tapa gris
    caja(x, x + 0.34, y + 0.1, y + 0.16, 0, 0.26, NEGRO, NEGRO, NEGRO);
    enFrente(x, y + 0.1, 0.26, () => {
      const p = u(), w = Math.round(0.34 * c), h = Math.round(0.26 * Z * c);
      ctx.fillStyle = '#5A5A55'; ctx.fillRect(Math.round(w / 2 - 2 * p), Math.round(h / 2 - 2 * p), 4 * p, 4 * p);
      ctx.fillStyle = '#B9B9B3'; ctx.fillRect(Math.round(w / 2 - p), Math.round(h / 2 - p), 2 * p, 2 * p);
    });
  }
  function vidrio(w: number, h: number, ox: number, oy: number) { // ventana pixel: marco negro, vidrio y brillo
    const p = u();
    ctx.fillStyle = NEGRO; ctx.fillRect(ox, oy, w, h);
    ctx.fillStyle = '#2B4BD8'; ctx.fillRect(ox + p, oy + p, w - 2 * p, h - 2 * p);
    ctx.fillStyle = '#7FC8F8'; ctx.fillRect(ox + p, oy + p, w - 2 * p, Math.max(p, Math.round((h - 2 * p) * 0.45)));
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(ox + 2 * p, oy + 2 * p, 2 * p, p);
  }

  function vehiculo(veh: Vehiculo, y: number, dir: 1 | -1) {
    const x0 = veh.x, x1 = veh.x + veh.largo, p = u();
    sombraSuelo(x0 + 0.05, x1 - 0.05, y + 0.14, y + 0.86, 0);
    if (veh.tipo === 'micro') {
      // Micro de la red de transporte de Santiago (pedido de Pipe, 18 nov): blanca, faldón rojo y franja roja bajo
      // las ventanas, como las micros eléctricas de la red. Sin logo (es una marca). El rojo es una excepción a la
      // paleta «Línea azul», que lo reserva al isotipo INACAP.
      for (const rx of [0.35, veh.largo - 0.75]) rueda(x0 + rx, y);
      caja(x0, x1, y + 0.12, y + 0.88, 0.14, 1.02, '#FFFFFF', '#E9E9E6', '#D2D2CE');
      enFrente(x0, y + 0.12, 1.02, () => {
        const L = Math.round((x1 - x0) * c), H = Math.round(0.88 * Z * c);
        ctx.fillStyle = NEGRO; ctx.fillRect(0, Math.round(H * 0.1), L, Math.round(H * 0.38));
        const n = 5, w = Math.round((L - 2 * p) / n);
        for (let k = 0; k < n; k++) vidrio(w - p, Math.round(H * 0.34), p + k * w, Math.round(H * 0.12));
        ctx.fillStyle = ROJO_RED; ctx.fillRect(0, Math.round(H * 0.52), L, 2 * p); // franja bajo las ventanas
        ctx.fillStyle = ROJO_RED; ctx.fillRect(0, Math.round(H * 0.74), L, Math.round(H * 0.26)); // faldón
        ctx.fillStyle = '#9E1A1F'; ctx.fillRect(0, Math.round(H * 0.74), L, p);
        // Puertas dobles: la de adelante (por donde se sube) y la del medio (por donde se baja la gente, B-007).
        const puerta = (px: number) => {
          ctx.fillStyle = NEGRO; ctx.fillRect(px, Math.round(H * 0.1), Math.round(c * 0.42), Math.round(H * 0.86));
          ctx.fillStyle = '#7FC8F8'; ctx.fillRect(px + p, Math.round(H * 0.14), Math.round(c * 0.2) - 2 * p, Math.round(H * 0.5));
          ctx.fillRect(px + Math.round(c * 0.21) + p, Math.round(H * 0.14), Math.round(c * 0.2) - 2 * p, Math.round(H * 0.5));
          ctx.fillStyle = '#B9B9B3'; ctx.fillRect(px + p, Math.round(H * 0.68), Math.round(c * 0.2) - 2 * p, p); // barandas
          ctx.fillRect(px + Math.round(c * 0.21) + p, Math.round(H * 0.68), Math.round(c * 0.2) - 2 * p, p);
        };
        puerta(dir > 0 ? L - Math.round(c * 0.7) : Math.round(c * 0.25));
        puerta(Math.round(L / 2 - c * 0.21));
      });
      caja(x0 + 0.8, x1 - 0.9, y + 0.3, y + 0.7, 1.02, 1.14, '#B9B9B3'); // aire acondicionado
      enCostado(x1, y + 0.12, 1.02, () => {
        const L = Math.round(0.76 * c), H = Math.round(0.88 * Z * c);
        ctx.fillStyle = ROJO_RED; ctx.fillRect(0, Math.round(H * 0.66), L, Math.round(H * 0.24)); // frente rojo
        if (dir > 0) { // frente: parabrisas, letrero LED y focos
          ctx.fillStyle = NEGRO; ctx.fillRect(p, Math.round(H * 0.06), L - 2 * p, Math.round(H * 0.12));
          ctx.fillStyle = '#FFC20E'; for (let k = 0; k < 4; k++) ctx.fillRect(3 * p + k * 3 * p, Math.round(H * 0.09), 2 * p, p);
          vidrio(L - 2 * p, Math.round(H * 0.4), p, Math.round(H * 0.2));
          ctx.fillStyle = '#FFF6C9'; ctx.fillRect(2 * p, Math.round(H * 0.74), 3 * p, 2 * p); ctx.fillRect(L - 5 * p, Math.round(H * 0.74), 3 * p, 2 * p);
        } else { // atrás: ventana chica y focos rosados
          vidrio(L - 6 * p, Math.round(H * 0.28), 3 * p, Math.round(H * 0.12));
          ctx.fillStyle = '#FF8FB1'; ctx.fillRect(2 * p, Math.round(H * 0.68), 3 * p, 3 * p); ctx.fillRect(L - 5 * p, Math.round(H * 0.68), 3 * p, 3 * p);
        }
        ctx.fillStyle = NEGRO; ctx.fillRect(0, Math.round(H * 0.88), L, Math.round(H * 0.12));
      });
      return;
    }
    // Auto y taxi: carrocería, cabina con ventanas, ruedas, parachoques y focos.
    const taxi = veh.tipo === 'taxi', color = veh.color, techo = taxi ? '#FFC20E' : sombra(color, 1);
    for (const rx of [0.25, veh.largo - 0.6]) rueda(x0 + rx, y);
    caja(x0, x1, y + 0.16, y + 0.84, 0.14, 0.48, color, sombra(color, taxi ? 1 : 0.82), sombra(color, taxi ? 1 : 0.64));
    enFrente(x0, y + 0.16, 0.48, () => {
      const L = Math.round((x1 - x0) * c), H = Math.round(0.34 * Z * c);
      ctx.fillStyle = taxi ? '#FFC20E' : 'rgba(255,255,255,0.45)'; ctx.fillRect(p, p, L - 2 * p, p); // filo de luz (o franja amarilla del taxi)
      ctx.fillStyle = NEGRO; ctx.fillRect(Math.round(L / 2), 2 * p, p, H - 4 * p); // línea de las puertas
      ctx.fillRect(Math.round(L / 2) - 4 * p, Math.round(H * 0.4), 2 * p, p); ctx.fillRect(Math.round(L / 2) + 3 * p, Math.round(H * 0.4), 2 * p, p);
      ctx.fillRect(0, H - 2 * p, L, 2 * p); // parachoques
    });
    const cx0 = dir > 0 ? x0 + 0.3 : x0 + 0.62, cx1 = cx0 + 1.05;
    caja(cx0, cx1, y + 0.24, y + 0.76, 0.48, 0.8, techo, sombra(color, taxi ? 1 : 0.82), sombra(color, taxi ? 1 : 0.64));
    enFrente(cx0, y + 0.24, 0.8, () => {
      const L = Math.round(1.05 * c), H = Math.round(0.32 * Z * c), w = Math.round((L - 3 * p) / 2);
      vidrio(w, H - 2 * p, p, p); vidrio(w, H - 2 * p, 2 * p + w, p);
    });
    enCostado(cx1, y + 0.24, 0.8, () => vidrio(Math.round(0.52 * c), Math.round(0.32 * Z * c) - p, 0, Math.round(p / 2)));
    enCostado(x1, y + 0.16, 0.48, () => {
      const L = Math.round(0.68 * c), H = Math.round(0.34 * Z * c);
      ctx.fillStyle = dir > 0 ? '#FFF6C9' : '#FF8FB1';
      ctx.fillRect(p, Math.round(H * 0.25), 3 * p, 2 * p); ctx.fillRect(L - 4 * p, Math.round(H * 0.25), 3 * p, 2 * p);
      ctx.fillStyle = NEGRO; ctx.fillRect(0, H - 2 * p, L, 2 * p);
    });
    if (taxi) { // letrero «TAXI» en el techo
      caja(cx0 + 0.3, cx0 + 0.75, y + 0.4, y + 0.6, 0.8, 0.95, '#FFC20E');
      enFrente(cx0 + 0.3, y + 0.4, 0.95, () => {
        ctx.fillStyle = NEGRO; ctx.font = `700 ${Math.max(6, Math.round(c * 0.13))}px "Silkscreen", monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TAXI', Math.round(0.225 * c), Math.round(0.075 * Z * c));
      });
    }
  }

  function tren(xt: number, y: number) {
    const LARGO = 3.34;
    for (let k = 0; k < 3; k++) {
      const x0 = xt + k * LARGO + 0.04, lider = k === 2;
      estampa(`tren3|${lider}`, x0, y, [0, LARGO, 0, 1, 0, 1.3], () => carro(x0, y, LARGO - 0.08, lider));
    }
  }
  // Carro de la Línea 1 (ronda 3): el costado pixel de la web (metro.ts) y, adelante, la trompa con su parabrisas.
  function carro(x0: number, y: number, largo: number, lider: boolean) {
    const x1 = x0 + largo;
    sombraSuelo(x0, x1, y + 0.1, y + 0.9, 0);
    caja(x0, x1, y + 0.1, y + 0.9, 0.04, 1.14, '#F4EEE3', '#E2D9C9', '#C9BFAE');
    enFrente(x0, y + 0.1, 1.3, () => {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(lienzoCarro(), 0, 0, Math.round(largo * c), Math.round(1.3 * Z * c));
    });
    plano(x0 + 0.1, x1 - 0.1, y + 0.2, y + 0.8, 1.141, '#C9BFAE');
    for (const rx of [0.6, largo - 1]) caja(x0 + rx, x0 + rx + 0.45, y + 0.35, y + 0.65, 1.14, 1.24, '#8F8F8A');
    enCostado(x1, y + 0.1, 1.3, () => {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(lider ? lienzoTrompa() : lienzoFuelle(), 0, 0, Math.round(0.8 * c), Math.round(1.3 * Z * c));
    });
  }

  function personaje() {
    const fz = altura(fila(e, Math.round(jy)));
    const arco = quieto ? 0 : Math.sin(s * Math.PI) * 0.55;
    const enc = 1 - arco * 0.5;
    ctx.globalAlpha = 0.3;
    plano(jx + 0.5 - 0.28 * enc, jx + 0.5 + 0.28 * enc, jy + 0.5 - 0.2 * enc, jy + 0.5 + 0.2 * enc, fz + 0.002, NEGRO);
    ctx.globalAlpha = 1;
    const [px, py] = P(jx + 0.5, jy + 0.45, fz + arco - entra * 0.4);
    const t = Math.round(c * 1.05);
    // Si te atropellan o pasa el metro, quedas aplastado como una galleta (ancho y bajito) que rebota un par de veces
    // y se queda quieta. Sin charco de pintura (B-007). Con movimiento reducido, queda aplastado sin rebote.
    const choque = e.fin === 'atropellado' || e.fin === 'tren';
    const dt = choque ? ahora - v!.fin : 0;
    const rebote = choque && !quieto ? Math.abs(Math.sin(dt / 85)) * Math.exp(-dt / 320) : 0;
    const sy = choque ? 0.3 + rebote * 0.35 : 1, sx = choque ? 1.4 - rebote * 0.3 : 1;
    ctx.save();
    if (entra > 0.55) ctx.globalAlpha = Math.max(0, 1 - (entra - 0.55) / 0.45);
    ctx.translate(px, py); ctx.scale(sx * v!.mira, sy);
    ctx.imageSmoothingEnabled = false;
    const pose = choque ? 'golpe' : s > 0.05 && !quieto ? 'salta' : entra ? (Math.floor(ahora / 130) % 2 ? 'camina1' : 'camina2') : 'quieto';
    ctx.drawImage(lienzoPinta(pose), -t / 2, -t * 0.92, t, t);
    ctx.restore();
  }

  // Entrada del metro: la escalera que baja (peldaños hacia adelante) y el pórtico azul con su letrero «METRO».
  function escalera(y: number) {
    const h = SUELO.estacion.h;
    for (let k = 0; k < 5; k++) plano(4.1, 8.9, y + 1.1 + k * 0.26, y + 1.36 + k * 0.26, h - 0.02, sombra('#4A453E', 1 - k * 0.14), true);
  }
  function portico(y: number) {
    const h = SUELO.estacion.h, a = 3.6, b = 9.4;
    caja(a, a + 0.5, y + 0.6, y + 1.0, h, h + 1.7, '#0062B8');
    caja(b - 0.5, b, y + 0.6, y + 1.0, h, h + 1.7, '#0062B8');
    caja(a - 0.3, b + 0.3, y + 0.55, y + 1.05, h + 1.7, h + 2.45, '#2B4BD8');
    enFrente(a - 0.3, y + 0.55, h + 2.45, () => {
      const L = (b - a + 0.6) * c, H = 0.75 * Z * c;
      ctx.fillStyle = '#F4EEE3'; ctx.fillRect(Math.round(L * 0.2), Math.round(H * 0.14), Math.round(L * 0.6), Math.round(H * 0.72));
      ctx.fillStyle = '#0062B8'; ctx.font = `700 ${Math.round(H * 0.62)}px "Silkscreen", monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('METRO', Math.round(L / 2), Math.round(H * 0.52));
    });
  }
}
