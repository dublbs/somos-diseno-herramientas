import { GLIFOS, AVANCE, normalizar } from '../../../shared/pixelfont';
import type { Lenguaje, Persona } from './fuente';
import { imagen, raster } from './imagenes';
import { c3EnTiempo, dibujarC3 } from '../../../shared/c3-tunel.js';
import { enVivo, listaImagen, autorDe, type Obra, type ClaseObra } from './vivo';
import { NOMBRE_CORTO } from '../galeria/piezas';
import { ACTIVAS } from '../../../shared/juego';
import { carro, FILAS } from './metro';

// Estación Somos Diseño: corte de una estación en tres niveles.
//   Plaza Orgánica (arriba) · Mezanina Geométrica (medio) · Andén Pixel (abajo).
// Las personas llegan a la plaza y cada timbre las baja un nivel (plan 014 §0): 1 plaza → 2 mezanina → 3 andén →
// 4 andén con aureola.
// Todo se dibuja en pixeles CSS a partir del tamaño de la pantalla (sirve en horizontal y vertical).

export const C = {
  Hueso: '#F4EEE3', Negro: '#000000', Azul: '#0062B8', Lapis: '#2B4BD8', Celeste: '#7FC8F8',
  Amarillo: '#FFC20E', Verde: '#00A651', Rosa: '#FF8FB1', Morado: '#7A2E8E',
};
const CUERPO: Record<Lenguaje, string> = { Pixel: C.Morado, Geométrica: C.Azul, Orgánica: C.Verde };
const SRC = {
  personaje: { pixel: './figma/personajes/personaje-pixel.svg', geometrica: './figma/personajes/personaje-geometrica.svg', organica: './figma/personajes/personaje-organica.svg' },
  araucaria: './figma/plaza/araucaria.svg', sol: './figma/plaza/sol.svg', helecho: './figma/plaza/helecho.svg', flor: './figma/plaza/flor-propia.svg', quisco: './figma/plaza/quisco.svg',
  vagon: ['./figma/vagon/personaje.svg', './figma/vagon/spray.svg', './figma/vagon/tarro-pintura.svg', './figma/vagon/plumon.svg', './figma/vagon/senal-rodillo.svg', './figma/vagon/zapatilla.svg'],
};
// Grabados de prueba para los banderines de la plaza (taco + tinta + papel), hasta que lleguen los de la experiencia.
const GRABADOS = [
  { taco: SRC.helecho, tinta: '#00A651', papel: '#F4EEE3' }, { taco: SRC.sol, tinta: '#FF8FB1', papel: '#7FC8F8' },
  { taco: SRC.araucaria, tinta: '#2B4BD8', papel: '#FFC20E' }, { taco: SRC.quisco, tinta: '#7A2E8E', papel: '#F4EEE3' },
  { taco: SRC.flor, tinta: '#0062B8', papel: '#FF8FB1' }, { taco: SRC.helecho, tinta: '#000000', papel: '#FFC20E' },
];

// ---------- disposición ----------
interface Nivel { y: number; h: number; suelo: number; fondo: number } // fondo: profundidad del piso para repartir gente
export interface Disposicion { W: number; H: number; u: number; e: number; plaza: Nivel; mezz: Nivel; anden: Nivel; via: number; escA: number; escB: number; tramoA: number; tramoB: number }
export function disponer(W: number, H: number): Disposicion {
  const u = Math.sqrt((W * H) / (1920 * 1080)); // 1 en 1920×1080; igual en 1080×1920
  const vertical = H > W;
  const [pp, pm] = vertical ? [0.36, 0.3] : [0.35, 0.29];
  const hp = H * pp, hm = H * pm, ha = H - hp - hm;
  const nivel = (y: number, h: number, suelo: number, fondo: number): Nivel => ({ y, h, suelo: y + h * suelo, fondo: h * fondo });
  const anden = nivel(hp + hm, ha, 0.52, 0.14), mezz = nivel(hp, hm, 0.86, 0.08), plaza = nivel(0, hp, 0.84, 0.1);
  // Escaleras mecánicas a ~35°: el recorrido horizontal sale del desnivel entre pisos (con tope para pantallas angostas).
  const tramo = (abajo: Nivel, arriba: Nivel) => Math.min((abajo.suelo + abajo.fondo / 2 - arriba.suelo - arriba.fondo / 2) * 1.35, W * 0.3);
  return {
    W, H, u, e: Math.min(u, W / 1500), // e: escala del mobiliario (más chico si la pantalla es angosta)
    plaza, mezz, anden,
    via: anden.y + anden.h * 0.9,
    escA: W * 0.06, // pie de la escalera andén → mezanina (izquierda, sube hacia la derecha)
    escB: W * 0.94, // pie de la escalera mezanina → plaza (derecha, sube hacia la izquierda)
    tramoA: tramo(anden, mezz), tramoB: tramo(mezz, plaza),
  };
}
// 0 andén · 1 mezanina · 2 plaza
const nivelDe = (timbres: number) => (timbres >= 3 ? 0 : timbres === 2 ? 1 : 2);

// ---------- personas en escena ----------
interface Avatar {
  p: Persona;
  nivel: number;
  x: number;
  hondo: number; // 0..1 dentro del piso
  dir: 1 | -1;
  vel: number;
  fase: number;
  subiendo?: { t: number; desde: [number, number]; hasta: [number, number]; nivel: number }; // en la escalera (hoy, bajando)
  objetivo?: number; // x de la escalera a la que camina para bajar
  destacado: number; // ms hasta el que se muestra su nombre
  entrando?: boolean; // recién llegada: entra caminando a la plaza desde un costado
}
// ---------- cuadros de la mezanina ----------
interface Cuadro { obra: Obra | null; antes: Obra | null; desde: number } // antes: la que sale durante el barrido
interface Muro { c3: { sx: number; sy: number; sw: number; sh: number }; marcos: { x: number; y: number }[]; lado: number }
const BORDE = 6, PIE = 26, CICLO_CUADRO = 8000, BARRIDO_CUADRO = 900; // BORDE y PIE en unidades de e
const CLASES: ClaseObra[] = ['mosaico', 'grabado', 'graffiti', 'juego', 'foto'];
const COLOR_CLASE: Record<ClaseObra, string> = { mosaico: C.Celeste, grabado: C.Verde, graffiti: C.Rosa, juego: C.Morado, foto: C.Amarillo };

interface Particula { x: number; y: number; vx: number; vy: number; vida: number; color: string; r: number }

const PERIODO_TREN = 45000, ENTRA = 3500, DETENIDO = 9000, SALE = 3500;

export class Estacion {
  d: Disposicion;
  avatares: Avatar[] = [];
  particulas: Particula[] = [];
  reloj = 0;
  trenes = 0; // cuántos trenes han pasado
  azar: () => number;
  quieto: boolean;
  cuadros: Cuadro[] = []; // los cuadros de la mezanina, con la obra que muestra cada uno
  private mostrada = new Map<string, number>(); // id de la obra → cuándo entró por última vez a un cuadro
  private muro: { W: number; H: number; m: Muro } | null = null;
  private capaAnden: { llave: string; c: HTMLCanvasElement } | null = null;
  private capaPlaza: { llave: string; c: HTMLCanvasElement } | null = null;

  constructor(d: Disposicion, gente: Persona[], azar: () => number, quieto: boolean) {
    this.d = d; this.azar = azar; this.quieto = quieto;
    for (const p of gente) this.avatares.push(this.nuevo(p, false));
  }

  private nuevo(p: Persona, llega: boolean): Avatar {
    const r = this.azar, W = this.d.W;
    // Quien llega aparece en la plaza (por la izquierda, lejos del acceso al metro) y entra caminando.
    const a: Avatar = {
      p, nivel: llega ? 2 : nivelDe(p.timbres), x: llega ? -30 * this.d.u : W * (0.15 + r() * 0.7), hondo: r(), dir: llega ? 1 : r() < 0.5 ? 1 : -1,
      vel: (18 + r() * 22) * this.d.u, fase: r() * 10, destacado: 0, entrando: llega,
    };
    if (llega && nivelDe(p.timbres) < 2) a.objetivo = this.bajada(2); // ya traía timbres: baja de una
    return a;
  }

  // x donde empieza la escalera para bajar desde el nivel n (arriba de la escalera).
  private bajada(n: number) { return n === 2 ? this.d.escB - this.d.tramoB : this.d.escA + this.d.tramoA; }

  redimensionar(d: Disposicion) {
    const k = d.W / this.d.W;
    for (const a of this.avatares) { a.x *= k; a.vel *= d.u / this.d.u; }
    this.d = d;
  }

  llega(p: Persona) { const a = this.nuevo(p, true); a.destacado = this.reloj + 8000; this.avatares.push(a); }

  timbre(codigo: string, timbres: number) {
    const a = this.avatares.find(v => v.p.codigo === codigo);
    if (!a) return;
    a.p = { ...a.p, timbres };
    a.destacado = this.reloj + 8000;
    if (nivelDe(timbres) < a.nivel && !a.subiendo) a.objetivo = this.bajada(a.nivel);
    if (timbres >= ACTIVAS.length) this.confeti(a);
  }

  // Estado del tren: x del frente (0 = fuera por la derecha). `abierto` = detenido en el andén.
  tren() {
    const ciclo = this.reloj % PERIODO_TREN, n = Math.floor(this.reloj / PERIODO_TREN);
    const largo = this.d.W * 0.78, parado = (this.d.W - largo) / 2;
    if (ciclo < ENTRA) { const t = 1 - Math.pow(1 - ciclo / ENTRA, 3); return { x: this.d.W + 40 + (parado - this.d.W - 40) * t, largo, abierto: false, visible: true, n }; }
    if (ciclo < ENTRA + DETENIDO) return { x: parado, largo, abierto: true, visible: true, n };
    if (ciclo < ENTRA + DETENIDO + SALE) { const t = Math.pow((ciclo - ENTRA - DETENIDO) / SALE, 3); return { x: parado - (parado + largo + 60) * t, largo, abierto: false, visible: true, n }; }
    return { x: 0, largo, abierto: false, visible: false, n };
  }

  private confeti(a: Avatar) {
    const [x, y] = this.posicion(a);
    for (let i = 0; i < 40; i++) {
      const ang = this.azar() * Math.PI * 2, v = (80 + this.azar() * 220) * this.d.u;
      this.particulas.push({ x, y: y - 60 * this.d.u, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 160 * this.d.u, vida: 1.6, r: (3 + this.azar() * 4) * this.d.u,
        color: [C.Amarillo, C.Rosa, C.Celeste, C.Verde, C.Morado][i % 5] });
    }
  }

  private nivel(n: number) { return [this.d.anden, this.d.mezz, this.d.plaza][n]; }
  posicion(a: Avatar): [number, number] {
    if (a.subiendo) {
      const { t, desde, hasta } = a.subiendo;
      return [desde[0] + (hasta[0] - desde[0]) * t, desde[1] + (hasta[1] - desde[1]) * t];
    }
    const n = this.nivel(a.nivel);
    return [a.x, n.suelo + a.hondo * n.fondo];
  }

