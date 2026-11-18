import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { CARA, detectarCara, suavizar, type Cara } from '../lib/cara';
import { componer, pintarVideo } from '../lib/trama';
import { TINTAS } from '../data/tintas';

// Mensajes en pantalla según el error de getUserMedia (con «Reintentar» y «Subir una foto» al lado).
const MENSAJES: Record<string, string> = {
  SinHttps: 'La cámara solo funciona con https://. Abre la página con https:// o desde localhost.',
  NotAllowedError: 'La cámara está bloqueada. Permítela en los ajustes del sitio (el candado o «aA» junto a la dirección) y toca Reintentar.',
  SecurityError: 'La cámara está bloqueada. Permítela en los ajustes del sitio (el candado o «aA» junto a la dirección) y toca Reintentar.',
  NotFoundError: 'No encontramos una cámara en este dispositivo.',
  OverconstrainedError: 'No encontramos una cámara en este dispositivo.',
  NotReadableError: 'Otra app usa la cámara. Ciérrala y toca Reintentar.',
  AbortError: 'Otra app usa la cámara. Ciérrala y toca Reintentar.',
  SinCamara: 'Este navegador no deja usar la cámara.',
  Cortada: 'La cámara se cortó. Toca Reintentar.',
};
export const mensajeCamara = (e: unknown) => MENSAJES[(e as Error)?.name] ?? 'No pudimos abrir la cámara. Toca Reintentar.';

export type Lado = 'user' | 'environment';

// Pide la cámara con restricciones tolerantes: retrato 3:4 y el lado como «ideal» (nunca «exact»). Si el equipo no las
// cumple, reintenta con menos; si es un tema de permiso, no insiste (el navegador ya respondió).
// Importante: la primera llamada a getUserMedia ocurre antes del primer await, así que si se llama dentro de un toque
// (botón «Abrir la cámara», «Reintentar»), el navegador la ve como pedida por la persona.
export async function pedirCamara(lado: Lado): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia)
    throw Object.assign(new Error('sin mediaDevices'), { name: window.isSecureContext ? 'SinCamara' : 'SinHttps' });
  const intentos: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: lado }, width: { ideal: 960 }, height: { ideal: 1280 }, aspectRatio: { ideal: 3 / 4 } }, audio: false },
    { video: { facingMode: { ideal: lado } }, audio: false },
    { video: true, audio: false },
  ];
  let ultimo: unknown;
  for (const r of intentos) {
    try { return await navigator.mediaDevices.getUserMedia(r); }
    catch (e) {
      ultimo = e;
      const n = (e as DOMException).name;
      if (n === 'NotAllowedError' || n === 'SecurityError') throw e;
    }
  }
  throw ultimo;
}

// La cámara pedida en el toque del tutorial («Abrir la cámara»): la toma useCamara al montarse.
let pendiente: { lado: Lado; promesa: Promise<MediaStream> } | null = null;
export function abrirCamaraEnToque(lado: Lado) {
  pendiente = { lado, promesa: pedirCamara(lado) };
  pendiente.promesa.catch(() => { /* lo muestra useCamara */ });
}
// ¿La persona ya dio permiso antes? Entonces se puede abrir sola, sin esperar un toque.
// (Safari no responde permissions.query de la cámara: por eso también vale haberla abierto antes en esta sesión.)
let abrioAntes = false;
async function yaPermitida(): Promise<boolean> {
  if (abrioAntes) return true;
  try { return (await navigator.permissions.query({ name: 'camera' as PermissionName })).state === 'granted'; }
  catch { return false; }
}

// vivo: el último cuadro de la cámara (para que las placas del panel muestren la vista en vivo).
interface Params { lado: Lado; marco: string; celda: number; tinta: string; apagadas: readonly string[]; vivo?: MutableRefObject<{ c: HTMLCanvasElement; cara: Cara | null } | null> }
// estado: 'pidiendo' (esperando al navegador), 'tocar' (falta un toque para pedirla), 'lista' o 'error'.
export type EstadoCamara = 'pidiendo' | 'tocar' | 'lista' | 'error';

