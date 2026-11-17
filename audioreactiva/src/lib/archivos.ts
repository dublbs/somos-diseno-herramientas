// Grabación del lienzo en vivo: lo que se graba es lo que la música está moviendo en ese momento.
// Si hay audio (la mezcla de la estación, por MediaStreamAudioDestinationNode), el video lo lleva.
const CON_AUDIO: [string, string][] = [
  ['video/mp4;codecs=avc1,mp4a.40.2', 'mp4'],
  ['video/webm;codecs=vp9,opus', 'webm'],
  ['video/webm;codecs=vp8,opus', 'webm'],
];
const SIN_AUDIO: [string, string][] = [
  ['video/mp4;codecs=avc1', 'mp4'],
  ['video/mp4', 'mp4'],
  ['video/webm;codecs=vp9', 'webm'],
  ['video/webm', 'webm'],
];
const soporta = (t: string) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t);
export const puedeGrabar = () => SIN_AUDIO.some(([t]) => soporta(t));

export function grabarEnVivo(canvas: HTMLCanvasElement, segundos: number, fps: number, alProgreso: (f: number) => void, audio?: MediaStream | null): Promise<{ blob: Blob; ext: string; conAudio: boolean }> {
  return new Promise((resolve, reject) => {
    const pistasAudio = audio?.getAudioTracks() ?? [];
    let tipo = pistasAudio.length ? CON_AUDIO.find(([t]) => soporta(t)) : undefined;
    // Safari graba «video/mp4» con audio AAC sin declarar códecs
    if (!tipo && pistasAudio.length && soporta('video/mp4')) tipo = ['video/mp4', 'mp4'];
    const conAudio = !!tipo;
    tipo ??= SIN_AUDIO.find(([t]) => soporta(t));
    if (!tipo) { reject(new Error('Este navegador no graba video.')); return; }
    const video = canvas.captureStream(fps);
    const flujo = new MediaStream([...video.getVideoTracks(), ...(conAudio ? pistasAudio : [])]);
    const rec = new MediaRecorder(flujo, { mimeType: tipo[0], videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 160_000 });
    const trozos: Blob[] = [];
    rec.ondataavailable = e => { if (e.data.size) trozos.push(e.data); };
    rec.onerror = () => reject(new Error('No se pudo grabar el loop.'));
    rec.onstop = () => { video.getTracks().forEach(t => t.stop()); resolve({ blob: new Blob(trozos, { type: tipo![0].split(';')[0] }), ext: tipo![1], conAudio }); };
    rec.start();
    const inicio = performance.now();
    const iv = setInterval(() => {
      const f = (performance.now() - inicio) / (segundos * 1000);
      alProgreso(Math.min(1, f));
      if (f >= 1) { clearInterval(iv); rec.stop(); }
    }, 100);
  });
}
