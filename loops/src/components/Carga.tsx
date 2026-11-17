import React from 'react';

// «Preparando el teatro…»: tapa el escenario mientras se preparan su fondo y sus piezas, con el avance real.
export const Carga: React.FC<{ hechas: number; total: number }> = ({ hechas, total }) => {
  const pct = total > 0 ? Math.round((hechas / total) * 100) : 0;
  return (
    <div className="carga" role="status" aria-live="polite">
      <span className="material-symbols-outlined carga-icono" aria-hidden="true">content_cut</span>
      <p className="carga-titulo">Preparando el teatro…</p>
      <div className="carga-barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Avance de la carga">
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="carga-detalle">Recortando las piezas de papel · {pct} %</p>
    </div>
  );
};
