import React, { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ESTACIONES, ACTIVAS, completa } from '../../shared/juego';
import { marcoListo } from '../../shared/marcos';
import * as api from './lib/api';
import './styles.css';

// Timbre 2 «Creación»: experiencias distintas que pide (migración 012, 19 nov; antes 4). La base es la que decide.
const META_CREACION = 2;

// PC madre (plan 007): el panel del staff para el evento. Personas y timbres, canje con stock, mesas, avisos y configuración.
// Corre en el PC del stand (o en cualquier navegador) con la sesión de Supabase Auth de cada persona del equipo.

type Vista = 'resumen' | 'personas' | 'canje' | 'mesas' | 'hub' | 'avisos' | 'config';
const VISTAS: { id: Vista; nombre: string; icono: string }[] = [
  { id: 'resumen', nombre: 'Resumen', icono: 'speed' },
  { id: 'personas', nombre: 'Personas', icono: 'grid_view' },
  { id: 'canje', nombre: 'Canje', icono: 'approval' },
  { id: 'mesas', nombre: 'Mesas', icono: 'train' },
  { id: 'hub', nombre: 'Pantalla HUB', icono: 'wallpaper' },
  { id: 'avisos', nombre: 'Avisos', icono: 'auto_awesome' },
  { id: 'config', nombre: 'Configuración', icono: 'tune' },
];
const Icono: React.FC<{ n: string }> = ({ n }) => <span className="material-symbols-outlined" aria-hidden="true">{n}</span>;
const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' });
// Nombres de lo que guarda la base (pasos del timbre 2 y tipos de eventos del HUB).
const EXPERIENCIAS: Record<string, string> = {
  audioreactiva: 'Audioreactiva', fotomaton: 'Cabina', grabado: 'Grabado', graffiti: 'Graffiti', juego: 'Hora punta',
  mosaicos: 'Mosaicos', 'taller-mosaicos': 'Mosaicos', teatro: 'Teatro', loops: 'Teatro', vagon: 'Vagón',
};
const TIPOS: Record<string, string> = {
  credencial: 'Credencial', timbre: 'Timbre', vagon: 'Vagón', grabado: 'Grabado', mosaico: 'Mosaico', audio: 'Audioreactiva',
  graffiti: 'Graffiti', foto: 'Cabina', juego: 'Hora punta',
};
const normalizar = (c: string) => { const t = c.toUpperCase().replace(/[^A-Z0-9]/g, ''); return t.startsWith('SD') ? 'SD-' + t.slice(2, 7) : 'SD-' + t.slice(0, 5); };

// Avisos cortos (se van solos).
function useAviso(): [string, (m: string) => void] {
  const [m, setM] = useState('');
  useEffect(() => { if (!m) return; const t = setTimeout(() => setM(''), 4500); return () => clearTimeout(t); }, [m]);
  return [m, setM];
}

export const App: React.FC = () => {
  const [sesion, setSesion] = useState<Session | null | undefined>(undefined);
  const [staff, setStaff] = useState<api.Staff | null | undefined>(undefined);
  const [vista, setVista] = useState<Vista>('resumen');

  useEffect(() => {
    if (!api.configurado) { setSesion(null); return; }
    api.sesionActual().then(setSesion);
    const sub = api.alCambiarSesion(setSesion);
    return () => sub.unsubscribe();
  }, []);
  useEffect(() => { if (sesion) { setStaff(undefined); api.quienSoy().then(setStaff); } else setStaff(undefined); }, [sesion]);

  if (!api.configurado) return <SinSupabase />;
  if (sesion === undefined) return <main className="centro"><p>Abriendo…</p></main>;
  if (!sesion) return <Entrar />;
  if (staff === undefined) return <main className="centro"><p>Comprobando tu cuenta…</p></main>;
  if (staff === null) return (
    <main className="centro">
      <div className="tarjeta entrar">
        <p className="etq">Somos Diseño</p>
        <h1>Cuenta pendiente</h1>
        <p className="ayuda">Tu cuenta ({sesion.user.email}) existe, pero todavía no está en el equipo. Pídele a un admin que la apruebe en <b>Configuración → Cuentas del staff</b> y vuelve a entrar.</p>
        <button type="button" className="btn" onClick={() => api.salir()}>Salir</button>
      </div>
    </main>
  );

  return (
    <div className="panel">
      <nav className="lateral">
        <p className="marca">PC madre<span>Somos Diseño</span></p>
        {VISTAS.map(v => (
          <button key={v.id} type="button" className={'nav' + (vista === v.id ? ' activa' : '')} onClick={() => setVista(v.id)} aria-current={vista === v.id ? 'page' : undefined}>
            <Icono n={v.icono} />{v.nombre}
          </button>
        ))}
        <div className="quien">
          <p><b>{staff.nombre}</b><br /><span className="mono">{staff.rol}</span></p>
          <button type="button" className="btn chico" onClick={() => api.salir()}>Salir</button>
        </div>
      </nav>
      <main className="contenido">
        {vista === 'resumen' && <ResumenPanel ir={setVista} />}
        {vista === 'personas' && <Personas staff={staff} />}
        {vista === 'canje' && <CanjePanel staff={staff} />}
        {vista === 'mesas' && <Mesas staff={staff} />}
        {vista === 'hub' && <PantallaHub />}
        {vista === 'avisos' && <Avisos />}
        {vista === 'config' && <Config staff={staff} />}
      </main>
    </div>
  );
};

// ---------- sin configurar / entrar ----------
const SinSupabase: React.FC = () => (
  <main className="centro">
    <h1>PC madre</h1>
    <p>Este panel necesita el proyecto de Supabase del evento. Crea <code>admin/.env.local</code> con <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>, corre los SQL en orden (guía en <code>docs/supabase.md</code>) y vuelve a compilar.</p>
  </main>
);

