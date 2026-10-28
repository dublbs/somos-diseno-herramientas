import React, { useRef, useEffect } from 'react';
import { DatosSD, drawModule, buildSVG, validarReglasSD } from '../lib/cuantizarSD';
import { AjustesPixeles } from '../data/paletas';

interface ResultadoSDProps {
  resultado: DatosSD | null;
  settings: AjustesPixeles;
  code: string;
  onChangeCode: (v: string) => void;
  objName: string;
  onChangeObjName: (v: string) => void;
  onSetStatus: (msg: string) => void;
  onShowFallback: (title: string, hint: string, data: { img?: string; text?: string }) => void;
}

function slug(s: string): string {
  return (
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'objeto'
  );
}

export const ResultadoSD: React.FC<ResultadoSDProps> = ({
  resultado,
  settings,
  code,
  onChangeCode,
  objName,
  onChangeObjName,
  onSetStatus,
  onShowFallback,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!resultado || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 480, 480);
    drawModule(resultado, 20, ctx, settings.grid);
  }, [resultado, settings.grid]);

  if (!resultado) {
    return <div className="card panel sd-card"><p>Procesando módulo…</p></div>;
  }

  const { N, idx, pal, isOutline, fondo, oc } = resultado;
  const counts = new Map<number, number>();
  let outlineCount = 0;
  let fig = 0;

  for (let p = 0; p < N * N; p++) {
    const v = idx[p];
    if (v < 0) continue;
    fig++;
    if (isOutline[p]) {
      outlineCount++;
      continue;
    }
    counts.set(v, (counts.get(v) || 0) + 1);
  }

  const items = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([v, n]) => ({ c: pal[v], label: pal[v].name, n }));
  if (outlineCount && oc) {
    items.push({ c: oc, label: 'Contorno · ' + oc.name, n: outlineCount });
  }
  items.push({ c: fondo, label: 'Fondo · ' + fondo.name, n: N * N - fig });

  const layerName = `Pixel / ${code.trim() || 'FA13'} · ${objName.trim() || 'Objeto'} / módulo`;
  const baseName = `${slug(code)}-${slug(objName)}-modulo`;
  const checks = validarReglasSD(resultado, settings);

  const copiarSVG = () => {
    const svg = buildSVG(resultado);
    const fb = () => {
      onShowFallback(
        'SVG del módulo',
        'Selecciona todo el texto, cópialo y pégalo en Figma.',
        { text: svg }
      );
      onSetStatus('No se pudo copiar automáticamente.');
    };
    try {
      navigator.clipboard
        .writeText(svg)
        .then(() => {
          onSetStatus(`SVG copiado. Pégalo en Figma con Ctrl/Cmd+V y nómbralo «${layerName}».`);
        })
        .catch(fb);
    } catch {
      fb();
    }
  };

  const descargarSVG = () => {
    const svg = buildSVG(resultado);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.svg`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    onSetStatus(`SVG descargado: ${baseName}.svg`);
  };

  const descargarPNG = (k: number) => {
    const c = document.createElement('canvas');
    c.width = c.height = 240 * k;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    drawModule(resultado, 10 * k, ctx, false);
    const nombre = `${baseName}@${k}x.png`;
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      onSetStatus(`PNG guardado: ${nombre}`);
    }, 'image/png');
  };

  return (
    <div className="card panel sd-card" id="cardSD">
      <div className="card-head">
        <h2>Módulo Somos Diseño</h2>
        <span className="meta" id="metaSD">{`${fig} pixeles de figura`}</span>
      </div>

      <div className="sd-body">
        <div className="sd-side">
          <div className="stage">
            <canvas id="outSD" ref={canvasRef} width="480" height="480" />
          </div>

          <div className="actions">
            <button type="button" className="primary" onClick={copiarSVG}>
              Copiar SVG para Figma
            </button>
            <button type="button" onClick={descargarSVG}>
              Descargar SVG
            </button>
            <button type="button" onClick={() => descargarPNG(1)}>
              PNG 1× (240)
            </button>
            <button type="button" onClick={() => descargarPNG(2)}>
              PNG 2× (480)
            </button>
            <button type="button" onClick={() => descargarPNG(4)}>
              PNG 4× (960)
            </button>
          </div>
        </div>

        <div className="sd-side">
          <div>
            <div className="sub">Nombre del componente en Figma</div>
            <div className="name-row">
              <input
                type="text"
                value={code}
                placeholder="FA13"
                aria-label="Código de la forma"
                onChange={(e) => onChangeCode(e.target.value)}
              />
              <input
                type="text"
                value={objName}
                placeholder="Objeto"
                aria-label="Nombre del objeto"
                onChange={(e) => onChangeObjName(e.target.value)}
              />
            </div>
            <p className="layer">{layerName}</p>
          </div>

          <div>
            <div className="sub">Colores del módulo</div>
            <ul className="named" id="namedSD">
              {items.map((it, idxKey) => (
                <li key={idxKey}>
                  <i style={{ background: it.c.hex }} />
                  <span>
                    {it.label} <small>{it.n}</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="sub">Reglas del sistema visual</div>
            <ul className="checks" id="checksSD">
              {checks.map((ch, idxKey) => (
                <li key={idxKey}>
                  <span className={`pill ${ch.estado}`}>
                    {ch.estado === 'ok' ? 'cumple' : ch.estado === 'warn' ? 'revisar' : 'nota'}
                  </span>
                  <span>{ch.texto}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
