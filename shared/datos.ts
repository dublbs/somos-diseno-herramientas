// Capa de datos común (plan 005, bloque E): lo que las experiencias mandan al HUB y lo que el HUB escucha.
// Una sola interfaz con dos implementaciones:
//   · local (siempre disponible): localStorage del equipo + BroadcastChannel entre pestañas. Sirve para probar
//     y para una sola máquina (el HUB y las experiencias abiertos en el mismo navegador).
//   · Supabase: se activa sola si al compilar existen VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (nunca en el repo).
//     Usa la API REST de la tabla `eventos` con fetch (sin librerías) y el HUB la consulta cada pocos segundos.
// Guía para crear el proyecto, la tabla, las políticas y el borrado a las 24 h: docs/supabase.md.

export interface Datos {
  credencial: { nombre: string; lenguaje: 'Pixel' | 'Geométrica' | 'Orgánica'; personaje: string; foto?: string }; // foto solo con consentimiento
  timbre: { sello: number; app?: string }; // app: la mesa que lo otorgó (timbre 2)
  vagon: { png: string; modelo: string; carros: number };
  grabado: { png: string };
  mosaico: { png: string };
  audio: { escena: string };
}
export type Tipo = keyof Datos;
export interface Evento<T extends Tipo = Tipo> { id: string; tipo: T; codigo: string | null; datos: Datos[T]; creado: number }

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
const URL_SB = env.VITE_SUPABASE_URL, CLAVE = env.VITE_SUPABASE_ANON_KEY;
export const remoto = Boolean(URL_SB && CLAVE);

// ---------- local ----------
const LLAVE = 'sd:eventos', MAX = 300;
const canal: BroadcastChannel | null = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('sd:datos') : null;
const leerLocal = (): Evento[] => { try { return JSON.parse(localStorage.getItem(LLAVE) || '[]'); } catch { return []; } };
function guardarLocal(lista: Evento[]) {
  // Si no cabe, se descartan primero las imágenes de los eventos más viejos.
  let l = lista.slice(-MAX);
  for (let intento = 0; intento < 4; intento++) {
    try { localStorage.setItem(LLAVE, JSON.stringify(l)); return; } catch { l = l.slice(Math.ceil(l.length / 3)); }
  }
}

// ---------- Supabase (REST) ----------
const cabeceras = () => ({ apikey: CLAVE!, Authorization: `Bearer ${CLAVE}`, 'Content-Type': 'application/json' });
interface Fila { id: number; tipo: Tipo; codigo: string | null; datos: Datos[Tipo]; creado: string }
const deFila = (f: Fila): Evento => ({ id: String(f.id), tipo: f.tipo, codigo: f.codigo, datos: f.datos, creado: Date.parse(f.creado) });

// ---------- API ----------
export async function publicar<T extends Tipo>(tipo: T, datos: Datos[T], codigo: string | null = null): Promise<void> {
  if (remoto) {
    const r = await fetch(`${URL_SB}/rest/v1/eventos`, { method: 'POST', headers: { ...cabeceras(), Prefer: 'return=minimal' }, body: JSON.stringify({ tipo, codigo, datos }) });
    if (!r.ok) throw new Error(`No se pudo publicar (${r.status}).`);
    return;
  }
  const ev: Evento<T> = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, tipo, codigo, datos, creado: Date.now() };
  guardarLocal([...leerLocal(), ev]);
  canal?.postMessage(ev);
}

export async function recientes<T extends Tipo>(tipo: T, n = 20): Promise<Evento<T>[]> {
  if (remoto) {
    const r = await fetch(`${URL_SB}/rest/v1/eventos?tipo=eq.${tipo}&order=creado.desc&limit=${n}`, { headers: cabeceras() });
    if (!r.ok) return [];
    return ((await r.json()) as Fila[]).map(deFila) as Evento<T>[];
  }
  return leerLocal().filter((e): e is Evento<T> => e.tipo === tipo).slice(-n).reverse();
}

// Avisa cada evento nuevo (de esta pestaña, de otras pestañas o, con Supabase, de cualquier equipo).
export function escuchar(alEvento: (e: Evento) => void, cadaMs = 4000): () => void {
  if (remoto) {
    let desde = new Date().toISOString(), vivo = true;
    const mirar = async () => {
      if (!vivo) return;
      try {
        const r = await fetch(`${URL_SB}/rest/v1/eventos?creado=gt.${encodeURIComponent(desde)}&order=creado.asc&limit=100`, { headers: cabeceras() });
        if (r.ok) for (const f of (await r.json()) as Fila[]) { desde = f.creado; alEvento(deFila(f)); }
      } catch { /* sin red: se reintenta */ }
      if (vivo) setTimeout(mirar, cadaMs);
    };
    setTimeout(mirar, cadaMs);
    return () => { vivo = false; };
  }
  const deCanal = (m: MessageEvent<Evento>) => alEvento(m.data);
  const vistos = new Set(leerLocal().map(e => e.id));
  // Otras pestañas del mismo navegador también avisan por `storage` (respaldo si no hay BroadcastChannel).
  const deStorage = (e: StorageEvent) => {
    if (e.key !== LLAVE) return;
    for (const ev of leerLocal()) if (!vistos.has(ev.id)) { vistos.add(ev.id); if (!canal) alEvento(ev); }
  };
  canal?.addEventListener('message', deCanal);
  window.addEventListener('storage', deStorage);
  return () => { canal?.removeEventListener('message', deCanal); window.removeEventListener('storage', deStorage); };
}

// Con Supabase, la mesa timbra directo la credencial (función sellar() de credencial/supabase/schema.sql).
// El código de la estación lo escribe el staff en la configuración de la mesa: no viaja en los eventos.
export async function sellarRemoto(codigo: string, sello: number, token: string): Promise<boolean> {
  if (!remoto) return false;
  try {
    const r = await fetch(`${URL_SB}/rest/v1/rpc/sellar`, { method: 'POST', headers: cabeceras(), body: JSON.stringify({ p_codigo: codigo, p_sello: sello, p_token: token }) });
    return r.ok;
  } catch { return false; }
}

// Miniatura PNG de un lienzo (lo que viaja al HUB; nunca la imagen grande).
export function miniatura(fuente: HTMLCanvasElement, lado = 200): string {
  const k = lado / Math.max(fuente.width, fuente.height), c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(fuente.width * k)); c.height = Math.max(1, Math.round(fuente.height * k));
  const x = c.getContext('2d')!; x.imageSmoothingQuality = 'high'; x.drawImage(fuente, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}
