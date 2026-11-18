import React, { useEffect, useState } from 'react';
import { remoto } from '../../../shared/datos';
import { conectarGaleria, NOMBRE_CLASE, NOMBRE_CORTO, type Galeria as DatosGaleria, type Pieza } from './piezas';
import { crearEjemplos } from './ejemplos';
import './galeria.css';

// Modo galería (plan 014 §3, R3): respaldo liviano de la pantalla Flip. Una creación grande que cambia cada pocos
// segundos y las que siguen al lado. Lo que llega nuevo pasa adelante. Sin datos, ejemplos hechos aquí mismo.
// Pensado para el navegador de la Flip 2 (Chromium ~69): solo <img>, grid y transiciones de opacidad.
// ?galeria o #/galeria · ?cada=<s> cambia el ritmo (por omisión 9 s).

const params = new URLSearchParams(window.location.search);
const CADA = Math.max(3, Number(params.get('cada')) || 9) * 1000;
const LLENAR = 9; // con menos creaciones reales que esto, se completa con ejemplos
const SIGUIENTES = 8;
const QUIETO = !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const haceCuanto = (t: number, ahora: number) => {
  const m = Math.max(0, Math.round((ahora - t) / 60000));
  if (m < 1) return 'recién';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `hace ${h} h` : 'ayer';
};

const Pie: React.FC<{ p: Pieza; ahora: number; grande?: boolean }> = ({ p, ahora, grande }) => (
  <figcaption>
    <span className={`g-clase g-${p.clase}`}>{(grande ? NOMBRE_CLASE : NOMBRE_CORTO)[p.clase]}</span>
    {grande ? <b>{p.autor ? (p.ejemplo ? p.autor : `Hecho por ${p.autor}`) : 'Hecho en Somos Diseño'}</b> : <b>{p.autor || 'Sin firma'}</b>}
    <small>{p.ejemplo ? 'Ejemplo' : haceCuanto(p.creado, ahora)}</small>
  </figcaption>
);

export const Galeria: React.FC = () => {
  const [vivo, setVivo] = useState<DatosGaleria>({ piezas: [], personas: [] });
  const [ejemplos, setEjemplos] = useState<Pieza[]>([]);
  const [cargado, setCargado] = useState(false);
  const [i, setI] = useState(0);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    document.documentElement.classList.add('modo-galeria');
    let primero = '';
    const desconectar = conectarGaleria(g => {
      setCargado(true);
      setVivo(g);
      // Lo que llega nuevo se muestra al tiro.
      const nuevo = g.piezas.length ? g.piezas[0].id : '';
      if (primero && nuevo && nuevo !== primero) setI(0);
      primero = nuevo;
    });
    crearEjemplos().then(e => setEjemplos(e.piezas)).catch(() => {});
    return () => { desconectar(); document.documentElement.classList.remove('modo-galeria'); };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => { setI(n => n + 1); setAhora(Date.now()); }, CADA);
    return () => clearInterval(id);
  }, [i]); // al saltar a una nueva, el reloj parte de cero

  const reales = vivo.piezas;
  const lista = reales.length >= LLENAR ? reales : reales.concat(ejemplos.slice(0, LLENAR - reales.length + 3));
  const n = lista.length;
  const actual = n ? lista[i % n] : null;
  const siguientes: Pieza[] = [];
  for (let k = 1; k <= Math.min(SIGUIENTES, n - 1); k++) siguientes.push(lista[(i + k) % n]);
  const personas = vivo.personas.slice(0, 8);

  const pantallaCompleta = () => {
    const d = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (!document.fullscreenElement && !d.webkitFullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else if (document.exitFullscreen) document.exitFullscreen().catch(() => {}); else if (d.webkitExitFullscreen) d.webkitExitFullscreen();
  };

  return (
    <div className={`galeria${QUIETO ? ' quieta' : ''}`}>
      <header className="g-cabecera">
        <h1>Lo que se está creando hoy</h1>
        <p className="g-estado">
          {reales.length ? `${reales.length}${reales.length >= 40 ? '+' : ''} creaciones` : cargado ? 'Esperando las primeras creaciones del día' : 'Conectando…'}
          <span className={remoto ? 'g-punto en-vivo' : 'g-punto'}>{remoto ? 'En vivo' : 'Este equipo'}</span>
        </p>
        <button type="button" className="g-completa" onClick={pantallaCompleta} aria-label="Pantalla completa">⛶</button>
      </header>

      <main className="g-cuerpo">
        <section className="g-destacada" aria-live="polite">
          {actual ? (
            <figure key={actual.id + ':' + i} className={`g-marco g-${actual.clase}`}>
              <div className="g-imagen"><img src={actual.src} alt={`${NOMBRE_CLASE[actual.clase]}${actual.autor ? ` de ${actual.autor}` : ''}`} /></div>
              <Pie p={actual} ahora={ahora} grande />
              {!actual.ejemplo && actual === reales[0] && Date.now() - actual.creado < 3 * 60000 ? <span className="g-nueva">¡Nueva!</span> : null}
            </figure>
          ) : (
            <div className="g-espera"><b>Somos Diseño</b><span>Abriendo la galería…</span></div>
          )}
        </section>
        <ol className="g-siguientes">
          {siguientes.map((p, k) => (
            <li key={p.id + ':' + k} className={`g-${p.clase}`}>
              <div className="g-imagen"><img src={p.src} alt="" /></div>
              <Pie p={p} ahora={ahora} />
            </li>
          ))}
        </ol>
      </main>

      <footer className="g-pie">
        <p className="g-invita">Haz tu credencial en el celular, crea en las mesas y aparece aquí.</p>
        {personas.length ? (
          <p className="g-llegaron"><span>Llegaron</span>{personas.map(p => <b key={p.id}>{p.autor}</b>)}</p>
        ) : !reales.length && ejemplos.length ? <p className="g-llegaron"><span>Por ahora, ejemplos</span></p> : null}
      </footer>
    </div>
  );
};