const Entrar: React.FC = () => {
  const [modo, setModo] = useState<'entrar' | 'crear'>('entrar');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault(); setEnviando(true); setError(''); setAviso('');
    try {
      if (modo === 'entrar') await api.entrar(email.trim(), pass);
      else {
        const r = await api.registrarse(email.trim(), pass, nombre);
        if (!r.sesion) setAviso('Cuenta creada. Revisa tu correo para confirmarla y luego entra.');
      }
    } catch (err) {
      const m = (err as Error).message;
      setError(m === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : m.includes('already registered') ? 'Ese correo ya tiene cuenta: entra con él.' : m.includes('at least 6') ? 'La contraseña necesita al menos 6 caracteres.' : m);
    }
    setEnviando(false);
  };
  return (
    <main className="centro">
      <form className="tarjeta entrar" onSubmit={enviar}>
        <p className="etq">Somos Diseño</p>
        <h1>PC madre</h1>
        <div className="seg" role="radiogroup" aria-label="Entrar o crear cuenta">
          <button type="button" aria-pressed={modo === 'entrar'} onClick={() => setModo('entrar')}>Entrar</button>
          <button type="button" aria-pressed={modo === 'crear'} onClick={() => setModo('crear')}>Crear cuenta</button>
        </div>
        {modo === 'crear' && <label>Tu nombre<input value={nombre} maxLength={30} required onChange={e => setNombre(e.target.value)} /></label>}
        <label>Correo<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Contraseña<input type="password" autoComplete={modo === 'crear' ? 'new-password' : 'current-password'} minLength={6} value={pass} onChange={e => setPass(e.target.value)} required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        {aviso && <p className="aviso" role="status">{aviso}</p>}
        <button className="btn primario" disabled={enviando}>{enviando ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}</button>
        <p className="ayuda">{modo === 'crear' ? 'La primera cuenta del proyecto queda como admin. Las siguientes esperan que un admin las apruebe en Configuración.' : 'Si es tu primera vez, crea una cuenta.'}</p>
      </form>
    </main>
  );
};

