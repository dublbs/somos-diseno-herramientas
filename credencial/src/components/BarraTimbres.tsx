import React, { useEffect, useRef, useState } from 'react';
import { TIMBRES, type Tema } from '../temas';
import { ACTIVAS, ESTACIONES } from '../../../shared/juego';

// B-017: el avance de los 4 timbres, siempre visible arriba de la credencial y de la vista Juego.
// Cada ranura muestra el timbre del lenguaje cuando se gana; el que acaba de llegar «salta» (sin animación con
// prefers-reduced-motion, lo maneja el CSS). `gana` fuerza el salto de una ranura (el timbre que se está poniendo).
export const BarraTimbres: React.FC<{ sellos: number[]; tema: Tema; gana?: number | null }> = ({ sellos, tema, gana }) => {
  const total = ACTIVAS.filter(n => sellos.includes(n)).length;
  const antes = useRef<number[] | null>(null);
  const [salta, setSalta] = useState<number[]>([]);
  // Un timbre nuevo que llega mientras la pantalla está abierta (refresco con Supabase o al volver del flyer).
  useEffect(() => {
    const previos = antes.current;
    antes.current = sellos;
    if (!previos) return;
    const nuevos = sellos.filter(n => !previos.includes(n));
    if (!nuevos.length) return;
    setSalta(nuevos);
    try { navigator.vibrate?.([30, 40, 60]); } catch { /* sin vibración */ }
    const t = setTimeout(() => setSalta([]), 1400);
    return () => clearTimeout(t);
  }, [sellos]);
  const timbres = TIMBRES[tema.visual];

  return (
    <div className={'barra-timbres' + (total === ACTIVAS.length ? ' completa' : '')} role="group" aria-label={`Tus timbres: ${total} de ${ACTIVAS.length}`}>
      <ol className="barra-timbres-ranuras">
        {ACTIVAS.map(n => {
          const lleno = sellos.includes(n);
          return (
            <li key={n} className={(lleno ? 'lleno' : '') + (salta.includes(n) || gana === n ? ' salta' : '')}
              aria-label={`${ESTACIONES[n - 1].nombre}: ${lleno ? 'listo' : 'pendiente'}`}>
              {lleno ? <img src={timbres[n - 1].src} alt="" /> : <span aria-hidden="true">{n}</span>}
            </li>
          );
        })}
      </ol>
      <span className="barra-timbres-medidor" aria-hidden="true"><span style={{ width: `${(total / ACTIVAS.length) * 100}%` }} /></span>
      <b className="barra-timbres-cuenta" aria-hidden="true">{total}/{ACTIVAS.length}</b>
    </div>
  );
};
