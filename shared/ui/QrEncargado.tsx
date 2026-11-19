import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { enlaceJugar, entrarJugador, jugador, leerConfig, leerEmparejamiento, nuevoNonce, pinDeDemo, verificarPin } from '../juego';
import { remoto } from '../datos';
import { terminarMesa } from './Tutorial';

// Botón del encargado (plan 013 §QR): para quien ya está jugando sin haber puesto su credencial. El staff toca el
// botón chico de arriba al centro (arriba al centro, la franja libre de las barras superiores; una app la corre con `x` si ahí tiene algo), escribe su PIN y la tablet muestra un QR del timbre 2 de esta experiencia
// (#/sello/2?t=<código de la estación 2>&k=<app>). La persona lo lee desde su credencial (Timbrar) y suma la creación.
// No interrumpe la experiencia: es una capa encima, sin desmontar lo que la persona está haciendo.

const Icono: React.FC<{ nombre: string }> = ({ nombre }) => <span className="material-symbols-outlined" aria-hidden="true">{nombre}</span>;
const ABIERTO_MS = 10 * 60 * 1000; // después de un PIN correcto, el encargado no lo repite por 10 minutos
const LLAVE = 'sd:encargado';
const desbloqueado = () => { try { return Date.now() - Number(sessionStorage.getItem(LLAVE) || 0) < ABIERTO_MS; } catch { return false; } };

// QR para crear la credencial (sin PIN: no da timbres), para quien llega a la mesa sin credencial.
export const enlaceCrear = () => new URL('../../credencial/dist/#/crear', location.href).href;

// La credencial se sirve en el mismo hub: <hub>/credencial/dist/ (las apps viven en <hub>/<app>/dist/).
export const enlaceTimbre = (app: string, token: string) =>
  new URL(`../../credencial/dist/#/sello/2?t=${encodeURIComponent(token)}&k=${encodeURIComponent(app)}`, location.href).href;

