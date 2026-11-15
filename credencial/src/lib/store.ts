import { createClient } from '@supabase/supabase-js';
import { normalizar } from '../../../shared/pixelfont';
import { SELLOS, normalizarRetrato, type DatosCarta, type Retrato } from '../pixel/render';
import { ESTACIONES, verificarPin } from '../../../shared/juego';
import { escuchar, publicar, recientes, type Evento, type Tipo } from '../../../shared/datos';
import { marcoListo } from '../../../shared/marcos';
import { aficheDe } from './afiches';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Sin variables de entorno la app funciona en modo demo: todo queda en este celular.
export const remoto = Boolean(url && clave);
const sb = remoto ? createClient(url!, clave!) : null;

export const limpiarNombre = (n: string) => normalizar(n).replace(/\s+/g, ' ').trim().slice(0, 14);

// ---------- modo demo (localStorage, con respaldo en memoria) ----------
const LLAVE = 'sd:credenciales';
// pasos: en modo demo, los afiches encontrados por estación (con Supabase viven en la tabla `pasos`).
type Db = Record<string, DatosCarta & { creada: string; pasos?: Record<number, string[]> }>;
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

// Resultado de timbrar: con estaciones de varios pasos (Portales: 3 afiches), el timbre llega al completar la meta.
export interface ResultadoSello { pasos: number; meta: number; otorgado: boolean; nuevo: boolean }

export async function sellar(codigo: string, sello: number, token: string, clave?: string): Promise<ResultadoSello> {
  if (!Number.isInteger(sello) || sello < 1 || sello > SELLOS) throw new Error('Este QR de sello no es válido.');
  if (!ESTACIONES[sello - 1].activa) throw new Error(`La estación ${sello} (${ESTACIONES[sello - 1].nombre}) todavía no está abierta.`);
  if (sb) {
    const { data, error } = await sb.rpc('sellar', { p_codigo: codigo, p_sello: sello, p_token: token, p_clave: clave ?? 'unico' });
    if (error) {
      if (error.message.includes('token_invalido')) throw new Error('Este QR de sello no es válido. Pide uno nuevo al equipo.');
      if (error.message.includes('credencial_no_existe')) throw new Error('No encontramos tu credencial.');
      throw new Error(error.message);
    }
    const r = data as { pasos: number; meta: number; sello_otorgado: boolean; nuevo: boolean };
    if (r.nuevo) publicar('timbre', { sello }, codigo).catch(() => { /* sin red */ });
    return { pasos: r.pasos, meta: r.meta, otorgado: r.sello_otorgado, nuevo: r.nuevo };
  }
  // Modo demo: se acepta cualquier QR de sello (plan B sin conexión) y cada escaneo otorga el timbre.
  const db = leer();
  const c = db[codigo];
  if (!c) throw new Error('No encontramos tu credencial.');
  const nuevo = !c.sellos.includes(sello);
  if (nuevo) { c.sellos = [...c.sellos, sello].sort(); publicar('timbre', { sello }, codigo).catch(() => { /* sin red */ }); }
  escribir(db);
  return { pasos: 1, meta: 1, otorgado: true, nuevo };
}

// ---------- Cacería de afiches (plan 010) ----------
// Cada afiche tiene su código secreto (en su QR y escrito bajo él). Con Supabase lo valida encontrar_afiche()
// (shared/supabase/migraciones/001-afiches.sql) y en `pasos` queda el id del afiche (AF05).
// En modo demo, el secreto del afiche es su id (AF05; sello SDA:AF05) y los pasos quedan en este celular.
export const AFICHE_SELLO = 3;
const META_DEMO = 3;
// sello: el timbre del afiche (3 en la cacería; 4 si es el sello secreto del plan B, plan 009).
export interface ResultadoAfiche extends ResultadoSello { afiche: string; repetido: boolean; sello: number }

