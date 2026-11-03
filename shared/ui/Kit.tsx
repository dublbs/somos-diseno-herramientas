import React, { useEffect, useRef, useState } from 'react';

// Kit de interfaz de Somos Diseño (ronda 5): la pantalla de herramienta con barras fijas y sus controles.
// La forma de cada componente la pone shared/ui/somos-kit.css según el data-visual (Pixel, Geométrica, Orgánica).
// Sin dependencias: cada app lo importa con una ruta relativa, como shared/pixelfont.ts.

type Hijos = { children?: React.ReactNode };
const Icono: React.FC<{ nombre: string }> = ({ nombre }) => <span className="material-symbols-outlined" aria-hidden="true">{nombre}</span>;

// Pantalla completa: barra superior + cuerpo (lienzo, barra lateral derecha, barra inferior). Nada hace scroll.
export const PantallaHerramienta: React.FC<Hijos & { superior: React.ReactNode; lateral?: React.ReactNode; inferior?: React.ReactNode; anchoLateral?: number; columnasVertical?: number }> =
  ({ superior, lateral, inferior, anchoLateral, columnasVertical, children }) => (
    <div className="k-app">
      {superior}
      <main className={'k-cuerpo' + (lateral ? '' : ' sin-lateral')}
        style={{ ...(anchoLateral ? { '--k-lateral': anchoLateral + 'px' } : {}), ...(columnasVertical ? { '--k-cols-vertical': columnasVertical } : {}) } as React.CSSProperties}>
        <section className="k-lienzo" aria-label="Lienzo">{children}</section>
        {lateral && <aside className="k-lateral" aria-label="Opciones">{lateral}</aside>}
        {inferior && <nav className="k-inferior" aria-label="Herramientas">{inferior}</nav>}
      </main>
    </div>
  );

export const BarraSuperior: React.FC<Hijos & { titulo: string; bajada?: string; volver?: string }> = ({ titulo, bajada, volver = '../../', children }) => (
  <header className="k-barra-sup">
    <div className="k-izq">
      <a className="volver" href={volver} id="volver-hub"><Icono nombre="arrow_back" />Experiencias</a>
      <div className="barra-info"><h1 className="k-titulo">{titulo}</h1>{bajada && <p className="k-bajada">{bajada}</p>}</div>
    </div>
    <div className="k-der">{children}</div>
  </header>
);

export const Seccion: React.FC<Hijos & { titulo?: string; crece?: boolean }> = ({ titulo, crece, children }) => (
  <div className={'k-seccion' + (crece ? ' crece' : '')}>{titulo && <p className="k-etq">{titulo}</p>}{children}</div>
);

export const BotonAccion: React.FC<{ icono?: string; texto?: string; etiqueta?: string; primario?: boolean; disabled?: boolean; onClick: () => void }> =
  ({ icono, texto, etiqueta, primario, disabled, onClick }) => (
    <button type="button" className={'k-btn' + (primario ? ' k-primario' : '') + (texto ? '' : ' k-icono')} onClick={onClick} disabled={disabled} aria-label={etiqueta ?? texto}>
      {icono && <Icono nombre={icono} />}{texto}
    </button>
  );

// Botón que pide un segundo toque para confirmar (Vaciar, Limpiar, Empezar de nuevo).
export const Confirmar: React.FC<{ icono?: string; texto: string; pregunta?: string; disabled?: boolean; onConfirmar: () => void }> =
  ({ icono = 'delete', texto, pregunta = '¿Seguro?', disabled, onConfirmar }) => {
    const [armado, setArmado] = useState(false);
    useEffect(() => { if (!armado) return; const id = setTimeout(() => setArmado(false), 2500); return () => clearTimeout(id); }, [armado]);
    return (
      <button type="button" className="k-btn" disabled={disabled} aria-live="polite"
        onClick={() => { if (armado) { setArmado(false); onConfirmar(); } else setArmado(true); }}>
        <Icono nombre={icono} />{armado ? pregunta : texto}
      </button>
    );
  };

