import { GLIFOS, AVANCE, normalizar } from '../../../shared/pixelfont';
import type { Lenguaje, Persona } from './fuente';
import { imagen, raster } from './imagenes';
import { c3EnTiempo, dibujarC3 } from '../../../shared/c3-tunel.js';
import { enVivo, listaImagen, autorDe, type Obra, type ClaseObra } from './vivo';
import { NOMBRE_CORTO } from '../galeria/piezas';
import { ACTIVAS } from '../../../shared/juego';

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
  // Metro de Figma (Pixel · FA08): lateral del carro como módulo que se repite (240 × 240).
  metro: { l1: './figma/metro/linea1-lateral.svg', l4: './figma/metro/linea4-lateral.svg' },
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

  // Estado del tren: x del frente (0 = fuera por la derecha) y si tiene puertas abiertas.
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
    for (const { a, pos } of visibles) this.avatar(ctx, a, pos);
    this.trenDibujo(ctx);
    for (const q of this.particulas) { ctx.globalAlpha = Math.min(1, q.vida); ctx.fillStyle = q.color; ctx.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2); }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ---------- PLAZA · Orgánica ----------
  // Cielo según la hora del evento (10:00 → 20:00): día celeste, tarde dorada, atardecer rosa y lapislázuli.
  private plaza(ctx: CanvasRenderingContext2D, hora: number) {
    const { W, u, plaza } = this.d;
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
    // Suelo de la plaza
    ctx.fillStyle = C.Verde; ctx.fillRect(0, plaza.suelo - 6 * u, W, plaza.y + plaza.h - plaza.suelo + 6 * u);
    ctx.fillStyle = '#0B8F48';
    for (let x = 0; x < W; x += 22 * u) ctx.fillRect(x, plaza.suelo - 6 * u, 10 * u, 4 * u);
    // Árboles de Teatro de Papel a escala: las araucarias son árboles grandes; el helecho, el quisco y la flor, chicos y adelante.
    const planta = (src: string, x: number, alto: number) => {
      const im = imagen(src); if (!im) return;
      const w = alto * (im.naturalWidth / im.naturalHeight || 1);
      ctx.drawImage(raster(im, w, alto), x - w / 2, plaza.suelo - alto + 4 * u);
    };
    planta(SRC.araucaria, W * 0.12, plaza.h * 0.95);
    planta(SRC.araucaria, W * 0.64, plaza.h * 0.82);
    this.banderines(ctx);
    this.acceso(ctx);
    planta(SRC.helecho, W * 0.24, plaza.h * 0.17);
    planta(SRC.quisco, W * 0.56, plaza.h * 0.2);
    planta(SRC.flor, W * 0.46, plaza.h * 0.12);
    this.cartel(ctx, 'Plaza · Orgánica', W * 0.015, plaza.y + 14 * u, C.Verde);
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

  // Acceso al metro donde llega la escalera: techo de vidrio, pilares y el tótem de la estación.
  private acceso(ctx: CanvasRenderingContext2D) {
    const { u, e, plaza, escB, tramoB } = this.d;
    const xi = escB - tramoB - 40 * e, xf = Math.min(xi + 260 * e, escB), techo = plaza.suelo - 120 * e;
    ctx.fillStyle = 'rgba(127,200,248,.45)'; ctx.fillRect(xi, techo, xf - xi, 16 * e);
    ctx.fillStyle = C.Negro;
    ctx.fillRect(xi - 6 * e, techo - 6 * e, xf - xi + 12 * e, 6 * e);
    for (const x of [xi, xf - 6 * e]) ctx.fillRect(x, techo, 6 * e, plaza.suelo - techo + 2 * u);
    // tótem
    const tam = Math.max(1, Math.round(2 * e)), ancho = (8 * AVANCE - 1) * tam, tx = xi - ancho / 2 - 30 * e, ty = plaza.suelo - 170 * e;
    ctx.fillRect(tx - 3 * e, ty, 6 * e, plaza.suelo - ty);
    ctx.fillRect(tx - ancho / 2 - 8 * e, ty - 8 * e, ancho + 16 * e, 7 * tam + 16 * e);
    this.textoPixel(ctx, 'ESTACION', tx - ancho / 2, ty, tam, C.Hueso);
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
  // Muro de azulejos con la franja de la línea y el nombre de la estación, afiches con stickers, letrero colgante,
  // luminarias, bancas, la franja táctil amarilla y la vía.
  private andenPixel(ctx: CanvasRenderingContext2D) {
    const { W, u, e, anden, via } = this.d;
    ctx.fillStyle = C.Hueso; ctx.fillRect(0, anden.y, W, anden.h);
    const t = 18 * u;
    ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1;
    for (let y = anden.y; y < anden.suelo; y += t) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let x = 0; x < W; x += t) { ctx.beginPath(); ctx.moveTo(x, anden.y); ctx.lineTo(x, anden.suelo); ctx.stroke(); }
    // cielo y luminarias
    ctx.fillStyle = C.Negro; ctx.fillRect(0, anden.y, W, 8 * u);
    for (let x = W * 0.04; x < W; x += W * 0.08) { ctx.fillStyle = C.Hueso; ctx.fillRect(x, anden.y + 8 * u, 60 * e, 5 * e); }
    // franja de la línea con el nombre de la estación, dos veces (como en los muros de la Línea 1)
    const fy = anden.y + anden.h * 0.2, fh = 34 * u;
    ctx.fillStyle = C.Morado; ctx.fillRect(0, fy, W, fh);
    ctx.fillStyle = C.Rosa; ctx.fillRect(0, fy + fh, W, 5 * u);
    const tam = Math.max(2, Math.round(3.4 * u)), texto = 'ESTACION';
    const ancho = (normalizar(texto).length * AVANCE - 1) * tam;
    for (const cx of [W * 0.45, W * 0.82]) this.textoPixel(ctx, texto, cx - ancho / 2, fy + (fh - 7 * tam) / 2, tam, C.Hueso);
    // afiches con stickers Pixel (y alguno pegado suelto)
    for (const [k, cx] of [[0, W * 0.34], [1, W * 0.63]] as const) {
      const lado = Math.min(anden.suelo - fy - fh - 30 * u, 110 * e), x = cx - lado / 2, y = fy + fh + 16 * u;
      ctx.fillStyle = C.Negro; ctx.fillRect(x - 4 * e, y - 4 * e, lado + 8 * e, lado + 8 * e);
      ctx.fillStyle = k ? C.Amarillo : C.Celeste; ctx.fillRect(x, y, lado, lado);
      const im = imagen(SRC.vagon[(k * 2 + Math.floor(this.reloj / 20000)) % SRC.vagon.length]);
      if (im) ctx.drawImage(raster(im, lado * 0.8, lado * 0.8), x + lado * 0.1, y + lado * 0.1);
    }
    // letrero colgante
    this.letrero(ctx, 'Dirección Plaza →', W * 0.5, anden.y + 8 * u, C.Morado);
    // piso del andén, bancas y franja táctil
    ctx.fillStyle = '#D9CDB7'; ctx.fillRect(0, anden.suelo - 6 * u, W, via - anden.suelo - 4 * u);
    for (const x of [W * 0.3, W * 0.7]) {
      ctx.fillStyle = C.Negro; ctx.fillRect(x - 40 * e, anden.suelo - 4 * u - 26 * e, 80 * e, 8 * e);
      ctx.fillRect(x - 34 * e, anden.suelo - 4 * u - 18 * e, 5 * e, 18 * e); ctx.fillRect(x + 29 * e, anden.suelo - 4 * u - 18 * e, 5 * e, 18 * e);
      ctx.fillStyle = C.Morado; ctx.fillRect(x - 40 * e, anden.suelo - 4 * u - 32 * e, 80 * e, 6 * e);
    }
    ctx.fillStyle = C.Amarillo; ctx.fillRect(0, via - 18 * u, W, 8 * u);
    ctx.fillStyle = '#C79A00';
    for (let x = 4 * u; x < W; x += 12 * u) ctx.fillRect(x, via - 15.5 * u, 3 * u, 3 * u);
    // vía
    ctx.fillStyle = '#2A2A2A'; ctx.fillRect(0, via - 10 * u, W, anden.y + anden.h - via + 10 * u);
    ctx.fillStyle = '#6B6B6B';
    for (let x = 0; x < W; x += 28 * u) ctx.fillRect(x, via + 4 * u, 14 * u, 6 * u);
    ctx.fillStyle = C.Hueso; ctx.fillRect(0, via, W, 3 * u);
    this.cartel(ctx, 'Andén · Pixel', W * 0.015, anden.y + 14 * u, C.Morado);
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
      // estructura (armadura) bajo los peldaños
      ctx.fillStyle = '#9C968B'; ctx.strokeStyle = C.Negro; ctx.lineWidth = 2.5 * e;
      ctx.beginPath(); ctx.moveTo(xa, y0); ctx.lineTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(xb, y1);
      ctx.lineTo(xb, y1 + fondo); ctx.lineTo(x1 + dir * fondo * 0.4, y1 + fondo); ctx.lineTo(x0 + dir * fondo * 0.4, y0 + fondo); ctx.lineTo(xa, y0 + fondo); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#B8B2A6'; ctx.beginPath(); // franja clara del costado
      ctx.moveTo(x0 + dir * fondo * 0.15, y0 + fondo * 0.45); ctx.lineTo(x1 + dir * fondo * 0.15, y1 + fondo * 0.45); ctx.lineTo(x1 + dir * fondo * 0.3, y1 + fondo * 0.7); ctx.lineTo(x0 + dir * fondo * 0.3, y0 + fondo * 0.7); ctx.closePath(); ctx.fill();
      // baranda de vidrio
      ctx.fillStyle = 'rgba(127,200,248,.35)'; ctx.strokeStyle = C.Negro; ctx.lineWidth = 1.5 * e;
      ctx.beginPath(); ctx.moveTo(xa + dir * 8 * e, y0); ctx.lineTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(xb - dir * 8 * e, y1);
      ctx.lineTo(xb - dir * 8 * e, y1 - alto); ctx.lineTo(x1, y1 - alto); ctx.lineTo(x0, y0 - alto); ctx.lineTo(xa + dir * 8 * e, y0 - alto); ctx.closePath(); ctx.fill(); ctx.stroke();
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
      ctx.restore();
    };
    tramo(escA, anden.suelo + anden.fondo / 2, escA + tramoA, mezz.suelo + mezz.fondo / 2);
    tramo(escB, mezz.suelo + mezz.fondo / 2, escB - tramoB, plaza.suelo + plaza.fondo / 2);
  }

  // El tren usa el lateral del metro de Figma (Pixel · FA08): el módulo de 240 se repite a lo largo de cada carro.
  private trenDibujo(ctx: CanvasRenderingContext2D) {
    const t = this.tren();
    if (!t.visible) return;
    const { u, via } = this.d;
    const alto = Math.min(this.d.anden.h * 0.55, 150 * u), y = via - alto - 4 * u, vagones = 3, lv = t.largo / vagones, junta = 6 * u;
    const modulo = imagen(t.n % 2 ? SRC.metro.l4 : SRC.metro.l1);
    for (let v = 0; v < vagones; v++) {
      const x = t.x + v * lv, w = lv - junta;
      ctx.save(); ctx.beginPath();
      // el primer carro tiene la trompa redondeada hacia donde va (izquierda)
      if (v === 0) ctx.roundRect(x, y, w, alto, [alto * 0.35, 0, 0, alto * 0.1]); else ctx.rect(x, y, w, alto);
      ctx.clip();
      if (modulo) { const m = raster(modulo, alto, alto); for (let k = 0; k * alto < w; k++) ctx.drawImage(m, x + k * alto, y); }
      else { ctx.fillStyle = '#E2001A'; ctx.fillRect(x, y, w, alto); }
      if (t.abierto) { // puertas abiertas: el hueco oscuro de cada puerta del módulo
        ctx.fillStyle = 'rgba(0,0,0,.82)';
        for (let k = 0; k * alto < w; k++) ctx.fillRect(x + k * alto + alto * 0.29, y + alto * 0.12, alto * 0.42, alto * 0.68);
      }
      ctx.restore();
      if (v === 0) { ctx.fillStyle = C.Celeste; ctx.fillRect(x + alto * 0.06, y + alto * 0.2, alto * 0.16, alto * 0.22); }
      ctx.fillStyle = C.Negro; ctx.fillRect(x + w, y + alto * 0.25, junta, alto * 0.55);
    }
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
  ...Object.values(SRC.personaje), SRC.araucaria, SRC.sol, SRC.helecho, SRC.flor, SRC.quisco, ...SRC.vagon, SRC.metro.l1, SRC.metro.l4,
];
