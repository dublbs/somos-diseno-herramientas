import React from 'react';
import { VisualModo, MODOS } from '../data/paletas';
import { PixelParams } from '../modos/ModoPixel';
import { GeometricaParams } from '../modos/ModoGeometrica';
import { OrganicaParams } from '../modos/ModoOrganica';

interface ControlesMotionProps {
  modo: VisualModo;
  pixelParams: PixelParams;
  onChangePixel: (p: PixelParams) => void;
  geometricaParams: GeometricaParams;
  onChangeGeometrica: (p: GeometricaParams) => void;
  organicaParams: OrganicaParams;
  onChangeOrganica: (p: OrganicaParams) => void;
  onExportar: () => void;
}

export const ControlesMotion: React.FC<ControlesMotionProps> = ({
  modo,
  pixelParams,
  onChangePixel,
  geometricaParams,
  onChangeGeometrica,
  organicaParams,
  onChangeOrganica,
  onExportar,
}) => {
  const config = MODOS.find((m) => m.id === modo)!;

  return (
    <div className="panel-controles">
      <div className="control-cabecera">
        <h3>{config.nombre}</h3>
        <p>{config.descripcion}</p>
      </div>

      <div className="control-campos">
        {/* Parámetros Modo Pixel */}
        {modo === 'pixel' && (
          <>
            <div className="campo-rango">
              <div className="campo-header">
                <label>Velocidad de carrera</label>
                <span>{pixelParams.velocidad}x</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={pixelParams.velocidad}
                onChange={(e) =>
                  onChangePixel({ ...pixelParams, velocidad: Number(e.target.value) })
                }
              />
            </div>

            <div className="campo-rango">
              <div className="campo-header">
                <label>Monedas por pantalla</label>
                <span>{pixelParams.densidadMonedas}</span>
              </div>
              <input
                type="range"
                min={1}
                max={4}
                value={pixelParams.densidadMonedas}
                onChange={(e) =>
                  onChangePixel({ ...pixelParams, densidadMonedas: Number(e.target.value) })
                }
              />
            </div>

            <div className="campo-chips">
              <label className="etiqueta-pequena">Tinta de fondo</label>
              <div className="chips-fila">
                <button
                  type="button"
                  className={`chip-btn ${pixelParams.colorTinta === 'azul' ? 'activo' : ''}`}
                  onClick={() => onChangePixel({ ...pixelParams, colorTinta: 'azul' })}
                >
                  Noche Azul
                </button>
                <button
                  type="button"
                  className={`chip-btn ${pixelParams.colorTinta === 'morado' ? 'activo' : ''}`}
                  onClick={() => onChangePixel({ ...pixelParams, colorTinta: 'morado' })}
                >
                  Atardecer Morado
                </button>
              </div>
            </div>
          </>
        )}

        {/* Parámetros Modo Geométrica */}
        {modo === 'geometrica' && (
          <>
            <div className="campo-chips">
              <label className="etiqueta-pequena">Simetría radial</label>
              <div className="chips-fila">
                <button
                  type="button"
                  className={`chip-btn ${geometricaParams.simetria === 4 ? 'activo' : ''}`}
                  onClick={() => onChangeGeometrica({ ...geometricaParams, simetria: 4 })}
                >
                  4 Cuadrantes
                </button>
                <button
                  type="button"
                  className={`chip-btn ${geometricaParams.simetria === 8 ? 'activo' : ''}`}
                  onClick={() => onChangeGeometrica({ ...geometricaParams, simetria: 8 })}
                >
                  8 Rayos Caleidoscopio
                </button>
              </div>
            </div>

            <div className="campo-chips">
              <label className="etiqueta-pequena">Variante geométrica</label>
              <div className="chips-fila">
                {(['damero', 'zigzag', 'acordeon'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`chip-btn ${geometricaParams.variante === v ? 'activo' : ''}`}
                    onClick={() => onChangeGeometrica({ ...geometricaParams, variante: v })}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="campo-rango">
              <div className="campo-header">
                <label>Velocidad de giro</label>
                <span>{geometricaParams.velocidadGiro}x</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={geometricaParams.velocidadGiro}
                onChange={(e) =>
                  onChangeGeometrica({
                    ...geometricaParams,
                    velocidadGiro: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="campo-chips">
              <label className="etiqueta-pequena">Paleta Línea Azul</label>
              <div className="chips-fila">
                <button
                  type="button"
                  className={`chip-btn ${geometricaParams.paleta === 'azul-rosa' ? 'activo' : ''}`}
                  onClick={() => onChangeGeometrica({ ...geometricaParams, paleta: 'azul-rosa' })}
                >
                  Lapislázuli + Rosa
                </button>
                <button
                  type="button"
                  className={`chip-btn ${geometricaParams.paleta === 'verde-amarillo' ? 'activo' : ''}`}
                  onClick={() =>
                    onChangeGeometrica({ ...geometricaParams, paleta: 'verde-amarillo' })
                  }
                >
                  Verde + Amarillo
                </button>
              </div>
            </div>
          </>
        )}

        {/* Parámetros Modo Orgánica */}
        {modo === 'organica' && (
          <>
            <div className="campo-rango">
              <div className="campo-header">
                <label>Fuerza del balanceo</label>
                <span>{organicaParams.balanceo}x</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={organicaParams.balanceo}
                onChange={(e) =>
                  onChangeOrganica({ ...organicaParams, balanceo: Number(e.target.value) })
                }
              />
            </div>

            <div className="campo-rango">
              <div className="campo-header">
                <label>Tamaño de floración</label>
                <span>{Math.round(organicaParams.floracion * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.6}
                max={1.8}
                step={0.1}
                value={organicaParams.floracion}
                onChange={(e) =>
                  onChangeOrganica({ ...organicaParams, floracion: Number(e.target.value) })
                }
              />
            </div>

            <div className="campo-chips">
              <label className="etiqueta-pequena">Tinta botánica</label>
              <div className="chips-fila">
                <button
                  type="button"
                  className={`chip-btn ${organicaParams.colorPrincipal === 'verde' ? 'activo' : ''}`}
                  onClick={() => onChangeOrganica({ ...organicaParams, colorPrincipal: 'verde' })}
                >
                  Verde Bosque
                </button>
                <button
                  type="button"
                  className={`chip-btn ${organicaParams.colorPrincipal === 'rosa' ? 'activo' : ''}`}
                  onClick={() => onChangeOrganica({ ...organicaParams, colorPrincipal: 'rosa' })}
                >
                  Rosa Pétalo
                </button>
                <button
                  type="button"
                  className={`chip-btn ${organicaParams.colorPrincipal === 'celeste' ? 'activo' : ''}`}
                  onClick={() => onChangeOrganica({ ...organicaParams, colorPrincipal: 'celeste' })}
                >
                  Celeste Agua
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="acciones-exportar">
        <button type="button" className="btn-exportar-tarjeta" onClick={onExportar}>
          📸 Generar Tarjeta 1080 × 1350
        </button>
      </div>
    </div>
  );
};
