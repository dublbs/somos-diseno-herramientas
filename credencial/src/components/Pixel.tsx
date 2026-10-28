import React, { useEffect, useRef, useState } from 'react';
import { CARTA, pintarCara, pintarMarco, type Cara, type DatosCarta, type Recursos, type Retrato } from '../pixel/render';
import { personajeDe, TIMBRES, type Tema } from '../temas';
import { useImagenes } from '../lib/imagenes';

// Respiración del personaje: alterna 0/1 cada 450 ms. Con «reducir movimiento» queda quieto.
export function usePaso() {
  const [paso, setPaso] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setPaso(p => 1 - p), 450);
    return () => clearInterval(id);
  }, []);
  return paso;
}

// Las fuentes del lienzo (Bricolage) llegan después del primer dibujo: se vuelve a pintar al cargar.
function useFuentes() {
  const [listas, setListas] = useState(false);
  useEffect(() => {
    let vivo = true;
    Promise.all([document.fonts?.load('800 20px "Bricolage Grotesque"'), document.fonts?.load('700 20px "Bricolage Grotesque"')])
      .catch(() => null).then(() => vivo && setListas(true));
    return () => { vivo = false; };
  }, []);
  return listas;
}

// src de la imagen que va en el marco: la foto guardada o el SVG del personaje.
export const srcRetrato = (receta: Retrato, foto: string | null) =>
  receta.retrato === 'foto' ? foto : personajeDe(receta.id).src;

export function useRecursos(receta: Retrato, foto: string | null, tema: Tema): Recursos {
  const [retrato, ...timbres] = useImagenes([srcRetrato(receta, foto), ...TIMBRES[tema.visual].map(t => t.src)]);
  return { retrato, timbres };
}

// Lienzo que se dibuja a la resolución real del elemento.
function useLienzo(ancho: number, alto: number, pintar: (ctx: CanvasRenderingContext2D, s: number) => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [escala, setEscala] = useState(0);
  const fuentes = useFuentes();
  useEffect(() => {
    const c = ref.current!;
    const ro = new ResizeObserver(() => setEscala((c.clientWidth * Math.min(window.devicePixelRatio || 1, 3)) / ancho));
    ro.observe(c);
    return () => ro.disconnect();
  }, [ancho]);
  useEffect(() => {
    const c = ref.current!;
    if (!escala) return;
    const w = Math.round(ancho * escala), h = Math.round(alto * escala);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);
    pintar(ctx, escala);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escala, fuentes, ...deps]);
  return ref;
}

// Credencial (frente o álbum de timbres).
export const Carta: React.FC<{ datos: DatosCarta; recursos: Recursos; tema: Tema; cara?: Cara; className?: string }> = ({ datos, recursos, tema, cara = 'frente', className }) => {
  const paso = usePaso();
  const animado = cara === 'frente' && datos.receta.retrato === 'personaje' ? paso : 0;
  const ref = useLienzo(CARTA.ancho, CARTA.alto, (ctx, s) => pintarCara(ctx, cara, datos, recursos, tema, s, animado), [datos, recursos.retrato, ...recursos.timbres, tema, cara, animado]);
  return (
    <canvas ref={ref} className={className} role="img"
      aria-label={cara === 'album' ? `Álbum de timbres: ${datos.sellos.length} de 4` : `Credencial de ${datos.nombre}, ${datos.sellos.length} de 4 timbres`} />
  );
};

// Marco con la foto o el personaje adentro (vista previa al crear y miniaturas).
export const MarcoVivo: React.FC<{ marco: string; retrato: HTMLImageElement | null; modo: Retrato['retrato']; animado?: boolean; className?: string }> = ({ marco, retrato, modo, animado = true, className }) => {
  const paso = usePaso();
  const p = animado && modo === 'personaje' ? paso : 0;
  const ref = useLienzo(240, 240, (ctx, s) => pintarMarco(ctx, marco, s, retrato, modo, p), [marco, retrato, modo, p]);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
};
