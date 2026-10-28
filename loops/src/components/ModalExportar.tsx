import React, { useEffect, useMemo, useState } from 'react';

export interface VideoLoop { blob: Blob; ext: string; seg: number }

interface ModalExportarProps {
  blobTarjeta: Blob | null;
  video?: VideoLoop | null;
  onCerrar: () => void;
  nombreModo: string;
}

export const ModalExportar: React.FC<ModalExportarProps> = ({
  blobTarjeta,
  video,
  onCerrar,
  nombreModo,
}) => {
  const [descargado, setDescargado] = useState(false);

  const url = useMemo(() => (blobTarjeta ? URL.createObjectURL(blobTarjeta) : ''), [blobTarjeta]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  const urlVideo = useMemo(() => (video ? URL.createObjectURL(video.blob) : ''), [video]);
  useEffect(() => () => { if (urlVideo) URL.revokeObjectURL(urlVideo); }, [urlVideo]);

  if (!blobTarjeta) return null;

  const handleDescargar = (esVideo = false) => {
    const a = document.createElement('a');
    a.href = esVideo ? urlVideo : url;
    a.download = `somos-diseno-teatro-de-papel-${nombreModo.toLowerCase().replace(/\s+/g, '-')}.${esVideo && video ? video.ext : 'png'}`;
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
          {urlVideo ? (
            <video src={urlVideo} className="preview-tarjeta-img" autoPlay loop muted playsInline controls={false} />
          ) : (
            <img src={url} alt="Tarjeta final 1080x1350" className="preview-tarjeta-img" />
          )}
          <div className="modal-info">
            <p>
              <strong>Formato oficial 1080 × 1350 px</strong>
            </p>
            <p className="subtexto">
              Listo para redes sociales o impresión de recuerdo en el stand.
            </p>

            {video && (
              <button type="button" className="btn-descarga-directa" onClick={() => handleDescargar(true)}>
                {descargado ? '✓ Descargado' : `⬇ Descargar loop animado (${video.ext.toUpperCase()}, ${video.seg} s)`}
              </button>
            )}
            <button type="button" className="btn-descarga-directa" onClick={() => handleDescargar(false)}>
              {descargado && !video ? '✓ Descargada' : '⬇ Descargar PNG de Alta Calidad'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
