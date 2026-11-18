import React, { useEffect, useRef, useState } from 'react';
import { jugador, otorgarCreacion } from '../../shared/juego';
import { publicar } from '../../shared/datos';
import { BarraFlotante, Boton, BotonIcono, Icono, LienzoAjustado, MarcoHerramienta, SeccionPanel, Segmento, useAviso } from '../../shared/ui/Herramienta';
import { Quiosco, Tutorial, useTutorialVisto } from '../../shared/ui/Tutorial';
import { Llevatela } from '../../shared/ui/Llevatela';
import { Motor, SILENCIO, type Rasgos } from './audio/motor';
import { ESTILOS, PISTAS, TEMPOS, type Pista, type Tempo } from './audio/estilos';
import { Compositor, ESCENAS } from './escenas/escenas';
import { grabarEnVivo, puedeGrabar } from './lib/archivos';
import './styles.css';

const QUIETO = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const SEG_LOOP = 6;
const LADO_MAX = 1080; // px del lienzo (y de la foto y el video)
const NOMBRE_PISTA: Record<Pista, { nombre: string; icono: string }> = {
  bateria: { nombre: 'Batería', icono: 'graphic_eq' },
  bajo: { nombre: 'Bajo', icono: 'water' },
  acordes: { nombre: 'Acordes', icono: 'layers' },
  melodia: { nombre: 'Melodía', icono: 'music_note' },
};
// qué tan fuerte suena cada pista en este cuadro (enciende su pad)
const nivelPista = (r: Rasgos, p: Pista) =>
  p === 'bateria' ? Math.max(r.bombo, r.caja * 0.9, r.hat * 0.6) : p === 'bajo' ? r.bajo : p === 'acordes' ? r.acordes : Math.max(r.notaNueva, r.melodia * 0.6);

