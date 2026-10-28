import React from 'react';
import { LINEA, AjustesPixeles } from '../data/paletas';

interface ControlesProps {
  settings: AjustesPixeles;
  allowedColors: Set<string>;
  onToggleAllowedColor: (colorName: string) => void;
  onChangeSetting: <K extends keyof AjustesPixeles>(key: K, value: AjustesPixeles[K]) => void;
  onReset: () => void;
}

export const Controles: React.FC<ControlesProps> = ({
  settings,
  allowedColors,
  onToggleAllowedColor,
  onChangeSetting,
  onReset,
}) => {
  const isSD = settings.mode === 'sd';

  return (
    <aside className="controls panel" aria-label="Controles">
      <form id="ctl" onSubmit={(e) => e.preventDefault()}>
        {/* Modo */}
        <fieldset>
          <legend>Modo</legend>
          <div className="seg" role="radiogroup" aria-label="Modo de trabajo">
            <label>
              <input
                type="radio"
                name="mode"
                value="sd"
                checked={settings.mode === 'sd'}
                onChange={() => onChangeSetting('mode', 'sd')}
              />
              <span>Somos Diseño · 24</span>
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                value="free"
                checked={settings.mode === 'free'}
                onChange={() => onChangeSetting('mode', 'free')}
              />
              <span>Libre · 32 / 64</span>
            </label>
          </div>
        </fieldset>

        {/* Encuadre */}
        <fieldset>
          <legend>Encuadre</legend>
          <div className="seg" role="radiogroup" aria-label="Encuadre">
            <label>
              <input
                type="radio"
                name="frame"
                value="crop"
                checked={settings.frame === 'crop'}
                onChange={() => onChangeSetting('frame', 'crop')}
              />
              <span>Recortar</span>
            </label>
            <label>
              <input
                type="radio"
                name="frame"
                value="fit"
                checked={settings.frame === 'fit'}
                onChange={() => onChangeSetting('frame', 'fit')}
              />
              <span>Ajustar</span>
            </label>
          </div>
          <div className={`range ${settings.frame !== 'crop' ? 'disabled' : ''}`} id="zoomRow">
            <div className="row">
              <label htmlFor="zoom">Zoom</label>
              <output id="zoomOut">{'×' + settings.zoom.toFixed(2)}</output>
            </div>
            <input
              type="range"
              id="zoom"
              min="0.5"
              max="4"
              step="0.05"
              value={settings.zoom}
              disabled={settings.frame !== 'crop'}
              onChange={(e) => onChangeSetting('zoom', parseFloat(e.target.value))}
            />
          </div>
        </fieldset>

        {/* Muestra y silueta */}
        <fieldset>
          <legend>Muestra y silueta</legend>
          <div className="seg" role="radiogroup" aria-label="Color de cada celda">
            <label>
              <input
                type="radio"
                name="sample"
                value="dominant"
                checked={settings.sample === 'dominant'}
                onChange={() => onChangeSetting('sample', 'dominant')}
              />
              <span>Dominante</span>
            </label>
            <label>
              <input
                type="radio"
                name="sample"
                value="average"
                checked={settings.sample === 'average'}
                onChange={() => onChangeSetting('sample', 'average')}
              />
              <span>Promedio</span>
            </label>
          </div>
          <div className="range">
            <div className="row">
              <label htmlFor="bright">Brillo</label>
              <output id="brightOut">
                {(settings.bright > 0 ? '+' : '') + settings.bright}
              </output>
            </div>
            <input
              type="range"
              id="bright"
              min="-60"
              max="60"
              value={settings.bright}
              onChange={(e) => onChangeSetting('bright', parseInt(e.target.value, 10))}
            />
          </div>
          <div className="range">
            <div className="row">
              <label htmlFor="contrast">Contraste</label>
              <output id="contrastOut">
                {(settings.contrast > 0 ? '+' : '') + settings.contrast}
              </output>
            </div>
            <input
              type="range"
              id="contrast"
              min="-60"
              max="60"
              value={settings.contrast}
              onChange={(e) => onChangeSetting('contrast', parseInt(e.target.value, 10))}
            />
          </div>
          <div className="range">
            <div className="row">
              <label htmlFor="sat">Saturación</label>
              <output id="satOut">{(settings.sat > 0 ? '+' : '') + settings.sat}</output>
            </div>
            <input
              type="range"
              id="sat"
              min="-100"
              max="100"
              value={settings.sat}
              onChange={(e) => onChangeSetting('sat', parseInt(e.target.value, 10))}
            />
          </div>
          <div className="range">
            <div className="row">
              <label htmlFor="clean">Limpieza de huérfanos</label>
              <output id="cleanOut">
                {settings.clean === 0
                  ? 'no'
                  : settings.clean + (settings.clean === 1 ? ' pasada' : ' pasadas')}
              </output>
            </div>
            <input
              type="range"
              id="clean"
              min="0"
              max="4"
              value={settings.clean}
              onChange={(e) => onChangeSetting('clean', parseInt(e.target.value, 10))}
            />
          </div>
          <label className="check">
            <input
              type="checkbox"
              id="bgRemove"
              checked={settings.bgRemove}
              onChange={(e) => onChangeSetting('bgRemove', e.target.checked)}
            />
            Quitar el fondo de la foto
          </label>
          <div className={`range ${!settings.bgRemove ? 'disabled' : ''}`} id="tolRow">
            <div className="row">
              <label htmlFor="tol">Tolerancia del fondo</label>
              <output id="tolOut">{settings.tol}</output>
            </div>
            <input
              type="range"
              id="tol"
              min="4"
              max="60"
              value={settings.tol}
              disabled={!settings.bgRemove}
              onChange={(e) => onChangeSetting('tol', parseInt(e.target.value, 10))}
            />
          </div>
        </fieldset>

        {/* Solo SD */}
        {isSD ? (
          <>
            <fieldset className="only-sd">
              <legend>Módulo Somos Diseño</legend>
              <div className="range">
                <div className="row">
                  <label htmlFor="sdMargin">Margen</label>
                  <output id="sdMarginOut">
                    {`${settings.sdMargin} · figura ${24 - 2 * settings.sdMargin}×${
                      24 - 2 * settings.sdMargin
                    }`}
                  </output>
                </div>
                <input
                  type="range"
                  id="sdMargin"
                  min="0"
                  max="4"
                  value={settings.sdMargin}
                  onChange={(e) => onChangeSetting('sdMargin', parseInt(e.target.value, 10))}
                />
              </div>
              <p className="hint">Regla 2: no tocar el borde. Recomendado: 1 o 2 celdas de margen.</p>
            </fieldset>

            <fieldset className="only-sd">
              <legend>Color · Línea azul</legend>
              <div className="range">
                <div className="row">
                  <label htmlFor="sdMax">Colores por pieza</label>
                  <output id="sdMaxOut">{settings.sdMax}</output>
                </div>
                <input
                  type="range"
                  id="sdMax"
                  min="2"
                  max="4"
                  value={settings.sdMax}
                  onChange={(e) => onChangeSetting('sdMax', parseInt(e.target.value, 10))}
                />
              </div>
              <p className="hint">
                Incluye el contorno; el fondo de la celda no cuenta. Toca un color para excluirlo.
              </p>
              <div className="pchips" id="pchips">
                {LINEA.map((c) => {
                  const isFondo = c.name === settings.sdFondo;
                  const isAllowed = allowedColors.has(c.name) && !isFondo;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      disabled={isFondo}
                      aria-pressed={isAllowed}
                      title={isFondo ? 'Es el fondo de la celda' : ''}
                      onClick={() => onToggleAllowedColor(c.name)}
                    >
                      <i style={{ background: c.hex }} />
                      {c.name}
                    </button>
                  );
                })}
              </div>

              <div className="field">
                <label htmlFor="sdFondo">Fondo de la celda</label>
                <select
                  id="sdFondo"
                  value={settings.sdFondo}
                  onChange={(e) => onChangeSetting('sdFondo', e.target.value)}
                >
                  {LINEA.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="check">
                <input
                  type="checkbox"
                  id="sdOutline"
                  checked={settings.sdOutline}
                  onChange={(e) => onChangeSetting('sdOutline', e.target.checked)}
                />
                Contorno exterior
              </label>

              <div className={`field ${!settings.sdOutline ? 'disabled' : ''}`} id="ocRow">
                <label htmlFor="sdOutlineColor">Color del contorno</label>
                <select
                  id="sdOutlineColor"
                  value={settings.sdOutlineColor}
                  disabled={!settings.sdOutline}
                  onChange={(e) => onChangeSetting('sdOutlineColor', e.target.value)}
                >
                  {LINEA.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="check">
                <input
                  type="checkbox"
                  id="sdDither"
                  checked={settings.sdDither}
                  onChange={(e) => onChangeSetting('sdDither', e.target.checked)}
                />
                Trama ordenada
              </label>

              <div className={`range ${!settings.sdDither ? 'disabled' : ''}`} id="sdDitherRow">
                <div className="row">
                  <label htmlFor="ditherAmt2">Intensidad de la trama</label>
                  <output id="ditherAmt2Out">{`${settings.ditherAmt2} %`}</output>
                </div>
                <input
                  type="range"
                  id="ditherAmt2"
                  min="0"
                  max="100"
                  value={settings.ditherAmt2}
                  disabled={!settings.sdDither}
                  onChange={(e) => onChangeSetting('ditherAmt2', parseInt(e.target.value, 10))}
                />
              </div>
              <p className="hint">Regla 3: la trama solo donde suma, como nubes, metal o humo.</p>
            </fieldset>
          </>
        ) : (
          <>
            {/* Solo Modo Libre */}
            <fieldset className="only-free">
              <legend>Paleta</legend>
              <div className="seg" role="radiogroup" aria-label="Paleta">
                {(['auto', 'linea', 'pico8', 'gb'] as const).map((palId) => (
                  <label key={palId}>
                    <input
                      type="radio"
                      name="pal"
                      value={palId}
                      checked={settings.pal === palId}
                      onChange={() => onChangeSetting('pal', palId)}
                    />
                    <span>
                      {palId === 'auto'
                        ? 'Auto'
                        : palId === 'linea'
                        ? 'Línea azul'
                        : palId === 'pico8'
                        ? 'PICO-8'
                        : 'GB'}
                    </span>
                  </label>
                ))}
              </div>
              <div className={`range ${settings.pal !== 'auto' ? 'disabled' : ''}`} id="colorsRow">
                <div className="row">
                  <label htmlFor="colors">Colores</label>
                  <output id="colorsOut">{settings.colors}</output>
                </div>
                <input
                  type="range"
                  id="colors"
                  min="2"
                  max="32"
                  value={settings.colors}
                  disabled={settings.pal !== 'auto'}
                  onChange={(e) => onChangeSetting('colors', parseInt(e.target.value, 10))}
                />
              </div>
            </fieldset>

            <fieldset className="only-free">
              <legend>Tramado y contorno</legend>
              <div className="seg" role="radiogroup" aria-label="Tramado">
                {(['none', 'bayer', 'fs'] as const).map((dId) => (
                  <label key={dId}>
                    <input
                      type="radio"
                      name="dither"
                      value={dId}
                      checked={settings.dither === dId}
                      onChange={() => onChangeSetting('dither', dId)}
                    />
                    <span>
                      {dId === 'none' ? 'Sin trama' : dId === 'bayer' ? 'Bayer' : 'Floyd–S.'}
                    </span>
                  </label>
                ))}
              </div>
              <div className={`range ${settings.dither === 'none' ? 'disabled' : ''}`} id="ditherRow">
                <div className="row">
                  <label htmlFor="ditherAmt">Intensidad</label>
                  <output id="ditherAmtOut">{`${settings.ditherAmt} %`}</output>
                </div>
                <input
                  type="range"
                  id="ditherAmt"
                  min="0"
                  max="100"
                  value={settings.ditherAmt}
                  disabled={settings.dither === 'none'}
                  onChange={(e) => onChangeSetting('ditherAmt', parseInt(e.target.value, 10))}
                />
              </div>

              <div className="seg" role="radiogroup" aria-label="Contorno">
                {(['none', 'inner', 'outer', 'both'] as const).map((oId) => (
                  <label key={oId}>
                    <input
                      type="radio"
                      name="outline"
                      value={oId}
                      checked={settings.outline === oId}
                      onChange={() => onChangeSetting('outline', oId)}
                    />
                    <span>
                      {oId === 'none'
                        ? 'Sin contorno'
                        : oId === 'inner'
                        ? 'Interior'
                        : oId === 'outer'
                        ? 'Exterior'
                        : 'Ambos'}
                    </span>
                  </label>
                ))}
              </div>
              {(settings.outline === 'outer' || settings.outline === 'both') && !settings.bgRemove && (
                <p className="hint" id="outerHint">
                  El contorno exterior necesita fondo transparente: activa «Quitar el fondo de la foto».
                </p>
              )}
            </fieldset>
          </>
        )}

        <fieldset>
          <legend>Vista</legend>
          <label className="check">
            <input
              type="checkbox"
              id="grid"
              checked={settings.grid}
              onChange={(e) => onChangeSetting('grid', e.target.checked)}
            />
            Mostrar cuadrícula
          </label>
        </fieldset>

        <div className="ctl-foot">
          <button type="button" id="reset" onClick={onReset}>
            Restablecer ajustes
          </button>
        </div>
      </form>
    </aside>
  );
};
