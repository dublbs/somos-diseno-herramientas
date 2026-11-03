import React, { useEffect, useState } from 'react';
import { EscenarioOrganico } from './components/EscenarioOrganico';
import { ModalExportar, type VideoLoop } from './components/ModalExportar';
import { exportarTarjetaMotion } from './lib/exportarTarjeta';
import { Quiosco, Tutorial, useTutorialVisto } from '../../shared/ui/Tutorial';
import '../../shared/ui/somos-kit.css';
import './styles.css';

const NOMBRE = 'Teatro de Papel';

export const App: React.FC = () => {
  const [blobTarjeta, setBlobTarjeta] = useState<Blob | null>(null);
  const [videoLoop, setVideoLoop] = useState<VideoLoop | null>(null);
  const [aviso, setAviso] = useState('');
  const [visto, marcarVisto] = useTutorialVisto('teatro');
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(''), 3500); return () => clearTimeout(t); }, [aviso]);

  useEffect(() => { document.documentElement.dataset.visual = 'Orgánica'; }, []);

  const exportarPng = async (canvas: HTMLCanvasElement) => {
    const blob = await exportarTarjetaMotion(canvas, NOMBRE, 'Lenguaje Orgánica');
    if (!blob) { setAviso('No se pudo crear la tarjeta. Inténtalo de nuevo.'); return; }
    setVideoLoop(null);
    setBlobTarjeta(blob);
  };

  if (!visto) return (
    <Tutorial etiqueta="Orgánica · animación" titulo="Teatro de Papel"
      pasos={[
        { icono: 'landscape', texto: 'Elige un escenario: cordillera, mar, desierto o bosque.' },
        { icono: 'pets', texto: 'Arrastra personajes y piezas al escenario.' },
        { icono: 'movie', texto: 'Dales un trayecto en la línea de tiempo y llévate el video.' },
      ]}
      acciones={[{ texto: 'Armar mi escena', icono: 'play_arrow', alTocar: marcarVisto }]} />
  );

  return (
    <>
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
      {aviso && <div className="aviso" role="status">{aviso}</div>}
      <Quiosco app="teatro" />
    </>
  );
};
