import React, { useRef, useEffect } from 'react';
import { DatosFree } from '../lib/cuantizarFree';
import { AjustesPixeles } from '../data/paletas';

interface ResultadoFreeProps {
  res32: DatosFree | null;
  res64: DatosFree | null;
  settings: AjustesPixeles;
  srcName: string;
  onSetStatus: (msg: string) => void;
  onShowFallback: (title: string, hint: string, data: { img?: string; text?: string }) => void;
}

const CardResolucion: React.FC<{
  resultado: DatosFree | null;
  grid: boolean;
  srcName: string;
  onSetStatus: (msg: string) => void;
}> = ({ resultado, grid, srcName, onSetStatus }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!resultado || !canvasRef.current) return;
    const { N, idx, pal } = resultado;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const small = document.createElement('canvas');
    small.width = small.height = N;
    const sx = small.getContext('2d')!;
    const im = sx.createImageData(N, N);
    for (let p = 0; p < N * N; p++) {
      const v = idx[p];
      if (v < 0) continue;
      const c = pal[v];
      im.data[p * 4] = c.r;
      im.data[p * 4 + 1] = c.g;
      im.data[p * 4 + 2] = c.b;
      im.data[p * 4 + 3] = 255;
    }
    sx.putImageData(im, 0, 0);

    ctx.clearRect(0, 0, 640, 640);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, 640, 640);

    if (grid) {
      const s = 640 / N;
      ctx.strokeStyle = 'rgba(128,128,140,.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < N; i++) {
        const v = Math.round(i * s) + 0.5;
        ctx.moveTo(v, 0);
        ctx.lineTo(v, 640);
        ctx.moveTo(0, v);
        ctx.lineTo(640, v);
      }
      ctx.stroke();
    }
  }, [resultado, grid]);

  if (!resultado) {
    return <div className="card panel"><p>Procesando…</p></div>;
  }

  const { N, idx, pal, counts } = resultado;
  const used = pal
    .map((c, i) => ({ c, n: counts[i] }))
    .filter((e) => e.n > 0)
    .sort((a, b) => b.n - a.n);

  const totalPx = counts.reduce((a, b) => a + b, 0);

  const descargarPNG = (k: number) => {
    const c = document.createElement('canvas');
    c.width = c.height = N * k;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    // Dibujar directamente en el canvas exportado
    const small = document.createElement('canvas');
    small.width = small.height = N;
    const sx = small.getContext('2d')!;
    const im = sx.createImageData(N, N);
    for (let p = 0; p < N * N; p++) {
      const v = idx[p];
      if (v < 0) continue;
      const col = pal[v];
      im.data[p * 4] = col.r;
      im.data[p * 4 + 1] = col.g;
      im.data[p * 4 + 2] = col.b;
      im.data[p * 4 + 3] = 255;
    }
    sx.putImageData(im, 0, 0);

    ctx.drawImage(small, 0, 0, N * k, N * k);
    const nombre = `${srcName}-${N}x${N}${k > 1 ? '@' + k + 'x' : ''}.png`;

    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      onSetStatus(`PNG guardado: ${nombre}`);
    }, 'image/png');
  };

  return (
    <div className="card panel">
      <div className="card-head">
        <h2>{`${N} × ${N}`}</h2>
        <span className="meta">{`${used.length} colores · ${totalPx.toLocaleString('es-CL')} px`}</span>
      </div>

      <div className="stage">
        <canvas ref={canvasRef} width="640" height="640" />
      </div>

      <div className="swatches">
        {used.map((e, idxKey) => (
          <i
            key={idxKey}
            style={{ background: e.c.hex }}
            title={`${e.c.name ? e.c.name + ' ' : ''}${e.c.hex} · ${e.n} px`}
          />
        ))}
      </div>

      <div className="actions">
        <button type="button" onClick={() => descargarPNG(1)}>
          PNG 1× ({N})
        </button>
        <button type="button" onClick={() => descargarPNG(N === 32 ? 16 : 8)}>
          PNG {N === 32 ? '16× (512)' : '8× (512)'}
        </button>
      </div>
    </div>
  );
};

export const ResultadoFree: React.FC<ResultadoFreeProps> = ({
  res32,
  res64,
  settings,
  srcName,
  onSetStatus,
}) => {
  return (
    <div className="results" id="freeResults">
      <CardResolucion
        resultado={res32}
        grid={settings.grid}
        srcName={srcName}
        onSetStatus={onSetStatus}
      />
      <CardResolucion
        resultado={res64}
        grid={settings.grid}
        srcName={srcName}
        onSetStatus={onSetStatus}
      />
    </div>
  );
};