  paso(dtMs: number) {
    this.reloj += dtMs;
    const dt = dtMs / 1000, d = this.d;
    for (const a of this.avatares) {
      if (a.subiendo) { // en la escalera mecánica no se camina: la escalera los baja
        a.subiendo.t += dt / 3.2;
        if (a.subiendo.t >= 1) {
          a.nivel = a.subiendo.nivel; a.x = a.subiendo.hasta[0]; a.subiendo = undefined;
          a.dir = a.nivel === 1 ? -1 : 1; // a la mezanina se llega por la derecha; al andén, por la izquierda
          if (nivelDe(a.p.timbres) < a.nivel) a.objetivo = this.bajada(a.nivel);
        }
        continue;
      }
      a.fase += dt * 6;
      if (a.objetivo != null) {
        const falta = a.objetivo - a.x;
        a.dir = falta > 0 ? 1 : -1;
        a.x += a.dir * Math.min(Math.abs(falta), Math.max(a.vel * 3, 70 * d.u) * dt); // va decidida a la escalera
        if (Math.abs(falta) < 2) {
          const baja = a.nivel - 1, n = this.nivel(a.nivel), m = this.nivel(baja);
          const abajo = a.nivel === 2 ? d.escB : d.escA;
          a.hondo = 0.5; a.entrando = false;
          a.subiendo = { t: 0, desde: [a.x, n.suelo + n.fondo / 2], hasta: [abajo, m.suelo + m.fondo / 2], nivel: baja };
          a.objetivo = undefined;
        }
        continue;
      }
      a.x += a.dir * a.vel * (a.entrando ? 1.4 : 1) * dt;
      const min = d.W * 0.03, max = d.W * 0.97;
      if (a.entrando) { if (a.x > d.W * 0.08) a.entrando = false; continue; }
      if (a.x < min) { a.x = min; a.dir = 1; } else if (a.x > max) { a.x = max; a.dir = -1; }
      if (this.azar() < dt * 0.08) a.dir = (a.dir * -1) as 1 | -1;
    }
    for (const q of this.particulas) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 420 * d.u * dt; q.vida -= dt; }
    this.particulas = this.particulas.filter(q => q.vida > 0);
  }

  // ---------- dibujo ----------
  dibujar(ctx: CanvasRenderingContext2D, hora: number) {
    ctx.save();
    this.plaza(ctx, hora);
    this.mezanina(ctx);
    this.andenPixel(ctx);
    this.escaleras(ctx);
    const visibles = this.avatares.map(a => ({ a, pos: this.posicion(a) })).sort((p, q) => p.pos[1] - q.pos[1]);
    for (const { a, pos } of visibles) if (!this.tapadaPorTren(a, pos[0])) this.avatar(ctx, a, pos);
    this.trenDibujo(ctx);
    for (const q of this.particulas) { ctx.globalAlpha = Math.min(1, q.vida); ctx.fillStyle = q.color; ctx.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2); }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ---------- PLAZA · Orgánica ----------
  // Cielo según la hora del evento (10:00 → 20:00): día celeste, tarde dorada, atardecer rosa y lapislázuli, con nubes de
  // papel. Delante, la cordillera y los cerros recortados en papel, árboles nativos, pasto, el piso de maicillo,
  // maceteros, bancas, faroles y la boca del metro con su luz cálida. Lo quieto se pinta una vez (capaPlaza) por tamaño
  // de pantalla y por media hora (los faroles se encienden de tarde).
  private plaza(ctx: CanvasRenderingContext2D, hora: number) {
    const { W, H, u, plaza } = this.d;
    const t = Math.min(1, Math.max(0, (hora - 10) / 10));
    const g = ctx.createLinearGradient(0, plaza.y, 0, plaza.suelo);
    if (t < 0.7) { g.addColorStop(0, C.Celeste); g.addColorStop(1, C.Hueso); }
    else if (t < 0.85) { g.addColorStop(0, C.Celeste); g.addColorStop(0.6, '#FFE29A'); g.addColorStop(1, C.Rosa); }
    else { g.addColorStop(0, C.Lapis); g.addColorStop(0.55, C.Rosa); g.addColorStop(1, C.Amarillo); }
    ctx.fillStyle = g; ctx.fillRect(0, plaza.y, W, plaza.h);
    // Sol que cruza el cielo durante el día
    const sol = imagen(SRC.sol);
    if (sol) {
      const lado = plaza.h * 0.3, x = W * (0.1 + 0.5 * t) - lado / 2, y = plaza.y + plaza.h * (0.36 - Math.sin(t * Math.PI) * 0.22) - lado / 2;
      ctx.save(); ctx.translate(x + lado / 2, y + lado / 2); ctx.rotate(this.quieto ? 0 : this.reloj / 9000);
      ctx.drawImage(raster(sol, lado, lado), -lado / 2, -lado / 2); ctx.restore();
    }
    // nubes de papel que avanzan muy lento
    const nube = this.nube(plaza.h * 0.16);
    for (let i = 0; i < 4; i++) {
      const vx = (this.quieto ? 0 : this.reloj / 1000) * (6 + i * 2) * u, ancho = nube.width / Math.min(window.devicePixelRatio || 1, 2);
      const x = ((W * (0.08 + i * 0.29) + vx) % (W + ancho)) - ancho, y = plaza.y + plaza.h * (0.1 + (i % 2) * 0.13);
      ctx.drawImage(nube, x, y, ancho * (1 - (i % 2) * 0.25), nube.height / Math.min(window.devicePixelRatio || 1, 2) * (1 - (i % 2) * 0.25));
    }
    const k = Math.min(window.devicePixelRatio || 1, 2), noche = t >= 0.7 ? 1 : 0, llave = `${W}|${H}|${k}|${noche}`;
    if (!this.capaPlaza || this.capaPlaza.llave !== llave) {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(W * k)); c.height = Math.max(1, Math.round(plaza.h * k));
      const x = c.getContext('2d')!;
      x.setTransform(k, 0, 0, k, 0, -plaza.y * k);
      const completa = this.fondoPlaza(x, noche === 1);
      this.capaPlaza = { llave: completa ? llave : '', c };
    }
    ctx.drawImage(this.capaPlaza.c, 0, plaza.y, W, plaza.h);
    this.banderines(ctx);
    this.cartel(ctx, 'Plaza · Orgánica', W * 0.015, plaza.y + 14 * u, C.Verde);
  }

  // Nube de papel: tres o cuatro lóbulos hueso con un borde suave y su sombra.
  private nubeHecha: { L: number; c: HTMLCanvasElement } | null = null;
  private nube(alto: number): HTMLCanvasElement {
    const k = Math.min(window.devicePixelRatio || 1, 2), L = Math.max(8, Math.round(alto * k));
    if (this.nubeHecha && this.nubeHecha.L === L) return this.nubeHecha.c;
    const c = document.createElement('canvas'); c.width = L * 3; c.height = L;
    const x = c.getContext('2d')!;
    const forma = (dy: number) => {
      x.beginPath();
      x.moveTo(L * 0.2, L * 0.85 + dy);
      x.bezierCurveTo(L * 0.0, L * 0.85 + dy, L * 0.05, L * 0.45 + dy, L * 0.42, L * 0.5 + dy);
      x.bezierCurveTo(L * 0.5, L * 0.1 + dy, L * 1.15, L * 0.05 + dy, L * 1.25, L * 0.42 + dy);
      x.bezierCurveTo(L * 1.45, L * 0.12 + dy, L * 2.05, L * 0.2 + dy, L * 2.0, L * 0.5 + dy);
      x.bezierCurveTo(L * 2.6, L * 0.4 + dy, L * 2.95, L * 0.85 + dy, L * 2.6, L * 0.85 + dy);
      x.closePath();
    };
    forma(L * 0.06); x.fillStyle = 'rgba(43,75,216,.12)'; x.fill();
    forma(0); x.fillStyle = '#FBF7EF'; x.fill();
    x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = Math.max(1, L * 0.025); x.stroke();
    x.strokeStyle = 'rgba(127,200,248,.5)'; x.lineWidth = Math.max(1, L * 0.02);
    x.beginPath(); x.moveTo(L * 0.6, L * 0.7); x.quadraticCurveTo(L * 1.2, L * 0.62, L * 1.8, L * 0.72); x.stroke();
    this.nubeHecha = { L, c };
    return c;
  }

  // Devuelve false si alguna imagen todavía no estaba.
  private fondoPlaza(ctx: CanvasRenderingContext2D, noche: boolean): boolean {
    const { W, u, e, plaza, escB, tramoB, mezz } = this.d;
    // Si las fuentes no llegaron todavía, el letrero sale con otra: se vuelve a pintar cuando lleguen.
    let completa = !document.fonts || document.fonts.status === 'loaded';
    let semilla = 17; const azar = () => ((semilla = (semilla * 9301 + 49297) % 233280) / 233280);
    const suelo = plaza.suelo, fin = plaza.y + plaza.h, trazo = Math.max(1, 2 * e);
    const linea = (color = 'rgba(0,0,0,.55)', w = trazo) => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); };
    // Silueta suave que pasa por puntos (curvas cuadráticas por los puntos medios).
    const silueta = (pts: [number, number][], base: number) => {
      ctx.beginPath(); ctx.moveTo(pts[0][0], base); ctx.lineTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
      const ul = pts[pts.length - 1]; ctx.lineTo(ul[0], ul[1]); ctx.lineTo(ul[0], base); ctx.closePath();
    };
    // cordillera con nieve, recortada en papel
    const cordillera: [number, number][] = [];
    for (let i = 0; i <= 14; i++) cordillera.push([W * (i / 14) + (i ? (azar() - 0.5) * W * 0.03 : 0) - W * 0.02, suelo - plaza.h * (0.36 + (i % 2 ? 0.14 : 0) + azar() * 0.12)]);
    cordillera[cordillera.length - 1][0] = W * 1.02;
    const quebrada = () => { ctx.beginPath(); ctx.moveTo(cordillera[0][0], suelo); for (const [px, py] of cordillera) ctx.lineTo(px, py); ctx.lineTo(cordillera[cordillera.length - 1][0], suelo); ctx.closePath(); };
    quebrada(); ctx.fillStyle = noche ? '#8E8FD6' : '#9FC2E6'; ctx.fill(); linea('rgba(43,75,216,.5)');
    for (let i = 1; i < cordillera.length - 1; i += 2) { // nieve en las cumbres altas
      const [px, py] = cordillera[i], [lx, ly] = cordillera[i - 1], [rx, ry] = cordillera[i + 1], f = 0.32;
      const ax = px + (lx - px) * f, ay = py + (ly - py) * f, bx = px + (rx - px) * f, by = py + (ry - py) * f;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ax, ay);
      ctx.lineTo(ax + (bx - ax) * 0.25, ay + (by - ay) * 0.25 - (ay - py) * 0.25); ctx.lineTo(ax + (bx - ax) * 0.45, Math.max(ay, by) + (Math.max(ay, by) - py) * 0.05);
      ctx.lineTo(ax + (bx - ax) * 0.7, ay + (by - ay) * 0.7 - (by - py) * 0.2); ctx.lineTo(bx, by); ctx.closePath();
      ctx.fillStyle = '#FBF7EF'; ctx.fill(); linea('rgba(43,75,216,.4)', Math.max(1, 1.5 * e));
    }
    // cerros verdes delante
    const cerros: [number, number][] = [];
    for (let i = 0; i <= 9; i++) cerros.push([W * (i / 9) - W * 0.03 + (azar() - 0.5) * W * 0.04, suelo - plaza.h * (0.14 + azar() * 0.12)]);
    cerros[cerros.length - 1][0] = W * 1.03;
    silueta(cerros, suelo); ctx.fillStyle = '#7CC796'; ctx.fill(); linea('rgba(11,94,51,.45)');
    // árboles nativos (peumos y quillayes de copa redonda), detrás de la gente
    const arbol = (x: number, alto: number, tono: number) => {
      const copa = alto * 0.42, base = suelo + 2 * u;
      ctx.beginPath(); ctx.moveTo(x - alto * 0.035, base); ctx.quadraticCurveTo(x - alto * 0.02, base - alto * 0.4, x - alto * 0.06, base - alto * 0.62);
      ctx.lineTo(x + alto * 0.05, base - alto * 0.6); ctx.quadraticCurveTo(x + alto * 0.02, base - alto * 0.35, x + alto * 0.04, base); ctx.closePath();
      ctx.fillStyle = '#7A4E2D'; ctx.fill(); linea();
      const verdes = tono ? ['#0B8F48', '#00A651', '#3DBB6E'] : ['#1E7A45', '#2E9A58', '#5CC07E'];
      const lobulos: [number, number, number][] = [[-0.55, 0.15, 0.62], [0.5, 0.2, 0.6], [0, -0.25, 0.75], [-0.1, 0.35, 0.65]];
      for (let capa = 0; capa < 3; capa++) {
        ctx.beginPath();
        for (const [dx, dy, r] of lobulos) { const cx = x + dx * copa * 0.9 - capa * copa * 0.05, cy = base - alto * 0.72 + dy * copa - capa * copa * 0.08; ctx.moveTo(cx + r * copa * (1 - capa * 0.25), cy); ctx.arc(cx, cy, r * copa * (1 - capa * 0.25), 0, Math.PI * 2); }
        ctx.fillStyle = verdes[capa]; ctx.fill();
        if (capa === 0) linea('rgba(0,0,0,.45)');
      }
      ctx.fillStyle = 'rgba(244,238,227,.5)'; // brillos de papel
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(x + (azar() - 0.5) * copa * 1.2, base - alto * 0.78 + (azar() - 0.5) * copa * 0.8, copa * 0.09, copa * 0.04, -0.5, 0, Math.PI * 2); ctx.fill(); }
    };
    arbol(W * 0.035, plaza.h * 0.62, 0); arbol(W * 0.36, plaza.h * 0.5, 1); arbol(W * 0.585, plaza.h * 0.56, 0); arbol(W * 0.985, plaza.h * 0.6, 1);
    // araucarias de Teatro de Papel
    const planta = (src: string, x: number, alto: number) => {
      const im = imagen(src); if (!im) { completa = false; return; }
      const w = alto * (im.naturalWidth / im.naturalHeight || 1);
      ctx.drawImage(raster(im, w, alto), x - w / 2, suelo - alto + 4 * u);
    };
    planta(SRC.araucaria, W * 0.12, plaza.h * 0.95);
    planta(SRC.araucaria, W * 0.64, plaza.h * 0.82);
    // pasto con borde ondulado y matas
    const pasto: [number, number][] = [];
    for (let i = 0; i <= 40; i++) pasto.push([W * (i / 40), suelo - 10 * e - (i % 2) * 5 * e - azar() * 3 * e]);
    silueta(pasto, fin); ctx.fillStyle = C.Verde; ctx.fill(); linea('rgba(0,0,0,.4)');
    ctx.strokeStyle = '#0B8F48'; ctx.lineWidth = Math.max(1, 1.6 * e); ctx.lineCap = 'round';
    for (let x = 6 * e; x < W; x += 13 * e + azar() * 10 * e) {
      const y = suelo - 4 * e - azar() * 4 * e;
      ctx.beginPath(); ctx.moveTo(x, y + 4 * e); ctx.quadraticCurveTo(x - 1 * e, y, x - 3 * e, y - 3 * e); ctx.moveTo(x + 2 * e, y + 4 * e); ctx.quadraticCurveTo(x + 2 * e, y - 1 * e, x + 5 * e, y - 3 * e); ctx.stroke();
    }
    // piso de maicillo con piedrecitas; el borde de arriba es una solera suave
    const borde: [number, number][] = [];
    for (let i = 0; i <= 24; i++) borde.push([W * (i / 24), suelo - 3 * e + Math.sin(i * 1.7) * 1.5 * e]);
    silueta(borde, fin); ctx.fillStyle = '#E9DCC0'; ctx.fill(); linea('#BFA77A', Math.max(1, 3 * e));
    for (let i = 0; i < W / (5 * e); i++) {
      const px = azar() * W, py = suelo + azar() * (fin - suelo - 6 * u), r = (0.8 + azar() * 1.8) * e;
      ctx.fillStyle = azar() < 0.5 ? '#D6C39C' : '#F5EEDD'; ctx.beginPath(); ctx.ellipse(px, py, r * 1.4, r, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(122,78,45,.18)'; ctx.fillRect(0, fin - 6 * u, W, 6 * u);
    // la boca del metro: el hueco por donde baja la escalera, con luz cálida que sube
    const x0 = escB - tramoB, y0 = suelo + plaza.fondo / 2, y1 = mezz.suelo + mezz.fondo / 2, pend = (y1 - y0) / tramoB;
    const xh = x0 + (fin - y0) / pend; // donde la escalera cruza el borde de abajo de la plaza
    ctx.beginPath(); ctx.moveTo(x0 - 30 * e, y0 + 6 * e); ctx.lineTo(x0 + 40 * e, y0 + 6 * e); ctx.lineTo(xh + 70 * e, fin); ctx.lineTo(x0 - 30 * e, fin); ctx.closePath();
    const luz = ctx.createLinearGradient(0, y0, 0, fin);
    luz.addColorStop(0, '#5A3A22'); luz.addColorStop(1, '#FFC86B');
    ctx.fillStyle = luz; ctx.fill(); linea(C.Negro, Math.max(1, 2.5 * e));
    // acceso: techo de vidrio curvo, pilares redondeados, letrero y tótem
    const xi = x0 - 40 * e, xf = Math.min(xi + 260 * e, escB), techo = suelo - 120 * e;
    const halo = ctx.createRadialGradient(xi + 60 * e, suelo - 30 * e, 4 * e, xi + 60 * e, suelo - 30 * e, 140 * e);
    halo.addColorStop(0, noche ? 'rgba(255,200,107,.55)' : 'rgba(255,200,107,.3)'); halo.addColorStop(1, 'rgba(255,200,107,0)');
    ctx.fillStyle = halo; ctx.fillRect(xi - 120 * e, techo - 40 * e, 360 * e, 200 * e);
    ctx.beginPath(); ctx.moveTo(xi - 10 * e, techo + 10 * e); ctx.quadraticCurveTo((xi + xf) / 2, techo - 34 * e, xf + 10 * e, techo + 10 * e);
    ctx.lineTo(xf + 10 * e, techo + 18 * e); ctx.quadraticCurveTo((xi + xf) / 2, techo - 24 * e, xi - 10 * e, techo + 18 * e); ctx.closePath();
    ctx.fillStyle = 'rgba(127,200,248,.6)'; ctx.fill(); linea(C.Negro, Math.max(1, 2.5 * e));
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = Math.max(1, 2 * e);
    ctx.beginPath(); ctx.moveTo(xi + 20 * e, techo + 6 * e); ctx.quadraticCurveTo((xi + xf) / 2, techo - 22 * e, xf - 40 * e, techo + 2 * e); ctx.stroke();
    for (const px of [xi, xf - 7 * e]) {
      ctx.fillStyle = C.Negro; ctx.beginPath(); ctx.roundRect(px, techo + 12 * e, 7 * e, suelo - techo - 10 * e, 3.5 * e); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px + 3.5 * e, suelo + 1 * e, 9 * e, 3 * e, 0, 0, Math.PI * 2); ctx.fill();
    }
    // letrero colgante «METRO» con luz
    const lx = (xi + xf) / 2 + 30 * e, ly = techo + 22 * e;
    ctx.fillStyle = C.Negro; ctx.fillRect(lx - 1 * e, techo + 10 * e, 2 * e, 12 * e);
    ctx.beginPath(); ctx.roundRect(lx - 34 * e, ly, 68 * e, 22 * e, 11 * e); ctx.fill();
    ctx.fillStyle = '#E2001A'; ctx.beginPath(); ctx.arc(lx - 22 * e, ly + 11 * e, 7 * e, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.Hueso; ctx.font = `800 ${11 * e}px "Bricolage Grotesque", sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('METRO', lx - 12 * e, ly + 11.5 * e);
    ctx.fillStyle = C.Hueso; ctx.font = `800 ${8 * e}px "Bricolage Grotesque", sans-serif`; ctx.textAlign = 'center'; ctx.fillText('M', lx - 22 * e, ly + 11.5 * e);
    // baranda alrededor de la boca
    ctx.strokeStyle = C.Negro; ctx.lineWidth = Math.max(1, 3 * e); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0 - 30 * e, y0 + 4 * e); ctx.lineTo(x0 - 30 * e, y0 - 26 * e); ctx.lineTo(x0 - 4 * e, y0 - 26 * e); ctx.stroke();
    for (let b = 1; b < 3; b++) { ctx.beginPath(); ctx.moveTo(x0 - 30 * e + b * 9 * e, y0 - 26 * e); ctx.lineTo(x0 - 30 * e + b * 9 * e, y0 + 2 * e); ctx.lineWidth = Math.max(1, 1.5 * e); ctx.stroke(); }
    // tótem de la estación
    const tam = Math.max(1, Math.round(2 * e)), ancho = (8 * AVANCE - 1) * tam, tx = xi - ancho / 2 - 30 * e, ty = suelo - 170 * e;
    ctx.fillStyle = C.Negro; ctx.fillRect(tx - 3 * e, ty, 6 * e, suelo - ty);
    ctx.beginPath(); ctx.roundRect(tx - ancho / 2 - 8 * e, ty - 8 * e, ancho + 16 * e, 7 * tam + 16 * e, 6 * e); ctx.fill();
    this.textoPixel(ctx, 'ESTACION', tx - ancho / 2, ty, tam, C.Hueso);
    // maceteros de greda con plantas
    const macetero = (x: number, s: number, verde: string) => {
      const w = 34 * s, h = 26 * s, base = suelo + 6 * e;
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(x, base, w * 0.6, 4 * s, 0, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 7; i++) { // hojas
        const a = -Math.PI / 2 + (i - 3) * 0.42, l = (28 + (i % 3) * 8) * s;
        ctx.beginPath(); ctx.moveTo(x, base - h + 2 * s); ctx.quadraticCurveTo(x + Math.cos(a - 0.4) * l * 0.7, base - h + Math.sin(a - 0.4) * l * 0.7, x + Math.cos(a) * l, base - h + Math.sin(a) * l);
        ctx.quadraticCurveTo(x + Math.cos(a + 0.4) * l * 0.7, base - h + Math.sin(a + 0.4) * l * 0.7, x, base - h + 2 * s); ctx.fillStyle = i % 2 ? verde : '#0B8F48'; ctx.fill(); linea('rgba(0,0,0,.35)', Math.max(1, 1.2 * s));
      }
      ctx.beginPath(); ctx.moveTo(x - w / 2, base - h); ctx.lineTo(x + w / 2, base - h); ctx.quadraticCurveTo(x + w * 0.42, base - h * 0.3, x + w * 0.32, base); ctx.lineTo(x - w * 0.32, base); ctx.quadraticCurveTo(x - w * 0.42, base - h * 0.3, x - w / 2, base - h); ctx.closePath();
      ctx.fillStyle = '#C96F45'; ctx.fill(); linea(C.Negro, Math.max(1, 1.8 * s));
      ctx.fillStyle = '#A9552F'; ctx.fillRect(x - w / 2, base - h, w, 5 * s);
      ctx.strokeStyle = 'rgba(244,238,227,.6)'; ctx.lineWidth = Math.max(1, 1.5 * s); ctx.beginPath(); ctx.moveTo(x - w * 0.3, base - h * 0.55); ctx.quadraticCurveTo(x, base - h * 0.4, x + w * 0.3, base - h * 0.55); ctx.stroke();
    };
    // bancas de madera con patas curvas
    const banca = (x: number) => {
      const w = 74 * e, y = suelo + 2 * e;
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(x, y + 3 * e, w * 0.55, 4 * e, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.Negro; ctx.lineWidth = Math.max(1, 3.5 * e); ctx.lineCap = 'round';
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + d * w * 0.38, y); ctx.quadraticCurveTo(x + d * w * 0.3, y - 10 * e, x + d * w * 0.36, y - 14 * e); ctx.lineTo(x + d * w * 0.4, y - 34 * e); ctx.stroke(); }
      for (const [dy, h] of [[-16, 6], [-27, 5], [-36, 5]] as const) {
        ctx.beginPath(); ctx.roundRect(x - w / 2, y + dy * e, w, h * e, 2.5 * e); ctx.fillStyle = dy === -16 ? '#C99A5B' : '#B5844A'; ctx.fill(); linea(C.Negro, Math.max(1, 1.6 * e));
      }
    };
    // faroles con luz cálida (más fuerte de tarde)
    const farol = (x: number) => {
      const alto = 128 * e, y = suelo + 2 * e;
      const brillo = ctx.createRadialGradient(x, y - alto + 8 * e, 2 * e, x, y - alto + 8 * e, (noche ? 70 : 40) * e);
      brillo.addColorStop(0, noche ? 'rgba(255,214,120,.8)' : 'rgba(255,214,120,.35)'); brillo.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = brillo; ctx.fillRect(x - 80 * e, y - alto - 70 * e, 160 * e, 160 * e);
      ctx.strokeStyle = C.Negro; ctx.lineWidth = Math.max(1, 4 * e); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - alto + 14 * e); ctx.quadraticCurveTo(x, y - alto - 4 * e, x + 10 * e, y - alto - 6 * e); ctx.stroke();
      ctx.fillStyle = C.Negro; ctx.beginPath(); ctx.ellipse(x, y, 8 * e, 3 * e, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 2 * e, y - alto - 2 * e); ctx.quadraticCurveTo(x + 12 * e, y - alto - 16 * e, x + 22 * e, y - alto - 2 * e); ctx.closePath(); ctx.fill();
      ctx.fillStyle = noche ? '#FFE29A' : '#FFF3CF'; ctx.beginPath(); ctx.ellipse(x + 12 * e, y - alto + 3 * e, 6 * e, 8 * e, 0, 0, Math.PI * 2); ctx.fill(); linea(C.Negro, Math.max(1, 1.5 * e));
    };
    farol(W * 0.2); farol(W * 0.555);
    banca(W * 0.075); banca(W * 0.4);
    macetero(W * 0.255, e, C.Verde); macetero(W * 0.495, e * 0.85, '#3DBB6E');
    // plantas chicas adelante: el helecho, el quisco y la flor del Teatro de Papel
    planta(SRC.helecho, W * 0.3, plaza.h * 0.17);
    planta(SRC.quisco, W * 0.6, plaza.h * 0.2);
    planta(SRC.flor, W * 0.46, plaza.h * 0.12);
    return completa;
  }

  // Banderines hechos con los grabados del Taller de Grabado, colgados de un cordel entre dos postes. Pocos, a propósito.
  private banderines(ctx: CanvasRenderingContext2D) {
    const { W, u, e, plaza } = this.d;
    const x0 = W * 0.27, x1 = W * 0.52, alto = plaza.h * 0.5, y0 = plaza.suelo - alto, comba = 26 * e;
    ctx.fillStyle = C.Negro;
    for (const x of [x0, x1]) { ctx.fillRect(x - 3 * e, y0 - 4 * e, 6 * e, alto + 4 * u); ctx.fillRect(x - 7 * e, y0 - 8 * e, 14 * e, 6 * e); }
    ctx.strokeStyle = C.Negro; ctx.lineWidth = 2 * e;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, y0 + comba * 2, x1, y0); ctx.stroke();
    // Los grabados de la gente (los más nuevos) completan el cordel; el resto, de prueba.
    const reales = enVivo.grabados.filter(listaImagen);
    const n = GRABADOS.length, w = Math.min(46 * e, (x1 - x0) / (n + 0.6)), h = w * 1.25;
    for (let i = 0; i < n; i++) {
      const f = (i + 0.8) / (n + 0.6), x = x0 + (x1 - x0) * f, y = y0 + comba * 4 * f * (1 - f) * 0.98;
      const mece = this.quieto ? 0 : Math.sin(this.reloj / 1100 + i * 1.3) * 0.06;
      const gr = GRABADOS[i];
      ctx.save(); ctx.translate(x, y); ctx.rotate(mece);
      ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.lineTo(0, h); ctx.closePath();
      ctx.fillStyle = gr.papel; ctx.fill(); ctx.strokeStyle = C.Negro; ctx.lineWidth = 1.5 * e; ctx.stroke();
      ctx.clip();
      const real = reales[i];
      if (real) { const k = Math.max(w / real.naturalWidth, h / real.naturalHeight); ctx.drawImage(real, -real.naturalWidth * k / 2, 0, real.naturalWidth * k, real.naturalHeight * k); }
      else { const im = imagen(gr.taco); if (im) { const lado = w * 0.62; ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(entintar(im, gr.tinta, lado), -lado / 2, h * 0.08); } }
      ctx.restore();
    }
  }

  // ---------- MEZANINA · Geométrica ----------
  // Boletería, máquinas de carga, la pantalla C3, los cuadros con las obras de la gente (mosaico, grabado, graffiti,
  // Hora punta y Fotomatón), letreros colgantes, torniquetes y el piso de damero.
  private mezanina(ctx: CanvasRenderingContext2D) {
    const { W, u, e, mezz } = this.d;
    const techo = mezz.y + 10 * u, piso = mezz.suelo, muro = piso - techo;
    ctx.fillStyle = C.Hueso; ctx.fillRect(0, mezz.y, W, mezz.h);
    // muro de baldosas grandes
    ctx.fillStyle = '#ECE3D3'; const b = 40 * e;
    for (let y = techo, f = 0; y < piso; y += b, f++) for (let x = (f % 2) * b; x < W; x += b * 2) ctx.fillRect(x, y, b, Math.min(b, piso - y));
    // losa y luces
    ctx.fillStyle = C.Negro; ctx.fillRect(0, mezz.y, W, 10 * u);
    for (let x = W * 0.05; x < W; x += W * 0.1) { ctx.fillStyle = C.Amarillo; ctx.fillRect(x, mezz.y + 10 * u, 40 * e, 4 * e); }
    // pantalla C3 al centro y, a los lados, los cuadros con las obras de la gente
    const m = this.disponerMuro(), { sx, sy, sw, sh } = m.c3;
    ctx.fillStyle = C.Negro; ctx.fillRect(sx - 6 * e, sy - 6 * e, sw + 12 * e, sh + 12 * e);
    ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip(); ctx.translate(sx, sy);
    dibujarC3(ctx, sw, sh, c3EnTiempo(this.quieto ? 2000 : this.reloj));
    ctx.restore();
    ctx.fillStyle = C.Negro; ctx.font = `700 ${11 * e}px "DM Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('EN VIVO · ESTACIÓN AUDIOREACTIVA', W / 2, sy + sh + 10 * e);
    // boletería y máquinas de carga (izquierda)
    this.boleteria(ctx, W * 0.22, piso, muro);
    for (const x of [W * 0.285, W * 0.305]) this.maquina(ctx, x, piso);
    const ahora = this.quieto ? performance.now() : this.reloj;
    this.actualizarCuadros(m.marcos.length, ahora);
    m.marcos.forEach((r, i) => this.cuadro(ctx, r, this.cuadros[i], i, m.lado, ahora));
    // letreros colgantes
    this.letrero(ctx, 'Andenes ↓', W * 0.16, mezz.y + 10 * u, C.Morado);
    this.letrero(ctx, 'Salida ↑', W * 0.84, mezz.y + 10 * u, C.Verde);
    // torniquetes
    for (const x of [W * 0.43, W * 0.57]) for (let i = -1; i <= 1; i++) this.torniquete(ctx, x + i * 30 * e, piso);
    // piso de damero (dos filas de baldosas)
    const lado = 24 * u, y0 = piso - 6 * u, alto = (mezz.y + mezz.h - 6 * u - y0) / 2;
    for (let f = 0; f < 2; f++) for (let x = 0, k = 0; x < W; x += lado, k++) {
      ctx.fillStyle = (k + f) % 2 ? C.Lapis : C.Hueso;
      ctx.fillRect(x, y0 + f * alto, lado, alto);
    }
    ctx.fillStyle = C.Negro; ctx.fillRect(0, mezz.y + mezz.h - 6 * u, W, 6 * u);
    this.cartel(ctx, 'Mezanina · Geométrica', W * 0.015, mezz.y + 20 * u, C.Azul);
  }

  // Dónde van la pantalla C3 y los cuadros. Los cuadros cuelgan a la altura de la pantalla, en los tramos libres del
  // muro: no tapan la boletería, la pantalla ni la escalera de la plaza. Se calcula solo cuando cambia el tamaño.
  private disponerMuro(): Muro {
    const { W, H } = this.d;
    if (this.muro && this.muro.W === W && this.muro.H === H) return this.muro.m;
    const { u, e, mezz, plaza, escB, tramoB } = this.d;
    const techo = mezz.y + 10 * u, piso = mezz.suelo, muro = piso - techo;
    const sw = Math.min(W * 0.2, muro * 0.95), sh = Math.min(muro * 0.55, sw * 0.62), sx = W / 2 - sw / 2;
    // bajo el cartel del nivel y los letreros colgantes
    const sy = Math.max(techo + muro * 0.12, mezz.y + 10 * u + 42 * e, mezz.y + 50 * u);
    const lado = Math.max(40 * e, sh - PIE * e + 6 * e), b = BORDE * e, g = 22 * e, ancho = lado + 2 * b;
    const abajo = sy + lado + PIE * e + b;
    const tapa: [number, number][] = [[sx - 6 * e - g, sx + sw + 6 * e + g]];
    // boletería y máquinas, si el cuadro bajaría hasta ellas
    if (abajo > piso - Math.min(muro * 0.62, 120 * e) - 8 * e) tapa.push([W * 0.22 - 55 * e - g, W * 0.305 + 13 * e + g]);
    // escalera mezanina → plaza: desde donde su estructura (34e bajo los peldaños) baja del techo de los cuadros
    const y0 = plaza.suelo + plaza.fondo / 2, y1 = mezz.suelo + mezz.fondo / 2, x0 = escB - tramoB;
    const k = Math.max(0, Math.min(1, (sy - b - 34 * e - y0) / (y1 - y0)));
    tapa.push([x0 + tramoB * k - 56 * e - g, W]);
    tapa.sort((p, q) => p[0] - q[0]);
    // tramos libres y cuántos cuadros caben en cada uno, centrados
    const marcos: { x: number; y: number }[] = [];
    let desde = W * 0.02;
    for (const [i, f] of tapa.concat([[W * 0.98, W]])) {
      const libre = i - desde, n = Math.max(0, Math.floor((libre + g) / (ancho + g)));
      const x = desde + (libre - (n * ancho + (n - 1) * g)) / 2;
      for (let q = 0; q < n; q++) marcos.push({ x: x + q * (ancho + g) + b, y: sy });
      desde = Math.max(desde, f);
    }
    // Como mucho seis: los más cercanos a la pantalla.
    marcos.sort((p, q) => Math.abs(p.x + lado / 2 - W / 2) - Math.abs(q.x + lado / 2 - W / 2));
    marcos.length = Math.min(marcos.length, 6);
    marcos.sort((p, q) => p.x - q.x);
    const m: Muro = { c3: { sx, sy, sw, sh }, marcos, lado };
    this.muro = { W, H, m };
    return m;
  }

  // Qué obra muestra cada cuadro. Las obras reales mandan: llenan primero los cuadros vacíos o con ejemplos, y una obra
  // recién llegada entra al tiro en el cuadro que lleva más tiempo. Si hay más obras que cuadros, cada cuadro cambia
  // cada ~8 s por la que hace más tiempo que no se ve (las nunca vistas primero, de la más nueva a la más vieja).
  private actualizarCuadros(n: number, ahora: number) {
    while (this.cuadros.length < n) this.cuadros.push({ obra: null, antes: null, desde: ahora });
    this.cuadros.length = n;
    const reales = enVivo.obras.filter(o => listaImagen(o.im));
    const lista = reales.length >= n ? reales : reales.concat(enVivo.ejemplos.filter(o => listaImagen(o.im)));
    const enMuro = new Set<string>();
    for (const c of this.cuadros) if (c.obra) enMuro.add(c.obra.id);
    const siguiente = (soloNuevas = false): Obra | null => {
      let mejor: Obra | null = null, t = Infinity;
      for (const o of lista) {
        if (enMuro.has(o.id) || (soloNuevas && !o.nueva)) continue;
        const v = this.mostrada.has(o.id) ? this.mostrada.get(o.id)! : -Infinity;
        if (v < t) { t = v; mejor = o; }
      }
      return mejor;
    };
    const poner = (c: Cuadro, o: Obra) => {
      if (c.obra) enMuro.delete(c.obra.id);
      c.antes = c.obra; c.obra = o; c.desde = ahora; o.nueva = false;
      enMuro.add(o.id); this.mostrada.set(o.id, ahora);
    };
    for (const c of this.cuadros) {
      if (c.obra && !c.obra.ejemplo) continue;
      const o = siguiente();
      if (o && (!c.obra || !o.ejemplo)) poner(c, o);
    }
    const nueva = siguiente(true);
    if (nueva) {
      let viejo: Cuadro | null = null;
      for (const c of this.cuadros) if (ahora - c.desde >= 2500 && (!viejo || c.desde < viejo.desde)) viejo = c;
      if (viejo) poner(viejo, nueva);
    }
    if (lista.length > n) this.cuadros.forEach((c, i) => {
      if (ahora - c.desde < CICLO_CUADRO + i * 1300) return; // cada cuadro con su ritmo: no cambian todos juntos
      const o = siguiente(); if (o) poner(c, o);
    });
    if (this.mostrada.size > 200) this.mostrada.forEach((_, id) => { if (!lista.some(o => o.id === id)) this.mostrada.delete(id); });
  }

  // Un cuadro: marco negro, la obra sobre paspartú hueso (entera, sin deformarse) y la cartela con quién la hizo.
  // Al cambiar de obra, la nueva entra con un barrido de arriba hacia abajo.
  private cuadro(ctx: CanvasRenderingContext2D, r: { x: number; y: number }, c: Cuadro, i: number, lado: number, ahora: number) {
    const { e } = this.d, { x, y } = r, b = BORDE * e;
    ctx.fillStyle = C.Negro; ctx.fillRect(x - b, y - b, lado + 2 * b, lado + PIE * e + 2 * b);
    const k = Math.min(window.devicePixelRatio || 1, 2);
    const lamina = (o: Obra | null) => ctx.drawImage(o ? paspartu(o.im, lado, k) : vacio(CLASES[i % CLASES.length], lado, k), x, y, lado, lado);
    const dentro = ahora - c.desde;
    const corte = this.quieto || !c.antes || dentro >= BARRIDO_CUADRO ? lado : lado * (1 - Math.pow(1 - dentro / BARRIDO_CUADRO, 3));
    if (corte < lado) lamina(c.antes);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, lado, corte); ctx.clip(); lamina(c.obra); ctx.restore();
    if (corte < lado) { ctx.fillStyle = C.Amarillo; ctx.fillRect(x, y + corte - 2 * e, lado, 3 * e); }
    // cartela: la experiencia y quién la hizo
    const o = corte < lado * 0.5 ? c.antes : c.obra;
    const clase = o ? o.clase : CLASES[i % CLASES.length], autor = o ? autorDe(o) : null;
    const ty = y + lado + b * 0.6, ancho = lado - 4 * e;
    ctx.fillStyle = COLOR_CLASE[clase]; ctx.fillRect(x + 2 * e, ty + 3.5 * e, 6 * e, 6 * e);
    ctx.fillStyle = 'rgba(244,238,227,.72)'; ctx.font = `700 ${8.5 * e}px "DM Sans", sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(ajustar(ctx, (NOMBRE_CORTO[clase] + (o && o.ejemplo ? ' · ejemplo' : '')).toUpperCase(), ancho - 10 * e), x + 11 * e, ty + 6.5 * e);
    ctx.fillStyle = C.Hueso; ctx.font = `700 ${10.5 * e}px "DM Sans", sans-serif`;
    ctx.fillText(ajustar(ctx, !o ? 'Tu obra aquí' : autor ? `hecho por ${autor}` : 'Sin firma', ancho), x + 2 * e, ty + 18.5 * e);
  }

  private boleteria(ctx: CanvasRenderingContext2D, x: number, piso: number, muro: number) {
    const { e } = this.d;
    const w = 110 * e, h = Math.min(muro * 0.62, 120 * e), y = piso - h;
    ctx.fillStyle = C.Azul; ctx.fillRect(x - w / 2, y, w, h);
    ctx.fillStyle = C.Negro; ctx.fillRect(x - w / 2, y, w, 20 * e);
    ctx.fillStyle = C.Hueso; ctx.font = `800 ${11 * e}px "DM Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('BOLETERÍA', x, y + 10.5 * e);
    ctx.fillStyle = 'rgba(127,200,248,.85)'; ctx.fillRect(x - w / 2 + 12 * e, y + 30 * e, w - 24 * e, h * 0.36);
    ctx.fillStyle = C.Negro; ctx.fillRect(x - 16 * e, y + 30 * e + h * 0.36, 32 * e, 5 * e);
    ctx.fillStyle = C.Hueso; ctx.fillRect(x - w / 2, piso - 16 * e, w, 4 * e);
  }

  private maquina(ctx: CanvasRenderingContext2D, x: number, piso: number) {
    const { e } = this.d;
    const w = 26 * e, h = 72 * e;
    ctx.fillStyle = C.Negro; ctx.fillRect(x - w / 2, piso - h, w, h);
    ctx.fillStyle = C.Celeste; ctx.fillRect(x - w / 2 + 4 * e, piso - h + 6 * e, w - 8 * e, 18 * e);
    ctx.fillStyle = C.Amarillo; ctx.fillRect(x - w / 2 + 4 * e, piso - h + 30 * e, w - 8 * e, 5 * e);
    ctx.fillStyle = C.Verde; ctx.fillRect(x - 3 * e, piso - h + 42 * e, 6 * e, 6 * e);
  }

  private letrero(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, color: string) {
    const { e } = this.d;
    ctx.font = `800 ${13 * e}px "DM Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(texto).width + 24 * e, h = 24 * e, cuelga = 12 * e;
    ctx.fillStyle = C.Negro; ctx.fillRect(x - w / 2 + 8 * e, y, 2 * e, cuelga); ctx.fillRect(x + w / 2 - 10 * e, y, 2 * e, cuelga);
    ctx.fillRect(x - w / 2, y + cuelga, w, h);
    ctx.fillStyle = color; ctx.fillRect(x - w / 2, y + cuelga + h - 4 * e, w, 4 * e);
    ctx.fillStyle = C.Hueso; ctx.fillText(texto, x, y + cuelga + h / 2 - 1 * e);
  }

  private torniquete(ctx: CanvasRenderingContext2D, x: number, piso: number) {
    const { e } = this.d;
    ctx.fillStyle = '#9C968B'; ctx.fillRect(x - 7 * e, piso - 40 * e, 14 * e, 40 * e);
    ctx.fillStyle = C.Negro; ctx.fillRect(x - 7 * e, piso - 44 * e, 14 * e, 6 * e);
    ctx.fillStyle = C.Verde; ctx.fillRect(x - 3 * e, piso - 43 * e, 6 * e, 4 * e);
    ctx.strokeStyle = C.Negro; ctx.lineWidth = 3 * e; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 7 * e, piso - 28 * e); ctx.lineTo(x + 18 * e, piso - 28 * e); ctx.stroke();
  }

  // ---------- ANDÉN · Pixel ----------
  // Muro de azulejos con la franja de la línea y el nombre de la estación, pilares (con los stickers del plumón y la
  // zapatilla pegados), mapa de la red, afiches, luminarias, bancas, basurero, extintor, el piso de baldosas, la franja
  // táctil amarilla del borde y la vía. Todo lo quieto se pinta una vez por tamaño de pantalla (capaAnden) y después
  // solo se copia; encima van el letrero colgante y el cartel del nivel.
  private andenPixel(ctx: CanvasRenderingContext2D) {
    const { W, H, u, anden } = this.d;
    const k = Math.min(window.devicePixelRatio || 1, 2), llave = `${W}|${H}|${k}`;
    if (!this.capaAnden || this.capaAnden.llave !== llave) {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(W * k)); c.height = Math.max(1, Math.round(anden.h * k));
      const x = c.getContext('2d')!;
      x.setTransform(k, 0, 0, k, 0, -anden.y * k);
      const completa = this.fondoAnden(x);
      // Si falta alguna imagen (todavía cargando), se vuelve a pintar en el próximo cuadro.
      this.capaAnden = { llave: completa ? llave : '', c };
    }
    ctx.drawImage(this.capaAnden.c, 0, anden.y, W, anden.h);
    this.letrero(ctx, 'Dirección Plaza →', W * 0.5, anden.y + 8 * u, C.Morado);
    this.cartel(ctx, 'Andén · Pixel', W * 0.015, anden.y + 14 * u, C.Morado);
  }

  // Devuelve false si alguna imagen todavía no estaba.
  private fondoAnden(ctx: CanvasRenderingContext2D): boolean {
    const { W, u, anden, via } = this.d;
    const q = Math.max(2, Math.round(4 * u)), linea = Math.max(1, Math.round(1.5 * u));
    let completa = true;
    let semilla = 41; const azar = () => ((semilla = (semilla * 9301 + 49297) % 233280) / 233280);
    const R = (x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const suelo = anden.suelo - 6 * u;
    // muro de azulejos, con alguno de color salpicado
    R(0, anden.y, W, suelo - anden.y, C.Hueso);
    const t = 6 * q;
    for (let y = anden.y; y < suelo; y += t) for (let x = 0; x < W; x += t) {
      const v = azar();
      if (v < 0.035) R(x, y, t, t, '#DCEFFB'); else if (v < 0.06) R(x, y, t, t, '#EBDDF0');
      R(x, y, t, linea, 'rgba(0,0,0,.09)'); R(x, y, linea, t, 'rgba(0,0,0,.09)');
      R(x + linea, y + linea, q, linea, 'rgba(255,255,255,.7)');
    }
    // cielo: losa negra, cornisa y luminarias con su luz
    R(0, anden.y, W, 8 * u, C.Negro); R(0, anden.y + 8 * u, W, q, '#3A3A3A');
    for (let x = W * 0.05; x < W; x += W * 0.1) {
      const w = 16 * q, y = anden.y + 8 * u + q;
      const g = ctx.createLinearGradient(0, y, 0, y + 22 * q);
      g.addColorStop(0, 'rgba(255,236,170,.35)'); g.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w + 6 * q, y + 22 * q); ctx.lineTo(x - 6 * q, y + 22 * q); ctx.closePath(); ctx.fill();
      R(x - q, y, w + 2 * q, 2 * q, C.Negro); R(x, y + q, w, q, '#FFF6D8');
    }
    // franja de la línea con el nombre de la estación (como en los muros de la Línea 1)
    const fy = anden.y + anden.h * 0.13, fh = 34 * u;
    R(0, fy - linea, W, linea, C.Negro); R(0, fy, W, fh, C.Morado); R(0, fy + fh, W, 5 * u, C.Rosa); R(0, fy + fh + 5 * u, W, linea, C.Negro);
    const tam = Math.max(2, Math.round(3.4 * u));
    for (const [texto, cx] of [['ESTACION', W * 0.47], ['SOMOS DISEÑO', W * 0.73]] as const) {
      const ancho = (normalizar(texto).length * AVANCE - 1) * tam;
      this.textoPixel(ctx, texto, cx - ancho / 2 + tam, fy + (fh - 7 * tam) / 2 + tam, tam, '#4A1757'); // sombra
      this.textoPixel(ctx, texto, cx - ancho / 2, fy + (fh - 7 * tam) / 2, tam, C.Hueso);
    }
    const abajo = fy + fh + 5 * u + linea; // desde aquí hasta el piso va lo que cuelga en el muro
    // pilares con la franja que los envuelve
    const pw = 14 * q, pilares = [W * 0.34, W * 0.6, W * 0.86];
    for (const px of pilares) {
      const x0 = px - pw / 2, y0 = anden.y + 8 * u + q;
      R(x0 - linea, y0, pw + 2 * linea, suelo - y0, C.Negro);
      R(x0, y0, pw, suelo - y0, '#EDE5D6'); R(x0 + pw - 3 * q, y0, 3 * q, suelo - y0, '#D9CDB7'); R(x0 + q, y0, q, suelo - y0, '#FFFFFF');
      R(x0 - q, y0, pw + 2 * q, 2 * q, C.Negro); // capitel
      R(x0, fy, pw, fh, '#6A2580'); R(x0 + pw - 3 * q, fy, 3 * q, fh, '#57206A'); R(x0, fy + fh, pw, 5 * u, '#F07AA0');
      R(x0 - q, suelo - 4 * q, pw + 2 * q, 4 * q, '#3A3A3A'); R(x0 - q, suelo - 4 * q, pw + 2 * q, linea, C.Negro); // zócalo
    }
    // stickers pegados en los pilares: el plumón y la zapatilla, con su borde blanco, un ángulo y su sombra
    const pegar = (src: string, cx: number, cy: number, lado: number, giro: number) => {
      const im = imagen(src); if (!im) { completa = false; return; }
      const b = Math.max(2, 3 * u);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(giro);
      ctx.globalAlpha = 0.22; ctx.drawImage(entintar(im, C.Negro, lado), -lado / 2 + 2 * u, -lado / 2 + 3 * u); ctx.globalAlpha = 1;
      const blanco = entintar(im, '#FFFFFF', lado);
      for (let a = 0; a < 8; a++) ctx.drawImage(blanco, -lado / 2 + Math.cos(a * Math.PI / 4) * b, -lado / 2 + Math.sin(a * Math.PI / 4) * b);
      const w = lado * Math.min(1, im.naturalWidth / im.naturalHeight || 1), h = lado * Math.min(1, im.naturalHeight / im.naturalWidth || 1);
      ctx.drawImage(raster(im, w, h), -w / 2, -h / 2);
      ctx.restore();
    };
    const lado = pw * 0.9, medio = (abajo + suelo - 4 * q) / 2;
    pegar(SRC.vagon[3], pilares[0], medio, lado, -0.16);
    pegar(SRC.vagon[5], pilares[2], medio + 2 * q, lado, 0.13);
    // mapa de la red
    const my = abajo + 3 * q, mh = Math.min(suelo - my - 4 * q, 26 * q), mw = Math.min(46 * q, W * 0.1), mx = pilares[0] + pw / 2 + 6 * q;
    if (mh > 8 * q) {
      R(mx - linea, my - linea, mw + 2 * linea, mh + 2 * linea, C.Negro); R(mx, my, mw, mh, '#FBF7EF'); R(mx, my, mw, 4 * q, C.Negro);
      this.textoPixel(ctx, 'RED', mx + q, my + q * 0.5, Math.max(1, Math.round(q / 2)), C.Hueso);
      const lineas: [string, number, number][] = [[C.Morado, 0.3, 0], [C.Azul, 0.62, -1], [C.Verde, 0.9, 0]];
      for (const [color, f, d] of lineas) {
        const ly = my + 4 * q + (mh - 4 * q) * f, x0 = mx + 2 * q, x1 = mx + mw - 2 * q;
        R(x0, ly, (x1 - x0) * 0.45, q, color);
        R(x0 + (x1 - x0) * 0.45, ly + Math.min(0, d * 3 * q), q, Math.abs(d) * 3 * q + q, color);
        R(x0 + (x1 - x0) * 0.45, ly + d * 3 * q, (x1 - x0) * 0.55, q, color);
        for (let s = 0; s < 4; s++) { const sx = x0 + (x1 - x0) * (s / 3) - q / 2, sy = s < 2 ? ly : ly + d * 3 * q; R(sx - q / 2, sy - q / 2, 2 * q, 2 * q, C.Negro); R(sx, sy, q, q, C.Hueso); }
      }
      const ex = mx + 2 * q + (mw - 4 * q) / 3, ey = my + 4 * q + (mh - 4 * q) * 0.3; // «usted está aquí»
      R(ex - q, ey - q, 3 * q, 3 * q, C.Rosa);
    }
    // afiches de las experiencias
    const afiche = (cx: number, fondo: string, src: string, texto: string) => {
      const ah = Math.min(suelo - abajo - 7 * q, 30 * q), aw = ah * 0.95, ax = cx - aw / 2, ay = abajo + 3 * q;
      if (ah < 10 * q) return;
      R(ax - linea * 2, ay - linea * 2, aw + 4 * linea, ah + 4 * linea, C.Negro); R(ax, ay, aw, ah, fondo);
      for (let y = ay + q; y < ay + ah * 0.7; y += 2 * q) R(ax, y, aw, q * 0.5, 'rgba(255,255,255,.18)');
      const im = imagen(src); if (!im) completa = false;
      else { const l = aw * 0.72; ctx.drawImage(raster(im, l, l), cx - l / 2, ay + ah * 0.08); }
      const tt = Math.max(1, Math.min(Math.round(q / 2), Math.floor((aw - q) / (normalizar(texto).length * AVANCE - 1)))), ancho = (normalizar(texto).length * AVANCE - 1) * tt;
      R(ax, ay + ah - 9 * tt - q, aw, 9 * tt + q, C.Negro);
      this.textoPixel(ctx, texto, cx - ancho / 2, ay + ah - 8 * tt - q / 2, tt, C.Amarillo);
    };
    afiche(pilares[1] - pw / 2 - 16 * q, C.Celeste, SRC.vagon[1], 'TAGS');
    afiche(pilares[1] + pw / 2 + 24 * q, C.Amarillo, SRC.vagon[0], 'JUEGA');
    afiche(pilares[2] + pw / 2 + 16 * q, C.Rosa, SRC.vagon[2], 'PINTA');
    // bancas Pixel contra el muro
    const banca = (cx: number) => {
      const w = 26 * q, y = suelo;
      R(cx - w / 2, y - 12 * q, w, 3 * q, C.Negro); R(cx - w / 2 + q, y - 11 * q, w - 2 * q, q, C.Morado); // respaldo
      R(cx - w / 2 - q, y - 7 * q, w + 2 * q, 3 * q, C.Negro); R(cx - w / 2, y - 6 * q, w, q, '#9A4CB0'); // asiento
      for (const lx of [cx - w / 2 + 2 * q, cx + w / 2 - 4 * q]) R(lx, y - 5 * q, 2 * q, 5 * q, C.Negro);
      R(cx - w / 2 + 2 * q, y - 9 * q, q, 2 * q, C.Negro); R(cx + w / 2 - 3 * q, y - 9 * q, q, 2 * q, C.Negro);
    };
    banca(W * 0.5); banca(W * 0.73);
    // basurero junto al pilar del medio
    {
      const bx = pilares[1] + pw / 2 + 3 * q, w = 6 * q, h = 9 * q, y = suelo;
      R(bx - linea, y - h - linea, w + 2 * linea, h + linea, C.Negro); R(bx, y - h, w, h, '#5E6B6B'); R(bx + q, y - h + 2 * q, q, h - 3 * q, '#7C8A8A');
      R(bx - q, y - h - q, w + 2 * q, 2 * q, C.Negro); R(bx + q, y - h - q, w - 2 * q, q, '#2A2A2A'); R(bx + 2 * q, y - h + 3 * q, 2 * q, 2 * q, C.Verde);
    }
    // extintor en su gabinete, al lado del último pilar
    {
      const ex = pilares[2] - pw / 2 - 11 * q, w = 8 * q, h = 15 * q, y = suelo - 6 * q;
      R(ex - linea, y - h - linea, w + 2 * linea, h + 2 * linea, C.Negro); R(ex, y - h, w, h, '#FBF7EF');
      R(ex + 2 * q, y - h + 3 * q, 4 * q, h - 5 * q, '#E2001A'); R(ex + 3 * q, y - h + 2 * q, 2 * q, q, C.Negro); R(ex + 2 * q, y - h + 6 * q, q, 4 * q, '#FF5A6E');
      R(ex, y - h, w, q, '#E2001A');
    }
    // piso de baldosas, con el zócalo del muro
    R(0, suelo, W, via - 18 * u - suelo, '#D9CDB7');
    R(0, suelo, W, linea, C.Negro);
    const bh = 3 * q, bw = 8 * q;
    for (let y = suelo + linea, f = 0; y < via - 18 * u; y += bh, f++) for (let x = (f % 2) * -bw / 2; x < W; x += bw) {
      R(x, y, bw - linea, Math.min(bh, via - 18 * u - y) - linea, f % 2 ? '#D3C6AE' : '#DDD2BD');
    }
    // franja táctil amarilla del borde (con sus botones) y el canto del andén
    R(0, via - 18 * u, W, 8 * u, C.Amarillo);
    for (let x = 4 * u; x < W; x += 12 * u) R(x, via - 15.5 * u, 3 * u, 3 * u, '#C79A00');
    R(0, via - 10 * u, W, linea * 2, C.Negro);
    // vía: foso con balasto, durmientes y riel
    R(0, via - 10 * u + linea * 2, W, anden.y + anden.h - via + 10 * u, '#2A2A2A');
    for (let i = 0; i < W / (3 * q); i++) R(azar() * W, via - 8 * u + azar() * 8 * u, q, q, azar() < 0.5 ? '#3B3B3B' : '#4A4540');
    for (let x = 0; x < W; x += 28 * u) R(x, via + 4 * u, 14 * u, 6 * u, '#6B6B6B');
    R(0, via, W, 3 * u, C.Hueso); R(0, via + 3 * u, W, linea, '#6B6B6B');
    return completa;
  }

  // Escaleras mecánicas vistas de perfil, como en un corte de la estación: descanso abajo y arriba, peldaños
  // escalonados (huella y contrahuella) que suben, la estructura metálica debajo, baranda de vidrio y pasamanos
  // negro que se curva en los extremos.
  private escaleras(ctx: CanvasRenderingContext2D) {
    const { e, escA, escB, tramoA, tramoB, anden, mezz, plaza } = this.d;
    const tramo = (x0: number, y0: number, x1: number, y1: number) => {
      const dir = Math.sign(x1 - x0), dx = x1 - x0, dy = y1 - y0;
      const descanso = 46 * e, fondo = 34 * e, alto = 36 * e;
      const n = Math.max(6, Math.round(Math.abs(dy) / (11 * e))), w = dx / n, h = dy / n;
      const xa = x0 - dir * descanso, xb = x1 + dir * descanso;
      ctx.save(); ctx.lineJoin = 'round';
      // sombra suave sobre el muro de abajo
      for (const [k, a] of [[16, 0.07], [8, 0.09]] as const) {
        ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath();
        ctx.moveTo(xa, y0 + fondo); ctx.lineTo(x0 + dir * fondo * 0.4, y0 + fondo); ctx.lineTo(x1 + dir * fondo * 0.4, y1 + fondo); ctx.lineTo(xb, y1 + fondo);
        ctx.lineTo(xb, y1 + fondo + k * e); ctx.lineTo(x1 + dir * (fondo * 0.4 + k * e), y1 + fondo + k * e); ctx.lineTo(x0 + dir * (fondo * 0.4 + k * e), y0 + fondo + k * e); ctx.lineTo(xa, y0 + fondo + k * e); ctx.closePath(); ctx.fill();
      }
      // estructura (armadura) bajo los peldaños
      ctx.fillStyle = '#9C968B'; ctx.strokeStyle = C.Negro; ctx.lineWidth = 2.5 * e;
      ctx.beginPath(); ctx.moveTo(xa, y0); ctx.lineTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(xb, y1);
      ctx.lineTo(xb, y1 + fondo); ctx.lineTo(x1 + dir * fondo * 0.4, y1 + fondo); ctx.lineTo(x0 + dir * fondo * 0.4, y0 + fondo); ctx.lineTo(xa, y0 + fondo); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#B8B2A6'; ctx.beginPath(); // franja clara del costado
      ctx.moveTo(x0 + dir * fondo * 0.15, y0 + fondo * 0.45); ctx.lineTo(x1 + dir * fondo * 0.15, y1 + fondo * 0.45); ctx.lineTo(x1 + dir * fondo * 0.3, y1 + fondo * 0.7); ctx.lineTo(x0 + dir * fondo * 0.3, y0 + fondo * 0.7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6B655B';
      for (let k = 1; k < n; k += 2) { const f = k / n; ctx.beginPath(); ctx.arc(x0 + dx * f + dir * fondo * 0.22, y0 + dy * f + fondo * 0.57, 1.6 * e, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = Math.max(1, 1.5 * e);
      ctx.beginPath(); ctx.moveTo(xa, y0 + fondo * 0.18); ctx.lineTo(x0 + dir * fondo * 0.1, y0 + fondo * 0.18); ctx.lineTo(x1 + dir * fondo * 0.1, y1 + fondo * 0.18); ctx.lineTo(xb, y1 + fondo * 0.18); ctx.stroke();
      // baranda de vidrio
      ctx.fillStyle = 'rgba(127,200,248,.35)'; ctx.strokeStyle = C.Negro; ctx.lineWidth = 1.5 * e;
      ctx.beginPath(); ctx.moveTo(xa + dir * 8 * e, y0); ctx.lineTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(xb - dir * 8 * e, y1);
      ctx.lineTo(xb - dir * 8 * e, y1 - alto); ctx.lineTo(x1, y1 - alto); ctx.lineTo(x0, y0 - alto); ctx.lineTo(xa + dir * 8 * e, y0 - alto); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineCap = 'round';
      for (const [f, w] of [[0.28, 4], [0.34, 2], [0.7, 3]] as const) {
        const X = x0 + dx * f, Y = y0 + dy * f; ctx.lineWidth = w * e;
        ctx.beginPath(); ctx.moveTo(X + dir * 5 * e, Y - alto + 6 * e); ctx.lineTo(X - dir * 7 * e, Y - 8 * e); ctx.stroke();
      }
      // peldaños: huella y contrahuella, corren hacia abajo (la gente baja de la plaza al andén)
      const fase = this.quieto ? 0 : 1 - ((this.reloj / 900) % 1);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(xa, y0 + 2); ctx.lineTo(x0, y0 + 2); ctx.lineTo(x1, y1 + 2); ctx.lineTo(xb, y1 + 2); ctx.lineTo(xb, y1 - Math.abs(h) * 1.4); ctx.lineTo(x1, y1 - Math.abs(h) * 1.4); ctx.lineTo(x0, y0 - Math.abs(h) * 1.4); ctx.lineTo(xa, y0 - Math.abs(h) * 1.4); ctx.closePath(); ctx.clip();
      ctx.fillStyle = '#E7E1D6'; ctx.strokeStyle = C.Negro; ctx.lineWidth = 1.6 * e;
      ctx.beginPath(); ctx.moveTo(xa, y0);
      ctx.lineTo(x0 - w * (1 - fase), y0);
      for (let k = -1; k <= n; k++) {
        const px = x0 + w * (k + fase), py = y0 + h * (k + fase);
        ctx.lineTo(px, py + h); ctx.lineTo(px + w, py + h);
      }
      ctx.lineTo(xb, y1); ctx.lineTo(xb, y1 + 6 * e); ctx.lineTo(x1, y1 + 6 * e); ctx.lineTo(x0, y0 + 6 * e); ctx.lineTo(xa, y0 + 6 * e); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.Amarillo;
      for (let k = -1; k <= n; k++) { const px = x0 + w * (k + fase), py = y0 + h * (k + fase); ctx.fillRect(Math.min(px, px + w), py + h - 1 * e, Math.abs(w) * 0.9, 2 * e); }
      ctx.restore();
      // peines (placas) de entrada y salida
      ctx.fillStyle = C.Amarillo; ctx.fillRect(Math.min(xa, x0), y0 - 2 * e, Math.abs(descanso), 3 * e); ctx.fillRect(Math.min(x1, xb), y1 - 2 * e, Math.abs(descanso), 3 * e);
      // pasamanos: corre sobre la baranda y se curva en los extremos
      const r = 9 * e;
      ctx.strokeStyle = C.Negro; ctx.lineWidth = 6 * e; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(xa + dir * (8 * e + r), y0 - alto + 2 * r);
      ctx.arc(xa + dir * (8 * e + r), y0 - alto + r, r, dir > 0 ? Math.PI / 2 : Math.PI / 2, dir > 0 ? Math.PI * 1.5 : -Math.PI / 2, dir < 0);
      ctx.lineTo(x0, y0 - alto); ctx.lineTo(x1, y1 - alto); ctx.lineTo(xb - dir * (8 * e + r), y1 - alto);
      ctx.arc(xb - dir * (8 * e + r), y1 - alto + r, r, -Math.PI / 2, Math.PI / 2, dir < 0);
      ctx.stroke();
      ctx.strokeStyle = '#5A5A5A'; ctx.lineWidth = Math.max(1, 1.5 * e);
      ctx.beginPath(); ctx.moveTo(x0, y0 - alto - 1.5 * e); ctx.lineTo(x1, y1 - alto - 1.5 * e); ctx.stroke();
      ctx.restore();
    };
    tramo(escA, anden.suelo + anden.fondo / 2, escA + tramoA, mezz.suelo + mezz.fondo / 2);
    tramo(escB, mezz.suelo + mezz.fondo / 2, escB - tramoB, plaza.suelo + plaza.fondo / 2);
  }

  // El tren es el metro Pixel detallado de la web (metro.ts). Las puertas se abren del lado del andén que no se ve:
  // el tren llega, se detiene y la gente del andén queda detrás de él, sin puertas abriéndose.
  private altoTren() { return Math.min(this.d.anden.h * 0.6, 235 * this.d.u); }
  // ¿Esta persona del andén queda detrás del tren? Entonces no se ve: aparece y desaparece por detrás de él.
  private tapadaPorTren(a: Avatar, x: number) {
    if (a.nivel !== 0 || a.subiendo) return false;
    const t = this.tren();
    return t.visible && x > t.x - 20 * this.d.u && x < t.x + t.largo + 20 * this.d.u;
  }

  private trenDibujo(ctx: CanvasRenderingContext2D) {
    const t = this.tren();
    if (!t.visible) return;
    const { u, via } = this.d;
    const alto = this.altoTren(), p = alto / FILAS, y = via - alto, vagones = 2, lv = t.largo / vagones;
    const n = Math.round((lv - 4 * p) / p), w = n * p;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    for (let v = 0; v < vagones; v++) {
      const x = Math.round(t.x + v * lv);
      ctx.drawImage(carro(n, { frente: v === 0, cola: v === vagones - 1, semilla: v + 3 * (t.n % 4) }), x, y, w, alto);
      // fuelle entre carros
      if (v < vagones - 1) { ctx.fillStyle = C.Negro; ctx.fillRect(x + w - p, y + 6 * p, lv - w + 2 * p, 16 * p); ctx.fillStyle = '#3A3A3A'; for (let k = 0; k < 4; k++) ctx.fillRect(x + w + p * 0.5, y + (8 + k * 3.5) * p, lv - w - p, p); }
    }
    ctx.restore();
  }

  private avatar(ctx: CanvasRenderingContext2D, a: Avatar, [x, y]: [number, number]) {
    const { u } = this.d;
    const s = u * (0.9 + a.hondo * 0.25), paso = this.quieto ? 0 : Math.floor(a.fase) % 2;
    const color = CUERPO[a.p.lenguaje], alto = 38 * s, cabeza = 30 * s;
    ctx.save(); ctx.translate(x, y);
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, 0, 14 * s, 4 * s, 0, 0, Math.PI * 2); ctx.fill();
    if (a.p.lenguaje === 'Pixel') {
      const p = 4 * s;
      ctx.fillStyle = C.Negro; ctx.fillRect(-3 * p, -alto, 6 * p, alto - 3 * p);
      ctx.fillStyle = color; ctx.fillRect(-2.5 * p, -alto + 0.5 * p, 5 * p, alto - 4 * p);
      ctx.fillStyle = C.Negro;
      ctx.fillRect(-2 * p, -3 * p - (paso ? p : 0), 1.5 * p, 3 * p + (paso ? p : 0));
      ctx.fillRect(0.5 * p, -3 * p - (paso ? 0 : p), 1.5 * p, 3 * p + (paso ? 0 : p));
    } else if (a.p.lenguaje === 'Geométrica') {
      ctx.fillStyle = C.Negro;
      const pierna = paso ? 5 * s : -5 * s;
      ctx.fillRect(-8 * s + pierna * 0.4, -14 * s, 5 * s, 14 * s); ctx.fillRect(3 * s - pierna * 0.4, -14 * s, 5 * s, 14 * s);
      ctx.fillStyle = color; ctx.strokeStyle = C.Negro; ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.moveTo(-14 * s, -alto); ctx.lineTo(14 * s, -alto); ctx.lineTo(0, -12 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.strokeStyle = C.Negro; ctx.lineWidth = 5 * s; ctx.lineCap = 'round';
      const b = paso ? 4 * s : -4 * s;
      ctx.beginPath(); ctx.moveTo(-5 * s, -14 * s); ctx.lineTo(-5 * s + b, -1 * s); ctx.moveTo(5 * s, -14 * s); ctx.lineTo(5 * s - b, -1 * s); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, -alto * 0.62, 13 * s, alto * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    }
    // cabeza: la foto (o el personaje) de la credencial, en un círculo
    const cy = -alto - cabeza * 0.45;
    ctx.save();
    ctx.beginPath(); ctx.arc(0, cy, cabeza / 2, 0, Math.PI * 2); ctx.closePath();
    ctx.fillStyle = C.Hueso; ctx.fill(); ctx.clip();
    if (a.p.cabeza.tipo === 'personaje') {
      const im = imagen(SRC.personaje[a.p.cabeza.id]);
      if (im) ctx.drawImage(raster(im, cabeza * 1.15, cabeza * 1.15), -cabeza * 0.575, cy - cabeza * 0.575);
    } else {
      // la miniatura real de la cara (solo con consentimiento) o, mientras carga o en la prueba, la inicial en color
      const real = a.p.cabeza.codigo ? enVivo.fotos.get(a.p.cabeza.codigo) : undefined;
      if (listaImagen(real)) ctx.drawImage(real, -cabeza / 2, cy - cabeza / 2, cabeza, cabeza);
      else {
        ctx.fillStyle = a.p.cabeza.color; ctx.fillRect(-cabeza / 2, cy - cabeza / 2, cabeza, cabeza);
        ctx.fillStyle = C.Hueso; ctx.font = `800 ${cabeza * 0.5}px "Bricolage Grotesque", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(a.p.nombre[0], 0, cy + cabeza * 0.04);
      }
    }
    ctx.restore();
    ctx.strokeStyle = C.Negro; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.arc(0, cy, cabeza / 2, 0, Math.PI * 2); ctx.stroke();
    // aureola con la credencial completa
    if (a.p.timbres >= ACTIVAS.length) {
      ctx.strokeStyle = C.Amarillo; ctx.lineWidth = 3 * s;
      ctx.beginPath(); ctx.ellipse(0, cy - cabeza * 0.62, cabeza * 0.42, cabeza * 0.12, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // nombre de quien acaba de llegar o conseguir un timbre
    if (a.destacado > this.reloj) {
      const texto = `${a.p.nombre} · ${a.p.timbres}/4`;
      ctx.font = `700 ${13 * u}px "DM Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(texto).width + 16 * u, by = cy - cabeza * 0.5 - 22 * u;
      ctx.fillStyle = C.Negro; ctx.beginPath(); ctx.roundRect(-w / 2, by - 11 * u, w, 22 * u, 11 * u); ctx.fill();
      ctx.fillStyle = C.Hueso; ctx.fillText(texto, 0, by + 1);
    }
    ctx.restore();
  }

  private cartel(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, color: string) {
    const { u } = this.d;
    ctx.font = `800 ${14 * u}px "Bricolage Grotesque", sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(texto).width + 20 * u;
    ctx.fillStyle = color; ctx.fillRect(x, y, w, 26 * u);
    ctx.fillStyle = C.Hueso; ctx.fillText(texto, x + 10 * u, y + 13.5 * u);
  }

  private textoPixel(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, tam: number, color: string) {
    ctx.fillStyle = color;
    let cx = x;
    for (const ch of normalizar(texto)) {
      const g = GLIFOS[ch];
      for (let f = 0; f < 7; f++) for (let c = 0; c < 5; c++) if (g[f][c] === '1') ctx.fillRect(Math.round(cx + c * tam), Math.round(y + f * tam), tam, tam);
      cx += AVANCE * tam;
    }
  }

  get resumen() {
    const personas = this.avatares.length;
    const timbres = this.avatares.reduce((s, a) => s + a.p.timbres, 0);
    const completas = this.avatares.filter(a => a.p.timbres >= ACTIVAS.length).length;
    return { personas, timbres, completas };
  }
}

// El vagón que diseñó la gente en la experiencia Vagón: el último que salió a la vía (llega por shared/datos.ts).

// Silueta de un taco entintada en un color (para los banderines de grabado).
const tintas = new Map<string, HTMLCanvasElement>();
export function entintar(im: HTMLImageElement, color: string, lado: number): HTMLCanvasElement {
  const k = `${im.src}|${color}|${Math.round(lado)}`;
  let c = tintas.get(k);
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = Math.max(1, Math.round(lado));
    const x = c.getContext('2d')!;
    const w = im.naturalWidth / im.naturalHeight > 1 ? c.width : c.width * (im.naturalWidth / im.naturalHeight || 1);
    const h = w * (im.naturalHeight / im.naturalWidth || 1);
    x.drawImage(im, (c.width - w) / 2, (c.height - h) / 2, w, h);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    tintas.set(k, c);
  }
  return c;
}

