import { escuchar, recientes, type Evento as EventoDatos } from '../../../shared/datos';
import type { Evento, Persona } from './fuente';

// El HUB en vivo: lo que llega por la capa de datos (shared/datos.ts) desde las experiencias y las credenciales.
//   Pixel → el vagón de la gente pasa por el andén · Geométrica → paneles MetroArte con los mosaicos
//   Orgánica → banderines con los grabados · y las personas con sus timbres.
// Las imágenes se guardan ya cargadas para que la escena solo las dibuje.

const cargar = (src: string) => { const im = new Image(); im.src = src; return im; };
export const listaImagen = (im: HTMLImageElement | null | undefined): im is HTMLImageElement => !!im && im.complete && im.naturalWidth > 0;

export const enVivo = {
  vagon: null as HTMLImageElement | null,
  mosaicos: [] as { im: HTMLImageElement; autor: string }[], // el más nuevo primero
  grabados: [] as HTMLImageElement[],
  fotos: new Map<string, HTMLImageElement>(), // codigo → miniatura de la cara (solo con consentimiento)
};
const nombres = new Map<string, string>();
const sellos = new Map<string, Set<number>>();
const autor = (codigo: string | null) => (codigo ? nombres.get(codigo) ?? codigo : 'alguien de la Semana del Diseño');

export async function conectar(alEvento: (e: Evento) => void, existe: (codigo: string) => boolean): Promise<() => void> {
  const aplicar = (e: EventoDatos, inicial = false) => {
    if (e.tipo === 'vagon') enVivo.vagon = cargar((e as EventoDatos<'vagon'>).datos.png);
    else if (e.tipo === 'mosaico') { enVivo.mosaicos.unshift({ im: cargar((e as EventoDatos<'mosaico'>).datos.png), autor: autor(e.codigo) }); enVivo.mosaicos.length = Math.min(enVivo.mosaicos.length, 12); }
    else if (e.tipo === 'grabado') { enVivo.grabados.unshift(cargar((e as EventoDatos<'grabado'>).datos.png)); enVivo.grabados.length = Math.min(enVivo.grabados.length, 6); }
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
  const [cred, tim, vag, mos, gra] = await Promise.all([recientes('credencial', 60), recientes('timbre', 200), recientes('vagon', 1), recientes('mosaico', 12), recientes('grabado', 6)]);
  [...tim, ...vag, ...mos, ...gra].reverse().forEach(e => aplicar(e, true));
  [...cred].reverse().forEach(e => aplicar(e));
  return escuchar(e => aplicar(e));
}
