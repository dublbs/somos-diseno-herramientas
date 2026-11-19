import { abrirSesionMesa, cabeceras, publicar, remoto, sellarRemoto, URL_SB, type Avance } from './datos';

// Modo juego de la credencial (plan 005, bloque D): lo común a las mesas (tablets) y a la credencial (celular).
// Nada secreto vive en el repo: el PIN del staff se guarda como hash en la configuración local de cada equipo
// (pantalla ?staff) o llega por la variable de entorno VITE_STAFF_PIN_SHA256 al compilar. Sin ninguno, el PIN
// de demo es 0000 y la interfaz lo dice.

// Los 4 timbres finales (plan 009 y plan 012 §8): Inscripción, Creación (4 experiencias distintas), Cacería (3 afiches)
// y Flyer (armas tu flyer en la credencial con lo que juntaste; de respaldo, el sello del staff).
// `como` se lee en el álbum de la credencial (texto chico): frases cortas, en segunda persona (plan 010).
export interface Estacion { n: number; nombre: string; como: string; activa: boolean }
export const ESTACIONES: Estacion[] = [
  { n: 1, nombre: 'Inscripción', como: 'Al crear tu credencial', activa: true },
  { n: 2, nombre: 'Creación', como: 'Crea en 4 experiencias', activa: true },
  { n: 3, nombre: 'Cacería', como: 'Encuentra 3 afiches', activa: true },
  { n: 4, nombre: 'Flyer', como: 'Arma tu flyer', activa: true },
];
export const ACTIVAS = ESTACIONES.filter(e => e.activa).map(e => e.n);
export const completa = (sellos: number[]) => ACTIVAS.every(n => sellos.includes(n));

// Los códigos viejos de Supabase eran hexadecimales (0-9 y A-F); desde la migración 011 usan A-Z y 2-9 sin O ni I.
// La regla acepta todos, igual que el check de la base (^SD-[A-Z0-9]{5}$).
export const CODIGO = /^SD-[A-Z0-9]{5}$/;
export const normalizarCodigo = (c: string) => {
  const t = c.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return t.startsWith('SD') ? 'SD-' + t.slice(2, 7) : 'SD-' + t.slice(0, 5);
};

// ---------- configuración de la mesa ----------
// Desde el plan 015 la manda el PC madre: modo juego, código de la estación 2 (desde la base) y reinicios. Se lee con
// config_mesas() (migración 008) y se guarda en el equipo para seguir sin red. La configuración local (?staff) es el
// respaldo: sin Supabase o sin la migración manda ella; con `manual`, el staff la impuso en esta tablet.
export interface ConfigMesa { modoJuego: boolean; pinHash?: string; token2: string; manual?: boolean }
export interface ConfigRemota { modoJuego: boolean; token2: string; reinicio: string | null; reinicioMesa: string | null; hayPin: boolean }
const LLAVE_CONFIG = 'sd:config-mesa';
const LLAVE_REMOTA = 'sd:config-remota';
function leerLocal(): ConfigMesa {
  try { return { modoJuego: false, token2: 'DEMO', ...JSON.parse(localStorage.getItem(LLAVE_CONFIG) || '{}') }; }
  catch { return { modoJuego: false, token2: 'DEMO' }; }
}
export function configRemota(): ConfigRemota | null {
  try { return JSON.parse(localStorage.getItem(LLAVE_REMOTA) || 'null'); } catch { return null; }
}
export function leerConfig(): ConfigMesa {
  const local = leerLocal(), pc = configRemota();
  if (!pc || local.manual) return local;
  return { ...local, modoJuego: pc.modoJuego, token2: pc.token2 || local.token2 };
}
export function guardarConfig(c: ConfigMesa) { try { localStorage.setItem(LLAVE_CONFIG, JSON.stringify(c)); } catch { /* sin almacenamiento */ } }
// Lo que manda el PC madre. null sin Supabase, sin red o sin la migración 008 (la tablet sigue con lo guardado).
export async function traerConfigRemota(): Promise<ConfigRemota | null> {
  if (!remoto) return null;
  try {
    const r = await fetch(`${URL_SB}/rest/v1/rpc/config_mesas`, { method: 'POST', headers: cabeceras(), body: JSON.stringify({ p_mesa: idMesa() }) });
    if (!r.ok) return null;
    const d = await r.json() as { modo_juego?: boolean; token2?: string | null; reinicio?: string | null; reinicio_mesa?: string | null; hay_pin?: boolean };
    const c: ConfigRemota = { modoJuego: !!d.modo_juego, token2: d.token2 ?? '', reinicio: d.reinicio ?? null, reinicioMesa: d.reinicio_mesa ?? null, hayPin: !!d.hay_pin };
    try { localStorage.setItem(LLAVE_REMOTA, JSON.stringify(c)); } catch { /* sin almacenamiento */ }
    return c;
  } catch { return null; }
}
// ¿El PC madre pidió reiniciar esta mesa después de que empezó la sesión de esta pestaña?
const LLAVE_DESDE = 'sd:mesa-desde';
export function desdeSesion(): number {
  try {
    const v = Number(sessionStorage.getItem(LLAVE_DESDE));
    if (v) return v;
    const ahora = Date.now(); sessionStorage.setItem(LLAVE_DESDE, String(ahora)); return ahora;
  } catch { return Date.now(); }
}
export function pideReinicio(c: ConfigRemota): boolean {
  const desde = desdeSesion();
  return [c.reinicio, c.reinicioMesa].some(t => !!t && Date.parse(t) > desde);
}

