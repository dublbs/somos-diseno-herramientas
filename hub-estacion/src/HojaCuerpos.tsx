import React, { useEffect, useRef } from 'react';
import { OPCIONES, cabeza } from './estacion/cuerpos';
import { precargar } from './estacion/imagenes';

// ?cuerpos · hoja de propuestas de cuerpos para los personajes de la Estación (3 por lenguaje), caminando en loop.
const CABEZAS = { Pixel: './figma/personajes/personaje-pixel.svg', Geométrica: './figma/personajes/personaje-geometrica.svg', Orgánica: './figma/personajes/personaje-organica.svg' } as const;
const QUIETO = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export const HojaCuerpos: React.FC = () => {
  const lienzos = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    precargar([...Object.values(CABEZAS), './figma/plaza/flor-propia.svg']).then(() => {
      const cuadro = (ahora: number) => {
        OPCIONES.forEach((o, i) => {
          const c = lienzos.current[i]; if (!c) return;
          const ctx = c.getContext('2d')!;
          ctx.setTransform(c.width / 200, 0, 0, c.height / 260, 0, 0);
          ctx.fillStyle = '#F4EEE3'; ctx.fillRect(0, 0, 200, 260);
          ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(100, 232, 46, 7, 0, 0, Math.PI * 2); ctx.fill();
          const cuello = o.dibujar(ctx, QUIETO ? 0.1 : ahora / 1000);
          cabeza(ctx, cuello, CABEZAS[o.lenguaje]);
        });
        if (!QUIETO) raf = requestAnimationFrame(cuadro);
      };
      raf = requestAnimationFrame(cuadro);
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <main className="hoja-cuerpos">
      <header>
        <a className="volver" href="./" aria-label="Volver a la Estación">←</a>
        <div><h1>Cuerpos para la Estación</h1><p>Propuesta: tres opciones por lenguaje. Todas llevan la misma cabeza (la foto o el personaje de la credencial).</p></div>
      </header>
      <div className="grilla-cuerpos">
        {OPCIONES.map((o, i) => (
          <figure key={o.id} className={'cuerpo-' + o.lenguaje.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()}>
            <canvas ref={el => { lienzos.current[i] = el; }} width={400} height={520} role="img" aria-label={`${o.nombre}, ${o.lenguaje}`} />
            <figcaption><span>{o.lenguaje} · {o.id.toUpperCase()}</span><b>{o.nombre}</b>{o.idea}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
};
