import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

// Kit v2 «herramienta» (plan 012, etapa 1): UI neutra de herramienta de diseño, como Figma UI3 y Affinity.
// Estilos en shared/ui/herramienta.css (prefijo h-, tokens --h-*). Guía y ejemplos: shared/ui/README.md.
// Convive con el kit anterior (Kit.tsx, k-): las apps migran de a una. Sin dependencias.

type Hijos = { children?: React.ReactNode };

// ---------------------------------------------------------------- íconos
// Material Symbols autoalojado (shared/somos-icons.css). Para sumar uno: shared/fonts/README.md.
export const Icono: React.FC<{ nombre: string; tam?: number }> = ({ nombre, tam }) =>
  <span className="material-symbols-outlined h-icono" aria-hidden="true" style={tam ? { fontSize: tam } : undefined}>{nombre}</span>;

// ---------------------------------------------------------------- plantilla
export interface Historia { deshacer: () => void; rehacer: () => void; puedeDeshacer: boolean; puedeRehacer: boolean }

export interface PropsMarco extends Hijos {
  titulo: string;
  ayuda?: React.ReactNode;           // línea corta junto al título (qué hace la herramienta activa); se oculta en angosto
  volver?: string;                   // enlace al hub; por defecto '../../'
  historia?: Historia;               // muestra ↶ ↷ en la barra superior (useHistorial lo entrega tal cual)
  acciones?: React.ReactNode;        // botones a la derecha, antes del primario (ej. «Sorpréndeme»)
  primario?: { texto: string; icono?: string; onClick: () => void; disabled?: boolean }; // «Llévatelo»
  herramientas?: React.ReactNode;    // la BarraFlotante, abajo al centro del lienzo
  panel?: React.ReactNode;           // contenido del panel derecho (SeccionPanel…); tiene scroll propio
  anchoPanel?: number;               // px, por defecto 300
  altoPanelVertical?: string;        // en vertical el panel va abajo con este alto (CSS), por defecto '42%'
  aviso?: React.ReactNode;           // mensaje breve sobre el lienzo (usa useAviso)
  sobreEscenario?: React.ReactNode;  // capas flotantes sobre el escenario (barritas, etc.)
}

// Pantalla completa: barra superior delgada, lienzo (children) con la barra flotante abajo y el panel derecho.
// La página nunca hace scroll; solo el panel. En vertical el panel pasa abajo.
export const MarcoHerramienta: React.FC<PropsMarco> = ({ titulo, ayuda, volver = '../../', historia, acciones, primario, herramientas, panel, anchoPanel, altoPanelVertical, aviso, sobreEscenario, children }) => {
  useEffect(() => { document.documentElement.dataset.ui = 'v2'; }, []);
  const estilo = { ...(anchoPanel ? { '--h-panel-ancho': anchoPanel + 'px' } : {}), ...(altoPanelVertical ? { '--h-panel-alto': altoPanelVertical } : {}) } as React.CSSProperties;
  return (
    <div className="h-marco" style={estilo}>
      <header className="h-barra-sup">
        <div className="h-izq">
          <a className="h-volver" href={volver} aria-label="Volver a las experiencias"><Icono nombre="arrow_back" /><span className="h-btn-texto">Experiencias</span></a>
          <span className="h-divisor" aria-hidden="true" />
          <div className="h-titulos"><h1 className="h-titulo">{titulo}</h1>{ayuda && <p className="h-ayuda-sup">{ayuda}</p>}</div>
        </div>
        <div className="h-der">
          {historia && (<>
            <BotonIcono icono="undo" etiqueta="Deshacer" variante="fantasma" onClick={historia.deshacer} disabled={!historia.puedeDeshacer} />
            <BotonIcono icono="redo" etiqueta="Rehacer" variante="fantasma" onClick={historia.rehacer} disabled={!historia.puedeRehacer} />
            {(acciones || primario) && <span className="h-divisor" aria-hidden="true" />}
          </>)}
          {acciones}
          {primario && <Boton icono={primario.icono ?? 'ios_share'} texto={primario.texto} variante="primario" onClick={primario.onClick} disabled={primario.disabled} />}
        </div>
      </header>
      <main className={'h-cuerpo' + (panel ? '' : ' sin-panel')}>
        <section className="h-zona-lienzo" aria-label="Lienzo">
          <div className="h-escenario">{children}{sobreEscenario}</div>
          {herramientas}
          {aviso && <div className="h-aviso" role="status">{aviso}</div>}
        </section>
        {panel && <aside className="h-panel" aria-label="Propiedades"><div className="h-panel-contenido">{panel}</div></aside>}
      </main>
    </div>
  );
};

