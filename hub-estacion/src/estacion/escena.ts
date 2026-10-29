import { GLIFOS, AVANCE, normalizar } from '../../../shared/pixelfont';
import type { Lenguaje, Persona } from './fuente';
import { imagen, raster } from './imagenes';
import { c3EnTiempo, dibujarC3 } from '../../../shared/c3-tunel.js';

// Estación Somos Diseño: corte de una estación en tres niveles.
//   Plaza Orgánica (arriba) · Mezanine Geométrico (medio) · Andén Pixel (abajo).
// Cada timbre sube a la persona un nivel: 1 andén → 2 mezanine → 3 plaza → 4 plaza con aureola.
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
  tag: './figma/vagon/tag-ejemplo.svg',
  // Metro de Figma (Pixel · FA08): lateral del carro como módulo que se repite (240 × 240).
  metro: { l1: './figma/metro/linea1-lateral.svg', l4: './figma/metro/linea4-lateral.svg' },
};
// Grabados de prueba para los banderines de la plaza (taco + tinta + papel), hasta que lleguen los de la experiencia.
const GRABADOS = [
  { taco: SRC.helecho, tinta: '#00A651', papel: '#F4EEE3' }, { taco: SRC.sol, tinta: '#FF8FB1', papel: '#7FC8F8' },
  { taco: SRC.araucaria, tinta: '#2B4BD8', papel: '#FFC20E' }, { taco: SRC.quisco, tinta: '#7A2E8E', papel: '#F4EEE3' },
  { taco: SRC.flor, tinta: '#0062B8', papel: '#FF8FB1' }, { taco: SRC.helecho, tinta: '#000000', papel: '#FFC20E' },
];
// Mosaicos de prueba para los paneles MetroArte (Taller de Mosaicos), con quien los hizo.
const MOSAICOS = [
  { autor: 'Antonia', semilla: 3 }, { autor: 'Benjamín', semilla: 11 }, { autor: 'Camila', semilla: 24 }, { autor: 'Diego', semilla: 37 },
  { autor: 'Fernanda', semilla: 52 }, { autor: 'Gaspar', semilla: 68 }, { autor: 'Isidora', semilla: 81 }, { autor: 'Matías', semilla: 95 },
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
    escA: W * 0.06, // pie de la escalera andén → mezanine (izquierda, sube hacia la derecha)
    escB: W * 0.94, // pie de la escalera mezanine → plaza (derecha, sube hacia la izquierda)
    tramoA: tramo(anden, mezz), tramoB: tramo(mezz, plaza),
  };
}
const nivelDe = (timbres: number) => (timbres >= 3 ? 2 : timbres === 2 ? 1 : 0);

// ---------- personas en escena ----------
interface Avatar {
  p: Persona;
  nivel: number;
  x: number;
  hondo: number; // 0..1 dentro del piso
  dir: 1 | -1;
  vel: number;
  fase: number;
  subiendo?: { t: number; desde: [number, number]; hasta: [number, number]; nivel: number };
  objetivo?: number; // x de la escalera a la que camina para subir
  destacado: number; // ms hasta el que se muestra su nombre
  esperaTren?: boolean; // recién llegada: aparece cuando el tren abre puertas
}
interface Particula { x: number; y: number; vx: number; vy: number; vida: number; color: string; r: number }

const PERIODO_TREN = 45000, ENTRA = 3500, DETENIDO = 9000, SALE = 3500;

export class Estacion {
  d: Disposicion;
  avatares: Avatar[] = [];
  particulas: Particula[] = [];
  reloj = 0;
  trenes = 0; // cuántos trenes han pasado (cada 3º es el vagón pintado)
  azar: () => number;
  quieto: boolean;

  constructor(d: Disposicion, gente: Persona[], azar: () => number, quieto: boolean) {
    this.d = d; this.azar = azar; this.quieto = quieto;
    for (const p of gente) this.avatares.push(this.nuevo(p, false));
  }

