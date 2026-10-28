import React, { useRef, useEffect } from 'react';
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
  estadoMsg,
}) => {
  const [confirmarVaciar, setConfirmarVaciar] = React.useState(false);

  const handleVaciar = () => {
    if (confirmarVaciar) {
      setConfirmarVaciar(false);
      onVaciar();
    } else {
      setConfirmarVaciar(true);
      setTimeout(() => setConfirmarVaciar(false), 3000);
    }
  };

  const seleccionarPaleta = (p: PaletaDef) => {
    onCambiarPincel({
      ...pincel,
      c: { f: p.f, a: p.a, b: p.b },
    });
  };

  const paletaActiva = PALETAS.find(
    (p) => p.f === pincel.c.f && p.a === pincel.c.a && p.b === pincel.c.b
  );

  const herramientasConfig = [
    { id: 'poner', label: 'Poner', icon: 'draw' },
    { id: 'girar', label: 'Girar', icon: 'rotate_right' },
    { id: 'reflejar', label: 'Reflejar', icon: 'flip' },
    { id: 'borrar', label: 'Borrar', icon: 'ink_eraser' },
    { id: 'seleccionar', label: 'Multiplicar', icon: 'highlight_alt' },
  ];

  return (
    <aside className="panel" aria-label="Herramientas">
      {/* Formato */}
      <div className="bloque">
        <label className="etiqueta" htmlFor="formato">
          Formato de diseño
        </label>
        <select
          id="formato"
          value={formato.id}
          onChange={(e) => onCambiarFormato(e.target.value)}
        >
          {FORMATOS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Herramientas */}
      <div className="bloque">
        <span className="etiqueta">Herramienta</span>
        <div className="seg herramientas">
          {herramientasConfig.map((h) => (
            <button
              key={h.id}
              type="button"
              data-herramienta={h.id}
              aria-pressed={herramienta === h.id}
              onClick={() => onCambiarHerramienta(h.id)}
              className="btn-herramienta"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {h.icon}
              </span>
              <span>{h.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Operaciones sobre la selección */}
      {herramienta === 'seleccionar' && (
        <div className="bloque operaciones" id="operaciones">
          <span className="etiqueta">Operaciones de multiplicación</span>
          <p className="seleccion" id="sel-info">
            {sel
              ? `Área: ${sel.w} × ${sel.h} celdas`
              : 'Arrastra sobre el mosaico para seleccionar un área.'}
          </p>
          <div className="ops">
            <button
              type="button"
              disabled={!sel}
              onClick={() => onEjecutarOp('repetir')}
            >
              <span className="material-symbols-outlined" aria-hidden="true">repeat</span>
              Repetir
            </button>
            <button
              type="button"
              disabled={!sel}
              onClick={() => onEjecutarOp('escalonar')}
            >
              <span className="material-symbols-outlined" aria-hidden="true">stairs</span>
              Escalonar
            </button>
            <button
              type="button"
              disabled={!sel}
              onClick={() => onEjecutarOp('derecha')}
            >
              <span className="material-symbols-outlined" aria-hidden="true">flip</span>
              Reflejar →
            </button>
            <button
              type="button"
              disabled={!sel}
              onClick={() => onEjecutarOp('abajo')}
            >
              <span className="material-symbols-outlined" aria-hidden="true">swap_vert</span>
              Reflejar ↓
            </button>
            <button
              type="button"
              disabled={!sel}
              onClick={() => onEjecutarOp('cuatro')}
            >
              <span className="material-symbols-outlined" aria-hidden="true">grid_view</span>
              Simetría 4
            </button>
            <button
              type="button"
              disabled={!sel}
              onClick={() => onEjecutarOp('girar')}
            >
              <span className="material-symbols-outlined" aria-hidden="true">rotate_90_degrees_cw</span>
              Girar 90°
            </button>
            <button
              type="button"
              disabled={!sel}
              onClick={() => onEjecutarOp('vaciar')}
            >
              <span className="material-symbols-outlined" aria-hidden="true">backspace</span>
              Borrar área
            </button>
          </div>
        </div>
      )}

      {/* Colección de Formas */}
      <div className="bloque">
        <span className="etiqueta">Forma seleccionada</span>
        <div className="pincel-previa">
          <div className="pincel-muestra">
            <Miniatura
              w={1}
              h={1}
              celdas={[{ f: pincel.id, r: pincel.r, e: pincel.e, c: pincel.c }]}
              tam={64}
            />
          </div>
          <div className="pincel-acciones">
            <button
              type="button"
              className="btn-accion-pincel"
              onClick={() => onCambiarPincel({ ...pincel, ...girar(pincel) })}
              title="Girar forma 90° (Tecla R)"
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
        </div>

        <span className="etiqueta" style={{ marginTop: '8px' }}>Elegir forma</span>
        <div className="pool" id="pool" role="radiogroup" aria-label="Formas geométricas">
          {FORMAS.map((f) => {
            const esActivo = pincel.id === f.id;
            const cel = {
              x: 0,
              y: 0,
              f: f.id,
              r: pincel.r,
              e: pincel.e,
              c: pincel.c,
            };
            return (
              <button
                key={f.id}
                type="button"
                className="item"
                role="radio"
                aria-checked={esActivo}
                aria-label={f.nombre}
                title={`${f.nombre} · ${f.nota}`}
                onClick={() => onCambiarPincel({ ...pincel, id: f.id })}
              >
                <Miniatura w={1} h={1} celdas={[cel]} tam={44} />
                <span>{f.nombre}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Paletas de Color Predefinidas */}
      <div className="bloque">
        <div className="etiqueta-fila">
          <span className="etiqueta">Paletas de color</span>
          <button
            type="button"
            className="btn-enlace"
            onClick={() =>
              onCambiarPincel({
                ...pincel,
                c: { f: pincel.c.a, a: pincel.c.f, b: pincel.c.b },
              })
            }
            title="Invertir colores de fondo y figura"
          >
            <span className="material-symbols-outlined" aria-hidden="true">swap_horiz</span>
            Invertir
          </button>
        </div>

        <div className="paletas-grid" role="radiogroup" aria-label="Paletas de color">
          {PALETAS.map((p) => {
            const esActiva =
              pincel.c.f === p.f && pincel.c.a === p.a && pincel.c.b === p.b;
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

        {paletaActiva && (
          <button
            type="button"
            className="btn secundario btn-aplicar-paleta"
            onClick={() => onAplicarPaletaMosaico(paletaActiva)}
            title="Cambiar todo el diseño a esta paleta"
          >
            <span className="material-symbols-outlined" aria-hidden="true">palette</span>
            Aplicar paleta a todo el diseño
          </button>
        )}
      </div>

      {/* Exportar */}
      <div className="bloque exportar-bloque">
        <button
          type="button"
          className="btn primario btn-descargar"
          onClick={onExportarPNG}
          id="btn-descargar-png"
        >
          <span className="material-symbols-outlined" aria-hidden="true">download</span>
          Descargar imagen (PNG)
        </button>
      </div>

      {/* Acciones del lienzo */}
      <div className="bloque acciones">
        <button type="button" className="btn secundario" onClick={onGenerar} id="btn-generar">
          <span className="material-symbols-outlined" aria-hidden="true">shuffle</span>
          Sorpréndeme
        </button>
        <button type="button" className="btn secundario" onClick={handleVaciar} id="btn-vaciar">
          <span className="material-symbols-outlined" aria-hidden="true">restart_alt</span>
          {confirmarVaciar ? '¿Seguro? Toca de nuevo' : 'Limpiar'}
        </button>
      </div>

      {estadoMsg && (
        <p className="estado" role="status">
          {estadoMsg}
        </p>
      )}

      <label className="check">
        <input
          type="checkbox"
          checked={grilla}
          onChange={(e) => onToggleGrilla(e.target.checked)}
        />
        <span className="material-symbols-outlined" aria-hidden="true">grid_on</span>
        Mostrar grilla
      </label>
    </aside>
  );
};
