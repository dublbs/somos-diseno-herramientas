// Capa de datos del PC madre (plan 007). Todo pasa por Supabase con la sesión del staff:
// las políticas de shared/supabase/juego.sql deciden qué puede hacer cada rol.
import { createClient, type Session } from '@supabase/supabase-js';
import { hashPin } from '../../../shared/juego';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const configurado = Boolean(url && clave);
export const sb = configurado ? createClient(url!, clave!) : null;

export interface Staff { user_id: string; nombre: string; rol: 'admin' | 'mesa' }
export interface Persona { id: string; codigo: string; nombre: string; marco: string; creada: string; canjeado: boolean; sellos: number[]; portales: number; avisos: number }
export interface Sesion { id: number; mesa: string; app: string; codigo: string; inicio: string }
export interface Premio { nombre: string; stock: number; limite_diario: number }
export interface Notificacion { id: number; titulo: string; cuerpo: string; url: string | null; codigo: string | null; enviadas: number; fallidas: number; creado: string }
export interface Canje { credencial_id: string; dia: string; creado: string }

const exigir = () => { if (!sb) throw new Error('Falta configurar Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).'); return sb; };
const error = (e: { message: string } | null) => { if (e) throw new Error(e.message); };

// ---------- sesión ----------
export async function entrar(email: string, password: string): Promise<Session> {
  const { data, error: e } = await exigir().auth.signInWithPassword({ email, password });
  error(e);
  return data.session!;
}
// Crear cuenta desde el panel: la primera queda como admin (trigger en juego.sql); las demás esperan aprobación.
export async function registrarse(email: string, password: string, nombre: string): Promise<{ sesion: boolean }> {
  const { data, error: e } = await exigir().auth.signUp({ email, password, options: { data: { nombre: nombre.trim() } } });
  error(e);
  return { sesion: Boolean(data.session) };
}
export const salir = () => exigir().auth.signOut();
export const sesionActual = async () => (await exigir().auth.getSession()).data.session;
export const alCambiarSesion = (f: (s: Session | null) => void) => exigir().auth.onAuthStateChange((_, s) => f(s)).data.subscription;
export async function quienSoy(): Promise<Staff | null> {
  // Filtrado por el propio id: un admin ve a todo el equipo, y sin el filtro la consulta devolvería varias filas.
  const { data: u } = await exigir().auth.getUser();
  if (!u.user) return null;
  const { data, error: e } = await exigir().from('staff').select('user_id, nombre, rol').eq('user_id', u.user.id).maybeSingle();
  error(e);
  return (data as Staff | null) ?? null;
}

// ---------- personas y timbres ----------
export async function personas(busqueda = ''): Promise<Persona[]> {
  let q = exigir().from('personas').select('*').order('creada', { ascending: false }).limit(300);
  const b = busqueda.trim();
  if (b) q = q.or(`codigo.ilike.%${b}%,nombre.ilike.%${b}%`);
  const { data, error: e } = await q;
  error(e);
  return (data as Persona[]) ?? [];
}
export async function renombrar(id: string, nombre: string) {
  error((await exigir().from('credenciales').update({ nombre: nombre.trim().slice(0, 14) }).eq('id', id)).error);
}
export async function darSello(id: string, sello: number) {
  error((await exigir().from('sellos').upsert({ credencial_id: id, sello }, { onConflict: 'credencial_id,sello', ignoreDuplicates: true })).error);
}
export async function quitarSello(id: string, sello: number) {
  error((await exigir().from('sellos').delete().eq('credencial_id', id).eq('sello', sello)).error);
}
export async function borrarPersona(id: string) {
  error((await exigir().from('credenciales').delete().eq('id', id)).error);
}

