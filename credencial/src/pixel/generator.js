import { PARTES, BOCA_ABIERTA, RANURAS } from "./parts.js";
import { HEX, TINTA, COLORES_FIGURA, COLORES_PIEL_CLAROS, MAX_COLORES, contraste } from "./palette.js";

export const N = 24;

// Cuadros: 0 = base, 1 = parpadeo, 2 = habla. Línea de tiempo a 12 fps (≈ 5,8 s por vuelta).
export const FPS = 12;
export const CUADROS = ["base", "parpadeo", "habla"];
export const ESPERA = [
  ...Array(24).fill(0), 1, 1, ...Array(18).fill(0),
  2, 2, 2, 0, 0, 2, 2, 2, ...Array(14).fill(0),
];

// Colores que guarda cada receta, uno por característica.
export const LLAVES_COLOR = ["cabeza", "ojos", "boca", "mejillas", "pelo", "peloDetalle", "ropa", "ropaDetalle", "accesorio"];

export function azar(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const parte = (ranura, id) => PARTES[ranura].find((p) => p.id === id) || PARTES[ranura][0];
export const tieneZona = (ranura, id, zona) => parte(ranura, id).tramos.some((t) => t[3] === zona);

// Convierte recetas de la versión 1 (tres colores compartidos) al formato actual.
export function normalizarReceta(r) {
  if (r.version === 2) return r;
  const c = r.colores || {};
  return {
    ...r,
    version: 2,
    mejillas: r.mejillas || "ninguna",
    colores: {
      cabeza: c.cuerpo || "Verde", ojos: TINTA, boca: TINTA, mejillas: c.acento || "Rosa",
      pelo: c.ropa || "Azul", peloDetalle: c.acento || "Amarillo",
      ropa: c.ropa || "Azul", ropaDetalle: c.acento || "Amarillo", accesorio: c.acento || "Amarillo",
    },
  };
}

export function recetaAlAzar(seed = Date.now()) {
  const r = azar(seed);
  const elegir = (lista) => lista[Math.floor(r() * lista.length)];
  const receta = { version: 2 };
  for (const { id } of RANURAS) receta[id] = elegir(PARTES[id]).id;
  // Tres colores + Negro: la piel clara y dos colores más para el resto.
  const piel = elegir(COLORES_PIEL_CLAROS);
  const resto = COLORES_FIGURA.filter((c) => c !== piel && contraste(HEX[c], HEX[piel]) >= 1.3);
  const b = elegir(resto);
  const c = elegir(resto.filter((x) => x !== b));
  const deLos = (lista, evitar) => elegir(lista.filter((x) => x !== evitar));
  const ropa = elegir([b, c]);
  const pelo = elegir([b, c]);
  receta.colores = {
    cabeza: piel, ojos: TINTA, boca: TINTA,
    mejillas: deLos([b, c], piel),
    pelo, peloDetalle: deLos([piel, b, c, TINTA], pelo),
    ropa, ropaDetalle: deLos([piel, b, c, TINTA], ropa),
    accesorio: deLos([b, c, TINTA], piel),
  };
  return receta;
}

// Devuelve 24 × 24 celdas con el nombre del color de Línea azul o null (transparente).
export function componer(recetaOriginal, cuadro = 0) {
  const receta = normalizarReceta(recetaOriginal);
  const C = receta.colores;
  const celdas = new Array(N * N).fill(null);
  const pintar = (tramos, ranura) => {
    const color = (z) =>
      z === "s" ? C.cabeza :
      z === "p" ? C[ranura === "torso" ? "ropa" : ranura] :
      z === "d" ? C[ranura === "torso" ? "ropaDetalle" : ranura + "Detalle"] :
      z === "h" ? C.pelo : TINTA;
    for (const [y, x0, x1, z] of tramos) {
      if (y < 0 || y >= N) continue;
      const col = color(z) || TINTA;
      for (let x = Math.max(0, x0); x <= Math.min(N - 1, x1); x++) celdas[y * N + x] = col;
    }
  };
  pintar(parte("torso", receta.torso).tramos, "torso");
  pintar(parte("cabeza", receta.cabeza).tramos, "cabeza");
  pintar(parte("mejillas", receta.mejillas).tramos, "mejillas");
  const ojos = parte("ojos", receta.ojos);
  pintar(cuadro === 1 && ojos.cerrados ? ojos.cerrados : ojos.tramos, "ojos");
  const boca = parte("boca", receta.boca);
  if (cuadro === 2) {
    pintar(BOCA_ABIERTA, "boca");
    pintar(boca.tramos.filter((t) => t[3] === "h"), "boca");
  } else {
    pintar(boca.tramos, "boca");
  }
  pintar(parte("pelo", receta.pelo).tramos, "pelo");
  pintar(parte("accesorio", receta.accesorio).tramos, "accesorio");

  // Contorno exterior de 1 pixel (regla 3).
  const salida = celdas.slice();
  for (let i = 0; i < N * N; i++) {
    if (celdas[i]) continue;
    const x = i % N, y = (i / N) | 0;
    if ((x > 0 && celdas[i - 1]) || (x < N - 1 && celdas[i + 1]) || (y > 0 && celdas[i - N]) || (y < N - 1 && celdas[i + N])) salida[i] = TINTA;
  }
  return salida;
}

export function lenguaje(receta) {
  return parte("accesorio", receta.accesorio).lenguaje || "Pixel";
}

// Colores que realmente se ven en algún cuadro (incluye el Negro del contorno).
export function coloresUsados(receta) {
  const set = new Set();
  for (let c = 0; c < CUADROS.length; c++) componer(receta, c).forEach((v) => v && set.add(v));
  return [...set];
}

export function cabeEnPaleta(receta, llave, color) {
  const prueba = { ...normalizarReceta(receta) };
  prueba.colores = { ...prueba.colores, [llave]: color };
  return coloresUsados(prueba).length <= MAX_COLORES;
}

// Avisos para que el personaje se lea bien.
export function avisos(recetaOriginal) {
  const r = normalizarReceta(recetaOriginal);
  const out = [];
  const piel = HEX[r.colores.cabeza];
  if (contraste(HEX[r.colores.ojos], piel) < 1.8) out.push("Los ojos casi no se ven sobre la piel.");
  if (contraste(HEX[r.colores.boca], piel) < 1.8) out.push("La boca casi no se ve sobre la piel.");
  if (r.mejillas !== "ninguna" && r.colores.mejillas === r.colores.cabeza) out.push("Las mejillas tienen el mismo color que la piel.");
  if (r.colores.ropa === r.colores.cabeza) out.push("La ropa y la piel tienen el mismo color: el cuello se pierde.");
  return out;
}

// Descripción portable para juegos, galería y Oculus.
export function manifiesto(receta, extra = {}) {
  const r = normalizarReceta(receta);
  return {
    formato: "somos-diseno/personaje@2",
    grilla: N,
    pixel: 10,
    fps: FPS,
    cuadros: CUADROS,
    espera: ESPERA,
    paleta: Object.fromEntries(coloresUsados(r).map((n) => [n, HEX[n]])),
    lenguaje: lenguaje(r),
    receta: r,
    ...extra,
  };
}
