import React, { useEffect, useState } from 'react';
import { CODIGO, EVENTO_TIMBRE, entrarJugador, guardarConfig, hashPin, jugador, leerConfig, normalizarCodigo, pinDeDemo, verificarPin, type ConfigMesa } from '../juego';
import { BotonAccion, Interruptor } from './Kit';

// Modo juego en las mesas: la tablet pide el código de la credencial, otorga el timbre 2 al exportar y el staff
// la configura con su PIN (?staff en la URL). Envuelve la experiencia completa.

const Icono: React.FC<{ nombre: string }> = ({ nombre }) => <span className="material-symbols-outlined" aria-hidden="true">{nombre}</span>;
const esStaff = () => new URLSearchParams(location.search).has('staff');

export const PuertaJuego: React.FC<{ app: string; titulo: string; visual: string; children: React.ReactNode }> = ({ app, titulo, visual, children }) => {
  const [config, setConfig] = useState<ConfigMesa>(leerConfig);
  const [codigo, setCodigo] = useState(() => jugador()?.codigo ?? null);
  const [ganado, setGanado] = useState<{ codigo: string; directo: boolean } | null>(null);
  const [staff, setStaff] = useState(esStaff);

  useEffect(() => { if (!document.documentElement.dataset.visual) document.documentElement.dataset.visual = visual; }, [visual]);
  useEffect(() => {
    const alGanar = (e: Event) => setGanado((e as CustomEvent<{ codigo: string; directo: boolean }>).detail);
    window.addEventListener(EVENTO_TIMBRE, alGanar);
    return () => window.removeEventListener(EVENTO_TIMBRE, alGanar);
  }, []);

  if (staff) return <PanelStaff app={app} alSalir={() => { setConfig(leerConfig()); setStaff(false); history.replaceState(null, '', location.pathname); }} />;
  if (config.modoJuego && !codigo) return <Desbloqueo titulo={titulo} alEntrar={c => { entrarJugador(c); setCodigo(c); }} alStaff={() => setStaff(true)} />;
  return (<>
    {children}
    {ganado && (
      <div className="k-quiosco" role="dialog" aria-modal="true" aria-labelledby="timbre-t">
        <div className="k-panel k-quiosco-caja">
          <p className="k-quiosco-cuenta" aria-hidden="true"><Icono nombre="approval" /></p>
          <h2 id="timbre-t">¡Ganaste el timbre Creación!</h2>
          {ganado.directo ? (
            <p>Tu creación va al HUB y el timbre ya está en tu credencial ({ganado.codigo}).</p>
          ) : (<>
            <p>Tu creación va al HUB. En tu credencial ({ganado.codigo}) toca <b>Timbrar</b>, elige la estación <b>2</b> y escribe el código:</p>
            <p className="k-juego-token">{config.token2}</p>
          </>)}
          <button type="button" className="k-btn k-primario" onClick={() => setGanado(null)}><Icono nombre="check" />Listo</button>
        </div>
      </div>
    )}
  </>);
};

const Desbloqueo: React.FC<{ titulo: string; alEntrar: (codigo: string) => void; alStaff: () => void }> = ({ titulo, alEntrar, alStaff }) => {
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
        <h1 className="k-tutorial-titulo">Escribe el código de tu credencial</h1>
        <form className="k-juego-form" onSubmit={entrar}>
          <label className="k-etq" htmlFor="codigo-credencial">Código (está bajo tu nombre, en la credencial del celular)</label>
          <input id="codigo-credencial" className="k-juego-input" value={valor} autoComplete="off" autoCapitalize="characters" spellCheck={false}
            onChange={e => { setValor(e.target.value.toUpperCase()); setError(''); }} aria-invalid={!!error} aria-describedby="codigo-error" />
          {error && <p id="codigo-error" className="k-ayuda k-juego-error" role="alert">{error}</p>}
          <div className="k-tutorial-acciones">
            <button type="submit" className="k-btn k-primario"><Icono nombre="check" />Entrar</button>
            <BotonAccion icono="tune" texto="Staff" onClick={alStaff} />
          </div>
        </form>
        <p className="k-ayuda">Al terminar y exportar tu creación ganas el timbre Creación. ¿No tienes credencial? Créala en tu celular desde el QR de la entrada.</p>
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
  const cambiar = (c: Partial<ConfigMesa>) => { const n = { ...config, ...c }; setConfig(n); guardarConfig(n); setAviso('Guardado en esta tablet.'); };

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
            <Interruptor id="modo-juego" texto="Modo juego: pedir el código de la credencial" activo={config.modoJuego} onCambiar={v => cambiar({ modoJuego: v })} />
            <label className="k-etq" htmlFor="token-2">Código de la estación 2 (el mismo de los QR impresos)</label>
            <input id="token-2" className="k-juego-input" value={config.token2} autoComplete="off" onChange={e => cambiar({ token2: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) })} />
            <label className="k-etq" htmlFor="pin-nuevo">PIN nuevo para esta tablet (4 a 8 números)</label>
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