// Mosaico geométrico de prueba (como los del Taller de Mosaicos): un módulo de 2 × 2 reflejado en 4 × 4.
const mosaicos = new Map<string, HTMLCanvasElement>();
const PARES = [[C.Azul, C.Hueso], [C.Lapis, C.Rosa], [C.Verde, C.Amarillo], [C.Morado, C.Celeste], [C.Negro, C.Amarillo]];
export function mosaico(semilla: number, lado: number): HTMLCanvasElement {
  const k = `${semilla}|${Math.round(lado)}`;
  let c = mosaicos.get(k);
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = Math.max(1, Math.round(lado));
    const x = c.getContext('2d')!;
    let r = semilla * 9301 + 49297; const azar = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    const [tinta, fondo] = PARES[semilla % PARES.length], acento = [C.Rosa, C.Amarillo, C.Celeste, C.Verde][semilla % 4];
    const celdas = Array.from({ length: 4 }, () => ({ forma: Math.floor(azar() * 5), giro: Math.floor(azar() * 4), color: azar() < 0.25 ? acento : tinta }));
    const t = c.width / 4;
    x.fillStyle = fondo; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const ci = i % 2, cj = j % 2, cel = celdas[ci + cj * 2];
      const espejoX = i >= 2 ? -1 : 1, espejoY = j >= 2 ? -1 : 1;
      x.save(); x.translate(i * t + t / 2, j * t + t / 2); x.scale(espejoX, espejoY); x.rotate(cel.giro * Math.PI / 2);
      x.fillStyle = cel.color; x.beginPath();
      if (cel.forma === 0) { x.moveTo(-t / 2, -t / 2); x.lineTo(t / 2, -t / 2); x.lineTo(-t / 2, t / 2); }
      else if (cel.forma === 1) { x.moveTo(-t / 2, -t / 2); x.arc(-t / 2, -t / 2, t, 0, Math.PI / 2); }
      else if (cel.forma === 2) { x.rect(-t / 2, -t / 2, t, t / 2); }
      else if (cel.forma === 3) { x.moveTo(0, -t / 2); x.lineTo(t / 2, 0); x.lineTo(0, t / 2); x.lineTo(-t / 2, 0); }
      else { x.arc(0, 0, t * 0.3, 0, Math.PI * 2); }
      x.closePath(); x.fill(); x.restore();
    }
    mosaicos.set(k, c);
  }
  return c;
}

