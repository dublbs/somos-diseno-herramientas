import React, { useEffect, useRef, useState } from 'react';
import { Oido, SILENCIO, type Fuente, type Rasgos } from './audio/oido';
import { CANALES, ESCENAS, estadoInicial, mezclar, type Canal } from './escenas/escenas';
import { BarraSuperior, BotonAccion, Deslizador, Interruptor, PantallaHerramienta, Seccion, Segmentado } from '../../shared/ui/Kit';
import '../../shared/ui/somos-kit.css';
import { descargar, grabarEnVivo, puedeGrabar } from './lib/archivos';
import './styles.css';

const QUIETO = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const SEG_LOOP = 6;

export const App: React.FC = () => {
  const oido = useRef(new Oido());
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [empezado, setEmpezado] = useState(false);
  const [fuente, setFuente] = useState<Fuente | null>(null);
  const [aviso, setAviso] = useState('');
  const [escenaId, setEscenaId] = useState(ESCENAS[0].id);
  const [mudos, setMudos] = useState<Set<Canal>>(new Set());
  const [sensibilidad, setSensibilidad] = useState(1);
  const [demoAudible, setDemoAudible] = useState(true);
  const [medidor, setMedidor] = useState<Rasgos>(SILENCIO);
  const [grabando, setGrabando] = useState(0); // 0..1
  const escena = ESCENAS.find(e => e.id === escenaId)!;
  const vivo = useRef({ escena, estado: estadoInicial(), mudos });
  vivo.current.escena = escena;
  vivo.current.mudos = mudos;

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
      const r = mezclar(oido.current.leer(ahora), vivo.current.mudos);
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
            <li><b>1</b> Elige una escena: túnel, acordeón, caleidoscopio, tejido o escalera.</li>
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

  const nivel = (c: Canal) => (c === 'golpe' ? medidor.pulso : c === 'tono' ? medidor.tono : medidor[c]);
  const alternar = (c: Canal) => setMudos(m => { const n = new Set(m); if (n.has(c)) n.delete(c); else n.add(c); return n; });
  return (
    <PantallaHerramienta
      anchoLateral={320}
      superior={
        <BarraSuperior titulo="Estación Audioreactiva" bajada={`${escena.nombre} · ${escena.base} · ${fuente === 'microfono' ? 'micrófono' : 'música de demo'}`}>
          <BotonAccion icono="image" texto="PNG" etiqueta="Descargar un cuadro en PNG" onClick={png} disabled={!!grabando} />
          <BotonAccion icono="movie" primario onClick={grabar} disabled={!!grabando || !puedeGrabar()}
            texto={grabando ? `Grabando… ${Math.round(grabando * 100)} %` : `Grabar ${SEG_LOOP} s`} />
        </BarraSuperior>
      }
      lateral={<>
        <Seccion titulo="Escena">
          <div className="escenas" role="radiogroup" aria-label="Escena">
            {ESCENAS.map(e => (
              <button key={e.id} type="button" role="radio" aria-checked={escenaId === e.id} className="k-btn escena-btn" style={{ '--f': e.fondo } as React.CSSProperties} onClick={() => elegirEscena(e.id)}>
                <span className="escena-nombre">{e.nombre}</span>
                <span className="escena-base">{e.base}</span>
              </button>
            ))}
          </div>
        </Seccion>
        <Seccion titulo="Consola · qué mueve cada sonido" crece>
          <div className="consola">
            {CANALES.map(c => {
              const hace = escena.mapa[c.id], mudo = mudos.has(c.id);
              return (
                <div key={c.id} className={'canal' + (hace ? '' : ' sin-uso') + (mudo ? ' mudo' : '')}>
                  <button type="button" className="k-btn canal-btn" aria-pressed={!mudo} disabled={!hace} onClick={() => alternar(c.id)}
                    aria-label={`${c.nombre}${hace ? `: ${hace}` : ': no se usa en esta escena'}. ${mudo ? 'Silenciado' : 'Activo'}`}>
                    <span className="material-symbols-outlined" aria-hidden="true">{mudo ? 'grid_off' : 'graphic_eq'}</span>{c.nombre}
                  </button>
                  <span className="canal-hace">{hace ?? '—'}</span>
                  <i className="canal-nivel" style={{ '--v': mudo ? 0 : nivel(c.id) } as React.CSSProperties} aria-hidden="true" />
                </div>
              );
            })}
          </div>
          <p className="k-ayuda">Silencia un canal para ver qué mueve en la escena.</p>
          {aviso && <p className="aviso" role="alert">{aviso}</p>}
        </Seccion>
      </>}
      inferior={<>
        <div className="espectro" aria-label="Lo que escucha la estación: 12 bandas de graves a agudos">
          {medidor.bandas.map((v, i) => <i key={i} style={{ '--v': v } as React.CSSProperties} />)}
        </div>
        <div className="k-grupo medidores">
          {(['volumen', 'graves', 'medios', 'agudos'] as Canal[]).map(c => (
            <div key={c} className="medidor"><span>{CANALES.find(k => k.id === c)!.nombre}</span><i style={{ '--v': medidor[c as 'volumen'] } as React.CSSProperties} /></div>
          ))}
        </div>
        <div className={'golpe' + (medidor.golpe ? ' si' : '')} aria-hidden="true">Golpe</div>
        <div className="k-grupo escuchar">
          <Segmentado etiqueta="Fuente de sonido" valor={fuente ?? 'demo'} onCambiar={f => usar(f)} opciones={[{ valor: 'microfono' as Fuente, texto: 'Micrófono' }, { valor: 'demo' as Fuente, texto: 'Música demo' }]} />
          {fuente === 'demo' && <Interruptor id="demo-audible" texto="Suena" activo={demoAudible} onCambiar={setDemoAudible} />}
        </div>
        <div className="sensibilidad"><Deslizador id="sensibilidad" etiqueta="Sensibilidad" min={0.4} max={2.5} paso={0.1} valor={sensibilidad} onCambiar={setSensibilidad} /></div>
      </>}
    >
      <div className="escenario-fit">
        <div className="lienzo-fit marco-escena" style={{ '--ratio': 1 } as React.CSSProperties}>
          <canvas ref={lienzo} className="escena" role="img" aria-label={`Escena ${escena.nombre} reaccionando al sonido`} />
        </div>
      </div>
    </PantallaHerramienta>
  );
};
