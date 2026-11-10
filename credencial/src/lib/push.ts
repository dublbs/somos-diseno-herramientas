// Avisos en el celular (Web Push, plan 007). Solo con Supabase y la clave pública VAPID (VITE_VAPID_PUBLIC_KEY).
// En iPhone funciona únicamente si la credencial se agregó a la pantalla de inicio (iOS 16.4+).
import { remoto, suscribirPush } from './store';

const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export const hayAvisos = () => remoto && Boolean(VAPID) && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const enIphoneSinInstalar = () => /iPhone|iPad/.test(navigator.userAgent) && !(window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone);

export type EstadoAvisos = 'no-disponible' | 'pedir' | 'activos' | 'bloqueados';

async function registro(): Promise<ServiceWorkerRegistration> {
  // La ruta es relativa a dist/ (el hub sirve la app en <hub>/credencial/dist/).
  return navigator.serviceWorker.register(new URL('./sw.js', document.baseURI).href, { scope: new URL('./', document.baseURI).pathname });
}

export async function estadoAvisos(): Promise<EstadoAvisos> {
  if (!hayAvisos()) return 'no-disponible';
  if (Notification.permission === 'denied') return 'bloqueados';
  try {
    const r = await navigator.serviceWorker.getRegistration(new URL('./', document.baseURI).pathname);
    const s = await r?.pushManager.getSubscription();
    return s ? 'activos' : 'pedir';
  } catch { return 'pedir'; }
}

function clave(b64: string): Uint8Array {
  const base = (b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(base);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

// Pide permiso, se suscribe y guarda la suscripción ligada a la credencial de este celular.
export async function activarAvisos(codigo: string): Promise<EstadoAvisos> {
  if (!hayAvisos()) return 'no-disponible';
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return permiso === 'denied' ? 'bloqueados' : 'pedir';
  const r = await registro();
  await navigator.serviceWorker.ready;
  const s = (await r.pushManager.getSubscription()) ?? (await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: clave(VAPID!) as BufferSource }));
  const j = s.toJSON();
  if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) throw new Error('La suscripción vino incompleta.');
  await suscribirPush(codigo, j.endpoint, j.keys.p256dh, j.keys.auth);
  return 'activos';
}
