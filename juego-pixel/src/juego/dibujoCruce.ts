import { ANCHO, META, QUIETO_AVISO, fila, type Cruce, type Fila, type Vehiculo } from './cruce';
import { LATA, sprite } from './sprites';

// Dibuja el nivel 1 (El cruce) en vista isométrica 3/4 (plan 009-juego-pixel, ronda 2): el motor no cambia, solo el dibujo.
// Mundo: x crece a lo largo del carril, y hacia adelante (filas) y z hacia arriba, todo en celdas.
// Se ven el techo, el frente (cara y = y0) y el costado derecho (cara x = x1) de cada caja, en 3 tonos y con contorno negro.
// Las imágenes de Figma (personaje y lateral del metro) llegan ya cargadas.
export interface Imagenes { personaje: HTMLImageElement | null; metro: HTMLImageElement | null }

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

type P = [number, number];

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
  const P = (x: number, y: number, z: number): P => [
    Math.round(ox + (x - v.camX) * c + (y - camY) * FX * c),
    Math.round(oy + (x - v.camX) * KX * c - (y - camY) * FY * c - z * Z * c),
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
    for (const [x, o] of f.obstaculos) cosas.push({ x, dibujar: () => obstaculo(x, y, h, o) });
    for (const [x, color] of f.latas) cosas.push({ x, dibujar: () => lata(x, y, h, color) });
    for (const veh of f.vehiculos) cosas.push({ x: veh.x, dibujar: () => vehiculo(veh, y, f.dir) });
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

  function obstaculo(x: number, y: number, h: number, o: string) {
    if (o === 'arbol') {
      const alto2 = (x * 7 + y * 3) % 3 === 0;
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
    const t = Math.round(c * 0.5), w = Math.max(Math.round(t * 0.22), Math.round(t * Math.abs(giro)));
    sprite(ctx, LATA, px - w / 2, py - t, w, t, color, giro < 0);
  }

  function vehiculo(veh: Vehiculo, y: number, dir: 1 | -1) {
    const x0 = veh.x, x1 = veh.x + veh.largo;
    sombraSuelo(x0 + 0.05, x1 - 0.05, y + 0.14, y + 0.86, 0);
    if (veh.tipo === 'micro') {
      // Micro: hueso con franja azul y ventanas celeste.
      for (const rx of [0.4, veh.largo - 0.6]) caja(x0 + rx, x0 + rx + 0.3, y + 0.08, y + 0.14, 0, 0.18, NEGRO, NEGRO, NEGRO);
      caja(x0, x1, y + 0.12, y + 0.88, 0.1, 1.0, '#F4EEE3', '#DDD5C6', '#BDB4A3');
      enFrente(x0, y + 0.12, 1.0, () => {
        const L = (x1 - x0) * c, H = 0.9 * Z * c;
        ctx.fillStyle = '#0062B8'; ctx.fillRect(0, Math.round(H * 0.55), Math.round(L), Math.round(H * 0.16));
        ctx.fillStyle = NEGRO; ctx.fillRect(0, Math.round(H * 0.12), Math.round(L), Math.round(H * 0.32));
        ctx.fillStyle = '#7FC8F8';
        for (let k = 0; k < veh.largo * 2; k++) ctx.fillRect(Math.round(k * c * 0.5 + c * 0.08), Math.round(H * 0.15), Math.round(c * 0.36), Math.round(H * 0.24));
      });
      plano(x0 + 0.3, x1 - 0.3, y + 0.3, y + 0.7, 1.001, '#C9C9C4');
      if (dir > 0) luces(x1, y + 0.12, y + 0.88, 0.25, 0.55, true);
      return;
    }
    // Auto: carrocería, cabina con ventanas, ruedas y focos.
    const color = veh.color;
    for (const rx of [0.3, veh.largo - 0.55]) caja(x0 + rx, x0 + rx + 0.26, y + 0.12, y + 0.18, 0, 0.2, NEGRO, NEGRO, NEGRO);
    caja(x0, x1, y + 0.16, y + 0.84, 0.12, 0.5, color);
    const cx0 = dir > 0 ? x0 + 0.35 : x0 + 0.65, cx1 = cx0 + 1.0;
    caja(cx0, cx1, y + 0.24, y + 0.76, 0.5, 0.82, color);
    enFrente(cx0, y + 0.24, 0.82, () => {
      ctx.fillStyle = '#7FC8F8'; const H = 0.32 * Z * c;
      ctx.fillRect(Math.round(c * 0.08), Math.round(H * 0.18), Math.round(c * 0.38), Math.round(H * 0.6));
      ctx.fillRect(Math.round(c * 0.54), Math.round(H * 0.18), Math.round(c * 0.38), Math.round(H * 0.6));
    });
    if (dir > 0) { // costado derecho = parabrisas
      cara([P(cx1, y + 0.3, 0.55), P(cx1, y + 0.7, 0.55), P(cx1, y + 0.7, 0.78), P(cx1, y + 0.3, 0.78)], '#7FC8F8', false);
      luces(x1, y + 0.16, y + 0.84, 0.22, 0.4, true);
    } else luces(x1, y + 0.16, y + 0.84, 0.22, 0.4, false);
  }
  // Focos en la cara derecha: delanteros (hueso) o traseros (rosa).
  function luces(x: number, y0: number, y1: number, z0: number, z1: number, delante: boolean) {
    const col = delante ? '#FFF6C9' : '#FF8FB1';
    for (const yy of [y0 + 0.06, y1 - 0.2]) cara([P(x, yy, z0), P(x, yy + 0.14, z0), P(x, yy + 0.14, z1 - 0.06), P(x, yy, z1 - 0.06)], col, false);
  }

  function tren(xt: number, y: number) {
    const LARGO = 3.34;
    for (let k = 0; k < 3; k++) {
      const x0 = xt + k * LARGO + 0.04, x1 = x0 + LARGO - 0.08, lider = k === 2;
      sombraSuelo(x0, x1, y + 0.1, y + 0.9, 0);
      caja(x0, x1, y + 0.1, y + 0.9, 0.08, 1.1, '#F4EEE3', '#DDD5C6', lider ? '#FFC20E' : '#BDB4A3');
      if (img.metro) enFrente(x0, y + 0.1, 1.1, () => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img.metro!, 0, 0, Math.round((x1 - x0) * c), Math.round(1.02 * Z * c));
      });
      // Techo con rejillas.
      plano(x0 + 0.3, x1 - 0.3, y + 0.35, y + 0.65, 1.101, '#C9C9C4');
      if (lider) { // trompa amarilla con parabrisas y focos, como el afiche del Metro
        cara([P(x1, y + 0.2, 0.62), P(x1, y + 0.8, 0.62), P(x1, y + 0.8, 0.98), P(x1, y + 0.2, 0.98)], NEGRO, false);
        for (const yy of [0.3, 0.62]) cara([P(x1, y + yy, 0.75), P(x1, y + yy + 0.08, 0.75), P(x1, y + yy + 0.08, 0.86), P(x1, y + yy, 0.86)], '#FFC20E', false);
        for (const yy of [0.18, 0.72]) cara([P(x1, y + yy, 0.2), P(x1, y + yy + 0.1, 0.2), P(x1, y + yy + 0.1, 0.32), P(x1, y + yy, 0.32)], '#FFF6C9', false);
      }
    }
  }

  function personaje() {
    const fz = altura(fila(e, Math.round(jy)));
    const arco = quieto ? 0 : Math.sin(s * Math.PI) * 0.55;
    const enc = 1 - arco * 0.5;
    ctx.globalAlpha = 0.3;
    plano(jx + 0.5 - 0.28 * enc, jx + 0.5 + 0.28 * enc, jy + 0.5 - 0.2 * enc, jy + 0.5 + 0.2 * enc, fz + 0.002, NEGRO);
    ctx.globalAlpha = 1;
    const [px, py] = P(jx + 0.5, jy + 0.45, fz + arco - entra * 0.4);
    const t = Math.round(c * 0.98);
    // Si te atropellan o pasa el metro, quedas aplastado (ancho y bajito) con una mancha de pintura.
    const choque = e.fin === 'atropellado' || e.fin === 'tren';
    const sx = choque ? 1.35 : 1, sy = choque ? 0.32 : 1;
    if (choque) { plano(jx - 0.15, jx + 1.15, jy + 0.12, jy + 0.88, fz + 0.003, '#FF8FB1'); plano(jx + 0.1, jx + 0.9, jy + 0.3, jy + 0.7, fz + 0.004, '#FF5C8E'); }
    ctx.save();
    if (entra > 0.55) ctx.globalAlpha = Math.max(0, 1 - (entra - 0.55) / 0.45);
    ctx.translate(px, py); ctx.scale(sx * v!.mira, sy);
    if (img.personaje) ctx.drawImage(img.personaje, -t / 2, -t * 0.9, t, t);
    else { ctx.fillStyle = '#00A651'; ctx.fillRect(-t / 3, -t * 0.7, t * 0.66, t * 0.66); }
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
