import { useEffect, useRef, type RefObject } from 'react';
import { AFICHES } from './afiches';

// Reconocer un afiche de la cacería por su propio diseño, sin QR (plan 013).
// Se compara la imagen de la cámara con una miniatura de cada afiche (las mismas de ./figma/afiches), a varias
// escalas y encuadres: primero la forma, con correlación normalizada por canal (no importa si hay más o menos luz),
// y después que los colores estén donde corresponden (la forma sola no basta: cualquier figura oscura centrada
// sobre fondo claro se parece al Sol). Sin dependencias.
//
// Probado con 78 fotos simuladas (de frente, corrido, inclinado 35°, girado, poca luz, reflejo, en la pared con
// otros afiches): reconoce los 6 sin confundirlos; 85 imágenes que no son afiches no pasan. Falta validarlo
// con el afiche impreso y celulares reales (prueba general del 18 nov).

const GW = 36, GH = 48;          // miniatura de la zona de la cámara (guía + 15 % de aire)
const AIRE = 1.15;
const ESCALAS = [0.78, 0.86, 0.94, 1.02, 1.1];
const GUIAS = [0.6, 0.8, 1];     // la gente no encuadra exacto: se prueban varios tamaños de guía
export const UMBRAL = 0.34;      // puntaje mínimo del mejor afiche
export const MARGEN = 0.12;      // ventaja mínima sobre el segundo
const SEGUIDOS = 3;              // cuadros seguidos con el mismo afiche antes de darlo por encontrado

type Canales = Float32Array[];
interface Plantilla { tw: number; th: number; c: Canales; cr: Float32Array; cg: Float32Array }
export interface Preparado { id: string; plantillas: Plantilla[] }
export interface Puntaje { id: string; puntaje: number }

// RGBA → luz, rojo-verde, amarillo-azul y cromaticidad (r, g sin la cantidad de luz). Promedia por bloques.
function canales(rgba: ArrayLike<number>, w: number, h: number, x0: number, y0: number, cw: number, ch: number, ow: number, oh: number): Canales {
  const out = Array.from({ length: 5 }, () => new Float32Array(ow * oh));
  for (let oy = 0; oy < oh; oy++) for (let ox = 0; ox < ow; ox++) {
    const ax = x0 + (ox / ow) * cw, bx = x0 + ((ox + 1) / ow) * cw, ay = y0 + (oy / oh) * ch, by = y0 + ((oy + 1) / oh) * ch;
    let r = 0, g = 0, b = 0, n = 0;
    const paso = Math.max(1, Math.floor((bx - ax) / 4));
    for (let y = Math.floor(ay); y < by; y += paso) for (let x = Math.floor(ax); x < bx; x += paso) {
      const xi = Math.min(w - 1, Math.max(0, x)), yi = Math.min(h - 1, Math.max(0, y)), k = (yi * w + xi) * 4;
      r += rgba[k]; g += rgba[k + 1]; b += rgba[k + 2]; n++;
    }
    r /= n; g /= n; b /= n;
    const i = oy * ow + ox, suma = r + g + b + 15;
    out[0][i] = 0.299 * r + 0.587 * g + 0.114 * b;
    out[1][i] = r - g;
    out[2][i] = (r + g) / 2 - b;
    out[3][i] = r / suma; out[4][i] = g / suma;
  }
  return out;
}
function normalizar(v: Float32Array) {
  let m = 0; for (const x of v) m += x; m /= v.length;
  let s = 0; for (const x of v) s += (x - m) ** 2; s = Math.sqrt(s / v.length) || 1;
  return v.map(x => (x - m) / s);
}

// Plantillas de cada afiche a cada escala (una vez, al abrir la cámara).
export function prepararAfiches(afiches: { id: string; rgba: ArrayLike<number>; w: number; h: number }[]): Preparado[] {
  const guiaW = GW / AIRE;
  return afiches.map(a => ({
    id: a.id,
    plantillas: ESCALAS.map(s => {
      const tw = Math.round(guiaW * s), th = Math.round(guiaW * s * (a.h / a.w));
      const ch = canales(a.rgba, a.w, a.h, 0, 0, a.w, a.h, tw, th);
      return { tw, th, c: ch.slice(0, 3).map(normalizar), cr: ch[3], cg: ch[4] };
    }),
  }));
}

