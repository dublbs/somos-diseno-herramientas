import React, { useEffect } from 'react';
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
  if (!timbre) return null;

  return (
    <div className={'timbrado' + (completa ? ' completa' : '')} role="dialog" aria-modal="true" aria-labelledby="titulo-timbre">
      {completa && (
        <div className="lluvia" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <img key={i} src={timbres[i % SELLOS].src} alt="" style={{ '--x': `${(i * 37) % 100}%`, '--d': `${(i % 5) * 0.22}s`, '--g': `${(i % 2 ? 1 : -1) * (12 + (i * 7) % 20)}deg` } as React.CSSProperties} />
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
