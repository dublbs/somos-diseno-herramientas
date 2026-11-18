// Túnel de la Estación: el C3 «Túnel → estallido → túnel» (Figma 449:86016, `shared/c3-tunel.js`) con sus parámetros
// abiertos para que la música, los pads y el dedo los muevan sin cambiar la figura: damero azul y hueso de 16 sectores
// en anillos que avanzan hacia el centro, que a mitad del loop de 4 s se redondean y tuercen en espiral, y el cuadro
// negro al frente. Copia ampliada de `dibujarC3` (shared/c3-tunel.js no se toca: lo usan el hub y el HUB).

export const AZUL = '#0062B8', HUESO = '#F4EEE3', NEGRO = '#000000';
export const LOOP_S = 4; // C3_LOOP_MS / 1000

// Cuánto estallido hay en un punto del loop (igual que estallidoDelCiclo de shared/c3-tunel.js).
export function estallidoDelCiclo(ciclo: number) {
  const s = Math.sin(Math.PI * (((ciclo % 1) + 1) % 1));
  return s * s * (3 - 2 * s);
}

export interface ParamTunel {
  fase: number;       // anillos recorridos (avance del túnel)
  redondez: number;   // 0 cuadrado .. 1 círculo (en el C3 es igual al estallido)
  torsion: number;    // radianes que se tuerce cada anillo respecto al anterior (C3: estallido × 0,13)
  latido: number;     // 0..1, engorda el centro y los anillos (bombo)
  giro: number;       // radianes
  razon: number;      // crecimiento entre anillos (C3: 1,32); menos = más anillos
  acerca: number;     // 0.. escala del túnel (salto hacia adelante)
  fuga: [number, number]; // punto de fuga relativo al centro, en fracción del lado (0,0 = centro)
  giroCentro: number; // giro del cuadro negro (C3: estallido × π/4)
  invertidos?: number; // los anillos de adentro hasta este índice invierten su color (el damero se vuelve rayos)
  tinta: string; fondo: string; centro: string;
}

// Punto de un anillo cuadrado (redondez 0) o circular (redondez 1), girado.
function punto(a: number, radio: number, redondez: number, cg: number, sg: number): [number, number] {
  const c = Math.cos(a), s = Math.sin(a), m = Math.max(Math.abs(c), Math.abs(s));
  const k = (1 - redondez) / m + redondez, x = c * radio * k, y = s * radio * k;
  return [x * cg - y * sg, x * sg + y * cg];
}

export function dibujarTunel(ctx: CanvasRenderingContext2D, W: number, H: number, p: ParamTunel) {
  const sectores = 16, lat = Math.max(0, Math.min(1, p.latido)), est = Math.max(0, Math.min(1, p.redondez));
  const base = Math.min(W, H) * 0.03 * (1 + lat * 0.14) * (1 + p.acerca), alcance = Math.hypot(W, H) / 2;
  const razon = Math.max(1.12, p.razon), f = ((p.fase % 1) + 1) % 1, paridad = ((Math.floor(p.fase) % 2) + 2) % 2;
  const cg = Math.cos(p.giro), sg = Math.sin(p.giro);
  const fx = p.fuga[0] * Math.min(W, H), fy = p.fuga[1] * Math.min(W, H);
  // el centro de cada anillo: los chicos (lejanos) en el punto de fuga, los grandes vuelven al centro de la pantalla
  const centro = (r: number): [number, number] => { const k = 1 - Math.min(1, r / (alcance * 0.9)) ** 0.7; return [fx * k, fy * k]; };
  ctx.save();
  ctx.fillStyle = p.fondo; ctx.fillRect(0, 0, W, H);
  ctx.translate(W / 2, H / 2);
  let anillos = 0; while (base * Math.pow(razon, anillos) < alcance * 1.6 && anillos < 60) anillos++;
  ctx.fillStyle = p.tinta;
  for (let i = anillos; i >= 0; i--) {
    // en los anillos invertidos los cuadros de un mismo sector se tocan: se solapan un poco para que no quede costura
    const r0 = base * Math.pow(razon, i + f), r1 = base * Math.pow(razon, i + 1 + f) * (i < (p.invertidos ?? 0) ? 1.012 : 1);
    const t0 = p.torsion * (i + f), t1 = p.torsion * (i + 1 + f);
    const [x0, y0] = centro(r0), [x1, y1] = centro(r1);
    ctx.beginPath();
    for (let j = 0; j < sectores; j++) {
      if ((i + j + paridad + (i < (p.invertidos ?? 0) ? i : 0)) % 2) continue;
      const a0 = (j / sectores) * Math.PI * 2, a1 = ((j + 1) / sectores) * Math.PI * 2;
      for (let k = 0; k <= 4; k++) { const [x, y] = punto(a0 + (a1 - a0) * (k / 4) + t1, r1, est, cg, sg); k ? ctx.lineTo(x + x1, y + y1) : ctx.moveTo(x + x1, y + y1); }
      for (let k = 4; k >= 0; k--) { const [x, y] = punto(a0 + (a1 - a0) * (k / 4) + t0, r0, est, cg, sg); ctx.lineTo(x + x0, y + y0); }
      ctx.closePath();
    }
    ctx.fill();
  }
  // el centro: el cuadro negro del frente del túnel, en el punto de fuga
  const n = base * 2.2 * (1 + lat * 0.25), [cx, cy] = centro(base * 0.5);
  ctx.translate(cx, cy); ctx.rotate(p.giro + p.giroCentro);
  ctx.fillStyle = p.centro; ctx.fillRect(-n / 2, -n / 2, n, n);
  ctx.restore();
}