export const App: React.FC = () => {
  const motor = useRef<Motor>(null as unknown as Motor);
  if (!motor.current) motor.current = new Motor();
  const lienzo = useRef<HTMLCanvasElement>(null);
  const zona = useRef<HTMLDivElement>(null);
  const dedo = useRef<HTMLDivElement>(null);
  const luces = useRef<Partial<Record<Pista, HTMLElement | null>>>({});
  const ultimo = useRef<Rasgos>(SILENCIO);
  const dedos = useRef(new Map<number, { x: number; y: number }>());
  const manoX = useRef<number | null>(null);

  const [visto, marcarVisto] = useTutorialVisto('audioreactiva');
  const [sonando, setSonando] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [estiloId, setEstiloId] = useState(ESTILOS[0].id);
  const [escenaId, setEscenaId] = useState(ESCENAS[0].id);
  const [activas, setActivas] = useState<Record<Pista, boolean>>({ bateria: true, bajo: true, acordes: true, melodia: true });
  const [tempo, setTempo] = useState<Tempo>('medio');
  const [tocando, setTocando] = useState(false);
  const [llevar, setLlevar] = useState<Blob | null>(null); // «Llévatela» con QR (plan 011)
  const [grabando, setGrabando] = useState(0); // 0..1
  const [aviso, avisar] = useAviso();
  const estilo = ESTILOS.find(e => e.id === estiloId)!;
  const escena = ESCENAS.find(e => e.id === escenaId)!;
  const vivo = useRef({ escena, estado: escena.crear() });
  if (vivo.current.escena !== escena) vivo.current = { escena, estado: escena.crear() };

  // Recuerda la última escena y música para la pantalla del mezanine del HUB (por ahora en este equipo).
  useEffect(() => { try { localStorage.setItem('sd:audioreactiva', JSON.stringify({ escena: escenaId, estilo: estiloId, ts: Date.now() })); } catch { /* sin almacenamiento */ } }, [escenaId, estiloId]);

  const empezar = async () => {
    try { await motor.current.empezar(); setSonando(true); setPausado(false); }
    catch { avisar('No pudimos encender el sonido. Toca de nuevo.'); }
  };
  const alternarPausa = async () => {
    if (pausado) { await motor.current.seguir(); setPausado(false); } else { await motor.current.pausar(); setPausado(true); }
  };

  // El sonido se detiene al salir, con la pestaña oculta y con el quiosco.
  useEffect(() => {
    const ver = () => {
      if (!motor.current.ctx) return;
      if (document.hidden) motor.current.ctx.suspend().catch(() => {});
      else if (!motor.current.pausado) motor.current.seguir().catch(() => {});
    };
    const salir = () => motor.current.apagar();
    document.addEventListener('visibilitychange', ver);
    window.addEventListener('pagehide', salir);
    return () => { document.removeEventListener('visibilitychange', ver); window.removeEventListener('pagehide', salir); motor.current.apagar(); };
  }, []);

  // Para medir con Playwright: ?medir=1 deja los rasgos y el nivel a mano.
  useEffect(() => {
    if (!new URLSearchParams(location.search).has('medir')) return;
    (window as unknown as Record<string, unknown>).__ar = { rasgos: () => ultimo.current, medida: () => motor.current.medida, motor: motor.current };
  }, []);

  // Bucle de dibujo (30 cuadros por segundo).
  useEffect(() => {
    if (!visto) return;
    const c = lienzo.current!;
    const ctx = c.getContext('2d')!;
    const comp = new Compositor();
    const ro = new ResizeObserver(() => {
      const lado = Math.min(LADO_MAX, Math.round(c.clientWidth * Math.min(window.devicePixelRatio || 1, 2)));
      if (lado && c.width !== lado) { c.width = c.height = lado; }
    });
    ro.observe(c);
    let raf = 0, antes = performance.now(), acumulado = 0;
    const cuadro = (ahora: number) => {
      raf = requestAnimationFrame(cuadro);
      acumulado += ahora - antes; antes = ahora;
      if (acumulado < 32) return;
      const dt = Math.min(0.1, acumulado / 1000); acumulado = 0;
      const r = motor.current.leer(ahora);
      r.quieto = QUIETO;
      if (QUIETO) { r.bombo *= 0.4; r.caja *= 0.4; r.hat *= 0.5; r.mano *= 0.5; }
      ultimo.current = r;
      comp.dibujar(ctx, c.width, QUIETO ? dt * 0.6 : dt, r, vivo.current.escena, vivo.current.estado, manoX.current);
      for (const p of PISTAS) luces.current[p]?.style.setProperty('--v', String(Math.min(1, nivelPista(r, p)).toFixed(2)));
    };
    raf = requestAnimationFrame(cuadro);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [visto]);

  // ---------------------------------------------------------------- dedos sobre la escena
  const actualizarMano = () => {
    const d = [...dedos.current.values()];
    if (!d.length) { manoX.current = null; motor.current.mano(null); setTocando(false); return; }
    const x = d.reduce((s, p) => s + p.x, 0) / d.length, y = d.reduce((s, p) => s + p.y, 0) / d.length;
    manoX.current = x; motor.current.mano(x, 1 - y); setTocando(true);
    dedo.current?.style.setProperty('--x', (x * 100).toFixed(1) + '%');
    dedo.current?.style.setProperty('--y', (y * 100).toFixed(1) + '%');
  };
  const posicion = (e: React.PointerEvent) => {
    const b = zona.current!.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)), y: Math.max(0, Math.min(1, (e.clientY - b.top) / b.height)) };
  };
  const bajar = (e: React.PointerEvent) => {
    if (!sonando) return;
    zona.current!.setPointerCapture(e.pointerId);
    dedos.current.set(e.pointerId, posicion(e)); actualizarMano();
  };
  const mover = (e: React.PointerEvent) => { if (dedos.current.has(e.pointerId)) { dedos.current.set(e.pointerId, posicion(e)); actualizarMano(); } };
  const soltar = (e: React.PointerEvent) => { if (dedos.current.delete(e.pointerId)) actualizarMano(); };

  const pad = (tipo: 'bum' | 'chas') => ({
    onPointerDown: (e: React.PointerEvent) => { e.stopPropagation(); e.preventDefault(); motor.current.tocarPad(tipo); },
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); motor.current.tocarPad(tipo); } },
  });

  // ---------------------------------------------------------------- controles
  const elegirEstilo = (id: string) => { setEstiloId(id); motor.current.ponerEstilo(id); };
  const elegirTempo = (t: Tempo) => { setTempo(t); motor.current.ponerTempo(t); };
  const alternarPista = (p: Pista) => setActivas(a => { const n = { ...a, [p]: !a[p] }; motor.current.ponerPista(p, n[p]); return n; });

  // La foto también es una creación: suma al inventario y al timbre 2, igual que el loop (QA 18 nov).
  const foto = () => lienzo.current!.toBlob(b => {
    if (!b) return;
    setLlevar(b);
    publicar('audio', { escena: escenaId }, jugador()?.codigo ?? null).catch(() => { /* sin red */ });
    otorgarCreacion('audioreactiva');
  }, 'image/png');
  const grabar = async () => {
    setGrabando(0.001);
    try {
      const { blob } = await grabarEnVivo(lienzo.current!, SEG_LOOP, 30, setGrabando, motor.current.flujo);
      setLlevar(blob);
      publicar('audio', { escena: escenaId }, jugador()?.codigo ?? null).catch(() => { /* sin red */ });
      otorgarCreacion('audioreactiva');
    } catch (e) { avisar((e as Error).message); }
    setGrabando(0);
  };

  if (!visto) return (
    <Tutorial etiqueta="Geométrica · Motion" titulo="Estación Audioreactiva"
      pasos={[
        { icono: 'music_note', texto: 'Elige una música: Lo-Fi, Synthwave, Button Mash, It’s Friday o Ambient.' },
        { icono: 'touch_app', texto: 'Arrastra el dedo sobre la escena para cambiar el sonido y la imagen. Toca Bum y Chas al ritmo.' },
        { icono: 'graphic_eq', texto: 'Apaga y prende la batería, el bajo, los acordes o la melodía: mira qué mueve cada una.' },
      ]}
      acciones={[{ texto: 'Empezar', icono: 'play_arrow', alTocar: () => { marcarVisto(); empezar(); } }]} />
  );

  return (<>
    <MarcoHerramienta
      titulo="Estación Audioreactiva"
      ayuda="Arrastra sobre la escena y toca los pads al ritmo."
      acciones={<>
        <BotonIcono icono={pausado ? 'play_arrow' : 'pause'} etiqueta={pausado ? 'Seguir la música' : 'Pausar la música'} variante="fantasma" onClick={alternarPausa} disabled={!sonando || !!grabando} />
        <Boton icono="photo_camera" texto="Foto" etiqueta="Llevarte un cuadro como imagen" onClick={foto} disabled={!!grabando} />
      </>}
      primario={{ texto: grabando ? `Grabando ${Math.round(grabando * 100)} %` : `Grabar loop`, icono: 'movie', onClick: grabar, disabled: !!grabando || !sonando || pausado || !puedeGrabar() }}
      herramientas={<BarraFlotante etiqueta="Escenas" herramientas={ESCENAS.map(e => ({ id: e.id, nombre: e.nombre, icono: e.icono }))} activa={escenaId} onElegir={setEscenaId} />}
      aviso={aviso}
      panel={<>
        <SeccionPanel titulo="Música">
          <div className="ar-estilos" role="radiogroup" aria-label="Música">
            {ESTILOS.map(s => (
              <button key={s.id} type="button" role="radio" aria-checked={estiloId === s.id} className="ar-estilo" style={{ '--c': s.color } as React.CSSProperties} onClick={() => elegirEstilo(s.id)}>
                <span className="ar-estilo-nombre">{s.nombre}</span>
                <span className="ar-estilo-bajada">{s.bajada}</span>
              </button>
            ))}
          </div>
        </SeccionPanel>
        <SeccionPanel titulo="Pistas" ayuda="Apaga una para ver qué mueve.">
          <div className="ar-pistas">
            {PISTAS.map(p => (
              <button key={p} type="button" className="ar-pista" aria-pressed={activas[p]} onClick={() => alternarPista(p)}
                ref={el => { luces.current[p] = el; }}
                aria-label={`${NOMBRE_PISTA[p].nombre}: ${activas[p] ? 'suena' : 'apagada'}. En ${escena.nombre}: ${escena.mapa[p]}`}>
                <span className="ar-pista-cab"><Icono nombre={activas[p] ? NOMBRE_PISTA[p].icono : 'volume_off'} />{NOMBRE_PISTA[p].nombre}</span>
                <span className="ar-pista-hace">{escena.mapa[p]}</span>
                <i className="ar-pista-luz" aria-hidden="true" />
              </button>
            ))}
          </div>
        </SeccionPanel>
        <SeccionPanel titulo="Tempo">
          <Segmento etiqueta="Tempo" valor={tempo} onCambiar={elegirTempo}
            opciones={TEMPOS.map(t => ({ valor: t.id as Tempo, texto: <span className="ar-tempo">{t.nombre}<small>{Math.round(estilo.bpm * t.factor)} bpm</small></span> }))} />
        </SeccionPanel>
        <SeccionPanel titulo={`Escena · ${escena.nombre}`}>
          <p className="ar-linea">{escena.linea}</p>
          <p className="ar-linea ar-suave"><Icono nombre="touch_app" /> Con el dedo: a la izquierda se apaga el brillo y se tiñe de azul; arriba suma eco y acerca la imagen.</p>
        </SeccionPanel>
      </>}
    >
      <LienzoAjustado proporcion={1} className="ar-lienzo">
        <canvas ref={lienzo} className="ar-canvas" role="img" aria-label={`Escena ${escena.nombre} al ritmo de ${estilo.nombre}`} />
        <div ref={zona} className={'ar-zona' + (tocando ? ' tocando' : '')} onPointerDown={bajar} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar} onLostPointerCapture={soltar}>
          <div ref={dedo} className="ar-dedo" aria-hidden="true" />
          <span className="ar-eje ar-eje-x" aria-hidden="true">← apagado · brillante →</span>
          <span className="ar-eje ar-eje-y" aria-hidden="true">↑ eco</span>
        </div>
        {sonando && (<>
          <button type="button" className="ar-pad ar-pad-izq" aria-label="Bum: golpe grave" {...pad('bum')}><Icono nombre="circle" />Bum</button>
          <button type="button" className="ar-pad ar-pad-der" aria-label="Chas: platillo y acorde" {...pad('chas')}><Icono nombre="auto_awesome" />Chas</button>
        </>)}
        {!sonando && (
          <div className="ar-empezar"><Boton icono="play_arrow" texto="Toca para que suene" variante="primario" onClick={empezar} /></div>
        )}
      </LienzoAjustado>
    </MarcoHerramienta>
    {llevar && <Llevatela blob={llevar} app="audioreactiva" titulo={llevar.type.startsWith('video/') ? 'Tu loop está listo' : 'Tu cuadro está listo'} conCredencial={!!jugador()?.codigo} alCerrar={() => setLlevar(null)} />}
    <Quiosco app="audioreactiva" limpiar={['sd:audioreactiva']} alReiniciar={() => { motor.current.apagar(); location.reload(); }} />
  </>);
};
