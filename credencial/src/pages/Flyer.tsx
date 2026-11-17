import React, { useEffect, useMemo, useRef, useState } from 'react';
import { faltaParaFlyer, fotoDe, obtener, progresoJuego, sellarFlyer, textoFaltaFlyer, type ProgresoJuego } from '../lib/store';
import { guardarArchivo } from '../lib/descargar';
import { useImagenes } from '../lib/imagenes';
import { aficheDe } from '../lib/afiches';
import { aBlob, type DatosCarta } from '../pixel/render';
import { PERSONAJES, personajeDe } from '../temas';
import { EXPERIENCIAS } from './Juego';
import { cargarFuentes, flyerEnLienzo, FLYER, FRASES, pintarFlyer, semillaNueva, type DatosFlyer, type PiezaFlyer } from '../flyer/componer';
import { porId, VISUALES, type Visual } from '../../../shared/marcos';
import type { Ir, PonerTema } from '../App';

// «Tu flyer» (plan 012 §8): 3 pasos, solo con toques. 1 · Lenguaje, 2 · Tus piezas (hasta 3 creaciones y 1 afiche;
// tu personaje va siempre) con «Mezclar», 3 · Tu frase. «Guardar mi flyer» lo descarga o comparte y da el timbre 4.
type Paso = 'lenguaje' | 'piezas' | 'frase';
const MAX_CREACIONES = 3;
interface Eleccion { lenguaje: Visual; creaciones: string[]; afiche: string; frase: string; semilla: number }
const llave = (codigo: string) => 'sd:flyer:' + codigo;
function leerEleccion(codigo: string): Partial<Eleccion> {
  try { return JSON.parse(localStorage.getItem(llave(codigo)) || '{}'); } catch { return {}; }
}
const nombreApp = (app: string) => EXPERIENCIAS.find(x => x.app === app)?.nombre ?? 'Creación';
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
  const [fuentes, setFuentes] = useState(false);
  const [mezcla, setMezcla] = useState(0); // para la sacudida al mezclar
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => { cargarFuentes().then(() => setFuentes(true)); }, []);
  useEffect(() => {
    Promise.all([obtener(codigo), progresoJuego(codigo)]).then(([d, p]) => {
      setDatos(d); setProgreso(p); ponerTema(d.marco);
      // Por defecto: el lenguaje de tu credencial, tus 3 creaciones más nuevas (primero las con imagen) y tu último afiche.
      const guardada = leerEleccion(codigo);
      const apps = Object.values(p.creaciones).sort((a, b) => Number(!!b.png) - Number(!!a.png) || b.creado - a.creado).map(c => c.app);
      const afiches = p.afiches.filter(id => aficheDe(id));
      const creaciones = (guardada.creaciones ?? apps.slice(0, MAX_CREACIONES)).filter(a => apps.includes(a));
      setEleccion({
        lenguaje: guardada.lenguaje && VISUALES.includes(guardada.lenguaje) ? guardada.lenguaje : porId(d.marco).visual,
        creaciones: creaciones.length || !apps.length ? creaciones : apps.slice(0, MAX_CREACIONES),
        afiche: guardada.afiche && afiches.includes(guardada.afiche) ? guardada.afiche : afiches[afiches.length - 1] ?? '',
        frase: guardada.frase && (FRASES as readonly string[]).includes(guardada.frase) ? guardada.frase : FRASES[0],
        semilla: guardada.semilla ?? semillaNueva(),
      });
    }).catch(e => setError((e as Error).message));
  }, [codigo, ponerTema]);
  useEffect(() => { if (eleccion) try { localStorage.setItem(llave(codigo), JSON.stringify(eleccion)); } catch { /* sin almacenamiento */ } }, [codigo, eleccion]);
  useEffect(() => { if (!estado) return; const t = setTimeout(() => setEstado(''), 5000); return () => clearTimeout(t); }, [estado]);

  // Imágenes: las miniaturas que llegaron de las tablets, los afiches y el personaje (o la foto) de la credencial.
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