// Caja con la proporción del lienzo (ancho / alto) que cabe entera en el escenario. Es position:relative: dentro
// van el <canvas> (100 % × 100 %) y, encima, Manijas o BarritaSeleccion.
export const LienzoAjustado = React.forwardRef<HTMLDivElement, Hijos & { proporcion: number; className?: string; style?: React.CSSProperties }>(
  ({ proporcion, className, style, children }, ref) => (
    <div ref={ref} className={'h-ajustado' + (className ? ' ' + className : '')} style={{ '--h-ratio': proporcion, ...style } as React.CSSProperties}>{children}</div>
  ));
LienzoAjustado.displayName = 'LienzoAjustado';

// Mensaje breve que se borra solo (2,6 s). const [aviso, avisar] = useAviso(); avisar('Listo'); <MarcoHerramienta aviso={aviso}>
export function useAviso(ms = 2600): [string, (texto: string) => void] {
  const [texto, setTexto] = useState('');
  useEffect(() => { if (!texto) return; const t = setTimeout(() => setTexto(''), ms); return () => clearTimeout(t); }, [texto, ms]);
  return [texto, setTexto];
}

// ---------------------------------------------------------------- átomos
type Variante = 'normal' | 'primario' | 'fantasma' | 'peligro';
const claseVariante = (v?: Variante) => (v && v !== 'normal' ? ' h-' + v : '');

export interface PropsBoton {
  texto: string; icono?: string; variante?: Variante; onClick: () => void; disabled?: boolean;
  activo?: boolean;      // estado encendido (aria-pressed)
  ancho?: boolean;       // ocupa todo el ancho
  etiqueta?: string;     // nombre accesible si difiere del texto
}
export const Boton: React.FC<PropsBoton> = ({ texto, icono, variante, onClick, disabled, activo, ancho, etiqueta }) => (
  <button type="button" className={'h-btn' + claseVariante(variante) + (ancho ? ' h-ancho' : '')} onClick={onClick} disabled={disabled}
    aria-pressed={activo === undefined ? undefined : activo} aria-label={etiqueta}>
    {icono && <Icono nombre={icono} />}<span className="h-btn-texto">{texto}</span>
  </button>
);

// Solo ícono: `etiqueta` es obligatoria (nombre accesible y tooltip).
export const BotonIcono: React.FC<{ icono: string; etiqueta: string; variante?: Variante; onClick: () => void; disabled?: boolean; activo?: boolean }> =
  ({ icono, etiqueta, variante, onClick, disabled, activo }) => (
    <button type="button" className={'h-btn h-solo-icono' + claseVariante(variante)} onClick={onClick} disabled={disabled} aria-label={etiqueta} title={etiqueta}
      aria-pressed={activo === undefined ? undefined : activo}>
      <Icono nombre={icono} />
    </button>
  );

export interface OpcionSegmento<T> { valor: T; texto?: React.ReactNode; icono?: string; etiqueta?: string; disabled?: boolean }
export function Segmento<T extends string | number | boolean>({ opciones, valor, onCambiar, etiqueta }: { opciones: OpcionSegmento<T>[]; valor: T; onCambiar: (v: T) => void; etiqueta: string }) {
  return (
    <div className="h-seg" role="radiogroup" aria-label={etiqueta}>
      {opciones.map(o => (
        <button key={String(o.valor)} type="button" role="radio" aria-checked={valor === o.valor} aria-label={o.etiqueta} title={o.etiqueta} disabled={o.disabled} onClick={() => onCambiar(o.valor)}>
          {o.icono && <Icono nombre={o.icono} />}{o.texto}
        </button>
      ))}
    </div>
  );
}

