import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FIGURAS, HEX, cargarFiguras, descargar, tarjeta, type IdFigura, type NombreColor } from './lib/comun';
import { PAPEL, TAMANOS, dibujarGrabado, type Estampa, type Tamano } from './lib/grabado';
import './styles.css';

type Pestana = 'tacos' | 'tinta';
const QUIETO = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const TINTAS: NombreColor[] = ['Negro', 'Azul', 'Lapislázuli', 'Verde', 'Rosa', 'Morado', 'Amarillo', 'Celeste'];
const PAPELES: NombreColor[] = ['Hueso', 'Celeste', 'Amarillo', 'Rosa'];

export const App: React.FC = () => {
  const [empezado, setEmpezado] = useState(false);
  const [tacos, setTacos] = useState<Record<IdFigura, HTMLImageElement> | null>(null);
  const [taco, setTaco] = useState<IdFigura>('helecho');
  const [tinta, setTinta] = useState<NombreColor>('Verde');
  const [tamano, setTamano] = useState<Tamano>('mediano');
  const [giroBase, setGiroBase] = useState(0);
  const [colorPapel, setColorPapel] = useState<NombreColor>('Hueso');
  const [estampas, setEstampas] = useState<Estampa[]>([]);
  const [pestana, setPestana] = useState<Pestana>('tacos');
  const [confirmar, setConfirmar] = useState(false);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const aparece = useRef<{ indice: number; inicio: number } | null>(null);
  const vivo = useRef({ estampas, colorPapel, tacos });
  vivo.current = { estampas, colorPapel, tacos };

  useEffect(() => { cargarFiguras().then(setTacos); }, []);
  useEffect(() => { try { localStorage.setItem('sd:grabado', JSON.stringify({ estampas: estampas.length, papel: colorPapel, ts: Date.now() })); } catch { /* sin almacenamiento */ } }, [estampas, colorPapel]);

  const dibujar = useCallback(() => {
    const c = lienzo.current, { tacos: t, estampas: e, colorPapel: p } = vivo.current;
    if (!c || !t) return;
    const lado = Math.round(c.clientWidth * Math.min(window.devicePixelRatio || 1, 2));
    if (!lado) return;
    if (c.width !== lado) { c.width = c.height = lado; }
    const a = aparece.current;
    dibujarGrabado(c.getContext('2d')!, lado, p, e, t, a ? { indice: a.indice, t: (performance.now() - a.inicio) / 180 } : undefined);
    if (a && performance.now() - a.inicio < 200) requestAnimationFrame(dibujar);
    else aparece.current = null;
  }, []);
  useEffect(() => { dibujar(); }, [estampas, colorPapel, tacos, empezado, dibujar]);
  useEffect(() => {
    const c = lienzo.current; if (!c) return;
    const ro = new ResizeObserver(() => dibujar()); ro.observe(c);
    return () => ro.disconnect();
  }, [empezado, dibujar]);

  // Estampar: el taco gira un poco solo, como cuando se presiona a mano.
  const estampar = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * PAPEL, y = ((ev.clientY - r.top) / r.height) * PAPEL;
    const semilla = Math.floor(Math.random() * 1e9);
    const nueva: Estampa = { taco, tinta, x, y, tam: TAMANOS[tamano], giro: giroBase + ((semilla % 13) - 6) * (Math.PI / 180), semilla };
    if (!QUIETO) aparece.current = { indice: estampas.length, inicio: performance.now() };
    setEstampas(l => [...l, nueva]);
    setConfirmar(false);
  };

  const exportar = async () => {
    if (!tacos) return;
    const blob = await tarjeta((x, lado) => dibujarGrabado(x, lado, colorPapel, estampas, tacos), ['Mi grabado', 'de taller']);
    descargar(blob, `grabado-${estampas.length}-estampas.png`);
  };

  if (!empezado) {
    return (
      <div className="portada">
        <a className="volver" href="../../"><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>Experiencias</a>
        <div className="portada-cuerpo">
          <p className="etq">Orgánica · hecho a mano</p>
          <h1>Taller de Grabado</h1>
          <ol className="pasos">
            <li><b>1</b> Elige un taco: cada uno es una figura de la familia Orgánica.</li>
            <li><b>2</b> Elige la tinta y toca el papel para estampar. Cada impresión sale distinta.</li>
            <li><b>3</b> Superpón tintas: donde se cruzan, se mezclan. Llévate tu grabado.</li>
          </ol>
          <div className="portada-acciones">
            <button type="button" className="btn primario" onClick={() => setEmpezado(true)}>
              <span className="material-symbols-outlined" aria-hidden="true">approval</span>Empezar a estampar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-pantalla">
      <header className="barra-superior">
        <div className="lado-izq">
          <a className="volver" href="../../" id="volver-hub"><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>Experiencias</a>
          <div className="barra-info">
            <h1>Taller de Grabado</h1>
            <p className="bajada-corta">{estampas.length ? `${estampas.length} estampa${estampas.length === 1 ? '' : 's'} · toca el papel para estampar` : 'Toca el papel para estampar'}</p>
          </div>
        </div>
      </header>
      <main className="cuerpo-pantalla">
        <section className="escenario-fit" aria-label="Papel">
          <div className="lienzo-fit marco-papel" style={{ '--ratio': 1 } as React.CSSProperties}>
            <canvas ref={lienzo} className="papel" onPointerDown={estampar} role="img" aria-label={`Papel con ${estampas.length} estampas. Toca para estampar ${FIGURAS.find(f => f.id === taco)!.nombre} en ${tinta}`} />
          </div>
        </section>
        <aside className="panel-app" aria-label="Controles">
          <div className="pestanas" role="tablist" aria-label="Secciones">
            {(['tacos', 'tinta'] as Pestana[]).map(p => (
              <button key={p} type="button" role="tab" id={`tab-${p}`} aria-selected={pestana === p} aria-controls={`pag-${p}`} onClick={() => setPestana(p)}>
                <span className="material-symbols-outlined" aria-hidden="true">{p === 'tacos' ? 'approval' : 'format_color_fill'}</span>
                {p === 'tacos' ? 'Tacos' : 'Tinta y papel'}
              </button>
            ))}
          </div>
          {pestana === 'tacos' && (
            <div className="panel-pagina" role="tabpanel" id="pag-tacos" aria-labelledby="tab-tacos">
              <div className="figuras" role="radiogroup" aria-label="Taco">
                {FIGURAS.map(f => (
                  <button key={f.id} type="button" role="radio" aria-checked={taco === f.id} className="figura-btn" onClick={() => setTaco(f.id)} title={f.nombre}>
                    <span className="silueta" style={{ '--tinta': HEX[tinta], WebkitMaskImage: `url("${f.src}")`, maskImage: `url("${f.src}")` } as React.CSSProperties} />
                    <span>{f.nombre}</span>
                  </button>
                ))}
              </div>
              <div className="fila-tamano">
                <div className="seg" role="group" aria-label="Tamaño">
                  {(Object.keys(TAMANOS) as Tamano[]).map(t => (
                    <button key={t} type="button" aria-pressed={tamano === t} onClick={() => setTamano(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
                  ))}
                </div>
                <button type="button" className="btn girar" onClick={() => setGiroBase(g => g + Math.PI / 2)} aria-label="Girar el taco 90 grados">
                  <span className="material-symbols-outlined" aria-hidden="true">rotate_90_degrees_cw</span>
                </button>
              </div>
            </div>
          )}
          {pestana === 'tinta' && (
            <div className="panel-pagina" role="tabpanel" id="pag-tinta" aria-labelledby="tab-tinta">
              <span className="label">Tinta</span>
              <div className="chips" role="radiogroup" aria-label="Tinta">
                {TINTAS.map(c => <button key={c} type="button" role="radio" aria-checked={tinta === c} aria-label={c} title={c} className="chip" style={{ '--c': HEX[c] } as React.CSSProperties} onClick={() => setTinta(c)} />)}
              </div>
              <span className="label">Papel</span>
              <div className="chips" role="radiogroup" aria-label="Papel">
                {PAPELES.map(c => <button key={c} type="button" role="radio" aria-checked={colorPapel === c} aria-label={c} title={c} className="chip cuadrado" style={{ '--c': HEX[c] } as React.CSSProperties} onClick={() => setColorPapel(c)} />)}
              </div>
              <p className="que-hace">Las tintas se mezclan donde se cruzan: prueba Amarillo sobre Celeste o Rosa sobre Azul.</p>
            </div>
          )}
          <div className="panel-pie tres">
            <button type="button" className="btn solo-icono" onClick={() => setEstampas(l => l.slice(0, -1))} disabled={!estampas.length} aria-label="Deshacer la última estampa">
              <span className="material-symbols-outlined" aria-hidden="true">undo</span>
            </button>
            <button type="button" className="btn" disabled={!estampas.length} onClick={() => { if (confirmar) { setEstampas([]); setConfirmar(false); } else { setConfirmar(true); setTimeout(() => setConfirmar(false), 2500); } }}>
              <span className="material-symbols-outlined" aria-hidden="true">delete</span>{confirmar ? '¿Seguro?' : 'Limpiar'}
            </button>
            <button type="button" className="btn primario" onClick={exportar} disabled={!estampas.length}>
              <span className="material-symbols-outlined" aria-hidden="true">download</span>Descargar
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
};
