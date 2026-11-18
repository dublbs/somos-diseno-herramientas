import { escuchar, recientes, type Evento, type Tipo } from '../../../shared/datos';

// Modo galería (plan 014 §3, R3): las creaciones que llegan por shared/datos.ts, ya listas para mostrar con <img>.
// Sin canvas ni animación: lo que se ve en la pantalla Flip si el HUB no anda.

export type Clase = 'mosaico' | 'grabado' | 'graffiti' | 'juego' | 'foto' | 'credencial';
export interface Pieza {
  id: string;
  clase: Clase;
  src?: string; // PNG (data URL o URL); las credenciales no traen
  codigo: string | null;
  autor: string | null; // nombre de la persona si se sabe (por la credencial)
  creado: number;
  ejemplo?: boolean;
  lenguaje?: 'Pixel' | 'Geométrica' | 'Orgánica'; // credencial
  personaje?: string; // credencial
}

export const CREACIONES: Clase[] = ['mosaico', 'grabado', 'graffiti', 'juego', 'foto'];
export const NOMBRE_CLASE: Record<Clase, string> = {
  mosaico: 'Taller de Mosaicos', grabado: 'Taller de Grabado', graffiti: 'Graffiti y Tags', juego: 'Hora punta', foto: 'Fotomatón CMYK', credencial: 'Credencial',
};

// Para las tarjetas chicas.
export const NOMBRE_CORTO: Record<Clase, string> = { mosaico: 'Mosaicos', grabado: 'Grabado', graffiti: 'Graffiti', juego: 'Hora punta', foto: 'Fotomatón', credencial: 'Credencial' };

const MAX = 40;

export interface Galeria { piezas: Pieza[]; personas: Pieza[] } // lo más nuevo primero

// Conecta la galería: carga lo reciente y avisa cada vez que cambia. Devuelve la función para desconectar.
export function conectarGaleria(alCambiar: (g: Galeria) => void): () => void {
  const nombres = new Map<string, string>();
  let piezas: Pieza[] = [], personas: Pieza[] = [], vivo = true;
  const nombre = (codigo: string | null) => (codigo ? nombres.get(codigo) || null : null);
  const avisar = () => { if (vivo) alCambiar({ piezas: piezas.slice(), personas: personas.slice() }); };

  const aPieza = (e: Evento): Pieza | null => {
    if (e.tipo === 'credencial') {
      const d = (e as Evento<'credencial'>).datos;
      if (e.codigo && d && d.nombre) nombres.set(e.codigo, d.nombre);
      return { id: e.id, clase: 'credencial', codigo: e.codigo, autor: d ? d.nombre : null, creado: e.creado, lenguaje: d ? d.lenguaje : undefined, personaje: d ? d.personaje : undefined };
    }
    if (CREACIONES.indexOf(e.tipo as Clase) < 0) return null;
    const d = e.datos as { png?: string };
    if (!d || typeof d.png !== 'string' || !d.png) return null;
    return { id: e.id, clase: e.tipo as Clase, src: d.png, codigo: e.codigo, autor: nombre(e.codigo), creado: e.creado };
  };
  // Lo más nuevo adelante, sin repetir (una credencial editada reemplaza a la anterior de la misma persona).
  const meter = (lista: Pieza[], p: Pieza) => (lista.some(x => x.id === p.id) ? lista
    : [p].concat(lista.filter(x => !(p.clase === 'credencial' && p.codigo && x.codigo === p.codigo))).slice(0, MAX));
  // Si llega una credencial después de su creación, se le pone nombre a lo que ya estaba.
  const nombrar = () => { piezas = piezas.map(p => (p.autor || !p.codigo || !nombres.has(p.codigo) ? p : Object.assign({}, p, { autor: nombres.get(p.codigo) }))); };

  const tipos: Tipo[] = ['credencial', 'mosaico', 'grabado', 'graffiti', 'juego', 'foto'];
  let desconectar = () => {};
  Promise.all(tipos.map(t => recientes(t, t === 'credencial' ? 80 : 12).catch(() => [] as Evento[]))).then(listas => {
    if (!vivo) return;
    const [cred] = listas;
    cred.slice().reverse().forEach(e => { const p = aPieza(e); if (p) personas = meter(personas, p); });
    const todas: Pieza[] = [];
    listas.slice(1).forEach(l => l.forEach(e => { const p = aPieza(e); if (p) todas.push(p); }));
    piezas = todas.sort((a, b) => b.creado - a.creado).slice(0, MAX);
    avisar();
    desconectar = escuchar(e => {
      const p = aPieza(e);
      if (!p) return;
      if (p.clase === 'credencial') { personas = meter(personas, p); nombrar(); } else piezas = meter(piezas, p);
      avisar();
    });
  });
  return () => { vivo = false; desconectar(); };
}
