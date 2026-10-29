import { createClient } from '@supabase/supabase-js';
import { normalizar } from '../../../shared/pixelfont';
import { SELLOS, normalizarRetrato, type DatosCarta, type Retrato } from '../pixel/render';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Sin variables de entorno la app funciona en modo demo: todo queda en este celular.
export const remoto = Boolean(url && clave);
const sb = remoto ? createClient(url!, clave!) : null;

export const limpiarNombre = (n: string) => normalizar(n).replace(/\s+/g, ' ').trim().slice(0, 14);

// ---------- modo demo (localStorage, con respaldo en memoria) ----------
const LLAVE = 'sd:credenciales';
type Db = Record<string, DatosCarta & { creada: string }>;
let memoria: Db = {};
const leer = (): Db => { try { return JSON.parse(localStorage.getItem(LLAVE) || 'null') || memoria; } catch { return memoria; } };
const escribir = (db: Db) => { memoria = db; try { localStorage.setItem(LLAVE, JSON.stringify(db)); } catch { /* queda en memoria */ } };
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const codigoNuevo = () => 'SD-' + Array.from({ length: 5 }, () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)]).join('');

// ---------- API ----------
export async function crear({ nombre, receta, marco }: { nombre: string; receta: Retrato; marco: string }): Promise<string> {
  const limpio = limpiarNombre(nombre);
  if (!limpio) throw new Error('Escribe un nombre.');
  if (sb) {
    const { data, error } = await sb.from('credenciales').insert({ nombre: limpio, receta, marco }).select('codigo').single();
    if (error) throw new Error(error.message);
    return data.codigo as string;
  }
  const db = leer();
  let codigo = codigoNuevo();
  while (db[codigo]) codigo = codigoNuevo();
  db[codigo] = { codigo, nombre: limpio, receta, marco, sellos: [], creada: new Date().toISOString() };
  escribir(db);
  return codigo;
}

export async function obtener(codigo: string): Promise<DatosCarta> {
  if (sb) {
    const { data, error } = await sb.from('credenciales').select('codigo,nombre,receta,marco,sellos(sello)').eq('codigo', codigo).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('No encontramos esa credencial.');
    return { ...(data as unknown as DatosCarta), receta: normalizarRetrato(data.receta), sellos: ((data.sellos as { sello: number }[]) || []).map(s => s.sello).sort() };
  }
  const c = leer()[codigo];
  if (!c) throw new Error('No encontramos esa credencial en este celular.');
  return { ...c, receta: normalizarRetrato(c.receta), sellos: [...c.sellos] };
}

export async function sellar(codigo: string, sello: number, token: string) {
  if (!Number.isInteger(sello) || sello < 1 || sello > SELLOS) throw new Error('Este QR de sello no es válido.');
  if (sb) {
    const { error } = await sb.rpc('sellar', { p_codigo: codigo, p_sello: sello, p_token: token });
    if (error) {
      if (error.message.includes('token_invalido')) throw new Error('Este QR de sello no es válido. Pide uno nuevo al equipo.');
      if (error.message.includes('credencial_no_existe')) throw new Error('No encontramos tu credencial.');
      throw new Error(error.message);
    }
    return;
  }
  // Modo demo: se acepta cualquier QR de sello (plan B sin conexión).
  const db = leer();
  const c = db[codigo];
  if (!c) throw new Error('No encontramos tu credencial.');
  if (!c.sellos.includes(sello)) c.sellos = [...c.sellos, sello].sort();
  escribir(db);
}

// La credencial propia de este celular.
export function miCredencial(): string | null { try { return localStorage.getItem('sd:mia'); } catch { return null; } }
export function guardarMiCredencial(codigo: string) { try { localStorage.setItem('sd:mia', codigo); } catch { /* sin almacenamiento */ } }
export function olvidarMiCredencial() { try { localStorage.removeItem('sd:mia'); } catch { /* nada */ } }

// Foto del Fotomatón: en el MVP queda solo en este celular (no se sube).
const llaveFoto = (codigo: string) => 'sd:foto:' + codigo;
const fotosEnMemoria: Record<string, string> = {};
export function fotoDe(codigo: string): string | null {
  try { return localStorage.getItem(llaveFoto(codigo)) ?? fotosEnMemoria[codigo] ?? null; } catch { return fotosEnMemoria[codigo] ?? null; }
}
export function guardarFoto(codigo: string, dataUrl: string) {
  fotosEnMemoria[codigo] = dataUrl;
  try { localStorage.setItem(llaveFoto(codigo), dataUrl); } catch { /* queda en memoria */ }
}
export function borrarFoto(codigo: string) {
  delete fotosEnMemoria[codigo];
  try { localStorage.removeItem(llaveFoto(codigo)); } catch { /* nada */ }
}