export async function encontrarAfiche(codigo: string, secreto: string): Promise<ResultadoAfiche> {
  const limpio = secreto.trim().toUpperCase();
  if (sb) {
    const { data, error } = await sb.rpc('encontrar_afiche', { p_codigo: codigo, p_secreto: limpio });
    if (error) {
      if (error.message.includes('afiche_invalido')) throw new Error('Ese código no es de un afiche de la cacería.');
      if (error.message.includes('credencial_no_existe')) throw new Error('No encontramos tu credencial.');
      if (/encontrar_afiche|function/i.test(error.message)) throw new Error('La cacería de afiches todavía no está abierta.');
      throw new Error(error.message);
    }
    const r = data as { pasos: number; meta: number; sello_otorgado: boolean; nuevo: boolean; afiche: string; repetido: boolean; sello?: number };
    const sello = r.sello ?? AFICHE_SELLO;
    if (r.nuevo) publicar('timbre', { sello }, codigo).catch(() => { /* sin red */ });
    return { pasos: r.pasos, meta: r.meta, otorgado: r.sello_otorgado, nuevo: r.nuevo, afiche: r.afiche, repetido: r.repetido, sello };
  }
  if (!aficheDe(limpio)) throw new Error('Ese código no es de un afiche de la cacería.');
  const db = leer();
  const c = db[codigo];
  if (!c) throw new Error('No encontramos tu credencial.');
  const vistos = c.pasos?.[AFICHE_SELLO] ?? [];
  const repetido = vistos.includes(limpio);
  const pasos = repetido ? vistos : [...vistos, limpio];
  c.pasos = { ...c.pasos, [AFICHE_SELLO]: pasos };
  const nuevo = pasos.length >= META_DEMO && !c.sellos.includes(AFICHE_SELLO);
  if (nuevo) { c.sellos = [...c.sellos, AFICHE_SELLO].sort(); publicar('timbre', { sello: AFICHE_SELLO }, codigo).catch(() => { /* sin red */ }); }
  escribir(db);
  return { pasos: pasos.length, meta: META_DEMO, otorgado: c.sellos.includes(AFICHE_SELLO), nuevo, afiche: limpio, repetido, sello: AFICHE_SELLO };
}

// Lo que muestra la vista Juego: afiches encontrados (en orden), la meta de la cacería y el inventario de
// creación: lo que la persona hizo en cada mesa con su código, según los eventos que publican las mesas (plan 010 §2b).
export interface Creacion { app: string; png?: string; escena?: string; creado: number }
// creacion: experiencias distintas que ya sumaron al timbre 2 (plan 009: 4 distintas).
export interface ProgresoJuego { afiches: string[]; meta: number; creaciones: Record<string, Creacion>; creacion: { pasos: number; meta: number } }
const META_CREACION = 4;

// Cada evento de una mesa con el código de la persona dice en qué experiencia creó algo (y, si la hay, su miniatura).
// 'graffiti' lo acepta la migración 002 (PR amaro/inventario-graffiti); mientras no exista, simplemente no hay filas.
const TIPOS_CREACION: readonly string[] = ['timbre', 'vagon', 'mosaico', 'grabado', 'audio', 'graffiti'];
// El Vagón ya no es una experiencia (plan 009): sus eventos no van al inventario.
const APP_DE: Record<string, string> = { mosaico: 'mosaicos', grabado: 'grabado', audio: 'audioreactiva', graffiti: 'graffiti' };
type FilaEvento = { tipo: string; datos: Record<string, unknown>; creado: number };
export function creacionDe(e: FilaEvento): Creacion | null {
  const d = e.datos || {};
  if (e.tipo === 'timbre') return d.sello === 2 && typeof d.app === 'string' ? { app: d.app, creado: e.creado } : null;
  const app = APP_DE[e.tipo];
  if (!app) return null;
  return { app, creado: e.creado, png: typeof d.png === 'string' ? d.png : undefined, escena: typeof d.escena === 'string' ? d.escena : undefined };
}
// Junta las creaciones por experiencia: queda la más nueva, sin perder la miniatura si la última solo trajo el timbre.
export function sumarCreacion(todas: Record<string, Creacion>, c: Creacion): Record<string, Creacion> {
  const antes = todas[c.app];
  if (antes && antes.creado > c.creado) return { ...todas, [c.app]: { ...c, ...antes, png: antes.png ?? c.png, escena: antes.escena ?? c.escena } };
  return { ...todas, [c.app]: { ...antes, ...c, png: c.png ?? antes?.png, escena: c.escena ?? antes?.escena } };
}
const juntar = (filas: FilaEvento[]) => filas.map(creacionDe).filter((c): c is Creacion => !!c).reduce(sumarCreacion, {} as Record<string, Creacion>);

