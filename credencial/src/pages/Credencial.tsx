import React, { useCallback, useEffect, useState } from 'react';
import { Carta, useRecursos } from '../components/Pixel';
import { Timbrado } from '../components/Timbrado';
import { obtener, sellar, remoto, guardarMiCredencial, olvidarMiCredencial, miCredencial, fotoDe } from '../lib/store';
import { guardarArchivo } from '../lib/descargar';
import { cartaEnLienzo, aBlob, ranuraTimbre, CARTA, SELLOS, type Cara, type DatosCarta } from '../pixel/render';
import { TIMBRES, type Tema } from '../temas';
import type { Ir, PonerTema } from '../App';

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
  const foto = fotoDe(codigo);
  const recursos = useRecursos((datos || VACIA).receta, foto, tema);

  const cargar = useCallback(() => obtener(codigo).then(d => { setDatos(d); ponerTema(d.marco); }).catch(e => setError((e as Error).message)), [codigo, ponerTema]);
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
    if (volteando) return;
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

  const completos = datos.sellos.length;
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
    const n = Array.from({ length: SELLOS }, (_, i) => i + 1).find(i => !datos.sellos.includes(i));
    if (!n) return;
    await sellar(datos.codigo, n, 'demo');
    await cargar();
    setRecien(n);
  };

  return (
    <main className="pantalla credencial">
      <button type="button" className="giro" onClick={girar}
        aria-label={`Girar credencial. Ahora: ${lado === 'frente' ? 'credencial' : 'álbum de timbres'}`}>
        <span className={'carta-caja' + (volteando ? ' volteando' : '')}>
          <Carta datos={datos} recursos={recursos} tema={tema} cara={lado} ocultarTimbre={poniendo} className="carta" />
          {poniendo > 0 && (() => {
            const r = ranuraTimbre(poniendo);
            return (
              <span className="timbre-cae" aria-hidden="true" style={{
                left: `${((r.x + r.lado / 2) / CARTA.ancho) * 100}%`, top: `${((r.y + r.lado / 2) / CARTA.alto) * 100}%`,
                width: `${((r.lado + 4) / CARTA.ancho) * 100}%`,
              }}>
                <span className="tinta" />
                <img src={TIMBRES[tema.visual][poniendo - 1].src} alt="" />
              </span>
            );
          })()}
        </span>
      </button>
      <p className="progreso" role="status">
        {estado || (completos === SELLOS ? '¡Credencial completa!' : `${completos} de ${SELLOS} timbres · toca para ${lado === 'frente' ? 'ver el álbum' : 'volver'}`)}
      </p>
      <div className="acciones-movil">
        <button type="button" className="btn primario" onClick={() => ir('#/escanear')}>
          <span className="material-symbols-outlined" aria-hidden="true">highlight_alt</span>Timbrar
        </button>
        <button type="button" className="btn" onClick={descargar}>
          <span className="material-symbols-outlined" aria-hidden="true">download</span>Guardar
        </button>
        {datos.receta.retrato === 'foto' && (
          <button type="button" className="btn" onClick={() => ir('#/foto')}>
            <span className="material-symbols-outlined" aria-hidden="true">photo_camera</span>Foto
          </button>
        )}
        {!remoto && completos < SELLOS && (
          <button type="button" className="btn" onClick={simular}>Simular</button>
        )}
      </div>
      {recien && <Timbrado n={recien} total={completos} tema={tema} onCerrar={cerrarTimbrado} />}
    </main>
  );
};
