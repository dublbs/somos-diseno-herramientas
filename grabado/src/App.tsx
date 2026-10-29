import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FIGURAS, HEX, cargarFiguras, descargar, tarjeta, type IdFigura, type NombreColor } from './lib/comun';
import { PAPEL, TAMANOS, dibujarGrabado, type Estampa, type Tamano } from './lib/grabado';
import { BarraSuperior, BotonAccion, Confirmar, Interruptor, Paleta, PantallaHerramienta, Seccion, Segmentado, useHistorial } from '../../shared/ui/Kit';
import '../../shared/ui/somos-kit.css';
import './styles.css';

const QUIETO = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const TINTAS: NombreColor[] = ['Negro', 'Azul', 'Lapislázuli', 'Verde', 'Rosa', 'Morado', 'Amarillo', 'Celeste'];
const PAPELES: NombreColor[] = ['Hueso', 'Celeste', 'Amarillo', 'Rosa'];
// Corrimiento fijo de cada tinta (en unidades del papel de 1000) cuando el registro está corrido.
const corrimiento = (c: NombreColor): [number, number] => { const a = TINTAS.indexOf(c) * 2.4; return [Math.cos(a) * 9, Math.sin(a) * 9]; };

export const App: React.FC = () => {
  const [empezado, setEmpezado] = useState(false);
  const [tacos, setTacos] = useState<Record<IdFigura, HTMLImageElement> | null>(null);
  const [taco, setTaco] = useState<IdFigura>('helecho');
  const [tinta, setTinta] = useState<NombreColor>('Verde');
  const [tamano, setTamano] = useState<Tamano>('mediano');
  const [giroBase, setGiroBase] = useState(0);
  const [colorPapel, setColorPapel] = useState<NombreColor>('Hueso');
  const historial = useHistorial<Estampa[]>([]);
  const estampas = historial.estado;
  const [registro, setRegistro] = useState(false);
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
    let x = ((ev.clientX - r.left) / r.width) * PAPEL, y = ((ev.clientY - r.top) / r.height) * PAPEL;
    const semilla = Math.floor(Math.random() * 1e9);
    // Registro corrido (como la risografía): cada tinta es una «placa» y queda corrida siempre hacia el mismo lado.
    if (registro) { const [dx, dy] = corrimiento(tinta); x += dx; y += dy; }
    const nueva: Estampa = { taco, tinta, x, y, tam: TAMANOS[tamano], giro: giroBase + ((semilla % 13) - 6) * (Math.PI / 180), semilla };
    if (!QUIETO) aparece.current = { indice: estampas.length, inicio: performance.now() };
    historial.cambiar(l => [...l, nueva]);
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

  const nombreTaco = FIGURAS.find(f => f.id === taco)!.nombre;
  return (
    <PantallaHerramienta
      anchoLateral={300}
      superior={
        <BarraSuperior titulo="Taller de Grabado" bajada={estampas.length ? `${estampas.length} estampa${estampas.length === 1 ? '' : 's'} · toca el papel para estampar` : 'Toca el papel para estampar'}>
          <BotonAccion icono="undo" etiqueta="Deshacer la última estampa" onClick={historial.deshacer} disabled={!historial.puedeDeshacer} />
          <BotonAccion icono="redo" etiqueta="Rehacer" onClick={historial.rehacer} disabled={!historial.puedeRehacer} />
          <BotonAccion icono="download" texto="Descargar" primario onClick={exportar} disabled={!estampas.length} />
        </BarraSuperior>
      }
      lateral={<>
        <Seccion titulo="Tinta">
          <Paleta etiqueta="Tinta" colores={Object.fromEntries(TINTAS.map(c => [c, HEX[c]]))} elegido={tinta} onElegir={c => setTinta(c as NombreColor)} />
        </Seccion>
        <Seccion titulo="Papel">
          <Paleta etiqueta="Papel" colores={Object.fromEntries(PAPELES.map(c => [c, HEX[c]]))} elegido={colorPapel} onElegir={c => setColorPapel(c as NombreColor)} />
        </Seccion>
        <Seccion titulo={`Mezclas con ${tinta}`} crece>
          <div className="mezclas" style={{ '--papel': HEX[colorPapel] } as React.CSSProperties}>
            {TINTAS.filter(c => c !== tinta).map(c => (
              <button key={c} type="button" className="mezcla" onClick={() => setTinta(c)} aria-label={`${tinta} sobre ${c}: elegir ${c}`} title={`${tinta} sobre ${c}`}>
                <span className="gota" style={{ background: HEX[c] }} /><span className="gota encima" style={{ background: HEX[tinta] }} />
              </button>
            ))}
          </div>
          <p className="k-ayuda">Las tintas se multiplican donde se cruzan, como en el grabado y la risografía. Toca una mezcla para usar esa tinta.</p>
          <Interruptor id="registro" texto="Registro corrido" activo={registro} onCambiar={setRegistro} />
        </Seccion>
        <Confirmar texto="Limpiar el papel" disabled={!estampas.length} onConfirmar={() => historial.cambiar([])} />
      </>}
      inferior={<>
        <div className="k-grupo tacos" role="radiogroup" aria-label="Taco">
          {FIGURAS.map(f => (
            <button key={f.id} type="button" role="radio" aria-checked={taco === f.id} className="k-herr" onClick={() => setTaco(f.id)} title={f.nombre}>
              <span className="silueta" aria-hidden="true" style={{ '--tinta': HEX[tinta], WebkitMaskImage: `url("${f.src}")`, maskImage: `url("${f.src}")` } as React.CSSProperties} />
              {f.nombre}
            </button>
          ))}
        </div>
        <div className="k-grupo">
          <Segmentado etiqueta="Tamaño del taco" valor={tamano} onCambiar={setTamano}
            opciones={(Object.keys(TAMANOS) as Tamano[]).map(t => ({ valor: t, texto: t[0].toUpperCase() + t.slice(1) }))} />
          <BotonAccion icono="rotate_90_degrees_cw" etiqueta="Girar el taco 90 grados" onClick={() => setGiroBase(g => g + Math.PI / 2)} />
        </div>
      </>}
    >
      <div className="escenario-fit">
        <div className="lienzo-fit marco-papel" style={{ '--ratio': 1 } as React.CSSProperties}>
          <canvas ref={lienzo} className="papel" onPointerDown={estampar} role="img" aria-label={`Papel con ${estampas.length} estampas. Toca para estampar ${nombreTaco} en ${tinta}`} />
        </div>
      </div>
    </PantallaHerramienta>
  );
};