const capa: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.55)', padding: 16 };
const caja: React.CSSProperties = { background: '#F4EEE3', color: '#000', borderRadius: 16, padding: 24, width: 'min(440px, 100%)', maxHeight: '100%', overflow: 'auto', display: 'grid', gap: 12, textAlign: 'center', font: '500 16px/1.4 "DM Sans", system-ui, sans-serif' };
const boton: React.CSSProperties = { minHeight: 48, padding: '0 18px', borderRadius: 12, border: '2px solid #000', background: '#fff', color: '#000', font: 'inherit', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' };

// QR para jugar (plan 014): la persona lo escanea con su credencial y la mesa queda asociada a ella hasta que la
// experiencia vuelve al inicio. Lo que cree suma al timbre Creación. La tablet pregunta a la base cada 2,5 s.
export const QrJugar: React.FC<{ app: string; tam?: number; alEntrar: (codigo: string) => void }> = ({ app, tam = 300, alEntrar }) => {
  const [nonce] = useState(nuevoNonce);
  const [qr, setQr] = useState('');
  const avisar = React.useRef(alEntrar);
  avisar.current = alEntrar;
  useEffect(() => {
    QRCode.toDataURL(enlaceJugar(app, nonce), { width: 560, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#FFFFFF' } }).then(setQr).catch(() => setQr(''));
  }, [app, nonce]);
  useEffect(() => {
    if (!remoto) return;
    let vivo = true, t = 0;
    const mirar = async () => {
      const c = await leerEmparejamiento(nonce);
      if (!vivo) return;
      if (c) { entrarJugador(c, app); avisar.current(c); return; }
      t = window.setTimeout(mirar, 2500);
    };
    t = window.setTimeout(mirar, 2500);
    return () => { vivo = false; clearTimeout(t); };
  }, [app, nonce]);
  if (!remoto) return <p style={{ margin: 0 }}>Sin conexión a la base: escribe el código de tu credencial.</p>;
  return qr ? <img src={qr} alt="QR para jugar con tu credencial" style={{ width: tam, maxWidth: '100%', justifySelf: 'center', imageRendering: 'pixelated', background: '#fff' }} /> : <p>Dibujando el QR…</p>;
};

export const QrEncargado: React.FC<{ app: string; x?: string }> = ({ app, x = '50%' }) => {
  const [abierto, setAbierto] = useState(false);
  // vista: 'menu' (elegir), 'crear' (QR para crear credencial, sin PIN) o 'timbre' (pide PIN).
  const [vista, setVista] = useState<'menu' | 'crear' | 'jugar' | 'timbre' | 'listo'>('menu');
  const [asociado, setAsociado] = useState('');
  const [listo, setListo] = useState(desbloqueado);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [qr, setQr] = useState('');
  const token = leerConfig().token2;

  useEffect(() => {
    if (!abierto || vista === 'menu' || (vista === 'timbre' && !listo)) return;
    setQr('');
    QRCode.toDataURL(vista === 'crear' ? enlaceCrear() : enlaceTimbre(app, token), { width: 560, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#FFFFFF' } })
      .then(setQr).catch(() => setError('No se pudo dibujar el QR.'));
  }, [abierto, listo, vista, app, token]);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await verificarPin(pin)) { try { sessionStorage.setItem(LLAVE, String(Date.now())); } catch { /* nada */ } setListo(true); setError(''); }
    else setError('PIN incorrecto.');
    setPin('');
  };
  const cerrar = () => { setAbierto(false); setVista('menu'); setError(''); setPin(''); };

  return (<>
    <button type="button" aria-label="QR: crear credencial o timbre Creación" title="QR de la credencial"
      onClick={() => { setListo(desbloqueado()); setAbierto(true); }}
      style={{ position: 'fixed', left: x, top: 4, transform: 'translateX(-50%)', zIndex: 999, width: 48, height: 48, borderRadius: 24, border: '2px solid #000', background: '#F4EEE3', color: '#000', opacity: 0.55, display: 'grid', placeItems: 'center', padding: 0, cursor: 'pointer', fontSize: 22 }}>
      <Icono nombre="qr_code_2" />
    </button>
    {abierto && (
      <div style={capa} role="dialog" aria-modal="true" aria-labelledby="encargado-t" onClick={e => { if (e.target === e.currentTarget) cerrar(); }}>
        <div style={caja}>
          {vista === 'menu' ? (<>
            <h2 id="encargado-t" style={{ margin: 0, fontSize: 22 }}>Credencial</h2>
            <button type="button" style={{ ...boton, background: '#000', color: '#F4EEE3' }} onClick={() => setVista('crear')}><Icono nombre="qr_code_2" />Crear mi credencial</button>
            {jugador() ? (<>
              <p style={{ margin: 0 }}>Esta mesa está jugando con <b>{jugador()!.codigo}</b>.</p>
              <button type="button" style={{ ...boton, background: '#000', color: '#F4EEE3' }} onClick={terminarMesa}><Icono nombre="restart_alt" />Terminar y liberar la mesa</button>
            </>) : (
              <button type="button" style={boton} onClick={() => setVista('jugar')}><Icono nombre="qr_code_2" />Jugar con mi credencial</button>
            )}
            <button type="button" style={{ ...boton, minHeight: 40, fontSize: 14, fontWeight: 500 }} onClick={() => setVista('timbre')}><Icono nombre="lock" />Encargado: timbre a mano</button>
            <button type="button" style={{ ...boton, border: 0, background: 'transparent' }} onClick={cerrar}>Cerrar</button>
          </>) : vista === 'crear' ? (<>
            <h2 id="encargado-t" style={{ margin: 0, fontSize: 22 }}>Crea tu credencial</h2>
            <p style={{ margin: 0 }}>Escanea con la cámara de tu celular, crea tu credencial y vuelve a jugar.</p>
            {qr ? <img src={qr} alt="QR para crear la credencial" style={{ width: '100%', maxWidth: 320, justifySelf: 'center', imageRendering: 'pixelated' }} /> : <p>Dibujando el QR…</p>}
            <button type="button" style={{ ...boton, justifySelf: 'center' }} onClick={cerrar}><Icono nombre="check" />Listo</button>
          </>) : vista === 'jugar' ? (<>
            <h2 id="encargado-t" style={{ margin: 0, fontSize: 22 }}>Juega con tu credencial</h2>
            <p style={{ margin: 0 }}>En tu credencial toca <b>Timbrar</b> y apunta a este QR. Lo que crees aquí suma a tu timbre Creación.</p>
            <QrJugar app={app} alEntrar={c => { setAsociado(c); setVista('listo'); }} />
            <button type="button" style={{ ...boton, justifySelf: 'center' }} onClick={cerrar}>Cerrar</button>
          </>) : vista === 'listo' ? (<>
            <h2 id="encargado-t" style={{ margin: 0, fontSize: 22 }}>¡Listo, {asociado}!</h2>
            <p style={{ margin: 0 }}>Esta mesa quedó con tu credencial. Lo que crees y exportes suma a tu timbre Creación.</p>
            <button type="button" style={{ ...boton, justifySelf: 'center', background: '#000', color: '#F4EEE3' }} onClick={cerrar}><Icono nombre="check" />A jugar</button>
          </>) : !listo ? (
            <form onSubmit={entrar} style={{ display: 'grid', gap: 12 }}>
              <h2 id="encargado-t" style={{ margin: 0, fontSize: 22 }}>Encargado</h2>
              <label htmlFor="encargado-pin">PIN del staff{pinDeDemo() ? ' (demo: 0000)' : ''}</label>
              <input id="encargado-pin" type="password" inputMode="numeric" autoComplete="off" autoFocus value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                style={{ minHeight: 48, fontSize: 22, textAlign: 'center', border: '2px solid #000', borderRadius: 12 }} />
              {error && <p role="alert" style={{ margin: 0, color: '#7A2E8E', fontWeight: 700 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button type="button" style={boton} onClick={cerrar}>Cancelar</button>
                <button type="submit" style={{ ...boton, background: '#000', color: '#F4EEE3' }}><Icono nombre="check" />Entrar</button>
              </div>
            </form>
          ) : (<>
            <h2 id="encargado-t" style={{ margin: 0, fontSize: 22 }}>Timbre Creación</h2>
            <p style={{ margin: 0 }}>En tu credencial toca <b>Timbrar</b> y apunta la cámara a este QR.</p>
            {qr ? <img src={qr} alt="QR del timbre Creación de esta experiencia" style={{ width: '100%', maxWidth: 320, justifySelf: 'center', imageRendering: 'pixelated' }} /> : <p>Dibujando el QR…</p>}
            {token === 'DEMO' && <p role="alert" style={{ margin: 0, fontWeight: 700 }}>Ojo: esta tablet tiene el código de demostración. Configura el código de la estación 2 en Staff (?staff).</p>}
            {error && <p role="alert" style={{ margin: 0 }}>{error}</p>}
            <button type="button" style={{ ...boton, justifySelf: 'center' }} onClick={cerrar}><Icono nombre="check" />Listo</button>
          </>)}
        </div>
      </div>
    )}
  </>);
};