async function sha256(t: string): Promise<string> {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
export const hashPin = (pin: string) => sha256('somos-diseno:' + pin);
const PIN_ENV = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_STAFF_PIN_SHA256;
export const pinDeDemo = () => !PIN_ENV && !leerConfig().pinHash && !configRemota()?.hayPin;
export async function verificarPin(pin: string): Promise<boolean> {
  // Con el PC madre: el mismo PIN del canje (verificar_pin_staff, migración 008). Si no responde, el PIN local.
  if (remoto && configRemota()?.hayPin) {
    try {
      const r = await fetch(`${URL_SB}/rest/v1/rpc/verificar_pin_staff`, { method: 'POST', headers: cabeceras(), body: JSON.stringify({ p_pin: pin }) });
      if (r.ok) return (await r.json()) === true;
    } catch { /* sin red: sigue con el PIN local */ }
  }
  const esperado = PIN_ENV || leerConfig().pinHash;
  // Si el PC madre tiene PIN, sin red no vale el 0000 de demo: solo un PIN local que el staff haya puesto en la tablet.
  if (!esperado && configRemota()?.hayPin) return false;
  if (!esperado) return pin === '0000';
  try { return (await hashPin(pin)) === esperado; } catch { return false; }
}

// ---------- la persona que juega en esta mesa (dura la sesión; el quiosco la borra) ----------
// Plan 016 (excepción): la credencial abre el Fotomatón en el celular con ?codigo=SD-XXXXX&desde=credencial.
// La persona entra ya con su código y la flecha «volver» la lleva de vuelta a su credencial (no al menú de las tablets).
const LLAVE_VOLVER = 'sd:volver';
export function codigoDesdeUrl(app: string): string | null {
  const q = new URLSearchParams(location.search);
  const c = (q.get('codigo') || '').trim().toUpperCase();
  if (!CODIGO.test(c)) return null;
  entrarJugador(c, app);
  try { if (q.get('desde') === 'credencial') sessionStorage.setItem(LLAVE_VOLVER, '../../credencial/dist/#/juego'); } catch { /* nada */ }
  q.delete('codigo'); q.delete('desde');
  try { history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash); } catch { /* nada */ }
  return c;
}
export const volverA = (porDefecto: string) => { try { return sessionStorage.getItem(LLAVE_VOLVER) || porDefecto; } catch { return porDefecto; } };
const LLAVE_JUGADOR = 'sd:jugador';
// `ganado`: las experiencias de esta mesa que ya sumaron su paso al timbre 2 (una mesa puede tener varias).
export function jugador(): { codigo: string; ganado: string[] } | null {
  try {
    const j = JSON.parse(sessionStorage.getItem(LLAVE_JUGADOR) || 'null');
    return j ? { codigo: j.codigo, ganado: Array.isArray(j.ganado) ? j.ganado : [] } : null;
  } catch { return null; }
}
export function entrarJugador(codigo: string, app = 'mesa') {
  try { sessionStorage.setItem(LLAVE_JUGADOR, JSON.stringify({ codigo, ganado: [] })); } catch { /* nada */ }
  abrirSesionMesa(idMesa(), app, codigo);
  // Si la persona ya había exportado antes de asociarse (escaneó el QR después), esa creación suma ahora.
  const previas = creadasSinJugador();
  try { sessionStorage.removeItem(LLAVE_CREADAS); } catch { /* nada */ }
  previas.forEach(a => otorgarCreacion(a));
}
// Lo exportado en esta sesión antes de que hubiera una credencial asociada (dura la sesión, como el jugador).
const LLAVE_CREADAS = 'sd:creadas-sin-jugador';
function creadasSinJugador(): string[] { try { const v = JSON.parse(sessionStorage.getItem(LLAVE_CREADAS) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } }

// ¿Existe esta credencial? true / false, o null si no se pudo preguntar (sin red o sin Supabase: se deja jugar).
export async function existeCredencial(codigo: string): Promise<boolean | null> {
  if (!remoto) return null;
  try {
    const r = await fetch(`${URL_SB}/rest/v1/credenciales?select=codigo&codigo=eq.${encodeURIComponent(codigo)}`, { headers: cabeceras() });
    if (!r.ok) return null;
    const filas = await r.json();
    return Array.isArray(filas) ? filas.length > 0 : null;
  } catch { return null; }
}
// ---------- Jugar con QR (plan 014): la tablet muestra un QR y la credencial lo escanea ----------
// El QR lleva la mesa y un número de un solo uso; la tablet pregunta a la base hasta que alguien lo escanea.
export const nuevoNonce = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
export const enlaceJugar = (app: string, nonce: string) =>
  new URL(`../../credencial/dist/#/mesa?m=${idMesa()}&n=${nonce}&a=${encodeURIComponent(app)}`, location.href).href;
export async function leerEmparejamiento(nonce: string): Promise<string | null> {
  if (!remoto) return null;
  try {
    const r = await fetch(`${URL_SB}/rest/v1/rpc/leer_emparejamiento`, { method: 'POST', headers: cabeceras(), body: JSON.stringify({ p_mesa: idMesa(), p_nonce: nonce }) });
    if (!r.ok) return null;
    const c = await r.json();
    return typeof c === 'string' && CODIGO.test(c) ? c : null;
  } catch { return null; }
}
// Jugar sin credencial (plan 011): la persona juega y se lleva su creación por QR, sin timbres. Dura la sesión, como el
// código: el quiosco la borra y la mesa vuelve a preguntar.
const LLAVE_SIN = 'sd:sin-credencial';
export const sinCredencial = () => { try { return sessionStorage.getItem(LLAVE_SIN) === '1'; } catch { return false; } };
export function entrarSinCredencial() { try { sessionStorage.setItem(LLAVE_SIN, '1'); } catch { /* nada */ } }
// Identificador de esta tablet para el PC madre: 4 letras que se generan una vez y quedan en el equipo.
export function idMesa(): string {
  try {
    const v = localStorage.getItem('sd:mesa');
    if (v) return v;
    const n = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
    localStorage.setItem('sd:mesa', n);
    return n;
  } catch { return 'MESA'; }
}

// Las apps llaman a esto al exportar o enviar su creación. Si hay modo juego y una persona con credencial, esa
// experiencia suma su paso al timbre 2 (una vez por sesión y por experiencia; con 4 distintas cae el timbre): se publica
// para el HUB y el inventario (shared/datos.ts) y se muestra el aviso con el código.
export const EVENTO_TIMBRE = 'sd:timbre-ganado';
// avance: lo que respondió la base (null sin Supabase o si falló: la persona timbra a mano con el código de la estación 2).
export interface DetalleCreacion { codigo: string; avance: Avance | null }
export function otorgarCreacion(app: string) {
  const j = jugador();
  if (!j) {
    // Sin credencial todavía: se recuerda por si la persona escanea el QR para jugar después de exportar.
    const v = creadasSinJugador();
    if (!v.includes(app)) try { sessionStorage.setItem(LLAVE_CREADAS, JSON.stringify([...v, app])); } catch { /* nada */ }
    return;
  }
  if (j.ganado.includes(app)) return;
  marcarGanado(app, true);
  const avisar = (avance: Avance | null) => window.dispatchEvent(new CustomEvent<DetalleCreacion>(EVENTO_TIMBRE, { detail: { codigo: j.codigo, avance } }));
  if (!remoto) { publicar('timbre', { sello: 2, app }, j.codigo).catch(() => { /* nada */ }); avisar(null); return; }
  // Con Supabase la credencial queda timbrada al tiro. El HUB recibe el timbre solo si la base lo aceptó; si falló
  // (sin red, código o token malos), la experiencia no queda como ganada y la próxima exportación lo vuelve a intentar.
  sellarRemoto(j.codigo, 2, leerConfig().token2, app).then(avance => {
    if (avance) publicar('timbre', { sello: 2, app }, j.codigo).catch(() => { /* nada */ });
    else marcarGanado(app, false);
    avisar(avance);
  });
}
function marcarGanado(app: string, si: boolean) {
  const j = jugador();
  if (!j) return;
  const ganado = si ? [...new Set([...j.ganado, app])] : j.ganado.filter(a => a !== app);
  try { sessionStorage.setItem(LLAVE_JUGADOR, JSON.stringify({ ...j, ganado })); } catch { /* sin almacenamiento */ }
}