// ---------- láminas de los cuadros de la mezanina ----------
// Cada obra se rasteriza una vez al tamaño del cuadro (sobre paspartú hueso, entera y sin deformarse) y después solo se
// copia con drawImage. Se guarda por imagen: si cambia el tamaño de la pantalla, se rehace.
const laminas = new WeakMap<HTMLImageElement, { L: number; c: HTMLCanvasElement }>();
function paspartu(im: HTMLImageElement, lado: number, k: number): HTMLCanvasElement {
  const L = Math.max(1, Math.round(lado * k)), hecha = laminas.get(im);
  if (hecha && hecha.L === L) return hecha.c;
  const c = document.createElement('canvas'); c.width = c.height = L;
  const x = c.getContext('2d')!;
  x.fillStyle = C.Hueso; x.fillRect(0, 0, L, L);
  const borde = L * 0.07, caja = L - 2 * borde, f = Math.min(caja / im.naturalWidth, caja / im.naturalHeight);
  const w = im.naturalWidth * f, h = im.naturalHeight * f, ix = (L - w) / 2, iy = (L - h) / 2;
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(im, ix, iy, w, h);
  x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = Math.max(1, L / 160); x.strokeRect(ix, iy, w, h);
  laminas.set(im, { L, c });
  return c;
}

