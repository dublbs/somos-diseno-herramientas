import React, { useRef, useEffect, useCallback } from 'react';
import { Formato, Celda, Pincel, forma, HEX, U, girar, reflejarH } from '../data/formas';

interface LienzoProps {
  formato: Formato;
  celdas: Record<string, Celda>;
  pincel: Pincel;
  herramienta: string;
  grilla: boolean;
  sel: { x: number; y: number; w: number; h: number } | null;
  onAplicar: (x: number, y: number) => void;
  onBorrar: (x: number, y: number) => void;
  onGirarPincel: () => void;
  onSetSel: (sel: { x: number; y: number; w: number; h: number } | null) => void;
  hover: { x: number; y: number } | null;
  setHover: (h: { x: number; y: number } | null) => void;
}

const cacheTrazos = new Map<string, Path2D>();
function trazo(d: string): Path2D {
  if (!cacheTrazos.has(d)) cacheTrazos.set(d, new Path2D(d));
  return cacheTrazos.get(d)!;
}

export function pintarCelda(
  ctx: CanvasRenderingContext2D,
  cel: Celda,
  X: number,
  Y: number,
  tam: number
) {
  ctx.fillStyle = HEX[cel.c.f] || HEX.Hueso;
  ctx.fillRect(X, Y, tam, tam);
  const fDef = forma(cel.f);
  const capas = fDef.capas;
  if (!capas.length) return;

  ctx.save();
  ctx.translate(X, Y);
  ctx.scale(tam / U, tam / U);
  ctx.translate(U / 2, U / 2);
  ctx.rotate((cel.r * Math.PI) / 2);
  if (cel.e) ctx.scale(-1, 1);
  ctx.translate(-U / 2, -U / 2);

  for (const [d, ranura] of capas) {
    ctx.fillStyle = HEX[cel.c[ranura]] || HEX.Negro;
    ctx.fill(trazo(d), 'evenodd');
  }
  ctx.restore();
}

