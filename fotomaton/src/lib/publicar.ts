import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { guardarLocal, leerLocal } from './almacenLocal';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && anon ? createClient(url, anon) : null;
export const hayBackend = !!supabase;

// Con HashRouter el enlace funciona donde sea que se sirva la app (raíz, subcarpeta o dentro del hub).
const enlaceTarjeta = (id: string) => `${location.origin}${location.pathname}#/f/${id}`;
// Sin Supabase todo sigue andando en modo de prueba: la tarjeta queda solo en este navegador.

// Sube solo la tarjeta final (la foto original nunca sale del dispositivo).
// El id lo genera el cliente (uuid aleatorio): sirve de ruta en el bucket y de enlace del QR.
export async function publicarTarjeta(blob: Blob, marco: string, tinta: string): Promise<{ id: string; enlace: string }> {
  const id = crypto.randomUUID();
  if (!supabase) { await guardarLocal(id, blob, marco, tinta); return { id, enlace: enlaceTarjeta(id) }; }
  const ruta = `${id}.png`;
  const sube = await supabase.storage.from('fotomaton').upload(ruta, blob, { contentType: 'image/png', upsert: false });
  if (sube.error) throw sube.error;
  const fila = await supabase.from('fotomaton').insert({ id, ruta, marco, tinta });
  if (fila.error) throw fila.error;
  return { id, enlace: enlaceTarjeta(id) };
}

// La página /f/:id no toca la tabla ni el bucket: pide la URL firmada (60 s) a la Edge Function `tarjeta`,
// que valida el id y que no haya expirado. Así el bucket nunca se puede listar.
export async function obtenerTarjeta(id: string): Promise<{ url: string; expira: string } | null> {
  if (!supabase) return leerLocal(id);
  const { data, error } = await supabase.functions.invoke('tarjeta', { body: { id } });
  if (error || !data?.url) return null;
  return { url: data.url as string, expira: data.expira as string };
}

export const generarQR = (enlace: string) =>
  QRCode.toDataURL(enlace, { width: 720, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#141414', light: '#FFFFFF' } });
