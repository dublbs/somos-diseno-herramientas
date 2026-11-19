import React, { useEffect, useRef, useState } from 'react';
import { faltaParaFlyer, obtener, progresoJuego, sellarFlyer, textoFaltaFlyer, type ProgresoJuego } from '../lib/store';
import { guardarArchivo } from '../lib/descargar';
import { aBlob, type DatosCarta } from '../pixel/render';
import { PERSONAJES } from '../temas';
import { EXPERIENCIAS } from './Juego';
import { cargarFuentes, flyerEnLienzo, FLYER, FRASES, pintarFlyer, semillaNueva } from '../flyer/componer';
import { eleccionInicial, guardarEleccion, MAX_CREACIONES, nombreApp, useDatosFlyer, useFuentesFlyer, type Eleccion } from '../flyer/usarFlyer';
import { VISUALES } from '../../../shared/marcos';
import type { Ir, PonerTema } from '../App';

// «Tu flyer» (plan 012 §8): 3 pasos, solo con toques. 1 · Lenguaje, 2 · Tus piezas (hasta 3 creaciones y 1 afiche;
// tu personaje va siempre) con «Mezclar», 3 · Tu frase. «Guardar mi flyer» lo descarga o comparte y da el timbre 4.
type Paso = 'lenguaje' | 'piezas' | 'frase';
const iconoApp = (app: string) => EXPERIENCIAS.find(x => x.app === app)?.icono ?? 'category';
const quieto = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export const Flyer: React.FC<{ codigo: string; ir: Ir; ponerTema: PonerTema }> = ({ codigo, ir, ponerTema }) => {
  const [datos, setDatos] = useState<DatosCarta | null>(null);
  const [progreso, setProgreso] = useState<ProgresoJuego | null>(null);
  const [error, setError] = useState('');
  const [eleccion, setEleccion] = useState<Eleccion | null>(null);
  const [paso, setPaso] = useState<Paso>('lenguaje');
  const [estado, setEstado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mezcla, setMezcla] = useState(0); // para la sacudida al mezclar
  const lienzo = useRef<HTMLCanvasElement>(null);

  const fuentes = useFuentesFlyer();
  useEffect(() => {
    Promise.all([obtener(codigo), progresoJuego(codigo)]).then(([d, p]) => {
      setDatos(d); setProgreso(p); ponerTema(d.marco);
      setEleccion(eleccionInicial(codigo, d, p));
    }).catch(e => setError((e as Error).message));
  }, [codigo, ponerTema]);
  useEffect(() => { if (eleccion) guardarEleccion(codigo, eleccion); }, [codigo, eleccion]);
  useEffect(() => { if (!estado) return; const t = setTimeout(() => setEstado(''), 5000); return () => clearTimeout(t); }, [estado]);

  // La misma elección y los mismos datos que la miniatura de la vista Juego (flyer/usarFlyer.tsx).
  const { flyer, creacionesDisp, afichesDisp } = useDatosFlyer(codigo, datos, progreso, eleccion);

  useEffect(() => {
    const c = lienzo.current;
    if (!c || !flyer) return;
    pintarFlyer(c.getContext('2d')!, flyer);
  }, [flyer, fuentes]);

  if (error) {
    return (
      <main className="pantalla centrada">
        <h2>No pudimos abrir tu flyer</h2>
        <p>{error}</p>
        <button className="btn" onClick={() => ir('#/juego')}>Volver al juego</button>
      </main>
    );
  }
  if (!datos || !progreso || !eleccion) return <main className="pantalla centrada"><p>Juntando tus piezas…</p></main>;
  const falta = faltaParaFlyer(progreso);
  if (falta.length) {
    return (
      <main className="pantalla centrada">
        <p className="etq">Tu flyer</p>
        <h2>Todavía no se abre</h2>
        <p>{textoFaltaFlyer(falta)} Con al menos una creación y un afiche armas tu flyer.</p>
        <button className="btn primario" onClick={() => ir('#/juego')}>Volver al juego</button>
      </main>
    );
  }

  const cambiar = (c: Partial<Eleccion>) => setEleccion(e => (e ? { ...e, ...c } : e));
  const mezclar = () => {
    cambiar({ semilla: semillaNueva() });
    setMezcla(m => m + 1);
    try { navigator.vibrate?.(12); } catch { /* sin vibración */ }
  };
  const alternarCreacion = (app: string) => {
    const ya = eleccion.creaciones.includes(app);
    // Con 3 elegidas, la nueva reemplaza a la primera que elegiste.
    cambiar({ creaciones: ya ? eleccion.creaciones.filter(a => a !== app) : [...eleccion.creaciones, app].slice(-MAX_CREACIONES) });
  };

  const guardar = async () => {
    if (!flyer || guardando) return;
    setGuardando(true); setEstado('');
    try {
      await cargarFuentes();
      const blob = await aBlob(flyerEnLienzo(flyer));
      const slug = flyer.lenguaje.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const guardado = await guardarArchivo(blob, `flyer-somos-diseno-${slug}.png`);
      if (!guardado) { setEstado('No se guardó. Toca «Guardar mi flyer» otra vez.'); return; }
      const r = await sellarFlyer(codigo);
      if (r.otorgado) { ir(`#/c/${codigo}`, { timbre: 4, aviso: '¡Flyer guardado! Ganaste el timbre Flyer.' }); return; }
      if (r.ok) setEstado('¡Flyer guardado! El timbre ya estaba en tu credencial: haz otro si quieres.');
      else setEstado(`Flyer guardado, pero sin timbre: ${textoFaltaFlyer(r.falta).toLowerCase()} Pide ayuda al equipo.`);
    } catch (e) {
      setEstado((e as Error).message || 'No pudimos guardar tu flyer.');
    } finally {
      setGuardando(false);
    }
  };

  const pasos: [Paso, string][] = [['lenguaje', '1 · Lenguaje'], ['piezas', '2 · Piezas'], ['frase', '3 · Frase']];
  return (
    <main className="pantalla flyer">
      <section className="flyer-vista" aria-label="Vista previa de tu flyer">
        <canvas key={mezcla} ref={lienzo} width={FLYER.ancho} height={FLYER.alto} className={'flyer-lienzo' + (mezcla && !quieto() ? ' mezclado' : '')}
          role="img" aria-label={`Tu flyer: «${eleccion.frase}», lenguaje ${eleccion.lenguaje}, ${flyer?.piezas.length ?? 0} piezas y tu personaje`} />
        <span className="flyer-etiqueta" aria-hidden="true">Vista previa · así se descarga</span>
        <p className="progreso flyer-estado" role="status" hidden={!estado}>{estado}</p>
      </section>

      <div className="pestanas-grilla tres" role="tablist" aria-label="Pasos del flyer">
        {pasos.map(([id, nombre]) => (
          <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={paso === id} aria-controls="panel-flyer" onClick={() => setPaso(id)}>{nombre}</button>
        ))}
      </div>

      <div className="flyer-panel" role="tabpanel" id="panel-flyer" aria-labelledby={`tab-${paso}`}>
        {paso === 'lenguaje' && (
          <div className="flyer-lenguajes" role="radiogroup" aria-label="Lenguaje del flyer">
            {VISUALES.map(v => {
              const pj = PERSONAJES.find(p => p.visual === v)!;
              return (
                <button key={v} type="button" role="radio" aria-checked={eleccion.lenguaje === v} className="flyer-opcion" onClick={() => cambiar({ lenguaje: v })}>
                  <img src={pj.src} alt="" />
                  <span>{v}</span>
                </button>
              );
            })}
          </div>
        )}
        {paso === 'piezas' && (
          <div className="flyer-piezas">
            <p className="flyer-rotulo">Creaciones <b>{eleccion.creaciones.length} de {Math.min(MAX_CREACIONES, creacionesDisp.length)}</b></p>
            <div className="flyer-fila" style={{ '--n': Math.max(creacionesDisp.length, 4) } as React.CSSProperties}>
              {creacionesDisp.map(c => (
                <button key={c.app} type="button" className="pieza-opcion" aria-pressed={eleccion.creaciones.includes(c.app)} aria-label={nombreApp(c.app)} title={nombreApp(c.app)} onClick={() => alternarCreacion(c.app)}>
                  {c.png ? <img src={c.png} alt="" /> : <span className="material-symbols-outlined" aria-hidden="true">{iconoApp(c.app)}</span>}
                  <span className="marca-pieza material-symbols-outlined" aria-hidden="true">check</span>
                </button>
              ))}
            </div>
            <p className="flyer-rotulo">Afiche</p>
            <div className="flyer-fila" role="radiogroup" aria-label="Afiche" style={{ '--n': Math.max(afichesDisp.length, 4) } as React.CSSProperties}>
              {afichesDisp.map(a => (
                <button key={a.id} type="button" role="radio" className="pieza-opcion" aria-checked={eleccion.afiche === a.id} aria-label={`Afiche ${a.nombre}`} title={a.nombre} onClick={() => cambiar({ afiche: a.id })}>
                  <img src={a.img} alt="" />
                  <span className="marca-pieza material-symbols-outlined" aria-hidden="true">check</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {paso === 'frase' && (
          <div className="flyer-frases" role="radiogroup" aria-label="Tu frase">
            {FRASES.map(f => (
              <button key={f} type="button" role="radio" aria-checked={eleccion.frase === f} onClick={() => cambiar({ frase: f })}>{f}</button>
            ))}
          </div>
        )}
      </div>

      <div className="flyer-acciones">
        <button type="button" className="btn" onClick={() => ir('#/juego')} aria-label="Volver al juego">
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        </button>
        <button type="button" className="btn" onClick={mezclar}>
          <span className="material-symbols-outlined" aria-hidden="true">shuffle</span>Mezclar
        </button>
        <button type="button" className="btn primario" onClick={guardar} disabled={guardando}>
          <span className="material-symbols-outlined" aria-hidden="true">download</span>{guardando ? 'Guardando…' : 'Guardar mi flyer'}
        </button>
      </div>
    </main>
  );
};
