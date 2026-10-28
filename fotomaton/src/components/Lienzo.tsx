import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';

interface Props {
  cref?: RefObject<HTMLCanvasElement>;
  dibujar?: (ctx: CanvasRenderingContext2D, size: number) => void;
  deps?: unknown[];
  children?: ReactNode;
}

export function Lienzo({ cref, dibujar, deps = [], children }: Props) {
  const propio = useRef<HTMLCanvasElement>(null);
  const ref = cref ?? propio;
  const [tam, setTam] = useState(0);
  useEffect(() => {
    const c = ref.current!;
    const ro = new ResizeObserver(() => {
      const d = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(c.clientWidth * d);
      if (w && c.width !== w) { c.width = c.height = w; setTam(w); }
    });
    ro.observe(c); return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const c = ref.current;
    if (dibujar && c && c.width) dibujar(c.getContext('2d')!, c.width);
  }, [tam, ...deps]);
  return <div className="lienzo-wrap"><canvas ref={ref}></canvas>{children}</div>;
}