// Puntaje de cada afiche con una guía centrada que ocupa `guia` (0–1) del ancho del cuadro.
function puntuarGuia(preparados: Preparado[], rgba: ArrayLike<number>, w: number, h: number, guia: number): Puntaje[] {
  const gw = w * guia, gh = gw * 4 / 3;
  const cw = gw * AIRE, ch = gh * AIRE, x0 = (w - cw) / 2, y0 = (h - ch) / 2;
  const cam = canales(rgba, w, h, x0, y0, cw, ch, GW, GH);
  const pesos = [1, 0.6, 0.6], sumaPesos = 2.2;
  return preparados.map(p => {
    let mejor = -1, donde: { t: Plantilla; dx: number; dy: number } | null = null;
    for (const t of p.plantillas) {
      if (t.tw > GW || t.th > GH + 6) continue;
      for (let dy = Math.min(0, GH - t.th); dy <= Math.max(0, GH - t.th); dy++)
        for (let dx = 0; dx <= GW - t.tw; dx++) {
          let total = 0;
          for (let c = 0; c < 3; c++) {
            let sa = 0, sb = 0, saa = 0, sab = 0, n = 0;
            const T = t.c[c], C = cam[c];
            for (let y = 0; y < t.th; y++) {
              const cy = y + dy; if (cy < 0 || cy >= GH) continue;
              for (let x = 0; x < t.tw; x++) {
                const a = C[cy * GW + x + dx], b = T[y * t.tw + x];
                sa += a; sb += b; saa += a * a; sab += a * b; n++;
              }
            }
            const ma = sa / n, va = saa / n - ma * ma;
            total += pesos[c] * (va < 1e-6 ? 0 : (sab / n - ma * (sb / n)) / Math.sqrt(va));
          }
          const sc = total / sumaPesos;
          if (sc > mejor) { mejor = sc; donde = { t, dx, dy }; }
        }
    }
    if (!donde || mejor <= 0) return { id: p.id, puntaje: mejor };
    // Color en una grilla de 4 × 4 sobre el afiche encontrado.
    const { t, dx, dy } = donde;
    let d = 0, nb = 0;
    for (let by = 0; by < 4; by++) for (let bx = 0; bx < 4; bx++) {
      let tr = 0, tg = 0, kr = 0, kg = 0, m = 0;
      for (let y = Math.floor(by * t.th / 4); y < Math.floor((by + 1) * t.th / 4); y++) {
        const cy = y + dy; if (cy < 0 || cy >= GH) continue;
        for (let x = Math.floor(bx * t.tw / 4); x < Math.floor((bx + 1) * t.tw / 4); x++) {
          tr += t.cr[y * t.tw + x]; tg += t.cg[y * t.tw + x]; kr += cam[3][cy * GW + x + dx]; kg += cam[4][cy * GW + x + dx]; m++;
        }
      }
      if (m) { d += Math.hypot(tr / m - kr / m, tg / m - kg / m); nb++; }
    }
    const color = Math.max(0, 1 - (d / nb) / 0.12);
    return { id: p.id, puntaje: mejor * (0.4 + 0.6 * color) };
  });
}

// Mejor puntaje de cada afiche probando todas las guías, de mayor a menor.
export function puntuar(preparados: Preparado[], rgba: ArrayLike<number>, w: number, h: number): Puntaje[] {
  const mejor = new Map<string, number>();
  for (const g of GUIAS) for (const r of puntuarGuia(preparados, rgba, w, h, g)) mejor.set(r.id, Math.max(mejor.get(r.id) ?? -1, r.puntaje));
  return [...mejor].map(([id, puntaje]) => ({ id, puntaje })).sort((a, b) => b.puntaje - a.puntaje);
}

// El afiche reconocido en un cuadro, o null.
export function reconocer(preparados: Preparado[], rgba: ArrayLike<number>, w: number, h: number): string | null {
  const [p1, p2] = puntuar(preparados, rgba, w, h);
  return p1 && p1.puntaje >= UMBRAL && p1.puntaje - (p2?.puntaje ?? 0) >= MARGEN ? p1.id : null;
}

// ---------- En la cámara ----------
const LADO = 480;       // el cuadro se reduce a esto antes de comparar
const CADA_MS = 450;
const REPETIR_MS = 8000; // el mismo afiche frente a la cámara no se vuelve a avisar antes de esto

function rgbaDe(fuente: CanvasImageSource, ancho: number, alto: number, lienzo: HTMLCanvasElement) {
  const k = Math.min(1, LADO / Math.max(ancho, alto));
  const w = Math.max(1, Math.round(ancho * k)), h = Math.max(1, Math.round(alto * k));
  if (lienzo.width !== w || lienzo.height !== h) { lienzo.width = w; lienzo.height = h; }
  const ctx = lienzo.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(fuente, 0, 0, w, h);
  return { rgba: ctx.getImageData(0, 0, w, h).data, w, h };
}

async function cargarPreparados(): Promise<Preparado[]> {
  const lienzo = document.createElement('canvas');
  const datos = await Promise.all(AFICHES.map(a => new Promise<{ id: string; rgba: Uint8ClampedArray; w: number; h: number }>((ok, mal) => {
    const img = new Image();
    img.onload = () => { const d = rgbaDe(img, img.naturalWidth, img.naturalHeight, lienzo); ok({ id: a.id, rgba: new Uint8ClampedArray(d.rgba), w: d.w, h: d.h }); };
    img.onerror = mal;
    img.src = a.img;
  })));
  return prepararAfiches(datos);
}

// Mira el mismo <video> que el lector de QR y avisa cuando reconoce un afiche varias veces seguidas.
export function useReconocerAfiche(video: RefObject<HTMLVideoElement | null>, activo: boolean, alReconocer: (id: string) => void) {
  const aviso = useRef(alReconocer);
  aviso.current = alReconocer;
  useEffect(() => {
    if (!activo) return;
    let vivo = true, temporizador = 0, candidato = '', seguidos = 0;
    const ultimos = new Map<string, number>();
    const lienzo = document.createElement('canvas');
    let preparados: Preparado[] | null = null;
    cargarPreparados().then(p => { preparados = p; }).catch(() => { /* sin miniaturas: queda el QR */ });
    const mirar = () => {
      if (!vivo) return;
      const v = video.current;
      if (preparados && v && v.readyState >= 2 && v.videoWidth) {
        const { rgba, w, h } = rgbaDe(v, v.videoWidth, v.videoHeight, lienzo);
        const id = reconocer(preparados, rgba, w, h);
        if (id && id === candidato) seguidos++; else { candidato = id ?? ''; seguidos = id ? 1 : 0; }
        if (id && seguidos >= SEGUIDOS && Date.now() - (ultimos.get(id) ?? 0) > REPETIR_MS) {
          ultimos.set(id, Date.now()); seguidos = 0;
          aviso.current(id);
        }
      }
      temporizador = window.setTimeout(mirar, CADA_MS);
    };
    mirar();
    return () => { vivo = false; clearTimeout(temporizador); };
  }, [video, activo]);
}
