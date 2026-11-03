import React, { useEffect, useMemo } from 'react';
import { SELLOS } from '../pixel/render';
import { TIMBRES, type Tema } from '../temas';
import { ACTIVAS, ESTACIONES, completa as estaCompleta } from '../../../shared/juego';

// El momento de conseguir un timbre: el sticker cae y se «timbra» sobre un fondo con el patrón del tema.
// Al completar los 4, llueven los timbres del lenguaje. Con «reducir movimiento» se muestra quieto.
export const Timbrado: React.FC<{ n: number; total: number; sellos: number[]; tema: Tema; onCerrar: () => void }> = ({ n, total, sellos, tema, onCerrar }) => {
  const timbres = TIMBRES[tema.visual];
  const timbre = timbres[n - 1];
  const completa = estaCompleta(sellos);
  useEffect(() => {
    try { navigator.vibrate?.(completa ? [40, 60, 40, 60, 120] : [30, 40, 80]); } catch { /* sin vibración */ }
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [completa, onCerrar]);
  // Cada timbre cae a su tiempo, con su tamaño y su vaivén: nunca se repite la misma tanda.
  const gotas = useMemo(() => Array.from({ length: 18 }, (_, i) => {
    const r = (a: number, b: number) => a + Math.random() * (b - a);
    return { i, x: `${r(-4, 94).toFixed(1)}%`, d: `${r(-3, 2.5).toFixed(2)}s`, t: `${r(2.2, 4.6).toFixed(2)}s`, w: `${Math.round(r(46, 96))}px`,
      g: `${Math.round(r(-200, 200))}deg`, v: `${Math.round(r(-34, 34))}px` };
  }), []);
  if (!timbre) return null;

  return (
    <div className={'timbrado' + (completa ? ' completa' : '')} role="dialog" aria-modal="true" aria-labelledby="titulo-timbre">
      {completa && (
        <div className="lluvia" aria-hidden="true">
          {gotas.map(g => (
            <img key={g.i} src={timbres[g.i % SELLOS].src} alt="" style={{ '--x': g.x, '--d': g.d, '--t': g.t, '--w': g.w, '--g': g.g, '--v': g.v } as React.CSSProperties} />
          ))}
        </div>
      )}
      <div className="timbrado-tarjeta">
        <p className="etq">Estación {n} · {ESTACIONES[n - 1].nombre}</p>
        <div className="timbre-golpe">
          <span className="tinta" aria-hidden="true" />
          <img src={timbre.src} alt={`Timbre ${timbre.nombre}`} />
        </div>
        <h2 id="titulo-timbre">{completa ? '¡Credencial completa!' : `¡Timbre ${ESTACIONES[n - 1].nombre}!`}</h2>
        <p className="progreso-timbres" aria-label={`${total} de ${ACTIVAS.length} timbres`}>
          {ACTIVAS.map(i => <span key={i} className={sellos.includes(i) ? 'lleno' : ''} />)}
          <b>{total} de {ACTIVAS.length}</b>
        </p>
        <button type="button" className="btn primario" onClick={onCerrar} autoFocus>Ver mi credencial</button>
      </div>
    </div>
  );
};
