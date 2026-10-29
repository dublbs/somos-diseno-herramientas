// Modo juego de la credencial (plan 005, bloque D): lo común a las mesas (tablets) y a la credencial (celular).
// Nada secreto vive en el repo: el PIN del staff se guarda como hash en la configuración local de cada equipo
// (pantalla ?staff) o llega por la variable de entorno VITE_STAFF_PIN_SHA256 al compilar. Sin ninguno, el PIN
// de demo es 0000 y la interfaz lo dice.

// Las 4 estaciones de timbres: qué otorga cada una. La 4 queda apagada hasta que se decida el hallazgo 3D.
export interface Estacion { n: number; nombre: string; como: string; activa: boolean }
export const ESTACIONES: Estacion[] = [
  { n: 1, nombre: 'Inscripción', como: 'Al crear tu credencial', activa: true },
  { n: 2, nombre: 'Creación', como: 'Crea algo en una mesa y mándalo al HUB', activa: true },
  { n: 3, nombre: 'Portales', como: 'Escanea los afiches de los portales AR', activa: true },
  { n: 4, nombre: 'Hallazgo 3D', como: 'Muy pronto', activa: false },
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
export function jugador(): { codigo: string; ganado: boolean } | null {
  try { return JSON.parse(sessionStorage.getItem(LLAVE_JUGADOR) || 'null'); } catch { return null; }
}
export function entrarJugador(codigo: string) { try { sessionStorage.setItem(LLAVE_JUGADOR, JSON.stringify({ codigo, ganado: false })); } catch { /* nada */ } }

// Las apps llaman a esto al exportar o enviar su creación. Si hay modo juego y una persona con credencial, gana
// el timbre 2 (una vez por sesión): queda anotado para el HUB y se muestra el aviso con el código para timbrar.
export const EVENTO_TIMBRE = 'sd:timbre-ganado';
export function otorgarCreacion(app: string) {
  const j = jugador();
  if (!leerConfig().modoJuego || !j || j.ganado) return;
  try {
    sessionStorage.setItem(LLAVE_JUGADOR, JSON.stringify({ ...j, ganado: true }));
    const lista = JSON.parse(localStorage.getItem('sd:timbres-mesa') || '[]');
    lista.push({ codigo: j.codigo, sello: 2, app, ts: Date.now() });
    localStorage.setItem('sd:timbres-mesa', JSON.stringify(lista.slice(-200)));
  } catch { /* sin almacenamiento */ }
  window.dispatchEvent(new CustomEvent(EVENTO_TIMBRE, { detail: { codigo: j.codigo } }));
}