  private nuevo(p: Persona, enTren: boolean): Avatar {
    const r = this.azar;
    return {
      p, nivel: nivelDe(p.timbres), x: enTren ? 0 : this.d.W * (0.15 + r() * 0.7), hondo: r(), dir: r() < 0.5 ? 1 : -1,
      vel: (18 + r() * 22) * this.d.u, fase: r() * 10, destacado: 0, esperaTren: enTren,
    };
  }

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
    const meta = nivelDe(timbres);
    if (meta > a.nivel) a.objetivo = a.nivel === 0 ? this.d.escA : this.d.escB;
    if (timbres >= 4) this.confeti(a);
  }

  // Estado del tren: x del frente (0 = fuera por la derecha) y si tiene puertas abiertas.
  tren() {
    const ciclo = this.reloj % PERIODO_TREN, n = Math.floor(this.reloj / PERIODO_TREN);
    const largo = this.d.W * 0.78, parado = (this.d.W - largo) / 2;
    const pintado = n % 3 === 2;
    if (ciclo < ENTRA) { const t = 1 - Math.pow(1 - ciclo / ENTRA, 3); return { x: this.d.W + 40 + (parado - this.d.W - 40) * t, largo, abierto: false, visible: true, pintado, n }; }
    if (ciclo < ENTRA + DETENIDO) return { x: parado, largo, abierto: true, visible: true, pintado, n };
    if (ciclo < ENTRA + DETENIDO + SALE) { const t = Math.pow((ciclo - ENTRA - DETENIDO) / SALE, 3); return { x: parado - (parado + largo + 60) * t, largo, abierto: false, visible: true, pintado, n }; }
    return { x: 0, largo, abierto: false, visible: false, pintado, n };
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
    const dt = dtMs / 1000, d = this.d, tren = this.tren();
    for (const a of this.avatares) {
      if (a.esperaTren) {
        if (tren.abierto) { a.esperaTren = false; a.x = tren.x + tren.largo * (0.15 + this.azar() * 0.7); a.nivel = 0; }
        continue;
      }
      if (a.subiendo) { // en la escalera mecánica no se camina: la escalera los sube
        a.subiendo.t += dt / 3.2;
        if (a.subiendo.t >= 1) { a.nivel = a.subiendo.nivel; a.x = a.subiendo.hasta[0]; a.subiendo = undefined; a.dir = a.nivel === 1 ? 1 : -1; if (nivelDe(a.p.timbres) > a.nivel) a.objetivo = d.escB; }
        continue;
      }
      a.fase += dt * 6;
      if (a.objetivo != null) {
        const falta = a.objetivo - a.x;
        a.dir = falta > 0 ? 1 : -1;
        a.x += a.dir * Math.min(Math.abs(falta), a.vel * 1.6 * dt);
        if (Math.abs(falta) < 2) {
          const sube = a.nivel + 1, n = this.nivel(a.nivel), m = this.nivel(sube);
          const arriba = a.nivel === 0 ? d.escA + d.tramoA : d.escB - d.tramoB;
          a.hondo = 0.5;
          a.subiendo = { t: 0, desde: [a.x, n.suelo + n.fondo / 2], hasta: [arriba, m.suelo + m.fondo / 2], nivel: sube };
          a.objetivo = undefined;
        }
        continue;
      }
      a.x += a.dir * a.vel * dt;
      const min = d.W * 0.03, max = d.W * 0.97;
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
    this.mezanine(ctx);
    this.andenPixel(ctx);
    this.escaleras(ctx);
    const visibles = this.avatares.filter(a => !a.esperaTren).map(a => ({ a, pos: this.posicion(a) })).sort((p, q) => p.pos[1] - q.pos[1]);
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
    const n = GRABADOS.length, w = Math.min(46 * e, (x1 - x0) / (n + 0.6)), h = w * 1.25;
    for (let i = 0; i < n; i++) {
      const f = (i + 0.8) / (n + 0.6), x = x0 + (x1 - x0) * f, y = y0 + comba * 4 * f * (1 - f) * 0.98;
      const mece = this.quieto ? 0 : Math.sin(this.reloj / 1100 + i * 1.3) * 0.06;
      const gr = GRABADOS[i];
      ctx.save(); ctx.translate(x, y); ctx.rotate(mece);
      ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.lineTo(0, h); ctx.closePath();
      ctx.fillStyle = gr.papel; ctx.fill(); ctx.strokeStyle = C.Negro; ctx.lineWidth = 1.5 * e; ctx.stroke();
      ctx.clip();
      const im = imagen(gr.taco);
      if (im) { const lado = w * 0.62; ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(entintar(im, gr.tinta, lado), -lado / 2, h * 0.08); }
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

  // ---------- MEZANINE · Geométrica ----------
  // Boletería, máquinas de carga, paneles MetroArte con los mosaicos de la gente, la pantalla C3, el mapa de la red,
  // letreros colgantes, torniquetes y el piso de damero.
  private mezanine(ctx: CanvasRenderingContext2D) {
    const { W, u, e, mezz } = this.d;
    const techo = mezz.y + 10 * u, piso = mezz.suelo, muro = piso - techo;
    ctx.fillStyle = C.Hueso; ctx.fillRect(0, mezz.y, W, mezz.h);
    // muro de baldosas grandes
    ctx.fillStyle = '#ECE3D3'; const b = 40 * e;
    for (let y = techo, f = 0; y < piso; y += b, f++) for (let x = (f % 2) * b; x < W; x += b * 2) ctx.fillRect(x, y, b, Math.min(b, piso - y));
    // losa y luces
    ctx.fillStyle = C.Negro; ctx.fillRect(0, mezz.y, W, 10 * u);
    for (let x = W * 0.05; x < W; x += W * 0.1) { ctx.fillStyle = C.Amarillo; ctx.fillRect(x, mezz.y + 10 * u, 40 * e, 4 * e); }
    // pantalla C3 al centro
    const sw = Math.min(W * 0.2, muro * 0.95), sh = Math.min(muro * 0.55, sw * 0.62), sx = W / 2 - sw / 2, sy = techo + muro * 0.12;
    ctx.fillStyle = C.Negro; ctx.fillRect(sx - 6 * e, sy - 6 * e, sw + 12 * e, sh + 12 * e);
    ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip(); ctx.translate(sx, sy);
    dibujarC3(ctx, sw, sh, c3EnTiempo(this.quieto ? 2000 : this.reloj));
    ctx.restore();
    ctx.fillStyle = C.Negro; ctx.font = `700 ${11 * e}px "DM Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('EN VIVO · ESTACIÓN AUDIOREACTIVA', W / 2, sy + sh + 10 * e);
    // paneles MetroArte a los lados de la pantalla
    const pl = Math.min(muro * 0.62, W * 0.1);
    this.panelArte(ctx, W * 0.35 - pl / 2, sy, pl, 0);
    this.panelArte(ctx, W * 0.63 - pl / 2, sy, pl, 1);
    // boletería y máquinas de carga (izquierda)
    this.boleteria(ctx, W * 0.22, piso, muro);
    for (const x of [W * 0.285, W * 0.305]) this.maquina(ctx, x, piso);
    // mapa de la red (derecha)
    this.mapaRed(ctx, W * 0.695, sy, Math.min(W * 0.07, muro * 0.6), pl);
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
    this.cartel(ctx, 'Mezanine · Geométrica', W * 0.015, mezz.y + 20 * u, C.Azul);
  }

  // Panel tipo aviso de metro: muestra un mosaico de la gente y cada 7 s lo cambia con un barrido de arriba hacia abajo.
  private panelArte(ctx: CanvasRenderingContext2D, x: number, y: number, lado: number, desfase: number) {
    const { e } = this.d;
    const CICLO = 7000, BARRIDO = 900, t = this.quieto ? 0 : this.reloj + desfase * 3500;
    const k = Math.floor(t / CICLO), dentro = t % CICLO;
    const cual = (i: number) => MOSAICOS[((i % MOSAICOS.length) + MOSAICOS.length) % MOSAICOS.length];
    const actual = cual(k * 2 + desfase), anterior = cual((k - 1) * 2 + desfase);
    const pie = 18 * e;
    ctx.fillStyle = C.Negro; ctx.fillRect(x - 5 * e, y - 5 * e, lado + 10 * e, lado + pie + 10 * e);
    const corte = dentro < BARRIDO ? lado * (1 - Math.pow(1 - dentro / BARRIDO, 3)) : lado;
    ctx.drawImage(mosaico(anterior.semilla, lado), x, y);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, lado, corte); ctx.clip(); ctx.drawImage(mosaico(actual.semilla, lado), x, y); ctx.restore();
    if (corte < lado) { ctx.fillStyle = C.Amarillo; ctx.fillRect(x, y + corte - 2 * e, lado, 3 * e); }
    const quien = corte < lado * 0.5 ? anterior : actual;
    ctx.fillStyle = C.Hueso; ctx.font = `700 ${10 * e}px "DM Sans", sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`MetroArte · hecho por ${quien.autor}`, x + 4 * e, y + lado + pie / 2 + 1 * e);
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

  // Mapa de la red: líneas solo a 90° y 45° con estaciones (donde llegaría «Traza tu línea»).
  private mapaRed(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const { e } = this.d;
    ctx.fillStyle = C.Negro; ctx.fillRect(x - 5 * e, y - 5 * e, w + 10 * e, h + 10 * e);
    ctx.fillStyle = C.Hueso; ctx.fillRect(x, y, w, h);
    const P = (a: number, b: number): [number, number] => [x + w * a, y + h * b];
    const lineas: [string, [number, number][]][] = [
      [C.Morado, [P(0.08, 0.5), P(0.4, 0.5), P(0.6, 0.3), P(0.92, 0.3)]],
      [C.Amarillo, [P(0.5, 0.08), P(0.5, 0.4), P(0.7, 0.6), P(0.7, 0.92)]],
      [C.Verde, [P(0.15, 0.85), P(0.3, 0.7), P(0.85, 0.7)]],
    ];
    ctx.lineWidth = 4 * e; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const [color, pts] of lineas) {
      ctx.strokeStyle = color; ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
      for (const [px, py] of pts) { ctx.fillStyle = C.Hueso; ctx.beginPath(); ctx.arc(px, py, 3 * e, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C.Negro; ctx.lineWidth = 1.5 * e; ctx.stroke(); ctx.lineWidth = 4 * e; }
    }
    ctx.fillStyle = C.Negro; ctx.font = `800 ${10 * e}px "DM Sans", sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('RED', x + 5 * e, y + 4 * e);
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
      // peldaños: huella y contrahuella, corren hacia arriba
      const fase = this.quieto ? 0 : ((this.reloj / 900) % 1);
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
      const pintado = t.pintado && v === 1;
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
      if (pintado) this.vagonPintado(ctx, x, y, w, alto, t.n);
      ctx.restore();
      if (v === 0) { ctx.fillStyle = C.Celeste; ctx.fillRect(x + alto * 0.06, y + alto * 0.2, alto * 0.16, alto * 0.22); }
      ctx.fillStyle = C.Negro; ctx.fillRect(x + w, y + alto * 0.25, junta, alto * 0.55);
    }
  }

  // Easter egg: el vagón pintado por la gente en la experiencia Vagón (de prueba: stickers y tags de Graffiti).
  private vagonPintado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, n: number) {
    const { u } = this.d;
    // Si alguien diseñó un vagón en este equipo (experiencia Vagón), pasa ese; si no, uno de prueba.
    const propio = vagonDeLaGente();
    if (propio) {
      ctx.save(); ctx.imageSmoothingEnabled = false;
      const cw = h * 2; for (let k = 0; k * cw < w; k++) ctx.drawImage(propio, x + k * cw, y, cw, h);
      ctx.restore();
      ctx.fillStyle = C.Negro; ctx.fillRect(x + w - 150 * u, y + h - 40 * u, 150 * u, 22 * u);
      this.textoPixel(ctx, 'TU VAGON', x + w - 142 * u, y + h - 35 * u, Math.max(1, Math.round(2 * u)), C.Amarillo);
      return;
    }
    const tag = imagen(SRC.tag);
    if (tag) { const th = h * 0.38, tw = th / (tag.naturalHeight / tag.naturalWidth || 0.5); ctx.drawImage(raster(tag, tw, th), x + w * 0.04, y + h * 0.42); }
    for (let k = 0; k < 4; k++) {
      const src = SRC.vagon[(n + k) % SRC.vagon.length], im = imagen(src);
      if (!im) continue;
      const lado = h * 0.34, sx = x + w * (0.06 + k * 0.23), sy = y + h * (k % 2 ? 0.1 : 0.38);
      ctx.save(); ctx.translate(sx + lado / 2, sy + lado / 2); ctx.rotate(((k * 37) % 20 - 10) * Math.PI / 180);
      ctx.drawImage(raster(im, lado, lado), -lado / 2, -lado / 2); ctx.restore();
    }
    ctx.fillStyle = C.Negro; ctx.fillRect(x + w - 120 * u, y + h - 40 * u, 120 * u, 22 * u);
    this.textoPixel(ctx, 'VAGON ' + (n + 1), x + w - 112 * u, y + h - 35 * u, Math.max(1, Math.round(2 * u)), C.Amarillo);
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
      ctx.fillStyle = a.p.cabeza.color; ctx.fillRect(-cabeza / 2, cy - cabeza / 2, cabeza, cabeza);
      ctx.fillStyle = C.Hueso; ctx.font = `800 ${cabeza * 0.5}px "Bricolage Grotesque", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(a.p.nombre[0], 0, cy + cabeza * 0.04);
    }
    ctx.restore();
    ctx.strokeStyle = C.Negro; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.arc(0, cy, cabeza / 2, 0, Math.PI * 2); ctx.stroke();
    // aureola con los 4 timbres
    if (a.p.timbres >= 4) {
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
    const completas = this.avatares.filter(a => a.p.timbres >= 4).length;
    return { personas, timbres, completas };
  }
}

// El vagón que diseñó la gente en la experiencia Vagón (lo deja en localStorage al «Salir a la vía»).
// Por ahora se comparte por el mismo equipo; con Supabase llegará desde todas las tablets.
let vagonGuardado: { ts: number; im: HTMLImageElement } | null = null;
function vagonDeLaGente(): HTMLImageElement | null {
  try {
    const v = JSON.parse(localStorage.getItem('sd:vagon') || 'null') as { png: string; ts: number } | null;
    if (!v?.png) return null;
    if (!vagonGuardado || vagonGuardado.ts !== v.ts) { const im = new Image(); im.src = v.png; vagonGuardado = { ts: v.ts, im }; }
    return vagonGuardado.im.complete && vagonGuardado.im.naturalWidth ? vagonGuardado.im : null;
  } catch { return null; }
}

// Silueta de un taco entintada en un color (para los banderines de grabado).
const tintas = new Map<string, HTMLCanvasElement>();
function entintar(im: HTMLImageElement, color: string, lado: number): HTMLCanvasElement {
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
function mosaico(semilla: number, lado: number): HTMLCanvasElement {
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

// Precarga de todos los SVG que usa la escena.
export const TODAS_LAS_IMAGENES = [
  ...Object.values(SRC.personaje), SRC.araucaria, SRC.sol, SRC.helecho, SRC.flor, SRC.quisco, ...SRC.vagon, SRC.tag, SRC.metro.l1, SRC.metro.l4,
];
