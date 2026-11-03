// Descargas y grabación del lienzo en vivo (mismo enfoque que loops/src/lib/grabarLoop.ts, pero en tiempo real:
// lo que se graba es lo que el sonido está moviendo en ese momento).
const TIPOS: [string, string][] = [
  ['video/mp4;codecs=avc1', 'mp4'],
  ['video/mp4', 'mp4'],
  ['video/webm;codecs=vp9', 'webm'],
  ['video/webm', 'webm'],
];
export const puedeGrabar = () => typeof MediaRecorder !== 'undefined' && TIPOS.some(([t]) => MediaRecorder.isTypeSupported(t));

export function grabarEnVivo(canvas: HTMLCanvasElement, segundos: number, fps: number, alProgreso: (f: number) => void): Promise<{ blob: Blob; ext: string }> {
  return new Promise((resolve, reject) => {
    const tipo = TIPOS.find(([t]) => MediaRecorder.isTypeSupported(t));
    if (!tipo) { reject(new Error('Este navegador no graba video.')); return; }
    const flujo = canvas.captureStream(fps);
    const rec = new MediaRecorder(flujo, { mimeType: tipo[0], videoBitsPerSecond: 6_000_000 });
    const trozos: Blob[] = [];
    rec.ondataavailable = e => { if (e.data.size) trozos.push(e.data); };
    rec.onerror = () => reject(new Error('No se pudo grabar el loop.'));
    rec.onstop = () => { flujo.getTracks().forEach(t => t.stop()); resolve({ blob: new Blob(trozos, { type: tipo[0].split(';')[0] }), ext: tipo[1] }); };
    rec.start();
    const inicio = performance.now();
    const iv = setInterval(() => {
      const f = (performance.now() - inicio) / (segundos * 1000);
      alProgreso(Math.min(1, f));
      if (f >= 1) { clearInterval(iv); rec.stop(); }
    }, 100);
  });
}

export function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
