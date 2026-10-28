import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AjustesPixeles, DEFAULTS, LINEA } from './data/paletas';
import { makeSample } from './lib/muestreo';
import { processSD, DatosSD } from './lib/cuantizarSD';
import { processFree, DatosFree } from './lib/cuantizarFree';
import { SourceDrop } from './components/SourceDrop';
import { Controles } from './components/Controles';
import { ResultadoSD } from './components/ResultadoSD';
import { ResultadoFree } from './components/ResultadoFree';
import './styles.css';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<AjustesPixeles>(DEFAULTS);
  const [allowedColors, setAllowedColors] = useState<Set<string>>(
    () => new Set(LINEA.map((c) => c.name))
  );

  const [srcCanvas, setSrcCanvas] = useState<HTMLCanvasElement | null>(null);
  const [srcName, setSrcName] = useState<string>('ejemplo');
  const [srcDim, setSrcDim] = useState<{ w: number; h: number } | null>(null);

  const [code, setCode] = useState<string>('FA13');
  const [objName, setObjName] = useState<string>('Trompo');

  const [resSD, setResSD] = useState<DatosSD | null>(null);
  const [res32, setRes32] = useState<DatosFree | null>(null);
  const [res64, setRes64] = useState<DatosFree | null>(null);

  const [statusMsg, setStatusMsg] = useState<string>('');
  const [fallbackData, setFallbackData] = useState<{
    visible: boolean;
    title: string;
    hint: string;
    img?: string;
    text?: string;
  }>({
    visible: false,
    title: '',
    hint: '',
  });

  const timerRef = useRef<number | null>(null);

  // Inicializar con la imagen muestra del trompo
  useEffect(() => {
    const sample = makeSample();
    setSrcCanvas(sample);
    setSrcName('trompo');
    setSrcDim({ w: 900, h: 900 });
  }, []);

  // Programar cálculo (debounce) para fluidez de sliders
  useEffect(() => {
    if (!srcCanvas) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      if (settings.mode === 'sd') {
        const sd = processSD(srcCanvas, settings, allowedColors);
        setResSD(sd);
      } else {
        const f32 = processFree(32, srcCanvas, settings);
        const f64 = processFree(64, srcCanvas, settings);
        setRes32(f32);
        setRes64(f64);
      }
    }, 40);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [srcCanvas, settings, allowedColors]);

  const setSource = useCallback((img: HTMLImageElement, name: string) => {
    const max = 1600;
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * k));
    c.height = Math.max(1, Math.round(img.height * k));
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, c.width, c.height);

    setSrcCanvas(c);
    setSrcName(name);
    setSrcDim({ w: img.width, h: img.height });
    setSettings((prev) => ({ ...prev, cx: 0.5, cy: 0.5 }));
    setFallbackData((prev) => ({ ...prev, visible: false }));
  }, []);

  const loadFile = useCallback(
    (f: File) => {
      if (!f || !f.type.startsWith('image/')) {
        setStatusMsg('Ese archivo no es una imagen. Prueba con PNG, JPG, WEBP o GIF.');
        return;
      }
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        const cleanName = f.name.replace(/\.[^.]+$/, '') || 'imagen';
        setSource(img, cleanName);
        setObjName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        URL.revokeObjectURL(url);
        setStatusMsg('');
      };
      img.onerror = () => setStatusMsg('No se pudo leer la imagen. Prueba con otro archivo.');
      img.src = url;
    },
    [setSource]
  );

  // Soporte de pegado (paste) global
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      const items = Array.from(e.clipboardData?.items || []);
      const item = items.find((i) => i.type.startsWith('image/'));
      if (item) {
        const file = item.getAsFile();
        if (file) loadFile(file);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [loadFile]);

  const toggleAllowedColor = (name: string) => {
    setAllowedColors((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleReset = () => {
    setSettings({
      ...DEFAULTS,
      mode: settings.mode,
    });
    setAllowedColors(new Set(LINEA.map((c) => c.name)));
    setStatusMsg('Ajustes restablecidos.');
  };

  return (
    <div className="app">
      <a className="volver" href="../../" id="volver-hub">
        <span aria-hidden="true">←</span> Experiencias
      </a>

      <header>
        <div>
          <h1>Taller de Píxeles</h1>
          <p className="tag">
            Convierte cualquier imagen en un módulo de píxeles para el sistema visual de Somos
            Diseño, o explora versiones libres en 32 × 32 y 64 × 64.
          </p>
        </div>
      </header>

      <div className="layout">
        <Controles
          settings={settings}
          allowedColors={allowedColors}
          onToggleAllowedColor={toggleAllowedColor}
          onChangeSetting={(key, val) => setSettings((prev) => ({ ...prev, [key]: val }))}
          onReset={handleReset}
        />

        <main className="main">
          <SourceDrop
            srcCanvas={srcCanvas}
            srcName={srcName}
            srcDim={srcDim}
            settings={settings}
            onUpdateSettings={setSettings}
            onLoadImage={loadFile}
          />

          {settings.mode === 'sd' ? (
            <ResultadoSD
              resultado={resSD}
              settings={settings}
              code={code}
              onChangeCode={setCode}
              objName={objName}
              onChangeObjName={setObjName}
              onSetStatus={setStatusMsg}
              onShowFallback={(title: string, hint: string, data: { img?: string; text?: string }) =>
                setFallbackData({ visible: true, title, hint, ...data })
              }
            />
          ) : (
            <ResultadoFree
              res32={res32}
              res64={res64}
              settings={settings}
              srcName={srcName}
              onSetStatus={setStatusMsg}
              onShowFallback={(title: string, hint: string, data: { img?: string; text?: string }) =>
                setFallbackData({ visible: true, title, hint, ...data })
              }
            />
          )}

          {statusMsg && (
            <p id="status" role="status">
              {statusMsg}
            </p>
          )}

          {fallbackData.visible && (
            <div className="panel fallback" id="fallback">
              <h3 id="fbTitle">{fallbackData.title}</h3>
              <p className="hint" id="fbHint">
                {fallbackData.hint}
              </p>
              {fallbackData.img && <img id="fbImg" src={fallbackData.img} alt="Vista previa" />}
              {fallbackData.text && (
                <textarea
                  id="fbText"
                  readOnly
                  value={fallbackData.text}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              )}
              <button
                type="button"
                id="fbClose"
                onClick={() => setFallbackData((prev) => ({ ...prev, visible: false }))}
              >
                Cerrar
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
