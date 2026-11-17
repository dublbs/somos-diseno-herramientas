import React, { useRef, useEffect, useState } from 'react';
import { Formato, FORMATOS, FORMAS, HEX, Pincel, PALETAS, PaletaDef, Celda } from '../data/formas';
import { pintarCelda } from './Lienzo';
import { Boton, GrillaBiblioteca, Interruptor, Muestra, SeccionPanel, Segmento } from '../../../shared/ui/Herramienta';

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

  return <canvas ref={canvasRef} aria-hidden="true" />;
};

const OPERACIONES = [
  { op: 'repetir', label: 'Repetir', nombre: 'Repetir en todo el lienzo', icon: 'repeat' },
  { op: 'escalonar', label: 'Escalonar', nombre: 'Escalonar', icon: 'stairs' },
  { op: 'derecha', label: 'Espejo →', nombre: 'Reflejar hacia la derecha', icon: 'flip' },
  { op: 'abajo', label: 'Espejo ↓', nombre: 'Reflejar hacia abajo', icon: 'swap_vert' },
  { op: 'cuatro', label: 'Simetría ×4', nombre: 'Simetría en 4', icon: 'grid_view' },
  { op: 'girar', label: 'Girar área', nombre: 'Girar el área 90°', icon: 'rotate_90_degrees_cw' },
  { op: 'vaciar', label: 'Vaciar área', nombre: 'Borrar el área', icon: 'backspace' },
];
const CORTO: Record<string, string> = { cuadrado: '1:1', flyer: '4:5', historia: '9:16', horizontal: '16:9', modulo4: '4 × 4', modulo2: '2 × 2' };

interface PanelProps {
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

// Botón que pide un segundo toque para confirmar.
const LimpiarLienzo: React.FC<{ onConfirmar: () => void }> = ({ onConfirmar }) => {
  const [armado, setArmado] = useState(false);
  useEffect(() => { if (!armado) return; const id = setTimeout(() => setArmado(false), 2500); return () => clearTimeout(id); }, [armado]);
  return <Boton icono="restart_alt" texto={armado ? '¿Seguro? Toca otra vez' : 'Limpiar el lienzo'} variante="peligro" ancho
    onClick={() => { if (armado) { setArmado(false); onConfirmar(); } else setArmado(true); }} />;
};

// Panel derecho (plan 012): con Multiplicar, sus operaciones arriba; después el módulo (orientación y espejo: el único
// lugar donde se gira y refleja el módulo), la biblioteca, la paleta, el formato y el lienzo. Tiene scroll propio.
export const PanelMosaicos: React.FC<PanelProps> = ({
  formato, onCambiarFormato, herramienta, pincel, onCambiarPincel, sel, onEjecutarOp, grilla, onToggleGrilla, onVaciar, onAplicarPaletaMosaico, onInvertirMosaico,
}) => (
  <>
    {herramienta === 'seleccionar' && (
      <SeccionPanel titulo="Multiplicar" ayuda={sel ? `Área de ${sel.w} × ${sel.h} celdas.` : 'Arrastra sobre el mosaico para elegir un área.'}>
        <div className="ops" id="operaciones">
          {OPERACIONES.map((o) => (
            <Boton key={o.op} icono={o.icon} texto={o.label} etiqueta={o.nombre} disabled={!sel} onClick={() => onEjecutarOp(o.op)} />
          ))}
        </div>
      </SeccionPanel>
    )}

    <SeccionPanel titulo="Módulo" ayuda="Orientación y espejo del módulo que pones.">
      <Segmento etiqueta="Orientación del módulo" valor={pincel.r} onCambiar={(r) => onCambiarPincel({ ...pincel, r })}
          opciones={[0, 1, 2, 3].map((r) => ({
            valor: r, etiqueta: `${r * 90}°`,
            texto: <Miniatura w={1} h={1} celdas={[{ x: 0, y: 0, f: pincel.id, r, e: pincel.e, c: pincel.c }]} tam={30} />,
          }))} />
      <Interruptor texto="Espejo" activo={pincel.e} onCambiar={(e) => onCambiarPincel({ ...pincel, e })} />
    </SeccionPanel>

    <SeccionPanel titulo="Biblioteca">
      <GrillaBiblioteca etiqueta="Módulos geométricos" tam={48} columnas={5} elegido={pincel.id} onElegir={(id) => onCambiarPincel({ ...pincel, id })}
        elementos={FORMAS.map((f) => ({
          id: f.id, nombre: `${f.nombre} · ${f.nota}`,
          contenido: <Miniatura w={1} h={1} celdas={[{ x: 0, y: 0, f: f.id, r: pincel.r, e: pincel.e, c: pincel.c }]} tam={40} />,
        }))} />
    </SeccionPanel>

    <SeccionPanel titulo="Paleta">
      <div className="h-muestras paletas" role="radiogroup" aria-label="Paletas de color">
        {PALETAS.map((p) => (
          <Muestra key={p.id} nombre={`${p.nombre}: fondo ${p.f}, figura ${p.a}, detalle ${p.b}`}
            activa={pincel.c.f === p.f && pincel.c.a === p.a && pincel.c.b === p.b}
            color={`linear-gradient(135deg, ${HEX[p.f]} 0 40%, ${HEX[p.a]} 40% 72%, ${HEX[p.b]} 72%)`}
            onClick={() => onAplicarPaletaMosaico(p)} />
        ))}
      </div>
      <Boton icono="swap_horiz" texto="Invertir colores" ancho onClick={onInvertirMosaico} />
    </SeccionPanel>

    <SeccionPanel titulo="Formato">
      <div className="formatos" role="radiogroup" aria-label="Formato de diseño">
        {FORMATOS.map((f) => (
          <button key={f.id} type="button" role="radio" aria-checked={formato.id === f.id} aria-label={f.nombre} title={f.nombre} onClick={() => onCambiarFormato(f.id)} className="h-btn formato-btn">
            <span className="formato-icono" style={{ aspectRatio: `${f.cols} / ${f.filas}` }} aria-hidden="true" />
            {CORTO[f.id]}
          </button>
        ))}
      </div>
      <Interruptor texto="Mostrar grilla" activo={grilla} onCambiar={onToggleGrilla} />
    </SeccionPanel>

    <SeccionPanel titulo="Lienzo">
      <LimpiarLienzo onConfirmar={onVaciar} />
    </SeccionPanel>
  </>
);
