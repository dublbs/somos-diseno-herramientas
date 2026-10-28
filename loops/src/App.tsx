import React, { useState, useRef } from 'react';
import { VisualModo, MODOS } from './data/paletas';
import { PixelParams } from './modos/ModoPixel';
import { GeometricaParams } from './modos/ModoGeometrica';
import { OrganicaParams } from './modos/ModoOrganica';
import { LienzoMotion } from './components/LienzoMotion';
import { BarraModos } from './components/BarraModos';
import { ControlesMotion } from './components/ControlesMotion';
import { ModalExportar } from './components/ModalExportar';
import { exportarTarjetaMotion } from './lib/exportarTarjeta';
import './styles.css';

export const App: React.FC = () => {
  const [modo, setModo] = useState<VisualModo>('pixel');
  const [fps, setFps] = useState<number>(12); // 12 FPS stop-motion por defecto
  const [pausado, setPausado] = useState<boolean>(false);
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);

  // Parámetros específicos por modo
  const [pixelParams, setPixelParams] = useState<PixelParams>({
    velocidad: 2,
    alturaSalto: 45,
    densidadMonedas: 2,
    colorTinta: 'azul',
  });

  const [geometricaParams, setGeometricaParams] = useState<GeometricaParams>({
    simetria: 8,
    velocidadGiro: 2,
    zoomPatron: 1.4,
    variante: 'damero',
    paleta: 'azul-rosa',
  });

  const [organicaParams, setOrganicaParams] = useState<OrganicaParams>({
    balanceo: 2,
    floracion: 1.1,
    texturaPapel: true,
    colorPrincipal: 'verde',
  });

  // Modal de exportación
  const [blobTarjeta, setBlobTarjeta] = useState<Blob | null>(null);
  const [generando, setGenerando] = useState<boolean>(false);

  const configActual = MODOS.find((m) => m.id === modo)!;

  const handleExportar = async () => {
    if (!canvasElement || generando) return;
    setGenerando(true);
    try {
      const blob = await exportarTarjetaMotion(
        canvasElement,
        configActual.nombre,
        configActual.subtitulo
      );
      setBlobTarjeta(blob);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="app-motion" data-modo={modo}>
      <header className="header-motion">
        <a className="volver" href="../../" id="volver-hub">
          <span aria-hidden="true">←</span> Experiencias
        </a>

        <div className="header-info">
          <span className="eyebrow">Somos Diseño · Mesa 4 · Estación Transversal</span>
          <h1>Estación de Loops</h1>
        </div>
      </header>

      {/* Selector de Modos */}
      <BarraModos
        modoActual={modo}
        onCambiarModo={setModo}
        fps={fps}
        onCambiarFps={setFps}
        pausado={pausado}
        onTogglePausa={() => setPausado((p) => !p)}
      />

      {/* Área Principal: Canvas interactivo + Panel de controles */}
      <div className="layout-motion">
        <section className="zona-lienzo">
          <LienzoMotion
            modo={modo}
            fps={fps}
            pausado={pausado}
            pixelParams={pixelParams}
            geometricaParams={geometricaParams}
            organicaParams={organicaParams}
            onCanvasRef={setCanvasElement}
          />
        </section>

        <aside className="zona-controles">
          <ControlesMotion
            modo={modo}
            pixelParams={pixelParams}
            onChangePixel={setPixelParams}
            geometricaParams={geometricaParams}
            onChangeGeometrica={setGeometricaParams}
            organicaParams={organicaParams}
            onChangeOrganica={setOrganicaParams}
            onExportar={handleExportar}
          />
        </aside>
      </div>

      {blobTarjeta && (
        <ModalExportar
          blobTarjeta={blobTarjeta}
          onCerrar={() => setBlobTarjeta(null)}
          nombreModo={configActual.nombre}
        />
      )}
    </div>
  );
};