// ---------- canje y premio ----------
export const ERRORES_CANJE: Record<string, string> = {
  credencial_no_existe: 'No existe esa credencial.',
  ya_canjeado: 'Ese premio ya se canjeó.',
  credencial_incompleta: 'La credencial no está completa.',
  sin_stock: 'No queda stock.',
  limite_diario: 'Se alcanzó el límite de hoy.',
};
export async function canjear(codigo: string): Promise<{ stock: number; hoy: number }> {
  const { data, error: e } = await exigir().rpc('canjear', { p_codigo: codigo });
  if (e) { const k = Object.keys(ERRORES_CANJE).find(k => e.message.includes(k)); throw new Error(k ? ERRORES_CANJE[k] : e.message); }
  return data as { stock: number; hoy: number };
}
export async function premio(): Promise<Premio> {
  const { data, error: e } = await exigir().from('premio').select('nombre, stock, limite_diario').eq('id', 1).single();
  error(e);
  return data as Premio;
}
export async function guardarPremio(p: Premio) {
  error((await exigir().from('premio').update(p).eq('id', 1)).error);
}
export async function canjesDeHoy(): Promise<number> {
  const dia = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
  const { count, error: e } = await exigir().from('canjes').select('*', { count: 'exact', head: true }).eq('dia', dia);
  error(e);
  return count ?? 0;
}

// ---------- mesas ----------
export async function sesiones(): Promise<Sesion[]> {
  const { data, error: e } = await exigir().from('sesiones_mesa').select('id, mesa, app, codigo, inicio').order('inicio', { ascending: false }).limit(80);
  error(e);
  return (data as Sesion[]) ?? [];
}

// ---------- avisos ----------
export async function enviarAviso(a: { titulo: string; cuerpo: string; url?: string; codigo?: string | null }): Promise<{ enviadas: number; fallidas: number }> {
  const { data, error: e } = await exigir().functions.invoke('notificar', { body: a });
  if (e) throw new Error(e.message);
  if (data?.error) throw new Error(data.error === 'solo_staff' ? 'Tu cuenta no está en la lista del staff.' : data.error);
  return data as { enviadas: number; fallidas: number };
}
export async function avisos(): Promise<Notificacion[]> {
  const { data, error: e } = await exigir().from('notificaciones').select('*').order('creado', { ascending: false }).limit(50);
  error(e);
  return (data as Notificacion[]) ?? [];
}
export async function suscritos(): Promise<number> {
  const { count, error: e } = await exigir().from('suscripciones_push').select('*', { count: 'exact', head: true });
  error(e);
  return count ?? 0;
}

// ---------- configuración ----------
export async function guardarPin(pin: string) {
  const valor = await hashPin(pin);
  error((await exigir().from('config').upsert({ clave: 'pin_staff_sha256', valor, actualizado: new Date().toISOString() })).error);
}
export async function hayPin(): Promise<boolean> {
  const { data } = await exigir().from('config').select('clave').eq('clave', 'pin_staff_sha256').maybeSingle();
  return Boolean(data);
}

// ---------- cuentas del staff (solo admin) ----------
export interface Pendiente { user_id: string; email: string; nombre: string; creado: string }
export async function pendientes(): Promise<Pendiente[]> {
  const { data, error: e } = await exigir().rpc('cuentas_pendientes');
  error(e);
  return (data as Pendiente[]) ?? [];
}
export async function listaStaff(): Promise<Staff[]> {
  const { data, error: e } = await exigir().from('staff').select('user_id, nombre, rol').order('creado');
  error(e);
  return (data as Staff[]) ?? [];
}
export async function aprobar(user_id: string, nombre: string, rol: 'admin' | 'mesa') {
  error((await exigir().rpc('aprobar_staff', { p_user: user_id, p_nombre: nombre, p_rol: rol })).error);
}
export async function quitar(user_id: string) {
  error((await exigir().rpc('quitar_staff', { p_user: user_id })).error);
}

// ---------- en vivo ----------
// Avisa cuando cambia algo que el panel muestra (credenciales, sellos, canjes). Si Realtime no está activo, no pasa nada.
export function enVivo(alCambiar: () => void): () => void {
  if (!sb) return () => {};
  const canal = sb.channel('pc-madre')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'credenciales' }, alCambiar)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sellos' }, alCambiar)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'canjes' }, alCambiar)
    .subscribe();
  return () => { sb.removeChannel(canal); };
}
