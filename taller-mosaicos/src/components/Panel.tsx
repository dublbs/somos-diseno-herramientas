import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Formato, FORMATOS, FORMAS, HEX, Pincel, PALETAS, PaletaDef, Celda, girar, reflejarH, reflejarV } from '../data/formas';
import { pintarCelda } from './Lienzo';
import { Boton, GrillaBiblioteca, Interruptor, Muestra, SeccionPanel, Segmento } from '../../../shared/ui/Herramienta';

export const Miniatura: React.FC<{
  w: number;
  h: number;
  celdas: (Celda & { x?: number; y?: number })[];
  tam?: number;
  // Rectángulo punteado (en celdas) que marca el área original en las vistas previas de Multiplicar.
  marco?: { x: number; y: number; w: number; h: number };
}> = ({ w, h, celdas, tam = 52, marco }) => {
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
    if (marco) {
      ctx.strokeStyle = '#FFC20E';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(marco.x * lado + 1, marco.y * lado + 1, marco.w * lado - 2, marco.h * lado - 2);
    }
    ctx.restore();
  }, [w, h, celdas, tam, marco]);

  return <canvas ref={canvasRef} aria-hidden="true" />;
};

// T-007: «Multiplicar» es lo único que convierte un módulo en patrón, así que se queda y cada operación muestra en su
// botón cómo queda el área elegida (o un ejemplo con el módulo del pincel, si aún no hay área). «Vaciar área» se quitó:
// es lo mismo que arrastrar con Borrar.
const OPERACIONES = [
  { op: 'repetir', label: 'Repetir', nombre: 'Repetir el área en todo el lienzo' },
  { op: 'escalonar', label: 'Escalonar', nombre: 'Repetir el área en filas corridas' },
  { op: 'derecha', label: 'Espejo →', nombre: 'Reflejar el área hacia la derecha' },
  { op: 'abajo', label: 'Espejo ↓', nombre: 'Reflejar el área hacia abajo' },
  { op: 'cuatro', label: 'Simetría ×4', nombre: 'Reflejar el área en 4' },
  { op: 'girar', label: 'Girar área', nombre: 'Girar el área 90°' },
];

export type BloqueSel = { x: number; y: number; cel: Celda | null }[];
type Previa = { w: number; h: number; celdas: (Celda & { x: number; y: number })[]; marco: { x: number; y: number; w: number; h: number } };

// Calcula, en chico, lo mismo que hace cada operación de App.tsx con el área. El área original va marcada con el
// punteado amarillo de la selección (arriba a la izquierda, o al centro en Repetir y Escalonar).
function vistaPrevia(op: string, w: number, h: number, bloque: BloqueSel): Previa {
  const celdas: Previa['celdas'] = [];
  const poner = (X: number, Y: number, cel: Celda | null, W: number, H: number) => {
    if (cel && X >= 0 && Y >= 0 && X < W && Y < H) celdas.push({ ...cel, x: X, y: Y });
  };
  switch (op) {
    case 'repetir': {
      for (let ty = 0; ty < 3; ty++) for (let tx = 0; tx < 3; tx++) bloque.forEach(({ x, y, cel }) => poner(tx * w + x, ty * h + y, cel, 3 * w, 3 * h));
      return { w: 3 * w, h: 3 * h, celdas, marco: { x: w, y: h, w, h } };
    }
    case 'escalonar': {
      // Como en App.tsx: cada fila de bloques se corre una celda más que la anterior.
      for (let fila = 0; fila < 3; fila++) {
        const corr = (((fila - 1) % w) + w) % w;
        for (let ox = -2 * w + corr; ox < 3 * w; ox += w) bloque.forEach(({ x, y, cel }) => poner(ox + x, fila * h + y, cel, 3 * w, 3 * h));
      }
      return { w: 3 * w, h: 3 * h, celdas, marco: { x: w, y: h, w, h } };
    }
    case 'derecha': {
      bloque.forEach(({ x, y, cel }) => { poner(x, y, cel, 2 * w, h); poner(2 * w - 1 - x, y, cel && { ...cel, ...reflejarH(cel) }, 2 * w, h); });
      return { w: 2 * w, h, celdas, marco: { x: 0, y: 0, w, h } };
    }
    case 'abajo': {
      bloque.forEach(({ x, y, cel }) => { poner(x, y, cel, w, 2 * h); poner(x, 2 * h - 1 - y, cel && { ...cel, ...reflejarV(cel) }, w, 2 * h); });
      return { w, h: 2 * h, celdas, marco: { x: 0, y: 0, w, h } };
    }
    case 'cuatro': {
      const W = 2 * w, H = 2 * h;
      bloque.forEach(({ x, y, cel }) => {
        const der = cel && { ...cel, ...reflejarH(cel) };
        poner(x, y, cel, W, H);
        poner(W - 1 - x, y, der, W, H);
        poner(x, H - 1 - y, cel && { ...cel, ...reflejarV(cel) }, W, H);
        poner(W - 1 - x, H - 1 - y, der && { ...der, ...reflejarV(der) }, W, H);
      });
      return { w: W, h: H, celdas, marco: { x: 0, y: 0, w, h } };
    }
    default: { // girar
      bloque.forEach(({ x, y, cel }) => poner(h - 1 - y, x, cel && { ...cel, ...girar(cel) }, h, w));
      return { w: h, h: w, celdas, marco: { x: 0, y: 0, w: h, h: w } };
    }
  }
}

