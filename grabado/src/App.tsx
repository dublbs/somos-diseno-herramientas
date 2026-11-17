import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { jugador, otorgarCreacion } from '../../shared/juego';
import { miniatura, publicar } from '../../shared/datos';
import {
  BarritaSeleccion, Boton, GrillaBiblioteca, Icono, Interruptor, LienzoAjustado, LINEA_AZUL, ListaCapas, Manijas,
  MarcoHerramienta, SeccionPanel, Segmento, SelectorColor, useAviso, useGestosHistorial, useHistorial, type Transformacion,
} from '../../shared/ui/Herramienta';
import { Quiosco, Tutorial, useTutorialVisto } from '../../shared/ui/Tutorial';
import { Llevatela } from '../../shared/ui/Llevatela';
import { TACOS, cargarTacos, miniaturaTaco, tacoEntintado, tacoPorId, type TacoListo } from './lib/tacos';
import {
  CacheCapas, MARCOS_AFICHE, MAX_CAPAS, PAPEL, PAPELES, TACO_BASE, componer, lienzoMarco, tamEstampa, tarjeta,
  type Afiche, type CapaAfiche, type Papel,
} from './lib/afiche';
import './styles.css';

const CLAVE = 'grabado:afiche';
const QUIETO = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
// Tintas: la paleta Línea azul con escalas, sin Hueso (sobre papel blanco o hueso no se vería).
const TINTAS = LINEA_AZUL.filter(c => c.nombre !== 'Hueso');
// Cada capa nueva parte con una tinta distinta de las que ya hay.
const ROTACION = ['#0062B8', '#FF8FB1', '#FFC20E', '#00A651', '#7A2E8E', '#000000', '#2B4BD8', '#7FC8F8'];
const nombreTinta = (hex: string) => TINTAS.find(c => c.hex.toUpperCase() === hex.toUpperCase())?.nombre;

let serie = 0;
const nuevaCapa = (n: number, tinta: string): CapaAfiche => ({ id: `c${Date.now().toString(36)}${serie++}`, nombre: `Capa ${n}`, visible: true, tinta, mezcla: true, estampas: [] });
function inicial(): Afiche {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) || 'null') as Afiche | null;
    if (g && Array.isArray(g.capas) && g.capas.length && g.capas.some(c => c.id === g.activa)) return { ...g, papel: g.papel in PAPELES ? g.papel : 'Hueso' };
  } catch { /* sin almacenamiento */ }
  const c = nuevaCapa(1, ROTACION[0]);
  return { capas: [c], activa: c.id, papel: 'Hueso', marco: null, marcoEncima: true, registro: false };
}

// Miniatura de una capa: lo que tiene, en su tinta, sobre el papel y encuadrado en sus estampas (o una gota de su
// tinta si está vacía). `zona` es el cuadrado [x, y, lado] en unidades del papel.
const MiniCapa: React.FC<{ fuente: HTMLCanvasElement | null; zona: [number, number, number]; papel: string; tinta: string; version: number }> = ({ fuente, zona, papel, tinta, version }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const x = c.getContext('2d')!;
    x.fillStyle = papel; x.fillRect(0, 0, 80, 80);
    if (fuente && fuente.width) {
      const k = fuente.width / PAPEL, [zx, zy, zl] = zona;
      x.globalCompositeOperation = 'multiply'; x.drawImage(fuente, zx * k, zy * k, zl * k, zl * k, 0, 0, 80, 80); x.globalCompositeOperation = 'source-over';
    } else { x.fillStyle = tinta; x.beginPath(); x.arc(40, 40, 15, 0, Math.PI * 2); x.fill(); }
  }, [fuente, zona[0], zona[1], zona[2], papel, tinta, version]); // eslint-disable-line react-hooks/exhaustive-deps
  return <canvas ref={ref} width={80} height={80} style={{ width: 40, height: 40, display: 'block' }} />;
};

// El cuadrado que encierra las estampas de una capa (mínimo 280 de lado), para encuadrar su miniatura.
function zonaDe(c: CapaAfiche): [number, number, number] {
  if (!c.estampas.length) return [0, 0, PAPEL];
  let x0 = PAPEL, y0 = PAPEL, x1 = 0, y1 = 0;
  c.estampas.forEach(e => { const r = TACO_BASE * e.escala * 0.6; x0 = Math.min(x0, e.x - r); y0 = Math.min(y0, e.y - r); x1 = Math.max(x1, e.x + r); y1 = Math.max(y1, e.y + r); });
  const l = Math.min(PAPEL, Math.max(280, x1 - x0, y1 - y0));
  const cx = Math.max(l / 2, Math.min(PAPEL - l / 2, (x0 + x1) / 2)), cy = Math.max(l / 2, Math.min(PAPEL - l / 2, (y0 + y1) / 2));
  return [cx - l / 2, cy - l / 2, l];
}

