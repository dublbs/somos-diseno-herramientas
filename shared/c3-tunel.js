// C3 · «Túnel → estallido → túnel» (Figma, Geométrica · Motion, 449:86016).
// El túnel de damero (FA08) avanza siempre a la misma velocidad; a mitad del loop los anillos se redondean
// y se tuercen en espiral (el estallido) y vuelven a ser cuadrados. Loop de 4 s.
// Lo usan la Estación Audioreactiva (escena Túnel, con el sonido moviendo los parámetros),
// la tarjeta del hub (index.html) y la pantalla del mezanine en el HUB «Estación».
// JavaScript plano para que index.html lo cargue sin compilar; los tipos están en c3-tunel.d.ts.

export const C3_LOOP_MS = 4000;
const AZUL = '#0062B8', HUESO = '#F4EEE3', NEGRO = '#000000';

// Punto de un anillo cuadrado (redondez 0) o circular (redondez 1).
function anillo(a, radio, redondez) {
  const c = Math.cos(a), s = Math.sin(a), m = Math.max(Math.abs(c), Math.abs(s));
  const k = (1 - redondez) / m + redondez;
  return [c * radio * k, s * radio * k];
}

// Cuánto estallido hay en un punto del loop (0 = túnel cuadrado, 1 = estallido pleno), con meseta al centro.
export function estallidoDelCiclo(ciclo) {
  const s = Math.sin(Math.PI * (((ciclo % 1) + 1) % 1));
  return s * s * (3 - 2 * s);
}

// Parámetros del loop solo (sin sonido) para un instante: la tarjeta del hub y la pantalla del HUB.
export function c3EnTiempo(ms) {
  const ciclo = (ms % C3_LOOP_MS) / C3_LOOP_MS;
  const golpe = Math.pow(Math.max(0, Math.sin(ms * Math.PI / 500)), 8); // bombo a 120 bpm
  return { fase: ms / 1000 * 0.75, estallido: estallidoDelCiclo(ciclo), latido: golpe, giro: ms * 0.00012 };
}

/**
 * Dibuja el C3 llenando W × H (sirve en pantallas no cuadradas).
 * p.fase: anillos recorridos (avance del túnel) · p.estallido: 0..1 · p.latido: 0..1 · p.giro: radianes.
 */
export function dibujarC3(ctx, W, H, p, colores) {
  const fondo = colores?.fondo ?? HUESO, tinta = colores?.tinta ?? AZUL, centro = colores?.centro ?? NEGRO;
  const est = Math.max(0, Math.min(1, p.estallido)), lat = Math.max(0, Math.min(1, p.latido ?? 0));
  const sectores = 16, base = Math.min(W, H) * 0.03 * (1 + lat * 0.14), alcance = Math.hypot(W, H) / 2;
  const f = ((p.fase % 1) + 1) % 1, paridad = Math.floor(p.fase) % 2;
  const torsion = est * 0.13; // cuánto se tuerce cada anillo respecto al anterior (espiral)
  ctx.save();
  ctx.fillStyle = fondo; ctx.fillRect(0, 0, W, H);
  ctx.translate(W / 2, H / 2); ctx.rotate(p.giro ?? 0);
  let anillos = 0; while (base * Math.pow(1.32, anillos) < alcance * 1.5) anillos++;
  ctx.fillStyle = tinta;
  for (let i = anillos; i >= 0; i--) {
    const r0 = base * Math.pow(1.32, i + f), r1 = base * Math.pow(1.32, i + 1 + f);
    const t0 = torsion * (i + f), t1 = torsion * (i + 1 + f);
    ctx.beginPath();
    for (let j = 0; j < sectores; j++) {
      if ((i + j + paridad) % 2) continue;
      const a0 = (j / sectores) * Math.PI * 2, a1 = ((j + 1) / sectores) * Math.PI * 2;
      for (let k = 0; k <= 4; k++) { const [x, y] = anillo(a0 + (a1 - a0) * (k / 4) + t1, r1, est); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      for (let k = 4; k >= 0; k--) { const [x, y] = anillo(a0 + (a1 - a0) * (k / 4) + t0, r0, est); ctx.lineTo(x, y); }
      ctx.closePath();
    }
    ctx.fill();
  }
  // el centro: el cuadro negro del frente del túnel, que gira con el estallido
  const n = base * 2.2 * (1 + lat * 0.25);
  ctx.rotate(est * Math.PI / 4);
  ctx.fillStyle = centro; ctx.fillRect(-n / 2, -n / 2, n, n);
  ctx.restore();
}
