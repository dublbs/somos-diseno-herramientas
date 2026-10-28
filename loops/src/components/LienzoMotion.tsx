import React, { useRef, useEffect } from 'react';
import { VisualModo } from '../data/paletas';
import { ModoPixel, PixelParams } from '../modos/ModoPixel';
import { ModoGeometrica, GeometricaParams } from '../modos/ModoGeometrica';
import { ModoOrganica, OrganicaParams } from '../modos/ModoOrganica';

interface LienzoMotionProps {
  modo: VisualModo;
  fps: number;
  pausado: boolean;
  pixelParams: PixelParams;
  geometricaParams: GeometricaParams;
  organicaParams: OrganicaParams;
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void;
}

export const LienzoMotion: React.FC<LienzoMotionProps> = ({
  modo,
  fps,
  pausado,
  pixelParams,
  geometricaParams,
  organicaParams,
  onCanvasRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const motorPixel = useRef<ModoPixel>(new ModoPixel());
  const motorGeometrica = useRef<ModoGeometrica>(new ModoGeometrica());
  const motorOrganica = useRef<ModoOrganica>(new ModoOrganica());

  useEffect(() => {
    if (onCanvasRef) onCanvasRef(canvasRef.current);
  }, [onCanvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let ultimoTiempo = 0;
    const intervaloFrame = 1000 / fps;

    const animar = (tiempoActual: number) => {
      animId = requestAnimationFrame(animar);
      if (pausado) return;

      const delta = tiempoActual - ultimoTiempo;
      if (delta >= intervaloFrame) {
        ultimoTiempo = tiempoActual - (delta % intervaloFrame);

        // Renderizado del modo activo
        if (modo === 'pixel') {
          motorPixel.current.render(ctx, canvas.width, canvas.height, pixelParams);
        } else if (modo === 'geometrica') {
          motorGeometrica.current.render(ctx, canvas.width, canvas.height, geometricaParams);
        } else {
          motorOrganica.current.render(ctx, canvas.width, canvas.height, organicaParams);
        }
      }
    };

    animId = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(animId);
  }, [modo, fps, pausado, pixelParams, geometricaParams, organicaParams]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (modo === 'pixel') {
      motorPixel.current.dispararSalto();
      motorPixel.current.agregarEstrella(x, y);
    } else if (modo === 'geometrica') {
      motorGeometrica.current.setTouchOffset(x, y);
    } else {
      motorOrganica.current.jalarCuerda();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons > 0 && modo === 'geometrica' && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvasRef.current.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvasRef.current.height;
      motorGeometrica.current.setTouchOffset(x, y);
    }
  };

  const handlePointerUp = () => {
    if (modo === 'geometrica') {
      motorGeometrica.current.resetTouch();
    }
  };

  return (
    <div className="lienzo-marco">
      <canvas
        ref={canvasRef}
        width={720}
        height={720}
        className="canvas-motion"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <div className="pista-tactil">
        <span>
          {modo === 'pixel'
            ? 'Toca para saltar y soltar estrellas'
            : modo === 'geometrica'
            ? 'Arrastra para mover el centro del caleidoscopio'
            : 'Toca para jalar la cuerda de la marioneta'}
        </span>
      </div>
    </div>
  );
};
