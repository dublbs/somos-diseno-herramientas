import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BOQUILLAS, COLS, FILAS, MAX_HISTORIAL, MUROS, PASO_CHORRO_MS, STICKERS } from './data/config';
import { cargar } from './lib/imagenes';
import { borrar, copiar, gotear, linea, nuevoDibujo, rociar, type Chorro, type Dibujo } from './lib/pintura';
import { dibujarMuro } from './lib/dibujar';
import { crearTarjeta, descargar } from './lib/exportar';
import { Lienzo } from './components/Lienzo';
import { Panel, type Herramienta } from './components/Panel';
import { ModalExportar } from './components/ModalExportar';
import './styles.css';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const App: React.FC = () => {
  const [muro, setMuro] = useState(MUROS[0].id);
  const [color, setColor] = useState(1); // índice en PALETA + 1
  const [boquilla, setBoquilla] = useState(BOQUILLAS[1].radio);
  const [herramienta, setHerramienta] = useState<Herramienta>('spray');
  const [sticker, setSticker] = useState(STICKERS[0].id);
  const [version, setVersion] = useState(0);
  const [puedeDeshacer, setPuedeDeshacer] = useState(false);
  const [tarjeta, setTarjeta] = useState<Blob | null>(null);
  const [aviso, setAviso] = useState('');

  const dibujo = useRef<Dibujo>(nuevoDibujo());
  const historial = useRef<Dibujo[]>([]);
  const golpes = useRef(new Uint8Array(COLS * FILAS));
  const chorros = useRef<Chorro[]>([]);
  const ultimo = useRef<[number, number] | null>(null);
  const redibujar = () => setVersion(v => v + 1);

  useEffect(() => { document.documentElement.dataset.visual = 'Pixel'; }, []);
  useEffect(() => { cargar([...MUROS.map(m => m.src), ...STICKERS.map(s => s.src)]).then(redibujar); }, []);
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(''), 2600); return () => clearTimeout(t); }, [aviso]);

  // Goteo: mientras haya chorros, cada PASO_CHORRO_MS bajan una celda.
  const goteando = useRef(false);
  const animarChorros = useCallback(() => {
    if (goteando.current) return;
    if (quieto()) { // sin animación: el chorro se pinta completo de una vez
      while (chorros.current.length) chorros.current = gotear(dibujo.current, chorros.current);
      redibujar();
      return;
    }
    goteando.current = true;
    let acumulado = 0, previo = performance.now();
    const paso = (t: number) => {
      acumulado += t - previo; previo = t;
      let cambio = false;
      while (acumulado >= PASO_CHORRO_MS && chorros.current.length) {
        chorros.current = gotear(dibujo.current, chorros.current);
        acumulado -= PASO_CHORRO_MS; cambio = true;
      }
      if (cambio) redibujar();
      if (chorros.current.length) requestAnimationFrame(paso);
      else goteando.current = false;
    };
    requestAnimationFrame(paso);
  }, []);

  const guardarHistorial = () => {
    historial.current.push(copiar(dibujo.current));
    if (historial.current.length > MAX_HISTORIAL) historial.current.shift();
    setPuedeDeshacer(true);
  };

  const aplicar = (x: number, y: number) => {
    if (herramienta === 'borrador') borrar(dibujo.current, x, y, boquilla);
    else rociar(dibujo.current, golpes.current, x, y, boquilla, color, chorros.current);
  };

  const alBajar = (x: number, y: number) => {
    guardarHistorial();
    if (herramienta === 'sticker') {
      dibujo.current.stickers.push({ id: sticker, x, y });
      redibujar();
      return;
    }
    golpes.current.fill(0);
    ultimo.current = [x, y];
    aplicar(x, y);
    redibujar();
    animarChorros();
  };

  const alMover = (x: number, y: number) => {
    if (!ultimo.current || herramienta === 'sticker') return;
    const [x0, y0] = ultimo.current;
    linea(x0, y0, x, y, aplicar);
    ultimo.current = [x, y];
    redibujar();
    animarChorros();
  };

  const alSoltar = () => { ultimo.current = null; };

  const deshacer = () => {
    const previo = historial.current.pop();
    if (!previo) return;
    chorros.current = [];
    dibujo.current = previo;
    setPuedeDeshacer(historial.current.length > 0);
    redibujar();
  };

  const vaciar = () => {
    guardarHistorial();
    chorros.current = [];
    dibujo.current = nuevoDibujo();
    redibujar();
  };

  const exportar = async () => {
    try { setTarjeta(await crearTarjeta(muro, dibujo.current)); }
    catch { setAviso('No se pudo crear la tarjeta. Inténtalo de nuevo.'); }
  };

  const dibujar = useCallback(
    (ctx: CanvasRenderingContext2D, lado: number) => dibujarMuro(ctx, lado, muro, dibujo.current),
    [muro],
  );

  const vacio = !dibujo.current.pintura.some(Boolean) && !dibujo.current.stickers.length;

  return (
    <div className="app-pantalla">
      <header className="barra-superior">
        <div className="lado-izq">
          <a className="volver" href="../../" id="volver-hub">
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            Experiencias
          </a>
          <div className="barra-info">
            <h1>Graffiti y Tags</h1>
            <p className="bajada-corta">Pinta tu firma con spray en el muro y mira cómo chorrea</p>
          </div>
        </div>
      </header>

      <main className="cuerpo-pantalla">
        <section className="escenario-fit" aria-label="Muro">
          <div className="lienzo-fit marco-muro">
            <Lienzo
              version={version}
              dibujar={dibujar}
              alBajar={alBajar}
              alMover={alMover}
              alSoltar={alSoltar}
              etiqueta={`Muro de ${MUROS.find(m => m.id === muro)!.nombre}: pinta con el dedo`}
            />
          </div>
        </section>

        <Panel
          herramienta={herramienta}
          setHerramienta={setHerramienta}
          color={color}
          setColor={c => { setColor(c); setHerramienta('spray'); }}
          boquilla={boquilla}
          setBoquilla={setBoquilla}
          muro={muro}
          setMuro={setMuro}
          sticker={sticker}
          setSticker={id => { setSticker(id); setHerramienta('sticker'); }}
          puedeDeshacer={puedeDeshacer}
          vacio={vacio}
          onDeshacer={deshacer}
          onVaciar={vaciar}
          onExportar={exportar}
        />
      </main>

      {tarjeta && (
        <ModalExportar
          blob={tarjeta}
          onCerrar={() => setTarjeta(null)}
          onGuardar={() => { descargar(tarjeta, 'graffiti-somos-diseno.png'); setAviso('Imagen descargada'); }}
        />
      )}
      {aviso && <div className="aviso" role="status">{aviso}</div>}
    </div>
  );
};

