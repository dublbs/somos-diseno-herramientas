import React, { useEffect, useRef, useState } from 'react';
import { Oido, SILENCIO, type Fuente, type Rasgos } from './audio/oido';
import { ESCENAS, estadoInicial } from './escenas/escenas';
import { descargar, grabarEnVivo, puedeGrabar } from './lib/archivos';
import './styles.css';

type Pestana = 'escena' | 'sonido';
const QUIETO = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const SEG_LOOP = 6;

export const App: React.FC = () => {
  const oido = useRef(new Oido());
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [empezado, setEmpezado] = useState(false);
  const [fuente, setFuente] = useState<Fuente | null>(null);
  const [aviso, setAviso] = useState('');
  const [escenaId, setEscenaId] = useState(ESCENAS[0].id);
  const [pestana, setPestana] = useState<Pestana>('escena');
  const [sensibilidad, setSensibilidad] = useState(1);
  const [demoAudible, setDemoAudible] = useState(true);
  const [medidor, setMedidor] = useState<Rasgos>(SILENCIO);
  const [grabando, setGrabando] = useState(0); // 0..1
  const escena = ESCENAS.find(e => e.id === escenaId)!;
  const vivo = useRef({ escena, estado: estadoInicial() });
  vivo.current.escena = escena;

  // Recuerda la última escena para la pantalla del mezanine del HUB (por ahora en este equipo).
  useEffect(() => { try { localStorage.setItem('sd:audioreactiva', JSON.stringify({ escena: escenaId, ts: Date.now() })); } catch { /* sin almacenamiento */ } }, [escenaId]);
  useEffect(() => { oido.current.sensibilidad = sensibilidad; }, [sensibilidad]);
  useEffect(() => { oido.current.demoAudible = demoAudible; }, [demoAudible]);

  // Bucle de dibujo a 25 cuadros por segundo (el ritmo de Geométrica · Motion).
  useEffect(() => {
    if (!empezado) return;
    const c = lienzo.current!;
    const ctx = c.getContext('2d')!;
    const ro = new ResizeObserver(() => {
      const lado = Math.round(c.clientWidth * Math.min(window.devicePixelRatio || 1, 2));
      if (lado && c.width !== lado) { c.width = c.height = lado; }
    });
    ro.observe(c);
    let raf = 0, antes = performance.now(), acumulado = 0, medir = 0;
    const cuadro = (ahora: number) => {
      raf = requestAnimationFrame(cuadro);
      acumulado += ahora - antes; antes = ahora;
      if (acumulado < 40) return;
      const dt = Math.min(0.2, acumulado / 1000); acumulado = 0;
      const r = oido.current.leer(ahora);
      vivo.current.escena.dibujar(ctx, c.width, QUIETO ? 0 : dt, r, vivo.current.estado);
      if (++medir % 3 === 0) setMedidor(r);
    };
    raf = requestAnimationFrame(cuadro);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [empezado]);

  const usar = async (f: Fuente) => {
    setAviso('');
    try {
      if (f === 'microfono') await oido.current.microfono();
      else await oido.current.demo(demoAudible);
      setFuente(f);
    } catch {
      setAviso('No pudimos usar el micrófono. Revisa el permiso del navegador; mientras, suena la música de demo.');
      await oido.current.demo(demoAudible).catch(() => {});
      setFuente('demo');
    }
    setEmpezado(true);
  };
  useEffect(() => () => oido.current.apagar(), []);

  const elegirEscena = (id: string) => { setEscenaId(id); vivo.current.estado = estadoInicial(); };

  const png = () => lienzo.current!.toBlob(b => b && descargar(b, `audioreactiva-${escenaId}.png`), 'image/png');
  const grabar = async () => {
    setGrabando(0.001);
    try {
      const { blob, ext } = await grabarEnVivo(lienzo.current!, SEG_LOOP, 25, setGrabando);
      descargar(blob, `audioreactiva-${escenaId}.${ext}`);
    } catch (e) { setAviso((e as Error).message); }
    setGrabando(0);
  };

  if (!empezado) {
    return (
      <div className="portada">
        <a className="volver" href="../../"><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>Experiencias</a>
        <div className="portada-cuerpo">
          <p className="etq">Geométrica · Motion</p>
          <h1>Estación Audioreactiva</h1>
          <ol className="pasos">
            <li><b>1</b> Elige una escena: túnel, acordeón, caleidoscopio o tejido.</li>
            <li><b>2</b> Haz sonar: habla, aplaude, canta o pon música cerca de la tablet.</li>
            <li><b>3</b> Mira cómo se deforma la red y graba tu loop.</li>
          </ol>
          <div className="portada-acciones">
            <button type="button" className="btn primario" onClick={() => usar('microfono')}>
              <span className="material-symbols-outlined" aria-hidden="true">mic</span>Empezar con micrófono
            </button>
            <button type="button" className="btn" onClick={() => usar('demo')}>
              <span className="material-symbols-outlined" aria-hidden="true">music_note</span>Probar con música
            </button>
          </div>
          {aviso && <p className="aviso" role="alert">{aviso}</p>}
        </div>
      </div>
    );
  }

  const barras: [string, number][] = [['Volumen', medidor.volumen], ['Graves', medidor.graves], ['Medios', medidor.medios], ['Agudos', medidor.agudos]];
  return (
    <div className="app-pantalla">
      <header className="barra-superior">
        <div className="lado-izq">
          <a className="volver" href="../../" id="volver-hub">
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            Experiencias
          </a>
          <div className="barra-info">
            <h1>Estación Audioreactiva</h1>
            <p className="bajada-corta">{escena.nombre} · {escena.base} · {fuente === 'microfono' ? 'micrófono' : 'música de demo'}</p>
          </div>
        </div>
      </header>

      <main className="cuerpo-pantalla">
        <section className="escenario-fit" aria-label="Escena">
          <div className="lienzo-fit marco-escena" style={{ '--ratio': 1 } as React.CSSProperties}>
            <canvas ref={lienzo} className="escena" role="img" aria-label={`Escena ${escena.nombre} reaccionando al sonido`} />
          </div>
        </section>

        <aside className="panel-app" aria-label="Controles">
          <div className="pestanas" role="tablist" aria-label="Secciones">
            {(['escena', 'sonido'] as Pestana[]).map(p => (
              <button key={p} type="button" role="tab" id={`tab-${p}`} aria-selected={pestana === p} aria-controls={`pag-${p}`} onClick={() => setPestana(p)}>
                <span className="material-symbols-outlined" aria-hidden="true">{p === 'escena' ? 'grid_view' : 'graphic_eq'}</span>
                {p === 'escena' ? 'Escena' : 'Sonido'}
              </button>
            ))}
          </div>

          {pestana === 'escena' && (
            <div className="panel-pagina" role="tabpanel" id="pag-escena" aria-labelledby="tab-escena">
              <div className="escenas" role="radiogroup" aria-label="Escena">
                {ESCENAS.map(e => (
                  <button key={e.id} type="button" role="radio" aria-checked={escenaId === e.id} className="escena-btn" style={{ '--f': e.fondo } as React.CSSProperties} onClick={() => elegirEscena(e.id)}>
                    <span className="escena-nombre">{e.nombre}</span>
                    <span className="escena-base">{e.base}</span>
                  </button>
                ))}
              </div>
              <p className="que-hace">{escena.sonido}</p>
            </div>
          )}

          {pestana === 'sonido' && (
            <div className="panel-pagina" role="tabpanel" id="pag-sonido" aria-labelledby="tab-sonido">
              <span className="label">Escuchar</span>
              <div className="seg" role="group" aria-label="Fuente de sonido">
                <button type="button" aria-pressed={fuente === 'microfono'} onClick={() => usar('microfono')}>Micrófono</button>
                <button type="button" aria-pressed={fuente === 'demo'} onClick={() => usar('demo')}>Música de demo</button>
              </div>
              {fuente === 'demo' && (
                <label className="fila-check"><input type="checkbox" checked={demoAudible} onChange={e => setDemoAudible(e.target.checked)} /> Que la demo suene por el parlante</label>
              )}
              <label className="label" htmlFor="sensibilidad">Sensibilidad</label>
              <input id="sensibilidad" type="range" min={0.4} max={2.5} step={0.1} value={sensibilidad} onChange={e => setSensibilidad(Number(e.target.value))} />
              <div className="medidores" aria-label="Lo que escucha la estación">
                {barras.map(([n, v]) => (
                  <div key={n} className="medidor"><span>{n}</span><i style={{ '--v': v } as React.CSSProperties} /></div>
                ))}
                <div className={'golpe' + (medidor.golpe ? ' si' : '')}>Golpe</div>
              </div>
              {aviso && <p className="aviso" role="alert">{aviso}</p>}
            </div>
          )}

          <div className="panel-pie">
            <button type="button" className="btn primario" onClick={grabar} disabled={!!grabando || !puedeGrabar()}>
              <span className="material-symbols-outlined" aria-hidden="true">movie</span>
              {grabando ? `Grabando… ${Math.round(grabando * 100)}%` : `Grabar ${SEG_LOOP} s`}
            </button>
            <button type="button" className="btn" onClick={png} disabled={!!grabando}>
              <span className="material-symbols-outlined" aria-hidden="true">image</span>PNG
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
};
