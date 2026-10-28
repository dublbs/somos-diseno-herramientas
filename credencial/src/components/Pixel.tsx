import React, { useEffect, useRef, useState } from 'react';
import { componer, ESPERA, FPS, N, type Receta } from '../pixel/generator';
import { HEX } from '../pixel/palette';
import { CARTA, DISENOS, pintarMarco, type Cara, type DatosCarta } from '../pixel/render';

// Reloj compartido de 12 fps (cuadro a cuadro). Con «reducir movimiento» queda quieto.
export function useCuadro() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setTick(t => t + 1), 1000 / FPS);
    return () => clearInterval(id);
  }, []);
  return ESPERA[tick % ESPERA.length];
}

// Credencial animada. Se dibuja a la resolución real del elemento (sin suavizado).
export const Carta: React.FC<{ datos: DatosCarta; diseno?: Cara; className?: string }> = ({ datos, diseno = 'frente', className }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const cuadro = useCuadro();
  const [escala, setEscala] = useState(2);
  useEffect(() => {
    const c = ref.current!;
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      setEscala(Math.max(1, (c.clientWidth * dpr) / CARTA.ancho));
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const c = ref.current!;
    const w = Math.round(CARTA.ancho * escala), h = Math.round(CARTA.alto * escala);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);
    (DISENOS.find(d => d.id === diseno) || DISENOS[0]).pintar(ctx, datos, cuadro, escala);
  }, [datos, cuadro, escala, diseno]);
  return (
    <canvas
      ref={ref}
      className={className}
      role="img"
      aria-label={diseno === 'foto' ? `Foto de ${datos.nombre} en su marco` : `Credencial de ${datos.nombre}, ${datos.sellos.length} de 4 sellos`}
    />
  );
};

// Vista fija y pequeña del personaje para los botones de partes. recorte acerca la vista a una zona.
export const Miniatura: React.FC<{ receta: Receta; recorte?: { x: number; y: number; w: number } | null; tam?: number }> = ({ receta, recorte, tam = 56 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const clave = JSON.stringify(receta);
  useEffect(() => {
    const c = ref.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const lado = Math.round(tam * dpr);
    c.width = c.height = lado;
    const ctx = c.getContext('2d')!;
    const { x = 0, y = 0, w = N } = recorte || {};
    const s = lado / w;
    ctx.fillStyle = HEX.Hueso;
    ctx.fillRect(0, 0, lado, lado);
    const celdas = componer(receta, 0);
    for (let i = 0; i < N * N; i++) {
      const col = celdas[i];
      if (!col) continue;
      const cx = (i % N) - x, cy = Math.floor(i / N) - y;
      if (cx < 0 || cy < 0 || cx >= w || cy >= w) continue;
      ctx.fillStyle = HEX[col];
      ctx.fillRect(Math.round(cx * s), Math.round(cy * s), Math.ceil(s), Math.ceil(s));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, recorte, tam]);
  return <canvas ref={ref} style={{ width: tam, height: tam }} aria-hidden="true" />;
};

// Marco con el personaje (o la foto) adentro, animado y a la resolución real del elemento.
export const MarcoVivo: React.FC<{ marco: string; receta: Receta; foto?: DatosCarta['foto']; animado?: boolean; className?: string }> = ({ marco, receta, foto, animado = true, className }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const cuadro = useCuadro();
  const [lado, setLado] = useState(0);
  useEffect(() => {
    const c = ref.current!;
    const ro = new ResizeObserver(() => setLado(Math.round(c.clientWidth * Math.min(window.devicePixelRatio || 1, 3))));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);
  const paso = animado && !foto ? cuadro : 0;
  useEffect(() => {
    const c = ref.current!;
    if (!lado) return;
    if (c.width !== lado) { c.width = c.height = lado; }
    pintarMarco(c.getContext('2d')!, marco, foto ? null : componer(receta, paso), lado / 240, foto);
  }, [marco, receta, foto, paso, lado]);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
};
