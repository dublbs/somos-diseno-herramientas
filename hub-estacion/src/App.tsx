import React, { useEffect, useRef, useState } from 'react';
import { Estacion, disponer, TODAS_LAS_IMAGENES } from './estacion/escena';
import { poblacionDePrueba, simularEventos, azar, type Evento, type Persona } from './estacion/fuente';
import { precargar } from './estacion/imagenes';
import { conectar } from './estacion/vivo';
import { remoto } from '../../shared/datos';
import { ACTIVAS } from '../../shared/juego';
import './styles.css';

// HUB «Estación Somos Diseño»: vive en la pantalla flip y en los Mac del evento.
// Parámetros de prueba: ?hora=19 fija la hora del cielo · ?rapido=8 acelera el reloj (trenes, vagón y eventos).
const params = new URLSearchParams(window.location.search);
const HORA_FIJA = params.has('hora') ? Number(params.get('hora')) : null;
const RAPIDO = Math.max(1, Number(params.get('rapido')) || 1);
// ?prueba=0: solo las personas reales (sin la población ni los eventos de prueba).
const PRUEBA = params.get('prueba') !== '0';
const QUIETO = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

interface Aviso { id: number; texto: string }
const ORDINAL = ['', '1er', '2º', '3er', '4º'];

export const App: React.FC = () => {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const estacion = useRef<Estacion | null>(null);
  const [resumen, setResumen] = useState({ personas: 0, timbres: 0, completas: 0 });
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [hora, setHora] = useState(() => new Date());
  const [listo, setListo] = useState(false);

  useEffect(() => { precargar(TODAS_LAS_IMAGENES).then(() => setListo(true)); }, []);

  useEffect(() => {
    if (!listo) return;
    const c = lienzo.current!;
    const ctx = c.getContext('2d')!;
    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), r = c.getBoundingClientRect();
      c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const d = disponer(r.width, r.height);
      if (estacion.current) estacion.current.redimensionar(d);
      else estacion.current = new Estacion(d, PRUEBA ? poblacionDePrueba(40) : [], azar(3), QUIETO);
    };
    medir();
    const ro = new ResizeObserver(medir); ro.observe(c);

    let raf = 0, antes = performance.now();
    const cuadro = (ahora: number) => {
      raf = requestAnimationFrame(cuadro);
      const e = estacion.current!, dt = Math.max(0, Math.min(100, ahora - antes)) * RAPIDO;
      antes = ahora;
      e.paso(QUIETO ? 0 : dt);
      const h = HORA_FIJA ?? new Date().getHours() + new Date().getMinutes() / 60;
      e.dibujar(ctx, h);
    };
    raf = requestAnimationFrame(cuadro);

    let n = 0;
    const alEvento = (ev: Evento) => {
      const e = estacion.current!;
      let texto = '';
      if (ev.tipo === 'llega') { e.llega(ev.persona); texto = `${ev.persona.nombre} llegó a la estación`; }
      else {
        const p = e.avatares.find(a => a.p.codigo === ev.codigo)?.p;
        e.timbre(ev.codigo, ev.timbres);
        texto = ev.timbres >= ACTIVAS.length ? `¡${p?.nombre} completó su credencial!` : `${p?.nombre} consiguió su ${ORDINAL[ev.timbres]} timbre`;
      }
      setAvisos(l => [{ id: n++, texto }, ...l].slice(0, 6));
      setResumen(e.resumen);
    };
    const detener = PRUEBA ? simularEventos(() => estacion.current!.avatares.map(a => a.p as Persona), alEvento, 5000 / RAPIDO) : () => {};
    // Lo real: credenciales, timbres, vagones, mosaicos y grabados que llegan por shared/datos.ts.
    let desconectar = () => {};
    conectar(alEvento, codigo => estacion.current!.avatares.some(a => a.p.codigo === codigo)).then(f => { desconectar = f; });
    setResumen(estacion.current!.resumen);
    const reloj = setInterval(() => setHora(new Date()), 15000);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); detener(); desconectar(); clearInterval(reloj); };
  }, [listo]);

  const pantallaCompleta = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  };

  return (
    <div className="estacion">
      <header className="cabecera">
        <a className="volver" href="../../" aria-label="Volver a las experiencias">←</a>
        <h1>Estación</h1>
        <dl className="cifras">
          <div><dt>Personas</dt><dd>{resumen.personas}</dd></div>
          <div><dt>Timbres</dt><dd>{resumen.timbres}</dd></div>
          <div><dt>Completas</dt><dd>{resumen.completas}</dd></div>
        </dl>
        <ol className="avisos" aria-live="polite">
          {avisos.slice(0, 1).map(a => <li key={a.id}>{a.texto}</li>)}
        </ol>
        <time className="hora">{(HORA_FIJA != null ? `${String(Math.floor(HORA_FIJA)).padStart(2, '0')}:00` : hora.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }))}</time>
        <button type="button" className="completa" onClick={pantallaCompleta} aria-label="Pantalla completa">⛶</button>
      </header>
      <canvas ref={lienzo} className="escena" role="img" aria-label={`Estación con ${resumen.personas} personas: andén Pixel, mezanine Geométrico y plaza Orgánica`} />
      {!listo && <p className="cargando">Abriendo la estación…</p>}
      <span className="demo">{remoto ? 'En vivo' : 'Este equipo'}{PRUEBA ? ' · con personas de prueba' : ''}</span>
    </div>
  );
};