export const Lienzo: React.FC<LienzoProps> = ({
  formato,
  celdas,
  pincel,
  herramienta,
  grilla,
  sel,
  onAplicar,
  onBorrar,
  onGirarPincel,
  onSetSel,
  hover,
  setHover,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const marcoRef = useRef<HTMLDivElement | null>(null);
  const arrastreRef = useRef<{ x: number; y: number } | null>(null);
  const ultimaRef = useRef<string>('');

  const celdasDelPincel = useCallback(() => {
    return {
      w: 1,
      h: 1,
      celdas: [{ x: 0, y: 0, f: pincel.id, r: pincel.r, e: pincel.e, c: { ...pincel.c } }],
    };
  }, [pincel]);

  const dentro = useCallback(
    (x: number, y: number) => x >= 0 && y >= 0 && x < formato.cols && y < formato.filas,
    [formato]
  );

  // Redibujar Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = formato.cols * formato.celda;
    const H = formato.filas * formato.celda;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }

    if (marcoRef.current) {
      // El marco se ajusta al espacio disponible (ancho y alto) con la proporción del formato: ver .lienzo-fit
      marcoRef.current.style.setProperty('--ratio', String(W / H));
    }

    const t = formato.celda;
    ctx.fillStyle = HEX.Hueso;
    ctx.fillRect(0, 0, W, H);

    for (const [clave, cel] of Object.entries(celdas)) {
      const [x, y] = clave.split(',').map(Number);
      if (dentro(x, y)) pintarCelda(ctx, cel, x * t, y * t, t);
    }

    if (grilla) {
      ctx.strokeStyle = 'rgba(0,0,0,.15)';
      ctx.lineWidth = Math.max(1.5, Math.round(t / 90));
      ctx.beginPath();
      for (let x = 1; x < formato.cols; x++) {
        ctx.moveTo(x * t, 0);
        ctx.lineTo(x * t, H);
      }
      for (let y = 1; y < formato.filas; y++) {
        ctx.moveTo(0, y * t);
        ctx.lineTo(W, y * t);
      }
      ctx.stroke();
    }

    const grosorBorde = Math.max(4, Math.round(t * 0.045));
    const mitadGrosor = grosorBorde / 2;
    const marcar = (x: number, y: number, w: number, h: number, color: string, guion?: boolean) => {
      ctx.save();
      ctx.lineWidth = grosorBorde;
      ctx.strokeStyle = color;
      if (guion) ctx.setLineDash([Math.round(t * 0.1), Math.round(t * 0.07)]);
      ctx.strokeRect(
        x * t + mitadGrosor,
        y * t + mitadGrosor,
        w * t - grosorBorde,
        h * t - grosorBorde
      );
      ctx.restore();
    };

    if (sel) {
      marcar(sel.x, sel.y, sel.w, sel.h, '#FFC20E', true);
    }

    if (hover && dentro(hover.x, hover.y)) {
      const { x, y } = hover;
      if (herramienta === 'poner') {
        const b = celdasDelPincel();
        ctx.globalAlpha = 0.75;
        b.celdas.forEach((c) => {
          if (dentro(x + c.x, y + c.y)) {
            pintarCelda(ctx, c, (x + c.x) * t, (y + c.y) * t, t);
          }
        });
        ctx.globalAlpha = 1;
        marcar(x, y, b.w, b.h, '#000000');
      } else if (herramienta !== 'seleccionar') {
        marcar(x, y, 1, 1, herramienta === 'borrar' ? '#E2001A' : '#000000');
      }
    }
  }, [formato, celdas, pincel, herramienta, grilla, sel, hover, celdasDelPincel, dentro]);

  const celdaDe = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const r = canvas.getBoundingClientRect();
      return {
        x: Math.floor(((e.clientX - r.left) / r.width) * formato.cols),
        y: Math.floor(((e.clientY - r.top) / r.height) * formato.filas),
      };
    },
    [formato]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = celdaDe(e);
    const canvas = canvasRef.current;
    if (canvas) canvas.setPointerCapture(e.pointerId);

    if (herramienta === 'seleccionar') {
      arrastreRef.current = c;
      onSetSel({ x: c.x, y: c.y, w: 1, h: 1 });
      return;
    }

    arrastreRef.current = c;
    ultimaRef.current = `${c.x},${c.y}`;
    onAplicar(c.x, c.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = celdaDe(e);
    setHover(e.pointerType === 'touch' ? null : c);

    if (arrastreRef.current && herramienta === 'seleccionar') {
      const x0 = Math.max(0, Math.min(arrastreRef.current.x, c.x));
      const y0 = Math.max(0, Math.min(arrastreRef.current.y, c.y));
      const x1 = Math.min(formato.cols - 1, Math.max(arrastreRef.current.x, c.x));
      const y1 = Math.min(formato.filas - 1, Math.max(arrastreRef.current.y, c.y));
      onSetSel({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
    } else if (
      arrastreRef.current &&
      `${c.x},${c.y}` !== ultimaRef.current &&
      ['poner', 'borrar'].includes(herramienta) &&
      celdasDelPincel().w === 1
    ) {
      ultimaRef.current = `${c.x},${c.y}`;
      onAplicar(c.x, c.y);
    }
  };

  const soltar = () => {
    arrastreRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const h = hover || { x: 0, y: 0 };
    const movMap: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const mov = movMap[e.key];
    if (mov) {
      e.preventDefault();
      setHover({
        x: Math.max(0, Math.min(formato.cols - 1, h.x + mov[0])),
        y: Math.max(0, Math.min(formato.filas - 1, h.y + mov[1])),
      });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAplicar(h.x, h.y);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onBorrar(h.x, h.y);
    } else if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      onGirarPincel();
    }
  };

  return (
    <div className="marco lienzo-fit" id="marco" ref={marcoRef}>
      <canvas
        id="lienzo"
        ref={canvasRef}
        tabIndex={0}
        role="img"
        aria-label={`Mosaico ${formato.nombre}, ${Object.keys(celdas).length} celdas pintadas`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onPointerLeave={() => {
          setHover(null);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (!hover) setHover({ x: 0, y: 0 });
        }}
      />
    </div>
  );
};
