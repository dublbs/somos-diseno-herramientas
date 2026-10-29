import type { Rasgos } from '../audio/oido';

// Escenas de la Estación Audioreactiva, hechas con los movimientos de Geométrica · Motion (Figma, sección 664:273897):
// «Geométrica se mueve como una sola red de celdas que se deforma: se inclina, se curva, se desplaza, gira o se refleja.
//  Nada aparece de la nada.» Acá el sonido decide cuánto y cuándo se deforma la red.

export const C = {
  Hueso: '#F4EEE3', Negro: '#000000', Azul: '#0062B8', Lapis: '#2B4BD8', Celeste: '#7FC8F8',
  Amarillo: '#FFC20E', Verde: '#00A651', Rosa: '#FF8FB1', Morado: '#7A2E8E',
};

// Estado que cada escena guarda entre cuadros (fases que avanzan, giros que se acumulan).
export interface Estado { fase: number; giro: number; simetria: number; vueltas: number; objetivoVueltas: number; desplaza: number }
export const estadoInicial = (): Estado => ({ fase: 0, giro: 0, simetria: 8, vueltas: 0, objetivoVueltas: 0, desplaza: 0 });

export interface Escena {
  id: string;
  nombre: string;
  base: string; // movimientos de Figma en los que se basa
  sonido: string; // qué hace el sonido (texto para el panel)
  fondo: string;
  dibujar: (ctx: CanvasRenderingContext2D, S: number, dt: number, r: Rasgos, e: Estado) => void;
}

// Punto de un anillo «cuadrado» (redondez 0) o circular (redondez 1).
function anillo(a: number, radio: number, redondez: number): [number, number] {
  const c = Math.cos(a), s = Math.sin(a), m = Math.max(Math.abs(c), Math.abs(s));
  const k = (1 - redondez) / m + redondez;
  return [c * radio * k, s * radio * k];
}

