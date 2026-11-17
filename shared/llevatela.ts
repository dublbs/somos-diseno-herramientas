// «Llévatela» (plan docs/plans/011-llevatela-qr.md): sube la creación final y devuelve el enlace del QR.
// Usa lo mismo que el Fotomatón: bucket privado `fotomaton`, tabla `fotomaton`, función `tarjeta` (URL firmada corta) y
// función `limpiar` (borra a las 24 h). La página de descarga es la del Fotomatón: `fotomaton/dist/#/f/:id?app=…`.
// Sin Supabase, o si el bucket todavía no existe, la tarjeta queda en este equipo (IndexedDB, la misma base que usa el
// Fotomatón) y el QR solo abre aquí: la experiencia nunca se cae.
import { CLAVE, URL_SB, cabeceras, remoto } from './datos';

export interface Subida { id: string; enlace: string; enServidor: boolean }

// Las experiencias se sirven como <hub>/<app>/dist/: la página de descarga está en <hub>/fotomaton/dist/.
export function enlaceDescarga(id: string, app: string, video = false): string {
  const base = new URL('../../fotomaton/dist/', location.href);
  return `${base.href}#/f/${id}?app=${encodeURIComponent(app)}${video ? '&video=1' : ''}`;
}

export async function subirCreacion(blob: Blob, app: string): Promise<Subida> {
  const id = crypto.randomUUID(), video = blob.type.startsWith('video/');
  const ext = video ? (blob.type.includes('mp4') ? 'mp4' : 'webm') : 'png';
  const enlace = enlaceDescarga(id, app, video);
  if (remoto && URL_SB && CLAVE) {
    try {
      const ruta = `${app}/${id}.${ext}`;
      const base: Record<string, string> = { ...cabeceras() };
      delete base['Content-Type'];
      const sube = await fetch(`${URL_SB}/storage/v1/object/fotomaton/${ruta}`, {
        method: 'POST', headers: { ...base, 'Content-Type': blob.type || 'image/png', 'x-upsert': 'false' }, body: blob,
      });
      if (!sube.ok) throw new Error(`storage ${sube.status}`);
      const fila = await fetch(`${URL_SB}/rest/v1/fotomaton`, {
        method: 'POST', headers: { ...cabeceras(), Prefer: 'return=minimal' }, body: JSON.stringify({ id, ruta, marco: app, tinta: '-' }),
      });
      if (!fila.ok) throw new Error(`tabla ${fila.status}`);
      return { id, enlace, enServidor: true };
    } catch (e) {
      console.warn('Llévatela: no se pudo subir; queda en este equipo.', e);
    }
  }
  await guardarEnEquipo(id, blob, app);
  return { id, enlace, enServidor: false };
}

// ---------- respaldo en el equipo (mismo esquema que fotomaton/src/lib/almacenLocal.ts) ----------
const DB = 'fotomaton-local', TABLA = 'tarjetas', DIA = 24 * 60 * 60 * 1000;
const abrir = () => new Promise<IDBDatabase>((res, rej) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(TABLA, { keyPath: 'id' });
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
async function guardarEnEquipo(id: string, blob: Blob, app: string) {
  const db = await abrir();
  await new Promise<void>((res, rej) => {
    const t = db.transaction(TABLA, 'readwrite');
    const os = t.objectStore(TABLA);
    const todas = os.getAll();
    todas.onsuccess = () => {
      for (const f of todas.result as { id: string; expira: number }[]) if (f.expira < Date.now()) os.delete(f.id);
      os.put({ id, blob, marco: app, tinta: '-', expira: Date.now() + DIA });
    };
    t.oncomplete = () => res(); t.onerror = () => rej(t.error);
  });
}
