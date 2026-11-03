import React, { useRef, useEffect } from 'react';
import { Formato, FORMATOS, FORMAS, HEX, Pincel, PALETAS, PaletaDef, girar, reflejarH, Celda } from '../data/formas';
import { pintarCelda } from './Lienzo';
import { BotonAccion, Confirmar, Interruptor, Seccion } from '../../../shared/ui/Kit';

export const Miniatura: React.FC<{
  w: number;
  h: number;
  celdas: (Celda & { x?: number; y?: number })[];
  tam?: number;
}> = ({ w, h, celdas, tam = 52 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2;
    const lado = tam / Math.max(w, h);
    const W = Math.round(w * lado);
    const H = Math.round(h * lado);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = HEX.Hueso;
    ctx.fillRect(0, 0, W, H);

    celdas.forEach((cel) => {
      const cx = (cel.x ?? 0) * lado;
      const cy = (cel.y ?? 0) * lado;
      pintarCelda(ctx, cel, cx, cy, lado);
    });
    ctx.restore();
  }, [w, h, celdas, tam]);

  return <canvas ref={canvasRef} />;
};

const OPERACIONES = [
  { op: 'repetir', label: 'Repetir', nombre: 'Repetir en todo el lienzo', icon: 'repeat' },
  { op: 'escalonar', label: 'Escalonar', nombre: 'Escalonar', icon: 'stairs' },
  { op: 'derecha', label: 'Espejo →', nombre: 'Reflejar hacia la derecha', icon: 'flip' },
  { op: 'abajo', label: 'Espejo ↓', nombre: 'Reflejar hacia abajo', icon: 'swap_vert' },
  { op: 'cuatro', label: 'Simetría', nombre: 'Simetría en 4', icon: 'grid_view' },
  { op: 'girar', label: 'Girar', nombre: 'Girar el área 90°', icon: 'rotate_90_degrees_cw' },
  { op: 'vaciar', label: 'Borrar', nombre: 'Borrar el área', icon: 'backspace' },
];
const CORTO: Record<string, string> = { cuadrado: '1:1', flyer: '4:5', historia: '9:16', horizontal: '16:9', modulo4: '4 × 4', modulo2: '2 × 2' };

interface LateralProps {
  formato: Formato;
  onCambiarFormato: (f: string) => void;
  herramienta: string;
  pincel: Pincel;
  onCambiarPincel: (p: Pincel) => void;
  sel: { x: number; y: number; w: number; h: number } | null;
  onEjecutarOp: (op: string) => void;
  grilla: boolean;
  onToggleGrilla: (g: boolean) => void;
  onVaciar: () => void;
  onAplicarPaletaMosaico: (paleta: PaletaDef) => void;
  onInvertirMosaico: () => void;
}

// Barra derecha (propuesta 005): biblioteca de módulos (u operaciones de Multiplicar), paleta y formato.
export const PanelLateral: React.FC<LateralProps> = ({
  formato, onCambiarFormato, herramienta, pincel, onCambiarPincel, sel, onEjecutarOp, grilla, onToggleGrilla, onVaciar, onAplicarPaletaMosaico, onInvertirMosaico,
}) => (
  <>
    {herramienta === 'seleccionar' ? (
      <Seccion titulo="Multiplicar" crece>
        <p className="k-ayuda" id="sel-info">{sel ? `Área: ${sel.w} × ${sel.h} celdas` : 'Arrastra sobre el mosaico para elegir un área.'}</p>
        <div className="ops" id="operaciones">
          {OPERACIONES.map((o) => (
            <button key={o.op} type="button" className="k-herr" disabled={!sel} aria-label={o.nombre} title={o.nombre} onClick={() => onEjecutarOp(o.op)}>
              <span className="material-symbols-outlined" aria-hidden="true">{o.icon}</span>
              {o.label}
            </button>
          ))}
        </div>
      </Seccion>
    ) : (
      <Seccion titulo="Módulos" crece>
        <div className="pool" id="pool" role="radiogroup" aria-label="Formas geométricas">
          {FORMAS.map((f) => (
            <button key={f.id} type="button" className="k-color item" role="radio" aria-checked={pincel.id === f.id} aria-label={f.nombre} title={`${f.nombre} · ${f.nota}`}
              onClick={() => onCambiarPincel({ ...pincel, id: f.id })}>
              <Miniatura w={1} h={1} celdas={[{ x: 0, y: 0, f: f.id, r: pincel.r, e: pincel.e, c: pincel.c }]} tam={36} />
            </button>
          ))}
        </div>
      </Seccion>
    )}

    <Seccion titulo="Paleta">
      <div className="paletas-grid" role="radiogroup" aria-label="Paletas de color">
        {PALETAS.map((p) => {
          const activa = pincel.c.f === p.f && pincel.c.a === p.a && pincel.c.b === p.b;
          return (
            <button key={p.id} type="button" className="k-color paleta-btn" role="radio" aria-checked={activa} aria-label={p.nombre}
              onClick={() => onAplicarPaletaMosaico(p)} title={`${p.nombre}: fondo ${p.f}, figura ${p.a}, detalle ${p.b}`}
              style={{ '--c': HEX[p.f], '--c2': HEX[p.a], '--c3': HEX[p.b] } as React.CSSProperties} />
          );
        })}
      </div>
      <BotonAccion icono="swap_horiz" texto="Invertir colores" onClick={onInvertirMosaico} />
    </Seccion>

    <Seccion titulo="Formato">
      <div className="formatos" role="radiogroup" aria-label="Formato de diseño">
        {FORMATOS.map((f) => (
          <button key={f.id} type="button" role="radio" aria-checked={formato.id === f.id} aria-label={f.nombre} title={f.nombre} onClick={() => onCambiarFormato(f.id)} className="k-btn formato-btn">
            <span className="formato-icono" style={{ aspectRatio: `${f.cols} / ${f.filas}` }} aria-hidden="true" />
            {CORTO[f.id]}
          </button>
        ))}
      </div>
      <Interruptor id="grilla" texto="Mostrar grilla" activo={grilla} onCambiar={onToggleGrilla} />
    </Seccion>

    <Confirmar icono="restart_alt" texto="Limpiar el lienzo" onConfirmar={onVaciar} />
  </>
);

// Barra inferior, a la derecha de las herramientas: el pincel actual con girar y reflejar.
export const PincelActual: React.FC<{ pincel: Pincel; onCambiarPincel: (p: Pincel) => void }> = ({ pincel, onCambiarPincel }) => (
  <div className="k-grupo pincel-actual" aria-label="Pincel">
    <span className="pincel-muestra" title="Pincel actual"><Miniatura w={1} h={1} celdas={[{ x: 0, y: 0, f: pincel.id, r: pincel.r, e: pincel.e, c: pincel.c }]} tam={44} /></span>
    <BotonAccion icono="rotate_right" texto="Girar" etiqueta="Girar la forma 90° (tecla R)" onClick={() => onCambiarPincel({ ...pincel, ...girar(pincel) })} />
    <BotonAccion icono="flip" texto="Reflejar" etiqueta="Reflejar la forma" onClick={() => onCambiarPincel({ ...pincel, ...reflejarH(pincel) })} />
  </div>
);
