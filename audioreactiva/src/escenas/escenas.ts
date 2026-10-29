import type { Rasgos } from '../audio/oido';
import { C3_LOOP_MS, dibujarC3, estallidoDelCiclo } from '../../../shared/c3-tunel.js';

// Escenas de la Estación Audioreactiva, hechas con los movimientos de Geométrica · Motion (Figma, sección 664:273897):
// «Geométrica se mueve como una sola red de celdas que se deforma: se inclina, se curva, se desplaza, gira o se refleja.
//  Nada aparece de la nada.» Acá el sonido decide cuánto y cuándo se deforma la red.

export const C = {
  Hueso: '#F4EEE3', Negro: '#000000', Azul: '#0062B8', Lapis: '#2B4BD8', Celeste: '#7FC8F8',
  Amarillo: '#FFC20E', Verde: '#00A651', Rosa: '#FF8FB1', Morado: '#7A2E8E',
};

// Estado que cada escena guarda entre cuadros (fases que avanzan, giros que se acumulan).
export interface Estado { fase: number; giro: number; simetria: number; vueltas: number; objetivoVueltas: number; desplaza: number; ciclo: number; corre: number }
export const estadoInicial = (): Estado => ({ fase: 0, giro: 0, simetria: 8, vueltas: 0, objetivoVueltas: 0, desplaza: 0, ciclo: 0, corre: 0 });

export interface Escena {
  id: string;
  nombre: string;
  base: string; // movimientos de Figma en los que se basa
  sonido: string; // qué hace el sonido (texto para el panel)
  fondo: string;
  dibujar: (ctx: CanvasRenderingContext2D, S: number, dt: number, r: Rasgos, e: Estado) => void;
}

// Túnel · C3 «Túnel → estallido → túnel», el mismo loop de la tarjeta del hub y de la pantalla del HUB (shared/c3-tunel.js).
// Sin sonido corre su loop de 4 s. El volumen acelera el avance, los graves lo hacen latir y cada golpe dispara el estallido.
const tunel: Escena = {
  id: 'tunel', nombre: 'Túnel', base: 'C3 · M3', fondo: C.Hueso,
  sonido: 'El volumen acelera el túnel, los graves lo hacen latir y cada golpe lo hace estallar en espiral.',
  dibujar(ctx, S, dt, r, e) {
    e.fase += dt * (0.5 + r.volumen * 3.2);
    e.ciclo += dt * (1000 / C3_LOOP_MS) * (0.6 + r.volumen * 0.8);
    e.desplaza = Math.max(e.desplaza * Math.pow(0.004, dt), r.pulso); // estallido por golpe, se apaga en ~0,3 s
    e.giro += dt * (0.08 + (r.tono - 0.3) * 0.8);
    const estallido = Math.min(1, estallidoDelCiclo(e.ciclo) * 0.45 + e.desplaza * e.desplaza * 0.9);
    dibujarC3(ctx, S, S, { fase: e.fase, estallido, latido: Math.max(r.graves, r.pulso), giro: e.giro });
  },
};

// Acordeón · M5 «Acordeón» y M4 «Acordeón que corre», como ecualizador.
// Doce columnas, una por banda del sonido (graves a la izquierda, agudos a la derecha). En cada columna las listas
// se comprimen con la energía de su banda y se pintan desde abajo hasta su nivel; las listas corren hacia abajo
// según el volumen y cada golpe las hace saltar una posición.
const LISTAS_ACORDEON = [C.Verde, C.Azul, C.Amarillo, C.Rosa];
const acordeon: Escena = {
  id: 'acordeon', nombre: 'Acordeón', base: 'M5 · M4', fondo: C.Hueso,
  sonido: 'Cada columna es una banda del sonido: se llena desde abajo y comprime sus listas. Los golpes las hacen saltar.',
  dibujar(ctx, S, dt, r, e) {
    e.corre += dt * (0.4 + r.volumen * 3);
    if (r.golpe) e.desplaza += 1;
    ctx.fillStyle = C.Hueso; ctx.fillRect(0, 0, S, S);
    const n = r.bandas.length, w = S / n;
    for (let i = 0; i < n; i++) {
      const nivel = Math.min(1, r.bandas[i] * 1.05);
      const paso = S * (0.085 - nivel * 0.06);                 // la lista se comprime con la energía (M5)
      const grosor = paso * (0.5 + nivel * 0.2);
      const alto = S * (0.08 + nivel * 0.92);                   // hasta dónde llega pintado (ecualizador)
      const corre = ((e.corre + e.desplaza * 0.5) * paso * (i % 2 ? 1 : -1)) % paso;
      const x = i * w + w * 0.06, ancho = w * 0.88;
      ctx.save(); ctx.beginPath(); ctx.rect(x, 0, ancho, S); ctx.clip();
      // la parte apagada: listas finas y claras
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let y = -paso + corre; y < S; y += paso) ctx.fillRect(x, y, ancho, grosor * 0.35);
      // la parte encendida, desde abajo
      ctx.beginPath(); ctx.rect(x, S - alto, ancho, alto); ctx.clip();
      ctx.fillStyle = LISTAS_ACORDEON[(i + e.desplaza) % LISTAS_ACORDEON.length];
      for (let y = -paso + corre; y < S; y += paso) ctx.fillRect(x, y, ancho, grosor);
      ctx.restore();
      // la tapa negra del nivel, que golpea con el pulso
      ctx.fillStyle = C.Negro; ctx.fillRect(x, S - alto - S * 0.012 * (1 + r.pulso), ancho, S * 0.012 * (1 + r.pulso));
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
    ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(e.giro); ctx.scale(1 + r.pulso * 0.12, 1 + r.pulso * 0.12);
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
// Es un ecualizador en forma de tela: cada columna escucha una banda. Con poca energía la celda es un punto,
// con más le salen brazos (cruz) y al máximo los brazos se tocan con los de al lado (tejido).
// El volumen sube toda la tela; el tono hace correr el color y cada golpe gira las celdas 90°.
const COLORES_TEJIDO = [C.Negro, C.Azul, C.Lapis, C.Morado, C.Verde, C.Rosa];
const tejido: Escena = {
  id: 'tejido', nombre: 'Tejido', base: 'C10 · C8 · C6', fondo: C.Celeste,
  sonido: 'Cada columna escucha una banda: los puntos se vuelven cruces y luego tejido. El tono corre el color; los golpes giran las celdas.',
  dibujar(ctx, S, dt, r, e) {
    if (r.golpe) e.objetivoVueltas += 1;
    e.vueltas += (e.objetivoVueltas - e.vueltas) * Math.min(1, dt * 9);
    e.fase += dt * (0.3 + r.tono * 2.5 + r.pulso * 3);
    const n = 12, c = S / n;
    ctx.fillStyle = C.Celeste; ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < n; i++) {
      const banda = r.bandas[i % r.bandas.length];
      for (let j = 0; j < n; j++) {
        // de abajo hacia arriba la tela necesita más energía para tejerse (se ve como un ecualizador)
        const altura = (n - 1 - j) / (n - 1);
        const crece = Math.max(0, Math.min(1, banda * 1.25 + r.volumen * 0.35 - altura * 0.75 + r.pulso * 0.25));
        const cx = (i + 0.5) * c, cy = (j + 0.5) * c;
        const color = COLORES_TEJIDO[Math.floor((i + j) * 0.5 + e.fase) % COLORES_TEJIDO.length];
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

export const ESCENAS: Escena[] = [tunel, acordeon, caleidoscopio, tejido];
