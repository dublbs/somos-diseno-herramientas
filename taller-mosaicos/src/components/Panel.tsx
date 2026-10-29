import React, { useRef, useEffect, useState } from 'react';
import {
  Formato,
  FORMATOS,
  FORMAS,
  HEX,
  Pincel,
  PALETAS,
  PaletaDef,
  girar,
  reflejarH,
  Celda,
} from '../data/formas';
import { pintarCelda } from './Lienzo';

interface PanelProps {
  formato: Formato;
  onCambiarFormato: (f: string) => void;
  herramienta: string;
  onCambiarHerramienta: (h: string) => void;
  pincel: Pincel;
  onCambiarPincel: (p: Pincel) => void;
  sel: { x: number; y: number; w: number; h: number } | null;
  onEjecutarOp: (op: string) => void;
  grilla: boolean;
  onToggleGrilla: (g: boolean) => void;
  onGenerar: () => void;
  onVaciar: () => void;
  onExportarPNG: () => void;
  onAplicarPaletaMosaico: (paleta: PaletaDef) => void;
  onInvertirMosaico: () => void;
  estadoMsg: string;
}

const Miniatura: React.FC<{
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

type Pestana = 'dibujar' | 'color' | 'formato';
const PESTANAS: { id: Pestana; label: string; icon: string }[] = [
  { id: 'dibujar', label: 'Dibujar', icon: 'draw' },
  { id: 'color', label: 'Color', icon: 'palette' },
  { id: 'formato', label: 'Formato', icon: 'grid_on' },
];

const OPERACIONES = [
  { op: 'repetir', label: 'Repetir', icon: 'repeat' },
  { op: 'escalonar', label: 'Escalonar', icon: 'stairs' },
  { op: 'derecha', label: 'Reflejar →', icon: 'flip' },
  { op: 'abajo', label: 'Reflejar ↓', icon: 'swap_vert' },
  { op: 'cuatro', label: 'Simetría 4', icon: 'grid_view' },
  { op: 'girar', label: 'Girar 90°', icon: 'rotate_90_degrees_cw' },
  { op: 'vaciar', label: 'Borrar área', icon: 'backspace' },
];

export const Panel: React.FC<PanelProps> = ({
  formato,
  onCambiarFormato,
  herramienta,
  onCambiarHerramienta,
  pincel,
  onCambiarPincel,
  sel,
  onEjecutarOp,
  grilla,
  onToggleGrilla,
  onGenerar,
  onVaciar,
  onExportarPNG,
  onAplicarPaletaMosaico,
  onInvertirMosaico,
  estadoMsg,
}) => {
  const [pestana, setPestana] = useState<Pestana>('dibujar');
  const [confirmarVaciar, setConfirmarVaciar] = useState(false);
  const temporizador = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  const handleVaciar = () => {
    window.clearTimeout(temporizador.current);
    if (confirmarVaciar) {
      setConfirmarVaciar(false);
      onVaciar();
    } else {
      setConfirmarVaciar(true);
      temporizador.current = window.setTimeout(() => setConfirmarVaciar(false), 3000);
    }
  };

  // La paleta y el invertir se aplican al diseño completo en el momento (y al pincel).
  const seleccionarPaleta = (p: PaletaDef) => onAplicarPaletaMosaico(p);

  const herramientasConfig = [
    { id: 'poner', label: 'Poner', icon: 'draw' },
    { id: 'girar', label: 'Girar', icon: 'rotate_right' },
    { id: 'reflejar', label: 'Reflejar', icon: 'flip' },
    { id: 'borrar', label: 'Borrar', icon: 'ink_eraser' },
    { id: 'seleccionar', label: 'Multiplicar', icon: 'highlight_alt' },
  ];

  return (
    <aside className="panel-app panel-mosaicos" aria-label="Herramientas">
      <div className="pestanas" role="tablist" aria-label="Secciones">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={`tab-${p.id}`}
            aria-selected={pestana === p.id}
            aria-controls={`pag-${p.id}`}
            onClick={() => setPestana(p.id)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      {pestana === 'dibujar' && (
        <div className="panel-pagina" role="tabpanel" id="pag-dibujar" aria-labelledby="tab-dibujar">
          <div className="herramientas" role="group" aria-label="Herramienta">
            {herramientasConfig.map((h) => (
              <button
                key={h.id}
                type="button"
                data-herramienta={h.id}
                aria-pressed={herramienta === h.id}
                onClick={() => onCambiarHerramienta(h.id)}
                className="btn-herramienta"
              >
                <span className="material-symbols-outlined" aria-hidden="true">{h.icon}</span>
                <span>{h.label}</span>
              </button>
            ))}
          </div>

          {herramienta === 'seleccionar' ? (
            <div className="operaciones" id="operaciones">
              <p className="seleccion" id="sel-info">
                {sel ? `Área: ${sel.w} × ${sel.h} celdas` : 'Arrastra sobre el mosaico para elegir un área.'}
              </p>
              <div className="ops">
                {OPERACIONES.map((o) => (
                  <button key={o.op} type="button" disabled={!sel} onClick={() => onEjecutarOp(o.op)}>
                    <span className="material-symbols-outlined" aria-hidden="true">{o.icon}</span>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="pincel-fila">
                <span className="etiqueta">Forma</span>
                <button
                  type="button"
                  className="btn-accion-pincel"
                  onClick={() => onCambiarPincel({ ...pincel, ...girar(pincel) })}
                  title="Girar forma 90° (tecla R)"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">rotate_right</span>
                  Girar
                </button>
                <button
                  type="button"
                  className="btn-accion-pincel"
                  onClick={() => onCambiarPincel({ ...pincel, ...reflejarH(pincel) })}
                  title="Reflejar horizontalmente"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">flip</span>
                  Reflejar
                </button>
              </div>
              <div className="pool" id="pool" role="radiogroup" aria-label="Formas geométricas">
                {FORMAS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className="item"
                    role="radio"
                    aria-checked={pincel.id === f.id}
                    aria-label={f.nombre}
                    title={`${f.nombre} · ${f.nota}`}
                    onClick={() => onCambiarPincel({ ...pincel, id: f.id })}
                  >
                    <Miniatura w={1} h={1} celdas={[{ x: 0, y: 0, f: f.id, r: pincel.r, e: pincel.e, c: pincel.c }]} tam={40} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {pestana === 'color' && (
        <div className="panel-pagina" role="tabpanel" id="pag-color" aria-labelledby="tab-color">
          <div className="etiqueta-fila">
            <span className="etiqueta">Paletas de color</span>
            <button
              type="button"
              className="btn-enlace"
              onClick={onInvertirMosaico}
              title="Invertir fondo y figura en todo el diseño"
            >
              <span className="material-symbols-outlined" aria-hidden="true">swap_horiz</span>
              Invertir
            </button>
          </div>
          <div className="paletas-grid" role="radiogroup" aria-label="Paletas de color">
            {PALETAS.map((p) => {
              const esActiva = pincel.c.f === p.f && pincel.c.a === p.a && pincel.c.b === p.b;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`paleta-btn ${esActiva ? 'activa' : ''}`}
                  role="radio"
                  aria-checked={esActiva}
                  onClick={() => seleccionarPaleta(p)}
                  title={`${p.nombre}: Fondo ${p.f}, Figura ${p.a}, Detalle ${p.b}`}
                >
                  <div className="paleta-muestras">
                    <span className="paleta-muestra" style={{ backgroundColor: HEX[p.f] }} />
                    <span className="paleta-muestra" style={{ backgroundColor: HEX[p.a] }} />
                    <span className="paleta-muestra" style={{ backgroundColor: HEX[p.b] }} />
                  </div>
                  <span className="paleta-nombre">{p.nombre}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {pestana === 'formato' && (
        <div className="panel-pagina" role="tabpanel" id="pag-formato" aria-labelledby="tab-formato">
          <span className="etiqueta">Formato de diseño</span>
          <div className="formatos" role="radiogroup" aria-label="Formato de diseño">
            {FORMATOS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={formato.id === f.id}
                onClick={() => onCambiarFormato(f.id)}
                className="formato-btn"
              >
                <span className="formato-icono" style={{ aspectRatio: `${f.cols} / ${f.filas}` }} aria-hidden="true" />
                <span>{f.nombre}</span>
              </button>
            ))}
          </div>
          <label className="check">
            <input type="checkbox" checked={grilla} onChange={(e) => onToggleGrilla(e.target.checked)} />
            <span className="material-symbols-outlined" aria-hidden="true">grid_on</span>
            Mostrar grilla
          </label>
        </div>
      )}

      <div className="panel-pie">
        {estadoMsg && <p className="estado" role="status">{estadoMsg}</p>}
        <button type="button" className="btn primario" onClick={onExportarPNG} id="btn-descargar-png">
          <span className="material-symbols-outlined" aria-hidden="true">download</span>
          Descargar imagen
        </button>
        <div className="pie-fila">
          <button type="button" className="btn secundario" onClick={onGenerar} id="btn-generar">
            <span className="material-symbols-outlined" aria-hidden="true">shuffle</span>
            Sorpréndeme
          </button>
          <button type="button" className="btn secundario" onClick={handleVaciar} id="btn-vaciar">
            <span className="material-symbols-outlined" aria-hidden="true">restart_alt</span>
            {confirmarVaciar ? '¿Seguro?' : 'Limpiar'}
          </button>
        </div>
      </div>
    </aside>
  );
};
