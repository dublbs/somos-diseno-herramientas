import React, { useEffect, useMemo, useRef, useState } from 'react';
import { COLORES, FIGURAS, HEX, cargarFiguras, descargar, tarjeta, type IdFigura, type NombreColor } from './lib/comun';
import { COLS, FILAS, componer, dibujarFaja, lanzadera, type Diseno } from './lib/faja';
import './styles.css';

type Pestana = 'motivos' | 'colores';
const QUIETO = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const PASADAS_POR_SEG = 7;
const FONDOS: NombreColor[] = ['Hueso', 'Celeste', 'Amarillo', 'Rosa', 'Verde'];
const HILOS: NombreColor[] = COLORES.filter(c => c !== 'Hueso');

export const App: React.FC = () => {
  const [empezado, setEmpezado] = useState(false);
  const [imagenes, setImagenes] = useState<Record<IdFigura, HTMLImageElement> | null>(null);
  const [motivos, setMotivos] = useState<IdFigura[]>(['pinguino', 'araucaria']);
  const [colores, setColores] = useState<[NombreColor, NombreColor, NombreColor]>(['Hueso', 'Verde', 'Rosa']);
  const [pestana, setPestana] = useState<Pestana>('motivos');
  const [tejiendo, setTejiendo] = useState(true);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const tejido = useRef(0);

  useEffect(() => { cargarFiguras().then(setImagenes); }, []);
  const diseno: Diseno | null = useMemo(() => imagenes && { motivos: motivos.map(m => imagenes[m]), colores }, [imagenes, motivos, colores]);
  const grilla = useMemo(() => diseno && componer(diseno), [diseno]);
  // Cada cambio vuelve a tejer la faja desde arriba.
  useEffect(() => { tejido.current = QUIETO ? FILAS : 0; setTejiendo(!QUIETO); }, [grilla]);
  useEffect(() => { try { localStorage.setItem('sd:telar', JSON.stringify({ motivos, colores, ts: Date.now() })); } catch { /* sin almacenamiento */ } }, [motivos, colores]);

  useEffect(() => {
    if (!empezado || !grilla || !diseno) return;
    const c = lienzo.current!, ctx = c.getContext('2d')!;
    let raf = 0, antes = performance.now();
    const cuadro = (ahora: number) => {
      raf = requestAnimationFrame(cuadro);
      const dt = Math.min(0.1, (ahora - antes) / 1000); antes = ahora;
      const ancho = Math.round(c.clientWidth * Math.min(window.devicePixelRatio || 1, 2));
      const cel = Math.max(2, Math.floor(ancho / COLS));
      if (c.width !== cel * COLS) { c.width = cel * COLS; c.height = cel * FILAS; }
      if (tejido.current < FILAS) {
        tejido.current = Math.min(FILAS, tejido.current + dt * PASADAS_POR_SEG);
        if (tejido.current >= FILAS) setTejiendo(false);
      }
      dibujarFaja(ctx, grilla, diseno, cel, tejido.current);
      if (tejido.current < FILAS) {
        const { fila, x } = lanzadera(tejido.current), cy = fila * cel + cel / 2;
        ctx.fillStyle = HEX.Amarillo; ctx.strokeStyle = HEX.Negro; ctx.lineWidth = Math.max(1, cel * 0.15);
        ctx.beginPath(); ctx.moveTo(x * cel - cel * 2.2, cy); ctx.lineTo(x * cel, cy - cel * 0.7); ctx.lineTo(x * cel + cel * 2.2, cy); ctx.lineTo(x * cel, cy + cel * 0.7); ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
    };
    raf = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(raf);
  }, [empezado, grilla, diseno]);

  const alternar = (id: IdFigura) => setMotivos(l => (l.includes(id) ? (l.length > 1 ? l.filter(m => m !== id) : l) : [...l, id].slice(-3)));
  const ponerColor = (i: 0 | 1 | 2, c: NombreColor) => setColores(l => { const n = [...l] as typeof l; n[i] = c; return n; });

  const exportar = async () => {
    if (!grilla || !diseno) return;
    const cel = 13, f = document.createElement('canvas');
    f.width = COLS * cel; f.height = FILAS * cel;
    dibujarFaja(f.getContext('2d')!, grilla, diseno, cel);
    const blob = await tarjeta((x, lado) => {
      // la faja de pie, con flecos arriba y abajo
      x.fillStyle = HEX[colores[0]] === HEX.Hueso ? '#E9E1D2' : HEX.Hueso; x.fillRect(0, 0, lado, lado);
      const fx = (lado - f.width) / 2, fy = (lado - f.height) / 2;
      x.drawImage(f, fx, fy);
      x.strokeStyle = HEX[colores[1]]; x.lineWidth = 3;
      for (const borde of [fy, fy + f.height]) for (let k = 0; k < COLS; k += 2) {
        const xx = fx + k * cel + cel / 2, dir = borde === fy ? -1 : 1;
        x.beginPath(); x.moveTo(xx, borde); x.lineTo(xx + (k % 4 ? 3 : -3), borde + dir * 30); x.stroke();
      }
    }, ['Mi faja', 'tejida a telar']);
    descargar(blob, `faja-${motivos.join('-')}.png`);
  };

  if (!empezado) {
    return (
      <div className="portada">
        <a className="volver" href="../../"><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>Experiencias</a>
        <div className="portada-cuerpo">
          <p className="etq">Orgánica · FA02 Faja tejida a telar</p>
          <h1>Telar</h1>
          <ol className="pasos">
            <li><b>1</b> Elige hasta 3 figuras: se vuelven los motivos de tu faja.</li>
            <li><b>2</b> Elige el fondo y los colores de los hilos.</li>
            <li><b>3</b> Mira cómo se teje, pasada por pasada, y llévatela.</li>
          </ol>
          <div className="portada-acciones">
            <button type="button" className="btn primario" onClick={() => setEmpezado(true)}>
              <span className="material-symbols-outlined" aria-hidden="true">view_week</span>Empezar a tejer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fila = (titulo: string, i: 0 | 1 | 2, opciones: NombreColor[]) => (
    <div className="fila-colores">
      <span className="label">{titulo}</span>
      <div className="chips" role="radiogroup" aria-label={titulo}>
        {opciones.map(c => (
          <button key={c} type="button" role="radio" aria-checked={colores[i] === c} aria-label={c} title={c}
            className="chip" style={{ '--c': HEX[c] } as React.CSSProperties} onClick={() => ponerColor(i, c)} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="app-pantalla">
      <header className="barra-superior">
        <div className="lado-izq">
          <a className="volver" href="../../" id="volver-hub"><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>Experiencias</a>
          <div className="barra-info">
            <h1>Telar</h1>
            <p className="bajada-corta">{tejiendo ? 'Tejiendo tu faja…' : 'Faja lista: cambia figuras o colores para tejer otra'}</p>
          </div>
        </div>
      </header>
      <main className="cuerpo-pantalla">
        <section className="escenario-fit" aria-label="Faja en el telar">
          <div className="lienzo-fit marco-faja" style={{ '--ratio': COLS / FILAS } as React.CSSProperties}>
            <canvas ref={lienzo} className="faja" role="img" aria-label={`Faja con ${motivos.length} motivos`} />
          </div>
        </section>
        <aside className="panel-app" aria-label="Controles">
          <div className="pestanas" role="tablist" aria-label="Secciones">
            {(['motivos', 'colores'] as Pestana[]).map(p => (
              <button key={p} type="button" role="tab" id={`tab-${p}`} aria-selected={pestana === p} aria-controls={`pag-${p}`} onClick={() => setPestana(p)}>
                <span className="material-symbols-outlined" aria-hidden="true">{p === 'motivos' ? 'category' : 'palette'}</span>
                {p === 'motivos' ? 'Motivos' : 'Colores'}
              </button>
            ))}
          </div>
          {pestana === 'motivos' && (
            <div className="panel-pagina" role="tabpanel" id="pag-motivos" aria-labelledby="tab-motivos">
              <span className="label">Elige hasta 3 figuras</span>
              <div className="figuras" role="group" aria-label="Figuras">
                {FIGURAS.map(f => {
                  const n = motivos.indexOf(f.id);
                  return (
                    <button key={f.id} type="button" aria-pressed={n >= 0} className="figura-btn" onClick={() => alternar(f.id)} title={f.nombre}>
                      <img src={f.src} alt="" />
                      <span>{f.nombre}</span>
                      {n >= 0 && <b className="orden">{n + 1}</b>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {pestana === 'colores' && (
            <div className="panel-pagina" role="tabpanel" id="pag-colores" aria-labelledby="tab-colores">
              {fila('Fondo', 0, FONDOS)}
              {fila('Hilo de las figuras', 1, HILOS.filter(c => c !== colores[0]))}
              {fila('Hilo del detalle', 2, HILOS.filter(c => c !== colores[0]))}
            </div>
          )}
          <div className="panel-pie">
            <button type="button" className="btn" onClick={() => { tejido.current = 0; setTejiendo(true); }}>
              <span className="material-symbols-outlined" aria-hidden="true">restart_alt</span>Tejer de nuevo
            </button>
            <button type="button" className="btn primario" onClick={exportar} disabled={tejiendo}>
              <span className="material-symbols-outlined" aria-hidden="true">download</span>Descargar
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
};
