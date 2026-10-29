// Quiénes están en la estación. Hoy: 40 personas de prueba y eventos simulados.
// Después: la vista `galeria` de Supabase (credencial/supabase/schema.sql) con tiempo real.

export type Lenguaje = 'Pixel' | 'Geométrica' | 'Orgánica';
export interface Persona {
  codigo: string;
  nombre: string;
  lenguaje: Lenguaje; // el del marco de su credencial: define el cuerpo
  cabeza: { tipo: 'personaje'; id: 'pixel' | 'geometrica' | 'organica' } | { tipo: 'foto'; color: string };
  timbres: number; // 0..4
}
export type Evento =
  | { tipo: 'llega'; persona: Persona }
  | { tipo: 'timbre'; codigo: string; timbres: number };

const NOMBRES = ['Ana', 'Pipe', 'Cata', 'Benja', 'Josefa', 'Tomás', 'Valen', 'Nico', 'Isi', 'Matías', 'Fran', 'Diego', 'Antonia', 'Seba',
  'Coni', 'Joaquín', 'Martina', 'Lucas', 'Emilia', 'Vicente', 'Javi', 'Agus', 'Flo', 'Gaspar', 'Rocío', 'Bruno', 'Amanda', 'Cristóbal',
  'Trini', 'Maite', 'Ignacio', 'Pía', 'Simón', 'Dani', 'Renata', 'Ale', 'Clemente', 'Sofía', 'Max', 'Belén', 'Elisa', 'Pablo', 'Leo', 'Carla'];
const LENGUAJES: Lenguaje[] = ['Pixel', 'Geométrica', 'Orgánica'];
const PERSONAJE = { Pixel: 'pixel', Geométrica: 'geometrica', Orgánica: 'organica' } as const;
// Las «fotos» de prueba son círculos de color de la paleta Línea azul.
const COLORES_FOTO = ['#0062B8', '#2B4BD8', '#7FC8F8', '#FFC20E', '#00A651', '#FF8FB1', '#7A2E8E'];

// Azar con semilla: la misma población en cada carga (sirve para revisar y comparar capturas).
export function azar(semilla: number) {
  let s = semilla >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

let siguiente = 0;
function persona(r: () => number, timbres: number): Persona {
  const lenguaje = LENGUAJES[Math.floor(r() * 3)];
  const nombre = NOMBRES[siguiente % NOMBRES.length];
  const codigo = 'SD-' + (10000 + siguiente++).toString(36).toUpperCase();
  const cabeza: Persona['cabeza'] = r() < 0.55 ? { tipo: 'personaje', id: PERSONAJE[lenguaje] } : { tipo: 'foto', color: COLORES_FOTO[Math.floor(r() * COLORES_FOTO.length)] };
  return { codigo, nombre, lenguaje, cabeza, timbres };
}

export function poblacionDePrueba(n = 40, semilla = 7): Persona[] {
  const r = azar(semilla);
  // Más gente en los primeros timbres, como en el evento: pocos completan los 4.
  const reparto = [0.08, 0.32, 0.28, 0.2, 0.12];
  return Array.from({ length: n }, () => {
    let u = r(), t = 0;
    while (t < 4 && u > reparto[t]) { u -= reparto[t]; t++; }
    return persona(r, Math.max(1, t));
  });
}

// Eventos simulados: alguien consigue un timbre o llega una persona nueva en el próximo tren.
export function simularEventos(lista: () => Persona[], alEvento: (e: Evento) => void, cadaMs = 5000, semilla = 11) {
  const r = azar(semilla);
  const id = window.setInterval(() => {
    const gente = lista();
    if (r() < 0.25 || gente.length === 0) { alEvento({ tipo: 'llega', persona: persona(r, 1) }); return; }
    const pendientes = gente.filter(p => p.timbres < 4);
    if (!pendientes.length) return;
    const p = pendientes[Math.floor(r() * pendientes.length)];
    alEvento({ tipo: 'timbre', codigo: p.codigo, timbres: p.timbres + 1 });
  }, cadaMs);
  return () => clearInterval(id);
}
