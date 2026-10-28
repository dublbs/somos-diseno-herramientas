import React, { useRef, useEffect, useCallback } from 'react';
import { AjustesPixeles } from '../data/paletas';
import { cropRect } from '../lib/muestreo';

interface SourceDropProps {
  srcCanvas: HTMLCanvasElement | null;
  srcName: string;
  srcDim: { w: number; h: number } | null;
  settings: AjustesPixeles;
  onUpdateSettings: (updater: (prev: AjustesPixeles) => AjustesPixeles) => void;
  onLoadImage: (f: File) => void;
}

export const SourceDrop: React.FC<SourceDropProps> = ({
  srcCanvas,
  srcName,
  srcDim,
  settings,
  onUpdateSettings,
  onLoadImage,
}) => {
  const dropRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const viewSRef = useRef<number>(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const redraw = useCallback(() => {
    if (!srcCanvas || !canvasRef.current || !dropRef.current) return;
    const drop = dropRef.current;
    const sc = canvasRef.current;
    const W = Math.max(200, Math.round(drop.clientWidth));
    const dpr = window.devicePixelRatio || 1;
    const H = Math.round(Math.min(W * 0.6, Math.max(220, (W * srcCanvas.height) / srcCanvas.width)));

    sc.style.height = `${H}px`;
    sc.width = Math.round(W * dpr);
    sc.height = Math.round(H * dpr);

    const ctx = sc.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const s = Math.min(W / srcCanvas.width, H / srcCanvas.height);
    const ox = (W - srcCanvas.width * s) / 2;
    const oy = (H - srcCanvas.height * s) / 2;
    viewSRef.current = s;

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(srcCanvas, ox, oy, srcCanvas.width * s, srcCanvas.height * s);

    if (settings.frame === 'crop') {
      const r = cropRect(srcCanvas, settings);
      const rx = ox + r.x * s;
      const ry = oy + r.y * s;
      const rs = r.side * s;
      ctx.fillStyle = 'rgba(10,12,20,.55)';
      ctx.beginPath();
      ctx.rect(ox, oy, srcCanvas.width * s, srcCanvas.height * s);
      ctx.rect(rx, ry, rs, rs);
      ctx.fill('evenodd');

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rx + 0.75, ry + 0.75, rs - 1.5, rs - 1.5);
    }
  }, [srcCanvas, settings]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    if (!dropRef.current) return;
    const ro = new ResizeObserver(() => redraw());
    ro.observe(dropRef.current);
    return () => ro.disconnect();
  }, [redraw]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (settings.frame !== 'crop' || !srcCanvas) return;
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      cx: settings.cx,
      cy: settings.cy,
    };
    dropRef.current?.classList.add('dragging');
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || !srcCanvas) return;
    const dx = (e.clientX - dragRef.current.x) / viewSRef.current / srcCanvas.width;
    const dy = (e.clientY - dragRef.current.y) / viewSRef.current / srcCanvas.height;
    const ncx = dragRef.current.cx + dx;
    const ncy = dragRef.current.cy + dy;

    onUpdateSettings((prev) => ({
      ...prev,
      cx: ncx,
      cy: ncy,
    }));
  };

  const endDrag = () => {
    dragRef.current = null;
    dropRef.current?.classList.remove('dragging');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dropRef.current?.classList.remove('over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onLoadImage(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="source panel">
      <div className="source-head">
        <label className="btn" htmlFor="file">
          Elegir otra imagen…
          <input
            type="file"
            id="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onLoadImage(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
        </label>
        <span className="source-meta" id="srcMeta">
          {srcDim ? `${srcName} · ${srcDim.w}×${srcDim.h}` : srcName}
        </span>
      </div>

      <div
        className="drop"
        id="drop"
        ref={dropRef}
        onDragEnter={(e) => {
          e.preventDefault();
          dropRef.current?.classList.add('over');
        }}
        onDragOver={(e) => {
          e.preventDefault();
          dropRef.current?.classList.add('over');
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dropRef.current?.classList.remove('over');
        }}
        onDrop={handleDrop}
      >
        <canvas
          id="srcCanvas"
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      </div>
      <p className="hint">
        {settings.frame === 'crop'
          ? 'Arrastra sobre la imagen para mover el encuadre. También puedes pegar una imagen (Ctrl/Cmd+V).'
          : 'Encuadre ajustado al módulo. Puedes pegar una imagen con Ctrl/Cmd+V.'}
      </p>
    </div>
  );
};
