import React, { useCallback, useEffect, useState } from 'react';
import { escucharCreaciones, faltaParaFlyer, obtener, progresoJuego, remoto, sumarCreacion, textoFaltaCanje, textoFaltaFlyer, type ProgresoJuego } from '../lib/store';
import { Bienvenida } from '../components/Bienvenida';
import type { Tema } from '../temas';
import { HACIA_JUEGO, tomarEntrada, useDeslizar } from '../lib/deslizar';
import { AFICHES } from '../lib/afiches';
import type { DatosCarta } from '../pixel/render';
import type { Ir, PonerTema } from '../App';

// Vista Juego (plan 010): se llega deslizando desde la credencial. Cacería de afiches (timbre 3) e inventario
// de creación: lo que la persona crea en cada mesa con su código llega al momento (timbre 2).
export const EXPERIENCIAS = [
  { app: 'juego', nombre: 'Hora punta', icono: 'route' }, // reemplaza al Vagón (plan 009 §2)
  { app: 'graffiti', nombre: 'Graffiti', icono: 'format_paint' },
  { app: 'mosaicos', nombre: 'Mosaicos', icono: 'grid_view' },
  { app: 'audioreactiva', nombre: 'Audio\u00ADreactiva', icono: 'graphic_eq' },
  { app: 'teatro', nombre: 'Teatro', icono: 'movie' },
  { app: 'grabado', nombre: 'Grabado', icono: 'texture' },
  { app: 'fotomaton', nombre: 'Cabina', icono: 'photo_camera' },
];
const nombreExperiencia = (app: string) => EXPERIENCIAS.find(x => x.app === app)?.nombre ?? 'creación';