// getUserMedia + loop de vista previa (~15 fps) + detección de cara cada ~300 ms.
export function useCamara(params: Params) {
  const video = useRef<HTMLVideoElement>(null), lienzo = useRef<HTMLCanvasElement>(null);
  const cuadro = useRef(document.createElement('canvas'));
  const props = useRef(params); props.current = params;
  const cara = useRef<Cara | null>(null), visto = useRef(0);
  const lado = params.lado;
  const [error, setError] = useState(''), [estado, setEstado] = useState<EstadoCamara>('pidiendo'), [personas, setPersonas] = useState(0);
  const stream = useRef<MediaStream | null>(null), turno = useRef(0), ultima = useRef<Promise<MediaStream> | null>(null);

  const soltar = () => { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; };
  // Conecta una cámara pedida (promesa) al <video>. `turno` descarta respuestas viejas (cambio de lado, desmontaje).
  const usar = useCallback(async (promesa: Promise<MediaStream>) => {
    const yo = ++turno.current; ultima.current = promesa;
    setEstado('pidiendo'); setError('');
    try {
      const s = await promesa;
      // respuesta vieja: se apaga, salvo que sea la misma cámara que espera el pedido vigente
      if (yo !== turno.current) { if (promesa !== ultima.current) s.getTracks().forEach(t => t.stop()); return; }
      soltar(); stream.current = s;
      // Si el sistema corta la cámara (otra app la toma, la tablet se bloquea), se ofrece Reintentar.
      s.getVideoTracks().forEach(t => t.addEventListener('ended', () => {
        if (stream.current !== s) return;
        soltar(); setError(MENSAJES.Cortada); setEstado('error');
      }));
      const v = video.current!;
      v.srcObject = s; await v.play().catch(() => { /* autoplay muteado: igual dibuja */ });
      setEstado('lista'); abrioAntes = true;
    } catch (e) {
      if (yo !== turno.current) return;
      console.warn('Cámara:', e);
      setError(mensajeCamara(e)); setEstado('error');
    }
  }, []);
  // Para «Reintentar» y «Activar la cámara»: se llama dentro del toque.
  const activar = useCallback(() => { usar(pedirCamara(props.current.lado)); }, [usar]);

  useEffect(() => {
    let vivo = true;
    if (pendiente && pendiente.lado === lado) { const p = pendiente.promesa; usar(p).then(() => { if (pendiente?.promesa === p) pendiente = null; }); }
    // Cambio de lado: el permiso ya está dado. Se suelta la cámara anterior antes de pedir la otra (muchas tablets
    // Android no abren las dos a la vez y responden NotReadableError).
    else if (stream.current) { soltar(); usar(pedirCamara(lado)); }
    else yaPermitida().then(ok => { if (!vivo) return; if (ok) usar(pedirCamara(lado)); else setEstado('tocar'); });
    return () => { vivo = false; };
  }, [lado, usar]);
  // Al salir de la cámara (o de la página) se apagan las pistas. `ultima` en null hace que una respuesta que llegue
  // después también se apague (si no, la cámara quedaría encendida sin nadie que la muestre).
  useEffect(() => {
    const salir = () => { turno.current++; ultima.current = null; soltar(); };
    // Si la página vuelve del caché del navegador (atrás/adelante), la cámara ya no está: se pide un toque.
    const alOcultar = () => { salir(); setEstado('tocar'); };
    window.addEventListener('pagehide', alOcultar);
    return () => { window.removeEventListener('pagehide', alOcultar); salir(); };
  }, []);

  useEffect(() => {
    let vivo = true, ocupado = false;
    const iv = setInterval(async () => {
      if (ocupado || !CARA.listo || !cuadro.current.width) return;
      ocupado = true;
      const r = await detectarCara(cuadro.current, 224); ocupado = false;
      if (!vivo) return;
      const ahora = performance.now();
      if (r) { cara.current = suavizar(cara.current, r, 0.4); visto.current = ahora; }
      else if (ahora - visto.current > 1200) cara.current = null;
      setPersonas(cara.current?.n ?? 0);
    }, 300);
    return () => { vivo = false; clearInterval(iv); };
  }, [lado]);

  useEffect(() => {
    let raf = 0, ultimo = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick); if (t - ultimo < 66) return; ultimo = t;
      const v = video.current, c = lienzo.current;
      if (!v || !c || !c.width || v.readyState < 2) return;
      // El cuadro en vivo, en retrato 3:4 (recortado al centro) y chico: la trama se calcula sobre la zona de foto.
      if (!pintarVideo(cuadro.current, v, lado === 'user', 480)) return;
      const p = props.current;
      componer(c.getContext('2d')!, c.width, p.marco, cuadro.current, p.celda, TINTAS[p.tinta], cara.current, { apagadas: p.apagadas });
      if (p.vivo) p.vivo.current = { c: cuadro.current, cara: cara.current };
      // Solo en desarrollo: cuenta cuadros para medir la vista en vivo (Playwright lee window.__cuadros).
      if (import.meta.env.DEV) (window as unknown as { __cuadros?: number }).__cuadros = ((window as unknown as { __cuadros?: number }).__cuadros ?? 0) + 1;
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [lado]);

  // Foto en retrato 3:4 (1200 × 1600) con la cara de la vista previa reescalada.
  const capturar = (): { foto: HTMLCanvasElement; cara: Cara | null } => {
    const foto = document.createElement('canvas');
    pintarVideo(foto, video.current!, lado === 'user', 1600);
    const k = foto.width / (cuadro.current.width || foto.width), c0 = cara.current;
    return { foto, cara: c0 ? { x: c0.x * k, y: c0.y * k, w: c0.w * k, h: c0.h * k, n: c0.n, ref: c0.ref * k } : null };
  };

  return { video, lienzo, error, estado, activar, personas, capturar };
}