// Túnel · M3 «Túnel que se abre» y C3 «Túnel → estallido → túnel».
// El volumen acelera el avance; los graves redondean los anillos (estallido) y los hacen latir; el tono los gira.
const tunel: Escena = {
  id: 'tunel', nombre: 'Túnel', base: 'M3 · C3', fondo: C.Hueso,
  sonido: 'El volumen abre el túnel. Los graves lo vuelven estallido y lo hacen latir. El tono lo gira.',
  dibujar(ctx, S, dt, r, e) {
    e.fase += dt * (0.18 + r.volumen * 1.6);
    e.giro += dt * (r.tono - 0.35) * 1.2;
    const sectores = 16, anillos = 14, centro = S / 2, redondez = Math.min(1, r.graves * 1.3);
    const latido = 1 + r.graves * 0.12;
    ctx.fillStyle = C.Hueso; ctx.fillRect(0, 0, S, S);
    ctx.save(); ctx.translate(centro, centro); ctx.rotate(e.giro);
    const f = e.fase % 1, paridad = Math.floor(e.fase) % 2;
    for (let i = anillos; i >= 0; i--) {
      const r0 = S * 0.04 * Math.pow(1.32, i + f) * latido, r1 = S * 0.04 * Math.pow(1.32, i + 1 + f) * latido;
      for (let j = 0; j < sectores; j++) {
        if ((i + j + paridad) % 2) continue;
        const a0 = (j / sectores) * Math.PI * 2, a1 = ((j + 1) / sectores) * Math.PI * 2;
        ctx.beginPath();
        const pasos = 4;
        for (let k = 0; k <= pasos; k++) { const [x, y] = anillo(a0 + (a1 - a0) * (k / pasos), r1, redondez); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        for (let k = pasos; k >= 0; k--) { const [x, y] = anillo(a0 + (a1 - a0) * (k / pasos), r0, redondez); ctx.lineTo(x, y); }
        ctx.closePath(); ctx.fillStyle = C.Azul; ctx.fill();
      }
    }
    const n = S * 0.06 * latido;
    ctx.fillStyle = C.Negro; ctx.fillRect(-n / 2, -n / 2, n, n);
    ctx.restore();
  },
};

// Acordeón · M5 «Acordeón» y M4 «Acordeón que corre».
// Cada columna y cada fila es una banda del sonido: se estira o se comprime con su energía (un ecualizador hecho tela).
// Los golpes hacen correr las listas una posición.
const acordeon: Escena = {
  id: 'acordeon', nombre: 'Acordeón', base: 'M5 · M4', fondo: C.Hueso,
  sonido: 'Cada lista es una banda del sonido: de graves a agudos se estira o se comprime. Cada golpe hace correr las listas.',
  dibujar(ctx, S, dt, r, e) {
    if (r.golpe) e.desplaza += 1;
    e.fase += dt * (0.6 + r.volumen * 2);
    const n = r.bandas.length;
    const pesos = Array.from({ length: n }, (_, i) => 0.35 + r.bandas[(i + e.desplaza) % n] * 2.2 + 0.15 * Math.sin(e.fase + i));
    const total = pesos.reduce((a, b) => a + b, 0);
    ctx.fillStyle = C.Hueso; ctx.fillRect(0, 0, S, S);
    // columnas
    let x = 0;
    pesos.forEach((p, i) => { const w = (p / total) * S; if (i % 2 === 0) { ctx.fillStyle = C.Verde; ctx.fillRect(x, 0, w, S); } x += w; });
    // filas (las mismas bandas, al revés), semitransparentes: el cruce oscurece como un tartán
    let y = 0;
    ctx.globalAlpha = 0.55;
    [...pesos].reverse().forEach((p, i) => { const h = (p / total) * S; if (i % 2 === 0) { ctx.fillStyle = C.Verde; ctx.fillRect(0, y, S, h); } y += h; });
    ctx.globalAlpha = 1;
    // listas finas que corren (M4)
    const corre = (e.fase * 0.25) % 1;
    ctx.fillStyle = C.Negro;
    for (let k = 0; k < 6; k++) {
      const yy = ((k / 6 + corre) % 1) * S, largo = S * (0.1 + r.bandas[k * 2 % n] * 0.6);
      ctx.fillRect(0, yy, largo, Math.max(2, S * 0.006));
    }
  },
};

// Caleidoscopio · C5 «Caleidoscopio de rombos» (y el espejo fijo de C4).
// Un damero inclinado se refleja en gajos. El tono lo gira, el volumen lo acerca y cada golpe cambia la simetría (4 → 6 → 8).
const ORDEN_SIMETRIA = [4, 6, 8];
let tesela: HTMLCanvasElement | null = null;
const caleidoscopio: Escena = {
  id: 'caleidoscopio', nombre: 'Caleidoscopio', base: 'C5 · C4', fondo: C.Lapis,
  sonido: 'El tono gira el caleidoscopio y el volumen lo acerca. Cada golpe cambia la simetría: 4, 6 u 8 gajos.',
  dibujar(ctx, S, dt, r, e) {
    if (r.golpe) e.simetria = ORDEN_SIMETRIA[(ORDEN_SIMETRIA.indexOf(e.simetria) + 1) % ORDEN_SIMETRIA.length];
    e.giro += dt * (0.1 + r.tono * 0.9);
    e.fase += dt * (0.2 + r.medios);
    const N = e.simetria, gajo = (Math.PI * 2) / N, R = S * 0.75 / Math.cos(gajo / 2);
    // La tesela es más grande que la escena para que los gajos lleguen a las esquinas.
    const T = Math.round(S * 1.7);
    if (!tesela || tesela.width !== T) { tesela = document.createElement('canvas'); tesela.width = tesela.height = T; }
    // damero inclinado y curvado (C1 → C5): la inclinación sigue a los graves
    const t = tesela.getContext('2d')!, lado = S * (0.07 - r.volumen * 0.03);
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.fillStyle = C.Rosa; t.fillRect(0, 0, T, T);
    t.translate(T / 2, T / 2); t.rotate(e.fase * 0.3); t.transform(1, 0, Math.sin(e.fase) * 0.4 + r.graves * 0.6, 1, 0, 0);
    t.fillStyle = C.Lapis;
    const m = Math.ceil(T / lado);
    for (let i = -m; i < m; i++) for (let j = -m; j < m; j++) if ((i + j) % 2 === 0) t.fillRect(i * lado, j * lado + Math.sin(i * 0.4 + e.fase) * lado * 0.3, lado, lado);
    ctx.fillStyle = C.Lapis; ctx.fillRect(0, 0, S, S);
    ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(e.giro);
    for (let k = 0; k < N; k++) {
      ctx.save();
      // Los gajos impares son el espejo del par: giran un gajo más y se reflejan, así cubren el círculo completo.
      if (k % 2) { ctx.rotate((k + 1) * gajo); ctx.scale(1, -1); } else ctx.rotate(k * gajo);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R, 0); ctx.lineTo(R * Math.cos(gajo), R * Math.sin(gajo)); ctx.closePath(); ctx.clip();
      ctx.drawImage(tesela, -T / 2, -T / 2);
      ctx.restore();
    }
    // estrella central que respira
    const a = S * (0.05 + r.volumen * 0.08);
    ctx.fillStyle = C.Amarillo; ctx.beginPath();
    for (let k = 0; k < N * 2; k++) { const rr = k % 2 ? a * 0.45 : a, an = (k / (N * 2)) * Math.PI * 2; k ? ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : ctx.moveTo(rr, 0); }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  },
};

