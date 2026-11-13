import { useEffect, useRef, useState } from 'react';

// Lector de QR con la cámara trasera, dentro de la credencial (plan 008).
// Usa BarcodeDetector donde exista (Android/Chrome). Donde no (iPhone), jsQR sobre cuadros del video:
// se carga solo entonces (import dinámico), así no pesa en la primera carga.
interface Detector { detect: (fuente: CanvasImageSource) => Promise<{ rawValue: string }[]> }
declare global { interface Window { BarcodeDetector?: new (opciones: { formats: string[] }) => Detector } }

export type EstadoLector = 'iniciando' | 'buscando' | 'sin-camara' | 'sin-lector';
type JsQR = typeof import('jsqr').default;

const LADO_MAX = 640; // jsQR lee bien a esta escala y no traba el celular
const REPETIR_MS = 4000; // el mismo QR frente a la cámara no se vuelve a avisar antes de esto

export function useLectorQR(alLeer: (texto: string) => void) {
  const video = useRef<HTMLVideoElement>(null);
  const [estado, setEstado] = useState<EstadoLector>('iniciando');
  const aviso = useRef(alLeer);
  aviso.current = alLeer;

  useEffect(() => {
    let flujo: MediaStream | null = null, vivo = true, temporizador = 0, ultimo = '', cuando = 0;
    const detector = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
    let jsqr: JsQR | null = null;
    const lienzo = document.createElement('canvas');
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });

    const leerCuadro = async (v: HTMLVideoElement): Promise<string | null> => {
      if (v.readyState < 2) return null;
      if (detector) return (await detector.detect(v))[0]?.rawValue ?? null;
      if (!jsqr) jsqr = (await import('jsqr')).default;
      const k = Math.min(1, LADO_MAX / Math.max(v.videoWidth, v.videoHeight));
      const w = Math.round(v.videoWidth * k), h = Math.round(v.videoHeight * k);
      if (!w || !h || !ctx) return null;
      if (lienzo.width !== w || lienzo.height !== h) { lienzo.width = w; lienzo.height = h; }
      ctx.drawImage(v, 0, 0, w, h);
      return jsqr(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' })?.data ?? null;
    };

    const mirar = async () => {
      if (!vivo || !video.current) return;
      try {
        const texto = await leerCuadro(video.current);
        if (vivo && texto && (texto !== ultimo || Date.now() - cuando > REPETIR_MS)) {
          ultimo = texto; cuando = Date.now();
          aviso.current(texto);
        }
      } catch {
        // Si no se pudo cargar jsQR (sin conexión), se apaga la cámara y queda escribir el código a mano.
        if (!detector && !jsqr) { flujo?.getTracks().forEach(t => t.stop()); setEstado('sin-lector'); return; }
        // si no, fue un cuadro sin datos: se sigue mirando
      }
      temporizador = window.setTimeout(mirar, 220);
    };

    if (!navigator.mediaDevices?.getUserMedia) { setEstado('sin-camara'); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(s => {
        flujo = s;
        if (!vivo || !video.current) { s.getTracks().forEach(t => t.stop()); return; }
        video.current.srcObject = s;
        video.current.play().catch(() => { /* autoPlay lo intenta igual */ });
        setEstado('buscando');
        mirar();
      })
      .catch(() => { if (vivo) setEstado('sin-camara'); });
    return () => { vivo = false; clearTimeout(temporizador); flujo?.getTracks().forEach(t => t.stop()); };
  }, []);

  return { video, estado };
}

// Lo que importa de un código leído: un afiche de la cacería o un sello de mesa.
export type Lectura = { tipo: 'afiche'; secreto: string } | { tipo: 'sello'; ruta: string } | { tipo: 'otro' };
// El sello de la cacería (plan 008 §2) trae solo `SDA:<SECRETO>`; el enlace #/afiche/<SECRETO> también sirve.
export function interpretar(texto: string): Lectura {
  const s = texto.trim().match(/^SDA:([A-Za-z0-9]{2,12})$/);
  if (s) return { tipo: 'afiche', secreto: s[1].toUpperCase() };
  const a = texto.match(/#\/afiche\/([A-Za-z0-9]+)/);
  if (a) return { tipo: 'afiche', secreto: a[1].toUpperCase() };
  const i = texto.indexOf('#/sello/');
  if (i >= 0) return { tipo: 'sello', ruta: texto.slice(i) };
  return { tipo: 'otro' };
}
