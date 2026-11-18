import React, { useEffect, useState } from 'react';
import { CODIGO, EVENTO_TIMBRE, configRemota, entrarJugador, entrarSinCredencial, sinCredencial, guardarConfig, hashPin, idMesa, jugador, leerConfig, normalizarCodigo, pideReinicio, pinDeDemo, traerConfigRemota, verificarPin, type ConfigMesa, type DetalleCreacion } from '../juego';
import { BotonAccion, Interruptor } from './Kit';
import { QrEncargado, QrJugar } from './QrEncargado';

// Modo juego en las mesas: la tablet pide el código de la credencial (o se juega sin ella, plan 011), otorga el timbre 2 al exportar y el staff
// la configura con su PIN (?staff en la URL). Envuelve la experiencia completa.

const Icono: React.FC<{ nombre: string }> = ({ nombre }) => <span className="material-symbols-outlined" aria-hidden="true">{nombre}</span>;
const esStaff = () => new URLSearchParams(location.search).has('staff');

// encargadoX: posición horizontal del botón del encargado (QrEncargado), si la app tiene algo arriba al centro.
export const PuertaJuego: React.FC<{ app: string; titulo: string; visual: string; encargadoX?: string; children: React.ReactNode }> = ({ app, titulo, visual, encargadoX, children }) => {
  const [config, setConfig] = useState<ConfigMesa>(leerConfig);
  const [codigo, setCodigo] = useState(() => jugador()?.codigo ?? null);
  const [libre, setLibre] = useState(sinCredencial);
  const [ganado, setGanado] = useState<DetalleCreacion | null>(null);
  const [staff, setStaff] = useState(esStaff);

  useEffect(() => { if (!document.documentElement.dataset.visual) document.documentElement.dataset.visual = visual; }, [visual]);
  useEffect(() => {
    const alGanar = (e: Event) => setGanado((e as CustomEvent<DetalleCreacion>).detail);
    window.addEventListener(EVENTO_TIMBRE, alGanar);
    return () => window.removeEventListener(EVENTO_TIMBRE, alGanar);
  }, []);
  // Plan 015: el PC madre manda (modo juego, código de la estación 2, reinicios). Se pregunta al abrir y cada 30 s.
  useEffect(() => {
    let vivo = true;
    const preguntar = () => traerConfigRemota().then(c => {
      if (!vivo || !c) return;
      if (pideReinicio(c)) { try { sessionStorage.clear(); } catch { /* nada */ } location.reload(); return; }
      setConfig(leerConfig());
    });
    preguntar();
    const id = setInterval(preguntar, 30000);
    return () => { vivo = false; clearInterval(id); };
  }, []);

  if (staff) return <PanelStaff app={app} alSalir={() => { setConfig(leerConfig()); setStaff(false); history.replaceState(null, '', location.pathname); }} />;
  if (config.modoJuego && !codigo && !libre) return <Desbloqueo app={app} titulo={titulo} alEscanear={c => setCodigo(c)} alEntrar={c => { entrarJugador(c, app); setCodigo(c); }} alSinCredencial={() => { entrarSinCredencial(); setLibre(true); }} alStaff={() => setStaff(true)} />;
  return (<>
    {children}
    <QrEncargado app={app} x={encargadoX} />
    {ganado && (
      <div className="k-quiosco" role="dialog" aria-modal="true" aria-labelledby="timbre-t">
        <div className="k-panel k-quiosco-caja">
          <p className="k-quiosco-cuenta" aria-hidden="true"><Icono nombre="approval" /></p>
          {ganado.avance?.otorgado ? (<>
            <h2 id="timbre-t">¡Ganaste el timbre Creación!</h2>
            <p>Ya está en tu credencial ({ganado.codigo}).</p>
          </>) : ganado.avance ? (<>
            <h2 id="timbre-t">¡Creación guardada!</h2>
            <p>Ya está en el inventario de tu credencial ({ganado.codigo}). Llevas <b>{ganado.avance.pasos} de {ganado.avance.meta}</b> experiencias para el timbre Creación: sigue creando en otras.</p>
          </>) : (<>
            <h2 id="timbre-t">¡Creación lista!</h2>
            <p>En tu credencial ({ganado.codigo}) toca <b>Timbrar</b>, elige la estación <b>2</b> y escribe el código:</p>
            <p className="k-juego-token">{config.token2}</p>
          </>)}
          <button type="button" className="k-btn k-primario" onClick={() => setGanado(null)}><Icono nombre="check" />Listo</button>
        </div>
      </div>
    )}
  </>);
};