// Tejido · C10 «Puntos → cruces → tejido», con C8 «el color corre» y C6 «las celdas giran».
// Los agudos hacen crecer los puntos hasta cruces que se trenzan; el tono hace correr el color; cada golpe gira las celdas 90°.
const COLORES_TEJIDO = [C.Negro, C.Azul, C.Lapis, C.Morado, C.Verde, C.Rosa];
const tejido: Escena = {
  id: 'tejido', nombre: 'Tejido', base: 'C10 · C8 · C6', fondo: C.Celeste,
  sonido: 'Los agudos convierten los puntos en cruces y luego en tejido. El tono hace correr el color. Cada golpe gira las celdas.',
  dibujar(ctx, S, dt, r, e) {
    if (r.golpe) e.objetivoVueltas += 1;
    e.vueltas += (e.objetivoVueltas - e.vueltas) * Math.min(1, dt * 7);
    e.fase += dt * (0.2 + r.tono * 2.2);
    const n = 10, c = S / n, crece = Math.min(1, r.agudos * 1.4 + r.medios * 0.4);
    ctx.fillStyle = C.Celeste; ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const cx = (i + 0.5) * c, cy = (j + 0.5) * c;
      const color = COLORES_TEJIDO[Math.floor(((i + j) * 0.5 + e.fase)) % COLORES_TEJIDO.length];
      ctx.save(); ctx.translate(cx, cy);
      ctx.rotate(((i + j) % 2 ? 1 : -1) * e.vueltas * (Math.PI / 2));
      ctx.fillStyle = color;
      const punto = c * (0.1 + crece * 0.14);
      ctx.fillRect(-punto / 2, -punto / 2, punto, punto);
      if (crece > 0.15) { // brazos de la cruz: a máximo se tocan con los de la celda vecina (tejido)
        const largo = (c / 2) * Math.min(1, (crece - 0.15) / 0.75), grosor = punto * 0.55;
        ctx.fillRect(-largo, -grosor / 2, largo * 2, grosor);
        ctx.fillRect(-grosor / 2, -largo, grosor, largo * 2);
      }
      ctx.restore();
    }
  },
};

export const ESCENAS: Escena[] = [tunel, acordeon, caleidoscopio, tejido];
