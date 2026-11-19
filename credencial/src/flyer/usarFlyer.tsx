import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fotoDe, type ProgresoJuego } from '../lib/store';
import { useImagenes } from '../lib/imagenes';
import { aficheDe } from '../lib/afiches';
import type { DatosCarta } from '../pixel/render';
import { PERSONAJES, personajeDe } from '../temas';
import { EXPERIENCIAS } from '../pages/Juego';
import { cargarFuentes, FLYER, FRASES, pintarFlyer, semillaNueva, type DatosFlyer, type PiezaFlyer } from './componer';
import { porId, VISUALES, type Visual } from '../../../shared/marcos';

// La elección del flyer (lenguaje, piezas, frase y semilla) y los datos que se pintan, compartidos por la pantalla
// «Tu flyer» y la miniatura de la vista Juego (B-016): las dos usan pintarFlyer con la misma elección guardada,
// así lo que se ve antes es lo que se descarga.
export const MAX_CREACIONES = 3;
export interface Eleccion { lenguaje: Visual; creaciones: string[]; afiche: string; frase: string; semilla: number }
const llave = (codigo: string) => 'sd:flyer:' + codigo;
function leerEleccion(codigo: string): Partial<Eleccion> {
  try { return JSON.parse(localStorage.getItem(llave(codigo)) || '{}'); } catch { return {}; }
}
export function guardarEleccion(codigo: string, e: Eleccion) {
  try { localStorage.setItem(llave(codigo), JSON.stringify(e)); } catch { /* sin almacenamiento */ }
}
export const nombreApp = (app: string) => EXPERIENCIAS.find(x => x.app === app)?.nombre ?? 'Creación';

// Por defecto: el lenguaje de tu credencial, tus 3 creaciones más nuevas (primero las con imagen) y tu último afiche.
// Se guarda al tiro, para que la semilla sea la misma en la miniatura y en la pantalla del flyer.
export function eleccionInicial(codigo: string, d: DatosCarta, p: ProgresoJuego): Eleccion {
  const guardada = leerEleccion(codigo);
  const apps = Object.values(p.creaciones).sort((a, b) => Number(!!b.png) - Number(!!a.png) || b.creado - a.creado).map(c => c.app);
  const afiches = p.afiches.filter(id => aficheDe(id));
  const creaciones = (guardada.creaciones ?? apps.slice(0, MAX_CREACIONES)).filter(a => apps.includes(a));
  const e: Eleccion = {
    lenguaje: guardada.lenguaje && VISUALES.includes(guardada.lenguaje) ? guardada.lenguaje : porId(d.marco).visual,
    creaciones: creaciones.length || !apps.length ? creaciones : apps.slice(0, MAX_CREACIONES),
    afiche: guardada.afiche && afiches.includes(guardada.afiche) ? guardada.afiche : afiches[afiches.length - 1] ?? '',
    frase: guardada.frase && (FRASES as readonly string[]).includes(guardada.frase) ? guardada.frase : FRASES[0],
    semilla: guardada.semilla ?? semillaNueva(),
  };
  guardarEleccion(codigo, e);
  return e;
}

// Imágenes (miniaturas de las tablets, afiches y el personaje o la foto) y los datos listos para pintarFlyer.
export function useDatosFlyer(codigo: string, datos: DatosCarta | null, progreso: ProgresoJuego | null, eleccion: Eleccion | null) {
  const creacionesDisp = useMemo(() => (progreso ? Object.values(progreso.creaciones).sort((a, b) => b.creado - a.creado) : []), [progreso]);
  const afichesDisp = useMemo(() => (progreso ? progreso.afiches.map(aficheDe).filter((a): a is NonNullable<typeof a> => !!a) : []), [progreso]);
  const foto = datos?.receta.retrato === 'foto' ? fotoDe(codigo) : null;
  const srcPersonaje = !datos ? null : foto ?? (datos.receta.retrato === 'personaje' ? personajeDe(datos.receta.id).src : PERSONAJES.find(p => p.visual === eleccion?.lenguaje)?.src ?? PERSONAJES[0].src);
  const troquelado = !!datos && !foto && (datos.receta.retrato === 'personaje' ? datos.receta.id !== 'organica' : eleccion?.lenguaje !== 'Orgánica');
  const srcs = [srcPersonaje, ...creacionesDisp.map(c => c.png ?? null), ...afichesDisp.map(a => a.img)];
  const imgs = useImagenes(srcs);
  const imgCreacion = (app: string) => imgs[1 + creacionesDisp.findIndex(c => c.app === app)] ?? null;
  const imgAfiche = (id: string) => imgs[1 + creacionesDisp.length + afichesDisp.findIndex(a => a.id === id)] ?? null;

  const flyer: DatosFlyer | null = useMemo(() => {
    if (!datos || !eleccion) return null;
    const piezas: PiezaFlyer[] = eleccion.creaciones.map(app => ({ tipo: 'creacion' as const, img: imgCreacion(app), etiqueta: nombreApp(app) }));
    const a = aficheDe(eleccion.afiche);
    if (a) piezas.push({ tipo: 'afiche', img: imgAfiche(a.id), etiqueta: `Afiche ${a.nombre}` });
    return { lenguaje: eleccion.lenguaje, piezas, personaje: imgs[0], troquelado, frase: eleccion.frase, nombre: datos.nombre, semilla: eleccion.semilla };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos, eleccion, troquelado, ...imgs]);
  return { flyer, creacionesDisp, afichesDisp };
}

// Las fuentes del flyer (Silkscreen, Bricolage): hasta que cargan, se repinta al llegar.
export function useFuentesFlyer() {
  const [listas, setListas] = useState(false);
  useEffect(() => { let vivo = true; cargarFuentes().then(() => vivo && setListas(true)); return () => { vivo = false; }; }, []);
  return listas;
}

// Miniatura en vivo: el mismo pintarFlyer, a escala (B-016).
export const MiniFlyer: React.FC<{ flyer: DatosFlyer | null; escala?: number; className?: string }> = ({ flyer, escala = 0.2, className }) => {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const fuentes = useFuentesFlyer();
  useEffect(() => {
    const c = lienzo.current;
    if (!c || !flyer) return;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    pintarFlyer(ctx, flyer, escala);
  }, [flyer, fuentes, escala]);
  return <canvas ref={lienzo} width={Math.round(FLYER.ancho * escala)} height={Math.round(FLYER.alto * escala)} className={className} aria-hidden="true" />;
};
