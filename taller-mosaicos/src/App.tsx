import React, { useState, useEffect, useCallback } from 'react';
import {
  Formato,
  FORMATOS,
  FORMAS,
  COLORES,
  MAX_COLORES,
  Celda,
  Pincel,
  FiguraGuardada,
  girar,
  reflejarH,
  reflejarV,
  usaA,
  usaB,
} from './data/formas';
import { leerStorage, guardarStorage } from './lib/almacen';
import { construirSVG, guardarArchivo } from './lib/exportar';
import { Lienzo, pintarCelda } from './components/Lienzo';
import { Panel } from './components/Panel';
import './styles.css';

interface EstadoPersistido {
  formato: string;
  celdas: Record<string, Celda>;
  pincel: Pincel;
}

function azar(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const App: React.FC = () => {
  const estadoInicial = leerStorage<EstadoPersistido | null>('geo:estado', null);

  const [formatoId, setFormatoId] = useState<string>(estadoInicial?.formato || 'post');
  const [celdas, setCeldas] = useState<Record<string, Celda>>(estadoInicial?.celdas || {});
  const [pincel, setPincel] = useState<Pincel>(
    estadoInicial?.pincel || {
      tipo: 'forma',
      id: 'media',
      r: 0,
      e: false,
      c: { f: 'Rosa', a: 'Lapislázuli', b: 'Amarillo' },
    }
  );
  const [herramienta, setHerramienta] = useState<string>('poner');
  const [pestana, setPestana] = useState<'base' | 'mias'>('base');
  const [sel, setSel] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [grilla, setGrilla] = useState<boolean>(true);
  const [misFiguras, setMisFiguras] = useState<FiguraGuardada[]>(() =>
    leerStorage<FiguraGuardada[]>('geo:figuras', [])
  );
  const [estadoMsg, setEstadoMsg] = useState<string>('');
  const [svgTexto, setSvgTexto] = useState<string | null>(null);

  const formato = FORMATOS.find((f) => f.id === formatoId) || FORMATOS[0];
  const dentro = useCallback(
    (x: number, y: number) => x >= 0 && y >= 0 && x < formato.cols && y < formato.filas,
    [formato]
  );

  // Persistir estado cuando cambie
  useEffect(() => {
    guardarStorage('geo:estado', {
      formato: formatoId,
      celdas,
      pincel,
    });
  }, [formatoId, celdas, pincel]);

  // Si no había estado guardado inicial, generamos una muestra
  useEffect(() => {
    if (!estadoInicial) {
      generarMosaico(20261103);
    }
  }, []);

  const coloresUsados = useCallback(() => {
    const set = new Set<string>();
    for (const [clave, cel] of Object.entries(celdas)) {
      const [x, y] = clave.split(',').map(Number);
      if (!dentro(x, y)) continue;
      set.add(cel.c.f);
      if (usaA(cel.f)) set.add(cel.c.a);
      if (usaB(cel.f)) set.add(cel.c.b);
    }
    if (Object.keys(celdas).length < formato.cols * formato.filas) {
      set.add('Hueso');
    }
    return Array.from(set);
  }, [celdas, formato, dentro]);

  const aplicarHerramienta = (x: number, y: number) => {
    if (!dentro(x, y)) return;
    const clave = `${x},${y}`;
    const celActual = celdas[clave];

    switch (herramienta) {
      case 'poner': {
        const nuevas = { ...celdas };
        if (pincel.tipo === 'forma') {
          nuevas[clave] = {
            f: pincel.id,
            r: pincel.r,
            e: pincel.e,
            c: { ...pincel.c },
          };
        } else {
          const fig = misFiguras.find((m) => m.id === pincel.id);
          if (fig) {
            fig.celdas.forEach((c) => {
              const nx = x + c.x;
              const ny = y + c.y;
              if (dentro(nx, ny)) {
                nuevas[`${nx},${ny}`] = {
                  f: c.f,
                  r: c.r,
                  e: c.e,
                  c: { ...c.c },
                };
              }
            });
          }
        }
        setCeldas(nuevas);
        break;
      }
      case 'girar': {
        if (celActual) {
          setCeldas({
            ...celdas,
            [clave]: { ...celActual, ...girar(celActual) },
          });
        }
        break;
      }
      case 'reflejar': {
        if (celActual) {
          setCeldas({
            ...celdas,
            [clave]: { ...celActual, ...reflejarH(celActual) },
          });
        }
        break;
      }
      case 'borrar': {
        if (celActual) {
          const copia = { ...celdas };
          delete copia[clave];
          setCeldas(copia);
        }
        break;
      }
      case 'gotero': {
        if (celActual) {
          setPincel({
            tipo: 'forma',
            id: celActual.f,
            r: celActual.r,
            e: celActual.e,
            c: { ...celActual.c },
          });
          setHerramienta('poner');
        }
        break;
      }
    }
  };

  const borrarCelda = (x: number, y: number) => {
    const clave = `${x},${y}`;
    if (celdas[clave]) {
      const copia = { ...celdas };
      delete copia[clave];
      setCeldas(copia);
    }
  };

  const bloqueDeSeleccion = (s: { x: number; y: number; w: number; h: number }) => {
    const out: { x: number; y: number; cel: Celda | null }[] = [];
    for (let y = 0; y < s.h; y++) {
      for (let x = 0; x < s.w; x++) {
        const c = celdas[`${s.x + x},${s.y + y}`];
        out.push({ x, y, cel: c ? { ...c, c: { ...c.c } } : null });
      }
    }
    return out;
  };

  const estampar = (
    nuevasCeldas: Record<string, Celda>,
    celdasBloque: { x: number; y: number; cel: Celda | null }[],
    ox: number,
    oy: number,
    transformar: (p: { x: number; y: number; cel: Celda | null }) => {
      x: number;
      y: number;
      cel: Celda | null;
    } = (c) => c
  ) => {
    celdasBloque.forEach(({ x, y, cel }) => {
      const p = transformar({ x, y, cel });
      const X = ox + p.x;
      const Y = oy + p.y;
      if (!dentro(X, Y)) return;
      if (p.cel) {
        nuevasCeldas[`${X},${Y}`] = p.cel;
      } else {
        delete nuevasCeldas[`${X},${Y}`];
      }
    });
  };

  const ejecutarOp = (op: string) => {
    if (!sel) return;
    const nuevas = { ...celdas };

    switch (op) {
      case 'repetir': {
        const b = bloqueDeSeleccion(sel);
        for (let oy = sel.y - Math.ceil(sel.y / sel.h) * sel.h; oy < formato.filas; oy += sel.h) {
          for (let ox = sel.x - Math.ceil(sel.x / sel.w) * sel.w; ox < formato.cols; ox += sel.w) {
            estampar(nuevas, b, ox, oy);
          }
        }
        setCeldas(nuevas);
        setEstadoMsg('Repetido en todo el lienzo.');
        break;
      }
      case 'escalonar': {
        const b = bloqueDeSeleccion(sel);
        let fila = 0;
        for (let oy = sel.y; oy < formato.filas; oy += sel.h, fila++) {
          const corr = fila % sel.w;
          for (let ox = sel.x - sel.w * 2 + corr; ox < formato.cols; ox += sel.w) {
            estampar(nuevas, b, ox, oy);
          }
        }
        fila = -1;
        for (let oy = sel.y - sel.h; oy > -sel.h; oy -= sel.h, fila--) {
          const corr = ((fila % sel.w) + sel.w) % sel.w;
          for (let ox = sel.x - sel.w * 2 + corr; ox < formato.cols; ox += sel.w) {
            estampar(nuevas, b, ox, oy);
          }
        }
        setCeldas(nuevas);
        setEstadoMsg('Escalonado: cada fila corre una celda.');
        break;
      }
      case 'derecha': {
        const b = bloqueDeSeleccion(sel);
        estampar(nuevas, b, sel.x + sel.w, sel.y, ({ x, y, cel }) => ({
          x: sel.w - 1 - x,
          y,
          cel: cel && { ...cel, ...reflejarH(cel) },
        }));
        setCeldas(nuevas);
        setSel({ ...sel, w: sel.w * 2 });
        setEstadoMsg('Reflejado hacia la derecha.');
        break;
      }
      case 'abajo': {
        const b = bloqueDeSeleccion(sel);
        estampar(nuevas, b, sel.x, sel.y + sel.h, ({ x, y, cel }) => ({
          x,
          y: sel.h - 1 - y,
          cel: cel && { ...cel, ...reflejarV(cel) },
        }));
        setCeldas(nuevas);
        setSel({ ...sel, h: sel.h * 2 });
        setEstadoMsg('Reflejado hacia abajo.');
        break;
      }
      case 'cuatro': {
        const b = bloqueDeSeleccion(sel);
        estampar(nuevas, b, sel.x + sel.w, sel.y, ({ x, y, cel }) => ({
          x: sel.w - 1 - x,
          y,
          cel: cel && { ...cel, ...reflejarH(cel) },
        }));
        const selDoble = { ...sel, w: sel.w * 2 };
        const b2 = [];
        for (let y = 0; y < selDoble.h; y++) {
          for (let x = 0; x < selDoble.w; x++) {
            const c = nuevas[`${selDoble.x + x},${selDoble.y + y}`];
            b2.push({ x, y, cel: c ? { ...c, c: { ...c.c } } : null });
          }
        }
        estampar(nuevas, b2, selDoble.x, selDoble.y + selDoble.h, ({ x, y, cel }) => ({
          x,
          y: selDoble.h - 1 - y,
          cel: cel && { ...cel, ...reflejarV(cel) },
        }));
        setCeldas(nuevas);
        setSel({ ...selDoble, h: selDoble.h * 2 });
        setEstadoMsg('Reflejado en cuatro: figura simétrica.');
        break;
      }
      case 'girar': {
        const b = bloqueDeSeleccion(sel);
        for (let y = 0; y < sel.h; y++) {
          for (let x = 0; x < sel.w; x++) {
            delete nuevas[`${sel.x + x},${sel.y + y}`];
          }
        }
        estampar(nuevas, b, sel.x, sel.y, ({ x, y, cel }) => ({
          x: sel.h - 1 - y,
          y: x,
          cel: cel && { ...cel, ...girar(cel) },
        }));
        setCeldas(nuevas);
        setSel({ ...sel, w: sel.h, h: sel.w });
        setEstadoMsg('Selección girada 90°.');
        break;
      }
      case 'vaciar': {
        for (let y = 0; y < sel.h; y++) {
          for (let x = 0; x < sel.w; x++) {
            delete nuevas[`${sel.x + x},${sel.y + y}`];
          }
        }
        setCeldas(nuevas);
        setEstadoMsg('Selección vaciada.');
        break;
      }
      case 'guardarFigura': {
        const lista = bloqueDeSeleccion(sel)
          .filter((c) => c.cel !== null)
          .map(({ x, y, cel }) => ({ x, y, ...cel! }));
        if (!lista.length) {
          setEstadoMsg('La selección está vacía: no hay figura que guardar.');
          return;
        }
        const id = 'fig' + Date.now();
        const nuevaFig: FiguraGuardada = {
          id,
          nombre: `Figura ${misFiguras.length + 1}`,
          w: sel.w,
          h: sel.h,
          celdas: lista,
        };
        const actualizadas = [...misFiguras, nuevaFig];
        setMisFiguras(actualizadas);
        guardarStorage('geo:figuras', actualizadas);
        setPincel({ tipo: 'figura', id, r: 0, e: false, c: pincel.c });
        setPestana('mias');
        setHerramienta('poner');
        setEstadoMsg('Figura guardada en «Mis figuras».');
        break;
      }
    }
  };

  const generarMosaico = (seed = Date.now()) => {
    const r = azar(seed);
    const elegir = <T,>(l: T[]): T => l[Math.floor(r() * l.length)];
    const pares = [
      ['Lapislázuli', 'Rosa'],
      ['Azul', 'Celeste'],
      ['Morado', 'Amarillo'],
      ['Negro', 'Amarillo'],
      ['Verde', 'Azul'],
      ['Rosa', 'Lapislázuli'],
      ['Hueso', 'Negro'],
      ['Celeste', 'Azul'],
    ];
    const [f, a] = elegir(pares);
    const resto = COLORES.filter((c) => c !== f && c !== a);
    const b = elegir(resto);
    const formasIds = FORMAS.filter((x) => x.id !== 'vacia').map((x) => x.id);

    const nuevas: Record<string, Celda> = {};
    const lado = r() < 0.5 ? 2 : 3;
    for (let y = 0; y < lado; y++) {
      for (let x = 0; x < lado; x++) {
        const invertir = r() < 0.3;
        nuevas[`${x},${y}`] = {
          f: elegir(formasIds),
          r: Math.floor(r() * 4),
          e: false,
          c: invertir ? { f: a, a: f, b } : { f, a, b },
        };
      }
    }

    // Reflejar en 4
    const selInicial = { x: 0, y: 0, w: lado, h: lado };
    const b1 = [];
    for (let y = 0; y < selInicial.h; y++) {
      for (let x = 0; x < selInicial.w; x++) {
        const c = nuevas[`${x},${y}`];
        b1.push({ x, y, cel: c ? { ...c, c: { ...c.c } } : null });
      }
    }
    estampar(nuevas, b1, lado, 0, ({ x, y, cel }) => ({
      x: lado - 1 - x,
      y,
      cel: cel && { ...cel, ...reflejarH(cel) },
    }));

    const selDoble = { x: 0, y: 0, w: lado * 2, h: lado };
    const b2 = [];
    for (let y = 0; y < selDoble.h; y++) {
      for (let x = 0; x < selDoble.w; x++) {
        const c = nuevas[`${x},${y}`];
        b2.push({ x, y, cel: c ? { ...c, c: { ...c.c } } : null });
      }
    }
    estampar(nuevas, b2, 0, lado, ({ x, y, cel }) => ({
      x,
      y: lado - 1 - y,
      cel: cel && { ...cel, ...reflejarV(cel) },
    }));

    // Repetir en todo el formato
    const wBloque = lado * 2;
    const hBloque = lado * 2;
    const bCompleto = [];
    for (let y = 0; y < hBloque; y++) {
      for (let x = 0; x < wBloque; x++) {
        const c = nuevas[`${x},${y}`];
        bCompleto.push({ x, y, cel: c ? { ...c, c: { ...c.c } } : null });
      }
    }
    for (let oy = 0; oy < formato.filas; oy += hBloque) {
      for (let ox = 0; ox < formato.cols; ox += wBloque) {
        estampar(nuevas, bCompleto, ox, oy);
      }
    }

    setCeldas(nuevas);
    setSel(null);
    setPincel((p) => ({ ...p, c: { f, a, b } }));
    setEstadoMsg('Mosaico generado: una figura de formas base reflejada en cuatro y repetida.');
  };

  const exportarPNG = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = formato.cols * formato.celda;
    canvas.height = formato.filas * formato.celda;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#F4EEE3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const t = formato.celda;
    for (const [clave, cel] of Object.entries(celdas)) {
      const [x, y] = clave.split(',').map(Number);
      if (dentro(x, y)) pintarCelda(ctx, cel, x * t, y * t, t);
    }

    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) return;
    const res = await guardarArchivo(
      `geometrica-${formato.id}-${canvas.width}x${canvas.height}.png`,
      blob
    );
    setEstadoMsg(
      res === 'cancelado'
        ? 'Descarga cancelada.'
        : res === 'ocupado'
        ? 'Ya hay una descarga pendiente.'
        : 'PNG descargado.'
    );
  };

  const exportarSVG = async () => {
    const svg = construirSVG(formato, celdas);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const res = await guardarArchivo(`geometrica-${formato.id}.svg`, blob);
    setEstadoMsg(
      res === 'cancelado'
        ? 'Descarga cancelada.'
        : res === 'ocupado'
        ? 'Ya hay una descarga pendiente.'
        : 'SVG descargado.'
    );
  };

  const copiarSVG = () => {
    const svg = construirSVG(formato, celdas);
    const respaldo = () => {
      setSvgTexto(svg);
      setEstadoMsg('Copia el SVG del recuadro y pégalo en Figma.');
    };
    try {
      navigator.clipboard
        .writeText(svg)
        .then(() => {
          setEstadoMsg('SVG copiado. Pégalo en Figma con Ctrl/Cmd+V.');
        })
        .catch(respaldo);
    } catch {
      respaldo();
    }
  };

  const usados = coloresUsados();

  return (
    <div className="app">
      <a className="volver" href="../../" id="volver-hub">
        <span aria-hidden="true">←</span> Experiencias
      </a>

      <header>
        <p className="eyebrow">Somos Diseño · Visual Geométrica · Herramienta del equipo</p>
        <h1>Taller de mosaicos</h1>
        <p className="bajada">
          Todo sale de la celda. Pon formas base en la grilla, arma tu figura y multiplícala con las
          operaciones del sistema: repetir, reflejar, escalonar y girar.
        </p>
      </header>

      <div className="layout">
        <section className="escena" aria-label="Mosaico">
          <Lienzo
            formato={formato}
            celdas={celdas}
            pincel={pincel}
            herramienta={herramienta}
            grilla={grilla}
            sel={sel}
            misFiguras={misFiguras}
            onAplicar={aplicarHerramienta}
            onBorrar={borrarCelda}
            onGirarPincel={() => setPincel((p) => ({ ...p, ...girar(p) }))}
            onSetSel={setSel}
            hover={hover}
            setHover={setHover}
          />

          <div className="info-fila">
            <span className="mono" id="info">
              {`${formato.cols} × ${formato.filas} celdas de ${formato.celda} px`}
            </span>
            <span
              className={`pill ${usados.length > MAX_COLORES ? 'warn' : 'ok'}`}
              id="regla"
              title={usados.join(', ')}
            >
              {`${usados.length} de ${MAX_COLORES} colores`}
            </span>
          </div>

          {usados.length > MAX_COLORES && (
            <p className="aviso" id="aviso-colores" role="status">
              {`Regla 3: hasta ${MAX_COLORES} colores por pieza (un fondo y tres de figura). Ahora hay ${
                usados.length
              }: ${usados.join(', ')}.`}
            </p>
          )}

          <p className="nota">
            Teclado: flechas para moverte, Enter para aplicar la herramienta, R para girar la forma y
            Supr para borrar.
          </p>
        </section>

        <Panel
          formato={formato}
          onCambiarFormato={(fId) => {
            setFormatoId(fId);
            setSel(null);
          }}
          herramienta={herramienta}
          onCambiarHerramienta={(h) => {
            setHerramienta(h);
            if (h !== 'seleccionar') setSel(null);
          }}
          pincel={pincel}
          onCambiarPincel={setPincel}
          pestana={pestana}
          onCambiarPestana={setPestana}
          sel={sel}
          onEjecutarOp={ejecutarOp}
          misFiguras={misFiguras}
          onBorrarFigura={(id) => {
            const actualizadas = misFiguras.filter((m) => m.id !== id);
            setMisFiguras(actualizadas);
            guardarStorage('geo:figuras', actualizadas);
            if (pincel.tipo === 'figura' && pincel.id === id) {
              setPincel({
                tipo: 'forma',
                id: 'media',
                r: 0,
                e: false,
                c: { f: 'Rosa', a: 'Lapislázuli', b: 'Amarillo' },
              });
            }
          }}
          grilla={grilla}
          onToggleGrilla={setGrilla}
          onGenerar={() => generarMosaico()}
          onVaciar={() => {
            setCeldas({});
            setSel(null);
            setEstadoMsg('Lienzo vaciado.');
          }}
          onExportarPNG={exportarPNG}
          onExportarSVG={exportarSVG}
          onCopiarSVG={copiarSVG}
          estadoMsg={estadoMsg}
          svgTexto={svgTexto}
        />
      </div>
    </div>
  );
};
