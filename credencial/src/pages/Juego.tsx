import React, { useCallback, useEffect, useState } from 'react';
import { MarcoVivo } from '../components/Pixel';
import { obtener, progresoJuego, remoto, type ProgresoJuego } from '../lib/store';
import { HACIA_JUEGO, tomarEntrada, useDeslizar } from '../lib/deslizar';
import { MARCOS } from '../../../shared/marcos';
import type { DatosCarta } from '../pixel/render';
import type { Ir, PonerTema } from '../App';

// Vista Juego (plan 008): se llega deslizando desde la credencial. Cacería de afiches (timbre 3) e inventario
// de creación (las mesas donde la persona creó algo con su código, timbre 2).
export const EXPERIENCIAS = [
  { app: 'vagon', nombre: 'Vagón', icono: 'train' },
  { app: 'graffiti', nombre: 'Graffiti', icono: 'format_paint' },
  { app: 'mosaicos', nombre: 'Mosaicos', icono: 'grid_view' },
  { app: 'audioreactiva', nombre: 'Audio', icono: 'graphic_eq' },
  { app: 'teatro', nombre: 'Teatro', icono: 'movie' },
  { app: 'grabado', nombre: 'Grabado', icono: 'texture' },
  { app: 'fotomaton', nombre: 'Fotomatón', icono: 'photo_camera' },
];

export const nombreAfiche = (id: string) => {
  const m = MARCOS.find(x => x.id === id);
  return m ? `${m.name} · ${m.visual}` : `Afiche ${id}`;
};

export const Juego: React.FC<{ codigo: string; aviso?: string; ir: Ir; ponerTema: PonerTema }> = ({ codigo, aviso, ir, ponerTema }) => {
  const [datos, setDatos] = useState<DatosCarta | null>(null);
  const [progreso, setProgreso] = useState<ProgresoJuego | null>(null);
  const [estado, setEstado] = useState(aviso || '');
  const [error, setError] = useState('');
  const [entra] = useState(tomarEntrada);
  useDeslizar(dir => { if (dir === -HACIA_JUEGO) ir(`#/c/${codigo}`); });

  const cargar = useCallback(() => Promise.all([obtener(codigo), progresoJuego(codigo)])
    .then(([d, p]) => { setDatos(d); setProgreso(p); ponerTema(d.marco); })
    .catch(e => setError((e as Error).message)), [codigo, ponerTema]);
  useEffect(() => { cargar(); }, [cargar]);
  // Con Supabase se refresca solo: lo que una mesa entrega aparece sin recargar.
  useEffect(() => { if (!remoto) return; const id = setInterval(cargar, 8000); return () => clearInterval(id); }, [cargar]);
  useEffect(() => { if (!estado) return; const t = setTimeout(() => setEstado(''), 4000); return () => clearTimeout(t); }, [estado]);

  if (error) {
    return (
      <main className="pantalla centrada">
        <h2>No pudimos abrir el juego</h2>
        <p>{error}</p>
        <button className="btn" onClick={() => ir(`#/c/${codigo}`)}>Volver a mi credencial</button>
      </main>
    );
  }
  if (!datos || !progreso) return <main className="pantalla centrada"><p>Cargando el juego…</p></main>;

  const { afiches, meta, recursos } = progreso;
  const encontrados = afiches.length, conTimbre3 = datos.sellos.includes(3), conTimbre2 = datos.sellos.includes(2);
  const extra = Math.max(0, encontrados - meta);
  const tengo = new Set(recursos);

  return (
    <main className={'pantalla juego' + (entra ? ` entra-${entra}` : '')}>
      <section className="panel-juego caceria" aria-labelledby="titulo-caceria">
        <header>
          <h2 id="titulo-caceria">Cacería de afiches</h2>
          <b className="cuenta">{Math.min(encontrados, meta)} de {meta}{extra > 0 && <small> +{extra}</small>}</b>
        </header>
        <ol className="ranuras-afiche" aria-label="Afiches encontrados">
          {Array.from({ length: meta }, (_, i) => afiches[i]).map((id, i) => (
            <li key={i} className={id ? 'lleno' : ''}>
              {id ? (
                <>
                  <MarcoVivo marco={id} retrato={null} modo="personaje" animado={false} className="afiche-mini" />
                  <span className="sr-only">{nombreAfiche(id)}</span>
                </>
              ) : (
                <span className="material-symbols-outlined" aria-hidden="true">wallpaper</span>
              )}
              {!id && <span className="sr-only">Afiche {i + 1}: por encontrar</span>}
            </li>
          ))}
        </ol>
        <p className="ayuda">
          {conTimbre3 ? '¡Timbre de Portales listo! Puedes seguir coleccionando afiches.' : 'Busca los afiches con QR por la sede y escanéalos con la cámara.'}
        </p>
        <button type="button" className="btn primario" onClick={() => ir('#/afiches')}>
          <span className="material-symbols-outlined" aria-hidden="true">photo_camera</span>Buscar afiches
        </button>
      </section>

      <section className="panel-juego inventario" aria-labelledby="titulo-inventario">
        <header>
          <h2 id="titulo-inventario">Inventario de creación</h2>
          <b className="cuenta">{conTimbre2 ? 'Timbre listo' : `${tengo.size} de ${EXPERIENCIAS.length}`}</b>
        </header>
        <ul className="recursos">
          {EXPERIENCIAS.map(x => (
            <li key={x.app} className={tengo.has(x.app) ? 'lleno' : ''}>
              <span className="material-symbols-outlined" aria-hidden="true">{x.icono}</span>
              <span>{x.nombre}</span>
              <span className="sr-only">{tengo.has(x.app) ? ': lo tienes' : ': por crear'}</span>
            </li>
          ))}
        </ul>
        <p className="ayuda">Crea algo en una mesa y dale tu código <b>{codigo}</b>.</p>
      </section>

      <p className="progreso" role="status">{estado || 'Desliza a la izquierda para volver.'}</p>
      <div className="acciones-movil">
        <button type="button" className="btn" onClick={() => ir(`#/c/${codigo}`)}>
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>Mi credencial
        </button>
        <button type="button" className="btn" onClick={() => ir('#/escanear')}>
          <span className="material-symbols-outlined" aria-hidden="true">highlight_alt</span>Código
        </button>
      </div>
    </main>
  );
};
