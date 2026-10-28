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
        <a className="volver" href="../../" id="volver-hub">
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          Experiencias
        </a>
      </header>

      <div className="intro-teatro">
        <h1>Teatro de Papel</h1>
        <p className="bajada">
          Elige un paisaje, añade personajes y elementos de la naturaleza, y anímalos en un teatro de papel en loop.
          Ajusta sus movimientos, tamaño y llévate tu video o tarjeta.
        </p>
      </div>

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
