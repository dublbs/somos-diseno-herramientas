// Graba el loop de la tarjeta a video con MediaRecorder (sin librerías).
// Prefiere MP4 (se abre en cualquier celular) y cae a WebM si el navegador no lo graba.
const TIPOS: [string, string][] = [
  ['video/mp4;codecs=avc1', 'mp4'],
  ['video/mp4', 'mp4'],
  ['video/webm;codecs=vp9', 'webm'],
  ['video/webm;codecs=vp8', 'webm'],
  ['video/webm', 'webm'],
];

export const puedeGrabar = () =>
  typeof MediaRecorder !== 'undefined' && TIPOS.some(([t]) => MediaRecorder.isTypeSupported(t));

const mcd = (a: number, b: number): number => (b ? mcd(b, a % b) : a);

// Largo del loop: el mínimo común múltiplo de las duraciones para que cierre sin salto.
// Si pasa de 12 s (piezas con tiempos que no calzan) se corta en 8 s.
export function duracionLoop(durs: number[]): number {
  let l = 0;
  for (const d of durs) {
    l = l ? (l / mcd(l, d)) * d : d;
    if (l > 12000) return 8000;
  }
  return l || 4000;
}

interface Opciones {
  canvas: HTMLCanvasElement; // la tarjeta completa que se graba
  dibujarCuadro: (ms: number) => void; // pinta el cuadro del instante `ms` en `canvas`
  fps: number;
  durMs: number;
  alProgreso?: (fraccion: number) => void;
}

export function grabarLoop({ canvas, dibujarCuadro, fps, durMs, alProgreso }: Opciones): Promise<{ blob: Blob; ext: string; seg: number }> {
  return new Promise((resolve, reject) => {
    const tipo = TIPOS.find(([t]) => MediaRecorder.isTypeSupported(t));
    if (!tipo) { reject(new Error('Este navegador no graba video.')); return; }
    const paso = 1000 / fps, total = Math.round(durMs / paso);
    dibujarCuadro(0);
    const stream = canvas.captureStream(fps);
    const rec = new MediaRecorder(stream, { mimeType: tipo[0], videoBitsPerSecond: 6_000_000 });
    const trozos: Blob[] = [];
    rec.ondataavailable = e => { if (e.data.size) trozos.push(e.data); };
    rec.onerror = () => reject(new Error('No se pudo grabar el loop.'));
    rec.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      resolve({ blob: new Blob(trozos, { type: tipo[0].split(';')[0] }), ext: tipo[1], seg: durMs / 1000 });
    };
    rec.start();
    let n = 0;
    const iv = setInterval(() => {
      n++;
      if (n >= total) { clearInterval(iv); alProgreso?.(1); setTimeout(() => rec.stop(), paso * 2); return; }
      dibujarCuadro(n * paso);
      alProgreso?.(n / total);
    }, paso);
  });
}
