import type { Rasgos } from '../audio/motor';
import type { Pista } from '../audio/estilos';

// Escenas de la Estación Audioreactiva, con los movimientos de Geométrica · Motion (Figma, sección 664:273897):
// una red de celdas que se deforma. Cada pista de la música mueve algo distinto y se nota al apagarla:
// la batería golpea (el bombo late, la caja destella, el hi-hat titila), el bajo deforma, los acordes tuercen o
// llenan y la melodía pone el color.

export const C = {
  Hueso: '#F4EEE3', Negro: '#000000', Azul: '#0062B8', Lapis: '#2B4BD8', Celeste: '#7FC8F8',
  Amarillo: '#FFC20E', Verde: '#00A651', Rosa: '#FF8FB1', Morado: '#7A2E8E',
};
const VIVOS = [C.Azul, C.Amarillo, C.Rosa, C.Verde, C.Celeste, C.Morado, C.Lapis];
// Cada nota tiene su color: se recorren por quintas para que dos notas vecinas de la escala no se parezcan.
export const colorNota = (m: number) => VIVOS[(((m % 12) * 7) % 12) % VIVOS.length];

const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export function mezcla(a: string, b: string, t: number) {
  const x = rgb(a), y = rgb(b), k = Math.max(0, Math.min(1, t));
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`;
}
// pseudoazar estable (para que el hi-hat encienda celdas distintas en cada golpe sin parpadeo aleatorio)
const hash = (a: number, b: number, c: number) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return s - Math.floor(s); };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Estado = Record<string, any>;
export interface Escena {
  id: string;
  nombre: string;
  icono: string;
  linea: string;               // qué es, en una línea
  mapa: Record<Pista, string>; // qué mueve cada pista en esta escena (va en los pads de pistas)
  fondo: string;
  crear: () => Estado;
  dibujar: (ctx: CanvasRenderingContext2D, S: number, dt: number, r: Rasgos, e: Estado) => void;
}

// ---------------------------------------------------------------- Túnel
// Anillos que vienen hacia ti. Cada anillo nuevo toma el color de la nota que suena; el bombo empuja el viaje y lo
// hace latir; la caja enciende los anillos oscuros; el hi-hat hace brillar las esquinas; el bajo los ondula (más
// lóbulos mientras más agudo) y los acordes tuercen el túnel.
const tunel: Escena = {
  id: 'tunel', nombre: 'Túnel', icono: 'blur_on', fondo: C.Negro,
  linea: 'Viajas por un túnel de anillos: el bombo te empuja y la melodía pinta cada anillo nuevo.',
  mapa: { bateria: 'Bombo empuja, caja enciende, hi-hat brilla', bajo: 'Ondula los anillos', acordes: 'Tuerce el túnel', melodia: 'Pinta los anillos nuevos' },
  crear: () => ({ anillos: Array.from({ length: 18 }, (_, i) => ({ z: (i + 0.5) / 18, k: i, color: VIVOS[i % VIVOS.length] })), cuenta: 18, giro: 0, t: 0, torsion: 0 }),
  dibujar(ctx, S, dt, r, e) {
    e.t += dt;
    const vel = 0.13 + r.volumen * 0.1 + r.bombo * 0.55 + r.mano * 0.6;
    const color = r.notaMel >= 0 ? colorNota(r.notaMel) : C.Azul;
    e.giro += dt * (0.12 + r.acordes * 0.5);
    e.torsion += ((0.2 + r.acordes * 1.8) - e.torsion) * Math.min(1, dt * 3);
    for (const a of e.anillos) { a.z -= vel * dt; if (a.z <= 0.03) { a.z += 1; a.k = e.cuenta++; a.color = color; } }
    ctx.fillStyle = C.Negro; ctx.fillRect(0, 0, S, S);
    const fx = S / 2 + Math.sin(e.t * 0.37) * S * 0.07, fy = S / 2 + Math.cos(e.t * 0.29) * S * 0.07; // punto de fuga
    const lob = 2 + Math.round(r.notaBajo * 4), def = r.bajo * 0.14;
    const caja = r.quieto ? r.caja * 0.25 : r.caja;
    const orden = [...e.anillos].sort((a, b) => a.z - b.z);
    for (const a of orden) {
      const R = (S * 0.075) / (a.z + 0.02) * (1 + r.bombo * 0.12 * (1 - a.z));
      const cx = S / 2 + (fx - S / 2) * a.z, cy = S / 2 + (fy - S / 2) * a.z;
      const oscuro = a.k % 2 === 1;
      const col = oscuro ? mezcla(C.Negro, C.Hueso, caja * 0.9 * (1 - a.z * 0.6)) : mezcla(a.color, C.Negro, a.z * 0.75);
      const rot = e.giro + a.z * e.torsion;
      ctx.fillStyle = col; ctx.beginPath();
      for (let j = 0; j <= 64; j++) {
        const th = (j / 64) * Math.PI * 2, cuadrado = 1 / Math.max(Math.abs(Math.cos(th)), Math.abs(Math.sin(th)));
        const rad = R * (cuadrado * 0.8 + 0.2) * (1 + def * Math.sin(lob * th + e.t * 2.5 + a.k));
        const x = cx + rad * Math.cos(th + rot), y = cy + rad * Math.sin(th + rot);
        j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.fill();
      if (!oscuro && r.hat > 0.02 && a.z < 0.85) { // esquinas que brillan con el hi-hat
        const l = Math.max(2, R * 0.06);
        ctx.fillStyle = C.Hueso; ctx.globalAlpha = Math.min(1, r.hat * 1.4) * (1 - a.z);
        for (let q = 0; q < 4; q++) {
          const th = Math.PI / 4 + (q * Math.PI) / 2, rad = R * 1.13 * (1 + def * Math.sin(lob * th + e.t * 2.5 + a.k));
          ctx.fillRect(cx + rad * Math.cos(th + rot) - l / 2, cy + rad * Math.sin(th + rot) - l / 2, l, l);
        }
        ctx.globalAlpha = 1;
      }
    }
  },
};

// ---------------------------------------------------------------- Acordeón
// Doce columnas, una por banda del sonido (graves a la izquierda, agudos a la derecha). Las listas se comprimen con
// la energía de su banda y se pintan desde abajo hasta su nivel. La caja hace saltar el color; el bombo engorda las
// tapas; la melodía pinta las tapas y el hi-hat las hace brillar.
const LISTAS_ACORDEON = [C.Verde, C.Azul, C.Amarillo, C.Rosa, C.Lapis];
const acordeon: Escena = {
  id: 'acordeon', nombre: 'Acordeón', icono: 'view_week', fondo: C.Hueso,
  linea: 'Doce columnas, una por banda del sonido: graves a la izquierda, agudos a la derecha.',
  mapa: { bateria: 'Bombo engorda las tapas, caja cambia el color', bajo: 'Llena las columnas de la izquierda', acordes: 'Llena el centro', melodia: 'Pinta las tapas' },
  crear: () => ({ corre: 0, desplaza: 0 }),
  dibujar(ctx, S, dt, r, e) {
    e.corre += dt * (0.4 + r.volumen * 2.2);
    if (r.nuevo.caja || r.nuevo.mano) e.desplaza += 1;
    ctx.fillStyle = C.Hueso; ctx.fillRect(0, 0, S, S);
    const n = r.bandas.length, w = S / n;
    const tapa = r.notaMel >= 0 ? colorNota(r.notaMel) : C.Negro;
    for (let i = 0; i < n; i++) {
      const extra = i < 3 ? r.bajo * 0.25 : i >= 4 && i < 8 ? r.acordes * 0.18 : 0;
      const nivel = Math.min(1, r.bandas[i] * 0.95 + extra);
      const paso = S * (0.085 - nivel * 0.06);
      const grosor = paso * (0.5 + nivel * 0.2);
      const alto = S * (0.06 + nivel * 0.9);
      const corre = ((e.corre + e.desplaza * 0.5) * paso * (i % 2 ? 1 : -1)) % paso;
      const x = i * w + w * 0.06, ancho = w * 0.88;
      ctx.save(); ctx.beginPath(); ctx.rect(x, 0, ancho, S); ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let y = -paso + corre; y < S; y += paso) ctx.fillRect(x, y, ancho, grosor * 0.35);
      ctx.beginPath(); ctx.rect(x, S - alto, ancho, alto); ctx.clip();
      ctx.fillStyle = LISTAS_ACORDEON[(i + e.desplaza) % LISTAS_ACORDEON.length];
      for (let y = -paso + corre; y < S; y += paso) ctx.fillRect(x, y, ancho, grosor);
      ctx.restore();
      const gt = S * 0.014 * (1 + r.bombo * 2.2);
      ctx.fillStyle = tapa; ctx.fillRect(x, S - alto - gt, ancho, gt);
      if (r.hat > 0.05 && hash(i, e.desplaza, Math.round(e.corre * 4)) > 0.5) {
        ctx.fillStyle = C.Hueso; ctx.globalAlpha = Math.min(1, r.hat * 1.5);
        ctx.fillRect(x + ancho * 0.2, S - alto - gt * 0.65, ancho * 0.6, gt * 0.3); ctx.globalAlpha = 1;
      }
    }
  },
};

// ---------------------------------------------------------------- Caleidoscopio
// Un damero inclinado se refleja en gajos. En cada compás nuevo (si suenan los acordes) cambia la simetría: 4, 6, 8.
// El bombo lo acerca de golpe, la caja invierte sus colores, el bajo lo inclina y la melodía colorea las celdas.
const ORDEN_SIMETRIA = [4, 6, 8];
let tesela: HTMLCanvasElement | null = null;
const caleidoscopio: Escena = {
  id: 'caleidoscopio', nombre: 'Caleidoscopio', icono: 'auto_awesome', fondo: C.Lapis,
  linea: 'Un damero reflejado en gajos: los acordes cambian la simetría en cada compás.',
  mapa: { bateria: 'Bombo acerca, caja invierte, hi-hat hace brillar la estrella', bajo: 'Inclina el damero', acordes: 'Gira y cambia los gajos', melodia: 'Colorea las celdas' },
  crear: () => ({ simetria: 6, giro: 0, fase: 0, compas: -1, inv: false, color: C.Rosa }),
  dibujar(ctx, S, dt, r, e) {
    if (r.compas !== e.compas) { if (e.compas >= 0 && r.acordes > 0.05) e.simetria = ORDEN_SIMETRIA[(ORDEN_SIMETRIA.indexOf(e.simetria) + 1) % 3]; e.compas = r.compas; }
    if (r.nuevo.caja && !r.quieto) e.inv = !e.inv;
    if (r.notaMel >= 0) e.color = colorNota(r.notaMel) === C.Lapis ? C.Celeste : colorNota(r.notaMel);
    e.giro += dt * (0.08 + r.acordes * 0.35 + r.tono * 0.3);
    e.fase += dt * (0.25 + r.medios * 0.8);
    const N = e.simetria, gajo = (Math.PI * 2) / N, R = S * 0.75 / Math.cos(gajo / 2);
    const T = Math.round(S * 1.7);
    if (!tesela || tesela.width !== T) { tesela = document.createElement('canvas'); tesela.width = tesela.height = T; }
    const [a, b] = e.inv ? [C.Lapis, e.color] : [e.color, C.Lapis];
    const t = tesela.getContext('2d')!, lado = S * (0.075 - r.volumen * 0.025);
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.fillStyle = a; t.fillRect(0, 0, T, T);
    t.translate(T / 2, T / 2); t.rotate(e.fase * 0.3); t.transform(1, 0, Math.sin(e.fase) * 0.3 + r.bajo * 0.8, 1, 0, 0);
    t.fillStyle = b;
    const m = Math.ceil(T / lado);
    for (let i = -m; i < m; i++) for (let j = -m; j < m; j++) if ((i + j) % 2 === 0) t.fillRect(i * lado, j * lado + Math.sin(i * 0.4 + e.fase) * lado * 0.3, lado, lado);
    ctx.fillStyle = C.Lapis; ctx.fillRect(0, 0, S, S);
    const z = 1 + r.bombo * 0.14 + r.mano * 0.1;
    ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(e.giro); ctx.scale(z, z);
    for (let k = 0; k < N; k++) {
      ctx.save();
      if (k % 2) { ctx.rotate((k + 1) * gajo); ctx.scale(1, -1); } else ctx.rotate(k * gajo);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R, 0); ctx.lineTo(R * Math.cos(gajo), R * Math.sin(gajo)); ctx.closePath(); ctx.clip();
      ctx.drawImage(tesela, -T / 2, -T / 2);
      ctx.restore();
    }
    const est = S * (0.05 + r.volumen * 0.04) * (1 + r.hat * 0.6);
    ctx.fillStyle = C.Amarillo; ctx.beginPath();
    for (let k = 0; k < N * 2; k++) { const rr = k % 2 ? est * 0.45 : est, an = (k / (N * 2)) * Math.PI * 2; k ? ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : ctx.moveTo(rr, 0); }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  },
};

// ---------------------------------------------------------------- Tejido
// Un ecualizador en forma de tela: con poca energía la celda es un punto, con más le salen brazos (cruz) y al máximo
// los brazos se tocan (tejido). La caja gira las celdas 90°, el bombo las agranda, la melodía corre el color y el
// hi-hat enciende celdas sueltas.
const COLORES_TEJIDO = [C.Negro, C.Azul, C.Lapis, C.Morado, C.Verde, C.Rosa];
const tejido: Escena = {
  id: 'tejido', nombre: 'Tejido', icono: 'texture', fondo: C.Celeste,
  linea: 'Puntos que se vuelven cruces y luego tela; cada columna escucha una banda.',
  mapa: { bateria: 'Caja gira las celdas, bombo las agranda', bajo: 'Teje a la izquierda', acordes: 'Teje al centro', melodia: 'Corre el color' },
  crear: () => ({ vueltas: 0, objetivo: 0, fase: 0, hats: 0 }),
  dibujar(ctx, S, dt, r, e) {
    if (r.nuevo.caja || r.nuevo.mano) e.objetivo += 1;
    if (r.nuevo.hat) e.hats++;
    e.vueltas += (e.objetivo - e.vueltas) * Math.min(1, dt * (r.quieto ? 3 : 10));
    e.fase += dt * 0.3 + (r.nuevo.mel ? 1 : 0);
    const n = 12, c = S / n;
    ctx.fillStyle = C.Celeste; ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < n; i++) {
      const extra = i < 4 ? r.bajo * 0.45 : i < 8 ? r.acordes * 0.35 : 0;
      const banda = r.bandas[i] + extra;
      for (let j = 0; j < n; j++) {
        const altura = (n - 1 - j) / (n - 1);
        const crece = Math.max(0, Math.min(1, banda * 1.15 + r.volumen * 0.25 - altura * 0.8 + r.bombo * 0.35));
        const cx = (i + 0.5) * c, cy = (j + 0.5) * c;
        let color = COLORES_TEJIDO[Math.floor((i + j) * 0.5 + e.fase) % COLORES_TEJIDO.length];
        if (r.hat > 0.08 && hash(i, j, e.hats) > 0.88) color = mezcla(color, C.Hueso, r.hat * 1.3);
        ctx.save(); ctx.translate(cx, cy);
        ctx.rotate(((i + j) % 2 ? 1 : -1) * e.vueltas * (Math.PI / 2));
        ctx.fillStyle = color;
        const punto = c * (0.12 + crece * 0.2);
        ctx.fillRect(-punto / 2, -punto / 2, punto, punto);
        if (crece > 0.25) {
          const largo = (c / 2) * Math.min(1, (crece - 0.25) / 0.6) * 1.02, grosor = punto * 0.5;
          ctx.fillRect(-largo, -grosor / 2, largo * 2, grosor);
          ctx.fillRect(-grosor / 2, -largo, grosor, largo * 2);
        }
        ctx.restore();
      }
    }
  },
};

// ---------------------------------------------------------------- Escalera
// Dieciséis columnas, una por semicorchea del compás: la que suena se levanta (se ve el secuenciador). Las franjas
// bajan; el bajo empina la escalera (más mientras más agudo), el bombo la hace saltar, la caja la destella, el hi-hat
// hace titilar los peldaños, los acordes abren muescas y la melodía cambia el color de las franjas de acento.
const escalera: Escena = {
  id: 'escalera', nombre: 'Escalera', icono: 'stairs', fondo: C.Amarillo,
  linea: 'Franjas que se vuelven escalera; la columna que se levanta marca el paso del compás.',
  mapa: { bateria: 'Bombo salta, caja destella, hi-hat titila', bajo: 'Empina la escalera', acordes: 'Abre muescas', melodia: 'Cambia el color de las franjas' },
  crear: () => ({ corre: 0, sube: 0, color: C.Azul, hats: 0, alza: Array(16).fill(0) }),
  dibujar(ctx, S, dt, r, e) {
    const filas = 8, h = S / filas, n = 16, w = S / n;
    if (r.notaMel >= 0) e.color = colorNota(r.notaMel);
    if (r.nuevo.hat) e.hats++;
    e.corre += dt * (0.3 + r.volumen * 0.5);
    e.sube += ((0.1 + r.bajo * 0.5 + r.bajo * r.notaBajo * 0.35) - e.sube) * Math.min(1, dt * 6);
    const rise = h * e.sube;
    for (let i = 0; i < n; i++) e.alza[i] += ((i === r.paso ? 1 : 0) - e.alza[i]) * Math.min(1, dt * 14);
    const FR = [e.color, C.Hueso, C.Azul, C.Hueso, e.color, C.Hueso, C.Negro, C.Hueso];
    const col = (j: number) => FR[((j % FR.length) + FR.length) % FR.length];
    ctx.fillStyle = C.Hueso; ctx.fillRect(0, 0, S, S);
    const salto = r.bombo * h * 0.45 + r.mano * h * 0.4;
    for (let i = 0; i < n; i++) {
      const x = Math.floor(i * w), ancho = Math.ceil(w) + 1;
      const dy = (i - (n - 1) / 2) * -rise + (e.corre * h) % (h * FR.length) - salto * (0.6 + 0.4 * Math.sin(i * 0.7)) - e.alza[i] * h * 0.45;
      const v = r.bandas[Math.floor((i * 12) / n)];
      const muesca = Math.max(0, Math.min(1, (v - 0.25) / 0.75) * 0.5 + r.acordes * 0.5);
      for (let j = -FR.length * 2; j < filas + FR.length; j++) {
        const y = j * h + dy;
        if (y > S || y + h < 0) continue;
        ctx.fillStyle = col(j); ctx.fillRect(x, y, ancho, h + 0.5);
        if (muesca > 0.02) { ctx.fillStyle = col(j + 1); ctx.fillRect(x + w * 0.2, y + h * (1 - 0.6 * muesca), w * 0.6, h * 0.6 * muesca + 0.5); }
        if (r.hat > 0.05 && j % 2 === 0 && hash(i, j, e.hats) > 0.7) {
          ctx.fillStyle = C.Hueso === col(j) ? C.Negro : C.Hueso; ctx.globalAlpha = Math.min(1, r.hat * 1.6);
          ctx.fillRect(x + w * 0.35, y + h * 0.08, w * 0.3, w * 0.3); ctx.globalAlpha = 1;
        }
      }
      if (e.alza[i] > 0.05) { ctx.fillStyle = C.Negro; ctx.globalAlpha = e.alza[i]; ctx.fillRect(x, S - h * 0.12 * e.alza[i], ancho, h * 0.12 * e.alza[i]); ctx.globalAlpha = 1; }
    }
    if (r.caja > 0.02) { // destello: invierte los colores un instante
      ctx.save();
      if (r.quieto) { ctx.globalAlpha = r.caja * 0.2; ctx.fillStyle = C.Hueso; }
      else { ctx.globalCompositeOperation = 'difference'; ctx.globalAlpha = Math.min(1, r.caja * 1.1); ctx.fillStyle = '#FFFFFF'; }
      ctx.fillRect(0, 0, S, S); ctx.restore();
    }
  },
};

export const ESCENAS: Escena[] = [tunel, acordeon, caleidoscopio, tejido, escalera];

// ---------------------------------------------------------------- compositor
// Encima de cada escena: lo que hace el dedo (giro, zoom, eco visual y color) y el estallido de los pads.
export class Compositor {
  private capa = document.createElement('canvas');
  private previo = document.createElement('canvas');
  private giro = 0;
  private estallidos: { t: number; tipo: 'bum' | 'chas'; color: string }[] = [];

  dibujar(ctx: CanvasRenderingContext2D, S: number, dt: number, r: Rasgos, escena: Escena, e: Estado, x: number | null) {
    for (const c of [this.capa, this.previo]) if (c.width !== S) { c.width = c.height = S; }
    const k = this.capa.getContext('2d')!;
    escena.dibujar(k, S, dt, r, e);
    // giro con el dedo a izquierda o derecha; zoom con el eco (arriba)
    this.giro += (((x === null ? 0.5 : x) - 0.5) * 0.7 - this.giro) * Math.min(1, dt * 5);
    const g = this.giro, cubre = Math.abs(Math.cos(g)) + Math.abs(Math.sin(g)), z = cubre * (1 + r.eco * 0.3);
    ctx.save();
    ctx.fillStyle = escena.fondo; ctx.fillRect(0, 0, S, S);
    ctx.translate(S / 2, S / 2); ctx.rotate(g); ctx.scale(z, z); ctx.drawImage(this.capa, -S / 2, -S / 2);
    ctx.restore();
    if (r.eco > 0.02) { // eco visual: el cuadro anterior, un poco más grande, se queda como estela
      ctx.save(); ctx.globalAlpha = r.eco * 0.6;
      ctx.translate(S / 2, S / 2); ctx.scale(1.05, 1.05); ctx.drawImage(this.previo, -S / 2, -S / 2);
      ctx.restore();
    }
    if (r.filtro < 0.98) { // filtro cerrado: el sonido se apaga y el color se va al azul
      ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.globalAlpha = (1 - r.filtro) * 0.9;
      ctx.fillStyle = C.Azul; ctx.fillRect(0, 0, S, S); ctx.restore();
    }
    if (r.nuevo.mano && r.manoTipo) this.estallidos.push({ t: 0, tipo: r.manoTipo, color: r.manoTipo === 'bum' ? C.Amarillo : C.Rosa });
    this.estallidos = this.estallidos.filter(b => (b.t += dt) < 0.7);
    for (const b of this.estallidos) {
      const p = b.t / 0.7, a = 1 - p;
      ctx.save(); ctx.translate(S / 2, S / 2); ctx.globalAlpha = r.quieto ? a * 0.4 : a;
      ctx.strokeStyle = b.color; ctx.fillStyle = b.color; ctx.lineWidth = S * 0.03 * a + 2;
      if (b.tipo === 'bum') { // cuadrados que se abren
        for (let q = 0; q < 3; q++) { const l = S * (0.1 + p * 0.9) * (1 - q * 0.25); ctx.rotate(Math.PI / 12); ctx.strokeRect(-l / 2, -l / 2, l, l); }
      } else { // rayos que giran
        ctx.rotate(p * 1.2);
        for (let q = 0; q < 12; q++) { ctx.rotate(Math.PI / 6); ctx.fillRect(S * (0.08 + p * 0.3), -S * 0.012, S * 0.16 * a + 4, S * 0.024); }
      }
      ctx.restore();
    }
    const pk = this.previo.getContext('2d')!; pk.clearRect(0, 0, S, S); pk.drawImage(ctx.canvas, 0, 0, S, S);
  }
}