// ---------- personas ----------
const Personas: React.FC<{ staff: api.Staff }> = ({ staff }) => {
  const [lista, setLista] = useState<api.Persona[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [aviso, setAviso] = useAviso();
  const [ocupado, setOcupado] = useState(false);
  const [abierta, setAbierta] = useState<api.Persona | null>(null);
  const cargar = useCallback(() => api.personas(busqueda).then(setLista).catch(e => setAviso((e as Error).message)), [busqueda, setAviso]);
  useEffect(() => { const t = setTimeout(cargar, 150); return () => clearTimeout(t); }, [cargar]);
  useEffect(() => api.enVivo(cargar), [cargar]);
  useEffect(() => { const id = setInterval(cargar, 10000); return () => clearInterval(id); }, [cargar]);

  const hacer = async (f: () => Promise<unknown>, ok?: string) => {
    setOcupado(true);
    try { await f(); if (ok) setAviso(ok); await cargar(); } catch (e) { setAviso((e as Error).message); }
    setOcupado(false);
  };
  const alternarSello = (p: api.Persona, n: number) => hacer(() => (p.sellos.includes(n) ? api.quitarSello(p.id, n) : api.darSello(p.id, n)));
  const guardarNombre = (p: api.Persona) => hacer(async () => { await api.renombrar(p.id, nombre); setEditando(null); }, 'Nombre guardado.');
  const borrar = (p: api.Persona) => { if (confirm(`¿Borrar la credencial ${p.codigo} (${p.nombre})? Se borran sus timbres y avisos, y sale del HUB.`)) hacer(async () => { await api.borrarPersona(p.id); if (abierta?.id === p.id) setAbierta(null); }, 'Credencial borrada.'); };
  const exportar = () => hacer(async () => { descargarCsv(await api.todasLasPersonas()); }, 'CSV descargado.');

  // Con más de LIMITE_PERSONAS la lista se corta: las cifras salen del resumen de la base (QA del PC madre, Q2).
  const [res, setRes] = useState<api.Resumen | null>(null);
  useEffect(() => { const traer = () => api.resumen().then(setRes).catch(() => setRes(null)); traer(); const id = setInterval(traer, 15000); return () => clearInterval(id); }, []);
  const cortada = !busqueda.trim() && lista.length >= api.LIMITE_PERSONAS;
  const total = res?.credenciales ?? lista.length, completas = res?.completas ?? lista.filter(p => completa(p.sellos)).length, canjeadas = res?.canjes ?? lista.filter(p => p.canjeado).length;
  return (
    <section>
      <header className="cabecera">
        <div><h1>Personas</h1><p className="ayuda">{total} credenciales · {completas} completas · {canjeadas} canjeadas</p></div>
        <div className="acciones">
          <input className="buscar" type="search" placeholder="Buscar por código o nombre" value={busqueda} onChange={e => setBusqueda(e.target.value)} aria-label="Buscar" />
          <button type="button" className="btn" onClick={exportar} disabled={ocupado} title="Todas las credenciales, en una planilla"><Icono n="download" />CSV</button>
        </div>
      </header>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      {abierta && <FichaPersona p={lista.find(x => x.id === abierta.id) ?? abierta} alCerrar={() => setAbierta(null)} />}
      {cortada && <p className="aviso" role="status">Se muestran las {api.LIMITE_PERSONAS} credenciales más recientes. Para encontrar a alguien más, busca por código o nombre.</p>}
      <div className="tabla-c">
      <table className="tabla">
        <thead><tr><th>Código</th><th>Nombre</th><th>Lenguaje</th>{ESTACIONES.map(e => <th key={e.n} className="centro-col" title={e.nombre}>{e.n}</th>)}<th title="Experiencias distintas (timbre 2)">Creación</th><th title="Afiches encontrados (timbre 3)">Cacería</th><th>Avisos</th><th>Canje</th><th>Hora</th><th></th></tr></thead>
        <tbody>
          {lista.map(p => (
            <tr key={p.id} className={p.canjeado ? 'canjeada' : completa(p.sellos) ? 'completa' : ''}>
              <td><button type="button" className="texto mono" onClick={() => setAbierta(p)} title="Ver la ficha">{p.codigo} <Icono n="visibility" /></button></td>
              <td>
                {editando === p.id ? (
                  <form className="enlinea" onSubmit={e => { e.preventDefault(); guardarNombre(p); }}>
                    <input value={nombre} maxLength={14} autoFocus onChange={e => setNombre(e.target.value)} aria-label="Nombre" />
                    <button className="btn chico primario" disabled={ocupado}>OK</button>
                    <button type="button" className="btn chico" onClick={() => setEditando(null)}>×</button>
                  </form>
                ) : (
                  <button type="button" className="texto" onClick={() => { setEditando(p.id); setNombre(p.nombre); }} title="Cambiar el nombre">{p.nombre} <Icono n="draw" /></button>
                )}
              </td>
              <td>{marcoListo(p.marco).visual}</td>
              {ESTACIONES.map(e => (
                <td key={e.n} className="centro-col">
                  <button type="button" className={'sello' + (p.sellos.includes(e.n) ? ' si' : '') + (e.activa ? '' : ' apagado')} disabled={ocupado} onClick={() => alternarSello(p, e.n)}
                    aria-pressed={p.sellos.includes(e.n)} aria-label={`Timbre ${e.n} · ${e.nombre}`} title={`${e.nombre}: ${p.sellos.includes(e.n) ? 'quitar' : 'dar'}`}>
                    {p.sellos.includes(e.n) ? <Icono n="check" /> : e.n}
                  </button>
                </td>
              ))}
              <td className="mono">{p.creaciones ?? '–'}/{META_CREACION}</td>
              <td className="mono">{p.portales}/3</td>
              <td className="mono">{p.avisos ? 'sí' : '—'}</td>
              <td>{p.canjeado ? <span className="pill ok">Canjeado</span> : completa(p.sellos) ? <span className="pill">Lista</span> : <span className="mono">{p.sellos.filter(n => ACTIVAS.includes(n)).length}/{ACTIVAS.length}</span>}</td>
              <td className="mono">{hora(p.creada)}</td>
              <td>{staff.rol === 'admin' && <button type="button" className="btn chico" onClick={() => borrar(p)} title="Borrar credencial" aria-label="Borrar credencial"><Icono n="delete" /></button>}</td>
            </tr>
          ))}
          {!lista.length && <tr><td colSpan={13} className="vacio">Todavía no hay credenciales{busqueda ? ' con esa búsqueda' : ''}.</td></tr>}
        </tbody>
      </table>
      </div>
    </section>
  );
};

// ---------- canje ----------
const CanjePanel: React.FC<{ staff: api.Staff }> = ({ staff }) => {
  const [premio, setPremio] = useState<api.Premio | null>(null);
  const [hoy, setHoy] = useState(0);
  const [codigo, setCodigo] = useState('SD-');
  const [persona, setPersona] = useState<api.Persona | null | undefined>(undefined);
  const [aviso, setAviso] = useAviso();
  const [ocupado, setOcupado] = useState(false);
  const cargar = useCallback(() => Promise.all([api.premio(), api.canjesDeHoy()]).then(([p, h]) => { setPremio(p); setHoy(h); }).catch(e => setAviso((e as Error).message)), [setAviso]);
  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => api.enVivo(cargar), [cargar]);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = normalizar(codigo);
    setCodigo(c);
    try { const l = await api.personas(c); setPersona(l.find(p => p.codigo === c) ?? null); } catch (err) { setAviso((err as Error).message); }
  };
  const canjear = async () => {
    if (!persona) return;
    setOcupado(true);
    try { const r = await api.canjear(persona.codigo); setAviso(`Canjeado. Quedan ${r.stock} · hoy ${r.hoy}.`); setPersona({ ...persona, canjeado: true }); await cargar(); }
    catch (err) { setAviso((err as Error).message); }
    setOcupado(false);
  };
  const guardar = async (p: api.Premio) => { try { await api.guardarPremio(p); setPremio(p); setAviso('Premio guardado.'); } catch (err) { setAviso((err as Error).message); } };

  return (
    <section>
      <header className="cabecera"><div><h1>Canje</h1><p className="ayuda">Busca la credencial y entrega el premio. También puede canjearse desde el celular con el PIN.</p></div></header>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      <div className="dos">
        <form className="tarjeta" onSubmit={buscar}>
          <label>Código de la credencial<input className="mono grande" value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} maxLength={8} /></label>
          <button className="btn primario">Buscar</button>
          {persona === null && <p className="error">No existe esa credencial.</p>}
          {persona && (
            <div className="ficha">
              <p className="mono">{persona.codigo}</p>
              <h2>{persona.nombre}</h2>
              <p>{marcoListo(persona.marco).visual} · timbres {persona.sellos.filter(n => ACTIVAS.includes(n)).length}/{ACTIVAS.length} · creación {persona.creaciones ?? '–'}/{META_CREACION} · cacería {persona.portales}/3</p>
              {persona.canjeado ? <p className="pill ok">Ya canjeado</p>
                : !completa(persona.sellos) ? <p className="pill">Incompleta: faltan {ESTACIONES.filter(e => e.activa && !persona.sellos.includes(e.n)).map(e => e.nombre).join(', ')}</p>
                : <button type="button" className="btn primario" disabled={ocupado} onClick={canjear}><Icono n="approval" />Entregar premio</button>}
            </div>
          )}
        </form>
        <div className="tarjeta">
          <p className="etq">Premio</p>
          {premio && (
            <form onSubmit={e => { e.preventDefault(); guardar(premio); }}>
              <label>Nombre<input value={premio.nombre} disabled={staff.rol !== 'admin'} onChange={e => setPremio({ ...premio, nombre: e.target.value })} /></label>
              <div className="dos">
                <label>Stock<input type="number" min={0} className="mono grande" value={premio.stock} disabled={staff.rol !== 'admin'} onChange={e => setPremio({ ...premio, stock: Number(e.target.value) })} /></label>
                <label>Límite por día (0 = sin límite)<input type="number" min={0} className="mono grande" value={premio.limite_diario} disabled={staff.rol !== 'admin'} onChange={e => setPremio({ ...premio, limite_diario: Number(e.target.value) })} /></label>
              </div>
              <p className="ayuda">Entregados hoy: <b className="mono">{hoy}</b>{premio.limite_diario ? ` de ${premio.limite_diario}` : ''}.</p>
              {staff.rol === 'admin' && <button className="btn">Guardar</button>}
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

// ---------- mesas ----------
const Mesas: React.FC<{ staff: api.Staff }> = ({ staff }) => {
  const [lista, setLista] = useState<api.Sesion[]>([]);
  const [conf, setConf] = useState<api.ConfigMesas | null | undefined>(undefined);
  const [aviso, setAviso] = useAviso();
  const cargar = useCallback(() => api.sesiones().then(setLista).catch(e => setAviso((e as Error).message)), [setAviso]);
  const cargarConf = useCallback(() => api.configMesas().then(setConf).catch(e => setAviso((e as Error).message)), [setAviso]);
  useEffect(() => { cargar(); cargarConf(); const id = setInterval(cargar, 8000); return () => clearInterval(id); }, [cargar, cargarConf]);
  const admin = staff.rol === 'admin';
  const hacer = async (f: () => Promise<void>, ok: string) => { try { await f(); await cargarConf(); setAviso(ok); } catch (e) { setAviso((e as Error).message); } };
  const porMesa = new Map<string, api.Sesion>();
  for (const s of lista) if (!porMesa.has(s.mesa)) porMesa.set(s.mesa, s);
  return (
    <section>
      <header className="cabecera"><div><h1>Mesas</h1><p className="ayuda">Las tablets se configuran desde aquí (plan 015) y lo aplican en ~30 s. Cada tablet se identifica con 4 letras.</p></div></header>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      <div className="dos">
        <div className="tarjeta">
          <p className="etq">Todas las tablets</p>
          {conf === undefined ? <p className="ayuda">Cargando…</p> : conf === null ? (
            <p className="ayuda">Falta correr <code>shared/supabase/migraciones/008-config-mesas.sql</code> en Supabase. Mientras tanto, cada tablet se configura en <code>?staff</code>.</p>
          ) : (<>
            <label className="fila-check"><input type="checkbox" checked={conf.modo_juego} disabled={!admin}
              onChange={e => { const si = e.target.checked; hacer(() => api.guardarModoJuego(si), si ? 'Modo juego encendido en todas las tablets.' : 'Modo juego apagado: las tablets dejan de pedir el código.'); }} />
              Modo juego: las tablets piden el código de la credencial</label>
            <p className="ayuda">Código de la estación 2 (lo usan las tablets solas; debe coincidir con los QR impresos): <b className="mono">{conf.token2 ?? '—'}</b></p>
            <p className="ayuda">{conf.hay_pin ? 'El PIN del canje (Configuración) también abre ?staff en las tablets.' : 'Sin PIN: defínelo en Configuración (también abre ?staff en las tablets).'}</p>
            {admin ? <button type="button" className="btn" onClick={() => { if (confirm('¿Reiniciar todas las tablets? Se borra el código de quien esté jugando y vuelven a pedirlo.')) hacer(() => api.reiniciarMesas(), 'Reinicio enviado a todas las tablets.'); }}>Reiniciar todas las tablets</button>
              : <p className="ayuda">Solo un admin puede cambiar esto.</p>}
            {conf.reinicio && <p className="ayuda">Último reinicio general: {hora(conf.reinicio)}</p>}
          </>)}
        </div>
      </div>
      <div className="fichas">
        {[...porMesa.values()].map(s => (
          <div key={s.mesa} className="tarjeta"><p className="etq">Mesa {s.mesa} · {s.app}</p><p className="mono grande">{s.codigo}</p><p className="ayuda">desde las {hora(s.inicio)}</p>
            {admin && conf && <button type="button" className="btn" onClick={() => hacer(() => api.reiniciarMesas(s.mesa), `Reinicio enviado a la mesa ${s.mesa}.`)}>Reiniciar esta mesa</button>}
          </div>
        ))}
        {!porMesa.size && <p className="vacio">Ninguna tablet ha abierto una sesión de juego todavía.</p>}
      </div>
      <h2>Últimas sesiones</h2>
      <table className="tabla">
        <thead><tr><th>Hora</th><th>Mesa</th><th>Experiencia</th><th>Código</th></tr></thead>
        <tbody>{lista.map(s => <tr key={s.id}><td className="mono">{hora(s.inicio)}</td><td className="mono">{s.mesa}</td><td>{s.app}</td><td className="mono">{s.codigo}</td></tr>)}</tbody>
      </table>
    </section>
  );
};

// ---------- avisos ----------
const Avisos: React.FC = () => {
  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [url, setUrl] = useState('');
  const [destino, setDestino] = useState<'todos' | 'uno'>('todos');
  const [codigo, setCodigo] = useState('SD-');
  const [historial, setHistorial] = useState<api.Notificacion[]>([]);
  const [suscritos, setSuscritos] = useState(0);
  const [aviso, setAviso] = useAviso();
  const [enviando, setEnviando] = useState(false);
  const cargar = useCallback(() => Promise.all([api.avisos(), api.suscritos()]).then(([h, s]) => { setHistorial(h); setSuscritos(s); }).catch(e => setAviso((e as Error).message)), [setAviso]);
  useEffect(() => { cargar(); }, [cargar]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault(); setEnviando(true);
    try {
      const r = await api.enviarAviso({ titulo, cuerpo, url: url || undefined, codigo: destino === 'uno' ? normalizar(codigo) : null });
      setAviso(`Enviado a ${r.enviadas} celular${r.enviadas === 1 ? '' : 'es'}${r.fallidas ? ` (${r.fallidas} fallaron)` : ''}.`);
      setTitulo(''); setCuerpo(''); setUrl(''); await cargar();
    } catch (err) { setAviso((err as Error).message); }
    setEnviando(false);
  };
  return (
    <section>
      <header className="cabecera"><div><h1>Avisos</h1><p className="ayuda">Notificaciones a los celulares que activaron «Recibir avisos» en su credencial. Suscritos ahora: <b className="mono">{suscritos}</b>.</p></div></header>
      {suscritos === 0 && <p className="aviso" role="status">Ningún celular tiene los avisos activados, así que un aviso no le llegaría a nadie. Para que se puedan activar, la credencial necesita la clave VAPID.</p>}
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      <div className="dos">
        <form className="tarjeta" onSubmit={enviar}>
          <label>Título<input value={titulo} maxLength={80} required onChange={e => setTitulo(e.target.value)} placeholder="Ej: Empieza el taller de Figma" /></label>
          <label>Mensaje<textarea value={cuerpo} maxLength={240} required rows={3} onChange={e => setCuerpo(e.target.value)} placeholder="Corto y directo: qué, cuándo y dónde." /></label>
          <label>Enlace (opcional)<input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" /></label>
          <div className="seg" role="radiogroup" aria-label="Destino">
            <button type="button" aria-pressed={destino === 'todos'} onClick={() => setDestino('todos')}>Todos</button>
            <button type="button" aria-pressed={destino === 'uno'} onClick={() => setDestino('uno')}>Una credencial</button>
          </div>
          {destino === 'uno' && <label>Código<input className="mono" value={codigo} maxLength={8} onChange={e => setCodigo(e.target.value.toUpperCase())} /></label>}
          <button className="btn primario" disabled={enviando}><Icono n="auto_awesome" />{enviando ? 'Enviando…' : 'Enviar aviso'}</button>
          <p className="ayuda">En iPhone llega solo si la persona agregó la credencial a la pantalla de inicio.</p>
        </form>
        <div>
          <h2>Enviados</h2>
          <table className="tabla">
            <thead><tr><th>Hora</th><th>Título</th><th>Destino</th><th>Llegaron</th></tr></thead>
            <tbody>
              {historial.map(n => <tr key={n.id}><td className="mono">{hora(n.creado)}</td><td><b>{n.titulo}</b><br /><span className="ayuda">{n.cuerpo}</span></td><td className="mono">{n.codigo ?? 'todos'}</td><td className="mono">{n.enviadas}{n.fallidas ? ` · ${n.fallidas} ✕` : ''}</td></tr>)}
              {!historial.length && <tr><td colSpan={4} className="vacio">Todavía no se ha enviado ningún aviso.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

// ---------- configuración ----------
const Config: React.FC<{ staff: api.Staff }> = ({ staff }) => {
  const [pin, setPin] = useState('');
  const [hay, setHay] = useState<boolean | null>(null);
  const [aviso, setAviso] = useAviso();
  useEffect(() => { api.hayPin().then(setHay).catch(() => setHay(false)); }, []);
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.guardarPin(pin); setHay(true); setPin(''); setAviso('PIN guardado. Es el que el staff escribe en los celulares para canjear.'); }
    catch (err) { setAviso((err as Error).message); }
  };
  return (
    <section>
      <header className="cabecera"><div><h1>Configuración</h1></div></header>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      <div className="dos">
        <form className="tarjeta" onSubmit={guardar}>
          <p className="etq">PIN del canje</p>
          <p className="ayuda">{hay === null ? 'Comprobando…' : hay ? 'Hay un PIN configurado. Guardar uno nuevo lo reemplaza.' : 'Todavía no hay PIN: nadie puede canjear desde el celular hasta que lo definas.'}</p>
          <label>Nuevo PIN (4 a 8 números)<input className="mono grande" inputMode="numeric" value={pin} disabled={staff.rol !== 'admin'} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} /></label>
          {staff.rol === 'admin' ? <button className="btn primario" disabled={pin.length < 4}>Guardar PIN</button> : <p className="ayuda">Solo un admin puede cambiarlo.</p>}
          <p className="ayuda">Con la migración 008, este PIN también abre <code>?staff</code> en las tablets: el equipo recuerda uno solo.</p>
        </form>
        <Cuentas staff={staff} />
        {staff.rol === 'admin' && <EmpezarDeCero />}
      </div>
    </section>
  );
};

// Cuentas del staff: aprobar las que se registraron desde la pantalla de entrada y ver quién es quién.
const Cuentas: React.FC<{ staff: api.Staff }> = ({ staff }) => {
  const [pend, setPend] = useState<api.Pendiente[]>([]);
  const [lista, setLista] = useState<api.Staff[]>([]);
  const [roles, setRoles] = useState<Record<string, 'admin' | 'mesa'>>({});
  const [aviso, setAviso] = useAviso();
  const cargar = useCallback(() => { if (staff.rol !== 'admin') return; Promise.all([api.pendientes(), api.listaStaff()]).then(([p, l]) => { setPend(p); setLista(l); }).catch(e => setAviso((e as Error).message)); }, [staff.rol, setAviso]);
  useEffect(() => { cargar(); const id = setInterval(cargar, 15000); return () => clearInterval(id); }, [cargar]);
  if (staff.rol !== 'admin') return <div className="tarjeta"><p className="etq">Cuentas del staff</p><p className="ayuda">Solo un admin aprueba cuentas. Pídele a quien creó la primera.</p></div>;
  const aprobar = async (p: api.Pendiente) => { try { await api.aprobar(p.user_id, p.nombre || p.email.split('@')[0], roles[p.user_id] ?? 'mesa'); setAviso(`${p.email} ya es del equipo.`); cargar(); } catch (e) { setAviso((e as Error).message); } };
  const quitar = async (s: api.Staff) => { if (!confirm(`¿Sacar a ${s.nombre} del equipo?`)) return; try { await api.quitar(s.user_id); cargar(); } catch (e) { setAviso((e as Error).message); } };
  return (
    <div className="tarjeta">
      <p className="etq">Cuentas del staff</p>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      <p className="ayuda">Cada persona crea su cuenta en la pantalla de entrada («Crear cuenta»). Aquí la apruebas: <b>admin</b> edita todo; <b>mesa</b> da timbres, canjea y manda avisos.</p>
      {pend.length > 0 && (
        <table className="tabla">
          <thead><tr><th>Pendiente</th><th>Rol</th><th></th></tr></thead>
          <tbody>{pend.map(p => (
            <tr key={p.user_id}>
              <td><b>{p.nombre || p.email.split('@')[0]}</b><br /><span className="ayuda mono">{p.email}</span></td>
              <td>
                <div className="seg" role="radiogroup" aria-label="Rol">
                  <button type="button" aria-pressed={(roles[p.user_id] ?? 'mesa') === 'mesa'} onClick={() => setRoles({ ...roles, [p.user_id]: 'mesa' })}>mesa</button>
                  <button type="button" aria-pressed={roles[p.user_id] === 'admin'} onClick={() => setRoles({ ...roles, [p.user_id]: 'admin' })}>admin</button>
                </div>
              </td>
              <td><button type="button" className="btn chico primario" onClick={() => aprobar(p)}>Aprobar</button></td>
            </tr>
          ))}</tbody>
        </table>
      )}
      {!pend.length && <p className="ayuda">No hay cuentas esperando aprobación.</p>}
      <table className="tabla">
        <thead><tr><th>Equipo</th><th>Rol</th><th></th></tr></thead>
        <tbody>{lista.map(s => (
          <tr key={s.user_id}><td>{s.nombre}{s.user_id === staff.user_id ? ' (tú)' : ''}</td><td className="mono">{s.rol}</td><td>{s.user_id !== staff.user_id && <button type="button" className="btn chico" onClick={() => quitar(s)} aria-label={`Sacar a ${s.nombre}`}><Icono n="delete" /></button>}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
};

// ---------- resumen (plan 017) ----------
const ResumenPanel: React.FC<{ ir: (v: Vista) => void }> = ({ ir }) => {
  const [r, setR] = useState<api.Resumen | null | undefined>(undefined);
  const [mig, setMig] = useState<api.EstadoMigracion[]>([]);
  const [aviso, setAviso] = useAviso();
  const cargar = useCallback(() => api.resumen().then(setR).catch(e => setAviso((e as Error).message)), [setAviso]);
  useEffect(() => { cargar(); api.estadoMigraciones().then(setMig); const id = setInterval(cargar, 15000); return () => clearInterval(id); }, [cargar]);
  useEffect(() => api.enVivo(cargar), [cargar]);
  const faltan = mig.filter(m => m.corrida === false);
  const hora1 = r ? Object.entries(r.ultima_hora).filter(([t]) => t !== 'timbre').sort((a, b) => b[1] - a[1]) : [];
  return (
    <section>
      <header className="cabecera"><div><h1>Resumen</h1><p className="ayuda">El evento en vivo. Se actualiza solo.</p></div></header>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      {faltan.length > 0 && (
        <div className="tarjeta alerta" role="alert">
          <p className="etq">Faltan migraciones en Supabase</p>
          <p className="ayuda">Sin ellas, partes del evento fallan (por ejemplo, «La base todavía no tiene esta función» al escanear el QR de una tablet). Supabase → SQL Editor → New query → pegar el archivo → Run, en este orden:</p>
          <ul className="lista">{faltan.map(m => <li key={m.archivo}><code>shared/supabase/migraciones/{m.archivo}</code> · {m.que}</li>)}</ul>
        </div>
      )}
      {r === null ? <p className="ayuda">Los números necesitan la migración 010.</p> : r && (
        <div className="numeros">
          <Numero n={r.credenciales} t="credenciales" onClick={() => ir('personas')} />
          <Numero n={r.completas} t="con los 4 timbres" />
          <Numero n={r.canjes} t={`premios entregados${r.stock != null ? ` · quedan ${r.stock}` : ''}`} onClick={() => ir('canje')} />
          <Numero n={r.mesas_activas} t="tablets jugando (15 min)" onClick={() => ir('mesas')} />
          <Numero n={r.avisos_suscritos} t="celulares con avisos" onClick={() => ir('avisos')} />
        </div>
      )}
      {r && (
        <div className="dos">
          <div className="tarjeta">
            <p className="etq">Timbres entregados</p>
            <table className="tabla"><tbody>
              {ESTACIONES.map(e => <tr key={e.n}><td>{e.n} · {e.nombre}</td><td className="mono">{r.por_sello[String(e.n)] ?? 0}</td></tr>)}
            </tbody></table>
          </div>
          <div className="tarjeta">
            <p className="etq">Última hora en el HUB</p>
            {hora1.length ? <table className="tabla"><tbody>{hora1.map(([t, n]) => <tr key={t}><td>{TIPOS[t] ?? t}</td><td className="mono">{n}</td></tr>)}</tbody></table>
              : <p className="ayuda">Nada nuevo en la última hora.</p>}
            <button type="button" className="btn" onClick={() => ir('hub')}><Icono n="wallpaper" />Ver la pantalla HUB</button>
          </div>
        </div>
      )}
      <h2>Estado de la base</h2>
      <table className="tabla">
        <thead><tr><th>Migración</th><th>Para qué</th><th>Estado</th></tr></thead>
        <tbody>{mig.map(m => (
          <tr key={m.archivo}><td className="mono">{m.archivo}</td><td>{m.que}</td>
            <td>{m.corrida === null ? <span className="mono">sin red</span> : m.corrida ? <span className="pill ok">Corrida</span> : <span className="pill falta">Falta</span>}</td></tr>
        ))}</tbody>
      </table>
    </section>
  );
};
const Numero: React.FC<{ n: number; t: string; onClick?: () => void }> = ({ n, t, onClick }) => onClick
  ? <button type="button" className="numero" onClick={onClick}><b className="mono">{n}</b><span>{t}</span></button>
  : <div className="numero"><b className="mono">{n}</b><span>{t}</span></div>;

// ---------- pantalla HUB (plan 017) ----------
const FILTROS: { id: string; nombre: string; tipos: string[] }[] = [
  { id: 'todo', nombre: 'Todo', tipos: ['credencial', 'graffiti', 'foto', 'mosaico', 'grabado', 'juego', 'vagon'] },
  { id: 'credencial', nombre: 'Personas', tipos: ['credencial'] },
  { id: 'dibujos', nombre: 'Dibujos y fotos', tipos: ['graffiti', 'foto', 'mosaico', 'grabado', 'juego', 'vagon'] },
];
const PantallaHub: React.FC = () => {
  const [filtro, setFiltro] = useState(FILTROS[0]);
  const [lista, setLista] = useState<api.EventoHub[]>([]);
  const [aviso, setAviso] = useAviso();
  const cargar = useCallback(() => api.eventosHub(filtro.tipos).then(setLista).catch(e => setAviso((e as Error).message)), [filtro, setAviso]);
  useEffect(() => { cargar(); const id = setInterval(cargar, 10000); return () => clearInterval(id); }, [cargar]);
  const quitar = async (e: api.EventoHub) => {
    if (!confirm(`¿Quitar del HUB este ${(TIPOS[e.tipo] ?? e.tipo).toLowerCase()}${e.codigo ? ` (${e.codigo})` : ''}? No se puede deshacer.`)) return;
    try { await api.ocultarEvento(e.id); setLista(l => l.filter(x => x.id !== e.id)); setAviso('Quitado. El HUB se recarga en menos de 30 s.'); }
    catch (err) { setAviso((err as Error).message); }
  };
  const recargar = async () => { try { await api.recargarHub(); setAviso('Listo: el HUB se recarga en menos de 30 s.'); } catch (err) { setAviso((err as Error).message); } };
  return (
    <section>
      <header className="cabecera">
        <div><h1>Pantalla HUB</h1><p className="ayuda">Lo último que llegó al HUB. Si algo no debe verse, quítalo: desaparece de la pantalla al recargarse (sola, en menos de 30 s).</p></div>
        <div className="acciones">
          <div className="seg" role="radiogroup" aria-label="Qué mostrar">
            {FILTROS.map(f => <button key={f.id} type="button" aria-pressed={filtro.id === f.id} onClick={() => setFiltro(f)}>{f.nombre}</button>)}
          </div>
          <button type="button" className="btn" onClick={recargar}><Icono n="refresh" />Recargar el HUB</button>
        </div>
      </header>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      <div className="fichas">
        {lista.map(e => <TarjetaEvento key={e.id} e={e} alQuitar={() => quitar(e)} />)}
        {!lista.length && <p className="vacio">Todavía no llega nada al HUB.</p>}
      </div>
    </section>
  );
};
const TarjetaEvento: React.FC<{ e: api.EventoHub; alQuitar?: () => void }> = ({ e, alQuitar }) => {
  const png = typeof e.datos.png === 'string' ? e.datos.png : typeof e.datos.foto === 'string' ? e.datos.foto : null;
  return (
    <div className="tarjeta evento">
      <p className="etq">{TIPOS[e.tipo] ?? e.tipo} · {hora(e.creado)}</p>
      {png ? <img src={png} alt="" /> : <p className="grande">{typeof e.datos.nombre === 'string' ? e.datos.nombre : '—'}</p>}
      {e.tipo === 'credencial' && png && typeof e.datos.nombre === 'string' && <p><b>{e.datos.nombre}</b></p>}
      <p className="mono ayuda">{e.codigo ?? 'sin credencial'}</p>
      {alQuitar && <button type="button" className="btn chico" onClick={alQuitar}><Icono n="visibility_off" />Quitar del HUB</button>}
    </div>
  );
};

// ---------- ficha de una persona (plan 017) ----------
const FichaPersona: React.FC<{ p: api.Persona; alCerrar: () => void }> = ({ p, alCerrar }) => {
  const [pasos, setPasos] = useState<api.Paso[] | null>(null);
  const [eventos, setEventos] = useState<api.EventoHub[]>([]);
  const [aviso, setAviso] = useAviso();
  const cargar = useCallback(() => Promise.all([api.pasosDe(p.id), api.eventosDe(p.codigo)]).then(([a, b]) => { setPasos(a); setEventos(b); }).catch(e => setAviso((e as Error).message)), [p.id, p.codigo, setAviso]);
  useEffect(() => { cargar(); }, [cargar]);
  const quitar = async (e: api.EventoHub) => {
    if (!confirm('¿Quitar esto del HUB?')) return;
    try { await api.ocultarEvento(e.id); await cargar(); } catch (err) { setAviso((err as Error).message); }
  };
  const creaciones = (pasos ?? []).filter(x => x.sello === 2 && x.clave !== 'unico');
  const afiches = (pasos ?? []).filter(x => x.sello === 3 && x.clave !== 'unico');
  const visibles = eventos.filter(e => e.tipo !== 'timbre');
  return (
    <div className="tarjeta ficha-persona" role="region" aria-label={`Ficha de ${p.codigo}`}>
      <div className="cabecera">
        <div><p className="etq">{p.codigo} · {marcoListo(p.marco).visual} · desde las {hora(p.creada)}</p><h2>{p.nombre}</h2></div>
        <button type="button" className="btn chico" onClick={alCerrar} aria-label="Cerrar la ficha"><Icono n="close" /></button>
      </div>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      <p>Timbres: {ESTACIONES.map(e => `${e.n} ${p.sellos.includes(e.n) ? '✓' : '·'}`).join('   ')} {p.canjeado && <span className="pill ok">Canjeado</span>}</p>
      <div className="dos">
        <div><p className="etq">Experiencias (timbre 2) · {creaciones.length}/{META_CREACION}</p>
          {pasos === null ? <p className="ayuda">Cargando…</p> : creaciones.length ? <ul className="lista">{creaciones.map(x => <li key={x.clave}>{EXPERIENCIAS[x.clave] ?? x.clave} <span className="mono ayuda">{hora(x.creado)}</span></li>)}</ul> : <p className="ayuda">Ninguna todavía.</p>}
        </div>
        <div><p className="etq">Afiches (timbre 3) · {afiches.length}/3</p>
          {pasos === null ? <p className="ayuda">Cargando…</p> : afiches.length ? <ul className="lista">{afiches.map(x => <li key={x.clave}>{x.clave} <span className="mono ayuda">{hora(x.creado)}</span></li>)}</ul> : <p className="ayuda">Ninguno todavía.</p>}
        </div>
      </div>
      <p className="etq">En el HUB · {visibles.length}</p>
      <div className="fichas">
        {visibles.map(e => <TarjetaEvento key={e.id} e={e} alQuitar={() => quitar(e)} />)}
        {!visibles.length && <p className="ayuda">No ha publicado nada en el HUB.</p>}
      </div>
    </div>
  );
};

// ---------- exportar ----------
function descargarCsv(lista: api.Persona[]) {
  const celda = (v: unknown) => { const t = String(v ?? ''); return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const filas = [['codigo', 'nombre', 'lenguaje', ...ESTACIONES.map(e => `timbre_${e.n}`), 'experiencias', 'afiches', 'canjeado', 'avisos', 'creada']];
  for (const p of lista) filas.push([p.codigo, p.nombre, marcoListo(p.marco).visual, ...ESTACIONES.map(e => (p.sellos.includes(e.n) ? 'si' : '')),
    String(p.creaciones ?? ''), String(p.portales), p.canjeado ? 'si' : '', p.avisos ? 'si' : '', p.creada]);
  const csv = '\ufeff' + filas.map(f => f.map(celda).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `somos-diseno-personas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- empezar de cero (plan 017) ----------
const EmpezarDeCero: React.FC = () => {
  const [frase, setFrase] = useState('');
  const [aviso, setAviso] = useAviso();
  const [ocupado, setOcupado] = useState(false);
  const borrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Última confirmación: se borran TODAS las credenciales, timbres, canjes, lo que muestra el HUB, las sesiones de mesa y los avisos. ¿Seguir?')) return;
    setOcupado(true);
    try { const r = await api.empezarDeCero(frase); setFrase(''); setAviso(`Listo: se borraron ${r.credenciales} credenciales y ${r.eventos} cosas del HUB. Las tablets y el HUB se reinician solos.`); }
    catch (err) { setAviso((err as Error).message); }
    setOcupado(false);
  };
  return (
    <form className="tarjeta peligro" onSubmit={borrar}>
      <p className="etq">Empezar de cero</p>
      <p className="ayuda">Para dejar todo limpio después de la prueba general. Borra credenciales, timbres, canjes, lo que muestra el HUB, las sesiones de mesa y los avisos. <b>Se mantiene:</b> el staff, el PIN, el modo juego, el premio y su stock, los sellos y los afiches.</p>
      <label>Escribe BORRAR TODO<input value={frase} onChange={e => setFrase(e.target.value)} autoComplete="off" /></label>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      <button className="btn peligro" disabled={ocupado || frase !== 'BORRAR TODO'}><Icono n="delete" />Borrar todo</button>
    </form>
  );
};
