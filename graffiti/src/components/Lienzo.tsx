import React, { useEffect, useRef } from 'react';
import { COLS, FILAS } from '../data/config';

interface Props {
  version: number;
  dibujar: (ctx: CanvasRenderingContext2D, lado: number) => void;
  alBajar: (x: number, y: number) => void;
  alMover: (x: number, y: number) => void;
  alSoltar: () => void;
  etiqueta: string;
}

// Lienzo cuadrado: el tamaño lo da .lienzo-fit (CSS); aquí solo se ajusta la resolución y se traducen toques a celdas.
export const Lienzo: React.FC<Props> = ({ version, dibujar, alBajar, alMover, alSoltar, etiqueta }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [lado, setLado] = React.useState(0);
  const activo = useRef<number | null>(null);

  useEffect(() => {
    const c = ref.current!;
    const ro = new ResizeObserver(() => {
      const d = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(c.clientWidth * d);
      if (w && c.width !== w) { c.width = c.height = w; setLado(w); }
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = ref.current;
    if (c && c.width) dibujar(c.getContext('2d')!, c.width);
  }, [version, lado, dibujar]);

  const celda = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return [
      Math.max(0, Math.min(COLS - 1, Math.floor(((e.clientX - r.left) / r.width) * COLS))),
      Math.max(0, Math.min(FILAS - 1, Math.floor(((e.clientY - r.top) / r.height) * FILAS))),
    ] as const;
  };

  return (
    <canvas
      ref={ref}
      className="muro"
      role="img"
      aria-label={etiqueta}
      onPointerDown={e => {
        if (activo.current !== null) return;
        activo.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        alBajar(...celda(e));
      }}
      onPointerMove={e => { if (activo.current === e.pointerId) alMover(...celda(e)); }}
      onPointerUp={e => { if (activo.current === e.pointerId) { activo.current = null; alSoltar(); } }}
      onPointerCancel={e => { if (activo.current === e.pointerId) { activo.current = null; alSoltar(); } }}
    />
  );
};