// Cuadro sin obra todavía: paspartú con un borde punteado y una figura geométrica del color de la experiencia que
// invita a crear (la cartela dice «Tu obra aquí»).
const vacios = new Map<string, HTMLCanvasElement>();
function vacio(clase: ClaseObra, lado: number, k: number): HTMLCanvasElement {
  const L = Math.max(1, Math.round(lado * k)), llave = clase + '|' + L;
  let c = vacios.get(llave);
  if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = L;
  const x = c.getContext('2d')!, color = COLOR_CLASE[clase], m = L * 0.12, t = (L - 2 * m) / 4;
  x.fillStyle = C.Hueso; x.fillRect(0, 0, L, L);
  x.strokeStyle = 'rgba(0,0,0,.28)'; x.lineWidth = Math.max(1, L / 110); x.setLineDash([L / 28, L / 36]);
  x.strokeRect(m * 0.55, m * 0.55, L - m * 1.1, L - m * 1.1);
  x.setLineDash([]);
  // 2 × 2 figuras al centro: cuarto de círculo, triángulo, cuadrado y círculo
  const cx = L / 2 - t, cy = L / 2 - t;
  x.fillStyle = color;
  x.beginPath(); x.moveTo(cx, cy + t); x.arc(cx, cy + t, t, -Math.PI / 2, 0); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(cx + t, cy); x.lineTo(cx + 2 * t, cy + t); x.lineTo(cx + t, cy + t); x.closePath(); x.fill();
  x.fillRect(cx, cy + t, t, t);
  x.beginPath(); x.arc(cx + 1.5 * t, cy + 1.5 * t, t / 2, 0, Math.PI * 2); x.fill();
  x.strokeStyle = C.Negro; x.lineWidth = Math.max(1, L / 160); x.strokeRect(cx, cy, 2 * t, 2 * t);
  vacios.set(llave, c);
  return c;
}

// Texto que cabe en `max` px (con «…» si no); se recuerda para no medir en cada cuadro.
const ajustes = new Map<string, string>();
function ajustar(ctx: CanvasRenderingContext2D, texto: string, max: number): string {
  const llave = ctx.font + '|' + Math.round(max) + '|' + texto;
  let r = ajustes.get(llave);
  if (r == null) {
    r = texto;
    if (ctx.measureText(r).width > max) {
      let n = texto.length;
      while (n > 1 && ctx.measureText(texto.slice(0, n).trimEnd() + '…').width > max) n--;
      r = texto.slice(0, n).trimEnd() + '…';
    }
    if (ajustes.size > 300) ajustes.clear();
    ajustes.set(llave, r);
  }
  return r;
}

// Precarga de todos los SVG que usa la escena.
export const TODAS_LAS_IMAGENES = [
  ...Object.values(SRC.personaje), SRC.araucaria, SRC.sol, SRC.helecho, SRC.flor, SRC.quisco, ...SRC.vagon,
];