const Desbloqueo: React.FC<{ app: string; titulo: string; alEscanear: (codigo: string) => void; alEntrar: (codigo: string) => void; alSinCredencial: () => void; alStaff: () => void }> = ({ app, titulo, alEscanear, alEntrar, alSinCredencial, alStaff }) => {
  const [valor, setValor] = useState('SD-');
  const [error, setError] = useState('');
  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    const c = normalizarCodigo(valor);
    if (!CODIGO.test(c)) { setError('El código tiene la forma SD-XXXXX y está en tu credencial.'); return; }
    alEntrar(c);
  };
  return (
    <div className="k-tutorial">
      <a className="volver" href="../../"><Icono nombre="arrow_back" />Experiencias</a>
      <main className="k-tutorial-cuerpo">
        <p className="k-tutorial-etq">Modo juego · {titulo}</p>
        <h1 className="k-tutorial-titulo">Escanea para jugar con tu credencial</h1>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <QrJugar app={app} tam={220} alEntrar={alEscanear} />
          <p className="k-ayuda" style={{ maxWidth: 360, margin: 0 }}>En tu credencial toca <b>Timbrar</b> y apunta a este QR. ¿No tienes credencial? Escanéalo con la cámara del celular: te lleva a crearla y quedas jugando aquí.</p>
        </div>
        <form className="k-juego-form" onSubmit={entrar}>
          <label className="k-etq" htmlFor="codigo-credencial">O escribe tu código (está bajo tu nombre, en la credencial)</label>
          <input id="codigo-credencial" className="k-juego-input" value={valor} autoComplete="off" autoCapitalize="characters" spellCheck={false}
            onChange={e => { setValor(e.target.value.toUpperCase()); setError(''); }} aria-invalid={!!error} aria-describedby="codigo-error" />
          {error && <p id="codigo-error" className="k-ayuda k-juego-error" role="alert">{error}</p>}
          <div className="k-tutorial-acciones">
            <button type="submit" className="k-btn k-primario"><Icono nombre="check" />Entrar</button>
            <BotonAccion icono="play_arrow" texto="Jugar sin credencial" onClick={alSinCredencial} />
            <BotonAccion icono="tune" texto="Staff" onClick={alStaff} />
          </div>
        </form>
        <p className="k-ayuda">Con tu credencial, lo que crees suma al timbre Creación y llega a tu inventario. Sin credencial igual juegas y te llevas tu creación con un QR; los timbres solo suman con credencial. ¿Quieres una? Créala en tu celular desde el QR de la entrada.</p>
      </main>
    </div>
  );
};

// Configuración de la mesa, protegida por el PIN del staff. El PIN nuevo se guarda solo como hash en este equipo.
const PanelStaff: React.FC<{ app: string; alSalir: () => void }> = ({ app, alSalir }) => {
  const [pin, setPin] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState<ConfigMesa>(leerConfig);
  const [nuevo, setNuevo] = useState('');
  const [aviso, setAviso] = useState('');
  const pc = configRemota();
  const cambiar = (c: Partial<ConfigMesa>) => { const n = { ...config, ...c, manual: !!pc || config.manual }; setConfig(n); guardarConfig(n); setAviso(pc ? 'Guardado solo en esta tablet: ya no sigue al PC madre hasta que lo pidas.' : 'Guardado en esta tablet.'); };
  const seguirPc = () => { const n = { ...config, manual: false }; guardarConfig(n); setConfig(leerConfig()); setAviso('Esta tablet vuelve a seguir al PC madre.'); };

  return (
    <div className="k-tutorial">
      <button type="button" className="volver k-btn" onClick={alSalir}><Icono nombre="arrow_back" />Volver a {app}</button>
      <main className="k-tutorial-cuerpo">
        <p className="k-tutorial-etq">Staff · configuración de esta mesa</p>
        {!abierto ? (
          <form className="k-juego-form" onSubmit={async e => { e.preventDefault(); if (await verificarPin(pin)) { setAbierto(true); setError(''); } else setError('PIN incorrecto.'); }}>
            <label className="k-etq" htmlFor="pin-staff">PIN del staff{pinDeDemo() ? ' (demo: 0000)' : ''}</label>
            <input id="pin-staff" className="k-juego-input" type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} />
            {error && <p className="k-ayuda k-juego-error" role="alert">{error}</p>}
            <div className="k-tutorial-acciones"><button type="submit" className="k-btn k-primario"><Icono nombre="check" />Entrar</button></div>
          </form>
        ) : (
          <div className="k-juego-form">
            <p className="k-ayuda">Mesa <b>{idMesa()}</b>. {pc
              ? (config.manual ? 'Esta tablet tiene una configuración propia (respaldo): no sigue al PC madre.' : 'Esta tablet sigue al PC madre (Mesas): el modo juego y el código de la estación 2 se cambian allá. Cambiarlos aquí es solo un respaldo para esta tablet.')
              : 'Sin conexión con el PC madre: la configuración queda en esta tablet.'}</p>
            {pc && config.manual && <div className="k-tutorial-acciones"><BotonAccion icono="refresh" texto="Volver a seguir al PC madre" onClick={seguirPc} /></div>}
            <Interruptor id="modo-juego" texto="Modo juego: pedir el código de la credencial" activo={config.modoJuego} onCambiar={v => cambiar({ modoJuego: v })} />
            <label className="k-etq" htmlFor="token-2">Código de la estación 2 (el mismo de los QR impresos)</label>
            <input id="token-2" className="k-juego-input" value={config.token2} autoComplete="off" onChange={e => cambiar({ token2: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) })} />
            <label className="k-etq" htmlFor="pin-nuevo">{pc ? 'PIN de respaldo, solo para cuando esta tablet no tenga conexión (4 a 8 números)' : 'PIN nuevo para esta tablet (4 a 8 números)'}</label>
            <div className="k-tutorial-acciones">
              <input id="pin-nuevo" className="k-juego-input" type="password" inputMode="numeric" autoComplete="off" value={nuevo} onChange={e => setNuevo(e.target.value.replace(/\D/g, '').slice(0, 8))} />
              <BotonAccion icono="check" texto="Cambiar PIN" disabled={nuevo.length < 4} onClick={async () => { cambiar({ pinHash: await hashPin(nuevo) }); setNuevo(''); }} />
            </div>
            <div className="k-tutorial-acciones">
              <BotonAccion icono="restart_alt" texto="Reiniciar mesa (borra la sesión)" onClick={() => { try { sessionStorage.clear(); } catch { /* nada */ } setAviso('Mesa reiniciada.'); }} />
            </div>
            {aviso && <p className="k-ayuda" role="status">{aviso}</p>}
          </div>
        )}
      </main>
    </div>
  );
};
