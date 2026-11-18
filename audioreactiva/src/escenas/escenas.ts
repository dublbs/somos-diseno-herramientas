import type { Rasgos } from '../audio/motor';
import type { Pista } from '../audio/estilos';
import { AZUL, HUESO, LOOP_S, NEGRO, dibujarTunel, estallidoDelCiclo } from './tunel';

// Escenas de la Estación Audioreactiva, con los movimientos de Geométrica · Motion (Figma, sección 664:273897):
// una red de celdas que se deforma. Cada pista de la música mueve algo distinto y se nota al apagarla:
// la batería golpea (el bombo late, la caja destella, el hi-hat titila), el bajo deforma, los acordes tuercen o
// llenan y la melodía pone el color.
// Ronda 3 (plan 014 §1): Bum, Chas y el dedo sobre la escena tienen un efecto propio en cada escena (ver la tabla en
// docs/plans/009-refinamiento/audioreactiva.md). El Túnel es el C3 de Figma (tunel.ts).

export const C = {
  Hueso: HUESO, Negro: NEGRO, Azul: AZUL, Lapis: '#2B4BD8', Celeste: '#7FC8F8',
  Amarillo: '#FFC20E', Verde: '#00A651', Rosa: '#FF8FB1', Morado: '#7A2E8E',
};
const VIVOS = [C.Azul, C.Amarillo, C.Rosa, C.Verde, C.Celeste, C.Morado, C.Lapis];
// Cada nota tiene su color: se recorren por quintas para que dos notas vecinas de la escala no se parezcan.
export const colorNota = (m: number) => VIVOS[(((m % 12) * 7) % 12) % VIVOS.length];

