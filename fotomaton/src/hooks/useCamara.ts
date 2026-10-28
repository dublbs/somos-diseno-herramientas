import { useEffect, useRef, useState } from 'react';
import { CARA, detectarCara, suavizar, type Cara } from '../lib/cara';
import { componer, pintarVideo } from '../lib/trama';
import { TINTAS } from '../data/tintas';

const MENSAJES: Record<string, string> = {
  SinHttps: 'La cámara solo funciona con HTTPS. Abre la página con https:// o desde localhost.',
  NotAllowedError: 'El navegador bloqueó la cámara. Dale permiso desde el candado de la barra de direcciones.',
  SecurityError: 'El navegador bloqueó la cámara. Dale permiso desde el candado de la barra de direcciones.',
  NotFoundError: 'No encontramos ninguna cámara en este dispositivo.',
  NotReadableError: 'Otra app está usando la cámara. Ciérrala y vuelve a intentar.',
  SinCamara: 'Este navegador no deja usar la cámara.',
};

interface Params { marco: string; celda: number; tinta: string }

// getUserMedia + loop de vista previa (~15 fps) + detección de cara cada ~220 ms.
export function useCamara(params: Params) {
  const video = useRef<HTMLVideoElement>(null), lienzo = useRef<HTMLCanvasElement>(null);
  const cuadro = useRef(document.createElement('canvas'));
  const props = useRef(params); props.current = params;
  const cara = useRef<Cara | null>(null), visto = useRef(0);
  const [lado, setLado] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState(''), [personas, setPersonas] = useState(0);

  useEffect(() => {
    let vivo = true, ocupado = false;
    const iv = setInterval(async () => {
      if (ocupado || !CARA.listo || !cuadro.current.width) return;
      ocupado = true;
      const r = await detectarCara(cuadro.current, 224); ocupado = false;
      if (!vivo) return;
      const ahora = performance.now();
      if (r) { cara.current = suavizar(cara.current, r, 0.35); visto.current = ahora; }
      else if (ahora - visto.current > 1200) cara.current = null;
      setPersonas(cara.current?.n ?? 0);
    }, 220);
    return () => { vivo = false; clearInterval(iv); };
  }, [lado]);

  useEffect(() => {
    let stream: MediaStream | undefined, cancelado = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw Object.assign(new Error('sin mediaDevices'), { name: window.isSecureContext ? 'SinCamara' : 'SinHttps' });
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: lado, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
        } catch (e) {
          // Si falla por las restricciones (no por el permiso), reintenta con lo mínimo.
          const n = (e as DOMException).name;
          if (n === 'NotAllowedError' || n === 'SecurityError') throw e;
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        if (cancelado) { stream.getTracks().forEach(t => t.stop()); return; }
        video.current!.srcObject = stream; await video.current!.play(); setError('');
      } catch (e) {
        if (cancelado) return;
        console.warn('Cámara:', e);
        setError(MENSAJES[(e as Error).name] ?? 'No pudimos abrir la cámara.');
      }
    })();
    return () => { cancelado = true; stream?.getTracks().forEach(t => t.stop()); };
  }, [lado]);

  useEffect(() => {
    let raf = 0, ultimo = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick); if (t - ultimo < 66) return; ultimo = t;
      const v = video.current, c = lienzo.current;
      if (!v || !c || !c.width || v.readyState < 2) return;
      if (!pintarVideo(cuadro.current, v, lado === 'user', 640)) return;
      const p = props.current;
      componer(c.getContext('2d')!, c.width, p.marco, cuadro.current, p.celda, TINTAS[p.tinta], cara.current);
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [lado]);

  // Foto a 1600 px con la cara de la vista previa reescalada.
  const capturar = (): { foto: HTMLCanvasElement; cara: Cara | null } => {
    const foto = document.createElement('canvas');
    pintarVideo(foto, video.current!, lado === 'user', 1600);
    const k = foto.width / (cuadro.current.width || foto.width), c0 = cara.current;
    return { foto, cara: c0 ? { x: c0.x * k, y: c0.y * k, w: c0.w * k, h: c0.h * k, n: c0.n, ref: c0.ref * k } : null };
  };

  return { video, lienzo, lado, setLado, error, personas, capturar };
}
