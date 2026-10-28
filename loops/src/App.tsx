import React, { useEffect, useState } from 'react';
import { EscenarioOrganico } from './components/EscenarioOrganico';
import { ModalExportar, type VideoLoop } from './components/ModalExportar';
import { exportarTarjetaMotion } from './lib/exportarTarjeta';
import './styles.css';

const NOMBRE = 'Teatro de Papel';

// Por ahora es solo Orgánica; Geométrica y Pixel vuelven con el mismo sistema de escenarios.
export const App: React.FC = () => {
  const [blobTarjeta, setBlobTarjeta] = useState<Blob | null>(null);
  const [videoLoop, setVideoLoop] = useState<VideoLoop | null>(null);

  useEffect(() => { document.documentElement.dataset.visual = 'Orgánica'; }, []);

  const exportarPng = async (canvas: HTMLCanvasElement) => {
    const blob = await exportarTarjetaMotion(canvas, NOMBRE, 'Día Orgánica · Mesa 4');
    setVideoLoop(null);
    setBlobTarjeta(blob);
  };

  return (
    <>
      <header className="top">
        <a className="volver" href="../../" id="volver-hub"><span aria-hidden="true">←</span> Experiencias</a>
        <div className="marca">Teatro de Papel <span className="chip">Orgánica</span></div>
      </header>

      <EscenarioOrganico
        onExportar={exportarPng}
        onVideo={(png, v) => { setVideoLoop(v); setBlobTarjeta(png); }}
      />

      {blobTarjeta && (
        <ModalExportar
          blobTarjeta={blobTarjeta}
          video={videoLoop}
          onCerrar={() => { setBlobTarjeta(null); setVideoLoop(null); }}
          nombreModo={NOMBRE}
        />
      )}
    </>
  );
};
