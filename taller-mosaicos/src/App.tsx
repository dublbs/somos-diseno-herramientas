import React, { useState, useEffect, useCallback } from 'react';
import {
  Formato,
  FORMATOS,
  FORMAS,
  COLORES,
  Celda,
  Pincel,
  PaletaDef,
  PALETAS,
  girar,
  reflejarH,
  reflejarV,
} from './data/formas';
import { leerStorage, guardarStorage } from './lib/almacen';
import { guardarArchivo } from './lib/exportar';
import { Lienzo, pintarCelda } from './components/Lienzo';
import { Panel } from './components/Panel';
import './styles.css';

interface EstadoPersistido {
  formato: string;
  celdas: Record<string, Celda>;
  pincel: Pincel;
}

function normalizarFormato(id?: string): string {
  if (!id) return 'cuadrado';
  if (id === 'post') return 'flyer';
  if (id === 'pantalla') return 'horizontal';
  if (id === 'modulo') return 'modulo2';
  if (id === 'figura4') return 'modulo4';
  return FORMATOS.some((f) => f.id === id) ? id : 'cuadrado';
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

  const [formatoId, setFormatoId] = useState<string>(
    normalizarFormato(estadoInicial?.formato)
  );
  const [celdas, setCeldas] = useState<Record<string, Celda>>(estadoInicial?.celdas || {});
  const [pincel, setPincel] = useState<Pincel>(
    estadoInicial?.pincel || {
      id: 'media',
      r: 0,
      e: false,
      c: { f: 'Hueso', a: 'Azul', b: 'Amarillo' },
    }
  );
  const [herramienta, setHerramienta] = useState<string>('poner');
  const [sel, setSel] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [grilla, setGrilla] = useState<boolean>(true);
  const [estadoMsg, setEstadoMsg] = useState<string>('');

  useEffect(() => {
    document.documentElement.dataset.visual = 'Geométrica';
  }, []);

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

  const aplicarHerramienta = (x: number, y: number) => {
    if (!dentro(x, y)) return;
    const clave = `${x},${y}`;
    const celActual = celdas[clave];

    switch (herramienta) {
      case 'poner': {
        setCeldas({
          ...celdas,
          [clave]: {
            f: pincel.id,
            r: pincel.r,
            e: pincel.e,
            c: { ...pincel.c },
          },
        });
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
        setEstadoMsg('Selección repetida en todo el lienzo.');
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
        setEstadoMsg('Patrón escalonado.');
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
        setEstadoMsg('Simetría en 4 aplicada.');
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
        setEstadoMsg('Área girada 90°.');
        break;
      }
      case 'vaciar': {
        for (let y = 0; y < sel.h; y++) {
          for (let x = 0; x < sel.w; x++) {
            delete nuevas[`${sel.x + x},${sel.y + y}`];
          }
        }
        setCeldas(nuevas);
        setEstadoMsg('Área borrada.');
        break;
      }
    }
  };

  const generarMosaico = (seed = Date.now()) => {
    const r = azar(seed);
    const paletaElegida = PALETAS[Math.floor(r() * PALETAS.length)];
    const formasIds = FORMAS.filter((x) => x.id !== 'vacia').map((x) => x.id);
    const elegir = <T,>(l: T[]): T => l[Math.floor(r() * l.length)];

    const nuevas: Record<string, Celda> = {};
    const lado = r() < 0.5 ? 2 : 3;
    for (let y = 0; y < lado; y++) {
      for (let x = 0; x < lado; x++) {
        nuevas[`${x},${y}`] = {
          f: elegir(formasIds),
          r: Math.floor(r() * 4),
          e: false,
          c: { f: paletaElegida.f, a: paletaElegida.a, b: paletaElegida.b },
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
    setPincel((p) => ({ ...p, c: { f: paletaElegida.f, a: paletaElegida.a, b: paletaElegida.b } }));
    setEstadoMsg(`Mosaico generado con paleta «${paletaElegida.nombre}».`);
  };

  const aplicarPaletaMosaico = (paleta: PaletaDef) => {
    const nuevas: Record<string, Celda> = {};
    for (const [clave, cel] of Object.entries(celdas)) {
      nuevas[clave] = {
        ...cel,
        c: { f: paleta.f, a: paleta.a, b: paleta.b },
      };
    }
    setCeldas(nuevas);
    setPincel((p) => ({ ...p, c: { f: paleta.f, a: paleta.a, b: paleta.b } }));
    setEstadoMsg(`Paleta «${paleta.nombre}» aplicada a todo el diseño.`);
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
      `mosaico-${formato.id}-${canvas.width}x${canvas.height}.png`,
      blob
    );
    setEstadoMsg(
      res === 'cancelado'
        ? 'Descarga cancelada.'
        : res === 'ocupado'
        ? 'Ya hay una descarga pendiente.'
        : '¡Imagen descargada con éxito!'
    );
  };

  return (
    <div className="app-pantalla">
      <header className="barra-superior">
        <div className="lado-izq">
          <a className="volver" href="../../" id="volver-hub">
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            Experiencias
          </a>
          <div className="barra-info">
            <h1>Taller de Mosaicos</h1>
            <p className="bajada-corta">Diseña símbolos y patrones geométricos interactivos</p>
          </div>
        </div>
      </header>

      <div className="layout layout-mosaicos">
        <section className="escena" aria-label="Mosaico">
          <Lienzo
            formato={formato}
            celdas={celdas}
            pincel={pincel}
            herramienta={herramienta}
            grilla={grilla}
            sel={sel}
            onAplicar={aplicarHerramienta}
            onBorrar={borrarCelda}
            onGirarPincel={() => setPincel((p) => ({ ...p, ...girar(p) }))}
            onSetSel={setSel}
            hover={hover}
            setHover={setHover}
          />
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
          sel={sel}
          onEjecutarOp={ejecutarOp}
          grilla={grilla}
          onToggleGrilla={setGrilla}
          onGenerar={() => generarMosaico()}
          onVaciar={() => {
            setCeldas({});
            setSel(null);
            setEstadoMsg('Lienzo vaciado.');
          }}
          onExportarPNG={exportarPNG}
          onAplicarPaletaMosaico={aplicarPaletaMosaico}
          estadoMsg={estadoMsg}
        />
      </div>
    </div>
  );
};
