// face-api (con tfjs dentro) pesa ~1,5 MB: se importa bajo demanda, fuera del bundle inicial.
type FaceApi = typeof import('@vladmandic/face-api');
let faceapi: FaceApi;

// Una persona: la caja de su cara. Un grupo: la caja que las encierra a todas.
// `n` es la cantidad de caras y `ref` el ancho promedio de una cara (para medir la trama).
export interface Cara { x: number; y: number; w: number; h: number; n: number; ref: number }

// Detección de rostro local (TinyFaceDetector, sin servidor). Los pesos viven en /modelo.
export const CARA = { listo: false, cargando: null as Promise<boolean> | null };

export function cargarCara(): Promise<boolean> {
  if (CARA.cargando) return CARA.cargando;
  CARA.cargando = (async () => {
    try {
      faceapi = await import('@vladmandic/face-api');
      // tfjs va dentro de face-api; sus tipos no exponen setBackend/ready.
      const tf = faceapi.tf as unknown as { setBackend(n: string): Promise<boolean>; ready(): Promise<void> };
      try { await tf.setBackend('webgl'); } catch { /* cae al backend por defecto */ }
      const baseModelo = (import.meta.env.BASE_URL || './').replace(/\/$/, '') + '/modelo';
      await faceapi.nets.tinyFaceDetector.loadFromUri(baseModelo);
      CARA.listo = true;
      return true;
    } catch (e) {
      console.warn('Detección de cara no disponible', e);
      return false;
    }
  })();
  return CARA.cargando;
}

export async function detectarCara(src: HTMLCanvasElement | HTMLVideoElement, tam = 320): Promise<Cara | null> {
  if (!CARA.listo) return null;
  try {
    const rs = await faceapi.detectAllFaces(src, new faceapi.TinyFaceDetectorOptions({ inputSize: tam, scoreThreshold: 0.4 }));
    if (!rs.length) return null;
    // Descarta falsos positivos muy chicos frente a la cara más grande.
    const mayor = Math.max(...rs.map(r => r.box.width));
    const cajas = rs.map(r => r.box).filter(b => b.width >= mayor * 0.35);
    if (cajas.length === 1) { const b = cajas[0]; return { x: b.x, y: b.y, w: b.width, h: b.height, n: 1, ref: b.width }; }
    const x0 = Math.min(...cajas.map(b => b.x)), y0 = Math.min(...cajas.map(b => b.y));
    const x1 = Math.max(...cajas.map(b => b.x + b.width)), y1 = Math.max(...cajas.map(b => b.y + b.height));
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, n: cajas.length, ref: cajas.reduce((t, b) => t + b.width, 0) / cajas.length };
  } catch { return null; }
}

export const suavizar = (a: Cara | null, b: Cara, k: number): Cara =>
  a ? {
    x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k, h: a.h + (b.h - a.h) * k,
    ref: a.ref + (b.ref - a.ref) * k, n: b.n,
  } : b;