export const App: React.FC = () => {
  const [empezado, setEmpezado] = useTutorialVisto('grabado');
  const [tacos, setTacos] = useState<Record<string, TacoListo> | null>(null);
  const [taco, setTaco] = useState<string>('helecho');
  const historial = useHistorial<Afiche>(inicial);
  const a = historial.estado;
  const capa = a.capas.find(c => c.id === a.activa) ?? a.capas[a.capas.length - 1];
  const [previa, setPrevia] = useState<Transformacion | null>(null);
  const ultima = useRef({ escala: 1, giro: 0 }); // la vista previa nueva parte con el tamaño y giro de la anterior
  const [llevar, setLlevar] = useState<Blob | null>(null);
  const [aviso, avisar] = useAviso();
  const [version, setVersion] = useState(0); // sube al repintar: refresca las miniaturas de las capas
  const [borrarTodo, setBorrarTodo] = useState(false);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const encima = useRef<HTMLCanvasElement>(null);
  const caja = useRef<HTMLDivElement>(null);
  const cache = useRef(new CacheCapas());
  const cacheMini = useRef(new CacheCapas());
  const aparece = useRef<{ inicio: number } | null>(null);

  useEffect(() => { document.documentElement.dataset.ui = 'v2'; document.documentElement.dataset.visual = 'Orgánica'; }, []);
  useEffect(() => { cargarTacos().then(setTacos).catch(() => avisar('No pudimos cargar los tacos. Recarga la página.')); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(a));
      localStorage.setItem('sd:grabado', JSON.stringify({ estampas: a.capas.reduce((n, c) => n + c.estampas.length, 0), capas: a.capas.length, papel: a.papel, ts: Date.now() }));
    } catch { /* sin almacenamiento */ }
  }, [a]);

  const cambiar = (fn: (v: Afiche) => Afiche, guardar = true) => historial.cambiar(fn, guardar);
  const cambiarCapa = (id: string, fn: (c: CapaAfiche) => CapaAfiche, guardar = true) =>
    cambiar(v => ({ ...v, capas: v.capas.map(c => (c.id === id ? fn(c) : c)) }), guardar);

  // ---------------------------------------------------------------- dibujo
  const vivo = useRef({ a, tacos }); vivo.current = { a, tacos };
  const dibujar = useCallback(() => {
    const c = lienzo.current, { a: af, tacos: t } = vivo.current;
    if (!c || !t) return;
    const lado = Math.round(c.clientWidth * Math.min(window.devicePixelRatio || 1, 2));
    if (!lado) return;
    if (c.width !== lado) { c.width = c.height = lado; }
    const x = c.getContext('2d')!;
    componer(x, lado, af, t, cache.current);
    cache.current.limpiar(af.capas.map(k => k.id));
    // la última estampa aparece con un golpe suave (como al levantar el taco)
    const ap = aparece.current;
    if (ap) {
      const k = Math.min(1, (performance.now() - ap.inicio) / 220);
      c.style.transform = k < 1 ? `scale(${1 - 0.006 * Math.sin(k * Math.PI)})` : '';
      if (k < 1) requestAnimationFrame(dibujar); else aparece.current = null;
    }
  }, []);
  useEffect(() => { dibujar(); setVersion(v => v + 1); }, [a, tacos, empezado, dibujar]);
  useEffect(() => {
    const c = lienzo.current; if (!c) return;
    const ro = new ResizeObserver(() => { dibujar(); }); ro.observe(c);
    return () => ro.disconnect();
  }, [empezado, dibujar]);

  // Vista previa del taco: translúcida, en la tinta de la capa activa, sobre el papel.
  useEffect(() => {
    const c = encima.current; if (!c) return;
    const lado = Math.round(c.clientWidth * Math.min(window.devicePixelRatio || 1, 2));
    if (c.width !== lado) { c.width = c.height = lado; }
    const x = c.getContext('2d')!;
    x.clearRect(0, 0, c.width, c.height);
    if (!previa || !tacos) return;
    const t = tacos[taco], s = lado / PAPEL, [w, h] = tamEstampa(t, previa.escala);
    const img = tacoEntintado(t, w * s, h * s, capa.tinta);
    x.save(); x.globalAlpha = 0.62;
    x.translate(previa.x * s, previa.y * s); x.rotate(previa.giro * Math.PI / 180);
    x.drawImage(img, -img.width / 2, -img.height / 2);
    x.restore();
  }, [previa, tacos, taco, capa.tinta]);

  // ---------------------------------------------------------------- colocar y estampar
  const enPapel = (ev: React.PointerEvent) => {
    const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * PAPEL, y: ((ev.clientY - r.top) / r.height) * PAPEL };
  };
  const tocarPapel = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ev.isPrimary || !tacos || gestos.hayVariosDedos()) return;
    const p = enPapel(ev);
    setPrevia(v => ({ x: p.x, y: p.y, escala: v?.escala ?? ultima.current.escala, giro: v?.giro ?? ultima.current.giro }));
  };
  const cancelar = () => setPrevia(null);
  const estampar = () => {
    if (!previa) return;
    const semilla = Math.floor(Math.random() * 1e9);
    // cada impresión sale levemente distinta: el taco se corre y gira un poco al presionarlo a mano
    const r = (semilla % 1000) / 1000 - 0.5, q = ((semilla >> 10) % 1000) / 1000 - 0.5;
    const e = { taco, x: previa.x + q * 6, y: previa.y + r * 6, escala: previa.escala, giro: previa.giro + r * 3, semilla };
    const oculta = !capa.visible;
    cambiarCapa(capa.id, c => ({ ...c, visible: true, estampas: [...c.estampas, e] }));
    ultima.current = { escala: previa.escala, giro: previa.giro };
    setPrevia(null);
    if (!QUIETO) aparece.current = { inicio: performance.now() };
    avisar(oculta ? `${capa.nombre} estaba oculta: la volvimos a mostrar.` : `Estampado en ${capa.nombre}.`);
  };

  // 2 dedos deshace y 3 rehace. Si el primer dedo alcanzó a abrir la vista previa, se cierra.
  const gestos = useGestosHistorial(caja, {
    onDeshacer: () => { historial.deshacer(); setPrevia(null); },
    onRehacer: () => { historial.rehacer(); setPrevia(null); },
    alMultitoque: () => setPrevia(null),
  });

  // ---------------------------------------------------------------- capas
  const agregarCapa = () => {
    if (a.capas.length >= MAX_CAPAS) return;
    const usadas = new Set(a.capas.map(c => c.tinta.toUpperCase()));
    const tinta = ROTACION.find(t => !usadas.has(t)) ?? ROTACION[a.capas.length % ROTACION.length];
    const n = Math.max(0, ...a.capas.map(c => Number(c.nombre.replace(/\D/g, '')) || 0)) + 1;
    const nueva = nuevaCapa(n, tinta);
    cambiar(v => { const i = v.capas.findIndex(c => c.id === v.activa); const capas = [...v.capas]; capas.splice(i + 1, 0, nueva); return { ...v, capas, activa: nueva.id }; });
    avisar(`${nueva.nombre} lista, con tinta ${nombreTinta(tinta) ?? ''}.`.replace(' .', '.'));
  };
  const borrarCapa = (id: string) => {
    if (a.capas.length <= 1) return;
    const i = a.capas.findIndex(c => c.id === id), nombre = a.capas[i].nombre;
    cambiar(v => { const capas = v.capas.filter(c => c.id !== id); return { ...v, capas, activa: capas[Math.max(0, i - 1)].id }; });
    avisar(`${nombre} borrada. Puedes deshacer.`);
  };
  const moverCapa = (id: string, hacia: 'adelante' | 'atras') => cambiar(v => {
    const i = v.capas.findIndex(c => c.id === id), j = hacia === 'adelante' ? i + 1 : i - 1;
    if (j < 0 || j >= v.capas.length) return v;
    const capas = [...v.capas]; [capas[i], capas[j]] = [capas[j], capas[i]];
    return { ...v, capas };
  });

  const capasLista = useMemo(() => a.capas.map(c => ({
    id: c.id,
    nombre: c.estampas.length ? c.nombre : `${c.nombre} (vacía)`,
    visible: c.visible,
    miniatura: <MiniCapa fuente={tacos && c.estampas.length ? cacheMini.current.obtener(c, 400, tacos) : null} zona={zonaDe(c)} papel={PAPELES[a.papel]} tinta={c.tinta} version={version} />,
  })), [a.capas, a.papel, tacos, version]);

  // ---------------------------------------------------------------- exportar
  const total = a.capas.reduce((n, c) => n + c.estampas.length, 0);
  const exportar = async () => {
    if (!tacos || !total) return;
    setPrevia(null);
    const blob = await tarjeta((x, lado) => componer(x, lado, a, tacos), ['Mi afiche', 'por capas']);
    setLlevar(blob);
    if (lienzo.current) publicar('grabado', { png: miniatura(lienzo.current, 160) }, jugador()?.codigo ?? null).catch(() => { /* sin red */ });
    otorgarCreacion('grabado');
  };

  if (!empezado) return (
    <Tutorial etiqueta="Orgánica · hecho a mano" titulo="Taller de Grabado"
      pasos={[
        { icono: 'touch_app', texto: 'Elige un taco y toca el papel donde lo quieres estampar.' },
        { icono: 'rotate_right', texto: 'Muévelo, gíralo o agrándalo con las manijas. Con ✓ lo estampas.' },
        { icono: 'layers', texto: 'Cada capa tiene su tinta. Ordénalas y mira cómo se mezclan. Llévate tu afiche.' },
      ]}
      acciones={[{ texto: 'Hacer mi afiche', icono: 'approval', alTocar: setEmpezado }]} />
  );

  const def = tacoPorId(taco);
  const tacoListo = tacos?.[taco];
  const [tw, th] = tacoListo ? tamEstampa(tacoListo, 1) : [300, 300];
  const vacio = total === 0;
  const papelHex = PAPELES[a.papel];

  const barraTacos = (
    <div className="h-flotante tacos" role="toolbar" aria-label="Tacos">
      <div className="tacos-grilla" role="radiogroup" aria-label="Taco">
        {TACOS.map(t => (
          <button key={t.id} type="button" role="radio" aria-checked={taco === t.id} aria-label={t.nombre} title={t.nombre} className="taco"
            onClick={() => { setTaco(t.id); if (!previa) avisar(`${t.nombre}: toca el papel para ubicarlo.`); }}>
            {tacos ? <img src={miniaturaTaco(tacos[t.id], taco === t.id ? capa.tinta : '#1A1A1A')} alt="" draggable={false} /> : <span className="taco-cargando" />}
          </button>
        ))}
      </div>
    </div>
  );

  const panel = (<>
    <SeccionPanel titulo="Capas" acciones={<span className="cuenta">{a.capas.length} de {MAX_CAPAS}</span>}>
      <ListaCapas capas={capasLista} activa={a.activa} maximo={MAX_CAPAS} minimo={1}
        onActivar={id => { if (id !== a.activa) { cambiar(v => ({ ...v, activa: id }), false); } }}
        onVisible={(id, v) => cambiarCapa(id, c => ({ ...c, visible: v }))}
        onMover={moverCapa} onAgregar={agregarCapa} onBorrar={borrarCapa} />
      <p className="h-ayuda">Estampas en la capa marcada. La de arriba de la lista se imprime al último, encima de las demás.</p>
    </SeccionPanel>

    <SeccionPanel titulo={`Tinta de ${capa.nombre}`}>
      <SelectorColor valor={capa.tinta} colores={TINTAS} pasos={5} etiqueta="Tinta"
        onCambiar={hex => { if (hex.toUpperCase() !== capa.tinta.toUpperCase()) cambiarCapa(capa.id, c => ({ ...c, tinta: hex })); }} />
      <Segmento etiqueta={`Cómo se imprime ${capa.nombre}`} valor={capa.mezcla}
        onCambiar={m => cambiarCapa(capa.id, c => ({ ...c, mezcla: m }))}
        opciones={[{ valor: true, texto: 'Se mezcla', icono: 'invert_colors' }, { valor: false, texto: 'Tapa', icono: 'flip_to_front' }]} />
      <p className="h-ayuda">{capa.mezcla
        ? 'Donde se cruza con las capas de abajo, las tintas se suman y sale un color nuevo, como en la risografía.'
        : 'Cubre lo que hay debajo, como una tinta opaca.'} La tinta es de toda la capa.</p>
    </SeccionPanel>

    <SeccionPanel titulo="Papel">
      <Segmento etiqueta="Papel" valor={a.papel} onCambiar={(p: Papel) => cambiar(v => ({ ...v, papel: p }))}
        opciones={(Object.keys(PAPELES) as Papel[]).map(p => ({ valor: p, texto: <span className="papel-op"><span className="papel-gota" style={{ background: PAPELES[p] }} />{p}</span> }))} />
    </SeccionPanel>

    <SeccionPanel titulo="Marco">
      <GrillaBiblioteca etiqueta="Marco" tam={60} elegido={a.marco ?? 'ninguno'}
        onElegir={id => cambiar(v => ({ ...v, marco: id === 'ninguno' ? null : id }))}
        elementos={[
          { id: 'ninguno', nombre: 'Sin marco', contenido: <Icono nombre="crop_square" /> },
          ...MARCOS_AFICHE.map(m => ({ id: m.id, nombre: `${m.name} · ${m.visual}`, contenido: <MiniMarco id={m.id} papel={papelHex} /> })),
        ]} />
      {a.marco && (
        <Segmento etiqueta="Dónde va el marco" valor={a.marcoEncima} onCambiar={v => cambiar(x => ({ ...x, marcoEncima: v }))}
          opciones={[{ valor: true, texto: 'Sobre las estampas', icono: 'flip_to_front' }, { valor: false, texto: 'Bajo las estampas', icono: 'flip_to_back' }]} />
      )}
    </SeccionPanel>

    <SeccionPanel titulo="Ajustes">
      <Interruptor texto="Registro corrido" activo={a.registro} onCambiar={v => cambiar(x => ({ ...x, registro: v }))} />
      <p className="h-ayuda">Corre un poco cada capa, como cuando las placas de la risografía no calzan justo.</p>
      <Boton icono="delete" texto={borrarTodo ? 'Toca otra vez para borrar todo' : 'Empezar de nuevo'} variante="peligro" ancho
        disabled={vacio && a.capas.length === 1 && !a.marco}
        onClick={() => {
          if (!borrarTodo) { setBorrarTodo(true); window.setTimeout(() => setBorrarTodo(false), 3000); return; }
          setBorrarTodo(false); setPrevia(null);
          const c = nuevaCapa(1, ROTACION[0]);
          cambiar(v => ({ ...v, capas: [c], activa: c.id, marco: null }));
          avisar('Papel nuevo. Puedes deshacer.');
        }} />
    </SeccionPanel>
  </>);

  const ayuda = previa
    ? `${def.nombre} en ${capa.nombre}: muévelo, gíralo o agrándalo y confirma con ✓`
    : `${def.nombre} · toca el papel para elegir dónde estampar`;

  return (<>
    <MarcoHerramienta titulo="Taller de Grabado" ayuda={ayuda} historia={{
      deshacer: () => { historial.deshacer(); setPrevia(null); }, rehacer: () => { historial.rehacer(); setPrevia(null); },
      puedeDeshacer: historial.puedeDeshacer, puedeRehacer: historial.puedeRehacer,
    }}
      primario={{ texto: 'Llévatelo', onClick: exportar, disabled: vacio || !tacos }}
      herramientas={barraTacos} panel={panel} anchoPanel={340} altoPanelVertical="40%" aviso={aviso}>
      <LienzoAjustado ref={caja} proporcion={1} className="hoja">
        <canvas ref={lienzo} className="papel" onPointerDown={tocarPapel} role="img"
          aria-label={`Afiche con ${a.capas.length} capa${a.capas.length === 1 ? '' : 's'} y ${total} estampa${total === 1 ? '' : 's'}. Toca para ubicar ${def.nombre}.`} />
        <canvas ref={encima} className="previa" aria-hidden="true" />
        {vacio && !previa && (
          <div className="pista" aria-hidden="true"><Icono nombre="touch_app" tam={28} /><span>Toca el papel para elegir dónde estampar</span></div>
        )}
        {previa && tacoListo && (
          <Manijas etiqueta={`Taco ${def.nombre}`} valor={previa} ancho={tw} alto={th} lienzo={{ ancho: PAPEL, alto: PAPEL }}
            limites={{ min: 0.08, max: 0.85 }}
            onCambiar={(t, final) => { setPrevia(t); if (final) ultima.current = { escala: t.escala, giro: t.giro }; }}
            barrita={<BarritaSeleccion etiqueta="Taco"
              acciones={[{ icono: 'rotate_90_degrees_cw', etiqueta: 'Girar 90°', onClick: () => setPrevia(p => p && { ...p, giro: ((p.giro + 90 + 180) % 360) - 180 }) }]}
              onCancelar={cancelar} onConfirmar={estampar} />} />
        )}
      </LienzoAjustado>
    </MarcoHerramienta>
    {llevar && <Llevatela blob={llevar} app="grabado" titulo="Tu afiche está listo" conCredencial={!!jugador()?.codigo} alCerrar={() => setLlevar(null)} />}
    <Quiosco app="grabado" limpiar={[CLAVE, 'sd:grabado']} />
  </>);
};

// Miniatura de un marco sobre el papel elegido.
const MiniMarco: React.FC<{ id: string; papel: string }> = ({ id, papel }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const x = c.getContext('2d')!;
    x.fillStyle = papel; x.fillRect(0, 0, 96, 96);
    x.drawImage(lienzoMarco(id, 96, papel), 0, 0);
  }, [id, papel]);
  return <canvas ref={ref} width={96} height={96} style={{ width: '100%', height: '100%', display: 'block', borderRadius: 3 }} />;
};