export const Deslizador: React.FC<{ etiqueta: string; min: number; max: number; paso?: number; valor: number; onCambiar: (v: number) => void; onSoltar?: (v: number) => void; formato?: (v: number) => string; extremos?: [string, string] }> =
  ({ etiqueta, min, max, paso = 1, valor, onCambiar, onSoltar, formato, extremos }) => {
    const id = useId();
    const p = max > min ? ((valor - min) / (max - min)) * 100 : 0;
    return (
      <div className="h-deslizador">
        <div className="h-deslizador-cab"><label className="h-etq" htmlFor={id}>{etiqueta}</label>{formato && <span className="h-valor">{formato(valor)}</span>}</div>
        <input id={id} className="h-rango" type="range" min={min} max={max} step={paso} value={valor} style={{ '--p': p + '%' } as React.CSSProperties}
          onChange={e => onCambiar(Number(e.target.value))} onPointerUp={e => onSoltar?.(Number((e.target as HTMLInputElement).value))} onKeyUp={e => onSoltar?.(Number((e.target as HTMLInputElement).value))} />
        {extremos && <div className="h-extremos"><span>{extremos[0]}</span><span>{extremos[1]}</span></div>}
      </div>
    );
  };

export const Interruptor: React.FC<{ texto: string; activo: boolean; onCambiar: (v: boolean) => void }> = ({ texto, activo, onCambiar }) => {
  const id = useId();
  return (
    <label className="h-interruptor" htmlFor={id}>
      <span>{texto}</span>
      <input id={id} type="checkbox" role="switch" checked={activo} onChange={e => onCambiar(e.target.checked)} /><span className="h-riel" aria-hidden="true" />
    </label>
  );
};

// Una muestra de color (radio). Para un grupo, envolver en <div className="h-muestras" role="radiogroup" aria-label=…>.
export const Muestra: React.FC<{ color: string; nombre: string; activa?: boolean; onClick: () => void; tam?: number }> = ({ color, nombre, activa = false, onClick, tam }) => (
  <button type="button" role="radio" aria-checked={activa} aria-label={nombre} title={nombre} className="h-muestra" onClick={onClick}
    style={{ '--c': color, ...(tam ? { '--h-tam': tam + 'px' } : {}) } as React.CSSProperties} />
);