export async function progresoJuego(codigo: string): Promise<ProgresoJuego> {
  if (sb) {
    const [pasos, metas, eventos] = await Promise.all([
      sb.from('credenciales').select('pasos(sello,clave,creado)').eq('codigo', codigo).maybeSingle(),
      sb.rpc('metas'),
      sb.from('eventos').select('tipo,datos,creado').in('tipo', TIPOS_CREACION).eq('codigo', codigo).order('creado', { ascending: false }).limit(100),
    ]);
    const todos = (pasos.data?.pasos as { sello: number; clave: string; creado: string }[] | undefined) ?? [];
    const filas = todos
      .filter(p => p.sello === AFICHE_SELLO && p.clave !== 'unico')
      .sort((a, b) => a.creado.localeCompare(b.creado));
    // Sin la migración 001 todavía, metas() no existe: la cacería pide 3 (plan 004).
    const lista = metas.data as { id: number; meta: number }[] | null;
    const meta = lista?.find(m => m.id === AFICHE_SELLO)?.meta ?? META_DEMO;
    const metaCreacion = lista?.find(m => m.id === 2)?.meta ?? META_CREACION;
    const ev = ((eventos.data ?? []) as { tipo: string; datos: Record<string, unknown>; creado: string }[]).map(e => ({ ...e, creado: Date.parse(e.creado) }));
    return { afiches: filas.map(p => p.clave), meta, creaciones: juntar(ev), creacion: { pasos: todos.filter(p => p.sello === 2).length, meta: metaCreacion } };
  }
  const c = leer()[codigo];
  const locales: Evento[] = (await Promise.all(TIPOS_CREACION.map(t => recientes(t as Tipo, 200) as Promise<Evento[]>))).flat();
  const creaciones = juntar(locales.filter(e => e.codigo === codigo) as unknown as FilaEvento[]);
  return { afiches: [...(c?.pasos?.[AFICHE_SELLO] ?? [])], meta: META_DEMO, creaciones, creacion: { pasos: Object.keys(creaciones).length, meta: META_CREACION } };
}

// Lo que la persona crea en una mesa llega al momento: Supabase Realtime sobre `eventos` filtrado por su código
// (la tabla ya está en la publicación de Realtime, juego.sql §8). En modo demo, los eventos del mismo navegador.
export function escucharCreaciones(codigo: string, alLlegar: (c: Creacion) => void): () => void {
  if (sb) {
    const canal = sb.channel('inventario-' + codigo)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eventos', filter: `codigo=eq.${codigo}` }, cambio => {
        const f = cambio.new as { tipo: string; datos: Record<string, unknown>; creado: string };
        const c = creacionDe({ ...f, creado: Date.parse(f.creado) || Date.now() });
        if (c) alLlegar(c);
      })
      .subscribe();
    return () => { sb.removeChannel(canal); };
  }
  return escuchar((e: Evento) => {
    if (e.codigo !== codigo) return;
    const c = creacionDe(e as unknown as FilaEvento);
    if (c) alLlegar(c);
  });
}

// Canje del premio con la credencial completa. Con Supabase, el PIN del staff, el stock y el límite diario
// se validan en el servidor (canjear() de shared/supabase/juego.sql); en modo demo, el PIN se valida en el celular.
const ERRORES_CANJE: Record<string, string> = {
  pin_no_configurado: 'El equipo todavía no configuró el PIN del canje.',
  pin_incorrecto: 'PIN incorrecto. Este paso lo hace el equipo de Somos Diseño: pídele que lo escriba.',
  credencial_no_existe: 'No encontramos tu credencial.',
  ya_canjeado: 'Este premio ya fue canjeado.',
  credencial_incompleta: 'Todavía te faltan timbres.',
  sin_stock: 'Se acabaron los premios por ahora. Pregunta al equipo.',
  limite_diario: 'Hoy ya se entregaron todos los premios del día. Vuelve mañana con tu credencial.',
};
export async function canjear(codigo: string, pin: string) {
  if (sb) {
    const { error } = await sb.rpc('canjear', { p_codigo: codigo, p_pin: pin });
    if (error) {
      const clave = Object.keys(ERRORES_CANJE).find(k => error.message.includes(k));
      throw new Error(clave ? ERRORES_CANJE[clave] : error.message);
    }
    return;
  }
  if (!(await verificarPin(pin))) throw new Error(ERRORES_CANJE.pin_incorrecto);
  const db = leer();
  if (!db[codigo]) throw new Error('No encontramos tu credencial.');
  db[codigo].canjeado = true;
  escribir(db);
}

// Avisos: guarda la suscripción Web Push de este celular ligada a la credencial (solo con Supabase).
export async function suscribirPush(codigo: string, endpoint: string, p256dh: string, auth: string) {
  if (!sb) return;
  const { error } = await sb.rpc('suscribir_push', { p_codigo: codigo, p_endpoint: endpoint, p_p256dh: p256dh, p_auth: auth });
  if (error) throw new Error(error.message);
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

// Reinicio de la demo: borra en este celular la credencial, su foto, el avatar y las credenciales locales.
export function reiniciarTodo() {
  try {
    Object.keys(localStorage).filter(k => /^sd:(mia|foto:|avatar:|cred:|credenciales)/.test(k)).forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch { /* sin almacenamiento */ }
  memoria = {};
  for (const k of Object.keys(fotosEnMemoria)) delete fotosEnMemoria[k];
}

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