const rgb = (h: string) => h.startsWith('#') ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) : (h.match(/\d+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
export function mezcla(a: string, b: string, t: number) {
  const x = rgb(a), y = rgb(b), k = Math.max(0, Math.min(1, t));
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`;
}
// pseudoazar estable (para que el hi-hat encienda celdas distintas en cada golpe sin parpadeo aleatorio)
const hash = (a: number, b: number, c: number) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return s - Math.floor(s); };
const lim = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
// envolventes de los pads, según los segundos desde el golpe
const cae = (t: number, dur: number) => (t < dur ? (1 - t / dur) ** 2 : 0);                 // 1 → 0
const sube = (t: number, ataque: number, dur: number) => (t < ataque ? t / ataque : cae(t - ataque, dur)); // 0 → 1 → 0
const rebote = (t: number) => (t < 1.4 ? Math.exp(-4.5 * t) * Math.cos(13 * t) : 0);        // 1 → −… → 0

/** Lo que hacen las manos: los pads (segundos desde el último Bum y Chas, y cuántos van) y el dedo sobre la escena
 * (x, y de 0 a 1 desde arriba a la izquierda; f = 1 mientras toca y cae a 0 al soltar). */
export interface Mando { x: number; y: number; f: number; tBum: number; tChas: number; nBum: number; nChas: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Estado = Record<string, any>;
export interface Escena {
  id: string;
  nombre: string;
  icono: string;
  linea: string;               // qué es, en una línea
  mapa: Record<Pista, string>; // qué mueve cada pista en esta escena (va en los pads de pistas)
  manos: { bum: string; chas: string; dedo: string }; // qué hacen Bum, Chas y el dedo en esta escena
  fondo: string;
  crear: () => Estado;
  dibujar: (ctx: CanvasRenderingContext2D, S: number, dt: number, r: Rasgos, e: Estado, m: Mando) => void;
}

// ---------------------------------------------------------------- Túnel
// El C3 «Túnel → estallido → túnel»: damero azul y hueso que avanza a velocidad constante y, a mitad del loop de 4 s,
// se redondea y tuerce en espiral. La música mueve parámetros de esa figura: el bombo acelera y hace latir, la caja
// gira el cuadro del centro, el bajo redondea, los acordes tuercen y la melodía suma anillos.
const tunel: Escena = {
  id: 'tunel', nombre: 'Túnel', icono: 'blur_on', fondo: C.Hueso,
  linea: 'El túnel de damero avanza, se vuelve espiral y vuelve a ser cuadrado; la música lo acelera y lo tuerce.',
  mapa: { bateria: 'Bombo acelera y hace latir, caja gira el centro', bajo: 'Redondea los anillos', acordes: 'Tuerce la espiral', melodia: 'Suma anillos' },
  manos: { bum: 'El túnel salta hacia adelante', chas: 'Los anillos invierten su color', dedo: 'Mueves el punto de fuga' },
  crear: () => ({ fase: 0, ciclo: 0, giro: 0, redondez: 0, torsion: 0, razon: 1.32 }),
  dibujar(ctx, S, dt, r, e, m) {
    const salto = cae(m.tBum, 0.5);
    e.fase += dt * (0.75 + r.volumen * 0.35 + r.bombo * 0.9 + salto * (r.quieto ? 2 : 8));
    e.ciclo += dt / LOOP_S;
    e.giro += dt * (0.12 + r.hat * 0.3);
    const est = estallidoDelCiclo(e.ciclo), suave = Math.min(1, dt * 4);
    e.redondez += (lim(est + r.bajo * 0.4) - e.redondez) * suave;
    e.torsion += ((est * 0.13 + r.acordes * 0.08) - e.torsion) * suave;
    e.razon += ((1.32 - r.melodia * 0.08) - e.razon) * suave;
    // Chas: los anillos invierten su color de adentro hacia afuera (en anillos alternos, así el damero se vuelve
    // rayos) y vuelven; con movimiento reducido, solo los anillos del fondo y sin barrido
    const invertidos = m.tChas < 0.55 ? (r.quieto ? 7 : Math.min(99, (m.tChas / 0.22) * 18)) : 0;
    dibujarTunel(ctx, S, S, {
      fase: e.fase, redondez: e.redondez, torsion: e.torsion, latido: Math.max(r.bombo, salto), giro: e.giro,
      razon: e.razon, acerca: salto * (r.quieto ? 0.1 : 0.45), giroCentro: est * Math.PI / 4 + r.caja * Math.PI / 8,
      fuga: [(m.x - 0.5) * 0.75 * m.f, (m.y - 0.5) * 0.75 * m.f],
      tinta: C.Azul, fondo: C.Hueso, centro: C.Negro, invertidos,
    });
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
  manos: { bum: 'El fuelle se comprime y rebota', chas: 'Un pliegue se abre', dedo: 'Estiras el fuelle bajo el dedo' },
  crear: () => ({ corre: 0, desplaza: 0, pliegue: 3, nChas: 0 }),
  dibujar(ctx, S, dt, r, e, m) {
    const n = r.bandas.length;
    e.corre += dt * (0.4 + r.volumen * 2.2);
    if (r.nuevo.caja) e.desplaza += 1;
    if (m.nChas !== e.nChas) { e.nChas = m.nChas; e.pliegue = (e.pliegue + 5) % n; }
    const aprieta = 1 - (r.quieto ? 0.12 : 0.42) * rebote(m.tBum);      // Bum: se comprime y rebota
    const empuje = sube(m.tBum, 0.06, 0.9) * (r.quieto ? 0.3 : 0.7);     // …y el fuelle se infla
    const abre = sube(m.tChas, 0.1, 0.75) * (r.quieto ? 0.5 : 1);        // Chas: un pliegue se abre
    // anchos: el pliegue abierto y las columnas bajo el dedo se ensanchan
    const cerca = Array.from({ length: n }, (_, i) => Math.exp(-(((i + 0.5) / n - m.x) ** 2) / 0.012) * m.f);
    const pesos = cerca.map((g, i) => 1 + g * 1.6 + (i === e.pliegue ? abre * 2.6 : 0));
    const total = pesos.reduce((s, v) => s + v, 0);
    ctx.fillStyle = C.Hueso; ctx.fillRect(0, 0, S, S);
    const tapa = r.notaMel >= 0 ? colorNota(r.notaMel) : C.Negro;
    let x0 = 0;
    for (let i = 0; i < n; i++) {
      const w = (pesos[i] / total) * S, g = cerca[i], esPliegue = i === e.pliegue && abre > 0.01;
      const extra = i < 3 ? r.bajo * 0.25 : i >= 4 && i < 8 ? r.acordes * 0.18 : 0;
      const nivel = Math.min(1, r.bandas[i] * 0.95 + extra + empuje * (0.6 + 0.4 * Math.sin(i * 1.3)));
      const paso = S * (0.085 - nivel * 0.06) * aprieta * (1 + g * 0.9) * (esPliegue ? 1 + abre * 1.4 : 1);
      const grosor = paso * (0.5 + nivel * 0.2) * (esPliegue ? 1 - abre * 0.5 : 1);
      let alto = S * (0.06 + nivel * 0.9);
      alto += (Math.max(alto, (1 - m.y) * S) - alto) * g; // el dedo tira del fuelle hacia arriba
      alto = Math.min(S * 0.98, alto * aprieta);
      const corre = ((e.corre + e.desplaza * 0.5) * paso * (i % 2 ? 1 : -1)) % paso;
      const x = x0 + w * 0.06, ancho = w * 0.88;
      x0 += w;
      ctx.save(); ctx.beginPath(); ctx.rect(x, 0, ancho, S); ctx.clip();
      if (esPliegue) { ctx.fillStyle = C.Negro; ctx.globalAlpha = abre * 0.9; ctx.fillRect(x, 0, ancho, S); ctx.globalAlpha = 1; }
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let y = -paso + corre; y < S; y += paso) ctx.fillRect(x, y, ancho, grosor * 0.35);
      ctx.beginPath(); ctx.rect(x, S - alto, ancho, alto); ctx.clip();
      const lista = LISTAS_ACORDEON[(i + e.desplaza) % LISTAS_ACORDEON.length];
      ctx.fillStyle = esPliegue ? mezcla(lista, C.Amarillo, abre) : lista;
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
  manos: { bum: 'El espejo gira de golpe un gajo', chas: 'Cambia la cantidad de gajos', dedo: 'Mueves el centro del espejo' },
  crear: () => ({ simetria: 6, giro: 0, fase: 0, compas: -1, inv: false, color: C.Rosa, golpe: 0, golpeObj: 0, nBum: 0, nChas: 0 }),
  dibujar(ctx, S, dt, r, e, m) {
    const siguiente = () => { e.simetria = ORDEN_SIMETRIA[(ORDEN_SIMETRIA.indexOf(e.simetria) + 1) % 3]; };
    if (r.compas !== e.compas) { if (e.compas >= 0 && r.acordes > 0.05) siguiente(); e.compas = r.compas; }
    if (m.nChas !== e.nChas) { e.nChas = m.nChas; siguiente(); }                  // Chas: cambian los gajos
    if (m.nBum !== e.nBum) { e.nBum = m.nBum; e.golpeObj += Math.PI / e.simetria; } // Bum: gira medio gajo
    e.golpe += (e.golpeObj - e.golpe) * Math.min(1, dt * (r.quieto ? 4 : 16));
    if (r.nuevo.caja && !r.quieto) e.inv = !e.inv;
    if (r.notaMel >= 0) e.color = colorNota(r.notaMel) === C.Lapis ? C.Celeste : colorNota(r.notaMel);
    e.giro += dt * (0.08 + r.acordes * 0.35 + r.tono * 0.3);
    e.fase += dt * (0.25 + r.medios * 0.8);
    const N = e.simetria, gajo = (Math.PI * 2) / N, R = S * 1.3 / Math.cos(gajo / 2);
    const T = Math.round(S * 2.3);
    if (!tesela || tesela.width !== T) { tesela = document.createElement('canvas'); tesela.width = tesela.height = T; }
    const [a, b] = e.inv ? [C.Lapis, e.color] : [e.color, C.Lapis];
    const t = tesela.getContext('2d')!, lado = S * (0.075 - r.volumen * 0.025);
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.fillStyle = a; t.fillRect(0, 0, T, T);
    t.translate(T / 2, T / 2); t.rotate(e.fase * 0.3); t.transform(1, 0, Math.sin(e.fase) * 0.3 + r.bajo * 0.8, 1, 0, 0);
    t.fillStyle = b;
    const q = Math.ceil(T / lado);
    for (let i = -q; i < q; i++) for (let j = -q; j < q; j++) if ((i + j) % 2 === 0) t.fillRect(i * lado, j * lado + Math.sin(i * 0.4 + e.fase) * lado * 0.3, lado, lado);
    ctx.fillStyle = a; ctx.fillRect(0, 0, S, S);
    // el centro del espejo sigue al dedo
    const cx = S * (0.5 + (m.x - 0.5) * 0.7 * m.f), cy = S * (0.5 + (m.y - 0.5) * 0.7 * m.f);
    const z = 1 + r.bombo * 0.14 + (r.quieto ? 0 : cae(m.tChas, 0.35) * 0.2 + cae(m.tBum, 0.4) * 0.25);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(e.giro + e.golpe); ctx.scale(z, z);
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
// los brazos se tocan (tejido). La caja gira las celdas 45° (de cruz a equis), el bombo las agranda, la melodía corre
// el color y el hi-hat enciende celdas sueltas.
const COLORES_TEJIDO = [C.Negro, C.Azul, C.Lapis, C.Morado, C.Verde, C.Rosa];
interface Onda { col: number; fila: number; t: number; fuerza: number; bum: boolean }
const tejido: Escena = {
  id: 'tejido', nombre: 'Tejido', icono: 'texture', fondo: C.Celeste,
  linea: 'Puntos que se vuelven cruces y luego tela; cada columna escucha una banda.',
  mapa: { bateria: 'Caja gira las cruces, bombo las agranda', bajo: 'Teje a la izquierda', acordes: 'Teje al centro', melodia: 'Suelta ondas y corre el color' },
  manos: { bum: 'Una onda amarilla sale del centro', chas: 'Los hilos se cruzan', dedo: 'Pellizcas la trama' },
  crear: () => ({ vueltas: 0, objetivo: 0, fase: 0, hats: 0, t: 0, ondas: [] as Onda[], nBum: 0 }),
  dibujar(ctx, S, dt, r, e, m) {
    if (r.nuevo.caja) e.objetivo += 0.5;
    if (r.nuevo.hat) e.hats++;
    e.vueltas += (e.objetivo - e.vueltas) * Math.min(1, dt * (r.quieto ? 3 : 10));
    e.fase += dt * 0.3 + (r.nuevo.mel ? 1 : 0);
    e.t += dt * (0.6 + r.volumen); // la tela respira más rápido mientras más suena
    const n = 12, c = S / n;
    // cada nota de la melodía suelta una onda desde la columna de su nota (do a la izquierda, si a la derecha)
    if (r.nuevo.mel && r.notaMel >= 0 && !r.quieto) e.ondas.push({ col: r.notaMel % 12, fila: n / 2, t: 0, fuerza: 0.7, bum: false });
    if (m.nBum !== e.nBum) { e.nBum = m.nBum; e.ondas.push({ col: (n - 1) / 2, fila: (n - 1) / 2, t: 0, fuerza: r.quieto ? 0.6 : 1.4, bum: true }); } // Bum
    e.ondas = e.ondas.filter((o: Onda) => (o.t += dt) < 0.9);
    const cruce = sube(m.tChas, 0.12, 0.7) * (r.quieto ? 0.4 : 1); // Chas: las filas se corren y los hilos se cruzan
    const dx = m.x * S, dy = m.y * S;
    ctx.fillStyle = C.Celeste; ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < n; i++) {
      const extra = i < 4 ? r.bajo * 0.45 : i < 8 ? r.acordes * 0.35 : 0;
      const banda = r.bandas[i] + extra;
      for (let j = 0; j < n; j++) {
        const altura = (n - 1 - j) / (n - 1);
        const ola = 0.2 * Math.sin(e.t * 3.6 - i * 0.5 + j * 0.3); // la tela respira aunque suene poco
        let onda = 0, amarilla = 0;
        for (const o of e.ondas as Onda[]) {
          const d = Math.hypot(i - o.col, j - o.fila), radio = o.t * 16;
          const v = Math.max(0, 1 - Math.abs(d - radio) / 1.6) * (1 - o.t / 0.9) * o.fuerza;
          onda += v; if (o.bum) amarilla += v;
        }
        let cx = (i + 0.5) * c + (j % 2 ? 1 : -1) * c * 0.5 * cruce, cy = (j + 0.5) * c;
        // el dedo pellizca la trama: las celdas cercanas se juntan hacia él y crecen
        const d2 = ((cx - dx) ** 2 + (cy - dy) ** 2) / (S * S), tira = m.f * 0.3 * Math.exp(-d2 / 0.1);
        cx += (dx - cx) * tira; cy += (dy - cy) * tira;
        const crece = lim(Math.max(banda * 1.2 + r.volumen * 0.3 - altura * 0.75 + r.bombo * 0.5 + ola + onda * 0.7 + amarilla * 1.3, cruce, tira * 3.4));
        let color = COLORES_TEJIDO[Math.floor((i + j) * 0.5 + e.fase) % COLORES_TEJIDO.length];
        if (amarilla > 0.05) color = mezcla(color, C.Amarillo, Math.min(1, amarilla));
        if (r.hat > 0.08 && hash(i, j, e.hats) > 0.8) color = mezcla(color, C.Hueso, r.hat * 1.3);
        ctx.save(); ctx.translate(cx, cy);
        ctx.rotate(((i + j) % 2 ? 1 : -1) * e.vueltas * (Math.PI / 2));
        ctx.fillStyle = color;
        const punto = c * (0.16 + crece * 0.26);
        ctx.fillRect(-punto / 2, -punto / 2, punto, punto);
        if (crece > 0.2) {
          const largo = (c / 2) * Math.min(1, (crece - 0.2) / 0.6) * (1.02 + cruce * 0.5), grosor = punto * 0.6;
          ctx.fillRect(-largo, -grosor / 2, largo * 2, grosor);
          ctx.fillRect(-grosor / 2, -largo * 0.6, grosor, largo * 1.2); // brazo corto: así se nota el giro
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
  manos: { bum: 'Los escalones suben en cadena', chas: 'Destella un peldaño', dedo: 'Inclinas la escalera' },
  crear: () => ({ corre: 0, sube: 0, color: C.Azul, hats: 0, alza: Array(16).fill(0), peldano: 5, nChas: 0 }),
  dibujar(ctx, S, dt, r, e, m) {
    const filas = 8, h = S / filas, n = 16, w = S / n;
    if (r.notaMel >= 0) e.color = colorNota(r.notaMel);
    if (r.nuevo.hat) e.hats++;
    if (m.nChas !== e.nChas) { e.nChas = m.nChas; e.peldano = Math.floor(hash(m.nChas, 3, 7) * n); }
    e.corre += dt * (0.3 + r.volumen * 0.5);
    e.sube += ((0.06 + r.bajo * 0.24 + r.bajo * r.notaBajo * 0.22) - e.sube) * Math.min(1, dt * 6);
    // Bum: los escalones suben en cadena (de izquierda a derecha); el dedo inclina la escalera (a la izquierda baja)
    const tBum = m.tBum, inclina = (m.x - 0.5) * 2 * m.f;
    const rise = h * (e.sube + inclina * 0.45);
    for (let i = 0; i < n; i++) e.alza[i] += ((i === r.paso ? 1 : 0) - e.alza[i]) * Math.min(1, dt * 14);
    const FR = [e.color, C.Hueso, C.Azul, C.Hueso, e.color, C.Hueso, C.Negro, C.Hueso];
    const col = (j: number) => FR[((j % FR.length) + FR.length) % FR.length];
    ctx.fillStyle = C.Hueso; ctx.fillRect(0, 0, S, S);
    const salto = r.bombo * h * 0.45, tirar = (m.y - 0.5) * h * 1.2 * m.f;
    const destello = r.quieto ? cae(m.tChas, 0.9) * 0.3 : cae(m.tChas, 0.55);
    for (let i = 0; i < n; i++) {
      const x = Math.floor(i * w), ancho = Math.ceil(w) + 1;
      const cadena = sube(tBum - i * 0.018, 0.07, 0.6) * h * (r.quieto ? 0.4 : 1.3) * (0.5 + 0.5 * i / (n - 1));
      const dy = (i - (n - 1) / 2) * -rise + (e.corre * h) % (h * FR.length) - salto * (0.6 + 0.4 * Math.sin(i * 0.7)) - e.alza[i] * h * 0.45 - cadena + tirar - (i === e.peldano ? destello * h * 0.6 : 0);
      const v = r.bandas[Math.floor((i * 12) / n)];
      const muesca = Math.max(0, Math.min(1, (v - 0.3) / 0.7) * 0.3 + r.acordes * 0.45);
      for (let j = -FR.length * 2; j < filas + FR.length; j++) {
        const y = j * h + dy;
        if (y > S || y + h < 0) continue;
        ctx.fillStyle = col(j); ctx.fillRect(x, y, ancho, h + 0.5);
        if (muesca > 0.02) { ctx.fillStyle = col(j + 1); ctx.fillRect(x + w * 0.3, y + h * (1 - 0.5 * muesca), w * 0.4, h * 0.5 * muesca + 0.5); }
        if (r.hat > 0.05 && j % 2 === 0 && hash(i, j, e.hats) > 0.7) {
          ctx.fillStyle = C.Hueso === col(j) ? C.Negro : C.Hueso; ctx.globalAlpha = Math.min(1, r.hat * 1.6);
          ctx.fillRect(x + w * 0.35, y + h * 0.08, w * 0.3, w * 0.3); ctx.globalAlpha = 1;
        }
      }
      if (e.alza[i] > 0.05) { ctx.fillStyle = C.Negro; ctx.globalAlpha = e.alza[i]; ctx.fillRect(x, S - h * 0.12 * e.alza[i], ancho, h * 0.12 * e.alza[i]); ctx.globalAlpha = 1; }
      if (i === e.peldano && destello > 0.01) { // Chas: un peldaño destella (invierte su columna) con un cuadro amarillo
        ctx.save();
        if (r.quieto) { ctx.globalAlpha = destello; ctx.fillStyle = C.Hueso; ctx.fillRect(x, 0, ancho, S); }
        else { ctx.globalCompositeOperation = 'difference'; ctx.globalAlpha = destello; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, 0, ancho, S); }
        ctx.restore();
        const l = w * (1 + (1 - destello) * 2.4);
        ctx.fillStyle = C.Amarillo; ctx.globalAlpha = Math.min(1, destello * 1.4);
        ctx.fillRect(x + w / 2 - l / 2, S / 2 - l / 2, l, l); ctx.globalAlpha = 1;
      }
    }
    if (r.caja > 0.02) { // destello: invierte los colores un instante
      ctx.save();
      if (r.quieto) { ctx.globalAlpha = r.caja * 0.2; ctx.fillStyle = C.Hueso; }
      else { ctx.globalCompositeOperation = 'difference'; ctx.globalAlpha = Math.min(0.8, r.caja * 0.9); ctx.fillStyle = '#FFFFFF'; }
      ctx.fillRect(0, 0, S, S); ctx.restore();
    }
  },
};

export const ESCENAS: Escena[] = [tunel, acordeon, caleidoscopio, tejido, escalera];

// ---------------------------------------------------------------- compositor
// Lleva la cuenta de las manos (pads y dedo) y se la pasa a la escena: cada escena decide qué hacer con ellas.
export class Compositor {
  readonly mando: Mando = { x: 0.5, y: 0.5, f: 0, tBum: 99, tChas: 99, nBum: 0, nChas: 0 };

  dibujar(ctx: CanvasRenderingContext2D, S: number, dt: number, r: Rasgos, escena: Escena, e: Estado, dedo: { x: number; y: number } | null) {
    const m = this.mando;
    m.tBum += dt; m.tChas += dt;
    if (r.nuevo.mano && r.manoTipo === 'bum') { m.tBum = 0; m.nBum++; }
    if (r.nuevo.mano && r.manoTipo === 'chas') { m.tChas = 0; m.nChas++; }
    if (dedo) {
      if (m.f < 0.05) { m.x = dedo.x; m.y = dedo.y; }
      else { const k = Math.min(1, dt * 14); m.x += (dedo.x - m.x) * k; m.y += (dedo.y - m.y) * k; }
    }
    m.f += ((dedo ? 1 : 0) - m.f) * Math.min(1, dt * (dedo ? 8 : 3));
    if (m.f < 0.001) m.f = 0;
    escena.dibujar(ctx, S, dt, r, e, m);
  }
}
