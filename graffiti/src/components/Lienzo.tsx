import React, { useEffect, useRef } from 'react';
import { COLS, FILAS } from '../data/config';

interface Props {
  version: number;
  dibujar: (ctx: CanvasRenderingContext2D, ancho: number, alto: number) => void;
  alBajar: (x: number, y: number, fx: number, fy: number) => void;
  alMover: (x: number, y: number) => void;
  alSoltar: () => void;
  etiqueta: string;
  clase?: string;
}

// Lienzo horizontal (COLS × FILAS, 2:1): llena el LienzoAjustado del kit v2; aquí solo se ajusta la resolución y se
// traducen toques a celdas (con decimales: las manijas y los stickers usan la posición fina).
export const Lienzo: React.FC<Props> = ({ version, dibujar, alBajar, alMover, alSoltar, etiqueta, clase }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ancho, setAncho] = React.useState(0);
  const activo = useRef<number | null>(null);

  useEffect(() => {
    const c = ref.current!;
    const ro = new ResizeObserver(() => {
      const d = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(c.clientWidth * d);
      if (w && c.width !== w) { c.width = w; c.height = Math.round((w * FILAS) / COLS); setAncho(w); }
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = ref.current;
    if (c && c.width) dibujar(c.getContext('2d')!, c.width, c.height);
  }, [version, ancho, dibujar]);

  const celda = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const fx = Math.max(0, Math.min(COLS - 0.001, ((e.clientX - r.left) / r.width) * COLS));
    const fy = Math.max(0, Math.min(FILAS - 0.001, ((e.clientY - r.top) / r.height) * FILAS));
    return [Math.floor(fx), Math.floor(fy), fx, fy] as const;
  };

  return (
    <canvas
      ref={ref}
      className={'muro ' + (clase ?? '')}
      style={{ width: '100%', height: '100%' }}
      role="img"
      aria-label={etiqueta}
      onPointerDown={e => {
        if (!e.isPrimary || activo.current !== null) return; // el 2.º y 3.º dedo son gestos de deshacer y rehacer
        activo.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        alBajar(...celda(e));
      }}
      onPointerMove={e => { if (activo.current === e.pointerId) { const [x, y] = celda(e); alMover(x, y); } }}
      onPointerUp={e => { if (activo.current === e.pointerId) { activo.current = null; alSoltar(); } }}
      onPointerCancel={e => { if (activo.current === e.pointerId) { activo.current = null; alSoltar(); } }}
    />
  );
};
