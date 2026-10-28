import React, { useState } from 'react';

interface ModalExportarProps {
  blobTarjeta: Blob | null;
  onCerrar: () => void;
  nombreModo: string;
}

export const ModalExportar: React.FC<ModalExportarProps> = ({
  blobTarjeta,
  onCerrar,
  nombreModo,
}) => {
  const [descargado, setDescargado] = useState(false);

  if (!blobTarjeta) return null;
  const url = URL.createObjectURL(blobTarjeta);

  const handleDescargar = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `somos-diseno-loops-${nombreModo.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.append(a);
    a.click();
    a.remove();
    setDescargado(true);
    setTimeout(() => setDescargado(false), 3000);
  };

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal-tarjeta" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Tarjeta de Campaña Generada</h3>
          <button type="button" className="btn-cerrar" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="modal-cuerpo">
          <img src={url} alt="Tarjeta final 1080x1350" className="preview-tarjeta-img" />
          <div className="modal-info">
            <p>
              <strong>Formato oficial 1080 × 1350 px</strong>
            </p>
            <p className="subtexto">
              Listo para redes sociales o impresión de recuerdo en el stand.
            </p>

            <button type="button" className="btn-descarga-directa" onClick={handleDescargar}>
              {descargado ? '✓ Descargada' : '⬇ Descargar PNG de Alta Calidad'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
