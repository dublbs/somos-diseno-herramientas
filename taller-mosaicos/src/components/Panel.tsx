import React, { useRef, useEffect } from 'react';
import {
  Formato,
  FORMATOS,
  FORMAS,
  COLORES,
  HEX,
  Pincel,
  FiguraGuardada,
  forma,
  usaA,
  usaB,
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
  pestana: 'base' | 'mias';
  onCambiarPestana: (p: 'base' | 'mias') => void;
  sel: { x: number; y: number; w: number; h: number } | null;
  onEjecutarOp: (op: string) => void;
  misFiguras: FiguraGuardada[];
  onBorrarFigura: (id: string) => void;
  grilla: boolean;
  onToggleGrilla: (g: boolean) => void;
  onGenerar: () => void;
  onVaciar: () => void;
  onExportarPNG: () => void;
  onExportarSVG: () => void;
  onCopiarSVG: () => void;
  estadoMsg: string;
  svgTexto: string | null;
}

const Miniatura: React.FC<{
  w: number;
  h: number;
  celdas: (Celda & { x?: number; y?: number })[];
  tam?: number;
}> = ({ w, h, celdas, tam = 56 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lado = tam / Math.max(w, h);
    const W = Math.round(w * lado);
    const H = Math.round(h * lado);
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = HEX.Hueso;
    ctx.fillRect(0, 0, W, H);

    celdas.forEach((cel) => {
      const cx = (cel.x ?? 0) * lado;
      const cy = (cel.y ?? 0) * lado;
      pintarCelda(ctx, cel, cx, cy, lado);
    });
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
  pestana,
  onCambiarPestana,
  sel,
  onEjecutarOp,
  misFiguras,
  onBorrarFigura,
  grilla,
  onToggleGrilla,
  onGenerar,
  onVaciar,
  onExportarPNG,
  onExportarSVG,
  onCopiarSVG,
  estadoMsg,
  svgTexto,
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

  const setColorPincel = (ranura: 'f' | 'a' | 'b', color: string) => {
    onCambiarPincel({
      ...pincel,
      c: { ...pincel.c, [ranura]: color },
    });
  };

  const fDef = pincel.tipo === 'forma' ? forma(pincel.id) : null;
  const figActual = pincel.tipo === 'figura' ? misFiguras.find((m) => m.id === pincel.id) : null;

  return (
    <aside className="panel" aria-label="Herramientas">
      {/* Formato */}
      <div className="bloque">
        <label className="etiqueta" htmlFor="formato">
          Formato
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
          {['poner', 'girar', 'reflejar', 'gotero', 'borrar', 'seleccionar'].map((h) => (
            <button
              key={h}
              type="button"
              data-herramienta={h}
              aria-pressed={herramienta === h}
              onClick={() => onCambiarHerramienta(h)}
            >
              {h.charAt(0).toUpperCase() + h.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Operaciones sobre la selección */}
      {herramienta === 'seleccionar' && (
        <div className="bloque operaciones" id="operaciones">
          <span className="etiqueta">Operaciones</span>
          <p className="seleccion" id="sel-info">
            {sel
              ? `Selección: ${sel.w} × ${sel.h} celdas`
              : 'Arrastra sobre el lienzo para marcar la figura.'}
          </p>
          <div className="seg ops">
            <button
              type="button"
              disabled={!sel}
              onClick={() => onEjecutarOp('repetir')}
            >
              Repetir
            </button>
            <button
              type="button"
              disabled={!sel}
              onClick={() => onEjecutarOp('escalonar')}
            >
              Escalonar
            </button>
            <button
              type="button"
              disabled={!sel}
              onClick={() => onEjecutarOp('derecha')}
            >
              Reflejar →
            </button>
            <button
              type="button"
              disabled={!sel}
              onClick={() => onEjecutarOp('abajo')}
            >
              Reflejar ↓
            </button>
            <button
              type="button"
              disabled={!sel}
              onClick={() => onEjecutarOp('cuatro')}
            >
              Reflejar en 4
            </button>
            <button
              type="button"
              disabled={!sel}
              onClick={() => onEjecutarOp('girar')}
            >
              Girar 90°
            </button>
          </div>
          <div className="seg">
            <button
              type="button"
              className="destacado"
              disabled={!sel}
              onClick={() => onEjecutarOp('guardarFigura')}
            >
              Guardar como figura
            </button>
            <button
              type="button"
              disabled={!sel}
              onClick={() => onEjecutarOp('vaciar')}
            >
              Vaciar selección
            </button>
          </div>
        </div>
      )}

      {/* Pool */}
      <div className="bloque">
        <span className="etiqueta">Pool</span>
        <div className="pestanas" role="tablist" aria-label="Pool">
          <button
            type="button"
            role="tab"
            aria-selected={pestana === 'base'}
            onClick={() => onCambiarPestana('base')}
          >
            Formas base
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pestana === 'mias'}
            onClick={() => onCambiarPestana('mias')}
          >
            Mis figuras
          </button>
        </div>
        <div className="pool" id="pool" role="radiogroup" aria-label="Formas">
          {pestana === 'base' ? (
            FORMAS.map((f) => {
              const esActivo = pincel.tipo === 'forma' && pincel.id === f.id;
              const cel = {
                x: 0,
                y: 0,
                f: f.id,
                r: pincel.tipo === 'forma' ? pincel.r : 0,
                e: pincel.tipo === 'forma' ? pincel.e : false,
                c: pincel.c,
              };
              return (
                <button
                  key={f.id}
                  type="button"
                  className="item"
                  role="radio"
                  aria-checked={esActivo}
                  aria-label={`${f.nombre}, ${f.nota}`}
                  title={`${f.nombre} · ${f.nota}`}
                  onClick={() => {
                    onCambiarPincel({
                      tipo: 'forma',
                      id: f.id,
                      r: pincel.tipo === 'forma' ? pincel.r : 0,
                      e: pincel.tipo === 'forma' ? pincel.e : false,
                      c: pincel.c,
                    });
                    onCambiarHerramienta('poner');
                  }}
                >
                  <Miniatura w={1} h={1} celdas={[cel]} />
                  <span>{f.nombre}</span>
                </button>
              );
            })
          ) : misFiguras.length === 0 ? (
            <p className="nota vacio">
              Aún no hay figuras. Arma una con las formas base, elige la herramienta Seleccionar,
              marca la figura y toca «Guardar como figura».
            </p>
          ) : (
            misFiguras.map((m) => {
              const esActivo = pincel.tipo === 'figura' && pincel.id === m.id;
              return (
                <div key={m.id} className="item-envoltorio">
                  <button
                    type="button"
                    className="item"
                    role="radio"
                    aria-checked={esActivo}
                    aria-label={`${m.nombre} · ${m.w}×${m.h}`}
                    title={`${m.nombre} · ${m.w}×${m.h}`}
                    onClick={() => {
                      onCambiarPincel({
                        tipo: 'figura',
                        id: m.id,
                        r: 0,
                        e: false,
                        c: pincel.c,
                      });
                      onCambiarHerramienta('poner');
                    }}
                  >
                    <Miniatura w={m.w} h={m.h} celdas={m.celdas} />
                    <span>{`${m.nombre} · ${m.w}×${m.h}`}</span>
                  </button>
                  <button
                    type="button"
                    className="quitar"
                    aria-label={`Quitar ${m.nombre}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBorrarFigura(m.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pincel */}
      <div className="bloque">
        <span className="etiqueta">Pincel</span>
        <div className="pincel" id="pincel">
          {pincel.tipo === 'figura' && figActual ? (
            <div className="pincel-fila">
              <Miniatura w={figActual.w} h={figActual.h} celdas={figActual.celdas} tam={72} />
              <p className="seleccion">
                {`${figActual.nombre} · ${figActual.w} × ${figActual.h} celdas. Se pone completa con sus colores.`}
              </p>
            </div>
          ) : fDef ? (
            <>
              <div className="pincel-fila">
                <Miniatura
                  w={1}
                  h={1}
                  celdas={[{ x: 0, y: 0, f: pincel.id, r: pincel.r, e: pincel.e, c: pincel.c }]}
                  tam={72}
                />
                <div className="pincel-info">
                  <strong>{fDef.nombre}</strong>
                  <span className="nota">
                    {`${fDef.nota} · giro ${pincel.r * 90}°${pincel.e ? ' · reflejada' : ''}`}
                  </span>
                  <div className="seg">
                    <button
                      type="button"
                      aria-label="Girar la forma 90 grados"
                      onClick={() => onCambiarPincel({ ...pincel, ...girar(pincel) })}
                    >
                      Girar 90°
                    </button>
                    <button
                      type="button"
                      aria-label="Reflejar la forma"
                      onClick={() => onCambiarPincel({ ...pincel, ...reflejarH(pincel) })}
                    >
                      Reflejar
                    </button>
                    <button
                      type="button"
                      aria-label="Intercambiar fondo y figura"
                      onClick={() =>
                        onCambiarPincel({
                          ...pincel,
                          c: { ...pincel.c, f: pincel.c.a, a: pincel.c.f },
                        })
                      }
                    >
                      Invertir colores
                    </button>
                  </div>
                </div>
              </div>

              {/* Selectores de color */}
              <div className="fila-color">
                <span className="etiqueta">{`Fondo de la celda · ${pincel.c.f}`}</span>
                <div className="chips" role="radiogroup" aria-label="Fondo de la celda">
                  {COLORES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="chip"
                      style={{ ['--c' as string]: HEX[c] }}
                      role="radio"
                      aria-checked={pincel.c.f === c}
                      aria-label={c}
                      title={c}
                      onClick={() => setColorPincel('f', c)}
                    />
                  ))}
                </div>
              </div>

              {usaA(pincel.id) && (
                <div className="fila-color">
                  <span className="etiqueta">{`Figura · ${pincel.c.a}`}</span>
                  <div className="chips" role="radiogroup" aria-label="Figura">
                    {COLORES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="chip"
                        style={{ ['--c' as string]: HEX[c] }}
                        role="radio"
                        aria-checked={pincel.c.a === c}
                        aria-label={c}
                        title={c}
                        onClick={() => setColorPincel('a', c)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {usaB(pincel.id) && (
                <div className="fila-color">
                  <span className="etiqueta">{`Detalle · ${pincel.c.b}`}</span>
                  <div className="chips" role="radiogroup" aria-label="Detalle">
                    {COLORES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="chip"
                        style={{ ['--c' as string]: HEX[c] }}
                        role="radio"
                        aria-checked={pincel.c.b === c}
                        aria-label={c}
                        title={c}
                        onClick={() => setColorPincel('b', c)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Exportar */}
      <div className="bloque acciones">
        <button type="button" className="primario" onClick={onExportarPNG}>
          Descargar PNG
        </button>
        <button type="button" className="secundario" onClick={onExportarSVG}>
          Descargar SVG
        </button>
        <button type="button" className="secundario" onClick={onCopiarSVG}>
          Copiar SVG para Figma
        </button>
      </div>

      {svgTexto && (
        <textarea
          className="svg-texto"
          readOnly
          value={svgTexto}
          aria-label="Código SVG"
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
        />
      )}

      {/* Acciones generales */}
      <div className="bloque acciones">
        <button type="button" className="secundario" onClick={onGenerar}>
          Generar al azar
        </button>
        <button type="button" className="secundario" onClick={handleVaciar}>
          {confirmarVaciar ? '¿Vaciar todo? Toca de nuevo' : 'Vaciar lienzo'}
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
        Mostrar grilla
      </label>
    </aside>
  );
};