// ---------------------------------------------------------------- color: paleta Línea azul con escalas
export interface ColorBase { nombre: string; hex: string }
export const LINEA_AZUL: ColorBase[] = [
  { nombre: 'Azul', hex: '#0062B8' }, { nombre: 'Lapislázuli', hex: '#2B4BD8' }, { nombre: 'Celeste', hex: '#7FC8F8' },
  { nombre: 'Amarillo', hex: '#FFC20E' }, { nombre: 'Verde', hex: '#00A651' }, { nombre: 'Rosa', hex: '#FF8FB1' },
  { nombre: 'Morado', hex: '#7A2E8E' }, { nombre: 'Negro', hex: '#000000' }, { nombre: 'Hueso', hex: '#F4EEE3' },
];
const rgb = (hex: string) => { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const aHex = (c: number[]) => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const mezclar = (hex: string, con: number[], t: number) => aHex(rgb(hex).map((v, i) => v + (con[i] - v) * t));
const luz = (hex: string) => { const [r, g, b] = rgb(hex); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
// Pasos de claro a oscuro de un color. El color original queda en su lugar (muy oscuro: último; muy claro: primero).
export function escala(hex: string, pasos = 5): string[] {
  const L = luz(hex), B = [255, 255, 255], N = [0, 0, 0];
  const t = (i: number) => i / (pasos - 1);
  if (L < 0.1) return Array.from({ length: pasos }, (_, i) => i === pasos - 1 ? hex.toUpperCase() : mezclar(hex, B, 0.85 * (1 - t(i))));
  if (L > 0.85) return Array.from({ length: pasos }, (_, i) => i === 0 ? hex.toUpperCase() : mezclar(hex, N, 0.55 * t(i)));
  const medio = Math.floor(pasos / 2);
  return Array.from({ length: pasos }, (_, i) => i === medio ? hex.toUpperCase() : i < medio ? mezclar(hex, B, 0.6 * (medio - i) / medio) : mezclar(hex, N, 0.5 * (i - medio) / (pasos - 1 - medio)));
}

// Selector de color: primero el color (Línea azul), después su tono en la escala. `valor` es el hex elegido.
export const SelectorColor: React.FC<{ valor: string; onCambiar: (hex: string, info: { color: string; paso: number }) => void; colores?: ColorBase[]; pasos?: number; etiqueta?: string }> =
  ({ valor, onCambiar, colores = LINEA_AZUL, pasos = 5, etiqueta = 'Color' }) => {
    const escalas = colores.map(c => ({ ...c, tonos: escala(c.hex, pasos) }));
    const v = valor.toUpperCase();
    const dueno = escalas.find(e => e.tonos.includes(v));
    const [base, setBase] = useState(dueno?.nombre ?? escalas[0].nombre);
    useEffect(() => { if (dueno && dueno.nombre !== base) setBase(dueno.nombre); }, [dueno?.nombre]); // eslint-disable-line react-hooks/exhaustive-deps
    const actual = escalas.find(e => e.nombre === base) ?? escalas[0];
    const medio = actual.tonos.indexOf(actual.hex.toUpperCase());
    return (
      <div className="h-selector-color">
        <div className="h-muestras" role="radiogroup" aria-label={etiqueta}>
          {escalas.map(e => <Muestra key={e.nombre} color={e.hex} nombre={e.nombre} activa={e.nombre === base}
            onClick={() => { setBase(e.nombre); const i = e.tonos.indexOf(e.hex.toUpperCase()); onCambiar(e.tonos[i], { color: e.nombre, paso: i }); }} />)}
        </div>
        <div className="h-escala" role="radiogroup" aria-label={`Tono de ${actual.nombre}`} style={{ '--h-pasos': pasos } as React.CSSProperties}>
          {actual.tonos.map((t, i) => (
            <Muestra key={t + i} color={t} activa={t === v} onClick={() => onCambiar(t, { color: actual.nombre, paso: i })}
              nombre={`${actual.nombre} ${i === medio ? 'base' : i < medio ? 'claro ' + (medio - i) : 'oscuro ' + (i - medio)}`} />
          ))}
        </div>
      </div>
    );
  };

// ---------------------------------------------------------------- moléculas
// Sección del panel: título, acciones opcionales a la derecha y, si `plegable`, se abre y cierra.
export const SeccionPanel: React.FC<Hijos & { titulo: string; plegable?: boolean; abierta?: boolean; acciones?: React.ReactNode; ayuda?: React.ReactNode }> =
  ({ titulo, plegable, abierta = true, acciones, ayuda, children }) => {
    const [abre, setAbre] = useState(abierta);
    const id = useId();
    return (
      <section className={'h-seccion' + (plegable && !abre ? ' plegada' : '')} aria-labelledby={id + 't'}>
        <div className="h-seccion-cab">
          {plegable
            ? <button type="button" className="h-plegar" aria-expanded={abre} aria-controls={id + 'c'} onClick={() => setAbre(!abre)}><h2 className="h-seccion-titulo" id={id + 't'}>{titulo}</h2><Icono nombre="expand_more" /></button>
            : <h2 className="h-seccion-titulo" id={id + 't'}>{titulo}</h2>}
          {acciones && <div className="h-seccion-acciones">{acciones}</div>}
        </div>
        {(!plegable || abre) && <div id={id + 'c'} style={{ display: 'grid', gap: 'var(--h-e3)', minWidth: 0 }}>{ayuda && <p className="h-ayuda">{ayuda}</p>}{children}</div>}
      </section>
    );
  };

// Etiqueta a la izquierda y control a la derecha (o encima con `apilada`).
export const FilaPropiedad: React.FC<Hijos & { etiqueta: string; apilada?: boolean }> = ({ etiqueta, apilada, children }) => (
  <div className={'h-fila' + (apilada ? ' apilada' : '')} role="group" aria-label={etiqueta}><span className="h-etq">{etiqueta}</span><div style={{ minWidth: 0 }}>{children}</div></div>
);

export interface ElementoBiblioteca<T extends string> { id: T; nombre: string; contenido: React.ReactNode; mostrarNombre?: boolean }
// Grilla de miniaturas elegibles (módulos, tacos, stencils, stickers…). Cada celda mide `tam` px o más (mín. 48).
export function GrillaBiblioteca<T extends string>({ elementos, elegido, onElegir, etiqueta, tam = 56, columnas }: { elementos: ElementoBiblioteca<T>[]; elegido: T | null; onElegir: (id: T) => void; etiqueta: string; tam?: number; columnas?: number }) {
  return (
    <div className="h-biblioteca" role="radiogroup" aria-label={etiqueta} style={{ '--h-tam': Math.max(48, tam) + 'px', ...(columnas ? { '--h-cols': columnas } : {}) } as React.CSSProperties}>
      {elementos.map(e => (
        <button key={e.id} type="button" role="radio" aria-checked={elegido === e.id} aria-label={e.nombre} title={e.nombre} className="h-item" onClick={() => onElegir(e.id)}>
          {e.contenido}{e.mostrarNombre && <span className="h-item-nombre" aria-hidden="true">{e.nombre}</span>}
        </button>
      ))}
    </div>
  );
}

export interface Capa { id: string; nombre: string; visible: boolean; miniatura?: React.ReactNode }
// Lista de capas. `capas` va en orden de dibujo (0 = fondo); se muestra al revés, como en Figma: arriba la de adelante.
// «Subir» = hacia adelante. El ojo está siempre visible (no hay mouse). Borrar actúa sobre la activa.
export const ListaCapas: React.FC<{
  capas: Capa[]; activa: string | null; onActivar: (id: string) => void; onVisible: (id: string, visible: boolean) => void;
  onMover: (id: string, hacia: 'adelante' | 'atras') => void; onAgregar?: () => void; onBorrar?: (id: string) => void;
  maximo?: number; minimo?: number; etiqueta?: string;
}> = ({ capas, activa, onActivar, onVisible, onMover, onAgregar, onBorrar, maximo = 8, minimo = 1, etiqueta = 'Capas' }) => {
  const orden = capas.map((c, i) => ({ c, i })).reverse();
  return (
    <div style={{ display: 'grid', gap: 'var(--h-e2)' }}>
      <ul className="h-capas" aria-label={etiqueta}>
        {orden.map(({ c, i }) => (
          <li key={c.id} className={'h-capa' + (c.id === activa ? ' activa' : '') + (c.visible ? '' : ' oculta')} onClick={() => onActivar(c.id)}>
            <button type="button" className="h-btn h-solo-icono h-fantasma" aria-label={(c.visible ? 'Ocultar ' : 'Mostrar ') + c.nombre} aria-pressed={!c.visible}
              onClick={e => { e.stopPropagation(); onVisible(c.id, !c.visible); }} style={{ background: 'transparent', borderColor: 'transparent', color: 'inherit' }}>
              <Icono nombre={c.visible ? 'visibility' : 'visibility_off'} />
            </button>
            <span className="h-capa-mini" aria-hidden="true">{c.miniatura}</span>
            <button type="button" className="h-capa-nombre" aria-current={c.id === activa ? 'true' : undefined} onClick={e => { e.stopPropagation(); onActivar(c.id); }}>{c.nombre}</button>
            <span className="h-capa-orden">
              <BotonIcono icono="arrow_upward" etiqueta={`Traer ${c.nombre} adelante`} onClick={() => onMover(c.id, 'adelante')} disabled={i === capas.length - 1} />
              <BotonIcono icono="arrow_downward" etiqueta={`Llevar ${c.nombre} atrás`} onClick={() => onMover(c.id, 'atras')} disabled={i === 0} />
            </span>
          </li>
        ))}
      </ul>
      {(onAgregar || onBorrar) && (
        <div className="h-capas-pie">
          {onAgregar && <Boton icono="add" texto="Capa" etiqueta="Agregar capa" onClick={onAgregar} disabled={capas.length >= maximo} />}
          {onBorrar && <Boton icono="delete" texto="Borrar" etiqueta="Borrar la capa activa" variante="peligro" onClick={() => activa && onBorrar(activa)} disabled={!activa || capas.length <= minimo} />}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- organismos
export interface DefHerramienta<T extends string> { id: T; nombre: string; icono: string; disabled?: boolean }
// Barra de herramientas flotante, abajo al centro del lienzo: solo herramientas (ícono + nombre), la activa destacada.
export function BarraFlotante<T extends string>({ herramientas, activa, onElegir, etiqueta = 'Herramientas', extra }: { herramientas: DefHerramienta<T>[]; activa: T; onElegir: (id: T) => void; etiqueta?: string; extra?: React.ReactNode }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const tecla = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + herramientas.length) % herramientas.length;
    onElegir(herramientas[n].id); refs.current[n]?.focus();
  };
  return (
    <div className="h-flotante" role="toolbar" aria-label={etiqueta}>
      <div role="radiogroup" aria-label={etiqueta} style={{ display: 'flex', gap: 'var(--h-e1)', minWidth: 0 }}>
        {herramientas.map((h, i) => (
          <button key={h.id} ref={el => { refs.current[i] = el; }} type="button" role="radio" aria-checked={activa === h.id} tabIndex={activa === h.id ? 0 : -1}
            className="h-herr" disabled={h.disabled} onClick={() => onElegir(h.id)} onKeyDown={e => tecla(e, i)}>
            <Icono nombre={h.icono} />{h.nombre}
          </button>
        ))}
      </div>
      {extra && (<><span className="h-divisor" aria-hidden="true" />{extra}</>)}
    </div>
  );
}

export interface AccionBarrita { icono: string; etiqueta: string; onClick: () => void; disabled?: boolean; peligro?: boolean }
// Barrita de la selección: acciones del objeto tocado y, si se pasan, ✕ cancelar / ✓ confirmar al final.
// Con `ancla` ({x, y} en px dentro de su contenedor posicionado) flota sobre ese punto y no se sale del contenedor.
export const BarritaSeleccion: React.FC<{ acciones: AccionBarrita[]; onConfirmar?: () => void; onCancelar?: () => void; ancla?: { x: number; y: number; abajo?: number }; etiqueta?: string }> =
  ({ acciones, onConfirmar, onCancelar, ancla, etiqueta = 'Acciones de la selección' }) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
    useLayoutEffect(() => {
      if (!ancla || !ref.current) return;
      const el = ref.current, padre = el.offsetParent as HTMLElement | null;
      const W = padre?.clientWidth ?? window.innerWidth, H = padre?.clientHeight ?? window.innerHeight;
      const w = el.offsetWidth, h = el.offsetHeight, m = 8;
      let top = ancla.y - h - 12;
      if (top < m) top = Math.min(H - h - m, (ancla.abajo ?? ancla.y) + 12);
      setPos({ left: Math.max(m, Math.min(W - w - m, ancla.x - w / 2)), top: Math.max(m, top) });
    }, [ancla?.x, ancla?.y, ancla?.abajo, acciones.length]);
    const barra = (
      <div ref={ref} className={'h-barrita' + (ancla ? ' h-anclada' : '')} role="toolbar" aria-label={etiqueta} data-h-sin-gestos=""
        style={ancla ? (pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden', left: 0, top: 0 }) : undefined}
        onPointerDown={e => e.stopPropagation()}>
        {acciones.map(a => <BotonIcono key={a.etiqueta} icono={a.icono} etiqueta={a.etiqueta} onClick={a.onClick} disabled={a.disabled} variante={a.peligro ? 'peligro' : undefined} />)}
        {(onCancelar || onConfirmar) && acciones.length > 0 && <span className="h-divisor" aria-hidden="true" />}
        {onCancelar && <BotonIcono icono="close" etiqueta="Cancelar" onClick={onCancelar} />}
        {onConfirmar && <BotonIcono icono="check" etiqueta="Confirmar" variante="primario" onClick={onConfirmar} />}
      </div>
    );
    return barra;
  };

// ---------------------------------------------------------------- estado: deshacer y rehacer
// Como useHistorial del kit anterior (40 pasos) y además `anular()`: vuelve al paso anterior sin dejarlo para rehacer
// (para descartar el trazo que empezó un dedo cuando resulta ser un gesto de 2 o 3 dedos).
export function useHistorial<T>(inicial: T | (() => T), limite = 40) {
  const [estado, setEstado] = useState<T>(inicial);
  const actual = useRef(estado);
  const atras = useRef<T[]>([]), adelante = useRef<T[]>([]);
  const poner = (n: T) => { actual.current = n; setEstado(n); };
  const cambiar = (nuevo: T | ((v: T) => T), guardar = true) => {
    const v = actual.current;
    const n = typeof nuevo === 'function' ? (nuevo as (v: T) => T)(v) : nuevo;
    if (n === v) return;
    if (guardar) { atras.current = [...atras.current.slice(-(limite - 1)), v]; adelante.current = []; }
    poner(n);
  };
  const deshacer = () => { const p = atras.current.pop(); if (p === undefined) return; adelante.current.unshift(actual.current); poner(p); };
  const rehacer = () => { const s = adelante.current.shift(); if (s === undefined) return; atras.current.push(actual.current); poner(s); };
  const anular = () => { const p = atras.current.pop(); if (p !== undefined) poner(p); };
  const reiniciar = (v: T) => { atras.current = []; adelante.current = []; poner(v); };
  return { estado, cambiar, deshacer, rehacer, anular, reiniciar, puedeDeshacer: atras.current.length > 0, puedeRehacer: adelante.current.length > 0 };
}

export { Manijas, useGestosHistorial, type Transformacion } from './Manijas';