// Ejemplo de 2 × 2 con el módulo del pincel en una esquina: basta para ver qué hace cada operación antes de elegir área.
function bloqueEjemplo(pincel: Pincel): BloqueSel {
  const cel: Celda = { f: pincel.id === 'vacia' || pincel.id === 'llena' ? 'media' : pincel.id, r: pincel.r, e: pincel.e, c: { ...pincel.c } };
  return [{ x: 0, y: 0, cel }, { x: 1, y: 0, cel: null }, { x: 0, y: 1, cel: null }, { x: 1, y: 1, cel: null }];
}

type Area = { x: number; y: number; w: number; h: number } | null;
const OperacionesMultiplicar: React.FC<{ sel: Area; bloque: BloqueSel | null; pincel: Pincel; onEjecutarOp: (op: string) => void }> =
  ({ sel, bloque, pincel, onEjecutarOp }) => {
    const conContenido = !!(sel && bloque && bloque.some((b) => b.cel));
    const previas = useMemo(() => (conContenido && sel && bloque
      ? OPERACIONES.map((o) => vistaPrevia(o.op, sel.w, sel.h, bloque))
      : OPERACIONES.map((o) => vistaPrevia(o.op, 2, 2, bloqueEjemplo(pincel)))), [conContenido, sel, bloque, pincel]);
    return (
      <div className="ops" id="operaciones">
        {OPERACIONES.map((o, i) => (
          <button key={o.op} type="button" className="h-btn op-btn" aria-label={o.nombre} title={o.nombre} disabled={!sel} onClick={() => onEjecutarOp(o.op)}>
            <span className="op-previa" aria-hidden="true"><Miniatura w={previas[i].w} h={previas[i].h} celdas={previas[i].celdas} marco={previas[i].marco} tam={56} /></span>
            <span className="h-btn-texto">{o.label}</span>
          </button>
        ))}
      </div>
    );
  };
const CORTO: Record<string, string> = { cuadrado: '1:1', flyer: '4:5', historia: '9:16', horizontal: '16:9', modulo4: '4 × 4', modulo2: '2 × 2' };

interface PanelProps {
  formato: Formato;
  onCambiarFormato: (f: string) => void;
  herramienta: string;
  pincel: Pincel;
  onCambiarPincel: (p: Pincel) => void;
  sel: { x: number; y: number; w: number; h: number } | null;
  bloqueSel: BloqueSel | null;
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
  formato, onCambiarFormato, herramienta, pincel, onCambiarPincel, sel, bloqueSel, onEjecutarOp, grilla, onToggleGrilla, onVaciar, onAplicarPaletaMosaico, onInvertirMosaico,
}) => (
  <>
    {herramienta === 'seleccionar' && (
      <SeccionPanel titulo="Multiplicar" ayuda={sel
        ? `Área de ${sel.w} × ${sel.h} celdas. Cada botón muestra cómo quedará; el punteado es tu área.`
        : 'Convierte un área en patrón. Arrastra sobre el mosaico para elegirla; los botones muestran un ejemplo.'}>
        <OperacionesMultiplicar sel={sel} bloque={bloqueSel} pincel={pincel} onEjecutarOp={onEjecutarOp} />
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
