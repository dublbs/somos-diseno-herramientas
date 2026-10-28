// Respaldo sin Supabase: guarda la tarjeta en IndexedDB del navegador (24 h).
// Sirve para probar todo el flujo (QR → /f/:id) en un mismo dispositivo; un celular distinto no la ve.
const DB = 'fotomaton-local', TABLA = 'tarjetas', DIA = 24 * 60 * 60 * 1000;

interface Fila { id: string; blob: Blob; marco: string; tinta: string; expira: number }

const abrir = () => new Promise<IDBDatabase>((res, rej) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(TABLA, { keyPath: 'id' });
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
const pedir = <T,>(db: IDBDatabase, modo: IDBTransactionMode, f: (t: IDBObjectStore) => IDBRequest<T>) =>
  new Promise<T>((res, rej) => { const r = f(db.transaction(TABLA, modo).objectStore(TABLA)); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

export async function guardarLocal(id: string, blob: Blob, marco: string, tinta: string) {
  const db = await abrir();
  // Limpia las vencidas antes de guardar.
  const todas = await pedir<Fila[]>(db, 'readonly', t => t.getAll());
  for (const f of todas) if (f.expira < Date.now()) await pedir(db, 'readwrite', t => t.delete(f.id));
  await pedir(db, 'readwrite', t => t.put({ id, blob, marco, tinta, expira: Date.now() + DIA } satisfies Fila));
}

export async function leerLocal(id: string): Promise<{ url: string; expira: string } | null> {
  const db = await abrir();
  const f = await pedir<Fila | undefined>(db, 'readonly', t => t.get(id));
  if (!f || f.expira < Date.now()) return null;
  return { url: URL.createObjectURL(f.blob), expira: new Date(f.expira).toISOString() };
}
