import React, { useEffect, useMemo } from 'react';

interface Props { blob: Blob; onCerrar: () => void; onGuardar: () => void }

export const ModalExportar: React.FC<Props> = ({ blob, onCerrar, onGuardar }) => {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onCerrar]);

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" onClick={e => e.stopPropagation()}>
        <h2 id="modal-titulo">Tu muro está listo</h2>
        <img src={url} alt="Tarjeta de 1080 × 1350 con tu graffiti" className="modal-preview" />
        <div className="modal-acciones">
          <button type="button" className="btn primario" onClick={onGuardar} autoFocus>
            <span className="material-symbols-outlined" aria-hidden="true">download</span>
            Guardar imagen
          </button>
          <button type="button" className="btn" onClick={onCerrar}>Seguir pintando</button>
        </div>
      </div>
    </div>
  );
};