export const Juego: React.FC<{ codigo: string; aviso?: string; ir: Ir; ponerTema: PonerTema; tema: Tema }> = ({ codigo, aviso, ir, ponerTema, tema }) => {
  const [datos, setDatos] = useState<DatosCarta | null>(null);
  const [progreso, setProgreso] = useState<ProgresoJuego | null>(null);
  const [estado, setEstado] = useState(aviso || '');
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState(''); // la casilla que acaba de llenarse
  const [entra] = useState(tomarEntrada);
  const [comoSeJuega, setComoSeJuega] = useState(false);
  useDeslizar(dir => { if (dir === -HACIA_JUEGO) ir(`#/c/${codigo}`); });

  const cargar = useCallback(() => Promise.all([obtener(codigo), progresoJuego(codigo)])
    .then(([d, p]) => { setDatos(d); setProgreso(p); ponerTema(d.marco); })
    .catch(e => setError((e as Error).message)), [codigo, ponerTema]);
  useEffect(() => { cargar(); }, [cargar]);
  // Lo que se crea en una mesa llega al momento (Realtime); la credencial se vuelve a leer para ver si cayó el timbre 2.
  useEffect(() => escucharCreaciones(codigo, c => {
    setProgreso(p => (p ? { ...p, creaciones: sumarCreacion(p.creaciones, c) } : p));
    setNuevo(c.app);
    setEstado(`¡Llegó tu ${nombreExperiencia(c.app)} al inventario!`);
    navigator.vibrate?.([50, 30, 50]);
    obtener(codigo).then(setDatos).catch(() => { /* se reintenta con el respaldo */ });
  }), [codigo]);
  // Respaldo por si se corta la conexión en vivo: con Supabase, se relee cada 20 s.
  useEffect(() => { if (!remoto) return; const id = setInterval(cargar, 20000); return () => clearInterval(id); }, [cargar]);
  useEffect(() => { if (!estado) return; const t = setTimeout(() => setEstado(''), 4000); return () => clearTimeout(t); }, [estado]);
  useEffect(() => { if (!nuevo) return; const t = setTimeout(() => setNuevo(''), 2600); return () => clearTimeout(t); }, [nuevo]);

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

  const { afiches, meta, creaciones, creacion } = progreso;
  const encontrados = afiches.length, conTimbre3 = datos.sellos.includes(3), conTimbre2 = datos.sellos.includes(2);
  const extra = Math.max(0, encontrados - meta);
  const llenas = EXPERIENCIAS.filter(x => creaciones[x.app]).length;
  // Timbre 4 · «Tu flyer»: se abre con al menos 1 creación y 1 afiche (plan 012 §8).
  const falta = faltaParaFlyer(progreso), abierto = falta.length === 0, conFlyer = datos.sellos.includes(4);
  const abrirFlyer = () => (abierto ? ir('#/flyer') : setEstado(textoFaltaFlyer(falta)));

  return (
    <main className={'pantalla juego' + (entra ? ` entra-${entra}` : '')}>
      <section className="panel-juego caceria" aria-labelledby="titulo-caceria">
        <header>
          <h2 id="titulo-caceria">Cacería de afiches</h2>
          <b className="cuenta">{Math.min(encontrados, meta)} de {meta}{extra > 0 && <small> +{extra}</small>}</b>
        </header>
        <ol className="ranuras-afiche" aria-label="Afiches encontrados">
          {/* Los 5 afiches de la sede: cada uno se ve cuando se encuentra. La meta (3) sigue en el contador. */}
          {AFICHES.map(a => {
            const hallado = afiches.includes(a.id);
            return (
              <li key={a.id} className={hallado ? 'lleno' : ''}>
                {hallado ? <img src={a.img} alt={`Afiche ${a.nombre}`} /> : (
                  <>
                    <span className="material-symbols-outlined" aria-hidden="true">wallpaper</span>
                    <span className="sr-only">Afiche por encontrar</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
        <p className="ayuda">
          {conTimbre3
            ? `¡Timbre de Cacería listo! Colección: ${encontrados} de ${AFICHES.length} afiches.`
            : 'Busca los afiches de la cacería por la sede y apúntales con la cámara.'}
        </p>
        <button type="button" className="btn primario" onClick={() => ir('#/afiches')}>
          <span className="material-symbols-outlined" aria-hidden="true">photo_camera</span>Buscar afiches
        </button>
      </section>

      <section className="panel-juego inventario" aria-labelledby="titulo-inventario">
        <header>
          <h2 id="titulo-inventario">Inventario de creación</h2>
          <b className="cuenta">{conTimbre2 ? 'Timbre listo' : `${Math.min(Math.max(creacion.pasos, llenas), creacion.meta)} de ${creacion.meta}`}</b>
        </header>
        <ul className="recursos">
          {EXPERIENCIAS.map(x => {
            const c = creaciones[x.app];
            return (
              <li key={x.app} className={(c ? 'lleno' : '') + (c?.png ? ' con-imagen' : '') + (nuevo === x.app ? ' nuevo' : '')}>
                {c?.png ? <img src={c.png} alt="" /> : <span className="material-symbols-outlined" aria-hidden="true">{x.icono}</span>}
                <span>{x.nombre}</span>
                <span className="sr-only">{c ? `: lo creaste${c.escena ? ` (${c.escena})` : ''}` : ': por crear'}</span>
              </li>
            );
          })}
        </ul>
        <p className="ayuda">Crea en {creacion.meta} experiencias distintas con tu código <b>{codigo}</b>: cada una llega aquí al momento.</p>
        <a className="btn" href={`../../fotomaton/dist/?codigo=${codigo}&desde=credencial`}>
          <span className="material-symbols-outlined" aria-hidden="true">photo_camera</span>Abrir la Cabina aquí
        </a>
      </section>

      <button type="button" className={'panel-juego tarjeta-flyer' + (abierto ? ' abierta' : '')} onClick={abrirFlyer} aria-disabled={!abierto}>
        <span className="material-symbols-outlined tarjeta-flyer-icono" aria-hidden="true">{abierto ? 'auto_awesome' : 'image'}</span>
        <span className="tarjeta-flyer-texto">
          <b>Tu flyer</b>
          <small>{abierto ? (conFlyer ? 'Timbre listo · arma otro cuando quieras' : 'Ármalo con lo que juntaste y gana el timbre 4') : textoFaltaFlyer(falta)}</small>
        </span>
        <span className="cuenta">{conFlyer ? 'Listo' : abierto ? 'Abrir' : '4'}</span>
      </button>

      <p className="progreso" role="status">{estado || textoFaltaCanje(datos, progreso)}</p>
      <div className="acciones-movil">
        <button type="button" className="btn" onClick={() => ir(`#/c/${codigo}`)}>
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>Credencial
        </button>
        <button type="button" className="btn" onClick={() => ir('#/escanear')}>
          <span className="material-symbols-outlined" aria-hidden="true">approval</span>Timbrar
        </button>
        <button type="button" className="btn" onClick={() => setComoSeJuega(true)}>¿Cómo se juega?</button>
      </div>
      {comoSeJuega && <Bienvenida codigo={codigo} tema={tema} onCerrar={() => setComoSeJuega(false)} />}
    </main>
  );
};
