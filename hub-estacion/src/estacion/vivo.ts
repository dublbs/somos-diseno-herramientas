import { escuchar, recientes, type Evento as EventoDatos, type Tipo } from '../../../shared/datos';
import { CREACIONES, type Clase, type Pieza } from '../galeria/piezas';
import type { Evento, Persona } from './fuente';

// El HUB en vivo: lo que llega por la capa de datos (shared/datos.ts) desde las experiencias y las credenciales.
//   Pixel → los trenes pasan por el andén, sin rayados (plan 009, D3) · Geométrica → cuadros de la mezanina con las
//   obras de la gente (mosaico, grabado, graffiti, Hora punta y Fotomatón) · Orgánica → banderines con los grabados
//   · y las personas con sus timbres.
// Las imágenes se cargan una sola vez aquí, para que la escena solo las dibuje.

const cargar = (src: string) => { const im = new Image(); im.src = src; return im; };
export const listaImagen = (im: HTMLImageElement | null | undefined): im is HTMLImageElement => !!im && im.complete && im.naturalWidth > 0;

export type ClaseObra = Exclude<Clase, 'credencial'>;
export interface Obra {
  id: string;
  clase: ClaseObra;
  im: HTMLImageElement;
  codigo: string | null;
  nueva: boolean; // llegó con el HUB abierto: entra al muro al tiro
  ejemplo?: boolean; // solo con personas de prueba
  autor?: string; // solo los ejemplos; el de las reales sale de la credencial (autorDe)
}
const MAX_OBRAS = 20;

export const enVivo = {
  obras: [] as Obra[], // el más nuevo primero
  ejemplos: [] as Obra[], // relleno del muro con personas de prueba (?prueba=0 no los carga)
  grabados: [] as HTMLImageElement[],
  fotos: new Map<string, HTMLImageElement>(), // codigo → miniatura de la cara (solo con consentimiento)
};
const nombres = new Map<string, string>();
const sellos = new Map<string, Set<number>>();
// El nombre se busca al dibujar: la credencial puede llegar antes o después que la obra.
export const autorDe = (o: Obra): string | null => (o.ejemplo ? o.autor || null : o.codigo ? nombres.get(o.codigo) || null : null);

const esObra = (t: Tipo): t is ClaseObra => CREACIONES.indexOf(t as Clase) >= 0;

export function cargarEjemplos(piezas: Pieza[]) {
  enVivo.ejemplos = piezas.filter(p => p.src && esObra(p.clase as Tipo)).map(p => ({
    id: p.id, clase: p.clase as ClaseObra, im: cargar(p.src!), codigo: null, nueva: false, ejemplo: true, autor: p.autor || undefined,
  }));
}

export async function conectar(alEvento: (e: Evento) => void, existe: (codigo: string) => boolean): Promise<() => void> {
  const aplicar = (e: EventoDatos, inicial = false) => {
    if (esObra(e.tipo)) {
      const d = e.datos as { png?: string } | null, png = d ? d.png : undefined;
      if (typeof png !== 'string' || !png || enVivo.obras.some(o => o.id === e.id)) return;
      const im = cargar(png);
      enVivo.obras.unshift({ id: e.id, clase: e.tipo, im, codigo: e.codigo, nueva: !inicial });
      enVivo.obras.length = Math.min(enVivo.obras.length, MAX_OBRAS);
      if (e.tipo === 'grabado') { enVivo.grabados.unshift(im); enVivo.grabados.length = Math.min(enVivo.grabados.length, 6); }
    }
    else if (e.tipo === 'timbre' && e.codigo) {
      const s = sellos.get(e.codigo) ?? new Set<number>(); s.add((e as EventoDatos<'timbre'>).datos.sello); sellos.set(e.codigo, s);
      if (!inicial && existe(e.codigo)) alEvento({ tipo: 'timbre', codigo: e.codigo, timbres: s.size });
    } else if (e.tipo === 'credencial' && e.codigo) {
      const d = (e as EventoDatos<'credencial'>).datos;
      nombres.set(e.codigo, d.nombre);
      if (d.foto) enVivo.fotos.set(e.codigo, cargar(d.foto)); else enVivo.fotos.delete(e.codigo);
      if (existe(e.codigo)) return;
      const p: Persona = {
        codigo: e.codigo, nombre: d.nombre, lenguaje: d.lenguaje,
        cabeza: d.foto ? { tipo: 'foto', color: '#2B4BD8', codigo: e.codigo } : { tipo: 'personaje', id: d.personaje as 'pixel' | 'geometrica' | 'organica' },
        timbres: Math.max(1, sellos.get(e.codigo)?.size ?? 1),
      };
      alEvento({ tipo: 'llega', persona: p });
    }
  };
  // Lo que ya pasó (del más viejo al más nuevo), y después lo que vaya llegando.
  const obras = CREACIONES.filter(esObra);
  const nada = () => [] as EventoDatos[];
  const [cred, tim, ...listas] = await Promise.all([
    recientes('credencial', 60).catch(nada), recientes('timbre', 200).catch(nada),
    ...obras.map(t => recientes(t, 12).catch(nada)),
  ]);
  tim.slice().reverse().forEach(e => aplicar(e, true));
  // Las obras de todas las experiencias, ordenadas por fecha: las más nuevas quedan adelante.
  ([] as EventoDatos[]).concat(...listas).sort((a, b) => a.creado - b.creado).forEach(e => aplicar(e, true));
  [...cred].reverse().forEach(e => aplicar(e));
  return escuchar(e => aplicar(e));
}
