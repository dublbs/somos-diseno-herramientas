import { GLIFOS, AVANCE, normalizar } from '../../../shared/pixelfont';
import type { Lenguaje, Persona } from './fuente';
import { imagen, raster } from './imagenes';

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
};

// ---------- disposición ----------
interface Nivel { y: number; h: number; suelo: number; fondo: number } // fondo: profundidad del piso para repartir gente
export interface Disposicion { W: number; H: number; u: number; plaza: Nivel; mezz: Nivel; anden: Nivel; via: number; escA: number; escB: number }
export function disponer(W: number, H: number): Disposicion {
  const u = Math.sqrt((W * H) / (1920 * 1080)); // 1 en 1920×1080; igual en 1080×1920
  const vertical = H > W;
  const [pp, pm] = vertical ? [0.36, 0.3] : [0.35, 0.29];
  const hp = H * pp, hm = H * pm, ha = H - hp - hm;
  const nivel = (y: number, h: number, suelo: number, fondo: number): Nivel => ({ y, h, suelo: y + h * suelo, fondo: h * fondo });
  const anden = nivel(hp + hm, ha, 0.52, 0.14);
  return {
    W, H, u,
    plaza: nivel(0, hp, 0.84, 0.1),
    mezz: nivel(hp, hm, 0.86, 0.08),
    anden,
    via: anden.y + anden.h * 0.9,
    escA: W * 0.08, // escalera andén → mezanine (izquierda)
    escB: W * 0.92, // escalera mezanine → plaza (derecha)
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
      a.fase += dt * 6;
      if (a.subiendo) {
        a.subiendo.t += dt / 2.4;
        if (a.subiendo.t >= 1) { a.nivel = a.subiendo.nivel; a.x = a.subiendo.hasta[0]; a.subiendo = undefined; a.dir = a.nivel === 1 ? 1 : -1; if (nivelDe(a.p.timbres) > a.nivel) a.objetivo = d.escB; }
        continue;
      }
      if (a.objetivo != null) {
        const falta = a.objetivo - a.x;
        a.dir = falta > 0 ? 1 : -1;
        a.x += a.dir * Math.min(Math.abs(falta), a.vel * 1.6 * dt);
        if (Math.abs(falta) < 2) {
          const sube = a.nivel + 1, n = this.nivel(a.nivel), m = this.nivel(sube);
          const arriba = a.nivel === 0 ? d.escA + 150 * d.u : d.escB - 150 * d.u;
          a.subiendo = { t: 0, desde: [a.x, n.suelo + a.hondo * n.fondo], hasta: [arriba, m.suelo + a.hondo * m.fondo], nivel: sube };
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
      const lado = plaza.h * 0.42, x = W * (0.12 + 0.76 * t) - lado / 2, y = plaza.y + plaza.h * (0.42 - Math.sin(t * Math.PI) * 0.3) - lado / 2;
      ctx.save(); ctx.translate(x + lado / 2, y + lado / 2); ctx.rotate(this.quieto ? 0 : this.reloj / 9000);
      ctx.drawImage(raster(sol, lado, lado), -lado / 2, -lado / 2); ctx.restore();
    }
    // Suelo de la plaza
    ctx.fillStyle = C.Verde; ctx.fillRect(0, plaza.suelo - 6 * u, W, plaza.y + plaza.h - plaza.suelo + 6 * u);
    ctx.fillStyle = '#0B8F48';
    for (let x = 0; x < W; x += 22 * u) ctx.fillRect(x, plaza.suelo - 6 * u, 10 * u, 4 * u);
    // Árboles y plantas de Teatro de Papel
    const planta = (src: string, x: number, alto: number) => {
      const im = imagen(src); if (!im) return;
      const w = alto * (im.naturalWidth / im.naturalHeight || 1);
      ctx.drawImage(raster(im, w, alto), x - w / 2, plaza.suelo - alto + 4 * u);
    };
    planta(SRC.araucaria, W * 0.2, plaza.h * 0.78);
    planta(SRC.araucaria, W * 0.8, plaza.h * 0.66);
    planta(SRC.quisco, W * 0.62, plaza.h * 0.36);
    planta(SRC.helecho, W * 0.33, plaza.h * 0.3);
    planta(SRC.flor, W * 0.45, plaza.h * 0.2);
    // Fajas del Telar colgadas entre las araucarias (de prueba hasta que exista la experiencia)
    const y0 = plaza.y + plaza.h * 0.3, x0 = W * 0.24, x1 = W * 0.76;
    ctx.strokeStyle = C.Negro; ctx.lineWidth = 2 * u;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, y0 + 40 * u, x1, y0); ctx.stroke();
    const fajas = 7, colores = [[C.Morado, C.Amarillo], [C.Azul, C.Rosa], [C.Verde, C.Hueso], [C.Rosa, C.Azul], [C.Amarillo, C.Morado], [C.Lapis, C.Celeste], [C.Negro, C.Amarillo]];
    for (let i = 0; i < fajas; i++) {
      const f = (i + 0.5) / fajas, x = x0 + (x1 - x0) * f, y = y0 + 40 * u * 2 * f * (1 - f) * 2 * 0.5 + 2 * u;
      const w = 22 * u, h = plaza.h * 0.26, mece = this.quieto ? 0 : Math.sin(this.reloj / 900 + i) * 3 * u;
      const [a, b] = colores[i % colores.length];
      ctx.save(); ctx.translate(x + mece, y);
      ctx.fillStyle = a; ctx.fillRect(-w / 2, 0, w, h);
      ctx.fillStyle = b;
      for (let k = 0; k < h - 8 * u; k += 14 * u) { ctx.beginPath(); ctx.moveTo(-w / 2, k + 4 * u); ctx.lineTo(0, k + 11 * u); ctx.lineTo(w / 2, k + 4 * u); ctx.lineTo(w / 2, k + 8 * u); ctx.lineTo(0, k + 15 * u); ctx.lineTo(-w / 2, k + 8 * u); ctx.fill(); }
      ctx.fillStyle = C.Negro; for (let k = 0; k < 4; k++) ctx.fillRect(-w / 2 + k * (w / 4) + 2 * u, h, 2 * u, 8 * u);
      ctx.restore();
    }
    this.cartel(ctx, 'Plaza · Orgánica', W * 0.015, plaza.y + 14 * u, C.Verde);
  }

  // Mezanine: piso de damero, torniquetes y la pantalla de la Estación Audioreactiva.
  private mezanine(ctx: CanvasRenderingContext2D) {
    const { W, u, mezz } = this.d;
    ctx.fillStyle = C.Hueso; ctx.fillRect(0, mezz.y, W, mezz.h);
    // franja superior (losa) y columnas
    ctx.fillStyle = C.Negro; ctx.fillRect(0, mezz.y, W, 10 * u);
    for (const x of [W * 0.2, W * 0.8]) ctx.fillRect(x - 8 * u, mezz.y, 16 * u, mezz.suelo - mezz.y);
    // pantalla audioreactiva (de prueba: túnel que se abre, M3)
    const sw = Math.min(W * 0.34, mezz.h * 1.1), sh = (mezz.suelo - mezz.y) * 0.62, sx = W / 2 - sw / 2, sy = mezz.y + 22 * u;
    ctx.fillStyle = C.Negro; ctx.fillRect(sx - 6 * u, sy - 6 * u, sw + 12 * u, sh + 12 * u);
    ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
    const pulso = this.quieto ? 0.5 : (Math.sin(this.reloj / 420) + 1) / 2;
    const colores = [C.Azul, C.Hueso, C.Lapis, C.Celeste];
    for (let k = 9; k >= 0; k--) {
      const f = ((k + (this.quieto ? 0 : (this.reloj / 700) % 1)) / 10);
      const w = sw * f * (1 + pulso * 0.3), h = sh * f * (1 + pulso * 0.3);
      ctx.fillStyle = colores[k % colores.length]; ctx.fillRect(W / 2 - w / 2, sy + sh / 2 - h / 2, w, h);
    }
    ctx.restore();
    ctx.fillStyle = C.Negro; ctx.font = `700 ${12 * u}px "DM Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('EN VIVO · ESTACIÓN AUDIOREACTIVA', W / 2, sy + sh + 10 * u);
    // torniquetes
    for (const x of [W * 0.33, W * 0.67]) {
      for (let i = -1; i <= 1; i++) {
        const tx = x + i * 34 * u;
        ctx.fillStyle = C.Negro; ctx.fillRect(tx - 6 * u, mezz.suelo - 46 * u, 12 * u, 46 * u);
        ctx.fillStyle = C.Amarillo; ctx.fillRect(tx - 6 * u, mezz.suelo - 46 * u, 12 * u, 8 * u);
      }
    }
    // piso de damero (dos filas de baldosas)
    const lado = 24 * u, y0 = mezz.suelo - 6 * u, alto = (mezz.y + mezz.h - 6 * u - y0) / 2;
    for (let f = 0; f < 2; f++) for (let x = 0, k = 0; x < W; x += lado, k++) {
      ctx.fillStyle = (k + f) % 2 ? C.Lapis : C.Hueso;
      ctx.fillRect(x, y0 + f * alto, lado, alto);
    }
    ctx.fillStyle = C.Negro; ctx.fillRect(0, mezz.y + mezz.h - 6 * u, W, 6 * u);
    this.cartel(ctx, 'Mezanine · Geométrica', W * 0.015, mezz.y + 20 * u, C.Azul);
  }

  // Andén: azulejos, letrero pixel, borde amarillo y la vía.
  private andenPixel(ctx: CanvasRenderingContext2D) {
    const { W, u, anden, via } = this.d;
    ctx.fillStyle = C.Hueso; ctx.fillRect(0, anden.y, W, anden.h);
    const t = 18 * u;
    ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1;
    for (let y = anden.y; y < anden.suelo; y += t) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let x = 0; x < W; x += t) { ctx.beginPath(); ctx.moveTo(x, anden.y); ctx.lineTo(x, anden.suelo); ctx.stroke(); }
    // franja de la línea
    ctx.fillStyle = C.Morado; ctx.fillRect(0, anden.y + anden.h * 0.16, W, 14 * u);
    ctx.fillStyle = C.Rosa; ctx.fillRect(0, anden.y + anden.h * 0.16 + 14 * u, W, 5 * u);
    // letrero pixel
    const texto = 'ESTACION SOMOS DISEÑO', tam = Math.max(2, Math.round(4 * u));
    const ancho = (normalizar(texto).length * AVANCE - 1) * tam, lx = W / 2 - ancho / 2 - 14 * u, ly = anden.y + anden.h * 0.16 + 30 * u;
    ctx.fillStyle = C.Negro; ctx.fillRect(lx, ly, ancho + 28 * u, 7 * tam + 22 * u);
    this.textoPixel(ctx, texto, lx + 14 * u, ly + 11 * u, tam, C.Hueso);
    // piso del andén y borde
    ctx.fillStyle = '#D9CDB7'; ctx.fillRect(0, anden.suelo - 6 * u, W, via - anden.suelo - 4 * u);
    ctx.fillStyle = C.Amarillo; ctx.fillRect(0, via - 16 * u, W, 6 * u);
    // vía
    ctx.fillStyle = '#2A2A2A'; ctx.fillRect(0, via - 10 * u, W, anden.y + anden.h - via + 10 * u);
    ctx.fillStyle = '#6B6B6B';
    for (let x = 0; x < W; x += 28 * u) ctx.fillRect(x, via + 4 * u, 14 * u, 6 * u);
    ctx.fillStyle = C.Hueso; ctx.fillRect(0, via, W, 3 * u);
    this.cartel(ctx, 'Andén · Pixel', W * 0.015, anden.y + 14 * u, C.Morado);
  }

  private escaleras(ctx: CanvasRenderingContext2D) {
    const { u, escA, escB, anden, mezz, plaza } = this.d;
    const tramo = (x0: number, y0: number, x1: number, y1: number, color: string) => {
      ctx.save();
      ctx.strokeStyle = C.Negro; ctx.lineWidth = 28 * u; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = 20 * u; ctx.setLineDash([6 * u, 5 * u]);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.restore();
    };
    tramo(escA, anden.suelo + anden.fondo * 0.5, escA + 150 * u, mezz.suelo + mezz.fondo * 0.5, C.Amarillo);
    tramo(escB, mezz.suelo + mezz.fondo * 0.5, escB - 150 * u, plaza.suelo + plaza.fondo * 0.5, C.Verde);
  }

  private trenDibujo(ctx: CanvasRenderingContext2D) {
    const t = this.tren();
    if (!t.visible) return;
    const { u, via } = this.d;
    const alto = Math.min(this.d.anden.h * 0.55, 150 * u), y = via - alto - 6 * u, vagones = 3, lv = t.largo / vagones;
    for (let v = 0; v < vagones; v++) {
      const x = t.x + v * lv;
      const pintado = t.pintado && v === 1;
      ctx.fillStyle = C.Negro; ctx.fillRect(x + 2 * u, y - 4 * u, lv - 4 * u, alto + 8 * u);
      ctx.fillStyle = pintado ? C.Hueso : '#E2001A'; // rojo Línea 1, el mismo del sticker de Metro en Figma
      ctx.fillRect(x + 6 * u, y, lv - 12 * u, alto);
      if (!pintado) {
        ctx.fillStyle = C.Hueso; ctx.fillRect(x + 6 * u, y + alto * 0.62, lv - 12 * u, 8 * u);
      }
      // ventanas y puertas
      const nv = 4;
      for (let k = 0; k < nv; k++) {
        const wx = x + 16 * u + k * ((lv - 32 * u) / nv), ww = (lv - 32 * u) / nv - 14 * u;
        ctx.fillStyle = C.Negro; ctx.fillRect(wx, y + alto * 0.14, ww, alto * 0.32);
        ctx.fillStyle = 'rgba(127,200,248,.55)'; ctx.fillRect(wx + 3 * u, y + alto * 0.14 + 3 * u, ww - 6 * u, alto * 0.32 - 6 * u);
      }
      const puerta = t.abierto ? 14 * u : 0;
      ctx.fillStyle = C.Negro; ctx.fillRect(x + lv / 2 - 18 * u - puerta, y + alto * 0.1, 36 * u + 2 * puerta, alto * 0.86);
      if (pintado) this.vagonPintado(ctx, x + 6 * u, y, lv - 12 * u, alto, t.n);
    }
  }

  // Easter egg: el vagón pintado por la gente en la experiencia Vagón (de prueba: stickers y tags de Graffiti).
  private vagonPintado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, n: number) {
    const { u } = this.d;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const tag = imagen(SRC.tag);
    if (tag) { const th = h * 0.42, tw = th / (tag.naturalHeight / tag.naturalWidth || 0.5); ctx.drawImage(raster(tag, tw, th), x + w * 0.04, y + h * 0.54); }
    for (let k = 0; k < 4; k++) {
      const src = SRC.vagon[(n + k) % SRC.vagon.length], im = imagen(src);
      if (!im) continue;
      const lado = h * 0.38, sx = x + w * (0.08 + k * 0.23), sy = y + h * (k % 2 ? 0.08 : 0.5);
      ctx.save(); ctx.translate(sx + lado / 2, sy + lado / 2); ctx.rotate(((k * 37) % 20 - 10) * Math.PI / 180);
      ctx.drawImage(raster(im, lado, lado), -lado / 2, -lado / 2); ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = C.Negro; ctx.fillRect(x + w - 120 * u, y + h - 22 * u, 120 * u, 22 * u);
    this.textoPixel(ctx, 'VAGON ' + (n + 1), x + w - 112 * u, y + h - 17 * u, Math.max(1, Math.round(2 * u)), C.Amarillo);
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

// Precarga de todos los SVG que usa la escena.
export const TODAS_LAS_IMAGENES = [
  ...Object.values(SRC.personaje), SRC.araucaria, SRC.sol, SRC.helecho, SRC.flor, SRC.quisco, ...SRC.vagon, SRC.tag,
];
