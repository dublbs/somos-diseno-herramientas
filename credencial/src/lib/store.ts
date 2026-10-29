import { createClient } from '@supabase/supabase-js';
import { normalizar } from '../../../shared/pixelfont';
import { SELLOS, normalizarRetrato, type DatosCarta, type Retrato } from '../pixel/render';
import { ESTACIONES } from '../../../shared/juego';
import { publicar } from '../../../shared/datos';
import { marcoListo } from '../../../shared/marcos';

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
// Lo que el HUB necesita de cada persona (nombre, lenguaje y cabeza) y sus timbres viajan por shared/datos.ts.
const avisarHub = (codigo: string, nombre: string, receta: Retrato, marco: string, foto?: string) =>
  publicar('credencial', { nombre, lenguaje: marcoListo(marco).visual, personaje: receta.retrato === 'personaje' ? receta.id : 'pixel', foto }, codigo).catch(() => { /* sin red */ });

export async function crear({ nombre, receta, marco }: { nombre: string; receta: Retrato; marco: string }): Promise<string> {
  const codigo = await crearCredencial({ nombre, receta, marco });
  avisarHub(codigo, limpiarNombre(nombre), receta, marco);
  publicar('timbre', { sello: 1 }, codigo).catch(() => { /* sin red */ });
  return codigo;
}

async function crearCredencial({ nombre, receta, marco }: { nombre: string; receta: Retrato; marco: string }): Promise<string> {
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
  // El timbre 1 (Inscripción) se gana al crear la credencial.
  db[codigo] = { codigo, nombre: limpio, receta, marco, sellos: [1], creada: new Date().toISOString() };
  escribir(db);
  return codigo;
}

export async function obtener(codigo: string): Promise<DatosCarta> {
  if (sb) {
    const { data, error } = await sb.from('credenciales').select('codigo,nombre,receta,marco,canjeado,sellos(sello)').eq('codigo', codigo).maybeSingle();
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
  if (!ESTACIONES[sello - 1].activa) throw new Error(`La estación ${sello} (${ESTACIONES[sello - 1].nombre}) todavía no está abierta.`);
  if (sb) {
    const { error } = await sb.rpc('sellar', { p_codigo: codigo, p_sello: sello, p_token: token });
    if (!error) publicar('timbre', { sello }, codigo).catch(() => { /* sin red */ });
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
  if (!c.sellos.includes(sello)) { c.sellos = [...c.sellos, sello].sort(); publicar('timbre', { sello }, codigo).catch(() => { /* sin red */ }); }
  escribir(db);
}

// Canje del premio con la credencial completa. Lo valida el staff con su PIN en este mismo celular.
export async function canjear(codigo: string) {
  if (sb) {
    const { error } = await sb.rpc('canjear', { p_codigo: codigo });
    if (error) throw new Error(error.message);
    return;
  }
  const db = leer();
  if (!db[codigo]) throw new Error('No encontramos tu credencial.');
  db[codigo].canjeado = true;
  escribir(db);
}

// El avatar del HUB: con la foto solo si la persona lo autoriza; si no, su personaje. Queda en este celular
// hasta que exista la capa de datos compartida (shared/datos.ts).
export type AvatarHub = 'personaje' | 'foto';
export function avatarHub(codigo: string): AvatarHub { try { return localStorage.getItem('sd:avatar:' + codigo) === 'foto' ? 'foto' : 'personaje'; } catch { return 'personaje'; } }
export function guardarAvatarHub(codigo: string, a: AvatarHub, datos?: DatosCarta, foto?: string) {
  try { localStorage.setItem('sd:avatar:' + codigo, a); } catch { /* nada */ }
  // Con consentimiento, viaja al HUB solo una miniatura de la cara (no la foto completa); si no, el personaje.
  if (datos) avisarHub(codigo, datos.nombre, datos.receta, datos.marco, a === 'foto' ? foto : undefined);
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
