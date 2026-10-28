import React from 'react';
import { VisualModo, MODOS } from '../data/paletas';

interface BarraModosProps {
  modoActual: VisualModo;
  onCambiarModo: (m: VisualModo) => void;
  fps: number;
  onCambiarFps: (fps: number) => void;
  pausado: boolean;
  onTogglePausa: () => void;
}

export const BarraModos: React.FC<BarraModosProps> = ({
  modoActual,
  onCambiarModo,
  fps,
  onCambiarFps,
  pausado,
  onTogglePausa,
}) => {
  return (
    <div className="barra-modos">
      <div className="modos-tabs" role="tablist" aria-label="Elegir modo de animación">
        {MODOS.map((m) => {
          const activo = m.id === modoActual;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={activo}
              className={`tab-btn ${activo ? 'activo' : ''}`}
              style={{ ['--acento' as string]: m.colorAcento }}
              onClick={() => onCambiarModo(m.id)}
            >
              <div className="tab-header">
                <span className="tab-badge">{m.badge}</span>
              </div>
              <strong className="tab-nombre">{m.nombre}</strong>
              <small className="tab-sub">{m.subtitulo}</small>
            </button>
          );
        })}
      </div>

      <div className="barra-herramientas">
        <button
          type="button"
          className="btn-playback"
          onClick={onTogglePausa}
          aria-label={pausado ? 'Reanudar animación' : 'Pausar animación'}
        >
          {pausado ? '▶ Reanudar' : '⏸ Pausa'}
        </button>

        <div className="fps-selector">
          <span className="fps-label">Velocidad:</span>
          {[8, 12, 24].map((f) => (
            <button
              key={f}
              type="button"
              className={`btn-fps ${fps === f ? 'activo' : ''}`}
              onClick={() => onCambiarFps(f)}
            >
              {f === 12 ? '12 FPS (Retro)' : `${f} FPS`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
