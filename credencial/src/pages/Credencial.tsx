import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Carta, useRecursos } from '../components/Pixel';
import { Timbrado } from '../components/Timbrado';
import { obtener, sellar, remoto, progresoJuego, guardarMiCredencial, olvidarMiCredencial, miCredencial, fotoDe, emparejarMesa, tomarMesaPendiente } from '../lib/store';
import { nombreExperiencia } from './Mesa';
import { guardarArchivo } from '../lib/descargar';
import { cartaEnLienzo, aBlob, ranuraTimbre, CARTA, type Cara, type DatosCarta } from '../pixel/render';
import { TIMBRES, type Tema } from '../temas';
import type { Ir, PonerTema } from '../App';
import { ACTIVAS, completa as estaCompleta } from '../../../shared/juego';
import { activarAvisos, enIphoneSinInstalar, estadoAvisos, type EstadoAvisos } from '../lib/push';
import { HACIA_JUEGO, tomarEntrada, useDeslizar } from '../lib/deslizar';
import { Bienvenida, bienvenidaVista } from '../components/Bienvenida';
import { BarraTimbres } from '../components/BarraTimbres';
import { DeslizarJugar } from '../components/DeslizarJugar';

const quieto = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const VACIA: DatosCarta = { nombre: '', codigo: '', receta: { retrato: 'personaje', id: 'pixel' }, marco: 'PM05', sellos: [] };

