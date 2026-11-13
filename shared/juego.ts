import { abrirSesionMesa, publicar, remoto, sellarRemoto, type Avance } from './datos';

// Modo juego de la credencial (plan 005, bloque D): lo común a las mesas (tablets) y a la credencial (celular).
// Nada secreto vive en el repo: el PIN del staff se guarda como hash en la configuración local de cada equipo
// (pantalla ?staff) o llega por la variable de entorno VITE_STAFF_PIN_SHA256 al compilar. Sin ninguno, el PIN
// de demo es 0000 y la interfaz lo dice.

// Los 4 timbres finales (plan 009): Inscripción, Creación (4 experiencias distintas), Cacería (3 afiches) y Secreto
// (el jefe final o su plan B).
// `como` se lee en el álbum de la credencial (texto chico): frases cortas, en segunda persona (plan 010).
export interface Estacion { n: number; nombre: string; como: string; activa: boolean }
export const ESTACIONES: Estacion[] = [
  { n: 1, nombre: 'Inscripción', como: 'Al crear tu credencial', activa: true },
  { n: 2, nombre: 'Creación', como: 'Crea en 4 experiencias', activa: true },
  { n: 3, nombre: 'Cacería', como: 'Encuentra 3 afiches', activa: true },
  { n: 4, nombre: 'Secreto', como: '???', activa: true },
];
export const ACTIVAS = ESTACIONES.filter(e => e.activa).map(e => e.n);
export const completa = (sellos: number[]) => ACTIVAS.every(n => sellos.includes(n));

export const CODIGO = /^SD-[A-Z2-9]{5}$/;
export const normalizarCodigo = (c: string) => {
  const t = c.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return t.startsWith('SD') ? 'SD-' + t.slice(2, 7) : 'SD-' + t.slice(0, 5);
};

// ---------- configuración de la mesa (solo en este equipo) ----------
export interface ConfigMesa { modoJuego: boolean; pinHash?: string; token2: string }
const LLAVE_CONFIG = 'sd:config-mesa';
export function leerConfig(): ConfigMesa {
  try { return { modoJuego: false, token2: 'DEMO', ...JSON.parse(localStorage.getItem(LLAVE_CONFIG) || '{}') }; }
  catch { return { modoJuego: false, token2: 'DEMO' }; }
}
export function guardarConfig(c: ConfigMesa) { try { localStorage.setItem(LLAVE_CONFIG, JSON.stringify(c)); } catch { /* sin almacenamiento */ } }

async function sha256(t: string): Promise<string> {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
export const hashPin = (pin: string) => sha256('somos-diseno:' + pin);
const PIN_ENV = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_STAFF_PIN_SHA256;
export const pinDeDemo = () => !PIN_ENV && !leerConfig().pinHash;
export async function verificarPin(pin: string): Promise<boolean> {
  const esperado = PIN_ENV || leerConfig().pinHash;
  if (!esperado) return pin === '0000';
  try { return (await hashPin(pin)) === esperado; } catch { return false; }
}

// ---------- la persona que juega en esta mesa (dura la sesión; el quiosco la borra) ----------
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
}
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
  if (!leerConfig().modoJuego || !j || j.ganado.includes(app)) return;
  try { sessionStorage.setItem(LLAVE_JUGADOR, JSON.stringify({ ...j, ganado: [...j.ganado, app] })); } catch { /* sin almacenamiento */ }
  publicar('timbre', { sello: 2, app }, j.codigo).catch(() => { /* queda el código para timbrar a mano */ });
  // Con Supabase la credencial queda timbrada al tiro; si falla (o sin conexión), la persona usa el código.
  const directo = remoto ? sellarRemoto(j.codigo, 2, leerConfig().token2, app) : Promise.resolve(null);
  directo.then(avance => window.dispatchEvent(new CustomEvent<DetalleCreacion>(EVENTO_TIMBRE, { detail: { codigo: j.codigo, avance } })));
}