export interface DefHerramienta<T extends string> { id: T; nombre: string; icono: string }
export function BarraHerramientas<T extends string>({ herramientas, activa, onElegir }: { herramientas: DefHerramienta<T>[]; activa: T; onElegir: (id: T) => void }) {
  return (
    <div className="k-grupo" role="radiogroup" aria-label="Herramienta">
      {herramientas.map(h => (
        <button key={h.id} type="button" role="radio" aria-checked={activa === h.id} className="k-herr" onClick={() => onElegir(h.id)}>
          <Icono nombre={h.icono} />{h.nombre}
        </button>
      ))}
    </div>
  );
}

export const Paleta: React.FC<{ colores: Record<string, string>; elegido: string; onElegir: (nombre: string) => void; etiqueta?: string }> = ({ colores, elegido, onElegir, etiqueta = 'Color' }) => (
  <div className="k-paleta" role="radiogroup" aria-label={etiqueta}>
    {Object.entries(colores).map(([nombre, hex]) => (
      <button key={nombre} type="button" role="radio" aria-checked={elegido === nombre} aria-label={nombre} title={nombre} className="k-color"
        style={{ '--c': hex } as React.CSSProperties} onClick={() => onElegir(nombre)} />
    ))}
  </div>
);

export function Segmentado<T extends string | number>({ opciones, valor, onCambiar, etiqueta }: { opciones: { valor: T; texto: React.ReactNode }[]; valor: T; onCambiar: (v: T) => void; etiqueta: string }) {
  return (
    <div className="k-seg" role="radiogroup" aria-label={etiqueta}>
      {opciones.map(o => <button key={String(o.valor)} type="button" role="radio" aria-checked={valor === o.valor} onClick={() => onCambiar(o.valor)}>{o.texto}</button>)}
    </div>
  );
}

export const Deslizador: React.FC<{ id: string; etiqueta: string; min: number; max: number; paso?: number; valor: number; onCambiar: (v: number) => void; extremos?: [string, string] }> =
  ({ id, etiqueta, min, max, paso = 1, valor, onCambiar, extremos }) => (
    <div className="k-seccion">
      <label className="k-etq" htmlFor={id}>{etiqueta}</label>
      <input id={id} className="k-rango" type="range" min={min} max={max} step={paso} value={valor} onChange={e => onCambiar(Number(e.target.value))} />
      {extremos && <div className="k-ayuda" style={{ display: 'flex', justifyContent: 'space-between' }}><span>{extremos[0]}</span><span>{extremos[1]}</span></div>}
    </div>
  );

export const Interruptor: React.FC<{ id: string; texto: string; activo: boolean; onCambiar: (v: boolean) => void }> = ({ id, texto, activo, onCambiar }) => (
  <label className="k-interruptor" htmlFor={id}>
    <input id={id} type="checkbox" checked={activo} onChange={e => onCambiar(e.target.checked)} /><span className="riel" aria-hidden="true" />{texto}
  </label>
);

// Historial de deshacer / rehacer (40 pasos) para cualquier estado.
export function useHistorial<T>(inicial: T | (() => T), limite = 40) {
  const [estado, setEstado] = useState<T>(inicial);
  const atras = useRef<T[]>([]), adelante = useRef<T[]>([]);
  const [, refrescar] = useState(0);
  const cambiar = (nuevo: T | ((v: T) => T), guardar = true) => setEstado(v => {
    const n = typeof nuevo === 'function' ? (nuevo as (v: T) => T)(v) : nuevo;
    if (guardar && n !== v) { atras.current = [...atras.current.slice(-(limite - 1)), v]; adelante.current = []; refrescar(x => x + 1); }
    return n;
  });
  const deshacer = () => setEstado(v => { const p = atras.current.pop(); if (p === undefined) return v; adelante.current.unshift(v); refrescar(x => x + 1); return p; });
  const rehacer = () => setEstado(v => { const s = adelante.current.shift(); if (s === undefined) return v; atras.current.push(v); refrescar(x => x + 1); return s; });
  return { estado, cambiar, deshacer, rehacer, puedeDeshacer: atras.current.length > 0, puedeRehacer: adelante.current.length > 0 };
}