export const Credencial: React.FC<{ codigo: string; aviso?: string; cara?: Cara; timbre?: number; ir: Ir; ponerTema: PonerTema; tema: Tema }> = ({ codigo, aviso, cara, timbre, ir, ponerTema, tema }) => {
  const [datos, setDatos] = useState<DatosCarta | null>(null);
  const [error, setError] = useState('');
  const [lado, setLado] = useState<Cara>(cara || 'frente');
  const [estado, setEstado] = useState(aviso || '');
  const [recien, setRecien] = useState<number | null>(timbre || null);
  const [poniendo, setPoniendo] = useState(0); // timbre que está cayendo sobre la credencial
  const [volteando, setVolteando] = useState(false);
  // «Tu recorrido»: una vez por credencial, después del timbre de Inscripción (y de que el timbre se asiente).
  const [bienvenida, setBienvenida] = useState(() => !bienvenidaVista(codigo) && (!miCredencial() || miCredencial() === codigo));
  // Deslizar lleva a la vista Juego (plan 010); el toque sigue girando la credencial.
  const [entra] = useState(tomarEntrada);
  const { recien: recienDeslizo } = useDeslizar(dir => { if (dir === HACIA_JUEGO) ir('#/juego'); });
  const foto = fotoDe(codigo);
  const recursos = useRecursos((datos || VACIA).receta, foto, tema);
  // Avisos del evento en el celular (solo con Supabase y clave VAPID).
  const [avisos, setAvisos] = useState<EstadoAvisos>('no-disponible');
  useEffect(() => { estadoAvisos().then(setAvisos); }, []);
  const pedirAvisos = async () => {
    if (enIphoneSinInstalar()) { setEstado('En iPhone: comparte → «Agregar a inicio» y abre la app desde ahí para recibir avisos.'); return; }
    try { const e = await activarAvisos(codigo); setAvisos(e); setEstado(e === 'activos' ? 'Listo: te avisaremos lo que pase en el evento.' : e === 'bloqueados' ? 'Los avisos están bloqueados en el navegador.' : ''); }
    catch (e) { setEstado((e as Error).message); }
  };

  // Si llegó desde el QR de una mesa sin credencial (plan 014), al crearla queda jugando en esa mesa.
  useEffect(() => {
    const m = tomarMesaPendiente();
    if (!m) return;
    emparejarMesa(codigo, m.mesa, m.nonce, m.app)
      .then(() => setEstado(`¡Listo! Ya juegas en ${nombreExperiencia(m.app)} con tu credencial.`))
      .catch(e => setEstado((e as Error).message));
  }, [codigo]);

  const cargar = useCallback(() => obtener(codigo).then(d => { setDatos(d); ponerTema(d.marco); }).catch(e => setError((e as Error).message)), [codigo, ponerTema]);
  // El álbum muestra el avance de los timbres que faltan (Creación y Cacería), para no tener que buscarlo en «Jugar».
  // Se pide al abrir y al girar hacia el álbum, no en cada refresco (con Supabase son 3 consultas).
  const [avance, setAvance] = useState<DatosCarta['avance']>();
  const cargarAvance = useCallback(() => progresoJuego(codigo).then(p => {
    const hechas = Math.max(p.creacion.pasos, Object.keys(p.creaciones).length);
    setAvance({ 2: `${Math.min(hechas, p.creacion.meta)} de ${p.creacion.meta} hechas`, 3: `${Math.min(p.afiches.length, p.meta)} de ${p.meta} encontrados` });
  }).catch(() => { /* sin avance: el álbum dice cómo se gana cada timbre */ }), [codigo]);
  useEffect(() => { cargarAvance(); }, [cargarAvance]);
  useEffect(() => { if (lado === 'album') cargarAvance(); }, [lado, cargarAvance]);
  const datosCarta = useMemo(() => (datos && avance ? { ...datos, avance } : datos), [datos, avance]);
  useEffect(() => { cargar(); if (!miCredencial()) guardarMiCredencial(codigo); }, [cargar, codigo]);
  // Con Supabase, la credencial se refresca sola para mostrar timbres nuevos.
  useEffect(() => { if (!remoto) return; const id = setInterval(cargar, 8000); return () => clearInterval(id); }, [cargar]);
  useEffect(() => { if (!estado) return; const t = setTimeout(() => setEstado(''), 4000); return () => clearTimeout(t); }, [estado]);
  // Después del aviso, el timbre se pone sobre la credencial misma.
  const cerrarTimbrado = useCallback(() => {
    if (recien && !quieto()) { setLado('frente'); setPoniendo(recien); setTimeout(() => setPoniendo(0), 1100); }
    setRecien(null);
  }, [recien]);
  // Girar con una media vuelta: a los 90° cambia la cara.
  const girar = () => {
    if (volteando || recienDeslizo.current) return;
    if (quieto()) { setLado(l => (l === 'frente' ? 'album' : 'frente')); return; }
    setVolteando(true);
    setTimeout(() => setLado(l => (l === 'frente' ? 'album' : 'frente')), 220);
    setTimeout(() => setVolteando(false), 460);
  };

  if (error) {
    return (
      <main className="pantalla centrada">
        <h2>No encontramos esa credencial</h2>
        <p>{error}</p>
        <button className="btn primario" onClick={() => { olvidarMiCredencial(); ir('#/crear'); }}>Crear mi credencial</button>
      </main>
    );
  }
  if (!datos) return <main className="pantalla centrada"><p>Buscando tu credencial…</p></main>;

  const completos = datos.sellos.filter(n => ACTIVAS.includes(n)).length, llena = estaCompleta(datos.sellos);
  const descargar = async () => {
    try {
      const blob = await aBlob(cartaEnLienzo(datos, recursos, tema, lado));
      await guardarArchivo(blob, `credencial-${datos.codigo.toLowerCase()}-${lado}.png`);
    } catch (e) {
      if ((e as { code?: string }).code !== 'declined') setEstado('No se pudo guardar la imagen.');
    }
  };
  // Modo demo: permite probar el recorrido sin los QR impresos.
  const simular = async () => {
    const n = ACTIVAS.find(i => !datos.sellos.includes(i));
    if (!n) return;
    await sellar(datos.codigo, n, 'demo');
    await cargar();
    setRecien(n);
  };

  return (
    <main className={'pantalla credencial' + (entra ? ` entra-${entra}` : '')}>
      <BarraTimbres sellos={datos.sellos} tema={tema} gana={poniendo || null} />
      <button type="button" className="giro" onClick={girar}
        aria-label={`Girar credencial. Ahora: ${lado === 'frente' ? 'credencial' : 'álbum de timbres'}`}>
        <span className={'carta-caja' + (volteando ? ' volteando' : '')}>
          <Carta datos={datosCarta || datos} recursos={recursos} tema={tema} cara={lado} ocultarTimbre={poniendo} className="carta" />
          {poniendo > 0 && (() => {
            const r = ranuraTimbre(poniendo);
            return (
              <span className="timbre-cae" aria-hidden="true" style={{
                left: `${((r.x + r.lado / 2) / CARTA.ancho) * 100}%`, top: `${((r.y + r.lado / 2) / CARTA.alto) * 100}%`,
                width: `${((r.lado * 1.5) / CARTA.ancho) * 100}%`,
              }}>
                <span className="tinta" />
                <img src={TIMBRES[tema.visual][poniendo - 1].src} alt="" />
              </span>
            );
          })()}
        </span>
      </button>
      {avisos === 'pedir' && (
        <button type="button" className="avisos" onClick={pedirAvisos}>
          <span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span>Recibir avisos del evento
        </button>
      )}
      <p className="progreso" role="status">
        {estado || (datos.canjeado ? 'Premio canjeado. ¡Gracias por jugar!' : llena ? '¡Credencial completa! Canjea tu premio con el equipo.' : (lado === 'frente' ? 'Toca la credencial para ver el álbum' : 'Tu álbum · tu inventario está al deslizar'))}
      </p>
      {/* B-017: en vez del botón «Jugar», deslizar a la derecha (también se puede tocar). */}
      <DeslizarJugar onJugar={() => ir('#/juego')} />
      <span className="pista-borde" aria-hidden="true"><span className="material-symbols-outlined">chevron_right</span></span>
      <div className="acciones-movil">
        {llena && (
          <button type="button" className="btn primario" onClick={() => ir('#/canje')}>
            <span className="material-symbols-outlined" aria-hidden="true">approval</span>{datos.canjeado ? 'Canjeado' : 'Canjear'}
          </button>
        )}
        <button type="button" className="btn" onClick={descargar}>
          <span className="material-symbols-outlined" aria-hidden="true">download</span>Guardar
        </button>
        {datos.receta.retrato === 'foto' && (
          <button type="button" className="btn" onClick={() => ir('#/foto')}>
            <span className="material-symbols-outlined" aria-hidden="true">photo_camera</span>Foto
          </button>
        )}
        {!remoto && !llena && (
          <button type="button" className="btn" onClick={simular}>Simular</button>
        )}
      </div>
      {recien && <Timbrado n={recien} total={completos} sellos={datos.sellos} tema={tema} onCerrar={cerrarTimbrado} />}
      {bienvenida && !recien && !poniendo && <Bienvenida codigo={codigo} tema={tema} onCerrar={() => setBienvenida(false)} />}
    </main>
  );
};
